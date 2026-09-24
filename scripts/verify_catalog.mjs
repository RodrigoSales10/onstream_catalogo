import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://siooqwcxgmilrtnolyoc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb29xd2N4Z21pbHJ0bm9seW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTE3OTksImV4cCI6MjEwNTc4Nzc5OX0.-IRcvyaKrYBJoL9iNuV3dSuSuZb_a-QiLJMhY69OSVs"
);

async function verify() {
  console.log("=== 1. TESTE FILMES (Lançamentos do Ano Mais Recente no Topo) ===");
  const { data: filmes, error: errFilmes } = await supabase
    .from("catalogo_itens")
    .select("id, nome, ano, criado_em")
    .eq("tipo", "filmes")
    .order("ano", { ascending: false, nullsFirst: false })
    .order("criado_em", { ascending: false })
    .order("id", { ascending: false })
    .limit(5);

  if (errFilmes) console.error("Erro filmes:", errFilmes);
  else {
    console.log("Top 5 filmes (Ano Atual no Topo):");
    filmes.forEach(f => console.log(`  [Ano: ${f.ano}] ${f.nome} (ID: ${f.id})`));
  }

  console.log("\n=== 2. TESTE CANAIS (is_adult = false no início, is_adult = true no final) ===");
  const { data: canaisPrimeiros, error: errCanais1 } = await supabase
    .from("catalogo_itens")
    .select("id, nome, grupo, is_adult")
    .eq("tipo", "canais")
    .order("is_adult", { ascending: true })
    .order("nome", { ascending: true })
    .limit(5);

  if (errCanais1) console.error("Erro canais primeiros:", errCanais1);
  else {
    console.log("Primeiros 5 canais da listagem geral (devem ser normais, is_adult = false):");
    canaisPrimeiros.forEach(c => console.log(`  [${c.is_adult ? 'ADULTO' : 'NORMAL'}] ${c.nome} (${c.grupo})`));
  }

  const { data: canaisUltimos, error: errCanais2 } = await supabase
    .from("catalogo_itens")
    .select("id, nome, grupo, is_adult")
    .eq("tipo", "canais")
    .order("is_adult", { ascending: false })
    .order("nome", { ascending: true })
    .limit(5);

  if (errCanais2) console.error("Erro canais ultimos:", errCanais2);
  else {
    console.log("\nÚltimos canais da listagem geral (devem ser adultos, is_adult = true):");
    canaisUltimos.forEach(c => console.log(`  [${c.is_adult ? 'ADULTO' : 'NORMAL'}] ${c.nome} (${c.grupo})`));
  }

  console.log("\n=== 4. TESTE SÉRIES (Lançamentos do Ano Mais Recente no Topo) ===");
  const { data: series, error: errSeries } = await supabase
    .from("catalogo_itens")
    .select("id, nome, ano, grupo, total_episodios, criado_em")
    .eq("tipo", "series")
    .order("ano", { ascending: false, nullsFirst: false })
    .order("criado_em", { ascending: false })
    .order("id", { ascending: false })
    .limit(5);

  if (errSeries) console.error("Erro séries:", errSeries);
  else {
    console.log("Top 5 séries (Ano Atual no Topo):");
    series.forEach(s => console.log(`  [Ano: ${s.ano}] ${s.nome} (${s.grupo}) - ID: ${s.id}`));
  }
}

verify();
