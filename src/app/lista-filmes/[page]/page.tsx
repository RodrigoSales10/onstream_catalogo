import type { Metadata } from "next";
import { getPaginaFilmesInfo } from "@/lib/filmesPagination";
import { TabelaFilmesPagina } from "@/components/TabelaFilmesPagina";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ page: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page } = await params;
  const num = parseInt(page, 10) || 1;

  return {
    title: `Catálogo de Filmes - Página ${num} | OnStream`,
    description: `Página ${num} da tabela de filmes do catálogo OnStream (dividida em lotes com menos de 495.000 caracteres).`,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ListaFilmesPorPaginaPage({ params }: PageProps) {
  const { page } = await params;
  const num = parseInt(page, 10) || 1;
  const info = await getPaginaFilmesInfo(num);

  return <TabelaFilmesPagina info={info} />;
}
