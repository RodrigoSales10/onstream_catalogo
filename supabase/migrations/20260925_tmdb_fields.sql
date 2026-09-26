-- ==============================================================================
-- ADIÇÃO DE CAMPOS DO TMDB PARA ENRIQUECIMENTO DE SÉRIES E FILMES
-- ==============================================================================

ALTER TABLE catalogo_itens
  ADD COLUMN IF NOT EXISTS sinopse TEXT,
  ADD COLUMN IF NOT EXISTS genero_principal VARCHAR(100),
  ADD COLUMN IF NOT EXISTS generos TEXT[],
  ADD COLUMN IF NOT EXISTS capa_tmdb TEXT,
  ADD COLUMN IF NOT EXISTS backdrop_tmdb TEXT,
  ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
  ADD COLUMN IF NOT EXISTS tmdb_rating NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS tmdb_sincronizado_em TIMESTAMPTZ;

-- Comentários descritivos das novas colunas
COMMENT ON COLUMN catalogo_itens.sinopse IS 'Sinopse oficial retornada pelo TMDB em português (pt-BR)';
COMMENT ON COLUMN catalogo_itens.genero_principal IS 'Primeiro gênero para filtragem e categorização rápida';
COMMENT ON COLUMN catalogo_itens.generos IS 'Lista completa de gêneros associados ao título';
COMMENT ON COLUMN catalogo_itens.capa_tmdb IS 'URL da capa de alta resolução no TMDB (w500)';
COMMENT ON COLUMN catalogo_itens.backdrop_tmdb IS 'URL do banner widescreen no TMDB (w1280)';
COMMENT ON COLUMN catalogo_itens.tmdb_id IS 'ID numérico oficial do título no The Movie Database';
COMMENT ON COLUMN catalogo_itens.tmdb_rating IS 'Nota média de avaliação do público no TMDB (ex: 8.4)';
COMMENT ON COLUMN catalogo_itens.tmdb_sincronizado_em IS 'Data/hora em que a busca foi realizada no TMDB';

-- Índice parcial para a fila de enriquecimento
CREATE INDEX IF NOT EXISTS idx_catalogo_itens_tmdb_sync
  ON catalogo_itens (tipo, ano DESC NULLS LAST, id DESC)
  WHERE tmdb_sincronizado_em IS NULL;

-- Índice para filtro por gênero principal
CREATE INDEX IF NOT EXISTS idx_catalogo_itens_genero
  ON catalogo_itens (genero_principal);
