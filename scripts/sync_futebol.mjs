/**
 * sync_futebol.mjs
 *
 * Raspagem e sincronização da agenda de futebol do Futebol na TV:
 * - Captura jogos de hoje (/), ontem (/jogos-ontem) e amanhã (/jogos-amanha)
 * - Extrai times, ligas, horários de Brasília (timestamptz), placares e canais de transmissão
 * - Busca escudos oficiais e logos em alta resolução nos detalhes das partidas
 * - Faz download e armazenamento seguro no Supabase Storage (bucket futebol-assets)
 * - Registra logs de execução em futebol_sync_logs
 *
 * Uso:
 *   node scripts/sync_futebol.mjs --dia=hoje
 *   node scripts/sync_futebol.mjs --dia=hoje --download-images
 *   node scripts/sync_futebol.mjs --dia=todos --download-images
 *   node scripts/sync_futebol.mjs --limit=5 --download-images
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// 1. Carrega variáveis de ambiente de .env.local
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://siooqwcxgmilrtnolyoc.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb29xd2N4Z21pbHJ0bm9seW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDIxMTc5OSwiZXhwIjoyMTA1Nzg3Nzk5fQ.CHK_OtTquEzePL4-dybsctFdrmry4SqedEA-YlkngvA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BASE_URL = "https://www.futebolnatv.com.br";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

// Parâmetros CLI
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  if (match) return match.split("=")[1];
  return fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const DIA_PARAM = getArg("dia", "hoje"); // 'hoje', 'ontem', 'amanha', 'todos'
const LIMIT_PARAM = parseInt(getArg("limit", "0"), 10);
const SHOULD_DOWNLOAD_IMAGES = hasFlag("download-images");

// Normalização de nomes para deduplicação semântica
function normalizarNome(nome) {
  if (!nome) return "";
  return nome
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Faz requisição HTTP com headers de navegador
 */
async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao acessar ${url}`);
  }
  return await res.text();
}

/**
 * Calcula data de Brasília (YYYY-MM-DD) para ontem, hoje ou amanhã
 */
function calcularDataBrasilia(diaParam) {
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

/**
 * Converte data (YYYY-MM-DD) e hora (HH:mm) de Brasília em timestamptz ISO
 */
function buildTimestampBrasilia(dateStr, timeStr) {
  const cleanTime = (timeStr || "00:00").replace(/h/i, "").trim();
  const [hh, mm] = cleanTime.split(":");
  const hPad = String(parseInt(hh || "0", 10)).padStart(2, "0");
  const mPad = String(parseInt(mm || "0", 10)).padStart(2, "0");
  return `${dateStr}T${hPad}:${mPad}:00-03:00`;
}

/**
 * Extrai os cartões principais de partidas do HTML da listagem
 */
function parseMatchCards(html, dataJogoStr) {
  const matches = [];
  const articleRegex = /<article\b[^>]*>([\s\S]*?)<\/article>/gi;
  let match;

  while ((match = articleRegex.exec(html)) !== null) {
    const cardHtml = match[1];

    // 1. Link e Fonte ID (usa o slug completo do jogo para garantir 100% de unicidade)
    const linkMatch = /<a\s+href="(\/aovivo\/([^"]+)\.html)"/i.exec(cardHtml);
    if (!linkMatch) continue;

    const relUrl = linkMatch[1];
    const fonteId = linkMatch[2]; // Ex: "criciuma-x-avai-2745a8d70e", "crb-x-cuiaba-2745a8d70e"
    const urlOrigem = `${BASE_URL}${relUrl}`;

    // 2. Título da partida
    const titleMatch = /<h3[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i.exec(cardHtml);
    let rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    rawTitle = rawTitle.replace(/^Onde assistir\s+/i, "").replace(/\s+ao vivo\??$/i, "").trim();

    // 3. Times Casa x Fora
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

    // 4. Liga
    const ligaMatch = /<div class="mt-2[^>]*>[\s\S]*?<span class="font-medium[^>]*>([\s\S]*?)<\/span>/i.exec(cardHtml);
    const ligaNome = ligaMatch ? ligaMatch[1].replace(/<[^>]+>/g, "").trim() : "Futebol Geral";

    // 5. Horário
    const horaMatch = /<span class="tabular-nums">⏱\s*(\d{1,2}:\d{2})h?<\/span>/i.exec(cardHtml);
    const horaJogo = horaMatch ? horaMatch[1].trim() : "00:00";

    // 6. Descrição contextual
    const descMatch = /<p class="mt-3 text-sm[^>]*>([\s\S]*?)<\/p>/i.exec(cardHtml);
    const descricao = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : null;

    // 7. Canais de transmissão
    const canais = [];
    const canaisContainerMatch = /<div class="mt-3 flex flex-wrap gap-1.5">([\s\S]*?)<\/div>/i.exec(cardHtml);
    if (canaisContainerMatch) {
      const canalBadgeRegex = /<span[^>]*>([\s\S]*?)<\/span>/gi;
      let cMatch;
      while ((cMatch = canalBadgeRegex.exec(canaisContainerMatch[1])) !== null) {
        const cNome = cMatch[1].replace(/<[^>]+>/g, "").trim();
        if (cNome && !canais.includes(cNome)) {
          canais.push(cNome);
        }
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

  return matches;
}

/**
 * Consulta a página de detalhes da partida para obter escudos, slugs e identificadores de times/ligas
 */
async function fetchMatchDetails(relUrl) {
  try {
    const html = await fetchHtml(`${BASE_URL}${relUrl}`);

    const result = {
      timeCasa: { nome: "", slug: "", fonteId: "", escudoUrl: "" },
      timeFora: { nome: "", slug: "", fonteId: "", escudoUrl: "" },
      liga: { nome: "", slug: "", fonteId: "", logoUrl: "" },
      canaisDetalhe: [],
      status: "agendado",
      placarCasa: null,
      placarFora: null,
    };

    // 1. JSON-LD SportsEvent (muito confiável para times e organizador)
    const jsonLdMatch = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let sMatch;
    while ((sMatch = jsonLdMatch.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(sMatch[1]);
        if (parsed["@type"] === "SportsEvent") {
          if (parsed.homeTeam?.name) result.timeCasa.nome = parsed.homeTeam.name;
          if (parsed.awayTeam?.name) result.timeFora.nome = parsed.awayTeam.name;
          if (parsed.organizer?.name) result.liga.nome = parsed.organizer.name;
          if (parsed.startDate) result.startDateIso = parsed.startDate;
        }
      } catch {
        // ignora JSON-LD mal formatado
      }
    }

    // 2. Extração de times com links e escudos
    const teamLinks = [];
    const teamRegex = /<a\s+href="(\/time\/([^"]+))"[^>]*>([\s\S]*?)<\/a>/gi;
    let tMatch;
    while ((tMatch = teamRegex.exec(html)) !== null) {
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

    // Fallback para escudos presentes no HTML
    const allTeamImgs = Array.from(html.matchAll(/<img[^>]+src="([^">]+upload\/teams\/[^">]+)"/gi)).map((m) => m[1]);
    if (teamLinks.length >= 2) {
      if (!teamLinks[0].escudoUrl && allTeamImgs[0]) teamLinks[0].escudoUrl = allTeamImgs[0];
      if (!teamLinks[1].escudoUrl && allTeamImgs[1]) teamLinks[1].escudoUrl = allTeamImgs[1];

      result.timeCasa = { ...result.timeCasa, ...teamLinks[0] };
      result.timeFora = { ...result.timeFora, ...teamLinks[1] };
    }

    // 3. Extração da Liga
    const ligaRegex = /<a\s+href="(\/liga\/([^"]+))"[^>]*>([\s\S]*?)<\/a>/i.exec(html);
    if (ligaRegex) {
      const fullLigaSlug = ligaRegex[2];
      const lastHyphen = fullLigaSlug.lastIndexOf("-");
      result.liga.slug = lastHyphen !== -1 ? fullLigaSlug.slice(0, lastHyphen) : fullLigaSlug;
      result.liga.fonteId = lastHyphen !== -1 ? fullLigaSlug.slice(lastHyphen + 1) : fullLigaSlug;
      const ligaNomeTxt = ligaRegex[3].replace(/<[^>]+>/g, "").trim();
      if (ligaNomeTxt) result.liga.nome = ligaNomeTxt;
    }

    // 4. Placares e Status precisos
    const statusBadgeMatch = /id="status-badge"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i.exec(html);
    const statusBadgeContent = statusBadgeMatch ? statusBadgeMatch[0] : "";

    if (/FIM DE JOGO|ENCERRADO/i.test(statusBadgeContent)) {
      result.status = "finalizado";
    } else if (/bullet|animate-pulse|\b\d+'\b|INTERVALO|EM ANDAMENTO/i.test(statusBadgeContent)) {
      result.status = "ao_vivo";
    } else {
      result.status = "agendado";
    }

    const placar1Match = /<span id="placar-time1"[^>]*>\s*(\d+)\s*<\/span>/i.exec(html);
    const placar2Match = /<span id="placar-time2"[^>]*>\s*(\d+)\s*<\/span>/i.exec(html);
    if (placar1Match && placar2Match && result.status !== "agendado") {
      result.placarCasa = parseInt(placar1Match[1], 10);
      result.placarFora = parseInt(placar2Match[1], 10);
    }

    return result;
  } catch (err) {
    console.warn(`  ⚠️ Falha ao obter detalhes de ${relUrl}:`, err.message);
    return null;
  }
}

/**
 * Baixa imagem e faz upload com hash SHA-256 no bucket futebol-assets
 */
async function uploadAssetToStorage(folder, remoteUrl) {
  if (!remoteUrl || !remoteUrl.startsWith("http")) return null;

  try {
    const res = await fetch(remoteUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Referer": "https://www.futebolnatv.com.br/",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      console.warn(`  ⚠️ HTTP ${res.status} ao baixar imagem (${remoteUrl})`);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0 || buffer.length > 2097152) return null; // Máx 2MB

    const contentType = res.headers.get("content-type") || "image/png";
    let ext = "png";
    if (contentType.includes("jpeg") || remoteUrl.endsWith(".jpg") || remoteUrl.endsWith(".jpeg")) ext = "jpg";
    else if (contentType.includes("webp") || remoteUrl.endsWith(".webp")) ext = "webp";
    else if (contentType.includes("svg") || remoteUrl.endsWith(".svg")) ext = "svg";

    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    const storagePath = `${folder}/${hash}.${ext}`;

    const { error } = await supabase.storage.from("futebol-assets").upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.warn(`  ⚠️ Erro no storage upload (${storagePath}):`, error.message);
      return null;
    }

    return storagePath;
  } catch (err) {
    console.warn(`  ⚠️ Falha no download do asset (${remoteUrl}):`, err.message);
    return null;
  }
}

/**
 * Executa upsert de um Time no Supabase
 */
async function upsertTime(timeData, shouldDownload) {
  const nome = timeData.nome.trim();
  const nomeNorm = normalizarNome(nome);
  const fonteId = timeData.fonteId || null;

  // Busca se já existe por fonte_id ou nome_normalizado
  let query = supabase.from("futebol_times").select("id, escudo_storage_path, status_imagem");
  if (fonteId) {
    query = query.eq("fonte_id", fonteId);
  } else {
    query = query.eq("nome_normalizado", nomeNorm);
  }

  const { data: existing } = await query.maybeSingle();

  let storagePath = existing?.escudo_storage_path || null;
  let statusImg = existing?.status_imagem || "pendente";

  if (shouldDownload && timeData.escudoUrl && !storagePath) {
    storagePath = await uploadAssetToStorage("times", timeData.escudoUrl);
    if (storagePath) statusImg = "processado";
  }

  if (existing) {
    await supabase
      .from("futebol_times")
      .update({
        nome,
        slug: timeData.slug || undefined,
        url_origem: timeData.urlOrigem || undefined,
        escudo_url_origem: timeData.escudoUrl || undefined,
        escudo_storage_path: storagePath || undefined,
        status_imagem: statusImg,
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
        escudo_storage_path: storagePath,
        status_imagem: statusImg,
      })
      .select("id")
      .single();

    if (error) {
      // Se deu conflito de chave única, recupera o id
      const { data: retry } = await supabase
        .from("futebol_times")
        .select("id")
        .eq("nome_normalizado", nomeNorm)
        .single();
      return retry?.id;
    }
    return inserted?.id;
  }
}

/**
 * Executa upsert de uma Liga no Supabase
 */
async function upsertLiga(ligaData) {
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
      .single();
    return retry?.id;
  }
  return inserted?.id;
}

/**
 * Executa upsert de um Canal no Supabase
 */
async function upsertCanal(nomeCanal) {
  const nome = nomeCanal.trim();
  const nomeNorm = normalizarNome(nome);

  const { data: existing } = await supabase
    .from("futebol_canais")
    .select("id")
    .eq("nome_normalizado", nomeNorm)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: inserted, error } = await supabase
    .from("futebol_canais")
    .insert({
      nome,
      nome_normalizado: nomeNorm,
    })
    .select("id")
    .single();

  if (error) {
    const { data: retry } = await supabase
      .from("futebol_canais")
      .select("id")
      .eq("nome_normalizado", nomeNorm)
      .single();
    return retry?.id;
  }
  return inserted?.id;
}

/**
 * Fluxo Principal de Sincronização
 */
async function main() {
  const startTime = Date.now();
  console.log("==================================================================");
  console.log("⚽ INICIANDO SINCRONIZAÇÃO DO FUTEBOL NA TV (SUPABASE)");
  console.log(`📅 Dia selecionado: ${DIA_PARAM.toUpperCase()}`);
  console.log(`🖼️ Baixar imagens para o Storage: ${SHOULD_DOWNLOAD_IMAGES ? "SIM" : "NÃO"}`);
  console.log("==================================================================");

  const diasAlvo = DIA_PARAM === "todos" ? ["ontem", "hoje", "amanha"] : [DIA_PARAM];
  let totalJogosProcessados = 0;
  let totalImagensProcessadas = 0;

  for (const dia of diasAlvo) {
    const dataJogoStr = calcularDataBrasilia(dia);
    let targetUrl = BASE_URL;
    if (dia === "ontem") targetUrl = `${BASE_URL}/jogos-ontem`;
    else if (dia === "amanha") targetUrl = `${BASE_URL}/jogos-amanha`;

    console.log(`\n🔍 Extraindo partidas para ${dia.toUpperCase()} (${dataJogoStr}) via ${targetUrl}...`);

    let html;
    try {
      html = await fetchHtml(targetUrl);
    } catch (err) {
      console.error(`❌ Erro ao baixar HTML de ${targetUrl}:`, err.message);
      continue;
    }

    const cards = parseMatchCards(html, dataJogoStr);
    console.log(`📋 Encontradas ${cards.length} partidas no guia.`);

    const cardsToProcess = LIMIT_PARAM > 0 ? cards.slice(0, LIMIT_PARAM) : cards;

    for (let i = 0; i < cardsToProcess.length; i++) {
      const card = cardsToProcess[i];
      console.log(`\n[${i + 1}/${cardsToProcess.length}] ${card.timeCasaNome} x ${card.timeForaNome} (${card.horaJogo})`);

      // 1. Busca detalhes da partida para ter escudos e IDs
      await sleep(180); // rate limiting respeitoso
      const details = await fetchMatchDetails(card.relUrl);

      // 2. Prepara times com dados enriquecidos
      const casaData = {
        nome: details?.timeCasa?.nome || card.timeCasaNome,
        slug: details?.timeCasa?.slug,
        fonteId: details?.timeCasa?.fonteId,
        urlOrigem: details?.timeCasa?.href ? `${BASE_URL}${details.timeCasa.href}` : null,
        escudoUrl: details?.timeCasa?.escudoUrl,
      };

      const foraData = {
        nome: details?.timeFora?.nome || card.timeForaNome,
        slug: details?.timeFora?.slug,
        fonteId: details?.timeFora?.fonteId,
        urlOrigem: details?.timeFora?.href ? `${BASE_URL}${details.timeFora.href}` : null,
        escudoUrl: details?.timeFora?.escudoUrl,
      };

      const ligaData = {
        nome: details?.liga?.nome || card.ligaNome,
        slug: details?.liga?.slug,
        fonteId: details?.liga?.fonteId,
      };

      // 3. Upsert de Times e Liga
      const timeCasaId = await upsertTime(casaData, SHOULD_DOWNLOAD_IMAGES);
      const timeForaId = await upsertTime(foraData, SHOULD_DOWNLOAD_IMAGES);
      const ligaId = await upsertLiga(ligaData);

      if (SHOULD_DOWNLOAD_IMAGES) {
        if (casaData.escudoUrl) totalImagensProcessadas++;
        if (foraData.escudoUrl) totalImagensProcessadas++;
      }

      if (!timeCasaId || !timeForaId) {
        console.warn(`  ⚠️ Pular jogo por falta de ID de time.`);
        continue;
      }

      // 4. Upsert do Jogo
      const statusFinal = details?.status || "agendado";
      const placarCasa = details?.placarCasa ?? null;
      const placarFora = details?.placarFora ?? null;

      const { data: jogoRecord, error: jogoError } = await supabase
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
            status: statusFinal,
            placar_casa: placarCasa,
            placar_fora: placarFora,
            descricao: card.descricao,
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: "fonte_id" }
        )
        .select("id")
        .single();

      if (jogoError) {
        console.error(`  ❌ Erro ao salvar jogo:`, jogoError.message);
        continue;
      }

      const jogoId = jogoRecord.id;

      // 5. Canais de Transmissão
      for (const canalNome of card.canais) {
        const canalId = await upsertCanal(canalNome);
        if (canalId) {
          await supabase
            .from("futebol_jogo_canais")
            .upsert({ jogo_id: jogoId, canal_id: canalId }, { onConflict: "jogo_id,canal_id" });
        }
      }

      console.log(`  ✅ Jogo salvo (ID: ${jogoId}) com ${card.canais.length} canais: [${card.canais.join(", ")}]`);
      totalJogosProcessados++;
    }
  }

  const durationMs = Date.now() - startTime;
  console.log("\n==================================================================");
  console.log(`🏁 SINCRONIZAÇÃO CONCLUÍDA EM ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`📊 Total de Jogos Processados: ${totalJogosProcessados}`);
  console.log(`🖼️ Total de Imagens Verificadas/Salvas: ${totalImagensProcessadas}`);
  console.log("==================================================================");

  // Registra log na tabela futebol_sync_logs
  await supabase.from("futebol_sync_logs").insert({
    rotina: `agenda_${DIA_PARAM}`,
    duracao_ms: durationMs,
    total_jogos: totalJogosProcessados,
    total_imagens: totalImagensProcessadas,
    status: "sucesso",
    detalhes: {
      dia: DIA_PARAM,
      jogos: totalJogosProcessados,
      imagens: totalImagensProcessadas,
      downloadImages: SHOULD_DOWNLOAD_IMAGES,
    },
  });
}

main().catch(async (err) => {
  console.error("\n💥 ERRO FATAL NA SINCRONIZAÇÃO:", err);
  try {
    await supabase.from("futebol_sync_logs").insert({
      rotina: `agenda_${DIA_PARAM}`,
      status: "erro",
      mensagem_erro: err.message,
    });
  } catch {}
  process.exit(1);
});
