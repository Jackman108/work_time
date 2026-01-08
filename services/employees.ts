/**
 * Сервис для работы с сотрудниками
 * Использует Drizzle ORM
 * @module services/employees
 */

import { eq, sql, sum, count, desc, SQL, and } from 'drizzle-orm';
import { db, employees, workLog } from '../db';
import type { Types } from 'types';
import { addDateFilters, buildWhereClause } from './utils/queryBuilder';

/**
 * Получить всех сотрудников
 * @returns {Types.Employee[]} Список всех сотрудников
 */
export function getAllEmployees(): Types.Employee[] {
  const results = db.select().from(employees).orderBy(desc(employees.created_at)).all();
  return results.map(mapToApiFormat);
}

/**
 * Получить сотрудника по ID
 * @param {number} id - ID сотрудника
 * @returns {Types.Employee | null} Сотрудник или null
 */
export function getEmployeeById(id: number): Types.Employee | null {
  const result = db.select().from(employees).where(eq(employees.id, id)).limit(1).get();
  return result ? mapToApiFormat(result) : null;
}

/**
 * Создать нового сотрудника
 * @param {Types.EmployeeCreateData} data - Данные сотрудника
 * @returns {Types.Employee} Созданный сотрудник
 */
export function createEmployee(data: Types.EmployeeCreateData): Types.Employee {
  const result = db.insert(employees).values({
    name: data.name,
    phone: data.phone || null,
    role: data.position || null,
    wage_per_hour: data.salary_per_day || 0,
  }).returning().get();

  if (!result) {
    throw new Error('Failed to create employee');
  }

  return mapToApiFormat(result);
}

/**
 * Обновить сотрудника
 * @param {number} id - ID сотрудника
 * @param {Types.EmployeeUpdateData} data - Новые данные сотрудника
 * @returns {Types.Employee} Обновлённый сотрудник
 */
export function updateEmployee(id: number, data: Types.EmployeeUpdateData): Types.Employee {
  const updateData: Partial<typeof employees.$inferInsert> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.position !== undefined) updateData.role = data.position || null;
  if (data.salary_per_day !== undefined) updateData.wage_per_hour = data.salary_per_day || 0;

  const result = db.update(employees)
    .set(updateData)
    .where(eq(employees.id, id))
    .returning()
    .get();

  if (!result) {
    throw new Error('Employee not found');
  }

  return mapToApiFormat(result);
}

/**
 * Удалить сотрудника
 * @param {number} id - ID сотрудника
 * @returns {boolean} true, если сотрудник удалён
 */
export function deleteEmployee(id: number): boolean {
  const result = db.delete(employees).where(eq(employees.id, id)).returning().get();
  return !!result;
}

/**
 * Получить статистику по сотруднику
 * @param {number} employeeId - ID сотрудника
 * @param {string | null} dateFrom - Дата начала периода
 * @param {string | null} dateTo - Дата окончания периода
 * @returns {Types.EmployeeStats} Статистика сотрудника
 */
export function getEmployeeStats(employeeId: number, dateFrom: string | null = null, dateTo: string | null = null): Types.EmployeeStats {
  const employee = getEmployeeById(employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  // Оптимизированное построение условий фильтрации
  const conditions: SQL[] = [eq(workLog.employee_id, employeeId)];
  const dateFilters = { start_date: dateFrom, end_date: dateTo };
  addDateFilters(dateFilters, workLog.date, conditions);

  // Статистика по работе (оптимизировано)
  const whereClause = buildWhereClause(conditions);

  const stats = db.select({
    total_earned: sum(workLog.salary_per_day),
    work_days: count(workLog.id),
  })
    .from(workLog)
    .where(whereClause)
    .get();

  // Оптимизированная обработка результатов
  return {
    employee,
    totalEarned: stats?.total_earned ? Number(stats.total_earned) : 0,
    workDays: stats?.work_days ? Number(stats.work_days) : 0
  };
}

/**
 * Маппинг сотрудника из БД в формат API
 * Преобразует role -> position, wage_per_hour -> salary_per_day
 */
function mapToApiFormat(employee: typeof employees.$inferSelect): Types.Employee {
  return {
    id: employee.id,
    name: employee.name,
    phone: employee.phone,
    position: employee.role,
    hire_date: null, // Поле отсутствует в БД, оставляем null
    salary_per_day: employee.wage_per_hour,
    created_at: employee.created_at,
    updated_at: employee.updated_at,
  };
}
