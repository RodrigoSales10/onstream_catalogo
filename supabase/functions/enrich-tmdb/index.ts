import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface TmdbEnrichResult {
  tmdb_id: number;
  sinopse: string | null;
  genero_principal: string | null;
  generos: string[] | null;
  capa_tmdb: string | null;
  backdrop_tmdb: string | null;
  tmdb_rating: number | null;
  tmdb_title: string;
}

const tvGenresMap = new Map<number, string>();
const movieGenresMap = new Map<number, string>();
let genresLoaded = false;

function sanitizeTitle(rawTitle: string): { cleanTitle: string; extractedYear: number | null } {
  let title = rawTitle;

  title = title.replace(/^(FILMES|SÉRIES|SERIES|CANAIS|VOD):\s*/i, "");

  let extractedYear: number | null = null;
  const yearMatch = title.match(/\((\d{4})\)/);
  if (yearMatch) {
    extractedYear = parseInt(yearMatch[1], 10);
    title = title.replace(/\(\d{4}\)/g, "");
  }

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

function buildTmdbRequest(endpoint: string, apiKey: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`https://api.themoviedb.org/3/${endpoint}`);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("include_adult", "false");

  if (!apiKey.startsWith("ey")) {
    url.searchParams.set("api_key", apiKey);
  }

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey.startsWith("ey")) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  return { urlString: url.toString(), headers };
}

async function loadGenres(apiKey: string) {
  if (genresLoaded) return;
  try {
    const reqTv = buildTmdbRequest("genre/tv/list", apiKey, {});
    const reqMovie = buildTmdbRequest("genre/movie/list", apiKey, {});

    const [resTv, resMovie] = await Promise.all([
      fetch(reqTv.urlString, { headers: reqTv.headers }),
      fetch(reqMovie.urlString, { headers: reqMovie.headers }),
    ]);

    if (resTv.ok) {
      const data = await resTv.json();
      (data.genres || []).forEach((g: { id: number; name: string }) => tvGenresMap.set(g.id, g.name));
    }
    if (resMovie.ok) {
      const data = await resMovie.json();
      (data.genres || []).forEach((g: { id: number; name: string }) => movieGenresMap.set(g.id, g.name));
    }
    genresLoaded = true;
  } catch (err) {
    console.warn("Falha ao carregar gêneros TMDB na Edge Function:", err);
  }
}

async function searchTmdb(
  item: { id: number; nome: string; ano: number | null; tipo: string },
  apiKey: string,
  delayMs = 150
): Promise<TmdbEnrichResult | null> {
  const isSerie = item.tipo === "series";
  const { cleanTitle, extractedYear } = sanitizeTitle(item.nome);
  const anoAlvo = item.ano || extractedYear;

  const primaryEndpoint = isSerie ? "search/tv" : "search/movie";

  const fetchWithRateLimit = async (endpoint: string, params: Record<string, string | number | undefined>) => {
    const { urlString, headers } = buildTmdbRequest(endpoint, apiKey, params);
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    let res = await fetch(urlString, { headers });
    if (res.status === 429) {
      const retrySecs = parseInt(res.headers.get("Retry-After") || "2", 10);
      await new Promise((resolve) => setTimeout(resolve, (retrySecs + 1) * 1000));
      res = await fetch(urlString, { headers });
    }
    if (!res.ok) return null;
    return await res.json();
  };

  // Tentativa 1: Busca com título + ano
  const initialParams: Record<string, string | number | undefined> = { query: cleanTitle };
  if (anoAlvo) {
    if (isSerie) initialParams.first_air_date_year = anoAlvo;
    else initialParams.year = anoAlvo;
  }

  let data = await fetchWithRateLimit(primaryEndpoint, initialParams);

  // Tentativa 2: Busca sem ano
  if ((!data?.results || data.results.length === 0) && anoAlvo) {
    data = await fetchWithRateLimit(primaryEndpoint, { query: cleanTitle });
  }

  // Tentativa 3: Multi-search
  if (!data?.results || data.results.length === 0) {
    data = await fetchWithRateLimit("search/multi", { query: cleanTitle });
  }

  if (!data?.results || data.results.length === 0) {
    return null;
  }

  const result = data.results[0];
  const genresMap = isSerie ? tvGenresMap : movieGenresMap;

  const genreNames = (result.genre_ids || [])
    .map((id: number) => genresMap.get(id))
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const tipo = url.searchParams.get("tipo") || "todos"; // 'series', 'filmes', ou 'todos'

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const tmdbApiKey =
      Deno.env.get("TMDB_API_KEY") ||
      Deno.env.get("NEXT_PUBLIC_TMDB_API_KEY") ||
      "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Credenciais Supabase ausentes no ambiente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tmdbApiKey) {
      return new Response(JSON.stringify({ error: "TMDB_API_KEY ausente nas Secrets do Supabase." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await loadGenres(tmdbApiKey);

    // Consulta itens pendentes
    let query = supabase
      .from("catalogo_itens")
      .select("id, nome, ano, tipo")
      .is("tmdb_sincronizado_em", null);

    if (tipo === "series" || tipo === "filmes") {
      query = query.eq("tipo", tipo);
    } else {
      query = query.in("tipo", ["series", "filmes"]);
    }

    query = query
      .order("ano", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .limit(limit);

    const { data: itens, error: selectErr } = await query;

    if (selectErr) {
      throw selectErr;
    }

    if (!itens || itens.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Nenhum item pendente de sincronização com o TMDB.",
          processed: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let found = 0;
    let notFound = 0;
    let errors = 0;

    for (const item of itens) {
      try {
        const enriched = await searchTmdb(item, tmdbApiKey);

        if (!enriched) {
          notFound++;
          await supabase
            .from("catalogo_itens")
            .update({ tmdb_sincronizado_em: new Date().toISOString() })
            .eq("id", item.id);
          continue;
        }

        found++;
        await supabase
          .from("catalogo_itens")
          .update({
            sinopse: enriched.sinopse,
            genero_principal: enriched.genero_principal,
            generos: enriched.generos,
            capa_tmdb: enriched.capa_tmdb,
            backdrop_tmdb: enriched.backdrop_tmdb,
            tmdb_id: enriched.tmdb_id,
            tmdb_rating: enriched.tmdb_rating,
            tmdb_sincronizado_em: new Date().toISOString(),
          })
          .eq("id", item.id);
      } catch (itemErr) {
        errors++;
        console.error(`Erro ao enriquecer item ${item.id}:`, itemErr);
      }
    }

    // Conta quantos ainda restam pendentes no total
    const { count: pendingRemaining } = await supabase
      .from("catalogo_itens")
      .select("id", { count: "exact", head: true })
      .is("tmdb_sincronizado_em", null)
      .in("tipo", ["series", "filmes"]);

    return new Response(
      JSON.stringify({
        success: true,
        processed: itens.length,
        found,
        not_found: notFound,
        errors,
        pending_remaining: pendingRemaining || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
