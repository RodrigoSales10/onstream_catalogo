"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ContentType } from "@/types/catalog";
import { Tv, Film, Clapperboard, MessageCircle, Heart, HelpCircle, Trophy } from "lucide-react";
import { buildWhatsAppLink } from "@/services/catalogService";
import { useFavorites } from "@/hooks/useFavorites";

interface NavbarProps {
  activeType: ContentType;
  onTypeChange: (type: ContentType) => void;
  totalRecords?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeType,
  onTypeChange,
  totalRecords,
}) => {
  const whatsappUrl = buildWhatsAppLink();
  const { favoritesCount } = useFavorites();
  const [isBumping, setIsBumping] = useState(false);
  const prevCountRef = useRef(favoritesCount);

  useEffect(() => {
    if (prevCountRef.current !== favoritesCount) {
      prevCountRef.current = favoritesCount;
      const startTimer = setTimeout(() => setIsBumping(true), 0);
      const resetTimer = setTimeout(() => setIsBumping(false), 500);
      return () => {
        clearTimeout(startTimer);
        clearTimeout(resetTimer);
      };
    }
  }, [favoritesCount]);

  const navItems: { type: ContentType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { type: "canais", label: "Canais", icon: <Tv className="w-4 h-4" /> },
    { type: "filmes", label: "Filmes", icon: <Film className="w-4 h-4" /> },
    { type: "series", label: "Séries", icon: <Clapperboard className="w-4 h-4" /> },
    { type: "jogos", label: "Jogos", icon: <Trophy className="w-4 h-4 text-emerald-400" /> },
    {
      type: "favoritos",
      label: "Favoritos",
      icon: (
        <Heart
          className={`w-4 h-4 transition-all duration-300 ${
            favoritesCount > 0 ? "fill-rose-500 text-rose-500" : ""
          } ${isBumping ? "scale-135 text-rose-400 rotate-6" : ""}`}
        />
      ),
      badge: favoritesCount > 0 ? favoritesCount : undefined,
    },
  ];

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20 gap-2 sm:gap-4">
            {/* Brand Logo Oficial OnStream */}
            <div
              onClick={() => onTypeChange("filmes")}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group flex-shrink-0"
            >
              <div className="relative w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,229,255,0.35)] border border-cyan-400/30 bg-black/60 group-hover:scale-105 group-hover:border-cyan-400/60 transition-all duration-300 flex-shrink-0">
                <Image
                  src="/logo-onstream.png"
                  alt="OnStream Logo"
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-white font-sans group-hover:text-cyan-300 transition-colors">
                    ON<span className="text-cyan-400">STREAM</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    4K
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 hidden sm:block tracking-wide">
                  Vitrine Oficial de Conteúdos
                </span>
              </div>
            </div>

            {/* Navigation Tabs (Desktop & Tablet only - hidden on mobile) */}
            <nav className="hidden md:flex items-center p-1 rounded-xl bg-slate-900/80 border border-white/5 shadow-inner">
              {navItems.map((item) => {
                const isActive = activeType === item.type;
                return (
                  <button
                    key={item.type}
                    onClick={() => onTypeChange(item.type)}
                    className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 select-none ${
                      isActive
                        ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,229,255,0.4)] font-bold"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.icon}
                    <span className="text-[11px] sm:text-xs md:text-sm font-semibold">{item.label}</span>
                    {item.type === "jogos" && (
                      <span className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full animate-pulse">
                        Novo
                      </span>
                    )}
                    {typeof item.badge === "number" && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full transition-transform duration-300 ${
                          isBumping && item.type === "favoritos" ? "scale-125 shadow-[0_0_15px_rgba(244,63,94,0.9)]" : ""
                        } ${
                          isActive
                            ? "bg-black text-cyan-300"
                            : "bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Actions & Suporte Link */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Link para a Central de Suporte */}
              <Link
                href="/suporte"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 hover:text-white transition-all shadow-sm hover:border-cyan-400"
                title="Central de Ajuda, Tutoriais e Aplicativos"
              >
                <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                <span className="text-[11px] sm:text-xs md:inline">Ajuda</span>
              </Link>

              {/* Total de títulos (Desktop) */}
              {typeof totalRecords === "number" && totalRecords > 0 && (
                <span className="hidden lg:inline-block text-xs text-zinc-400 font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                  {totalRecords.toLocaleString("pt-BR")} títulos
                </span>
              )}

              {/* WhatsApp CTA */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl bg-[#25d366] text-black hover:bg-[#1ebd56] transition-all duration-200 shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:scale-105 active:scale-95"
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black" />
                <span className="text-[11px] sm:text-xs">Teste 6h</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Docked at Bottom, Native App Style) */}
      <nav
        aria-label="Navegação Principal Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#060913]/95 backdrop-blur-2xl border-t border-white/10 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.6)]"
      >
        <div className="grid grid-cols-5 items-center h-15 px-1">
          {navItems.map((item) => {
            const isActive = activeType === item.type;
            const isJogos = item.type === "jogos";
            return (
              <button
                key={item.type}
                onClick={() => onTypeChange(item.type)}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-all duration-200 relative select-none ${
                  isActive
                    ? isJogos
                      ? "text-emerald-400 font-extrabold"
                      : "text-cyan-400 font-extrabold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {/* Active Indicator Top Glow Bar */}
                {isActive && (
                  <span
                    className={`absolute -top-px left-1/2 -translate-x-1/2 w-8 h-1 rounded-full shadow-[0_0_10px] ${
                      isJogos
                        ? "bg-emerald-400 shadow-emerald-400/80"
                        : "bg-cyan-400 shadow-cyan-400/80"
                    }`}
                  />
                )}

                <div className="relative">
                  <span
                    className={`inline-block transition-transform duration-200 ${
                      isActive ? "scale-110" : ""
                    }`}
                  >
                    {item.icon}
                  </span>

                  {/* Pulsing Dot for Jogos */}
                  {isJogos && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}

                  {/* Badge for Favorites */}
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 px-1 py-0.1 text-[9px] font-black rounded-full transition-transform duration-300 bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.8)] ${
                        isBumping && item.type === "favoritos" ? "scale-125" : ""
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

