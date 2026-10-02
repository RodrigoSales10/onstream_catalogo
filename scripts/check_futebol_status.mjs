import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://siooqwcxgmilrtnolyoc.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb29xd2N4Z21pbHJ0bm9seW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDIxMTc5OSwiZXhwIjoyMTA1Nzg3Nzk5fQ.CHK_OtTquEzePL4-dybsctFdrmry4SqedEA-YlkngvA";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkFutebol() {
  console.log("=== 1. ÚLTIMOS LOGS DE SINCRONIZAÇÃO (futebol_sync_logs) ===");
  const { data: logs, error: errLogs } = await supabase
    .from("futebol_sync_logs")
    .select("*")
    .order("iniciado_em", { ascending: false })
    .limit(10);
  console.log("Logs:", JSON.stringify(logs, null, 2), errLogs);

  console.log("\n=== 2. JOGOS EXISTENTES NO BANCO (futebol_jogos) ===");
  const { data: jogos, error: errJogos } = await supabase
    .from("futebol_jogos")
    .select("id, fonte_id, data_jogo, hora_jogo, data_hora, status")
    .order("data_jogo", { ascending: false })
    .limit(20);
  console.log("Jogos:", JSON.stringify(jogos, null, 2), errJogos);

  // Contagem por data_jogo
  const { count: totalJogos } = await supabase
    .from("futebol_jogos")
    .select("*", { count: "exact", head: true });
  console.log(`Total geral de jogos no banco: ${totalJogos}`);
}

checkFutebol();
