-- ==============================================================================
-- MIGRATION: 20260927_futebol_schema.sql
-- Descrição: Estrutura relacional para a base de futebol, escudos e transmissões
-- Projeto: onstream_catalogo (siooqwcxgmilrtnolyoc)
-- ==============================================================================

-- 1. TABELA: futebol_times
CREATE TABLE IF NOT EXISTS public.futebol_times (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    nome_normalizado TEXT NOT NULL,
    slug TEXT,
    fonte_id TEXT UNIQUE,
    url_origem TEXT,
    escudo_url_origem TEXT,
    escudo_storage_path TEXT,
    status_imagem TEXT DEFAULT 'pendente' CHECK (status_imagem IN ('pendente', 'processado', 'falha', 'sem_imagem')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_futebol_times_nome_norm ON public.futebol_times (nome_normalizado);
CREATE INDEX IF NOT EXISTS idx_futebol_times_fonte_id ON public.futebol_times (fonte_id);
CREATE INDEX IF NOT EXISTS idx_futebol_times_status_img ON public.futebol_times (status_imagem) WHERE status_imagem = 'pendente';

-- 2. TABELA: futebol_ligas
CREATE TABLE IF NOT EXISTS public.futebol_ligas (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    nome_normalizado TEXT NOT NULL,
    slug TEXT,
    fonte_id TEXT UNIQUE,
    url_origem TEXT,
    logo_url_origem TEXT,
    logo_storage_path TEXT,
    status_imagem TEXT DEFAULT 'pendente' CHECK (status_imagem IN ('pendente', 'processado', 'falha', 'sem_imagem')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_futebol_ligas_nome_norm ON public.futebol_ligas (nome_normalizado);
CREATE INDEX IF NOT EXISTS idx_futebol_ligas_fonte_id ON public.futebol_ligas (fonte_id);

-- 3. TABELA: futebol_canais
CREATE TABLE IF NOT EXISTS public.futebol_canais (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    nome_normalizado TEXT NOT NULL UNIQUE,
    logo_url_origem TEXT,
    logo_storage_path TEXT,
    status_imagem TEXT DEFAULT 'pendente' CHECK (status_imagem IN ('pendente', 'processado', 'falha', 'sem_imagem')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_futebol_canais_nome_norm ON public.futebol_canais (nome_normalizado);

-- 4. TABELA: futebol_jogos
CREATE TABLE IF NOT EXISTS public.futebol_jogos (
    id BIGSERIAL PRIMARY KEY,
    fonte_id TEXT NOT NULL UNIQUE,
    url_origem TEXT NOT NULL,
    time_casa_id BIGINT NOT NULL REFERENCES public.futebol_times(id) ON DELETE RESTRICT,
    time_fora_id BIGINT NOT NULL REFERENCES public.futebol_times(id) ON DELETE RESTRICT,
    liga_id BIGINT REFERENCES public.futebol_ligas(id) ON DELETE SET NULL,
    data_hora TIMESTAMPTZ NOT NULL,
    data_jogo DATE NOT NULL,
    hora_jogo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'ao_vivo', 'finalizado', 'cancelado')),
    placar_casa INTEGER,
    placar_fora INTEGER,
    descricao TEXT,
    coletado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_futebol_jogos_data_jogo ON public.futebol_jogos (data_jogo);
CREATE INDEX IF NOT EXISTS idx_futebol_jogos_data_hora ON public.futebol_jogos (data_hora);
CREATE INDEX IF NOT EXISTS idx_futebol_jogos_time_casa ON public.futebol_jogos (time_casa_id);
CREATE INDEX IF NOT EXISTS idx_futebol_jogos_time_fora ON public.futebol_jogos (time_fora_id);
CREATE INDEX IF NOT EXISTS idx_futebol_jogos_liga_id ON public.futebol_jogos (liga_id);
CREATE INDEX IF NOT EXISTS idx_futebol_jogos_status ON public.futebol_jogos (status);

-- 5. TABELA ASSOCIATIVA: futebol_jogo_canais (Transmissões)
CREATE TABLE IF NOT EXISTS public.futebol_jogo_canais (
    jogo_id BIGINT NOT NULL REFERENCES public.futebol_jogos(id) ON DELETE CASCADE,
    canal_id BIGINT NOT NULL REFERENCES public.futebol_canais(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (jogo_id, canal_id)
);

CREATE INDEX IF NOT EXISTS idx_futebol_jogo_canais_canal ON public.futebol_jogo_canais (canal_id);

-- 6. TABELA: futebol_sync_logs (Histórico de execuções da raspagem)
CREATE TABLE IF NOT EXISTS public.futebol_sync_logs (
    id BIGSERIAL PRIMARY KEY,
    rotina TEXT NOT NULL,
    iniciado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finalizado_em TIMESTAMPTZ,
    duracao_ms INTEGER,
    total_jogos INTEGER DEFAULT 0,
    total_imagens INTEGER DEFAULT 0,
    status TEXT NOT NULL,
    mensagem_erro TEXT,
    detalhes JSONB
);

CREATE INDEX IF NOT EXISTS idx_futebol_sync_logs_rotina ON public.futebol_sync_logs (rotina, iniciado_em DESC);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.futebol_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.futebol_ligas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.futebol_canais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.futebol_jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.futebol_jogo_canais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.futebol_sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "futebol_times_public_read" ON public.futebol_times;
    CREATE POLICY "futebol_times_public_read" ON public.futebol_times FOR SELECT TO anon, authenticated USING (true);

    DROP POLICY IF EXISTS "futebol_ligas_public_read" ON public.futebol_ligas;
    CREATE POLICY "futebol_ligas_public_read" ON public.futebol_ligas FOR SELECT TO anon, authenticated USING (true);

    DROP POLICY IF EXISTS "futebol_canais_public_read" ON public.futebol_canais;
    CREATE POLICY "futebol_canais_public_read" ON public.futebol_canais FOR SELECT TO anon, authenticated USING (true);

    DROP POLICY IF EXISTS "futebol_jogos_public_read" ON public.futebol_jogos;
    CREATE POLICY "futebol_jogos_public_read" ON public.futebol_jogos FOR SELECT TO anon, authenticated USING (true);

    DROP POLICY IF EXISTS "futebol_jogo_canais_public_read" ON public.futebol_jogo_canais;
    CREATE POLICY "futebol_jogo_canais_public_read" ON public.futebol_jogo_canais FOR SELECT TO anon, authenticated USING (true);
END $$;

-- Permissões explícitas no schema public para os papéis anon e authenticated
GRANT SELECT ON public.futebol_times TO anon, authenticated;
GRANT SELECT ON public.futebol_ligas TO anon, authenticated;
GRANT SELECT ON public.futebol_canais TO anon, authenticated;
GRANT SELECT ON public.futebol_jogos TO anon, authenticated;
GRANT SELECT ON public.futebol_jogo_canais TO anon, authenticated;

-- ==============================================================================
-- 8. STORAGE BUCKET: futebol-assets
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'futebol-assets',
    'futebol-assets',
    true,
    2097152, -- 2 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

-- Políticas de Storage para futebol-assets
DO $$
BEGIN
    DROP POLICY IF EXISTS "futebol_assets_public_read" ON storage.objects;
    CREATE POLICY "futebol_assets_public_read" ON storage.objects
        FOR SELECT TO anon, authenticated
        USING (bucket_id = 'futebol-assets');
END $$;
