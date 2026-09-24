"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DEVICE_TUTORIALS,
  APPS_CATALOG,
  TROUBLESHOOTING_GUIDES,
  OFFICIAL_VIDEOS,
  DeviceTutorial,
  buildSupportWhatsAppLink,
} from "@/data/supportData";
import {
  Tv,
  Smartphone,
  Monitor,
  Download,
  Copy,
  Check,
  Play,
  X,
  ExternalLink,
  MessageCircle,
  ArrowLeft,
  Sparkles,
  Zap,
  ShieldCheck,
  Wifi,
  Wrench,
  HelpCircle,
  Flame,
  ChevronDown,
  Film,
} from "lucide-react";

export default function SuportePage() {
  const [activeTab, setActiveTab] = useState<"tutoriais" | "apps" | "travamento" | "videos">("tutoriais");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("firestick");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<{ url: string; title: string } | null>(null);
  const [selectedAppCategory, setSelectedAppCategory] = useState<string>("todos");
  const [openTroubleId, setOpenTroubleId] = useState<string>("chuveiro");

  const selectedDevice: DeviceTutorial =
    DEVICE_TUTORIALS.find((d) => d.id === selectedDeviceId) || DEVICE_TUTORIALS[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const filteredApps = APPS_CATALOG.filter((app) => {
    if (selectedAppCategory === "todos") return true;
    return app.category === selectedAppCategory;
  });

  return (
    <div className="min-h-screen bg-[#060913] text-[#f8fafc] flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* 1. Header do Suporte */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo Oficial + Voltar ao Catálogo */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-cyan-400" />
              <span>Voltar ao Catálogo</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2.5 select-none">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-cyan-400/30 bg-black/60">
                <Image src="/logo-onstream.png" alt="OnStream" fill className="object-cover" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-white">
                ON<span className="text-cyan-400">STREAM</span>{" "}
                <span className="text-zinc-400 font-normal">| Central de Ajuda</span>
              </span>
            </div>
          </div>

          {/* Botão de WhatsApp Max no Header */}
          <div className="flex items-center gap-3">
            <a
              href={buildSupportWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-[#25d366] text-black hover:bg-[#1ebd56] transition-all duration-200 shadow-[0_0_18px_rgba(37,211,102,0.35)] hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-black" />
              <span className="hidden xs:inline">Falar com Suporte</span>
              <span className="xs:hidden">Suporte</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden border-b border-white/5 py-10 sm:py-14 bg-gradient-to-b from-cyan-950/20 via-transparent to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(0,229,255,0.15),transparent)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Base de Conhecimento Oficial OnStream</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
            Como instalar e assistir em <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">qualquer aparelho</span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-2xl">
            Passo a passo rápido para Smart TVs, TV Box, Fire Stick, Celulares e Computadores. Baixe os aplicativos oficiais e tire dúvidas técnicas.
          </p>

          {/* Destaque com métricas de confiança */}
          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:gap-6 text-xs text-zinc-300 font-medium">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Instalação em 2 Minutos</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>HD Player Gratuito (Código 4100)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10">
              <Wifi className="w-4 h-4 text-purple-400" />
              <span>Tecnologia Anti-Travamento</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Abas Principais de Conteúdo */}
      <section className="sticky top-16 sm:top-20 z-30 bg-[#060913]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-start sm:justify-center gap-2 py-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("tutoriais")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "tutoriais"
                  ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                  : "bg-slate-900/80 text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Tutoriais por Aparelho</span>
            </button>

            <button
              onClick={() => setActiveTab("apps")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "apps"
                  ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                  : "bg-slate-900/80 text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Aplicativos & Códigos</span>
            </button>

            <button
              onClick={() => setActiveTab("travamento")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "travamento"
                  ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                  : "bg-slate-900/80 text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Centro Anti-Travamento</span>
            </button>

            <button
              onClick={() => setActiveTab("videos")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "videos"
                  ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                  : "bg-slate-900/80 text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              <Play className="w-4 h-4 text-rose-400" />
              <span>Vídeos Tutoriais</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Conteúdo Dinâmico das Abas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ABA 1: TUTORIAIS POR APARELHO */}
        {activeTab === "tutoriais" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Seletor de Aparelhos (Grid de Botões) */}
            <div>
              <h2 className="text-xs uppercase font-bold tracking-wider text-zinc-400 mb-3">
                Selecione o seu aparelho:
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                {DEVICE_TUTORIALS.map((device) => {
                  const isSelected = device.id === selectedDeviceId;
                  return (
                    <button
                      key={device.id}
                      onClick={() => setSelectedDeviceId(device.id)}
                      className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-200 select-none ${
                        isSelected
                          ? "bg-gradient-to-b from-cyan-500/20 to-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.25)] text-white scale-[1.02]"
                          : "bg-slate-900/60 border-white/5 hover:border-white/20 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                          isSelected
                            ? "bg-cyan-500 text-black font-bold shadow-md"
                            : "bg-white/5 text-zinc-300"
                        }`}
                      >
                        {device.iconType === "firestick" && <Flame className="w-5 h-5" />}
                        {device.iconType === "samsung" && <Tv className="w-5 h-5" />}
                        {device.iconType === "lg" && <Tv className="w-5 h-5" />}
                        {device.iconType === "roku" && <Tv className="w-5 h-5" />}
                        {device.iconType === "android" && <Smartphone className="w-5 h-5" />}
                        {device.iconType === "apple" && <Smartphone className="w-5 h-5" />}
                        {device.iconType === "desktop" && <Monitor className="w-5 h-5" />}
                      </div>
                      <span className="text-xs font-bold leading-tight line-clamp-1">
                        {device.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Painel do Aparelho Selecionado */}
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Cabeçalho do Aparelho */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold mb-2">
                    {selectedDevice.badge}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Guia de Instalação: {selectedDevice.name}
                  </h3>
                </div>

                {/* Botão de Teste WhatsApp no Topo do Tutorial */}
                <a
                  href={buildSupportWhatsAppLink("Tutorial", selectedDevice.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25d366] text-black font-bold text-xs sm:text-sm hover:bg-[#1ebd56] transition-all shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:scale-105 active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-black" />
                  <span>Liberar Teste de 6h para este Aparelho</span>
                </a>
              </div>

              {/* Card Destaque do App Recomendado */}
              <div className="my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                    Aplicativo Recomendado
                  </span>
                  <h4 className="text-lg font-bold text-white mt-0.5">
                    {selectedDevice.recommendedApp.name}
                  </h4>
                  {selectedDevice.recommendedApp.providerId && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-300">
                      <span className="font-semibold text-zinc-400">Código de Provedor Oficial:</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/40">
                        Provider ID: {selectedDevice.recommendedApp.providerId}
                      </span>
                    </div>
                  )}
                </div>

                {/* Códigos Downloader ou Botões Rápidos */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedDevice.recommendedApp.downloaderCode && (
                    <button
                      onClick={() =>
                        handleCopy(
                          selectedDevice.recommendedApp.downloaderCode!,
                          `code-${selectedDevice.id}`
                        )
                      }
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-cyan-400/40 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                      title="Copiar Código Downloader"
                    >
                      <span>Downloader: {selectedDevice.recommendedApp.downloaderCode}</span>
                      {copiedCode === `code-${selectedDevice.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </button>
                  )}

                  {selectedDevice.recommendedApp.downloadUrl && (
                    <a
                      href={selectedDevice.recommendedApp.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Arquivo</span>
                    </a>
                  )}

                  {selectedDevice.recommendedApp.appStoreUrl && (
                    <a
                      href={selectedDevice.recommendedApp.appStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir na Loja</span>
                    </a>
                  )}

                  {selectedDevice.videoTutorial && (
                    <button
                      onClick={() =>
                        setActiveVideoUrl({
                          url: selectedDevice.videoTutorial!.url,
                          title: selectedDevice.videoTutorial!.title,
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-rose-300" />
                      <span>Ver Vídeo Passo a Passo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Passos do Tutorial */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-bold tracking-wider text-zinc-400 mb-2">
                  Passo a Passo de Instalação:
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  {selectedDevice.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start gap-3.5">
                        <span className="flex-shrink-0 w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <h5 className="text-sm sm:text-base font-bold text-white mb-1">
                            {step.title}
                          </h5>
                          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                            {step.description}
                          </p>

                          {step.highlight && (
                            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 border border-cyan-400/30 text-cyan-300 font-mono text-xs font-bold">
                              <span>{step.highlight}</span>
                              <button
                                onClick={() => handleCopy(step.highlight!, `step-${idx}`)}
                                className="p-1 hover:text-white transition-colors"
                                title="Copiar"
                              >
                                {copiedCode === `step-${idx}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}

                          {step.tip && (
                            <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2">
                              <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                              <span>{step.tip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternativas de Apps */}
              {selectedDevice.alternatives && selectedDevice.alternatives.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-zinc-300">Outras opções para este aparelho:</span>
                    {selectedDevice.alternatives.map((alt, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-zinc-300"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Banner Inferior de Conversão do Dispositivo */}
              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    Pronto para testar no seu {selectedDevice.shortName}?
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 mt-0.5">
                    Chame nosso atendente no WhatsApp e receba suas credenciais temporárias de 6 horas sem custo.
                  </p>
                </div>
                <a
                  href={buildSupportWhatsAppLink("Instalação Concluída", selectedDevice.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25d366] text-black font-bold text-sm hover:bg-[#1ebd56] transition-all shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:scale-105 active:scale-95"
                >
                  <MessageCircle className="w-5 h-5 fill-black" />
                  <span>Liberar Teste Grátis no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: APLICATIVOS & CÓDIGOS DOWNLOADER */}
        {activeTab === "apps" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filtro de Categoria dos Apps */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "todos", label: "Todos os Apps" },
                { id: "android", label: "Android & TV Box" },
                { id: "apple", label: "Apple (iOS/Apple TV)" },
                { id: "windows", label: "Windows PC" },
                { id: "mac", label: "macOS (Apple Mac)" },
                { id: "linux", label: "Linux" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedAppCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedAppCategory === cat.id
                      ? "bg-cyan-500 text-black font-bold shadow-md"
                      : "bg-slate-900 border border-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Grid dos Aplicativos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    app.isRecommended
                      ? "bg-gradient-to-b from-cyan-950/40 to-slate-950 border-cyan-500/40 shadow-[0_0_20px_rgba(0,229,255,0.15)]"
                      : "bg-slate-950/60 border-white/5 hover:border-white/15"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        {app.targetDevice}
                      </span>
                      {app.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            app.isRecommended
                              ? "bg-cyan-500 text-black"
                              : "bg-white/10 text-zinc-300"
                          }`}
                        >
                          {app.badge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-white">{app.name}</h4>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      {app.description}
                    </p>

                    {/* Código Downloader com Botão de Copiar */}
                    {app.downloaderCode && (
                      <div className="mt-4 p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-zinc-400">
                            Código Downloader:
                          </span>
                          <span className="text-sm font-mono font-extrabold text-cyan-300 tracking-wider">
                            {app.downloaderCode}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(app.downloaderCode!, app.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                        >
                          {copiedCode === app.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Provider ID */}
                    {app.providerId && (
                      <div className="mt-2 text-xs text-zinc-300 flex items-center gap-2">
                        <span className="text-zinc-400 font-medium">Provider ID Oficial:</span>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                          {app.providerId}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Ações de Download */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                    {app.directDownloadUrl ? (
                      <a
                        href={app.directDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500 text-cyan-300 hover:text-black text-xs font-bold transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar Aplicativo</span>
                      </a>
                    ) : app.appStoreUrl ? (
                      <a
                        href={app.appStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir na App Store</span>
                      </a>
                    ) : null}

                    <a
                      href={buildSupportWhatsAppLink("Download", app.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-[#25d366]/20 border border-[#25d366]/40 hover:bg-[#25d366] text-[#25d366] hover:text-black transition-all"
                      title="Pedir ajuda no WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 3: CENTRO ANTI-TRAVAMENTO (DIAGNÓSTICO TÉCNICO) */}
        {activeTab === "travamento" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Box Introdutório */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-2">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Protocolo de Estabilidade Máxima</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  O IPTV está travando ou a imagem sumiu?
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">
                  95% dos travamentos não são culpa do servidor, mas sim de rotas saturadas de operadoras, bloqueio de DNS ou cabo de rede ausente. Siga o diagnóstico abaixo para resolver em poucos minutos!
                </p>
              </div>

              <a
                href="https://fast.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-bold text-xs sm:text-sm hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>Abrir Teste no Fast.com</span>
              </a>
            </div>

            {/* Accordion dos Tópicos Anti-Travamento */}
            <div className="space-y-3">
              {TROUBLESHOOTING_GUIDES.map((guide) => {
                const isOpen = openTroubleId === guide.id;
                return (
                  <div
                    key={guide.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenTroubleId(isOpen ? "" : guide.id)}
                      className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isOpen ? "bg-cyan-500 text-black" : "bg-white/5 text-zinc-300"
                          }`}
                        >
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-white">
                            {guide.title}
                          </h4>
                          <p className="text-xs text-zinc-400 hidden sm:block mt-0.5">
                            {guide.summary}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-zinc-400 transition-transform ${
                          isOpen ? "rotate-180 text-cyan-400" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-2 border-t border-white/5 text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-3 whitespace-pre-line">
                        {guide.content}

                        {/* Botões Rápidos de Ação dependendo do item */}
                        {guide.id === "dns" && (
                          <div className="pt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() => handleCopy("8.8.8.8", "dns-google")}
                              className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs font-mono font-bold text-cyan-300 hover:border-cyan-400 transition-colors flex items-center gap-1.5"
                            >
                              <span>Copiar DNS Google (8.8.8.8)</span>
                              {copiedCode === "dns-google" ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleCopy("1.1.1.1", "dns-cloudflare")}
                              className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs font-mono font-bold text-cyan-300 hover:border-cyan-400 transition-colors flex items-center gap-1.5"
                            >
                              <span>Copiar DNS Cloudflare (1.1.1.1)</span>
                              {copiedCode === "dns-cloudflare" ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA 4: VÍDEOS TUTORIAIS */}
        {activeTab === "videos" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-bold text-white">Vídeos Oficiais OnStream</h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Assista em vídeo a demonstração direta na tela de login, controle remoto e navegação.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {OFFICIAL_VIDEOS.map((video) => (
                <div
                  key={video.id}
                  onClick={() => setActiveVideoUrl({ url: video.url, title: video.title })}
                  className="group cursor-pointer rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden hover:border-cyan-400/50 transition-all hover:scale-[1.02] shadow-xl flex flex-col"
                >
                  <div className="relative aspect-video bg-black/80 flex items-center justify-center group-hover:bg-cyan-950/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/90 text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.6)] group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-zinc-300">
                        {video.duration}
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-cyan-400">
                        {video.category}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors line-clamp-2">
                        {video.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {video.description}
                      </p>
                    </div>

                    <span className="mt-3 text-xs font-semibold text-cyan-400 flex items-center gap-1">
                      <span>Assistir Agora</span>
                      <Play className="w-3 h-3 fill-cyan-400" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 5. Modal de Reprodução de Vídeo */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-3xl bg-slate-950 border border-white/20 overflow-hidden shadow-2xl">
            {/* Barra do Modal */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                {activeVideoUrl.title}
              </h4>
              <button
                onClick={() => setActiveVideoUrl(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src={activeVideoUrl.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. Footer de Conversão Global */}
      <footer className="border-t border-white/10 bg-slate-950 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white">
                ON<span className="text-cyan-400">STREAM</span> 4K
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                Suporte Dedicado
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Ativações automáticas de testes grátis em menos de 1 minuto pelo WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors border border-white/10 flex items-center gap-1.5"
            >
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Ver Catálogo de Filmes e Séries</span>
            </Link>

            <a
              href={buildSupportWhatsAppLink("Rodapé", "Geral")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25d366] text-black font-bold text-xs sm:text-sm hover:bg-[#1ebd56] transition-all shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 fill-black" />
              <span>Pedir Teste Grátis no WhatsApp</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
