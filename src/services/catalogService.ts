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

/**
 * Consulta a API de catálogo público sanitizada
 */
export async function fetchCatalog(
  params: CatalogQueryParams
): Promise<CatalogApiResponse<CatalogItem>> {
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
  }

  if (params.sort_dir) {
    urlParams.set("sort_dir", params.sort_dir);
  }

  const requestUrl = `${apiUrl}?${urlParams.toString()}`;

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

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

    // Sanitiza e limpa filtros
    const cleanGrupos = (json.filters?.grupos || [])
      .map((g) => g.replace(/^(FILMES|CANAIS|SÉRIES):\s*/i, "").trim())
      .filter((g) => g && g !== "ERROR" && g !== "DEMO");

    const uniqueGrupos = Array.from(new Set(cleanGrupos));

    return {
      total_records: json.total_records || 0,
      total_pages: json.total_pages || 0,
      current_page: json.current_page || 1,
      limit: json.limit || 36,
      data: normalizedData,
      filters: {
        grupos: uniqueGrupos,
        anos: json.filters?.anos || [],
      },
      sort: json.sort || { by: "criado_em", dir: "desc" },
    };
  } catch (error) {
    console.error("Erro ao buscar catálogo:", error);
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
