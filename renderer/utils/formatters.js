/**
 * Утилиты для форматирования данных
 */

/**
 * Форматирует число как валюту в рублях
 * @param {number} value - Значение для форматирования
 * @returns {string} Отформатированная строка валюты
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', { 
    style: 'currency', 
    currency: 'RUB' 
  }).format(value || 0);
}

/**
 * Форматирует дату в формат локали ru-RU
 * @param {string|Date} date - Дата для форматирования
 * @returns {string} Отформатированная дата
 */
export function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ru-RU');
}

/**
 * Получает текущую дату в формате YYYY-MM-DD
 * @returns {string} Текущая дата в формате YYYY-MM-DD
 */
export function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

