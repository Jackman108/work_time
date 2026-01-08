/**
 * Сервис для работы с поступлениями денег на проекты
 * Использует Drizzle ORM
 * @module services/projectPayments
 */

import { eq, sum, SQL, desc } from 'drizzle-orm';
import { db, projectPayments, projects } from '../db';
import type { Types } from 'types';
import { buildWhereClause, addDateFilters, addIdFilter } from './utils/queryBuilder';

/**
 * Получить все платежи по проектам с JOIN для имён
 * @param {Types.ProjectPaymentFilters} filters - Фильтры
 * @returns {Types.ProjectPayment[]} Список платежей
 */
export function getAllProjectPayments(filters: Types.ProjectPaymentFilters = {}): Types.ProjectPayment[] {
    // Оптимизированное построение условий фильтрации
    const conditions: SQL[] = [];
    addIdFilter(filters, projectPayments.project_id, conditions, 'project_id');
    addDateFilters(filters, projectPayments.date, conditions);

    const whereClause = buildWhereClause(conditions);

    const results = db.select({
        id: projectPayments.id,
        project_id: projectPayments.project_id,
        date: projectPayments.date,
        amount: projectPayments.amount,
        notes: projectPayments.notes,
        created_at: projectPayments.created_at,
        project_name: projects.name,
    })
        .from(projectPayments)
        .leftJoin(projects, eq(projectPayments.project_id, projects.id))
        .where(whereClause)
        .orderBy(desc(projectPayments.date))
        .all();

    return results.map(mapToApiFormat);
}

/**
 * Создать платёж по проекту
 * @param {Types.ProjectPaymentCreateData} data - Данные платежа
 * @returns {Types.ProjectPayment} Созданный платёж
 */
export function createProjectPayment(data: Types.ProjectPaymentCreateData): Types.ProjectPayment {
    const result = db.insert(projectPayments).values({
        project_id: data.project_id,
        date: data.date,
        amount: data.amount,
        notes: data.notes || data.description || null,
    }).returning().get();

    if (!result) {
        throw new Error('Failed to create project payment');
    }

    // Получаем с JOIN для имени проекта
    const withJoins = db.select({
        id: projectPayments.id,
        project_id: projectPayments.project_id,
        date: projectPayments.date,
        amount: projectPayments.amount,
        notes: projectPayments.notes,
        created_at: projectPayments.created_at,
        project_name: projects.name,
    })
        .from(projectPayments)
        .leftJoin(projects, eq(projectPayments.project_id, projects.id))
        .where(eq(projectPayments.id, result.id))
        .limit(1)
        .get();

    if (!withJoins) {
        throw new Error('Failed to retrieve created project payment');
    }

    return mapToApiFormat(withJoins);
}

/**
 * Обновить платёж по проекту
 * @param {number} id - ID платежа
 * @param {Types.ProjectPaymentUpdateData} data - Новые данные
 * @returns {Types.ProjectPayment} Обновлённый платёж
 */
export function updateProjectPayment(id: number, data: Types.ProjectPaymentUpdateData): Types.ProjectPayment {
    const updateData: Partial<typeof projectPayments.$inferInsert> = {};

    if (data.project_id !== undefined) updateData.project_id = data.project_id;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.notes !== undefined || data.description !== undefined) {
        updateData.notes = data.notes || data.description || null;
    }

    const result = db.update(projectPayments)
        .set(updateData)
        .where(eq(projectPayments.id, id))
        .returning()
        .get();

    if (!result) {
        throw new Error('Project payment not found');
    }

    // Получаем с JOIN для имени проекта
    const withJoins = db.select({
        id: projectPayments.id,
        project_id: projectPayments.project_id,
        date: projectPayments.date,
        amount: projectPayments.amount,
        notes: projectPayments.notes,
        created_at: projectPayments.created_at,
        project_name: projects.name,
    })
        .from(projectPayments)
        .leftJoin(projects, eq(projectPayments.project_id, projects.id))
        .where(eq(projectPayments.id, id))
        .limit(1)
        .get();

    if (!withJoins) {
        throw new Error('Failed to retrieve updated project payment');
    }

    return mapToApiFormat(withJoins);
}

/**
 * Удалить платёж по проекту
 * @param {number} id - ID платежа
 * @returns {boolean} true, если платёж удалён
 */
export function deleteProjectPayment(id: number): boolean {
    const result = db.delete(projectPayments).where(eq(projectPayments.id, id)).returning().get();
    return !!result;
}

/**
 * Получить общую сумму платежей по проекту
 * @param {number} projectId - ID проекта
 * @returns {number} Общая сумма платежей
 */
export function getTotalPaymentsByProject(projectId: number): number {
    const result = db.select({
        total: sum(projectPayments.amount),
    })
        .from(projectPayments)
        .where(eq(projectPayments.project_id, projectId))
        .limit(1)
        .get();

    return Number(result?.total) || 0;
}

/**
 * Маппинг платежа в формат API
 */
function mapToApiFormat(payment: {
    id: number;
    project_id: number;
    date: string;
    amount: number;
    notes: string | null;
    created_at: string;
    project_name: string | null;
}): Types.ProjectPayment {
    return {
        id: payment.id,
        project_id: payment.project_id,
        date: payment.date,
        amount: payment.amount,
        description: payment.notes || null,
        notes: payment.notes || null,
        created_at: payment.created_at,
        project_name: payment.project_name || undefined,
    };
}
