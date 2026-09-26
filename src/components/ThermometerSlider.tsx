"use client";

import React from "react";
import { Flame, Sparkles, Star } from "lucide-react";

interface ThermometerSliderProps {
  value: number;
  onChange: (val: number) => void;
}

export const ThermometerSlider: React.FC<ThermometerSliderProps> = ({
  value,
  onChange,
}) => {
  // Configuração de temperatura e cores dinâmicas
  const getTemperatureConfig = (val: number) => {
    if (val === 0) {
      return {
        icon: "🌟",
        label: "Todas as Notas",
        sublabel: "Exibindo todo o acervo",
        colorClass: "text-zinc-400",
        badgeBg: "bg-slate-800 text-zinc-300 border-white/10",
        sliderColor: "#06b6d4", // cyan
        glowStyle: {},
      };
    }
    if (val < 6.0) {
      return {
        icon: "❄️",
        label: `Mínimo ${val.toFixed(1)}+`,
        sublabel: "Regular / Básico",
        colorClass: "text-cyan-400",
        badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
        sliderColor: "#06b6d4",
        glowStyle: { boxShadow: "0 0 15px rgba(6,182,212,0.3)" },
      };
    }
    if (val < 7.0) {
      return {
        icon: "🌤️",
        label: `Mínimo ${val.toFixed(1)}+`,
        sublabel: "Morno / Bom",
        colorClass: "text-amber-400",
        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-400/40",
        sliderColor: "#f59e0b",
        glowStyle: { boxShadow: "0 0 18px rgba(245,158,11,0.35)" },
      };
    }
    if (val < 8.0) {
      return {
        icon: "🍿",
        label: `Mínimo ${val.toFixed(1)}+`,
        sublabel: "Quente / Muito Bom",
        colorClass: "text-orange-400",
        badgeBg: "bg-orange-500/20 text-orange-300 border-orange-400/40",
        sliderColor: "#f97316",
        glowStyle: { boxShadow: "0 0 20px rgba(249,115,22,0.4)" },
      };
    }
    return {
      icon: "🔥",
      label: `Mínimo ${val.toFixed(1)}+`,
      sublabel: "Fervendo / Aclamado pela Crítica",
      colorClass: "text-rose-400",
      badgeBg: "bg-rose-500/25 text-rose-300 border-rose-500/50",
      sliderColor: "#f43f5e",
      glowStyle: { boxShadow: "0 0 25px rgba(244,63,94,0.6)" },
    };
  };

  const temp = getTemperatureConfig(value);

  const presets = [
    { label: "Todas", val: 0 },
    { label: "⭐ 6.0+", val: 6.0 },
    { label: "🍿 7.0+", val: 7.0 },
    { label: "🔥 8.0+", val: 8.0 },
  ];

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg">
      {/* Header com indicador do termômetro */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <Flame className={`w-4 h-4 ${value >= 8.0 ? "text-rose-500 animate-pulse" : "text-cyan-400"}`} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <span>Termômetro de Avaliação</span>
              {value >= 8.0 && (
                <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40 font-extrabold animate-pulse">
                  <Sparkles className="w-2.5 h-2.5" /> TOP
                </span>
              )}
            </h4>
            <p className="text-[11px] text-zinc-400">{temp.sublabel}</p>
          </div>
        </div>

        {/* Badge Dinâmico Reativo */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border transition-all duration-300 ${temp.badgeBg}`}
          style={temp.glowStyle}
        >
          <span className="text-sm">{temp.icon}</span>
          <span>{temp.label}</span>
        </div>
      </div>

      {/* Slider Interativo */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max="9.0"
            step="0.5"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-cyan-400 focus:outline-none transition-all"
            style={{
              accentColor: temp.sliderColor,
            }}
          />
        </div>

        {/* Escala visual */}
        <div className="flex justify-between items-center text-[10px] font-semibold text-zinc-400 px-0.5 select-none">
          <span>0 (Geral)</span>
          <span className="text-cyan-400/80">6.0 (Bom)</span>
          <span className="text-amber-400/80">7.0 (Ótimo)</span>
          <span className="text-rose-400/80 font-bold">8.0+ (Top)</span>
        </div>
      </div>

      {/* Botões Rápidos de Preset */}
      <div className="flex items-center gap-2 pt-1 overflow-x-auto scrollbar-none">
        {presets.map((p) => {
          const isSelected = value === p.val;
          return (
            <button
              key={p.val}
              onClick={() => onChange(p.val)}
              className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center select-none border ${
                isSelected
                  ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-102"
                  : "bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border-white/5"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
