/**
 * Хук для управления фильтрами на страницах
 */

import { useState, useCallback } from 'react';

interface UseFiltersReturn<T> {
  filters: T;
  setFilter: <K extends keyof T>(key: K, value: T[K] | null) => void;
  updateFilters: (newFilters: Partial<T>) => void;
  resetFilters: () => void;
}

export function useFilters<T extends Record<string, unknown>>(initialFilters: T): UseFiltersReturn<T> {
  const [filters, setFilters] = useState<T>(initialFilters);

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K] | null) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    filters,
    setFilter,
    updateFilters,
    resetFilters
  };
}


