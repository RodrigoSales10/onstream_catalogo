import React from "react";
import Link from "next/link";
import { PaginaFilmesInfo } from "@/lib/filmesPagination";

interface TabelaFilmesPaginaProps {
  info: PaginaFilmesInfo;
}

export function TabelaFilmesPagina({ info }: TabelaFilmesPaginaProps) {
  const { filmes, paginaAtual, totalPaginas, totalFilmes, filmesNaPagina } = info;

  const renderPaginador = () => (
    <nav
      aria-label="Navegação entre páginas"
      className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-gray-200 bg-gray-50 px-3 rounded"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">
          Página {paginaAtual} de {totalPaginas}
        </span>
        <span className="text-xs text-gray-500">
          ({filmesNaPagina} filmes nesta página)
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {paginaAtual > 1 && (
          <Link
            href={`/lista-filmes${paginaAtual - 1}`}
            className="px-2.5 py-1 text-xs font-medium border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ← Anterior (/lista-filmes{paginaAtual - 1})
          </Link>
        )}

        {/* Links rápidos para todas as páginas */}
        <div className="flex flex-wrap items-center gap-1">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <Link
              key={num}
              href={`/lista-filmes${num}`}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                num === paginaAtual
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {num}
            </Link>
          ))}
        </div>

        {paginaAtual < totalPaginas && (
          <Link
            href={`/lista-filmes${paginaAtual + 1}`}
            className="px-2.5 py-1 text-xs font-medium border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Próxima (/lista-filmes{paginaAtual + 1}) →
          </Link>
        )}
      </div>
    </nav>
  );

  return (
    <main className="min-h-screen bg-white text-gray-900 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Cabeçalho */}
        <header className="pb-3 border-b border-gray-300">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Catálogo de Filmes
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-mono">
              URL desta página: https://catalogo.rstibahia.com.br/lista-filmes{paginaAtual}
            </p>
          </div>
          <p className="mt-1 text-sm sm:text-base text-gray-600 font-medium">
            Total geral no catálogo:{" "}
            <span className="font-semibold text-gray-900">
              {totalFilmes.toLocaleString("pt-BR")}
            </span>{" "}
            filmes divididos em{" "}
            <span className="font-semibold text-gray-900">{totalPaginas}</span>{" "}
            {totalPaginas === 1 ? "página" : "páginas"} (&lt; 495.000 caracteres cada).
          </p>
        </header>

        {/* Paginador Superior */}
        {renderPaginador()}

        {/* Tabela de texto puro */}
        {filmes.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">Nenhum filme encontrado nesta página.</p>
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

        {/* Paginador Inferior */}
        {renderPaginador()}
      </div>
    </main>
  );
}
