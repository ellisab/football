"use client";

import { useSyncExternalStore } from "react";
import {
  EMPTY_FAVORITES,
  FAVORITES_STORAGE_KEY,
  type FavoriteKind,
  type FavoritesSnapshot,
  isFavorite,
  normalizeFavoriteId,
  parseFavoritesStorage,
  serializeFavorites,
  updateFavorite,
} from "./favorites-storage";

const FAVORITES_CHANGE_EVENT = "spieltag:favorites-change";

const subscribers = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSnapshot = EMPTY_FAVORITES;
let isListening = false;

const readStorage = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(FAVORITES_STORAGE_KEY);
  } catch {
    return null;
  }
};

const getFavoritesSnapshot = (): FavoritesSnapshot => {
  if (typeof window === "undefined") return EMPTY_FAVORITES;

  const raw = readStorage();
  if (raw === cachedRaw) return cachedSnapshot;

  cachedRaw = raw;
  cachedSnapshot = parseFavoritesStorage(raw);
  return cachedSnapshot;
};

const emitChange = () => {
  for (const subscriber of subscribers) subscriber();
};

const handleStorage = (event: StorageEvent) => {
  if (event.key !== null && event.key !== FAVORITES_STORAGE_KEY) return;

  cachedRaw = undefined;
  emitChange();
};

const handleSameTabChange = () => {
  emitChange();
};

const startListening = () => {
  if (isListening || typeof window === "undefined") return;

  window.addEventListener("storage", handleStorage);
  window.addEventListener(FAVORITES_CHANGE_EVENT, handleSameTabChange);
  isListening = true;
};

const stopListening = () => {
  if (!isListening || typeof window === "undefined" || subscribers.size > 0) {
    return;
  }

  window.removeEventListener("storage", handleStorage);
  window.removeEventListener(FAVORITES_CHANGE_EVENT, handleSameTabChange);
  isListening = false;
};

const subscribeToFavorites = (subscriber: () => void) => {
  subscribers.add(subscriber);
  startListening();

  return () => {
    subscribers.delete(subscriber);
    stopListening();
  };
};

const writeFavorites = (snapshot: FavoritesSnapshot): boolean => {
  if (typeof window === "undefined") return false;

  const raw = serializeFavorites(snapshot);

  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, raw);
  } catch {
    return false;
  }

  cachedRaw = raw;
  cachedSnapshot = snapshot;
  window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT));
  return true;
};

export const setFavorite = (
  kind: FavoriteKind,
  id: string,
  selected: boolean
): boolean => {
  const normalizedId = normalizeFavoriteId(id);
  if (!normalizedId) return false;

  const current = getFavoritesSnapshot();
  if (isFavorite(current, kind, normalizedId) === selected) return selected;

  const next = updateFavorite(current, kind, normalizedId, selected);
  return writeFavorites(next) ? selected : !selected;
};

export const useFavorites = (): FavoritesSnapshot => {
  return useSyncExternalStore(
    subscribeToFavorites,
    getFavoritesSnapshot,
    () => EMPTY_FAVORITES
  );
};

export const useIsFavorite = (kind: FavoriteKind, id: string): boolean => {
  return isFavorite(useFavorites(), kind, id);
};
