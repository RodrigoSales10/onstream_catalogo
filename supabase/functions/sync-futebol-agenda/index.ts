/**
 * Supabase Edge Function: sync-futebol-agenda
 *
 * Agenda e sincronização periódica de jogos do Futebol na TV:
 * - Consulta as páginas de ontem, hoje e amanhã (ou via query param ?dia=hoje|ontem|amanha|todos)
 * - Extrai times, ligas, canais de transmissão e horários (timestamptz America/Sao_Paulo)
 * - Executa upsert seguro e resiliente nas tabelas futebol_*
 * - Registra logs de execução em futebol_sync_logs
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const BASE_URL = "https://www.futebolnatv.com.br";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

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

// Upsert seguro de Time (sem depender de constraint unique em nome_normalizado)
async function upsertTime(
  supabase: any,
  timeData: {
    nome: string;
    slug?: string | null;
    fonteId?: string | null;
    escudoUrl?: string | null;
    urlOrigem?: string | null;
  }
): Promise<number | null> {
  const nome = timeData.nome.trim();
  const nomeNorm = normalizarNome(nome);
  const fonteId = timeData.fonteId || null;

  let query = supabase.from("futebol_times").select("id, escudo_storage_path, status_imagem");
  if (fonteId) {
    query = query.eq("fonte_id", fonteId);
  } else {
    query = query.eq("nome_normalizado", nomeNorm);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    await supabase
      .from("futebol_times")
      .update({
        nome,
        slug: timeData.slug || undefined,
        url_origem: timeData.urlOrigem || undefined,
        escudo_url_origem: timeData.escudoUrl || undefined,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return existing.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("futebol_times")
      .insert({
        nome,
        nome_normalizado: nomeNorm,
        slug: timeData.slug || null,
        fonte_id: fonteId,
        url_origem: timeData.urlOrigem || null,
        escudo_url_origem: timeData.escudoUrl || null,
        status_imagem: "pendente",
      })
      .select("id")
      .single();

    if (error) {
      const { data: retry } = await supabase
        .from("futebol_times")
        .select("id")
        .eq("nome_normalizado", nomeNorm)
        .maybeSingle();
      return retry?.id || null;
    }
    return inserted?.id || null;
  }
}

// Upsert seguro de Liga (sem depender de constraint unique em nome_normalizado)
async function upsertLiga(
  supabase: any,
  ligaData: {
    nome: string;
    slug?: string | null;
    fonteId?: string | null;
    urlOrigem?: string | null;
  }
): Promise<number | null> {
  const nome = (ligaData.nome || "Futebol Geral").trim();
  const nomeNorm = normalizarNome(nome);
  const fonteId = ligaData.fonteId || null;

  let query = supabase.from("futebol_ligas").select("id");
  if (fonteId) {
    query = query.eq("fonte_id", fonteId);
  } else {
    query = query.eq("nome_normalizado", nomeNorm);
  }

  const { data: existing } = await query.maybeSingle();
  if (existing) return existing.id;

  const { data: inserted, error } = await supabase
    .from("futebol_ligas")
    .insert({
      nome,
      nome_normalizado: nomeNorm,
      slug: ligaData.slug || null,
      fonte_id: fonteId,
      url_origem: ligaData.urlOrigem || null,
    })
    .select("id")
    .single();

  if (error) {
    const { data: retry } = await supabase
      .from("futebol_ligas")
      .select("id")
      .eq("nome_normalizado", nomeNorm)
      .maybeSingle();
    return retry?.id || null;
  }
  return inserted?.id || null;
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

      const cardsToProcess = limitParam > 0 ? matches.slice(0, limitParam) : matches;

      for (const card of cardsToProcess) {
        // 1. Upsert seguro dos times
        const timeCasaId = await upsertTime(supabase, {
          nome: card.timeCasaNome,
          escudoUrl: card.timeCasaEscudo,
          urlOrigem: card.relUrl ? `${BASE_URL}${card.relUrl}` : null,
        });

        const timeForaId = await upsertTime(supabase, {
          nome: card.timeForaNome,
          escudoUrl: card.timeForaEscudo,
          urlOrigem: card.relUrl ? `${BASE_URL}${card.relUrl}` : null,
        });

        // 2. Upsert seguro da liga
        const ligaId = await upsertLiga(supabase, {
          nome: card.ligaNome,
        });

        if (!timeCasaId || !timeForaId) {
          continue;
        }

        // 3. Upsert do Jogo
        const { data: tjogo, error: jogoError } = await supabase
          .from("futebol_jogos")
          .upsert(
            {
              fonte_id: card.fonteId,
              url_origem: card.urlOrigem,
              time_casa_id: timeCasaId,
              time_fora_id: timeForaId,
              liga_id: ligaId,
              data_hora: card.dataHora,
              data_jogo: card.dataJogo,
              hora_jogo: card.horaJogo,
              status: card.status,
              placar_casa: card.placarCasa ?? null,
              placar_fora: card.placarFora ?? null,
              descricao: card.descricao,
              atualizado_em: new Date().toISOString(),
            },
            { onConflict: "fonte_id" }
          )
          .select("id")
          .single();

        if (jogoError) {
          console.error("Erro ao salvar jogo:", jogoError.message);
          continue;
        }

        if (tjogo?.id) {
          // 4. Canais de Transmissão
          for (const canalNome of card.canais) {
            const cNorm = normalizarNome(canalNome);
            const { data: tcanal } = await supabase
              .from("futebol_canais")
              .upsert(
                { nome: canalNome, nome_normalizado: cNorm },
                { onConflict: "nome_normalizado" }
              )
              .select("id")
              .single();

            if (tcanal?.id) {
              await supabase
                .from("futebol_jogo_canais")
                .upsert(
                  { jogo_id: tjogo.id, canal_id: tcanal.id },
                  { onConflict: "jogo_id,canal_id" }
                );
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
