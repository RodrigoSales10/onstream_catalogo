-- ==============================================================================
-- AUTOMAÇÃO DE SINCRONIZAÇÃO DIÁRIA (SUPABASE PG_CRON + PG_NET)
-- ==============================================================================
-- Agendamento diário para chamar a rotina PHP de sincronização do catálogo
-- Horário: 01:00 BRT (Horário de Brasília, UTC-3) = 04:00 UTC (GMT)

-- 1. Garante que as extensões estão ativas no schema extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 2. Remove agendamento anterior se houver
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-catalogo-diario') THEN
        PERFORM cron.unschedule('sync-catalogo-diario');
    END IF;
END $$;

-- 3. Agenda o disparo assíncrono via pg_net toda madrugada às 01:00 BRT (04:00 UTC)
SELECT cron.schedule(
    'sync-catalogo-diario',
    '0 4 * * *',
    $$
    SELECT net.http_get(
        url := 'https://onstream.rstibahia.com.br/api_sync_supabase.php?key=rsba1978',
        headers := '{"Accept": "application/json", "User-Agent": "Supabase-Cron/1.0"}'::jsonb
    );
    $$
);
