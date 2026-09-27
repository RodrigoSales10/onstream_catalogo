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
  const offset = -3 * 60;
  const utc = agora.getTime() + agora.getTimezoneOffset() * 60000;
  const brasilia = new Date(utc + offset * 60000);

  if (diaParam === "ontem") brasilia.setDate(brasilia.getDate() - 1);
  else if (diaParam === "amanha") brasilia.setDate(brasilia.getDate() + 1);

  const y = brasilia.getFullYear();
  const m = String(brasilia.getMonth() + 1).padStart(2, "0");
  const d = String(brasilia.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
      const articleRegex = /<article\b[^>]*>([\s\S]*?)<\/article>/gi;
      let match;
      const matches = [];

      while ((match = articleRegex.exec(html)) !== null) {
        const cardHtml = match[1];

        const linkMatch = /<a\s+href="(\/aovivo\/[^"]+?-([a-z0-9]+)\.html)"/i.exec(cardHtml);
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
        } else if (rawTitle.includes(" X ")) {
          const parts = rawTitle.split(" X ");
          timeCasaNome = parts[0].trim();
          timeForaNome = parts.slice(1).join(" X ").trim();
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

        const dataHoraIso = buildTimestampBrasilia(dataJogoStr, horaJogo);

        matches.push({
          fonteId,
          urlOrigem,
          relUrl,
          timeCasaNome,
          timeForaNome,
          ligaNome,
          horaJogo,
          dataJogo: dataJogoStr,
          dataHora: dataHoraIso,
          descricao,
          canais,
        });
      }

      const cardsToProcess = limitParam > 0 ? matches.slice(0, limitParam) : matches;

      for (const card of cardsToProcess) {
        // Detalhe da partida para obter IDs e URLs de escudos
        let details = null;
        try {
          const detailRes = await fetch(`${BASE_URL}${card.relUrl}`, {
            headers: { "User-Agent": USER_AGENT },
          });
          if (detailRes.ok) {
            const detailHtml = await detailRes.text();
            const teamRegex = /<a\s+href="(\/time\/([a-z0-9\-]+)-([a-z0-9]+))"[^>]*>([\s\S]*?)<\/a>/gi;
            const teamLinks = [];
            let tMatch;
            while ((tMatch = teamRegex.exec(detailHtml)) !== null) {
              const href = tMatch[1];
              const slug = tMatch[2];
              const fonteId = tMatch[3];
              const inner = tMatch[4];
              const imgMatch = /<img[^>]+src="([^">]+upload\/teams\/[^">]+)"/i.exec(inner);
              const escudoUrl = imgMatch ? imgMatch[1] : "";
              const nameMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(inner);
              const nome = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, "").trim() : slug;
              teamLinks.push({ href, slug, fonteId, escudoUrl, nome });
            }

            const ligaRegex = /<a\s+href="(\/liga\/([a-z0-9\-]+)-([a-z0-9]+))"[^>]*>([\s\S]*?)<\/a>/i.exec(detailHtml);

            let status = "agendado";
            if (/FIM DE JOGO/i.test(detailHtml)) status = "finalizado";
            else if (/AO VIVO|INTERVALO|EM ANDAMENTO/i.test(detailHtml)) status = "ao_vivo";

            const placar1Match = /<span id="placar-time1"[^>]*>\s*(\d+)\s*<\/span>/i.exec(detailHtml);
            const placar2Match = /<span id="placar-time2"[^>]*>\s*(\d+)\s*<\/span>/i.exec(detailHtml);

            details = {
              teamLinks,
              ligaSlug: ligaRegex ? ligaRegex[2] : null,
              ligaFonteId: ligaRegex ? ligaRegex[3] : null,
              status,
              placarCasa: placar1Match ? parseInt(placar1Match[1], 10) : null,
              placarFora: placar2Match ? parseInt(placar2Match[1], 10) : null,
            };
          }
        } catch {
          // fallback para dados do card
        }

        // Upsert Time Casa
        const casaNome = details?.teamLinks?.[0]?.nome || card.timeCasaNome;
        const casaNorm = normalizarNome(casaNome);
        const { data: tc } = await supabase
          .from("futebol_times")
          .upsert(
            {
              nome: casaNome,
              nome_normalizado: casaNorm,
              slug: details?.teamLinks?.[0]?.slug || null,
              fonte_id: details?.teamLinks?.[0]?.fonteId || null,
              url_origem: details?.teamLinks?.[0]?.href ? `${BASE_URL}${details.teamLinks[0].href}` : null,
              escudo_url_origem: details?.teamLinks?.[0]?.escudoUrl || null,
            },
            { onConflict: details?.teamLinks?.[0]?.fonteId ? "fonte_id" : "nome_normalizado" }
          )
          .select("id")
          .single();

        // Upsert Time Fora
        const foraNome = details?.teamLinks?.[1]?.nome || card.timeForaNome;
        const foraNorm = normalizarNome(foraNome);
        const { data: tf } = await supabase
          .from("futebol_times")
          .upsert(
            {
              nome: foraNome,
              nome_normalizado: foraNorm,
              slug: details?.teamLinks?.[1]?.slug || null,
              fonte_id: details?.teamLinks?.[1]?.fonteId || null,
              url_origem: details?.teamLinks?.[1]?.href ? `${BASE_URL}${details.teamLinks[1].href}` : null,
              escudo_url_origem: details?.teamLinks?.[1]?.escudoUrl || null,
            },
            { onConflict: details?.teamLinks?.[1]?.fonteId ? "fonte_id" : "nome_normalizado" }
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
            { onConflict: details?.ligaFonteId ? "fonte_id" : "nome_normalizado" }
          )
          .select("id")
          .single();

        if (!tc?.id || !tf?.id) continue;

        // Upsert Jogo
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
              status: details?.status || "agendado",
              placar_casa: details?.placarCasa ?? null,
              placar_fora: details?.placarFora ?? null,
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
