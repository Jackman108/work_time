/**
 * Утилиты для построения запросов Drizzle
 * Оптимизирует и упрощает работу с фильтрами
 * @module services/utils/queryBuilder
 */

import { and, eq, gte, lte, sql, SQL } from 'drizzle-orm';

/**
 * Построить WHERE условие из фильтров
 * @param conditions - Массив условий
 * @returns SQL условие
 */
export function buildWhereClause(conditions: SQL[]): SQL {
    return conditions.length > 0 ? and(...conditions)! : sql`1=1`;
}

/**
 * Построить условия фильтрации для дат
 * @param filters - Фильтры с датами
 * @param dateColumn - Колонка с датой
 * @param conditions - Массив для добавления условий
 */
export function addDateFilters<T extends { start_date?: string | null; end_date?: string | null }>(
    filters: T,
    dateColumn: any,
    conditions: SQL[]
): void {
    if (filters.start_date) {
        conditions.push(gte(dateColumn, filters.start_date));
    }
    if (filters.end_date) {
        conditions.push(lte(dateColumn, filters.end_date));
    }
}

/**
 * Построить условия фильтрации для ID
 * @param filters - Фильтры с ID
 * @param idColumn - Колонка с ID
 * @param conditions - Массив для добавления условий
 * @param filterKey - Ключ фильтра
 */
export function addIdFilter<T extends Record<string, any>>(
    filters: T,
    idColumn: any,
    conditions: SQL[],
    filterKey: keyof T
): void {
    const value = filters[filterKey];
    if (value !== null && value !== undefined) {
        conditions.push(eq(idColumn, value as number));
    }
}

