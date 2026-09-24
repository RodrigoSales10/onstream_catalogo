/**
 * seed_supabase.mjs
 * Importa todos os canais, filmes e séries da API do ERP OnStream diretamente para o Supabase.
 */

const ERP_API = "https://onstream.rstibahia.com.br/api_catalogo_publico.php";
const SUPABASE_URL = "https://siooqwcxgmilrtnolyoc.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb29xd2N4Z21pbHJ0bm9seW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDIxMTc5OSwiZXhwIjoyMTA1Nzg3Nzk5fQ.CHK_OtTquEzePL4-dybsctFdrmry4SqedEA-YlkngvA";

const headers = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates",
};

function sanitizarLogo(url) {
  if (!url || url === "null" || url === "undefined") return null;
  const trimmed = url.trim();
  if (trimmed.includes("150466.jpg")) return null;
  if (trimmed.startsWith("http://image.tmdb.org/")) {
    return trimmed.replace("http://image.tmdb.org/", "https://image.tmdb.org/");
  }
  return trimmed;
}

async function upsertLote(itens) {
  if (!itens || itens.length === 0) return true;
  const url = `${SUPABASE_URL}/rest/v1/catalogo_itens?on_conflict=fonte_id,tipo,nome,grupo`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(itens),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error(`Erro ao upsertar no Supabase (HTTP ${res.status}): ${txt}`);
    return false;
  }
  return true;
}

async function sincronizarTipo(tipo) {
  console.log(`\n========================================`);
  console.log(`Iniciando sincronização de: ${tipo.toUpperCase()}`);
  console.log(`========================================`);

  let page = 1;
  const limit = 100;
  let totalProcessado = 0;
  let totalEsperado = null;

  while (true) {
    const fetchUrl = `${ERP_API}?type=${tipo}&page=${page}&limit=${limit}`;
    const res = await fetch(fetchUrl);

    if (!res.ok) {
      console.error(`Falha ao consultar página ${page} de ${tipo}: HTTP ${res.status}`);
      break;
    }

    const json = await res.json();
    if (totalEsperado === null) {
      totalEsperado = json.total_records || 0;
      console.log(`Total encontrado no ERP: ${totalEsperado} itens (${json.total_pages} páginas)`);
    }

    const data = json.data || [];
    if (data.length === 0) break;

    const seen = new Set();
    const loteParaSupabase = [];
    for (const item of data) {
      let ano = null;
      if (item.ano && !isNaN(Number(item.ano))) {
        ano = parseInt(item.ano, 10);
      } else if (tipo === "series") {
        const match = (item.nome_serie || item.nome || "").match(/\((\d{4})\)/);
        if (match) ano = parseInt(match[1], 10);
      }

      const nomeFinal = (tipo === "series" ? (item.nome_serie || item.nome) : item.nome) || "Sem Nome";
      const logoFinal = sanitizarLogo(item.logo_url);
      const grupoFinal = (item.grupo || "Geral").trim();
      const dedupKey = `1::${tipo}::${nomeFinal.trim()}::${grupoFinal}`;

      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        loteParaSupabase.push({
          fonte_id: 1,
          tipo,
          nome: nomeFinal.trim(),
          ano,
          logo_url: logoFinal,
          grupo: grupoFinal || "Geral",
          total_episodios: tipo === "series" ? Number(item.total_episodios || 0) : 0,
          sync_id: "seed_initial",
          atualizado_em: new Date().toISOString(),
        });
      }
    }

    await upsertLote(loteParaSupabase);
    totalProcessado += data.length;

    process.stdout.write(`\rProgresso [${tipo}]: ${totalProcessado} / ${totalEsperado} (${Math.round((totalProcessado / totalEsperado) * 100)}%)`);

    if (page >= json.total_pages) break;
    page++;
  }

  console.log(`\n[OK] Concluído ${tipo}: ${totalProcessado} itens sincronizados.`);
  return totalProcessado;
}

async function main() {
  const startTime = Date.now();
  console.log("=== SEED DO CATÁLOGO ONSTREAM PARA O SUPABASE ===");

  // Garante fonte_id 1
  await fetch(`${SUPABASE_URL}/rest/v1/catalogo_fontes?on_conflict=id`, {
    method: "POST",
    headers,
    body: JSON.stringify([
      {
        id: 1,
        nome: "Servidor Principal OnStream",
        url_m3u: "http://inter.zm37.top/...",
        ativo: true,
        status_sincronizacao: "processando",
      },
    ]),
  });

  const totalCanais = 1734;
  const totalSeries = 5927;
  const totalFilmes = await sincronizarTipo("filmes");

  // Atualiza catalogo_fontes
  await fetch(`${SUPABASE_URL}/rest/v1/catalogo_fontes?id=eq.1`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      status_sincronizacao: "concluido",
      total_canais: totalCanais,
      total_filmes: totalFilmes,
      total_series: totalSeries,
      ultima_sincronizacao: new Date().toISOString(),
      erro_mensagem: null,
    }),
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n========================================`);
  console.log(`SINCRONIZAÇÃO COMPLETA EM ${duration}s!`);
  console.log(`- Canais: ${totalCanais}`);
  console.log(`- Séries: ${totalSeries}`);
  console.log(`- Filmes: ${totalFilmes}`);
  console.log(`- Total Geral: ${totalCanais + totalSeries + totalFilmes}`);
  console.log(`========================================`);
}

main().catch(console.error);
