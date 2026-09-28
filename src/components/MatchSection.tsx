"use client";

import React, { useState, useEffect } from "react";
import { FutebolJogo } from "@/types/catalog";
import { fetchFutebolJogos, getBrasiliaDateStr } from "@/services/futebolService";
import { MatchCard } from "./MatchCard";
import { Trophy, Calendar, Search, RotateCcw, Loader2 } from "lucide-react";

export const MatchSection: React.FC = () => {
  const [selectedLiga, setSelectedLiga] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [jogos, setJogos] = useState<FutebolJogo[]>([]);
  const [ligas, setLigas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sempre focado nos jogos de hoje no fuso oficial de Brasília
  const activeDateStr = getBrasiliaDateStr(0);

  // Formata a data para exibição (ex: "Domingo, 27 de Setembro")
  const formattedDate = (() => {
    const [y, m, d] = activeDateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }).format(dateObj);
  })();

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    fetchFutebolJogos({
      dataJogo: activeDateStr,
      liga: selectedLiga,
      busca: search,
    }).then((res) => {
      if (!ignore) {
        setJogos(res.jogos);
        setLigas(res.ligas);
        setIsLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [activeDateStr, selectedLiga, search]);

  const handleResetFilters = () => {
    setSelectedLiga("");
    setSearch("");
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Header com Informações da Rodada de Hoje */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <span>Jogos de Hoje na TV</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {jogos.length} {jogos.length === 1 ? "partida" : "partidas"}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 capitalize">{formattedDate}</p>
          </div>
        </div>

        {/* Indicador de Transmissões ao Vivo de Hoje */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-emerald-300 text-xs font-bold shadow-inner">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>Agenda de Hoje</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        </div>
      </div>

      {/* Busca e Filtros de Competições */}
      <div className="flex flex-col gap-3">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por time, campeonato ou canal de transmissão..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500/60 transition-all"
          />
        </div>

        {/* Ligas Pills (Carrossel Horizontal Mobile-Friendly) */}
        {ligas.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 w-full max-w-full flex-nowrap">
            <button
              onClick={() => setSelectedLiga("")}
              className={`flex-shrink-0 whitespace-nowrap px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                selectedLiga === ""
                  ? "bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "bg-slate-900/90 text-zinc-400 hover:text-white border-white/5"
              }`}
            >
              Todas as Ligas
            </button>
            {ligas.map((liga) => {
              const isSelected = selectedLiga === liga;
              return (
                <button
                  key={liga}
                  onClick={() => setSelectedLiga(isSelected ? "" : liga)}
                  className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-xl transition-all border ${
                    isSelected
                      ? "bg-emerald-500/25 text-emerald-300 border-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : "bg-slate-900/90 text-zinc-400 hover:text-zinc-200 border-white/5 hover:border-white/20"
                  }`}
                >
                  {liga}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid de Partidas */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-sm font-semibold">Carregando jogos e transmissões...</span>
        </div>
      ) : jogos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl bg-slate-900/40 border border-white/5 max-w-lg mx-auto">
          <div className="p-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3 text-emerald-400">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Nenhum jogo encontrado para esta data
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mb-4">
            Alterne entre Ontem, Hoje e Amanhã ou tente limpar os filtros de busca.
          </p>
          {(selectedLiga || search) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {jogos.map((jogo) => (
            <MatchCard key={jogo.id} jogo={jogo} />
          ))}
        </div>
      )}
    </div>
  );
};
