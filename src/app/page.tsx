"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Image from "next/image";
import { ContentType, CatalogItem } from "@/types/catalog";
import { fetchCatalog } from "@/services/catalogService";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilters } from "@/components/CategoryFilters";
import { ContentGrid } from "@/components/ContentGrid";
import { DetailModal } from "@/components/DetailModal";
import { WhatsAppFloatButton } from "@/components/WhatsAppFloatButton";
import { Sparkles, ShieldCheck, Zap, HeartHandshake, Heart, Film } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export default function Home() {
  const [activeType, setActiveType] = useState<ContentType>("filmes");
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [years, setYears] = useState<(string | number)[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  const { favorites, isLoaded: isFavoritesLoaded, favoritesCount } = useFavorites();
  const [, startTransition] = useTransition();

  // Filtragem dos favoritos em memória
  const filteredFavorites = useMemo(() => {
    if (activeType !== "favoritos") return [];
    let result = [...favorites];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }

    if (selectedCategory.trim()) {
      result = result.filter((f) => f.category === selectedCategory);
    }

    return result;
  }, [activeType, favorites, search, selectedCategory]);

  // Categorias dos favoritos
  const favoriteCategories = useMemo(() => {
    if (activeType !== "favoritos") return [];
    const cats = favorites.map((f) => f.category).filter(Boolean);
    return Array.from(new Set(cats));
  }, [activeType, favorites]);

  // Sincronização de dados da página 1 conforme filtros mudam
  useEffect(() => {
    let ignore = false;

    // Se estiver na aba Favoritos, usa dados locais
    if (activeType === "favoritos") {
      setIsLoading(false);
      setItems(filteredFavorites);
      setCategories(favoriteCategories);
      setYears([]);
      setTotalRecords(filteredFavorites.length);
      setTotalPages(1);
      setCurrentPage(1);
      return;
    }

    // Consulta de catálogo remoto (filmes, series, canais)
    fetchCatalog({
      type: activeType,
      page: 1,
      limit: 36,
      search: search || undefined,
      filter_grupo: selectedCategory || undefined,
      filter_ano: selectedYear || undefined,
    })
      .then((response) => {
        if (!ignore) {
          startTransition(() => {
            setItems(response.data);
            setCategories(response.filters.grupos || []);
            setYears(response.filters.anos || []);
            setTotalRecords(response.total_records);
            setTotalPages(response.total_pages);
            setCurrentPage(response.current_page);
            setIsLoading(false);
          });
        }
      })
      .catch((err) => {
        console.error("Falha ao carregar conteúdos:", err);
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeType, search, selectedCategory, selectedYear, filteredFavorites, favoriteCategories]);

  // Ao trocar de aba, reseta filtros específicos e aciona loading
  const handleTypeChange = (newType: ContentType) => {
    if (newType !== activeType) {
      setIsLoading(newType !== "favoritos");
      setActiveType(newType);
      setSelectedCategory("");
      setSelectedYear("");
      setSearch("");
    }
  };

  const handleCategorySelect = (category: string) => {
    if (activeType !== "favoritos") setIsLoading(true);
    setSelectedCategory(category);
  };

  const handleYearSelect = (year: string) => {
    if (activeType !== "favoritos") setIsLoading(true);
    setSelectedYear(year);
  };

  const handleSearchChange = (term: string) => {
    if (activeType !== "favoritos") setIsLoading(true);
    setSearch(term);
  };

  // Carregar mais (próxima página)
  const handleLoadMore = () => {
    if (activeType === "favoritos") return;

    if (currentPage < totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchCatalog({
        type: activeType,
        page: currentPage + 1,
        limit: 36,
        search: search || undefined,
        filter_grupo: selectedCategory || undefined,
        filter_ano: selectedYear || undefined,
      })
        .then((response) => {
          startTransition(() => {
            setItems((prev) => [...prev, ...response.data]);
            setCurrentPage(response.current_page);
            setIsLoadingMore(false);
          });
        })
        .catch((err) => {
          console.error("Falha ao carregar mais conteúdos:", err);
          setIsLoadingMore(false);
        });
    }
  };

  // Limpar busca e filtros
  const handleResetFilters = () => {
    setIsLoading(activeType !== "favoritos");
    setSearch("");
    setSelectedCategory("");
    setSelectedYear("");
  };

  const hasMore = activeType !== "favoritos" && currentPage < totalPages;

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-[#f8fafc]">
      {/* Top Navbar */}
      <Navbar
        activeType={activeType}
        onTypeChange={handleTypeChange}
        totalRecords={activeType === "favoritos" ? favoritesCount : totalRecords}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 glass-panel border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-4 max-w-2xl">
            {activeType === "favoritos" ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold w-fit">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>Sua Coleção Pessoal Salva</span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  Meus Títulos{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500">
                    Favoritos
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl">
                  {favoritesCount > 0
                    ? `Você tem ${favoritesCount} título(s) salvos na sua lista. Toque em qualquer card para ver a sinopse completa e pedir liberação imediata no WhatsApp.`
                    : "Você ainda não favoritou nenhum canal, filme ou série. Toque no ícone de coração nos cards para criar sua lista personalizada de reprodução."}
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold w-fit">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Grade Completa de Programação & Lançamentos</span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  O Melhor do Entretenimento em{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Alta Definição
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl">
                  Navegue por filmes recém-lançados, suas séries favoritas e canais ao vivo com futebol, esportes e variedades. Escolha o que deseja assistir e libere seu teste de 6 horas grátis no WhatsApp.
                </p>

                {/* Feature Highlights */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs sm:text-sm text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Estabilidade 99.9%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Sem Travamentos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-cyan-400" />
                    <span>Suporte Dedicado</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Brand Visual Emblem (Desktop & Tablet) */}
          <div className="relative hidden md:flex items-center justify-center flex-shrink-0 z-10">
            <div className="relative w-36 h-36 lg:w-44 lg:h-44 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,229,255,0.2)] border border-cyan-400/20 bg-slate-950/80 backdrop-blur-xl group hover:border-cyan-400/50 transition-all duration-500 hover:scale-105">
              <Image
                src={activeType === "series" ? "/logo-series.png" : "/logo-onstream.png"}
                alt="OnStream Identidade Oficial"
                fill
                className="object-cover rounded-2xl"
                priority
                unoptimized
              />
            </div>
          </div>
        </section>

        {/* Search & Filter Bar */}
        <section className="flex flex-col gap-4 w-full">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            activeType={activeType}
          />

          {categories.length > 0 && (
            <CategoryFilters
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
              years={years}
              selectedYear={selectedYear}
              onSelectYear={handleYearSelect}
              activeType={activeType}
            />
          )}
        </section>

        {/* Content Listing Grid */}
        <section className="w-full">
          {activeType === "favoritos" && favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl bg-slate-900/40 border border-white/5 max-w-lg mx-auto">
              <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 mb-4 text-rose-400">
                <Heart className="w-10 h-10 fill-rose-500/30" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Sua lista de favoritos está vazia
              </h3>
              <p className="text-sm text-zinc-400 max-w-xs mb-6">
                Toque no ícone de coração nos cards de canais, filmes ou séries para salvá-los aqui e acessar rapidamente.
              </p>
              <button
                onClick={() => handleTypeChange("filmes")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs sm:text-sm hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)]"
              >
                <Film className="w-4 h-4" />
                <span>Explorar Filmes & Lançamentos</span>
              </button>
            </div>
          ) : (
            <ContentGrid
              items={items}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              totalRecords={totalRecords}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onItemClick={(item) => setSelectedItem(item)}
              onResetFilters={handleResetFilters}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 mt-12 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <div className="relative w-7 h-7 rounded-xl overflow-hidden border border-white/10 shadow-sm flex-shrink-0 bg-black/40">
              <Image
                src="/logo-onstream.png"
                alt="OnStream Logo"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <span className="font-bold text-zinc-300">ONSTREAM</span>
            <span>•</span>
            <span>Vitrine Oficial de Demonstração</span>
          </div>
          <p>© {new Date().getFullYear()} OnStream. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Detail Modal */}
      <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      {/* Floating WhatsApp CTA Button */}
      <WhatsAppFloatButton />
    </div>
  );
}
