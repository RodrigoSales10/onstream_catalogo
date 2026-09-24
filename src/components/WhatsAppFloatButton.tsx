"use client";

import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { buildWhatsAppLink } from "@/services/catalogService";

export const WhatsAppFloatButton: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(true);
  const whatsappUrl = buildWhatsAppLink();

  return (
    <div className="fixed bottom-6 right-5 sm:right-6 z-40 flex flex-col items-end gap-2">
      {/* Mini Conversion Bubble */}
      {showTooltip && (
        <div className="relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/95 border border-emerald-500/30 text-white text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Fale com o Max • Teste 6h</span>
          <button
            onClick={() => setShowTooltip(false)}
            aria-label="Fechar balão"
            className="text-zinc-400 hover:text-white p-0.5 ml-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Pedir teste grátis no WhatsApp"
        className="flex items-center justify-center w-14 h-14 rounded-full bg-[#25d366] hover:bg-[#1ebd56] text-black shadow-[0_0_25px_rgba(37,211,102,0.6)] whatsapp-pulse transition-all transform hover:scale-110 active:scale-95 select-none"
      >
        <MessageCircle className="w-8 h-8 fill-black" />
      </a>
    </div>
  );
};
