import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lista Completa de Filmes | OnStream",
  description: "Tabela simples de texto com todos os filmes do catálogo OnStream.",
  robots: {
    index: true,
    follow: true,
  },
};

interface FilmeSimples {
  nome: string;
  ano: number | null;
  genero_principal: string | null;
  sinopse: string | null;
}

async function getTodosOsFilmes(): Promise<FilmeSimples[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://siooqwcxgmilrtnolyoc.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb29xd2N4Z21pbHJ0bm9seW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTE3OTksImV4cCI6MjEwNTc4Nzc5OX0.-IRcvyaKrYBJoL9iNuV3dSuSuZb_a-QiLJMhY69OSVs";

  const supabase = createClient(supabaseUrl, supabaseKey);

  const todosFilmes: FilmeSimples[] = [];
  const BATCH_SIZE = 1000;
  let from = 0;

  try {
    while (true) {
      const { data, error } = await supabase
        .from("catalogo_itens")
        .select("nome, ano, genero_principal, sinopse")
        .in("tipo", ["filme", "filmes"])
        .order("nome", { ascending: true })
        .range(from, from + BATCH_SIZE - 1);

      if (error) {
        console.error("Erro ao carregar filmes do Supabase:", error);
        break;
      }

      if (!data || data.length === 0) {
        break;
      }

      todosFilmes.push(...data);

      if (data.length < BATCH_SIZE) {
        break;
      }

      from += BATCH_SIZE;
    }
  } catch (err) {
    console.error("Falha inesperada ao buscar filmes:", err);
  }

  return todosFilmes;
}

export default async function ListaFilmesPage() {
  const filmes = await getTodosOsFilmes();

  return (
    <main className="min-h-screen bg-white text-gray-900 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho simples */}
        <header className="mb-6 pb-4 border-b border-gray-300">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Catálogo de Filmes
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600 font-medium">
            Total de filmes cadastrados:{" "}
            <span className="font-semibold text-gray-900">{filmes.length.toLocaleString("pt-BR")}</span>
          </p>
        </header>

        {/* Tabela de texto puro */}
        {filmes.length === 0 ? (
          <p className="text-gray-500 py-8">Nenhum filme encontrado no catálogo.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-300 rounded shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-100 text-gray-800 font-semibold border-b border-gray-300">
                <tr>
                  <th scope="col" className="py-3 px-4 w-1/4">
                    Nome do Filme
                  </th>
                  <th scope="col" className="py-3 px-4 w-20 text-center">
                    Ano
                  </th>
                  <th scope="col" className="py-3 px-4 w-1/6">
                    Gênero
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Sinopse
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filmes.map((filme, idx) => (
                  <tr
                    key={`${filme.nome}-${idx}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900 align-top">
                      {filme.nome}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 align-top whitespace-nowrap">
                      {filme.ano || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-700 align-top">
                      {filme.genero_principal || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 align-top leading-relaxed">
                      {filme.sinopse || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
