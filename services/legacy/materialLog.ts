/**
 * Сервис для работы с учётом списания материалов
 * Использует Drizzle ORM
 * @module services/materialLog
 */

import { eq, SQL, desc } from 'drizzle-orm';
import { db, materialLog, materials, projects } from 'db';
import type { Types } from 'types';
import { buildWhereClause, addDateFilters, addIdFilter } from '@services/utils/queryBuilder';

/**
 * Получить все записи списания материалов с JOIN для имён
 * @param {Types.MaterialLogFilters} filters - Фильтры
 * @returns {Types.MaterialLog[]} Список записей
 */
export function getAllMaterialLogs(filters: Types.MaterialLogFilters = {}): Types.MaterialLog[] {
    // Оптимизированное построение условий фильтрации
    const conditions: SQL[] = [];
    addIdFilter(filters, materialLog.material_id, conditions, 'material_id');
    addIdFilter(filters, materialLog.project_id, conditions, 'project_id');
    addDateFilters(filters, materialLog.date, conditions);

    const whereClause = buildWhereClause(conditions);

    const results = db.select({
        id: materialLog.id,
        material_id: materialLog.material_id,
        project_id: materialLog.project_id,
        date: materialLog.date,
        amount: materialLog.amount,
        notes: materialLog.notes,
        created_at: materialLog.created_at,
        material_name: materials.name,
        project_name: projects.name,
        unit: materials.unit,
        price_per_unit: materials.price_per_unit,
    })
        .from(materialLog)
        .leftJoin(materials, eq(materialLog.material_id, materials.id))
        .leftJoin(projects, eq(materialLog.project_id, projects.id))
        .where(whereClause)
        .orderBy(desc(materialLog.date))
        .all();

    return results.map(mapToApiFormat);
}

/**
 * Создать запись списания материала
 * @param {Types.MaterialLogCreateData} data - Данные записи
 * @returns {Types.MaterialLog} Созданная запись
 */
export function createMaterialLog(data: Types.MaterialLogCreateData): Types.MaterialLog {
    const result = db.insert(materialLog).values({
        material_id: data.material_id,
        project_id: data.project_id,
        date: data.date,
        amount: data.amount,
        notes: data.notes || null,
    }).returning().get();

    if (!result) {
        throw new Error('Failed to create material log');
    }

    // Получаем с JOIN для имён
    const withJoins = db.select({
        id: materialLog.id,
        material_id: materialLog.material_id,
        project_id: materialLog.project_id,
        date: materialLog.date,
        amount: materialLog.amount,
        notes: materialLog.notes,
        created_at: materialLog.created_at,
        material_name: materials.name,
        project_name: projects.name,
        unit: materials.unit,
        price_per_unit: materials.price_per_unit,
    })
        .from(materialLog)
        .leftJoin(materials, eq(materialLog.material_id, materials.id))
        .leftJoin(projects, eq(materialLog.project_id, projects.id))
        .where(eq(materialLog.id, result.id))
        .limit(1)
        .get();

    if (!withJoins) {
        throw new Error('Failed to retrieve created material log');
    }

    return mapToApiFormat(withJoins);
}

/**
 * Обновить запись списания материала
 * @param {number} id - ID записи
 * @param {Types.MaterialLogUpdateData} data - Новые данные
 * @returns {Types.MaterialLog} Обновлённая запись
 */
export function updateMaterialLog(id: number, data: Types.MaterialLogUpdateData): Types.MaterialLog {
    const updateData: Partial<typeof materialLog.$inferInsert> = {};

    if (data.material_id !== undefined) updateData.material_id = data.material_id;
    if (data.project_id !== undefined) updateData.project_id = data.project_id;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const result = db.update(materialLog)
        .set(updateData)
        .where(eq(materialLog.id, id))
        .returning()
        .get();

    if (!result) {
        throw new Error('Material log not found');
    }

    // Получаем с JOIN для имён
    const withJoins = db.select({
        id: materialLog.id,
        material_id: materialLog.material_id,
        project_id: materialLog.project_id,
        date: materialLog.date,
        amount: materialLog.amount,
        notes: materialLog.notes,
        created_at: materialLog.created_at,
        material_name: materials.name,
        project_name: projects.name,
        unit: materials.unit,
        price_per_unit: materials.price_per_unit,
    })
        .from(materialLog)
        .leftJoin(materials, eq(materialLog.material_id, materials.id))
        .leftJoin(projects, eq(materialLog.project_id, projects.id))
        .where(eq(materialLog.id, id))
        .limit(1)
        .get();

    if (!withJoins) {
        throw new Error('Failed to retrieve updated material log');
    }

    return mapToApiFormat(withJoins);
}

/**
 * Удалить запись списания материала
 * @param {number} id - ID записи
 * @returns {boolean} true, если запись удалена
 */
export function deleteMaterialLog(id: number): boolean {
    const result = db.delete(materialLog).where(eq(materialLog.id, id)).returning().get();
    return !!result;
}

/**
 * Маппинг записи списания материала в формат API
 */
function mapToApiFormat(log: {
    id: number;
    material_id: number;
    project_id: number;
    date: string;
    amount: number;
    notes: string | null;
    created_at: string;
    material_name: string | null;
    project_name: string | null;
    unit: string | null;
    price_per_unit: number | null;
}): Types.MaterialLog {
    return {
        id: log.id,
        material_id: log.material_id,
        project_id: log.project_id,
        date: log.date,
        amount: log.amount,
        notes: log.notes || null,
        created_at: log.created_at,
        material_name: log.material_name || undefined,
        project_name: log.project_name || undefined,
        unit: log.unit || undefined,
        price_per_unit: log.price_per_unit || undefined,
    };
}
