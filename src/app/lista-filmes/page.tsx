import type { Metadata } from "next";
import { getPaginaFilmesInfo } from "@/lib/filmesPagination";
import { TabelaFilmesPagina } from "@/components/TabelaFilmesPagina";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo de Filmes - Página 1 | OnStream",
  description: "Página 1 da tabela de filmes do catálogo OnStream (dividida em lotes com menos de 495.000 caracteres).",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function ListaFilmesIndexPage() {
  const info = await getPaginaFilmesInfo(1);
  return <TabelaFilmesPagina info={info} />;
}
