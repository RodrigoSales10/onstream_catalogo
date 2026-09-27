import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Carrega .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://siooqwcxgmilrtnolyoc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function limparFutebol() {
  console.log("🧹 Iniciando limpeza das tabelas de futebol no Supabase...");

  // 1. futebol_jogo_canais
  const { error: errCanais, count: countCanais } = await supabase
    .from("futebol_jogo_canais")
    .delete()
    .neq("jogo_id", 0);
  if (errCanais) console.error("Erro ao limpar futebol_jogo_canais:", errCanais.message);
  else console.log("✅ futebol_jogo_canais limpo com sucesso.");

  // 2. futebol_jogos
  const { error: errJogos } = await supabase
    .from("futebol_jogos")
    .delete()
    .neq("id", 0);
  if (errJogos) console.error("Erro ao limpar futebol_jogos:", errJogos.message);
  else console.log("✅ futebol_jogos limpo com sucesso.");

  // 3. futebol_sync_logs
  const { error: errLogs } = await supabase
    .from("futebol_sync_logs")
    .delete()
    .neq("id", 0);
  if (errLogs) console.error("Erro ao limpar futebol_sync_logs:", errLogs.message);
  else console.log("✅ futebol_sync_logs limpo com sucesso.");

  // 4. futebol_times
  const { error: errTimes } = await supabase
    .from("futebol_times")
    .delete()
    .neq("id", 0);
  if (errTimes) console.error("Erro ao limpar futebol_times:", errTimes.message);
  else console.log("✅ futebol_times limpo com sucesso.");

  // 5. futebol_ligas
  const { error: errLigas } = await supabase
    .from("futebol_ligas")
    .delete()
    .neq("id", 0);
  if (errLigas) console.error("Erro ao limpar futebol_ligas:", errLigas.message);
  else console.log("✅ futebol_ligas limpo com sucesso.");

  // 6. futebol_canais
  const { error: errCan } = await supabase
    .from("futebol_canais")
    .delete()
    .neq("id", 0);
  if (errCan) console.error("Erro ao limpar futebol_canais:", errCan.message);
  else console.log("✅ futebol_canais limpo com sucesso.");

  // 7. Verificar bucket futebol-assets
  const { data: buckets, error: errBuckets } = await supabase.storage.listBuckets();
  if (errBuckets) {
    console.error("⚠️ Erro ao listar buckets:", errBuckets.message);
  } else {
    const bucket = buckets.find(b => b.name === "futebol-assets");
    if (bucket) {
      console.log("✅ Bucket futebol-assets encontrado (público:", bucket.public, ")");
      // Listar arquivos no bucket
      const { data: filesTimes } = await supabase.storage.from("futebol-assets").list("times");
      console.log(`📁 Arquivos em futebol-assets/times: ${filesTimes?.length || 0}`);
    } else {
      console.log("⚠️ Bucket futebol-assets não encontrado. Criando bucket público...");
      const { error: createErr } = await supabase.storage.createBucket("futebol-assets", {
        public: true,
        fileSizeLimit: 2097152,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
      });
      if (createErr) console.error("Erro ao criar bucket:", createErr.message);
      else console.log("✅ Bucket futebol-assets criado com sucesso!");
    }
  }

  // 8. Contagem final de conferência
  const { count: cJogos } = await supabase.from("futebol_jogos").select("*", { count: "exact", head: true });
  const { count: cTimes } = await supabase.from("futebol_times").select("*", { count: "exact", head: true });
  const { count: cLigas } = await supabase.from("futebol_ligas").select("*", { count: "exact", head: true });
  const { count: cCanais } = await supabase.from("futebol_canais").select("*", { count: "exact", head: true });

  console.log(`\n📊 Status Atual das Tabelas de Futebol:`);
  console.log(` - Jogos: ${cJogos || 0}`);
  console.log(` - Times: ${cTimes || 0}`);
  console.log(` - Ligas: ${cLigas || 0}`);
  console.log(` - Canais: ${cCanais || 0}`);
  console.log(`\n✨ Banco limpo e 100% pronto para nova execução!`);
}

limparFutebol().catch(console.error);
