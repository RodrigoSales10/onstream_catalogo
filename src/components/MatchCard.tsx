"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FutebolJogo } from "@/types/catalog";
import { Shield, Tv, Clock, MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/services/catalogService";

interface MatchCardProps {
  jogo: FutebolJogo;
}

export const MatchCard: React.FC<MatchCardProps> = ({ jogo }) => {
  const [homeImgError, setHomeImgError] = useState(false);
  const [awayImgError, setAwayImgError] = useState(false);

  const isLive = jogo.status === "ao_vivo";
  const isFinished = jogo.status === "finalizado";

  const canalPrincipal = jogo.canais[0] || "Canais OnStream";
  const whatsappUrl = buildWhatsAppLink(
    `${jogo.timeCasa.nome} x ${jogo.timeFora.nome} (${canalPrincipal})`,
    "canais"
  );

  return (
    <div className="group relative flex flex-col rounded-2xl bg-slate-900/90 border border-white/5 hover:border-emerald-500/50 p-4 sm:p-5 transition-all duration-300 shadow-md hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] hover:-translate-y-1">
      {/* Top Header: Liga & Status */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="inline-block max-w-[65%] truncate text-xs font-bold text-zinc-400 uppercase tracking-wider">
          {jogo.ligaNome}
        </span>

        {isLive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.4)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>AO VIVO</span>
          </span>
        ) : isFinished ? (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-zinc-800 text-zinc-400 border border-white/5">
            FINALIZADO
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md bg-white/5 text-zinc-300 border border-white/10">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>{jogo.horaJogo}</span>
          </span>
        )}
      </div>

      {/* Confronto: Time Casa x Time Fora */}
      <div className="grid grid-cols-7 items-center justify-between gap-2 py-2">
        {/* Time Casa */}
        <div className="col-span-3 flex flex-col items-center text-center gap-2">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/40 border border-white/10 p-2 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            {jogo.timeCasa.escudoUrl && !homeImgError ? (
              <Image
                src={jogo.timeCasa.escudoUrl}
                alt={jogo.timeCasa.nome}
                fill
                className="object-contain p-1"
                onError={() => setHomeImgError(true)}
                unoptimized
              />
            ) : (
              <Shield className="w-7 h-7 text-zinc-500" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight">
            {jogo.timeCasa.nome}
          </span>
        </div>

        {/* Placar ou VS */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          {typeof jogo.placarCasa === "number" && typeof jogo.placarFora === "number" ? (
            <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-black text-white bg-black/60 px-2.5 py-1 rounded-xl border border-white/10">
              <span className="text-emerald-400">{jogo.placarCasa}</span>
              <span className="text-zinc-500 text-sm">-</span>
              <span className="text-emerald-400">{jogo.placarFora}</span>
            </div>
          ) : (
            <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-500 bg-white/5 px-2 py-1 rounded-lg">
              VS
            </span>
          )}
        </div>

        {/* Time Fora */}
        <div className="col-span-3 flex flex-col items-center text-center gap-2">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/40 border border-white/10 p-2 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            {jogo.timeFora.escudoUrl && !awayImgError ? (
              <Image
                src={jogo.timeFora.escudoUrl}
                alt={jogo.timeFora.nome}
                fill
                className="object-contain p-1"
                onError={() => setAwayImgError(true)}
                unoptimized
              />
            ) : (
              <Shield className="w-7 h-7 text-zinc-500" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight">
            {jogo.timeFora.nome}
          </span>
        </div>
      </div>

      {/* Transmissão - Badges de Canais */}
      {jogo.canais.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
            <Tv className="w-3.5 h-3.5 text-emerald-400" />
            <span>Onde Assistir:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {jogo.canais.map((canal) => (
              <span
                key={canal}
                className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              >
                {canal}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-extrabold text-xs hover:from-emerald-400 hover:to-teal-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]"
      >
        <MessageCircle className="w-4 h-4 fill-black" />
        <span>Liberar Canal no WhatsApp</span>
      </a>
    </div>
  );
};
