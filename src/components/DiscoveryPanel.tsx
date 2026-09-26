"use client";

import React, { useState } from "react";
import { SlidersHorizontal, ChevronDown, RotateCcw, Clapperboard, Calendar, Sparkles, Star } from "lucide-react";
import { ContentType } from "@/types/catalog";
import { ThermometerSlider } from "./ThermometerSlider";

interface DiscoveryPanelProps {
  activeType: ContentType;
  selectedRatingMin: number;
  onSelectRatingMin: (val: number) => void;
  genres: string[];
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  years?: (string | number)[];
  selectedYear?: string;
  onSelectYear?: (year: string) => void;
  sortBy: string;
  onSelectSortBy: (sort: string) => void;
  onResetFilters: () => void;
}

export const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({
  activeType,
  selectedRatingMin,
  onSelectRatingMin,
  genres,
  selectedGenre,
  onSelectGenre,
  years = [],
  selectedYear = "",
  onSelectYear,
  sortBy,
  onSelectSortBy,
  onResetFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Calcula quantos filtros estão ativos
  let activeFilterCount = 0;
  if (selectedRatingMin > 0) activeFilterCount++;
  if (selectedGenre.trim()) activeFilterCount++;
  if (selectedYear.trim()) activeFilterCount++;
  if (sortBy && sortBy !== "criado_em") activeFilterCount++;

  const sortOptions = [
    { id: "criado_em", label: "Lançamentos Recentes", icon: Sparkles },
    { id: "tmdb_rating", label: "Top Avaliados (TMDB)", icon: Star },
    { id: "ano", label: "Por Ano de Estreia", icon: Calendar },
    { id: "nome", label: "Ordem Alfabética (A-Z)", icon: null },
  ];

  return (
    <div className="w-full flex flex-col rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-md overflow-hidden transition-all shadow-md">
      {/* Botão de Controle / Cabeçalho do Accordion */}
      <div className="flex items-center justify-between p-3 sm:p-4 gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
          aria-expanded={isOpen}
        >
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                Filtros & Descoberta
              </span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-black rounded-full bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              {isOpen ? "Toque para recolher" : "Termômetro de notas, gêneros e ordenação"}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-xs font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition-transform"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Conteúdo Retrátil do Painel */}
      {isOpen && (
        <div className="flex flex-col gap-5 p-4 pt-1 sm:p-5 sm:pt-2 border-t border-white/5 animate-in fade-in duration-200">
          {/* Seção 1: Ordenação */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Ordenar por:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {sortOptions.map((opt) => {
                const isSelected = sortBy === opt.id || (!sortBy && opt.id === "criado_em");
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onSelectSortBy(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                      isSelected
                        ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)] scale-102"
                        : "bg-slate-900/90 text-zinc-400 hover:text-white border-white/5 hover:border-white/20"
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Termômetro de Avaliação TMDB */}
          <ThermometerSlider
            value={selectedRatingMin}
            onChange={onSelectRatingMin}
          />

          {/* Seção 3: Gêneros TMDB */}
          {genres.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Clapperboard className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Gênero Oficial (TMDB):
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                <button
                  onClick={() => onSelectGenre("")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all border ${
                    selectedGenre === ""
                      ? "bg-cyan-500 text-black border-cyan-400 font-extrabold"
                      : "bg-slate-900 text-zinc-400 hover:text-white border-white/5"
                  }`}
                >
                  Todos os Gêneros
                </button>

                {genres.map((genre) => {
                  const isSelected = selectedGenre === genre;
                  return (
                    <button
                      key={genre}
                      onClick={() => onSelectGenre(isSelected ? "" : genre)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all border ${
                        isSelected
                          ? "bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-bold"
                          : "bg-slate-900 text-zinc-400 hover:text-zinc-200 border-white/5 hover:border-white/20"
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seção 4: Ano de Lançamento */}
          {years.length > 0 && onSelectYear && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Ano de Lançamento:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1 scrollbar-thin">
                <button
                  onClick={() => onSelectYear("")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all border ${
                    selectedYear === ""
                      ? "bg-white/20 text-cyan-300 border-cyan-400 font-extrabold"
                      : "bg-slate-900 text-zinc-400 hover:text-white border-white/5"
                  }`}
                >
                  Todos
                </button>

                {years.slice(0, 15).map((yr) => {
                  const yrStr = String(yr);
                  const isSelected = selectedYear === yrStr;
                  return (
                    <button
                      key={yrStr}
                      onClick={() => onSelectYear(isSelected ? "" : yrStr)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all border ${
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold"
                          : "bg-slate-900 text-zinc-400 hover:text-zinc-200 border-white/5"
                      }`}
                    >
                      {yrStr}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
