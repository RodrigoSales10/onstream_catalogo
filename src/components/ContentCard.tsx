"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CatalogItem } from "@/types/catalog";
import { Tv, Film, Clapperboard, Play, Layers } from "lucide-react";

interface ContentCardProps {
  item: CatalogItem;
  onClick: (item: CatalogItem) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item, onClick }) => {
  const [hasImageError, setHasImageError] = useState(false);

  const getMediaIcon = () => {
    switch (item.type) {
      case "canais":
        return <Tv className="w-8 h-8 text-cyan-400 opacity-60" />;
      case "series":
        return <Clapperboard className="w-8 h-8 text-cyan-400 opacity-60" />;
      default:
        return <Film className="w-8 h-8 text-cyan-400 opacity-60" />;
    }
  };

  const showFallback = hasImageError || !item.posterUrl;

  return (
    <div
      onClick={() => onClick(item)}
      className="group relative flex flex-col w-full rounded-2xl bg-slate-900/90 border border-white/5 hover:border-cyan-400/60 overflow-hidden cursor-pointer shadow-md hover:shadow-[0_0_25px_rgba(0,229,255,0.25)] transition-all duration-300 hover:-translate-y-1.5 select-none"
    >
      {/* Aspect Ratio 2:3 Container */}
      <div className="relative w-full aspect-[2/3] bg-gradient-to-b from-slate-800 to-slate-950 overflow-hidden">
        {!showFallback ? (
          <Image
            src={item.posterUrl!}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setHasImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-900 via-slate-950 to-black">
            <div className="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
              {getMediaIcon()}
            </div>
            <p className="text-xs font-semibold text-zinc-300 line-clamp-3 leading-snug px-2">
              {item.title}
            </p>
          </div>
        )}

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          {item.year ? (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-black/75 text-zinc-200 border border-white/10 backdrop-blur-md">
              {item.year}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 backdrop-blur-md">
              {item.type === "canais" ? "AO VIVO" : "HD"}
            </span>
          )}
        </div>

        {/* Episode Count Badge (Series) */}
        {item.type === "series" && typeof item.episodeCount === "number" && item.episodeCount > 0 && (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-500/30 text-blue-200 border border-blue-400/30 backdrop-blur-md">
            <Layers className="w-3 h-3" />
            <span>{item.episodeCount} eps</span>
          </div>
        )}

        {/* Hover Quick Action Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs shadow-[0_0_20px_rgba(0,229,255,0.6)] transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Ver Detalhes</span>
          </div>
        </div>

        {/* Bottom Category Tag */}
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <span className="inline-block max-w-full truncate text-[10px] font-semibold text-cyan-400/90 tracking-wider uppercase">
            {item.category}
          </span>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-1">
        <h3
          title={item.title}
          className="text-xs sm:text-sm font-semibold text-white group-hover:text-cyan-400 line-clamp-2 transition-colors leading-tight"
        >
          {item.title}
        </h3>
      </div>
    </div>
  );
};
