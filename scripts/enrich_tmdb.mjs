/**
 * enrich_tmdb.mjs
 *
 * Enriquecimento automático do catálogo OnStream via TMDB API v3:
 * - Capas em alta resolução para Séries (w500)
 * - Sinopses oficiais em português (pt-BR)
 * - Mapeamento de Gênero Principal e lista completa de Gêneros
 * - Backdrops widescreen (w1280) e avaliações do público
 * - Consumo responsável (rate limiting de ~5 a 7 req/s com fallback resiliente e tratamento de 429)
 *
 * Uso:
 *   node scripts/enrich_tmdb.mjs --tipo=series --limit=10
 *   node scripts/enrich_tmdb.mjs --tipo=series --limit=100
 *   node scripts/enrich_tmdb.mjs --tipo=filmes --limit=50
 *   node scripts/enrich_tmdb.mjs --dry-run --limit=5
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 1. Carrega variáveis de ambiente de .env.local se existirem
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
// Chave de serviço necessária para operações de UPDATE no catálogo
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb29xd2N4Z21pbHJ0bm9seW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDIxMTc5OSwiZXhwIjoyMTA1Nzg3Nzk5fQ.CHK_OtTquEzePL4-dybsctFdrmry4SqedEA-YlkngvA";

const TMDB_API_KEY =
  process.env.TMDB_API_KEY ||
  process.env.NEXT_PUBLIC_TMDB_API_KEY ||
  "c07de866fcbbf34267e7c4136dc3e32b";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Argumentos de linha de comando
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  if (match) return match.split("=")[1];
  return fallback;
};

const hasFlag = (name) => args.includes(`--${name}`);

const TIPO_ALVO = getArg("tipo", "series"); // 'series' ou 'filmes'
const LIMIT_PARAM = getArg("limit", "10"); // '10', '100', 'all'
const DELAY_MS = parseInt(getArg("delay", "160"), 10); // ~6 req/s
const IS_DRY_RUN = hasFlag("dry-run");
const FORCE_RESCAN = hasFlag("force");

// Dicionários em memória de IDs de gênero para nomes em pt-BR
const tvGenresMap = new Map();
const movieGenresMap = new Map();

/**
 * Sanitiza o título removendo marcas de IPTV, qualidades e tags
 */
function sanitizeTitle(rawTitle) {
  let title = rawTitle;

  // Remove prefixos de grupos
  title = title.replace(/^(FILMES|SÉRIES|SERIES|CANAIS|VOD):\s*/i, "");

  // Extrai ano se estiver entre parênteses
  let extractedYear = null;
  const yearMatch = title.match(/\((\d{4})\)/);
  if (yearMatch) {
    extractedYear = parseInt(yearMatch[1], 10);
    title = title.replace(/\(\d{4}\)/g, "");
  }

  // Remove tags comuns de IPTV, resoluções, áudio e episódios
  title = title
    .replace(/\[.*?\]/g, " ")
    .replace(/\{.*?\}/g, " ")
    .replace(
      /\b(4K|FHD|UHD|HD|SD|720p|1080p|2160p|HDR|HDR10|DOLBY|VISION|ATMOS|DUBLADO|LEGENDADO|DUAL|NACIONAL|BLURAY|WEB-DL|WEBRIP|REMUX|EXTENDED|IMAX|MULTI|PRIME|NETFLIX|DISNEY|HBO|PARAMOUNT|APPLE|GLOBO)\b/gi,
      " "
    )
    .replace(/\b(S\d+E\d+|\d+x\d+)\b/gi, " ")
    .replace(/[-_.:/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { cleanTitle: title, extractedYear };
}

function buildTmdbRequest(endpoint, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3/${endpoint}`);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("include_adult", "false");

  if (!TMDB_API_KEY.startsWith("ey")) {
    url.searchParams.set("api_key", TMDB_API_KEY);
  }

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, String(v));
    }
  }

  const headers = { Accept: "application/json" };
  if (TMDB_API_KEY.startsWith("ey")) {
    headers["Authorization"] = `Bearer ${TMDB_API_KEY}`;
  }

  return { urlString: url.toString(), headers };
}

/**
 * Carrega a tabela oficial de gêneros do TMDB em português
 */
async function loadGenreMaps() {
  try {
    const reqTv = buildTmdbRequest("genre/tv/list");
    const reqMovie = buildTmdbRequest("genre/movie/list");

    const [resTv, resMovie] = await Promise.all([
      fetch(reqTv.urlString, { headers: reqTv.headers }),
      fetch(reqMovie.urlString, { headers: reqMovie.headers }),
    ]);

    if (resTv.ok) {
      const data = await resTv.json();
      (data.genres || []).forEach((g) => tvGenresMap.set(g.id, g.name));
    }
    if (resMovie.ok) {
      const data = await resMovie.json();
      (data.genres || []).forEach((g) => movieGenresMap.set(g.id, g.name));
    }
    console.log(`[TMDB] Mapeamento carregado: ${tvGenresMap.size} gêneros de TV, ${movieGenresMap.size} gêneros de Filmes.`);
  } catch (err) {
    console.warn("[TMDB] Falha ao pré-carregar tabela de gêneros:", err.message);
  }
}

/**
 * Executa requisição HTTP no TMDB com tratamento de rate limit (429) e delay
 */
async function tmdbFetch(endpoint, params = {}) {
  const { urlString, headers } = buildTmdbRequest(endpoint, params);

  // Delay respeitoso para fair use
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  let res = await fetch(urlString, { headers });

  // Se receber HTTP 429 Too Many Requests, aguarda Retry-After e tenta novamente
  if (res.status === 429) {
    const retrySecs = parseInt(res.headers.get("Retry-After") || "2", 10);
    console.warn(`[TMDB 429] Rate limit atingido. Pausando por ${retrySecs}s antes de tentar novamente...`);
    await new Promise((resolve) => setTimeout(resolve, (retrySecs + 1) * 1000));
    res = await fetch(urlString, { headers });
  }

  if (!res.ok) {
    throw new Error(`TMDB HTTP ${res.status}: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Busca metadados de uma Série ou Filme no TMDB
 */
async function searchTmdb(item) {
  const isSerie = item.tipo === "series";
  const { cleanTitle, extractedYear } = sanitizeTitle(item.nome);
  const anoAlvo = item.ano || extractedYear;

  const primaryEndpoint = isSerie ? "search/tv" : "search/movie";

  // Tentativa 1: busca por query + ano
  const searchParams = { query: cleanTitle };
  if (anoAlvo) {
    if (isSerie) searchParams.first_air_date_year = anoAlvo;
    else searchParams.year = anoAlvo;
  }

  let data = await tmdbFetch(primaryEndpoint, searchParams);

  // Tentativa 2: se falhou com o ano, busca sem ano
  if ((!data.results || data.results.length === 0) && anoAlvo) {
    data = await tmdbFetch(primaryEndpoint, { query: cleanTitle });
  }

  // Tentativa 3: fallback para busca multi
  if (!data.results || data.results.length === 0) {
    data = await tmdbFetch("search/multi", { query: cleanTitle });
  }

  if (!data.results || data.results.length === 0) {
    return null;
  }

  const result = data.results[0];
  const genresMap = isSerie ? tvGenresMap : movieGenresMap;

  // Tradução dos genre_ids para nomes
  const genreNames = (result.genre_ids || [])
    .map((id) => genresMap.get(id))
    .filter(Boolean);

  const generoPrincipal = genreNames.length > 0 ? genreNames[0] : null;

  return {
    tmdb_id: result.id,
    sinopse: result.overview ? result.overview.trim() : null,
    genero_principal: generoPrincipal,
    generos: genreNames.length > 0 ? genreNames : null,
    capa_tmdb: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : null,
    backdrop_tmdb: result.backdrop_path ? `https://image.tmdb.org/t/p/w1280${result.backdrop_path}` : null,
    tmdb_rating: typeof result.vote_average === "number" ? Number(result.vote_average.toFixed(1)) : null,
    tmdb_title: result.name || result.title || cleanTitle,
  };
}

async function main() {
  console.log("==============================================================");
  console.log("🎬 ONSTREAM - ENRIQUECIMENTO DE METADADOS E CAPAS (TMDB)");
  console.log("==============================================================");
  console.log(`- Tipo alvo: ${TIPO_ALVO.toUpperCase()}`);
  console.log(`- Limite: ${LIMIT_PARAM}`);
  console.log(`- Delay entre requisições: ${DELAY_MS}ms (~${Math.round(1000 / DELAY_MS)} req/s)`);
  console.log(`- Dry run (simulação sem gravar no banco): ${IS_DRY_RUN ? "SIM" : "NÃO"}`);
  console.log("==============================================================");

  await loadGenreMaps();

  // 1. Busca os itens no Supabase que ainda não foram sincronizados
  let query = supabase
    .from("catalogo_itens")
    .select("id, nome, ano, tipo, logo_url, grupo");

  if (TIPO_ALVO === "todos" || TIPO_ALVO === "all") {
    query = query.in("tipo", ["series", "filmes"]);
  } else {
    query = query.eq("tipo", TIPO_ALVO);
  }

  if (!FORCE_RESCAN) {
    query = query.is("tmdb_sincronizado_em", null);
  }

  // Prioriza lançamentos mais recentes
  query = query.order("ano", { ascending: false, nullsFirst: false }).order("id", { ascending: false });

  if (LIMIT_PARAM !== "all") {
    query = query.limit(parseInt(LIMIT_PARAM, 10));
  }

  const { data: itens, error } = await query;

  if (error) {
    if (error.message && error.message.includes("tmdb_sincronizado_em")) {
      console.error("\n❌ ERRO DE ESQUEMA NO SUPABASE:");
      console.error("As colunas do TMDB ainda não foram criadas na tabela 'catalogo_itens'.");
      console.error("Por favor, execute o arquivo 'supabase/migrations/20260925_tmdb_fields.sql' no SQL Editor do Supabase!");
      process.exit(1);
    }
    console.error("Erro ao carregar itens do Supabase:", error);
    process.exit(1);
  }

  if (!itens || itens.length === 0) {
    console.log("\n✅ Nenhum item pendente de sincronização para os filtros selecionados!");
    process.exit(0);
  }

  console.log(`\nItens encontrados para processar: ${itens.length}`);
  console.log("Iniciando consultas no TMDB...\n");

  let sucessos = 0;
  let naoEncontrados = 0;
  let erros = 0;

  for (let i = 0; i < itens.length; i++) {
    const item = itens[i];
    const prefix = `[${i + 1}/${itens.length}] ID ${item.id} - "${item.nome}" (${item.ano || "N/A"})`;

    try {
      const tmdbData = await searchTmdb(item);

      if (!tmdbData) {
        naoEncontrados++;
        console.log(`${prefix} -> ⚠️ Não encontrado no TMDB`);

        if (!IS_DRY_RUN) {
          // Marca sincronizado para não ficar tentando eternamente
          await supabase
            .from("catalogo_itens")
            .update({ tmdb_sincronizado_em: new Date().toISOString() })
            .eq("id", item.id);
        }
        continue;
      }

      sucessos++;
      console.log(
        `${prefix} -> ✅ TMDB: "${tmdbData.tmdb_title}" | Gênero: ${tmdbData.genero_principal || "N/A"} | Capa: ${
          tmdbData.capa_tmdb ? "OK" : "Sem Capa"
        } | Sinopse: ${tmdbData.sinopse ? tmdbData.sinopse.slice(0, 45) + "..." : "Sem Sinopse"}`
      );

      if (!IS_DRY_RUN) {
        const updatePayload = {
          sinopse: tmdbData.sinopse,
          genero_principal: tmdbData.genero_principal,
          generos: tmdbData.generos,
          capa_tmdb: tmdbData.capa_tmdb,
          backdrop_tmdb: tmdbData.backdrop_tmdb,
          tmdb_id: tmdbData.tmdb_id,
          tmdb_rating: tmdbData.tmdb_rating,
          tmdb_sincronizado_em: new Date().toISOString(),
        };

        const { error: updateErr } = await supabase
          .from("catalogo_itens")
          .update(updatePayload)
          .eq("id", item.id);

        if (updateErr) {
          console.error(`   Erro ao atualizar no Supabase: ${updateErr.message}`);
          erros++;
        }
      }
    } catch (err) {
      erros++;
      console.error(`${prefix} -> ❌ Erro: ${err.message}`);
    }
  }

  console.log("\n==============================================================");
  console.log("🎉 RESUMO DO PROCESSAMENTO:");
  console.log(`- Total processado: ${itens.length}`);
  console.log(`- Encontrados com sucesso: ${sucessos}`);
  console.log(`- Não encontrados: ${naoEncontrados}`);
  console.log(`- Falhas/Erros: ${erros}`);
  console.log("==============================================================");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
