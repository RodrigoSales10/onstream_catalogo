-- ==============================================================================
-- MIGRATION: 20260927_cron_futebol.sql
-- Descrição: Agendamento automático via pg_cron e pg_net para o Futebol na TV
-- Projeto: onstream_catalogo (siooqwcxgmilrtnolyoc)
-- ==============================================================================

-- 1. Agendamento da Agenda (A cada 1 hora no minuto 15)
-- Consulta ontem, hoje e amanhã e atualiza partidas, times, ligas e transmissões
SELECT cron.unschedule('futebol-agenda-hourly') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'futebol-agenda-hourly'
);

SELECT cron.schedule(
    'futebol-agenda-hourly',
    '15 * * * *',
    $$
    SELECT net.http_get(
        url := 'https://siooqwcxgmilrtnolyoc.supabase.co/functions/v1/sync-futebol-agenda?dia=todos',
        headers := '{"Accept": "application/json", "User-Agent": "Supabase-Cron/1.0"}'::jsonb
    );
    $$
);

-- 2. Agendamento do Processador de Imagens (A cada 5 minutos)
-- Processa lotes de até 20 escudos pendentes com upload para o bucket futebol-assets
SELECT cron.unschedule('futebol-imagens-5min') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'futebol-imagens-5min'
);

SELECT cron.schedule(
    'futebol-imagens-5min',
    '*/5 * * * *',
    $$
    SELECT net.http_get(
        url := 'https://siooqwcxgmilrtnolyoc.supabase.co/functions/v1/sync-futebol-imagens',
        headers := '{"Accept": "application/json", "User-Agent": "Supabase-Cron/1.0"}'::jsonb
    );
    $$
);
