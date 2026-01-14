/**
 * Сервис для работы с учётом рабочего времени
 * Использует Drizzle ORM
 * @module services/workLog
 */

import { eq, SQL, desc } from 'drizzle-orm';
import { db, workLog, employees, projects } from 'db';
import type { Types } from 'types';
import { buildWhereClause, addDateFilters, addIdFilter } from '@services/utils/queryBuilder';

/**
 * Получить все записи рабочего времени с JOIN для имён
 * @param {Types.WorkLogFilters} filters - Фильтры
 * @returns {Types.WorkLog[]} Список записей
 */
export function getAllWorkLogs(filters: Types.WorkLogFilters = {}): Types.WorkLog[] {
    // Оптимизированное построение условий фильтрации
    const conditions: SQL[] = [];
    addIdFilter(filters, workLog.employee_id, conditions, 'employee_id');
    addIdFilter(filters, workLog.project_id, conditions, 'project_id');
    addDateFilters(filters, workLog.date, conditions);

    const whereClause = buildWhereClause(conditions);

    const results = db.select({
        id: workLog.id,
        employee_id: workLog.employee_id,
        project_id: workLog.project_id,
        date: workLog.date,
        salary_per_day: workLog.salary_per_day,
        notes: workLog.notes,
        created_at: workLog.created_at,
        employee_name: employees.name,
        project_name: projects.name,
    })
        .from(workLog)
        .leftJoin(employees, eq(workLog.employee_id, employees.id))
        .leftJoin(projects, eq(workLog.project_id, projects.id))
        .where(whereClause)
        .orderBy(desc(workLog.date))
        .all();

    return results.map(mapToApiFormat);
}

/**
 * Создать запись рабочего времени
 * @param {Types.WorkLogCreateData} data - Данные записи
 * @returns {Types.WorkLog} Созданная запись
 */
export function createWorkLog(data: Types.WorkLogCreateData): Types.WorkLog {
    const result = db.insert(workLog).values({
        employee_id: data.employee_id,
        project_id: data.project_id,
        date: data.date,
        salary_per_day: data.salary_per_day,
        notes: data.notes || null,
    }).returning().get();

    if (!result) {
        throw new Error('Failed to create work log');
    }

    // Получаем с JOIN для имён (оптимизировано)
    const withJoins = db.select({
        id: workLog.id,
        employee_id: workLog.employee_id,
        project_id: workLog.project_id,
        date: workLog.date,
        salary_per_day: workLog.salary_per_day,
        notes: workLog.notes,
        created_at: workLog.created_at,
        employee_name: employees.name,
        project_name: projects.name,
    })
        .from(workLog)
        .leftJoin(employees, eq(workLog.employee_id, employees.id))
        .leftJoin(projects, eq(workLog.project_id, projects.id))
        .where(eq(workLog.id, result.id))
        .limit(1)
        .get();

    if (!withJoins) {
        throw new Error('Failed to retrieve created work log');
    }

    return mapToApiFormat(withJoins);
}

/**
 * Обновить запись рабочего времени
 * @param {number} id - ID записи
 * @param {Types.WorkLogUpdateData} data - Новые данные
 * @returns {Types.WorkLog} Обновлённая запись
 */
export function updateWorkLog(id: number, data: Types.WorkLogUpdateData): Types.WorkLog {
    const updateData: Partial<typeof workLog.$inferInsert> = {};

    if (data.employee_id !== undefined) updateData.employee_id = data.employee_id;
    if (data.project_id !== undefined) updateData.project_id = data.project_id;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.salary_per_day !== undefined) updateData.salary_per_day = data.salary_per_day;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const result = db.update(workLog)
        .set(updateData)
        .where(eq(workLog.id, id))
        .returning()
        .get();

    if (!result) {
        throw new Error('Work log not found');
    }

    // Получаем с JOIN для имён
    const withJoins = db.select({
        id: workLog.id,
        employee_id: workLog.employee_id,
        project_id: workLog.project_id,
        date: workLog.date,
        salary_per_day: workLog.salary_per_day,
        notes: workLog.notes,
        created_at: workLog.created_at,
        employee_name: employees.name,
        project_name: projects.name,
    })
        .from(workLog)
        .leftJoin(employees, eq(workLog.employee_id, employees.id))
        .leftJoin(projects, eq(workLog.project_id, projects.id))
        .where(eq(workLog.id, id))
        .limit(1)
        .get();

    if (!withJoins) {
        throw new Error('Failed to retrieve updated work log');
    }

    return mapToApiFormat(withJoins);
}

/**
 * Удалить запись рабочего времени
 * @param {number} id - ID записи
 * @returns {boolean} true, если запись удалена
 */
export function deleteWorkLog(id: number): boolean {
    const result = db.delete(workLog).where(eq(workLog.id, id)).returning().get();
    return !!result;
}

/**
 * Маппинг записи рабочего времени в формат API
 */
function mapToApiFormat(log: {
    id: number;
    employee_id: number;
    project_id: number;
    date: string;
    salary_per_day: number;
    notes: string | null;
    created_at: string;
    employee_name: string | null;
    project_name: string | null;
}): Types.WorkLog {
    return {
        id: log.id,
        employee_id: log.employee_id,
        project_id: log.project_id,
        date: log.date,
        salary_per_day: log.salary_per_day,
        notes: log.notes || null,
        created_at: log.created_at,
        employee_name: log.employee_name || undefined,
        project_name: log.project_name || undefined,
    };
}
