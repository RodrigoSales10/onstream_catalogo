/**
 * Tipos e Schemas do Catálogo OnStream
 * Conforme especificado em docs/spec/03-api-contract.md
 */

export type ContentType = 'canais' | 'filmes' | 'series' | 'favoritos';
export type SortDirection = 'asc' | 'desc';

export interface TmdbMetadata {
  found: boolean;
  title?: string;
  originalTitle?: string;
  overview?: string;
  rating?: number;
  voteCount?: number;
  releaseDate?: string;
  genres?: string[];
  posterPath?: string | null;
  backdropPath?: string | null;
}

export interface CanalItem {
  id: number;
  nome: string;
  logo_url: string | null;
  grupo: string | null;
  criado_em: string;
}

export interface FilmeItem {
  id: number;
  nome: string;
  ano: number | string | null;
  logo_url: string | null;
  grupo: string | null;
  criado_em: string;
}

export interface SerieItem {
  id: number;
  nome: string;
  nome_serie?: string;
  logo_url: string | null;
  grupo: string | null;
  total_episodios?: number;
  criado_em: string;
}

export type RawCatalogItem = CanalItem | FilmeItem | SerieItem;

/**
 * Modelo Unificado para renderização limpa e uniforme de cards na UI
 */
export interface CatalogItem {
  id: string | number;
  title: string;
  posterUrl: string | null;
  category: string;
  year?: string | number | null;
  episodeCount?: number;
  type: ContentType;
  createdAt: string;
}

export interface CatalogApiResponse<T = RawCatalogItem> {
  total_records: number;
  total_pages: number;
  current_page: number;
  limit: number;
  data: T[];
  filters: {
    grupos: string[];
    anos: (string | number)[];
  };
  sort: {
    by: string;
    dir: SortDirection;
  };
}

export interface CatalogQueryParams {
  type: ContentType;
  page?: number;
  limit?: number;
  search?: string;
  filter_grupo?: string;
  filter_ano?: string;
  sort_by?: string;
  sort_dir?: SortDirection;
}
