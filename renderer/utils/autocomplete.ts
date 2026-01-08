/**
 * Утилита для автозаполнения полей форм
 */

const STORAGE_PREFIX = 'autocomplete_';
const MAX_HISTORY = 20;

export function saveToHistory(fieldName: string, value: string): void {
  if (!value || !value.trim()) return;

  try {
    const key = `${STORAGE_PREFIX}${fieldName}`;
    const history = getHistory(fieldName);
    
    const filtered = history.filter(item => item.toLowerCase() !== value.toLowerCase());
    const updated = [value.trim(), ...filtered].slice(0, MAX_HISTORY);
    
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Ошибка сохранения в историю автозаполнения:', error);
  }
}

export function getHistory(fieldName: string): string[] {
  try {
    const key = `${STORAGE_PREFIX}${fieldName}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Ошибка получения истории автозаполнения:', error);
    return [];
  }
}

export function getSuggestions(fieldName: string, input: string, limit: number = 5): string[] {
  if (!input || input.length < 2) return [];

  const history = getHistory(fieldName);
  const lowerInput = input.toLowerCase();

  return history
    .filter(item => item.toLowerCase().includes(lowerInput))
    .slice(0, limit);
}

export function clearHistory(fieldName: string): void {
  try {
    const key = `${STORAGE_PREFIX}${fieldName}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Ошибка очистки истории автозаполнения:', error);
  }
}

export function clearAllHistory(): void {
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

