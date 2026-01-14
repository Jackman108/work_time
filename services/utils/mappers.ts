/**
 * Утилиты для маппинга данных из БД в формат API
 * Централизует общую логику преобразования данных
 * Следует принципам DRY и Single Responsibility
 * 
 * @module services/utils/mappers
 */

/**
 * Преобразовать null в undefined для опциональных полей API
 * Это стандартизирует формат данных для фронтенда
 * 
 * @param {T | null} value - Значение из БД
 * @returns {T | undefined} Значение для API
 */
export function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

/**
 * Преобразовать массив значений с null в массив с undefined
 * 
 * @param {Array<T | null>} values - Массив значений из БД
 * @returns {Array<T | undefined>} Массив значений для API
 */
export function mapNullsToUndefined<T>(values: Array<T | null>): Array<T | undefined> {
  return values.map(nullToUndefined);
}

/**
 * Преобразовать дату из формата БД (date_start/date_end) в формат API (start_date/end_date)
 * 
 * @param {string | null} dateValue - Дата из БД
 * @returns {string | null} Дата для API
 */
export function mapDateField(dateValue: string | null): string | null {
  return dateValue;
}

/**
 * Преобразовать строку с null в undefined для опциональных строковых полей
 * 
 * @param {string | null} value - Строка из БД
 * @returns {string | undefined} Строка для API
 */
export function mapOptionalString(value: string | null): string | undefined {
  return nullToUndefined(value);
}
