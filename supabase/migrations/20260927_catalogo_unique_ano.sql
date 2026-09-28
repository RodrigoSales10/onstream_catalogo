-- ==============================================================================
-- MIGRATION: 20260927_catalogo_unique_ano.sql
-- Descrição: Atualiza a constraint de unicidade de catalogo_itens para incluir o ano,
--            permitindo que títulos homônimos com anos de lançamento distintos
--            (como remakes, reboots e clássicos) coexistam no catálogo.
-- Projeto: onstream_catalogo (siooqwcxgmilrtnolyoc)
-- ==============================================================================

-- 1. Remove a constraint única anterior (que ignorava o ano e sobrescrevia homônimos)
ALTER TABLE public.catalogo_itens 
  DROP CONSTRAINT IF EXISTS uq_catalogo_itens;

-- 2. Adiciona a nova constraint com ano, suportando NULLS NOT DISTINCT (PG15+)
-- NULLS NOT DISTINCT assegura que canais e séries sem ano continuem sendo deduplicados
ALTER TABLE public.catalogo_itens 
  ADD CONSTRAINT uq_catalogo_itens 
  UNIQUE NULLS NOT DISTINCT (fonte_id, tipo, nome, grupo, ano);

-- 3. Atualiza comentário da constraint para documentação de arquitetura
COMMENT ON CONSTRAINT uq_catalogo_itens ON public.catalogo_itens IS 
  'Chave única composta considerando fonte, tipo, título, categoria e ano de lançamento (suporte a homônimos).';
