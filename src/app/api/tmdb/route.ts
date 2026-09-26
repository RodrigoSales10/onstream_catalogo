import { NextRequest, NextResponse } from "next/server";

// Chave padrão da comunidade TMDB para garantir funcionamento imediato
const DEFAULT_TMDB_KEY = "c07de866fcbbf34267e7c4136dc3e32b";

/**
 * Sanitiza o título de mídia removendo tags de qualidade, áudio e formato de IPTV
 */
function sanitizeSearchTitle(rawTitle: string): { cleanTitle: string; extractedYear: string | null } {
  let title = rawTitle;

  // Remove prefixos de grupos
  title = title.replace(/^(FILMES|SÉRIES|SERIES|CANAIS):\s*/i, "");

  // Extrai ano no formato (YYYY)
  let extractedYear: string | null = null;
  const yearMatch = title.match(/\((\d{4})\)/);
  if (yearMatch) {
    extractedYear = yearMatch[1];
    title = title.replace(/\(\d{4}\)/g, "");
  }

  // Remove sufixos comuns de IPTV e releases
  title = title
    .replace(/\[.*?\]/g, "") // [LEG], [DUB]
    .replace(/\b(4K|FHD|UHD|HD|720p|1080p|2160p|HDR|DUBLADO|LEGENDADO|DUAL|NACIONAL|BLURAY|WEB-DL|EXTENDED)\b/gi, "")
    .replace(/\b(S\d+E\d+|\d+x\d+)\b/gi, "") // Episódios
    .replace(/\s+/g, " ")
    .trim();

  return { cleanTitle: title, extractedYear };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("query") || "";
  const type = searchParams.get("type") || "filmes";
  const paramYear = searchParams.get("year");

  if (!rawQuery.trim()) {
    return NextResponse.json({ found: false, error: "Query vazia" }, { status: 400 });
  }

  const { cleanTitle, extractedYear } = sanitizeSearchTitle(rawQuery);
  const year = paramYear || extractedYear;

  const rawKey =
    process.env.TMDB_API_KEY ||
    process.env.NEXT_PUBLIC_TMDB_API_KEY ||
    DEFAULT_TMDB_KEY;

  const isSerie = type === "series";
  const primaryEndpoint = isSerie ? "search/tv" : "search/movie";

  const buildTmdbUrl = (endpoint: string, queryParams: Record<string, string>) => {
    const url = new URL(`https://api.themoviedb.org/3/${endpoint}`);
    url.searchParams.set("language", "pt-BR");
    url.searchParams.set("include_adult", "false");

    if (!rawKey.startsWith("ey")) {
      url.searchParams.set("api_key", rawKey);
    }

    for (const [k, v] of Object.entries(queryParams)) {
      if (v) url.searchParams.set(k, v);
    }

    const headers: Record<string, string> = { Accept: "application/json" };
    if (rawKey.startsWith("ey")) {
      headers["Authorization"] = `Bearer ${rawKey}`;
    }

    return { urlString: url.toString(), headers };
  };

  try {
    // 1. Primeira tentativa: com ano (se houver)
    const initialParams: Record<string, string> = { query: cleanTitle };
    if (year) {
      if (isSerie) initialParams.first_air_date_year = year;
      else initialParams.year = year;
    }

    const { urlString, headers } = buildTmdbUrl(primaryEndpoint, initialParams);
    let tmdbRes = await fetch(urlString, { headers, next: { revalidate: 86400 } });
    let data = await tmdbRes.json();

    // 2. Segunda tentativa: se falhou com o ano, busca sem restrição de ano
    if ((!data.results || data.results.length === 0) && year) {
      const fallback = buildTmdbUrl(primaryEndpoint, { query: cleanTitle });
      tmdbRes = await fetch(fallback.urlString, { headers: fallback.headers, next: { revalidate: 86400 } });
      data = await tmdbRes.json();
    }

    // 3. Terceira tentativa: busca multi caso o tipo tenha sido invertido no M3U
    if (!data.results || data.results.length === 0) {
      const multi = buildTmdbUrl("search/multi", { query: cleanTitle });
      tmdbRes = await fetch(multi.urlString, { headers: multi.headers, next: { revalidate: 86400 } });
      data = await tmdbRes.json();
    }

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({
        found: false,
        title: cleanTitle,
        overview: "Sinopse ainda não cadastrada para este título.",
      });
    }

    const item = data.results[0];

    // Se a sinopse em pt-BR estiver vazia, tenta pegar detalhes adicionais
    let overview = item.overview?.trim() || "";
    let genres: string[] = [];

    // Busca detalhes do item (gêneros e sinopse completa)
    if (item.id) {
      try {
        const mediaType = item.media_type || (isSerie ? "tv" : "movie");
        const detailsReq = buildTmdbUrl(`${mediaType}/${item.id}`, {});
        const detailsRes = await fetch(detailsReq.urlString, {
          headers: detailsReq.headers,
          next: { revalidate: 86400 },
        });

        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          if (detailsData.overview && !overview) {
            overview = detailsData.overview;
          }
          if (Array.isArray(detailsData.genres)) {
            genres = detailsData.genres
              .map((g: { id: number; name: string }) => g.name)
              .filter(Boolean);
          }
        }
      } catch (detailsErr) {
        console.warn("Falha ao buscar detalhes adicionais no TMDB:", detailsErr);
      }
    }

    return NextResponse.json(
      {
        found: true,
        title: item.title || item.name || cleanTitle,
        originalTitle: item.original_title || item.original_name || null,
        overview:
          overview ||
          "Sinopse oficial não encontrada em português. Aproveite para assistir e conferir este lançamento completo em qualidade 4K!",
        rating: typeof item.vote_average === "number" ? Number(item.vote_average.toFixed(1)) : null,
        voteCount: item.vote_count || null,
        releaseDate: item.release_date || item.first_air_date || null,
        genres,
        posterPath: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        backdropPath: item.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
          : null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        },
      }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro na rota TMDB:", err);
    return NextResponse.json(
      {
        found: false,
        error: err?.message || "Erro ao consultar TMDB",
        overview: "Não foi possível carregar a sinopse no momento.",
      },
      { status: 500 }
    );
  }
}
