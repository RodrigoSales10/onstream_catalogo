"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { CatalogItem } from "@/types/catalog";
import { X, Tv, Film, Clapperboard, MessageCircle, Calendar, Tag, Layers, CheckCircle2 } from "lucide-react";
import { buildWhatsAppLink } from "@/services/catalogService";

interface DetailModalProps {
  item: CatalogItem | null;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ item, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (item) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const whatsappUrl = buildWhatsAppLink(item.title, item.type);

  const getMediaBadge = () => {
    switch (item.type) {
      case "canais":
        return { label: "Canal ao Vivo", icon: <Tv className="w-4 h-4" /> };
      case "series":
        return { label: "Série Completa", icon: <Clapperboard className="w-4 h-4" /> };
      default:
        return { label: "Filme em 4K/FHD", icon: <Film className="w-4 h-4" /> };
    }
  };

  const badgeInfo = getMediaBadge();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Window */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel-glow rounded-3xl bg-slate-950/95 border border-white/10 shadow-2xl z-10 flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Poster Column */}
        <div className="w-full sm:w-1/2 flex-shrink-0 flex items-center justify-center">
          <div className="relative w-full max-w-[240px] aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-lg">
            {item.posterUrl ? (
              <Image
                src={item.posterUrl}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 240px, 300px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-900 to-black">
                <Film className="w-12 h-12 text-cyan-400/40 mb-3" />
                <span className="text-xs text-zinc-400 font-semibold">{item.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Information & CTA Column */}
        <div className="w-full sm:w-1/2 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            {/* Type badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold w-fit">
              {badgeInfo.icon}
              <span>{badgeInfo.label}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {item.title}
            </h2>

            {/* Meta details list */}
            <div className="flex flex-col gap-2 pt-2 text-xs sm:text-sm text-zinc-300">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <span className="text-zinc-400">Categoria:</span>
                <span className="font-semibold text-white">{item.category}</span>
              </div>

              {item.year && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-zinc-400">Ano:</span>
                  <span className="font-semibold text-white">{item.year}</span>
                </div>
              )}

              {item.type === "series" && typeof item.episodeCount === "number" && item.episodeCount > 0 && (
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="text-zinc-400">Episódios:</span>
                  <span className="font-semibold text-white">{item.episodeCount} episódios disponíveis</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Disponível no servidor OnStream</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed pt-2">
              Assista a este e milhares de outros títulos em qualidade 4K e Full HD. Peça seu teste grátis de 6 horas sem compromisso!
            </p>
          </div>

          {/* Action CTA Button */}
          <div className="pt-4 flex flex-col gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-[#25d366] text-black font-extrabold text-sm hover:bg-[#1ebd56] shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] select-none text-center"
            >
              <MessageCircle className="w-5 h-5 fill-black" />
              <span>Pedir Teste Grátis no WhatsApp</span>
            </a>
            <span className="text-[11px] text-center text-zinc-500">
              Atendimento instantâneo com o Max • Teste de 6 horas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
