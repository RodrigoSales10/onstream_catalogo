-- ==============================================================================
-- MIGRATION: 20260927_cron_futebol.sql
-- Descrição: Agendamento automático diário às 01:00 da manhã (Horário de Brasília)
-- Projeto: onstream_catalogo (siooqwcxgmilrtnolyoc)
-- ==============================================================================

-- 1. Remoção de agendamentos anteriores
SELECT cron.unschedule('futebol-agenda-hourly') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'futebol-agenda-hourly'
);
SELECT cron.unschedule('futebol-agenda-meia-noite-brt') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'futebol-agenda-meia-noite-brt'
);
SELECT cron.unschedule('futebol-agenda-1am-brt') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'futebol-agenda-1am-brt'
);
SELECT cron.unschedule('futebol-imagens-5min') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'futebol-imagens-5min'
);
SELECT cron.unschedule('futebol-imagens-1am-brt') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'futebol-imagens-1am-brt'
);

-- ==============================================================================
-- 2. Agendamento Diário da Agenda de Jogos às 01:00 BRT (04:00 UTC)
--
-- FUSO HORÁRIO:
-- O pg_cron do Supabase opera nativamente em UTC (GMT+0).
-- 01:00 da manhã no Horário Oficial de Brasília (UTC-3) corresponde a 04:00 em UTC.
-- Expressão Cron: '0 4 * * *' (Todo dia às 04:00 UTC = 01:00 BRT).
-- ==============================================================================
SELECT cron.schedule(
    'futebol-agenda-1am-brt',
    '0 4 * * *',
    $$
    SELECT net.http_get(
        url := 'https://siooqwcxgmilrtnolyoc.supabase.co/functions/v1/sync-futebol-agenda?dia=hoje',
        headers := jsonb_build_object(
            'Accept', 'application/json',
            'User-Agent', 'Supabase-Cron/1.0',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb29xd2N4Z21pbHJ0bm9seW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDIxMTc5OSwiZXhwIjoyMTA1Nzg3Nzk5fQ.CHK_OtTquEzePL4-dybsctFdrmry4SqedEA-YlkngvA',
            'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb29xd2N4Z21pbHJ0bm9seW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDIxMTc5OSwiZXhwIjoyMTA1Nzg3Nzk5fQ.CHK_OtTquEzePL4-dybsctFdrmry4SqedEA-YlkngvA'
        )
    );
    $$
);

-- ==============================================================================
-- 3. Agendamento do Download de Escudos para o Storage às 01:05 BRT (04:05 UTC)
--
-- Executa 5 minutos após a raspagem da agenda para transferir todos os novos escudos
-- pendentes para o bucket público 'futebol-assets'.
-- Expressão Cron: '5 4 * * *' (Todo dia às 04:05 UTC = 01:05 BRT).
-- ==============================================================================
SELECT cron.schedule(
    'futebol-imagens-1am-brt',
    '5 4 * * *',
    $$
    SELECT net.http_get(
        url := 'https://siooqwcxgmilrtnolyoc.supabase.co/functions/v1/sync-futebol-imagens',
        headers := jsonb_build_object(
            'Accept', 'application/json',
            'User-Agent', 'Supabase-Cron/1.0',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb29xd2N4Z21pbHJ0bm9seW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDIxMTc5OSwiZXhwIjoyMTA1Nzg3Nzk5fQ.CHK_OtTquEzePL4-dybsctFdrmry4SqedEA-YlkngvA',
            'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb29xd2N4Z21pbHJ0bm9seW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDIxMTc5OSwiZXhwIjoyMTA1Nzg3Nzk5fQ.CHK_OtTquEzePL4-dybsctFdrmry4SqedEA-YlkngvA'
        )
    );
    $$
);
