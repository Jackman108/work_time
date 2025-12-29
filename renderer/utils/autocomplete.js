/**
 * Утилита для автозаполнения полей форм
 * Сохраняет историю введённых значений в localStorage
 * Предоставляет подсказки при вводе
 * 
 * @module renderer/utils/autocomplete
 */

const STORAGE_PREFIX = 'autocomplete_';
const MAX_HISTORY = 20;

/**
 * Сохранить значение в историю автозаполнения
 * @param {string} fieldName - Имя поля
 * @param {string} value - Значение
 */
export function saveToHistory(fieldName, value) {
  if (!value || !value.trim()) return;

  try {
    const key = `${STORAGE_PREFIX}${fieldName}`;
    const history = getHistory(fieldName);
    
    // Удаляем дубликаты
    const filtered = history.filter(item => item.toLowerCase() !== value.toLowerCase());
    
    // Добавляем новое значение в начало
    const updated = [value.trim(), ...filtered].slice(0, MAX_HISTORY);
    
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Ошибка сохранения в историю автозаполнения:', error);
  }
}

/**
 * Получить историю значений для поля
 * @param {string} fieldName - Имя поля
 * @returns {Array<string>} Массив значений
 */
export function getHistory(fieldName) {
  try {
    const key = `${STORAGE_PREFIX}${fieldName}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Ошибка получения истории автозаполнения:', error);
    return [];
  }
}

/**
 * Получить подсказки по введённому тексту
 * @param {string} fieldName - Имя поля
 * @param {string} input - Введённый текст
 * @param {number} limit - Максимальное количество подсказок
 * @returns {Array<string>} Массив подсказок
 */
export function getSuggestions(fieldName, input, limit = 5) {
  if (!input || input.length < 2) return [];

  const history = getHistory(fieldName);
  const lowerInput = input.toLowerCase();

  return history
    .filter(item => item.toLowerCase().includes(lowerInput))
    .slice(0, limit);
}

/**
 * Очистить историю для поля
 * @param {string} fieldName - Имя поля
 */
export function clearHistory(fieldName) {
  try {
    const key = `${STORAGE_PREFIX}${fieldName}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Ошибка очистки истории автозаполнения:', error);
  }
}

/**
 * Очистить всю историю автозаполнения
 */
export function clearAllHistory() {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Ошибка очистки всей истории:', error);
  }
}

