import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
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
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://siooqwcxgmilrtnolyoc.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb29xd2N4Z21pbHJ0bm9seW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDIxMTc5OSwiZXhwIjoyMTA1Nzg3Nzk5fQ.CHK_OtTquEzePL4-dybsctFdrmry4SqedEA-YlkngvA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadAssetToStorage(folder, remoteUrl) {
  if (!remoteUrl || !remoteUrl.startsWith("http")) return null;

  try {
    const res = await fetch(remoteUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Referer": "https://www.futebolnatv.com.br/",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      console.warn(`  ⚠️ HTTP ${res.status} ao baixar imagem (${remoteUrl})`);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0 || buffer.length > 2097152) return null;

    const contentType = res.headers.get("content-type") || "image/png";
    let ext = "png";
    if (contentType.includes("jpeg") || remoteUrl.endsWith(".jpg") || remoteUrl.endsWith(".jpeg")) ext = "jpg";
    else if (contentType.includes("webp") || remoteUrl.endsWith(".webp")) ext = "webp";
    else if (contentType.includes("svg") || remoteUrl.endsWith(".svg")) ext = "svg";

    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    const storagePath = `${folder}/${hash}.${ext}`;

    const { error } = await supabase.storage.from("futebol-assets").upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.warn(`  ⚠️ Erro no storage upload (${storagePath}):`, error.message);
      return null;
    }

    return storagePath;
  } catch (err) {
    console.warn(`  ⚠️ Falha no download do asset (${remoteUrl}):`, err.message);
    return null;
  }
}

async function syncPendingTeamShields() {
  console.log("=== SINCRONIZAÇÃO DE ESCUDOS PENDENTES ===");

  // Busca todos os times que estão sem escudo_storage_path mas possuem escudo_url_origem
  const { data: timesPendentes, error } = await supabase
    .from("futebol_times")
    .select("id, nome, escudo_url_origem")
    .is("escudo_storage_path", null)
    .not("escudo_url_origem", "is", null);

  if (error) {
    console.error("Erro ao buscar times pendentes:", error);
    process.exit(1);
  }

  console.log(`Encontrados ${timesPendentes.length} times pendentes de escudo.`);

  let sucessos = 0;
  let falhas = 0;

  for (let i = 0; i < timesPendentes.length; i++) {
    const time = timesPendentes[i];
    console.log(`[${i + 1}/${timesPendentes.length}] Baixando escudo de ${time.nome}...`);

    const storagePath = await uploadAssetToStorage("times", time.escudo_url_origem);

    if (storagePath) {
      const { error: updateError } = await supabase
        .from("futebol_times")
        .update({
          escudo_storage_path: storagePath,
          status_imagem: "processado",
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", time.id);

      if (updateError) {
        console.error(`  ❌ Erro ao atualizar time ${time.nome}:`, updateError.message);
        falhas++;
      } else {
        console.log(`  ✅ Salvo: ${storagePath}`);
        sucessos++;
      }
    } else {
      console.warn(`  ⚠️ Não foi possível salvar o escudo para ${time.nome}`);
      falhas++;
    }

    await sleep(80);
  }

  console.log("\n==========================================");
  console.log(`Concluído! Sucessos: ${sucessos} | Falhas: ${falhas}`);
  console.log("==========================================");
  process.exit(0);
}

syncPendingTeamShields();
