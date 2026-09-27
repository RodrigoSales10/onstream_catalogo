-- ==============================================================================
-- MIGRATION: 20260927_cron_futebol.sql
-- Descrição: Agendamento automático via pg_cron e pg_net para o Futebol na TV
-- Projeto: onstream_catalogo (siooqwcxgmilrtnolyoc)
-- ==============================================================================

-- 1. Agendamento da Agenda de Hoje (A cada 1 hora no minuto 15)
-- Observação sobre Fuso Horário:
-- O pg_cron do Supabase opera internamente em UTC (GMT+0).
-- O fuso oficial de Brasília é UTC-3 (America/Sao_Paulo).
-- A Edge Function 'sync-futebol-agenda' utiliza 'America/Sao_Paulo' para calcular o dia,
-- portanto qualquer disparo durante as 24 horas do dia cairá com exatidão na data de hoje de Brasília.
-- Além disso, às 03:05 UTC (00:05 Horário de Brasília), ocorre a primeira raspagem logo após a virada da meia-noite.

SELECT cron.unschedule('futebol-agenda-hourly') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'futebol-agenda-hourly'
);

SELECT cron.schedule(
    'futebol-agenda-hourly',
    '15 * * * *',
    $$
    SELECT net.http_get(
        url := 'https://siooqwcxgmilrtnolyoc.supabase.co/functions/v1/sync-futebol-agenda?dia=hoje',
        headers := '{"Accept": "application/json", "User-Agent": "Supabase-Cron/1.0"}'::jsonb
    );
    $$
);

-- Disparo específico às 00:05 de Brasília (03:05 UTC) para virada de dia
SELECT cron.unschedule('futebol-agenda-meia-noite-brt') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'futebol-agenda-meia-noite-brt'
);

SELECT cron.schedule(
    'futebol-agenda-meia-noite-brt',
    '5 3 * * *',
    $$
    SELECT net.http_get(
        url := 'https://siooqwcxgmilrtnolyoc.supabase.co/functions/v1/sync-futebol-agenda?dia=hoje',
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
