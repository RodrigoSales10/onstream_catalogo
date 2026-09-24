"use client";

import React from "react";
import { CatalogItem } from "@/types/catalog";
import { ContentCard } from "./ContentCard";
import { SkeletonGrid } from "./SkeletonGrid";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";

interface ContentGridProps {
  items: CatalogItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  totalRecords: number;
  hasMore: boolean;
  onLoadMore: () => void;
  onItemClick: (item: CatalogItem) => void;
  onResetFilters?: () => void;
}

export const ContentGrid: React.FC<ContentGridProps> = ({
  items,
  isLoading,
  isLoadingMore,
  totalRecords,
  hasMore,
  onLoadMore,
  onItemClick,
  onResetFilters,
}) => {
  if (isLoading && items.length === 0) {
    return <SkeletonGrid count={24} />;
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl bg-slate-900/40 border border-white/5 max-w-lg mx-auto">
        <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 text-cyan-400">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          Nenhum conteúdo encontrado
        </h3>
        <p className="text-sm text-zinc-400 max-w-xs mb-6">
          Tente buscar com outros termos ou limpar os filtros de categoria e ano.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs sm:text-sm hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Limpar Filtros e Busca</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Cards Grid */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 w-full">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} onClick={onItemClick} />
        ))}
      </div>

      {/* Pagination & Load More Section */}
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        {hasMore ? (
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold text-sm shadow-[0_0_20px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none"
          >
            {isLoadingMore ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Carregando mais títulos...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Carregar Mais Títulos</span>
              </>
            )}
          </button>
        ) : (
          <div className="text-xs text-zinc-500 font-medium">
            Você chegou ao fim dos resultados ({totalRecords.toLocaleString("pt-BR")} títulos)
          </div>
        )}

        {totalRecords > 0 && (
          <div className="text-xs text-zinc-500">
            Exibindo {items.length.toLocaleString("pt-BR")} de {totalRecords.toLocaleString("pt-BR")} títulos
          </div>
        )}
      </div>
    </div>
  );
};
