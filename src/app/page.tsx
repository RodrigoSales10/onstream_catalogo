"use client";

import React, { useState, useEffect, useTransition } from "react";
import { ContentType, CatalogItem } from "@/types/catalog";
import { fetchCatalog } from "@/services/catalogService";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilters } from "@/components/CategoryFilters";
import { ContentGrid } from "@/components/ContentGrid";
import { DetailModal } from "@/components/DetailModal";
import { WhatsAppFloatButton } from "@/components/WhatsAppFloatButton";
import { Sparkles, ShieldCheck, Zap, HeartHandshake } from "lucide-react";

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

  const [, startTransition] = useTransition();

  // Sincronização de dados da página 1 conforme filtros mudam
  useEffect(() => {
    let ignore = false;

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
  }, [activeType, search, selectedCategory, selectedYear]);

  // Ao trocar de aba, reseta filtros específicos e aciona loading
  const handleTypeChange = (newType: ContentType) => {
    if (newType !== activeType) {
      setIsLoading(true);
      setActiveType(newType);
      setSelectedCategory("");
      setSelectedYear("");
      setSearch("");
    }
  };

  const handleCategorySelect = (category: string) => {
    setIsLoading(true);
    setSelectedCategory(category);
  };

  const handleYearSelect = (year: string) => {
    setIsLoading(true);
    setSelectedYear(year);
  };

  const handleSearchChange = (term: string) => {
    setIsLoading(true);
    setSearch(term);
  };

  // Carregar mais (próxima página)
  const handleLoadMore = () => {
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
    setIsLoading(true);
    setSearch("");
    setSelectedCategory("");
    setSelectedYear("");
  };

  const hasMore = currentPage < totalPages;

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-[#f8fafc]">
      {/* Top Navbar */}
      <Navbar
        activeType={activeType}
        onTypeChange={handleTypeChange}
        totalRecords={totalRecords}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 glass-panel border border-white/10 shadow-2xl">
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-4 max-w-3xl">
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
          </div>
        </section>

        {/* Search & Filter Bar */}
        <section className="flex flex-col gap-4 w-full">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            activeType={activeType}
          />

          <CategoryFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            years={years}
            selectedYear={selectedYear}
            onSelectYear={handleYearSelect}
            activeType={activeType}
          />
        </section>

        {/* Content Listing Grid */}
        <section className="w-full">
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
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 mt-12 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400">ONSTREAM</span>
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
