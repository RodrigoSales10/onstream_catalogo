"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { CatalogItem, TmdbMetadata } from "@/types/catalog";
import {
  X,
  Tv,
  Film,
  Clapperboard,
  MessageCircle,
  Calendar,
  Tag,
  Layers,
  CheckCircle2,
  Star,
  Heart,
  Loader2,
  Sparkles,
} from "lucide-react";
import { buildWhatsAppLink } from "@/services/catalogService";
import { useFavorites } from "@/hooks/useFavorites";

interface DetailModalProps {
  item: CatalogItem | null;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ item, onClose }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [tmdb, setTmdb] = useState<TmdbMetadata | null>(null);
  const [isLoadingTmdb, setIsLoadingTmdb] = useState<boolean>(false);

  const isFav = item ? isFavorite(item.id) : false;

  const hasPreloadedMetadata = Boolean(item?.synopsis);

  // Se o item já tiver metadados persistidos no Supabase, usa diretamente sem consultar TMDB
  const effectiveTmdb: TmdbMetadata | null = hasPreloadedMetadata && item
    ? {
        found: true,
        title: item.title,
        overview: item.synopsis || undefined,
        genres: item.genres || (item.mainGenre ? [item.mainGenre] : []),
        rating: item.tmdbRating || undefined,
        posterPath: item.posterUrl,
        backdropPath: item.backdropUrl,
      }
    : tmdb;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (!item) return;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    // Se já tem sinopse gravada no banco ou é canal ao vivo, não precisa chamar a API TMDB
    if (item.synopsis || (item.type !== "filmes" && item.type !== "series")) {
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchTmdb = async () => {
      setIsLoadingTmdb(true);
      try {
        const params = new URLSearchParams();
        params.set("query", item.title);
        params.set("type", item.type);
        if (item.year) params.set("year", String(item.year));

        const res = await fetch(`/api/tmdb?${params.toString()}`, {
          signal: controller.signal,
        });
        if (res.ok && isMounted) {
          const data: TmdbMetadata | null = await res.json();
          if (data && data.found) {
            setTmdb(data);
          }
        }
      } catch (err: unknown) {
        if (isMounted && (err as Error)?.name !== "AbortError") {
          console.warn("Erro ao buscar sinopse no TMDB:", err);
        }
      } finally {
        if (isMounted) {
          setIsLoadingTmdb(false);
        }
      }
    };

    const timer = setTimeout(fetchTmdb, 0);

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timer);
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

  // Imagem prioritária (se o TMDB tiver poster em alta e o item não tiver logo bom)
  const displayPoster = item.posterUrl || effectiveTmdb?.posterPath;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Window */}
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto glass-panel-glow rounded-3xl bg-slate-950 border border-white/10 shadow-2xl z-10 flex flex-col overflow-hidden">
        {/* Backdrop Banner (Cinema Style) */}
        {effectiveTmdb?.backdropPath && (
          <div className="relative w-full h-44 sm:h-56 overflow-hidden flex-shrink-0">
            <Image
              src={effectiveTmdb.backdropPath}
              alt={item.title}
              fill
              className="object-cover opacity-35"
              sizes="(max-width: 768px) 100vw, 800px"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-white/20 text-zinc-300 hover:text-white transition-all z-30 backdrop-blur-md border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content Body */}
        <div className={`p-6 sm:p-8 flex flex-col sm:flex-row gap-6 ${effectiveTmdb?.backdropPath ? "-mt-16 sm:-mt-20 relative z-10" : ""}`}>
          {/* Poster Column */}
          <div className="w-full sm:w-5/12 flex-shrink-0 flex flex-col items-center">
            <div className="relative w-full max-w-[240px] aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl">
              {displayPoster ? (
                <Image
                  src={displayPoster}
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

            {/* Favorite Button Under Poster */}
            <button
              onClick={() => toggleFavorite(item)}
              className={`mt-4 w-full max-w-[240px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                isFav
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  : "bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border-white/10"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
              <span>{isFav ? "Salvo nos Favoritos" : "Adicionar aos Favoritos"}</span>
            </button>
          </div>

          {/* Details & Information Column */}
          <div className="w-full sm:w-7/12 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold w-fit">
                  {badgeInfo.icon}
                  <span>{badgeInfo.label}</span>
                </div>

                {/* Rating Badge TMDB */}
                {effectiveTmdb?.rating && effectiveTmdb.rating > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{effectiveTmdb.rating} / 10</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                {item.title}
              </h2>

              {/* TMDB Genres */}
              {effectiveTmdb?.genres && effectiveTmdb.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {effectiveTmdb.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-medium text-zinc-300"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta details list */}
              <div className="flex flex-col gap-2 pt-2 text-xs sm:text-sm text-zinc-300">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  <span className="text-zinc-400">Categoria:</span>
                  <span className="font-semibold text-white">{item.category}</span>
                </div>

                {(item.year || effectiveTmdb?.releaseDate) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span className="text-zinc-400">Lançamento:</span>
                    <span className="font-semibold text-white">
                      {item.year || effectiveTmdb?.releaseDate?.slice(0, 4)}
                    </span>
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

              {/* Sinopse TMDB Section */}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sinopse & Detalhes</span>
                </div>

                {isLoadingTmdb ? (
                  <div className="flex items-center gap-2 py-4 text-xs text-cyan-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Consultando sinopse oficial no TMDB...</span>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-h-36 overflow-y-auto pr-2 scrollbar-thin">
                    {effectiveTmdb?.overview ||
                      "Assista a este e milhares de outros títulos em qualidade 4K e Full HD no servidor OnStream. Libere seu teste grátis de 6 horas agora mesmo!"}
                  </p>
                )}
              </div>
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
    </div>
  );
};
