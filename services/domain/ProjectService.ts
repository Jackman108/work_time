/**
 * Сервис для работы с проектами (бизнес-логика)
 * Использует Repository Pattern для доступа к данным
 * Следует принципам Clean Architecture и Separation of Concerns
 * 
 * @module services/domain/ProjectService
 */

import { projectRepository } from '@services/repositories/ProjectRepository';
import type { Types } from 'types';
import { eq, sql, sum, count } from 'drizzle-orm';
import { db, workLog, materialLog, projectPayments, materials } from 'db';

/**
 * Типы для сервиса проектов
 */
type Project = Types.Project;
type ProjectCreateData = Types.ProjectCreateData;
type ProjectUpdateData = Types.ProjectUpdateData;
type ProjectStats = Types.ProjectStats;

/**
 * Сервис для работы с проектами
 * Содержит бизнес-логику и использует репозиторий для доступа к данным
 */
export class ProjectService {
  /**
   * Получить все проекты
   * @returns {Project[]} Список всех проектов
   */
  getAllProjects(): Project[] {
    return projectRepository.findAll();
  }

  /**
   * Получить проект по ID
   * @param {number} id - ID проекта
   * @returns {Project | null} Проект или null
   */
  getProjectById(id: number): Project | null {
    return projectRepository.findById(id);
  }

  /**
   * Создать новый проект
   * @param {ProjectCreateData} data - Данные проекта
   * @returns {Project} Созданный проект
   */
  createProject(data: ProjectCreateData): Project {
    return projectRepository.create(data);
  }

  /**
   * Обновить проект
   * @param {number} id - ID проекта
   * @param {ProjectUpdateData} data - Новые данные проекта
   * @returns {Project} Обновлённый проект
   */
  updateProject(id: number, data: ProjectUpdateData): Project {
    return projectRepository.update(id, data);
  }

  /**
   * Удалить проект
   * @param {number} id - ID проекта
   * @returns {boolean} true, если проект удалён
   */
  deleteProject(id: number): boolean {
    return projectRepository.delete(id);
  }

  /**
   * Получить статистику по проекту
   * Бизнес-логика: вычисление статистики на основе связанных данных
   * 
   * @param {number} projectId - ID проекта
   * @returns {ProjectStats} Статистика проекта
   */
  getProjectStats(projectId: number): ProjectStats {
    const project = projectRepository.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Вычисляем общую зарплату по проекту
    const salaryResult = db
      .select({ total: sum(workLog.salary_per_day) })
      .from(workLog)
      .where(eq(workLog.project_id, projectId))
      .get();

    const totalSalary = salaryResult?.total ? Number(salaryResult.total) : 0;

    // Вычисляем количество рабочих дней
    const workDaysResult = db
      .select({ count: count() })
      .from(workLog)
      .where(eq(workLog.project_id, projectId))
      .get();

    const workDays = workDaysResult?.count ? Number(workDaysResult.count) : 0;

    // Вычисляем общую стоимость материалов
    const materialCostResult = db
      .select({
        total: sql<number>`SUM(${materialLog.amount} * ${materials.price_per_unit})`
      })
      .from(materialLog)
      .innerJoin(materials, eq(materialLog.material_id, materials.id))
      .where(eq(materialLog.project_id, projectId))
      .get();

    const totalMaterialCost = materialCostResult?.total ? Number(materialCostResult.total) : 0;

    // Вычисляем общие поступления
    const paymentsResult = db
      .select({ total: sum(projectPayments.amount) })
      .from(projectPayments)
      .where(eq(projectPayments.project_id, projectId))
      .get();

    const totalPayments = paymentsResult?.total ? Number(paymentsResult.total) : 0;

    // Вычисляем общие затраты и баланс
    const totalCost = totalSalary + totalMaterialCost;
    const balance = totalPayments - totalCost;

    return {
      project,
      totalSalary,
      workDays,
      totalMaterialCost,
      totalPayments,
      totalCost,
      balance
    };
  }
}

/**
 * Экспорт экземпляра сервиса (Singleton pattern)
 */
export const projectService = new ProjectService();
