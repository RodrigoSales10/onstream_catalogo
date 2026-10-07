import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

export interface FilmeSimples {
  nome: string;
  ano: number | null;
  genero_principal: string | null;
  sinopse: string | null;
}

export interface PaginaFilmesInfo {
  filmes: FilmeSimples[];
  paginaAtual: number;
  totalPaginas: number;
  totalFilmes: number;
  filmesNaPagina: number;
  caracteresEstimados: number;
}

// Limite rigoroso de caracteres por página para que o HTML total fique sempre < 495.000 caracteres
// Reservamos ~35.000 caracteres para layout, navegação, headers e metadados
export const LIMITE_CHARS_CONTEUDO = 460000;

async function fetchFilmesDoSupabase(): Promise<FilmeSimples[]> {
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

// Cache de 5 minutos para carregar todas as páginas instantaneamente
export const getTodosOsFilmesCached = unstable_cache(
  fetchFilmesDoSupabase,
  ["catalogo_todos_filmes_simples"],
  { revalidate: 300 }
);

function estimarCaracteresLinha(filme: FilmeSimples): number {
  // HTML aproximado: <tr><td>nome</td><td>ano</td><td>genero</td><td>sinopse</td></tr>
  const baseHtmlLen = 180;
  const nomeLen = (filme.nome || "").length;
  const anoLen = filme.ano ? String(filme.ano).length : 1;
  const generoLen = (filme.genero_principal || "").length;
  const sinopseLen = (filme.sinopse || "").length;

  return baseHtmlLen + nomeLen + anoLen + generoLen + sinopseLen;
}

export function dividirEmPaginasPorCaracteres(
  filmes: FilmeSimples[],
  maxChars = LIMITE_CHARS_CONTEUDO
): FilmeSimples[][] {
  if (filmes.length === 0) return [];

  const paginas: FilmeSimples[][] = [];
  let paginaAtual: FilmeSimples[] = [];
  let acumuladoChars = 0;

  for (const filme of filmes) {
    const charsLinha = estimarCaracteresLinha(filme);

    if (paginaAtual.length > 0 && acumuladoChars + charsLinha > maxChars) {
      paginas.push(paginaAtual);
      paginaAtual = [filme];
      acumuladoChars = charsLinha;
    } else {
      paginaAtual.push(filme);
      acumuladoChars += charsLinha;
    }
  }

  if (paginaAtual.length > 0) {
    paginas.push(paginaAtual);
  }

  return paginas;
}

export async function getPaginaFilmesInfo(numeroPagina = 1): Promise<PaginaFilmesInfo> {
  const todosFilmes = await getTodosOsFilmesCached();
  const paginas = dividirEmPaginasPorCaracteres(todosFilmes, LIMITE_CHARS_CONTEUDO);

  const totalPaginas = Math.max(1, paginas.length);
  const paginaClamped = Math.min(Math.max(1, numeroPagina), totalPaginas);

  const filmesDaPagina = paginas[paginaClamped - 1] || [];
  const caracteresEstimados = filmesDaPagina.reduce(
    (acc, f) => acc + estimarCaracteresLinha(f),
    0
  );

  return {
    filmes: filmesDaPagina,
    paginaAtual: paginaClamped,
    totalPaginas,
    totalFilmes: todosFilmes.length,
    filmesNaPagina: filmesDaPagina.length,
    caracteresEstimados,
  };
}
