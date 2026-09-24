"use client";

import { useState, useEffect, useCallback } from "react";
import { CatalogItem } from "@/types/catalog";

const STORAGE_KEY = "onstream_favorites_v1";
const EVENT_NAME = "onstream_favorites_changed";

export function useFavorites() {
  const [favorites, setFavorites] = useState<CatalogItem[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Carrega os favoritos do localStorage
  const loadFavorites = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      } else {
        setFavorites([]);
      }
    } catch (e) {
      console.error("Falha ao carregar favoritos do localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadFavorites();

    const handleStorageChange = () => {
      loadFavorites();
    };

    window.addEventListener(EVENT_NAME, handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadFavorites]);

  const saveFavorites = (items: CatalogItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setFavorites(items);
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch (e) {
      console.error("Falha ao salvar favoritos:", e);
    }
  };

  const isFavorite = useCallback(
    (id: string | number) => {
      const strId = String(id);
      return favorites.some((item) => String(item.id) === strId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (item: CatalogItem) => {
      const strId = String(item.id);
      const exists = favorites.some((fav) => String(fav.id) === strId);
      let updated: CatalogItem[];

      if (exists) {
        updated = favorites.filter((fav) => String(fav.id) !== strId);
      } else {
        updated = [item, ...favorites];
      }

      saveFavorites(updated);
    },
    [favorites]
  );

  const removeFavorite = useCallback(
    (id: string | number) => {
      const strId = String(id);
      const updated = favorites.filter((fav) => String(fav.id) !== strId);
      saveFavorites(updated);
    },
    [favorites]
  );

  const clearFavorites = useCallback(() => {
    saveFavorites([]);
  }, []);

  return {
    favorites,
    isLoaded,
    favoritesCount: favorites.length,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
  };
}
