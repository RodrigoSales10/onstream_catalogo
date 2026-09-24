"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { ContentType } from "@/types/catalog";

interface CategoryFiltersProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  years?: (string | number)[];
  selectedYear?: string;
  onSelectYear?: (year: string) => void;
  activeType: ContentType;
}

export const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  years = [],
  selectedYear = "",
  onSelectYear,
  activeType,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-0.5">
        <button
          onClick={() => onSelectCategory("")}
          className={`flex-shrink-0 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 ${
            selectedCategory === ""
              ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,229,255,0.35)] font-bold scale-105"
              : "bg-slate-900/80 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20"
          }`}
        >
          Todos
        </button>

        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => onSelectCategory(isSelected ? "" : category)}
              className={`flex-shrink-0 px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 ${
                isSelected
                  ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,229,255,0.35)] font-bold scale-105"
                  : "bg-slate-900/80 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Year Filter for Movies */}
      {activeType === "filmes" && years.length > 0 && onSelectYear && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 pl-1 pr-2 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">Ano:</span>
          </div>

          <button
            onClick={() => onSelectYear("")}
            className={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              selectedYear === ""
                ? "bg-white/15 text-cyan-300 border border-cyan-400/40"
                : "bg-slate-900/60 text-zinc-400 hover:text-zinc-200 border border-white/5"
            }`}
          >
            Todos os Anos
          </button>

          {years.slice(0, 15).map((year) => {
            const yrStr = String(year);
            const isSelected = selectedYear === yrStr;
            return (
              <button
                key={yrStr}
                onClick={() => onSelectYear(isSelected ? "" : yrStr)}
                className={`flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400"
                    : "bg-slate-900/60 text-zinc-400 hover:text-zinc-200 border border-white/5"
                }`}
              >
                {yrStr}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
