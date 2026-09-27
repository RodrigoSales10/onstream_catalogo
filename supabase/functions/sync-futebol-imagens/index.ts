/**
 * Supabase Edge Function: sync-futebol-imagens
 *
 * Processamento periódico de escudos e logotipos:
 * - Busca até 20 times com imagens pendentes
 * - Baixa de hosts permitidos (static.futebolnatv.com.br)
 * - Gera hash SHA-256 para desduplicação
 * - Faz upload para o bucket público futebol-assets
 * - Atualiza o caminho e status_imagem na tabela futebol_times
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const ALLOWED_HOSTS = ["static.futebolnatv.com.br", "www.futebolnatv.com.br"];
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

serve(async (_req) => {
  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  let processados = 0;
  let erros = 0;

  try {
    // 1. Busca até 20 times com escudo pendente
    const { data: times, error: queryError } = await supabase
      .from("futebol_times")
      .select("id, nome, escudo_url_origem")
      .eq("status_imagem", "pendente")
      .not("escudo_url_origem", "is", null)
      .limit(20);

    if (queryError) throw queryError;

    if (!times || times.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhuma imagem pendente para processar.", processados: 0 }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Processa com concorrência moderada (2 downloads simultâneos)
    for (const time of times) {
      const urlOrigem = time.escudo_url_origem;
      try {
        const parsedUrl = new URL(urlOrigem);
        if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
          await supabase
            .from("futebol_times")
            .update({ status_imagem: "falha" })
            .eq("id", time.id);
          erros++;
          continue;
        }

        const imgRes = await fetch(urlOrigem, {
          headers: {
            "User-Agent": USER_AGENT,
            "Referer": "https://www.futebolnatv.com.br/",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
        });

        if (!imgRes.ok) {
          await supabase
            .from("futebol_times")
            .update({ status_imagem: "falha" })
            .eq("id", time.id);
          erros++;
          continue;
        }

        const arrayBuf = await imgRes.arrayBuffer();
        if (arrayBuf.byteLength === 0 || arrayBuf.byteLength > 2097152) {
          // Arquivo vazio ou maior que 2MB
          await supabase
            .from("futebol_times")
            .update({ status_imagem: "falha" })
            .eq("id", time.id);
          erros++;
          continue;
        }

        const uint8 = new Uint8Array(arrayBuf);
        const hashBuf = await crypto.subtle.digest("SHA-256", uint8);
        const hashHex = Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const contentType = imgRes.headers.get("content-type") || "image/png";
        let ext = "png";
        if (contentType.includes("jpeg") || urlOrigem.endsWith(".jpg") || urlOrigem.endsWith(".jpeg")) ext = "jpg";
        else if (contentType.includes("webp") || urlOrigem.endsWith(".webp")) ext = "webp";
        else if (contentType.includes("svg") || urlOrigem.endsWith(".svg")) ext = "svg";

        const storagePath = `times/${hashHex}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("futebol-assets")
          .upload(storagePath, uint8, { contentType, upsert: true });

        if (uploadError) {
          console.error(`Erro no upload (${storagePath}):`, uploadError.message);
          erros++;
          continue;
        }

        // Atualiza time com sucesso
        await supabase
          .from("futebol_times")
          .update({
            escudo_storage_path: storagePath,
            status_imagem: "processado",
            atualizado_em: new Date().toISOString(),
          })
          .eq("id", time.id);

        processados++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Erro ao processar time ${time.nome}:`, msg);
        await supabase
          .from("futebol_times")
          .update({ status_imagem: "falha" })
          .eq("id", time.id);
        erros++;
      }
    }

    const durationMs = Date.now() - startTime;
    await supabase.from("futebol_sync_logs").insert({
      rotina: "edge_imagens",
      duracao_ms: durationMs,
      total_imagens: processados,
      status: erros > 0 && processados === 0 ? "erro" : "sucesso",
      detalhes: { processados, erros },
    });

    return new Response(
      JSON.stringify({ success: true, processados, erros, durationMs }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
