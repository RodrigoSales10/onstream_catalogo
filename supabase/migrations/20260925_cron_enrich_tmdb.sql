-- ==============================================================================
-- AGENDAMENTO AUTOMÁTICO DO ENRIQUECIMENTO TMDB (PG_CRON + PG_NET)
-- ==============================================================================
-- Dispara a Edge Function 'enrich-tmdb' periodicamente para processar
-- automaticamente os novos itens (filmes e séries) inseridos no catálogo.

-- 1. Garante que as extensões necessárias estão ativas
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 2. Remove agendamento anterior se houver
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'enrich-tmdb-auto') THEN
        PERFORM cron.unschedule('enrich-tmdb-auto');
    END IF;
END $$;

-- 3. Agenda o disparo a cada 30 minutos
-- Se não houver itens pendentes, a Edge Function responde em < 100ms e encerra
SELECT cron.schedule(
    'enrich-tmdb-auto',
    '*/30 * * * *',
    $$
    SELECT net.http_get(
        url := 'https://siooqwcxgmilrtnolyoc.supabase.co/functions/v1/enrich-tmdb?limit=50&tipo=todos',
        headers := '{"Accept": "application/json", "User-Agent": "Supabase-Cron/1.0"}'::jsonb
    );
    $$
);
