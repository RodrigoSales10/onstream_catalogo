/**
 * Supabase Edge Function: sync-futebol-agenda
 *
 * Agenda e sincronização periódica de jogos do Futebol na TV:
 * - Consulta as páginas de ontem, hoje e amanhã (ou via query param ?dia=hoje|ontem|amanha|todos)
 * - Extrai times, ligas, canais de transmissão e horários (timestamptz America/Sao_Paulo)
 * - Executa upsert idempotente nas tabelas futebol_*
 * - Registra logs de execução em futebol_sync_logs
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const BASE_URL = "https://www.futebolnatv.com.br";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function normalizarNome(nome: string): string {
  if (!nome) return "";
  return nome
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function calcularDataBrasilia(diaParam: string): string {
  const agora = new Date();
  let offsetDays = 0;
  if (diaParam === "ontem") offsetDays = -1;
  else if (diaParam === "amanha") offsetDays = 1;

  if (offsetDays !== 0) {
    agora.setDate(agora.getDate() + offsetDays);
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

function buildTimestampBrasilia(dateStr: string, timeStr: string): string {
  const cleanTime = (timeStr || "00:00").replace(/h/i, "").trim();
  const [hh, mm] = cleanTime.split(":");
  const hPad = String(parseInt(hh || "0", 10)).padStart(2, "0");
  const mPad = String(parseInt(mm || "0", 10)).padStart(2, "0");
  return `${dateStr}T${hPad}:${mPad}:00-03:00`;
}

serve(async (req) => {
  const startTime = Date.now();
  const url = new URL(req.url);

  // Parâmetros opcionais: ?dia=hoje|ontem|amanha|todos&limit=10
  const diaParam = url.searchParams.get("dia") || "todos";
  const limitParam = parseInt(url.searchParams.get("limit") || "0", 10);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const diasAlvo = diaParam === "todos" ? ["ontem", "hoje", "amanha"] : [diaParam];
  let totalJogosProcessados = 0;
  const logsDetalhes: Record<string, unknown> = {};

  try {
    for (const dia of diasAlvo) {
      const dataJogoStr = calcularDataBrasilia(dia);
      let targetUrl = BASE_URL;
      if (dia === "ontem") targetUrl = `${BASE_URL}/jogos-ontem`;
      else if (dia === "amanha") targetUrl = `${BASE_URL}/jogos-amanha`;

      const pageRes = await fetch(targetUrl, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (!pageRes.ok) {
        console.warn(`HTTP ${pageRes.status} ao acessar ${targetUrl}`);
        continue;
      }

      const html = await pageRes.text();
      const matches = [];

      // Padrão 1: Novo layout Futebol na TV (articles com class="match")
      const matchRegex = /<article\s+class="match"([^>]*)>([\s\S]*?)<\/article>/gi;
      let match;

      while ((match = matchRegex.exec(html)) !== null) {
        const attrsStr = match[1];
        const body = match[2];

        const attrs: Record<string, string> = {};
        const attrRegex = /data-([a-z0-9_-]+)="([^"]*)"/gi;
        let aMatch;
        while ((aMatch = attrRegex.exec(attrsStr)) !== null) {
          attrs[aMatch[1]] = aMatch[2];
        }

        const linkMatch =
          /<a\s+href="([^"]+)"[^>]*aria-label="([^"]*)"/i.exec(body) ||
          /<a\s+href="(\/aovivo\/([^"]+)\.html)"/i.exec(body);
        const relUrl = linkMatch ? linkMatch[1] : "";
        const ariaLabel = linkMatch && linkMatch[2] ? linkMatch[2].trim() : "";

        let fonteId = "";
        if (relUrl) {
          const slugMatch = /\/aovivo\/([^/]+)\.html/i.exec(relUrl);
          if (slugMatch) fonteId = slugMatch[1];
        }
        if (!fonteId && attrs.slot) {
          fonteId = attrs.slot;
        }
        if (!fonteId && attrs.h) {
          fonteId = `jogo-${attrs.h}`;
        }

        const urlOrigem = relUrl ? `${BASE_URL}${relUrl}` : BASE_URL;

        const leagueMatch = /<div class="m-head">[\s\S]*?<p><b>([\s\S]*?)<\/b>([\s\S]*?)<\/p>/i.exec(body);
        const ligaNome = leagueMatch ? leagueMatch[1].replace(/<[^>]+>/g, "").trim() : "Futebol Geral";
        const faseOuRodada = leagueMatch ? leagueMatch[2].replace(/<[^>]+>/g, "").replace(/^[\s-]+/, "").trim() : "";

        const teams: Array<{ nome: string; escudoUrl: string; placar: number | null }> = [];
        const teamBlockRegex = /<div class="m-team\b[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="m-team\b|<\/div>)/gi;
        let tMatch;
        while ((tMatch = teamBlockRegex.exec(body)) !== null) {
          const tb = tMatch[1];
          const imgM = /<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"/i.exec(tb);
          const nameM = /<span class="m-name">([\s\S]*?)<\/span>/i.exec(tb);
          const scoreM = /<span class="m-score">(\d+)<\/span>/i.exec(tb);

          const tNome = nameM ? nameM[1].replace(/<[^>]+>/g, "").trim() : (imgM && imgM[2] ? imgM[2].trim() : "");
          const tImg = imgM ? imgM[1].trim() : "";
          const tPlacar = scoreM ? parseInt(scoreM[1], 10) : null;

          teams.push({
            nome: tNome,
            escudoUrl: tImg,
            placar: tPlacar,
          });
        }

        let timeCasaNome = teams[0]?.nome || "";
        let timeCasaEscudo = teams[0]?.escudoUrl || "";
        let placarCasa = teams[0]?.placar ?? null;

        let timeForaNome = teams[1]?.nome || "";
        let timeForaEscudo = teams[1]?.escudoUrl || "";
        let placarFora = teams[1]?.placar ?? null;

        if ((!timeCasaNome || !timeForaNome) && ariaLabel) {
          const separator = ariaLabel.includes(" x ") ? " x " : (ariaLabel.includes(" X ") ? " X " : null);
          if (separator) {
            const parts = ariaLabel.split(separator);
            if (!timeCasaNome) timeCasaNome = parts[0].trim();
            if (!timeForaNome) timeForaNome = parts.slice(1).join(separator).trim();
          }
        }

        const timeMatch = /<div class="m-time">([\s\S]*?)<\/div>/i.exec(body);
        const rawTimeText = timeMatch ? timeMatch[1].replace(/<[^>]+>/g, " ").trim() : "";
        const hhmmMatch = /\b(\d{1,2}:\d{2})\b/.exec(rawTimeText);
        const horaJogo = hhmmMatch ? hhmmMatch[1] : "00:00";

        let dataHoraIso: string;
        if (attrs.ts && !isNaN(parseInt(attrs.ts, 10))) {
          const dateFromTs = new Date(parseInt(attrs.ts, 10) * 1000);
          dataHoraIso = dateFromTs.toISOString();
        } else {
          dataHoraIso = buildTimestampBrasilia(dataJogoStr, horaJogo);
        }

        const statusRaw = (attrs.status || "").toLowerCase();
        let status = "agendado";
        if (statusRaw === "live" || statusRaw === "ao_vivo" || /'\b|AO VIVO|INTERVALO/i.test(rawTimeText)) {
          status = "ao_vivo";
        } else if (statusRaw === "final" || statusRaw === "finished" || /FIM|ENCERRADO/i.test(rawTimeText)) {
          status = "finalizado";
        }

        const canais: string[] = [];
        const channelsContainer = /<div class="m-channels\b[^"]*">([\s\S]*?)<\/div>/i.exec(body);
        if (channelsContainer) {
          const canalRegex = /<b>([\s\S]*?)<\/b>/gi;
          let cMatch;
          while ((cMatch = canalRegex.exec(channelsContainer[1])) !== null) {
            const cNome = cMatch[1].replace(/<[^>]+>/g, "").trim();
            if (cNome && !canais.includes(cNome)) canais.push(cNome);
          }
        }

        if (fonteId && (timeCasaNome || timeForaNome)) {
          matches.push({
            fonteId,
            urlOrigem,
            relUrl,
            timeCasaNome,
            timeCasaEscudo,
            timeForaNome,
            timeForaEscudo,
            ligaNome,
            faseOuRodada,
            horaJogo,
            dataJogo: dataJogoStr,
            dataHora: dataHoraIso,
            status,
            placarCasa,
            placarFora,
            descricao: faseOuRodada ? `${ligaNome} - ${faseOuRodada}` : null,
            canais,
          });
        }
      }

      // Padrão 2 (Legado)
      if (matches.length === 0) {
        const articleRegex = /<article\b[^>]*>([\s\S]*?)<\/article>/gi;
        let legacyMatch;
        while ((legacyMatch = articleRegex.exec(html)) !== null) {
          const cardHtml = legacyMatch[1];
          const linkMatch = /<a\s+href="(\/aovivo\/([^"]+)\.html)"/i.exec(cardHtml);
          if (!linkMatch) continue;

          const relUrl = linkMatch[1];
          const fonteId = linkMatch[2];
          const urlOrigem = `${BASE_URL}${relUrl}`;

          const titleMatch = /<h3[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i.exec(cardHtml);
          let rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
          rawTitle = rawTitle.replace(/^Onde assistir\s+/i, "").replace(/\s+ao vivo\??$/i, "").trim();

          let timeCasaNome = "";
          let timeForaNome = "";
          if (rawTitle.includes(" x ")) {
            const parts = rawTitle.split(" x ");
            timeCasaNome = parts[0].trim();
            timeForaNome = parts.slice(1).join(" x ").trim();
          }

          const ligaMatch = /<div class="mt-2[^>]*>[\s\S]*?<span class="font-medium[^>]*>([\s\S]*?)<\/span>/i.exec(cardHtml);
          const ligaNome = ligaMatch ? ligaMatch[1].replace(/<[^>]+>/g, "").trim() : "Futebol Geral";

          const horaMatch = /<span class="tabular-nums">⏱\s*(\d{1,2}:\d{2})h?<\/span>/i.exec(cardHtml);
          const horaJogo = horaMatch ? horaMatch[1].trim() : "00:00";

          const descMatch = /<p class="mt-3 text-sm[^>]*>([\s\S]*?)<\/p>/i.exec(cardHtml);
          const descricao = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : null;

          const canais: string[] = [];
          const canaisContainerMatch = /<div class="mt-3 flex flex-wrap gap-1.5">([\s\S]*?)<\/div>/i.exec(cardHtml);
          if (canaisContainerMatch) {
            const canalBadgeRegex = /<span[^>]*>([\s\S]*?)<\/span>/gi;
            let cMatch;
            while ((cMatch = canalBadgeRegex.exec(canaisContainerMatch[1])) !== null) {
              const cNome = cMatch[1].replace(/<[^>]+>/g, "").trim();
              if (cNome && !canais.includes(cNome)) canais.push(cNome);
            }
          }

          matches.push({
            fonteId,
            urlOrigem,
            relUrl,
            timeCasaNome,
            timeCasaEscudo: "",
            timeForaNome,
            timeForaEscudo: "",
            ligaNome,
            faseOuRodada: "",
            horaJogo,
            dataJogo: dataJogoStr,
            dataHora: buildTimestampBrasilia(dataJogoStr, horaJogo),
            status: "agendado",
            placarCasa: null,
            placarFora: null,
            descricao,
            canais,
          });
        }
      }

      const cardsToProcess = limitParam > 0 ? matches.slice(0, limitParam) : matches;

      for (const card of cardsToProcess) {
        // Detalhe da partida para obter IDs e URLs de escudos se não vieram do card
        let details: Record<string, any> | null = null;
        const precisaDetalhes =
          (!card.timeCasaEscudo || !card.timeForaEscudo || !card.timeCasaNome || !card.timeForaNome) &&
          card.relUrl;

        if (precisaDetalhes) {
          try {
            const detailRes = await fetch(`${BASE_URL}${card.relUrl}`, {
              headers: { "User-Agent": USER_AGENT },
            });
            if (detailRes.ok) {
              const detailHtml = await detailRes.text();
              const teamRegex = /<a\s+href="(\/time\/([^"]+))"[^>]*>([\s\S]*?)<\/a>/gi;
              const teamLinks = [];
              let tMatch;
              while ((tMatch = teamRegex.exec(detailHtml)) !== null) {
                const href = tMatch[1];
                const fullSlug = tMatch[2];
                const inner = tMatch[3];
                const lastHyphen = fullSlug.lastIndexOf("-");
                const slug = lastHyphen !== -1 ? fullSlug.slice(0, lastHyphen) : fullSlug;
                const fonteId = lastHyphen !== -1 ? fullSlug.slice(lastHyphen + 1) : fullSlug;
                const imgMatch = /<img[^>]+src="([^">]+(?:upload\/teams|upload|teams)[^">]+)"/i.exec(inner);
                const escudoUrl = imgMatch ? imgMatch[1] : "";
                const nameMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(inner);
                const nome = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, "").trim() : slug;
                teamLinks.push({ href, slug, fonteId, escudoUrl, nome });
              }

              const allTeamImgs = Array.from(detailHtml.matchAll(/<img[^>]+src="([^">]+upload\/teams\/[^">]+)"/gi)).map((m) => m[1]);
              if (teamLinks.length >= 2) {
                if (!teamLinks[0].escudoUrl && allTeamImgs[0]) teamLinks[0].escudoUrl = allTeamImgs[0];
                if (!teamLinks[1].escudoUrl && allTeamImgs[1]) teamLinks[1].escudoUrl = allTeamImgs[1];
              }

              const ligaRegex = /<a\s+href="(\/liga\/([^"]+))"[^>]*>([\s\S]*?)<\/a>/i.exec(detailHtml);
              const fullLigaSlug = ligaRegex ? ligaRegex[2] : "";
              const lastLigaHyphen = fullLigaSlug.lastIndexOf("-");
              const ligaSlug = lastLigaHyphen !== -1 ? fullLigaSlug.slice(0, lastLigaHyphen) : fullLigaSlug;
              const ligaFonteId = lastLigaHyphen !== -1 ? fullLigaSlug.slice(lastLigaHyphen + 1) : fullLigaSlug;

              let status = "agendado";
              const statusBadgeMatch = /id="status-badge"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i.exec(detailHtml);
              const statusBadgeContent = statusBadgeMatch ? statusBadgeMatch[0] : "";

              if (/FIM DE JOGO|ENCERRADO/i.test(statusBadgeContent)) {
                status = "finalizado";
              } else if (/bullet|animate-pulse|\b\d+'\b|INTERVALO|EM ANDAMENTO/i.test(statusBadgeContent)) {
                status = "ao_vivo";
              } else {
                status = "agendado";
              }

              details = {
                teamLinks,
                ligaSlug,
                ligaFonteId,
                status,
              };
            }
          } catch {
            // fallback para dados do card
          }
        }

        // Upsert Time Casa
        const casaNome = card.timeCasaNome || details?.teamLinks?.[0]?.nome;
        const casaNorm = normalizarNome(casaNome);
        const { data: tc } = await supabase
          .from("futebol_times")
          .upsert(
            {
              nome: casaNome,
              nome_normalizado: casaNorm,
              slug: details?.teamLinks?.[0]?.slug || null,
              fonte_id: details?.teamLinks?.[0]?.fonteId || null,
              url_origem: details?.teamLinks?.[0]?.href ? `${BASE_URL}${details.teamLinks[0].href}` : (card.relUrl ? `${BASE_URL}${card.relUrl}` : null),
              escudo_url_origem: card.timeCasaEscudo || details?.teamLinks?.[0]?.escudoUrl || null,
            },
            { onConflict: "nome_normalizado" }
          )
          .select("id")
          .single();

        // Upsert Time Fora
        const foraNome = card.timeForaNome || details?.teamLinks?.[1]?.nome;
        const foraNorm = normalizarNome(foraNome);
        const { data: tf } = await supabase
          .from("futebol_times")
          .upsert(
            {
              nome: foraNome,
              nome_normalizado: foraNorm,
              slug: details?.teamLinks?.[1]?.slug || null,
              fonte_id: details?.teamLinks?.[1]?.fonteId || null,
              url_origem: details?.teamLinks?.[1]?.href ? `${BASE_URL}${details.teamLinks[1].href}` : (card.relUrl ? `${BASE_URL}${card.relUrl}` : null),
              escudo_url_origem: card.timeForaEscudo || details?.teamLinks?.[1]?.escudoUrl || null,
            },
            { onConflict: "nome_normalizado" }
          )
          .select("id")
          .single();

        // Upsert Liga
        const ligaNorm = normalizarNome(card.ligaNome);
        const { data: tl } = await supabase
          .from("futebol_ligas")
          .upsert(
            {
              nome: card.ligaNome,
              nome_normalizado: ligaNorm,
              slug: details?.ligaSlug || null,
              fonte_id: details?.ligaFonteId || null,
            },
            { onConflict: "nome_normalizado" }
          )
          .select("id")
          .single();

        if (!tc?.id || !tf?.id) continue;

        // Upsert Jogo
        const statusFinal = card.status || details?.status || "agendado";
        const { data: tjogo } = await supabase
          .from("futebol_jogos")
          .upsert(
            {
              fonte_id: card.fonteId,
              url_origem: card.urlOrigem,
              time_casa_id: tc.id,
              time_fora_id: tf.id,
              liga_id: tl?.id || null,
              data_hora: card.dataHora,
              data_jogo: card.dataJogo,
              hora_jogo: card.horaJogo,
              status: statusFinal,
              placar_casa: card.placarCasa ?? null,
              placar_fora: card.placarFora ?? null,
              descricao: card.descricao,
              atualizado_em: new Date().toISOString(),
            },
            { onConflict: "fonte_id" }
          )
          .select("id")
          .single();

        if (tjogo?.id) {
          // Canais
          for (const canalNome of card.canais) {
            const cNorm = normalizarNome(canalNome);
            const { data: tcanal } = await supabase
              .from("futebol_canais")
              .upsert({ nome: canalNome, nome_normalizado: cNorm }, { onConflict: "nome_normalizado" })
              .select("id")
              .single();

            if (tcanal?.id) {
              await supabase
                .from("futebol_jogo_canais")
                .upsert({ jogo_id: tjogo.id, canal_id: tcanal.id }, { onConflict: "jogo_id,canal_id" });
            }
          }
          totalJogosProcessados++;
        }
      }
      logsDetalhes[dia] = cardsToProcess.length;
    }

    const durationMs = Date.now() - startTime;
    await supabase.from("futebol_sync_logs").insert({
      rotina: `edge_agenda_${diaParam}`,
      duracao_ms: durationMs,
      total_jogos: totalJogosProcessados,
      status: "sucesso",
      detalhes: logsDetalhes,
    });

    return new Response(
      JSON.stringify({
        success: true,
        totalJogos: totalJogosProcessados,
        durationMs,
        detalhes: logsDetalhes,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Erro na Edge Function sync-futebol-agenda:", errorMsg);

    await supabase.from("futebol_sync_logs").insert({
      rotina: `edge_agenda_${diaParam}`,
      status: "erro",
      mensagem_erro: errorMsg,
    });

    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
