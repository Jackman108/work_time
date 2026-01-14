/**
 * Сервис для работы с отчётами
 * Использует Drizzle ORM
 * @module services/reports
 */

import { eq, sql, sum, count, SQL, desc } from 'drizzle-orm';
import { db, projects, employees, materials, workLog, materialLog, projectPayments } from 'db';
import type { Types } from 'types';
import { buildWhereClause, addDateFilters } from '@services/utils/queryBuilder';

/**
 * Получить отчёт по всем проектам
 * @returns {Types.ProjectReport[]} Список проектов с статистикой
 */
export function getAllProjectsReport(): Types.ProjectReport[] {
    // Используем raw SQL для сложных агрегаций с GROUP BY
    const results = db.select({
        id: projects.id,
        name: projects.name,
        address: projects.address,
        date_start: projects.date_start,
        date_end: projects.date_end,
        budget: projects.budget,
        description: projects.description,
        total_salary: sql<number>`COALESCE(SUM(${workLog.salary_per_day}), 0)`,
        total_material_cost: sql<number>`COALESCE(SUM(${materialLog.amount} * ${materials.price_per_unit}), 0)`,
        total_payments: sql<number>`COALESCE(SUM(${projectPayments.amount}), 0)`,
    })
        .from(projects)
        .leftJoin(workLog, eq(projects.id, workLog.project_id))
        .leftJoin(materialLog, eq(projects.id, materialLog.project_id))
        .leftJoin(materials, eq(materialLog.material_id, materials.id))
        .leftJoin(projectPayments, eq(projects.id, projectPayments.project_id))
        .groupBy(projects.id)
        .orderBy(desc(projects.created_at))
        .all();

    return results.map((project: any) => {
        const salaryCosts = Number(project.total_salary) || 0;
        const materialCosts = Number(project.total_material_cost) || 0;
        const totalCosts = salaryCosts + materialCosts;
        const paymentsReceived = Number(project.total_payments) || 0;
        const balance = paymentsReceived - totalCosts;
        const budget = Number(project.budget) || 0;
        const budgetRemaining = budget - totalCosts;

        return {
            id: project.id,
            name: project.name,
            address: project.address,
            date_start: project.date_start,
            date_end: project.date_end,
            budget: budget,
            salary_costs: salaryCosts,
            material_costs: materialCosts,
            total_costs: totalCosts,
            payments_received: paymentsReceived,
            balance: balance,
            budget_remaining: budgetRemaining,
        } as Types.ProjectReport;
    });
}

/**
 * Получить отчёт по всем сотрудникам
 * @param {string | null} dateFrom - Дата начала периода
 * @param {string | null} dateTo - Дата окончания периода
 * @returns {Types.EmployeeReport[]} Список сотрудников с статистикой
 */
export function getAllEmployeesReport(dateFrom: string | null = null, dateTo: string | null = null): Types.EmployeeReport[] {
    // Оптимизированное построение условий фильтрации
    const conditions: SQL[] = [];
    const dateFilters = { start_date: dateFrom, end_date: dateTo };
    addDateFilters(dateFilters, workLog.date, conditions);

    const whereClause = buildWhereClause(conditions);

    const results = db.select({
        id: employees.id,
        name: employees.name,
        role: employees.role,
        total_salary: sum(workLog.salary_per_day),
        projects_count: sql<number>`COUNT(DISTINCT ${workLog.project_id})`,
        days_worked: count(workLog.id),
    })
        .from(employees)
        .leftJoin(workLog, eq(employees.id, workLog.employee_id))
        .where(whereClause)
        .groupBy(employees.id)
        .orderBy(desc(employees.created_at))
        .all();

    return results.map((employee: any) => ({
        id: employee.id,
        name: employee.name,
        role: employee.role,
        total_salary: Number(employee.total_salary) || 0,
        total_received: Number(employee.total_salary) || 0, // Пока равно заработанному
        days_worked: Number(employee.days_worked) || 0,
        projects_count: Number(employee.projects_count) || 0,
    })) as Types.EmployeeReport[];
}

/**
 * Получить отчёт по всем материалам
 * @returns {Types.MaterialReport[]} Список материалов с статистикой
 */
export function getAllMaterialsReport(): Types.MaterialReport[] {
    const results = db.select({
        id: materials.id,
        name: materials.name,
        unit: materials.unit,
        price_per_unit: materials.price_per_unit,
        total_amount: sum(materialLog.amount),
        total_cost: sql<number>`COALESCE(SUM(${materialLog.amount} * ${materials.price_per_unit}), 0)`,
        projects_count: sql<number>`COUNT(DISTINCT ${materialLog.project_id})`,
    })
        .from(materials)
        .leftJoin(materialLog, eq(materials.id, materialLog.material_id))
        .groupBy(materials.id)
        .orderBy(desc(materials.created_at))
        .all();

    return results.map((material: any) => ({
        id: material.id,
        name: material.name,
        unit: material.unit,
        price_per_unit: material.price_per_unit,
        total_amount: Number(material.total_amount) || 0,
        total_cost: Number(material.total_cost) || 0,
        projects_count: Number(material.projects_count) || 0,
    })) as Types.MaterialReport[];
}

/**
 * Получить общую статистику
 * @returns {Types.OverallStats} Общая статистика
 */
export function getOverallStats(): Types.OverallStats {
    // Оптимизировано: убраны лишние .limit(1) для агрегатных запросов
    // Количество проектов
    const projectsCount = db.select({ count: count() }).from(projects).get()?.count || 0;

    // Количество сотрудников
    const employeesCount = db.select({ count: count() }).from(employees).get()?.count || 0;

    // Количество материалов
    const materialsCount = db.select({ count: count() }).from(materials).get()?.count || 0;

    // Общая зарплата
    const totalSalary = db.select({ total: sum(workLog.salary_per_day) }).from(workLog).get()?.total || null;

    // Общая стоимость материалов
    const totalMaterialCost = db.select({
        total: sql<number>`COALESCE(SUM(${materialLog.amount} * ${materials.price_per_unit}), 0)`,
    })
        .from(materialLog)
        .leftJoin(materials, eq(materialLog.material_id, materials.id))
        .get()?.total || 0;

    // Общие платежи
    const totalPayments = db.select({ total: sum(projectPayments.amount) }).from(projectPayments).get()?.total || null;

    // Общий бюджет
    const totalBudget = db.select({ total: sum(projects.budget) }).from(projects).get()?.total || null;

    const totalCosts = Number(totalSalary) + Number(totalMaterialCost);
    const balance = Number(totalPayments) - totalCosts;

    return {
        projectsCount,
        employeesCount,
        materialsCount,
        totalSalary: Number(totalSalary) || 0,
        totalSalaryCosts: Number(totalSalary) || 0,
        totalMaterialCost: Number(totalMaterialCost) || 0,
        totalMaterialCosts: Number(totalMaterialCost) || 0,
        totalCost: totalCosts,
        totalCosts: totalCosts,
        totalPayments: Number(totalPayments) || 0,
        totalPaymentsReceived: Number(totalPayments) || 0,
        totalBudget: Number(totalBudget) || 0,
        balance: balance,
        totalBalance: balance,
    };
}
