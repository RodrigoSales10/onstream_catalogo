import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://siooqwcxgmilrtnolyoc.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb29xd2N4Z21pbHJ0bm9seW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTE3OTksImV4cCI6MjEwNTc4Nzc5OX0.-IRcvyaKrYBJoL9iNuV3dSuSuZb_a-QiLJMhY69OSVs";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function run() {
  const { count: countFilme, error: err1 } = await supabase
    .from("catalogo_itens")
    .select("*", { count: "exact", head: true })
    .eq("tipo", "filme");

  const { count: countFilmes, error: err2 } = await supabase
    .from("catalogo_itens")
    .select("*", { count: "exact", head: true })
    .eq("tipo", "filmes");

  const { data: sample } = await supabase
    .from("catalogo_itens")
    .select("nome, ano, sinopse, grupo, genero_principal, tipo")
    .in("tipo", ["filme", "filmes"])
    .limit(3);

  console.log("Count 'filme':", countFilme, err1?.message);
  console.log("Count 'filmes':", countFilmes, err2?.message);
  console.log("Sample:", JSON.stringify(sample, null, 2));
}

run();
