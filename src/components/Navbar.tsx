"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ContentType } from "@/types/catalog";
import { Tv, Film, Clapperboard, MessageCircle, Heart, HelpCircle } from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-4">
          {/* Brand Logo Oficial OnStream */}
          <div
            onClick={() => onTypeChange("filmes")}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,229,255,0.35)] border border-cyan-400/30 bg-black/60 group-hover:scale-105 group-hover:border-cyan-400/60 transition-all duration-300 flex-shrink-0">
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
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-sans group-hover:text-cyan-300 transition-colors">
                  ON<span className="text-cyan-400">STREAM</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  4K
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 hidden sm:block tracking-wide">
                Vitrine Oficial de Conteúdos
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Desktop & Tablet) */}
          <nav className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-white/5 shadow-inner">
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
                  <span className="hidden xs:inline">{item.label}</span>
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
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Link para a Central de Suporte */}
            <Link
              href="/suporte"
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 hover:text-white transition-all shadow-sm hover:border-cyan-400"
              title="Central de Ajuda, Tutoriais e Aplicativos"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Ajuda & Apps</span>
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
              className="hidden sm:flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-[#25d366] text-black hover:bg-[#1ebd56] transition-all duration-200 shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-black" />
              <span>Teste Grátis 6h</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

