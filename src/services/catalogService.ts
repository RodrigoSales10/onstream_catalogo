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
async function fetchFromSupabase(
  params: CatalogQueryParams
): Promise<CatalogApiResponse<CatalogItem>> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 36));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("catalogo_itens")
    .select("id, tipo, nome, ano, logo_url, grupo, total_episodios, criado_em", {
      count: "exact",
    })
    .eq("tipo", params.type);

  if (params.search && params.search.trim()) {
    query = query.ilike("nome", `%${params.search.trim()}%`);
  }

  if (params.filter_grupo && params.filter_grupo.trim()) {
    query = query.eq("grupo", params.filter_grupo.trim());
  }

  if (params.filter_ano && params.filter_ano.trim()) {
    const anoNum = parseInt(params.filter_ano.trim(), 10);
    if (!isNaN(anoNum)) {
      query = query.eq("ano", anoNum);
    }
  }

  // Ordenação
  const sortCol =
    params.sort_by === "nome"
      ? "nome"
      : params.sort_by === "ano"
      ? "ano"
      : "criado_em";
  const ascending = params.sort_dir === "asc";

  query = query.order(sortCol, { ascending }).range(from, to);

  // Executa busca de dados e busca de filtros em paralelo
  const [dataResult, filtersResult] = await Promise.all([
    query,
    supabase.rpc("get_catalog_filters", { p_tipo: params.type }),
  ]);

  if (dataResult.error) {
    throw dataResult.error;
  }

  const totalRecords = dataResult.count || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  const normalizedData: CatalogItem[] = (dataResult.data || []).map((row) => {
    const cleanCategory =
      (row.grupo || "Geral")
        .replace(/^(FILMES|CANAIS|SÉRIES):\s*/i, "")
        .trim() || "Geral";

    return {
      id: row.id,
      title: row.nome,
      posterUrl: sanitizePosterUrl(row.logo_url),
      category: cleanCategory,
      year: row.ano,
      episodeCount: row.total_episodios || 0,
      type: row.tipo as ContentType,
      createdAt: row.criado_em,
    };
  });

  const filterData = (filtersResult.data as any) || { grupos: [], anos: [] };
  const cleanGrupos = (filterData.grupos || [])
    .map((g: string) => g.replace(/^(FILMES|CANAIS|SÉRIES):\s*/i, "").trim())
    .filter((g: string) => g && g !== "ERROR" && g !== "DEMO");

  const uniqueGrupos = Array.from(new Set(cleanGrupos)) as string[];

  return {
    total_records: totalRecords,
    total_pages: totalPages,
    current_page: page,
    limit,
    data: normalizedData,
    filters: {
      grupos: uniqueGrupos,
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
  if (params.sort_by) urlParams.set("sort_by", params.sort_by);
  if (params.sort_dir) urlParams.set("sort_dir", params.sort_dir);

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

    return {
      total_records: json.total_records || 0,
      total_pages: json.total_pages || 0,
      current_page: json.current_page || 1,
      limit: json.limit || 36,
      data: normalizedData,
      filters: {
        grupos: Array.from(new Set(cleanGrupos)),
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
