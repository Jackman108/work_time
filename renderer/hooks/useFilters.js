/**
 * Хук для управления фильтрами на страницах
 * Устраняет дублирование логики фильтрации
 * Следует принципам DRY и Single Responsibility
 * 
 * @module renderer/hooks/useFilters
 */

import { useState, useCallback } from 'react';

/**
 * Хук для управления фильтрами
 * 
 * @param {Object} initialFilters - Начальные значения фильтров
 * @returns {Object} { filters, setFilter, resetFilters, updateFilters }
 */
export function useFilters(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);

  /**
   * Установить значение одного фильтра
   * @param {string} key - Ключ фильтра
   * @param {*} value - Значение фильтра
   */
  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || null
    }));
  }, []);

  /**
   * Обновить несколько фильтров одновременно
   * @param {Object} newFilters - Новые значения фильтров
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  /**
   * Сбросить все фильтры к начальным значениям
   */
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

