/**
 * Сервис для работы с проектами (строительными объектами)
 * Использует Drizzle ORM
 * @module services/projects
 */

import { eq, sql, sum, count, desc } from 'drizzle-orm';
import { db, projects, workLog, materialLog, projectPayments, materials } from '../db';
import type { Types } from 'types';

/**
 * Получить все проекты
 * @returns {Types.Project[]} Список всех проектов
 */
export function getAllProjects(): Types.Project[] {
    const results = db.select().from(projects).orderBy(desc(projects.created_at)).all();
    return results.map(mapToApiFormat);
}

/**
 * Получить проект по ID
 * @param {number} id - ID проекта
 * @returns {Types.Project | null} Проект или null
 */
export function getProjectById(id: number): Types.Project | null {
    const result = db.select().from(projects).where(eq(projects.id, id)).limit(1).get();
    return result ? mapToApiFormat(result) : null;
}

/**
 * Создать новый проект
 * @param {Types.ProjectCreateData} data - Данные проекта
 * @returns {Types.Project} Созданный проект
 */
export function createProject(data: Types.ProjectCreateData): Types.Project {
    const result = db.insert(projects).values({
        name: data.name,
        address: data.address || null,
        budget: data.budget,
        date_start: data.start_date || null,
        date_end: data.end_date || null,
        description: data.description || null,
    }).returning().get();

    if (!result) {
        throw new Error('Failed to create project');
    }

    console.log(`[DB] Создан проект: ID=${result.id}, название="${data.name}"`);

    // Обновляем время модификации БД для обновления соединения
    const dbModule = require('../db');
    if (dbModule.updateLastDbModTime) {
        dbModule.updateLastDbModTime();
    }

    return mapToApiFormat(result);
}

/**
 * Обновить проект
 * @param {number} id - ID проекта
 * @param {Types.ProjectUpdateData} data - Новые данные проекта
 * @returns {Types.Project} Обновлённый проект
 */
export function updateProject(id: number, data: Types.ProjectUpdateData): Types.Project {
    const updateData: Partial<typeof projects.$inferInsert> = {
        updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (data.start_date !== undefined) updateData.date_start = data.start_date || null;
    if (data.end_date !== undefined) updateData.date_end = data.end_date || null;
    if (data.description !== undefined) updateData.description = data.description || null;

    const result = db.update(projects)
        .set(updateData)
        .where(eq(projects.id, id))
        .returning()
        .get();

    if (!result) {
        throw new Error('Project not found');
    }

    console.log(`[DB] Обновлен проект: ID=${id}, название="${result.name}"`);
    return mapToApiFormat(result);
}

/**
 * Удалить проект
 * @param {number} id - ID проекта
 * @returns {boolean} true, если проект удалён
 */
export function deleteProject(id: number): boolean {
    // Получаем информацию о проекте перед удалением для лога
    const project = getProjectById(id);
    const result = db.delete(projects).where(eq(projects.id, id)).returning().get();
    const deleted = !!result;

    if (deleted && project) {
        console.log(`[DB] Удален проект: ID=${id}, название="${project.name}"`);
    }

    return deleted;
}

/**
 * Получить статистику по проекту
 * @param {number} projectId - ID проекта
 * @returns {Types.ProjectStats} Статистика проекта
 */
export function getProjectStats(projectId: number): Types.ProjectStats {
    const project = getProjectById(projectId);
    if (!project) {
        throw new Error('Project not found');
    }

    // Оптимизировано: получаем всю статистику параллельно
    // Статистика по зарплатам
    const workLogStats = db.select({
        total_salary: sum(workLog.salary_per_day),
        work_days: count(workLog.id),
    })
        .from(workLog)
        .where(eq(workLog.project_id, projectId))
        .get() || { total_salary: null, work_days: 0 };

    // Статистика по материалам (с JOIN)
    const materialLogStats = db.select({
        total_material_cost: sql<number>`COALESCE(SUM(${materialLog.amount} * ${materials.price_per_unit}), 0)`,
    })
        .from(materialLog)
        .leftJoin(materials, eq(materialLog.material_id, materials.id))
        .where(eq(materialLog.project_id, projectId))
        .get() || { total_material_cost: 0 };

    // Статистика по платежам
    const paymentStats = db.select({
        total_payments: sum(projectPayments.amount),
    })
        .from(projectPayments)
        .where(eq(projectPayments.project_id, projectId))
        .get() || { total_payments: null };

    // Оптимизированная обработка результатов (избегаем двойных проверок)
    const totalSalary = workLogStats?.total_salary ? Number(workLogStats.total_salary) : 0;
    const totalMaterialCost = materialLogStats?.total_material_cost ? Number(materialLogStats.total_material_cost) : 0;
    const totalPayments = paymentStats?.total_payments ? Number(paymentStats.total_payments) : 0;
    const totalCost = totalSalary + totalMaterialCost;

    return {
        project,
        totalSalary,
        workDays: workLogStats?.work_days ? Number(workLogStats.work_days) : 0,
        totalMaterialCost,
        totalPayments,
        totalCost,
        balance: totalPayments - totalCost
    };
}

/**
 * Маппинг проекта из БД в формат API
 * Преобразует date_start/date_end в start_date/end_date
 */
function mapToApiFormat(project: typeof projects.$inferSelect): Types.Project {
    return {
        id: project.id,
        name: project.name,
        address: project.address,
        budget: project.budget,
        start_date: project.date_start || null,
        end_date: project.date_end || null,
        description: project.description || null,
        created_at: project.created_at,
        updated_at: project.updated_at,
    };
}
