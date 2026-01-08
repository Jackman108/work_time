/**
 * Утилита для маппинга полей между форматом БД и API
 * Устраняет дублирование кода маппинга
 * @module services/utils/fieldMapper
 */

// Импортируем типы через алиас из tsconfig.json
import type { Types } from 'types';

/**
 * Проект из БД (с полями date_start/date_end)
 */
interface DbProject {
    id: number;
    name: string;
    address: string | null;
    budget: number;
    date_start: string | null;
    date_end: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Сотрудник из БД (с полями role/wage_per_hour)
 */
interface DbEmployee {
    id: number;
    name: string;
    phone: string | null;
    role: string | null;
    wage_per_hour: number;
    created_at: string;
    updated_at: string;
}

/**
 * Маппинг полей проекта
 * @param {DbProject | null} project - Проект из БД
 * @returns {Types.Project | null} Проект с маппированными полями
 */
export function mapProjectFields(project: DbProject | null): Types.Project | null {
    if (!project) return null;
    return {
        ...project,
        start_date: project.date_start,
        end_date: project.date_end,
        description: null // Добавляем недостающее поле
    };
}

/**
 * Маппинг полей сотрудника
 * @param {DbEmployee | null} employee - Сотрудник из БД
 * @returns {Types.Employee | null} Сотрудник с маппированными полями
 */
export function mapEmployeeFields(employee: DbEmployee | null): Types.Employee | null {
    if (!employee) return null;
    return {
        ...employee,
        position: employee.role,
        salary_per_day: employee.wage_per_hour,
        hire_date: null // Добавляем недостающее поле
    };
}

/**
 * Маппинг массива проектов
 * @param {DbProject[]} projects - Массив проектов из БД
 * @returns {Types.Project[]} Массив проектов с маппированными полями
 */
export function mapProjectsArray(projects: DbProject[]): Types.Project[] {
    if (!Array.isArray(projects)) return [];
    return projects.map(mapProjectFields).filter((p): p is Types.Project => p !== null);
}

/**
 * Маппинг массива сотрудников
 * @param {DbEmployee[]} employees - Массив сотрудников из БД
 * @returns {Types.Employee[]} Массив сотрудников с маппированными полями
 */
export function mapEmployeesArray(employees: DbEmployee[]): Types.Employee[] {
    if (!Array.isArray(employees)) return [];
    return employees.map(mapEmployeeFields).filter((e): e is Types.Employee => e !== null);
}

