import {
  CatalogApiResponse,
  CatalogItem,
  CatalogQueryParams,
  ContentType,
  RawCatalogItem,
  SerieItem,
  FilmeItem,
  CanalItem,
} from "@/types/catalog";

const DEFAULT_API_URL = "https://onstream.rstibahia.com.br/api_catalogo_publico.php";

/**
 * Normaliza URLs de imagem para garantir HTTPS e caminhos absolutos
 */
export function sanitizePosterUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;

  // Upgrade TMDB and remote http to https
  if (trimmed.startsWith("http://image.tmdb.org/")) {
    return trimmed.replace("http://image.tmdb.org/", "https://image.tmdb.org/");
  }

  // Se for caminho relativo legado do servidor IPTV, prefixa com a URL do ERP
  if (trimmed.startsWith("imagens/") || trimmed.startsWith("/imagens/")) {
    const cleanPath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
    return `https://onstream.rstibahia.com.br/${cleanPath}`;
  }

  return trimmed;
}

/**
 * Normaliza qualquer item retornado pelo MariaDB para a interface unificada de Card
 */
export function normalizeToCatalogItem(
  item: RawCatalogItem,
  type: ContentType
): CatalogItem {
  const poster = sanitizePosterUrl(item.logo_url);

  if (type === "series") {
    const serie = item as SerieItem;
    const title = serie.nome_serie || serie.nome || "Série sem título";
    const cleanCategory = (serie.grupo || "SÉRIES").replace(/^SÉRIES:\s*/i, "").trim() || "SÉRIES";
    return {
      id: serie.id || `${type}-${title}`,
      title,
      posterUrl: poster,
      category: cleanCategory,
      episodeCount: typeof serie.total_episodios === "number" ? serie.total_episodios : 0,
      type: "series",
      createdAt: serie.criado_em || new Date().toISOString(),
    };
  }

  if (type === "filmes") {
    const filme = item as FilmeItem;
    const title = filme.nome || "Filme sem título";
    const cleanCategory = (filme.grupo || "FILMES").replace(/^FILMES:\s*/i, "").trim() || "FILMES";
    return {
      id: filme.id || `${type}-${title}`,
      title,
      posterUrl: poster,
      category: cleanCategory,
      year: filme.ano || null,
      type: "filmes",
      createdAt: filme.criado_em || new Date().toISOString(),
    };
  }

  // canais
  const canal = item as CanalItem;
  const title = canal.nome || "Canal sem título";
  const cleanCategory = (canal.grupo || "CANAIS").replace(/^CANAIS:\s*/i, "").trim() || "CANAIS";
  return {
    id: canal.id || `${type}-${title}`,
    title,
    posterUrl: poster,
    category: cleanCategory,
    type: "canais",
    createdAt: canal.criado_em || new Date().toISOString(),
  };
}

import { supabase } from "@/lib/supabaseClient";

/**
 * Consulta o catálogo diretamente no Supabase Postgres
 */
interface FilterRpcResult {
  grupos?: string[];
  anos?: (string | number)[];
}

/**
 * Consulta o catálogo diretamente no Supabase Postgres
 */
async function fetchFromSupabase(
  params: CatalogQueryParams
): Promise<CatalogApiResponse<CatalogItem>> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 36));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let sortCol = params.sort_by || "criado_em";
  let ascending = params.sort_dir === "asc";

  const ENRICHED_COLUMNS =
    "id, tipo, nome, ano, logo_url, grupo, total_episodios, criado_em, sinopse, genero_principal, generos, capa_tmdb, backdrop_tmdb, tmdb_rating, tmdb_id";
  const BASIC_COLUMNS =
    "id, tipo, nome, ano, logo_url, grupo, total_episodios, criado_em";

  const buildQuery = (columns: string) => {
    let q = supabase
      .from("catalogo_itens")
      .select(columns, { count: "exact" })
      .eq("tipo", params.type);

    if (params.search && params.search.trim()) {
      q = q.ilike("nome", `%${params.search.trim()}%`);
    }

    if (params.filter_grupo && params.filter_grupo.trim()) {
      q = q.eq("grupo", params.filter_grupo.trim());
    }

    if (params.filter_ano && params.filter_ano.trim()) {
      const anoNum = parseInt(params.filter_ano.trim(), 10);
      if (!isNaN(anoNum)) {
        q = q.eq("ano", anoNum);
      }
    }

    // Lógica de Ordenação
    if (params.type === "canais") {
      // Canais normais primeiro (is_adult = false), conteúdo adulto (is_adult = true) estritamente no final
      q = q.order("is_adult", { ascending: true });

      if (params.sort_by === "nome") {
        q = q.order("nome", { ascending });
      } else {
        q = q.order("nome", { ascending: true });
      }
    } else if (params.type === "filmes") {
      // Filmes: prioriza lançamentos do ano atual / mais recente no topo, desempatando por inserção recente
      if (!params.sort_by || params.sort_by === "criado_em") {
        sortCol = "ano";
        ascending = false;
        q = q
          .order("ano", { ascending: false, nullsFirst: false })
          .order("criado_em", { ascending: false })
          .order("id", { ascending: false });
      } else if (params.sort_by === "ano") {
        q = q
          .order("ano", { ascending, nullsFirst: false })
          .order("id", { ascending: false });
      } else {
        q = q.order("nome", { ascending });
      }
    } else {
      // Séries: prioriza lançamentos do ano atual / mais recente no topo, desempatando por inserção recente
      if (!params.sort_by || params.sort_by === "criado_em") {
        sortCol = "ano";
        ascending = false;
        q = q
          .order("ano", { ascending: false, nullsFirst: false })
          .order("criado_em", { ascending: false })
          .order("id", { ascending: false });
      } else {
        q = q.order(params.sort_by, { ascending });
      }
    }

    return q.range(from, to);
  };

  // Tenta primeiro buscar com as colunas enriquecidas do TMDB
  const [initialDataResult, filtersResult] = await Promise.all([
    buildQuery(ENRICHED_COLUMNS),
    supabase.rpc("get_catalog_filters", { p_tipo: params.type }),
  ]);
  let dataResult = initialDataResult;

  // Se falhar por as colunas novas ainda não existirem na tabela, faz fallback para as colunas básicas
  if (
    dataResult.error &&
    (dataResult.error.message?.includes("sinopse") ||
      dataResult.error.code === "PGRST204" ||
      dataResult.error.code === "42703")
  ) {
    dataResult = await buildQuery(BASIC_COLUMNS);
  }

  if (dataResult.error) {
    throw dataResult.error;
  }

  const totalRecords = dataResult.count || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  // Mapeamento com hierarquia de capas e metadados TMDB
  const rawRows = (dataResult.data as unknown as Record<string, unknown>[]) || [];
  const normalizedData: CatalogItem[] = rawRows.map((row) => {
    const rawGrupo = typeof row.grupo === "string" ? row.grupo : "";
    const cleanCategory =
      rawGrupo
        .replace(/^(FILMES|CANAIS|SÉRIES):\s*/i, "")
        .trim() || "Geral";

    const tipo = (typeof row.tipo === "string" ? row.tipo : "filmes") as ContentType;
    let poster = sanitizePosterUrl(typeof row.logo_url === "string" ? row.logo_url : null);
    const capaTmdb = sanitizePosterUrl(typeof row.capa_tmdb === "string" ? row.capa_tmdb : null);

    if (tipo === "series") {
      // Hierarquia para Séries:
      // 1. Capa oficial do TMDB em alta resolução (se encontrada)
      // 2. logo_url original (se não for o placeholder genérico 150466.jpg)
      // 3. Fallback genérico visual da UI OnStream
      if (capaTmdb) {
        poster = capaTmdb;
      } else if (poster && poster.includes("150466.jpg")) {
        poster = null;
      }
    } else if (tipo === "filmes") {
      // Hierarquia para Filmes:
      // 1. logo_url original existente
      // 2. Capa do TMDB caso logo_url seja nulo/inválido
      if (!poster && capaTmdb) {
        poster = capaTmdb;
      }
    }

    return {
      id: (row.id as string | number) || 0,
      title: typeof row.nome === "string" ? row.nome : "Sem título",
      posterUrl: poster,
      backdropUrl: sanitizePosterUrl(typeof row.backdrop_tmdb === "string" ? row.backdrop_tmdb : null),
      category: cleanCategory,
      year: (row.ano as number | string | null) || null,
      episodeCount: typeof row.total_episodios === "number" ? row.total_episodios : 0,
      type: tipo,
      createdAt: typeof row.criado_em === "string" ? row.criado_em : new Date().toISOString(),
      synopsis: typeof row.sinopse === "string" ? row.sinopse : null,
      mainGenre: typeof row.genero_principal === "string" ? row.genero_principal : null,
      genres: Array.isArray(row.generos) ? (row.generos as string[]) : null,
      tmdbRating: typeof row.tmdb_rating === "number" ? row.tmdb_rating : null,
      tmdbId: typeof row.tmdb_id === "number" ? row.tmdb_id : null,
    };
  });

  const filterData = (filtersResult.data as FilterRpcResult) || { grupos: [], anos: [] };
  const cleanGrupos = (filterData.grupos || [])
    .map((g: string) => g.replace(/^(FILMES|CANAIS|SÉRIES):\s*/i, "").trim())
    .filter((g: string) => g && g !== "ERROR" && g !== "DEMO");

  const uniqueGrupos = Array.from(new Set(cleanGrupos)) as string[];

  // Garante que categorias adultas (XXX, etc.) fiquem sempre no final da lista de filtros
  const isAdultCategory = (cat: string) =>
    /xxx|adult|playboy|sexy|sextreme|venus|hot|for man/i.test(cat);

  const normalGrupos = uniqueGrupos.filter((g) => !isAdultCategory(g));
  const adultGrupos = uniqueGrupos.filter((g) => isAdultCategory(g));
  const orderedGrupos = [...normalGrupos, ...adultGrupos];

  return {
    total_records: totalRecords,
    total_pages: totalPages,
    current_page: page,
    limit,
    data: normalizedData,
    filters: {
      grupos: orderedGrupos,
      anos: filterData.anos || [],
    },
    sort: {
      by: sortCol,
      dir: ascending ? "asc" : "desc",
    },
  };
}

/**
 * Consulta a API de catálogo com fallback automático
 */
export async function fetchCatalog(
  params: CatalogQueryParams
): Promise<CatalogApiResponse<CatalogItem>> {
  try {
    // 1. Tenta buscar prioritariamente no Supabase Postgres
    return await fetchFromSupabase(params);
  } catch (supabaseError) {
    console.warn("Falha ao consultar Supabase, tentando API de fallback:", supabaseError);
  }

  // 2. Fallback para o endpoint HTTP legado
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  const urlParams = new URLSearchParams();
  urlParams.set("type", params.type);
  urlParams.set("page", String(params.page || 1));
  urlParams.set("limit", String(params.limit || 36));

  if (params.search && params.search.trim()) {
    urlParams.set("search", params.search.trim());
  }
  if (params.filter_grupo && params.filter_grupo.trim()) {
    urlParams.set("filter_grupo", params.filter_grupo.trim());
  }
  if (params.filter_ano && params.filter_ano.trim()) {
    urlParams.set("filter_ano", params.filter_ano.trim());
  }
  if (params.sort_by) {
    urlParams.set("sort_by", params.sort_by);
  } else if (params.type === "filmes" || params.type === "series") {
    urlParams.set("sort_by", "ano");
  }

  if (params.sort_dir) {
    urlParams.set("sort_dir", params.sort_dir);
  } else if (params.type === "filmes" || params.type === "series") {
    urlParams.set("sort_dir", "desc");
  }

  const requestUrl = `${apiUrl}?${urlParams.toString()}`;

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (process.env.CATALOGO_API_KEY) {
      headers["X-Catalog-Key"] = process.env.CATALOGO_API_KEY;
    }

    const res = await fetch(requestUrl, {
      method: "GET",
      headers,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`API retornou status HTTP ${res.status}`);
    }

    const json: CatalogApiResponse<RawCatalogItem> = await res.json();
    const normalizedData: CatalogItem[] = (json.data || []).map((raw) =>
      normalizeToCatalogItem(raw, params.type)
    );

    const cleanGrupos = (json.filters?.grupos || [])
      .map((g) => g.replace(/^(FILMES|CANAIS|SÉRIES):\s*/i, "").trim())
      .filter((g) => g && g !== "ERROR" && g !== "DEMO");

    const uniqueFallbackGrupos = Array.from(new Set(cleanGrupos)) as string[];
    const isAdult = (cat: string) =>
      /xxx|adult|playboy|sexy|sextreme|venus|hot|for man/i.test(cat);

    const orderedFallbackGrupos = [
      ...uniqueFallbackGrupos.filter((g) => !isAdult(g)),
      ...uniqueFallbackGrupos.filter((g) => isAdult(g)),
    ];

    return {
      total_records: json.total_records || 0,
      total_pages: json.total_pages || 0,
      current_page: json.current_page || 1,
      limit: json.limit || 36,
      data: normalizedData,
      filters: {
        grupos: orderedFallbackGrupos,
        anos: json.filters?.anos || [],
      },
      sort: json.sort || { by: "criado_em", dir: "desc" },
    };
  } catch (error) {
    console.error("Erro ao buscar catálogo em todas as fontes:", error);
    return {
      total_records: 0,
      total_pages: 0,
      current_page: params.page || 1,
      limit: params.limit || 36,
      data: [],
      filters: { grupos: [], anos: [] },
      sort: { by: "criado_em", dir: "desc" },
    };
  }
}

/**
 * Constrói a URL do WhatsApp para acionar o Agente Max com mensagem contextual
 */
export function buildWhatsAppLink(title?: string, type?: ContentType): string {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5571983831369";
  let message = "Olá Max! Estou vendo o catálogo OnStream e quero liberar meu teste grátis de 6 horas!";

  if (title) {
    const typeLabel = type === "filmes" ? "o filme" : type === "series" ? "a série" : "o canal";
    message = `Olá Max! Vi ${typeLabel} "${title}" no catálogo e quero liberar meu teste grátis de 6 horas!`;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
