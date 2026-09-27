"use client";

import React, { useState, useEffect } from "react";
import { FutebolJogo } from "@/types/catalog";
import { fetchFutebolJogos, getBrasiliaDateStr } from "@/services/futebolService";
import { MatchCard } from "./MatchCard";
import { Trophy, Calendar, Search, RotateCcw, Loader2 } from "lucide-react";

export const MatchSection: React.FC = () => {
  const [dayOffset, setDayOffset] = useState<number>(0); // 0 = hoje, -1 = ontem, 1 = amanha
  const [selectedLiga, setSelectedLiga] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [jogos, setJogos] = useState<FutebolJogo[]>([]);
  const [ligas, setLigas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const activeDateStr = getBrasiliaDateStr(dayOffset);

  // Formata a data para exibição (ex: "Sábado, 26 de Setembro")
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
      {/* Header com Abas de Data (Ontem, Hoje, Amanhã) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <span>Agenda de Jogos na TV</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {jogos.length} {jogos.length === 1 ? "partida" : "partidas"}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 capitalize">{formattedDate}</p>
          </div>
        </div>

        {/* Date Selector Pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10 w-full sm:w-auto">
          {[
            { offset: -1, label: "Ontem" },
            { offset: 0, label: "Hoje" },
            { offset: 1, label: "Amanhã" },
          ].map((tab) => {
            const isActive = dayOffset === tab.offset;
            return (
              <button
                key={tab.offset}
                onClick={() => {
                  setDayOffset(tab.offset);
                  setSelectedLiga("");
                }}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isActive
                    ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
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

        {/* Ligas Pills */}
        {ligas.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedLiga("")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all border ${
                selectedLiga === ""
                  ? "bg-emerald-500 text-black border-emerald-400 font-extrabold"
                  : "bg-slate-900 text-zinc-400 hover:text-white border-white/5"
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
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all border ${
                    isSelected
                      ? "bg-emerald-500/25 text-emerald-300 border-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : "bg-slate-900 text-zinc-400 hover:text-zinc-200 border-white/5 hover:border-white/20"
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
