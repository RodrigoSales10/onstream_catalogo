"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { ContentType } from "@/types/catalog";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  activeType: ContentType;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  activeType,
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [isPending, startTransition] = useTransition();

  // Adjust state during render when prop changes externally (e.g. cleared by reset button)
  if (value !== prevValue) {
    setPrevValue(value);
    setInternalValue(value);
  }

  useEffect(() => {
    if (internalValue === value) return;
    const handler = setTimeout(() => {
      startTransition(() => {
        onChange(internalValue);
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [internalValue, value, onChange]);

  const placeholderText =
    activeType === "filmes"
      ? "Buscar filmes por título, gênero ou ano..."
      : activeType === "series"
      ? "Buscar séries por nome ou grupo..."
      : activeType === "favoritos"
      ? "Buscar em seus títulos favoritos por nome ou categoria..."
      : "Buscar canais por nome (ex: SporTV, HBO, Premiere)...";

  return (
    <div className="relative w-full">
      <div className="relative flex items-center w-full rounded-2xl bg-slate-900/90 border border-white/10 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 shadow-lg transition-all duration-300">
        <div className="pl-4 pr-2 text-zinc-400">
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>

        <input
          type="text"
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          placeholder={placeholderText}
          className="w-full py-3.5 sm:py-4 bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none tracking-wide"
        />

        {internalValue && (
          <button
            onClick={() => {
              setInternalValue("");
              onChange("");
            }}
            aria-label="Limpar busca"
            className="p-2 mr-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
