/**
 * Репозиторий для работы с проектами
 * Реализует Repository Pattern для изоляции доступа к данным
 * Следует принципам Single Responsibility и Dependency Inversion
 * 
 * @module services/repositories/ProjectRepository
 */

import { eq, desc } from 'drizzle-orm';
import { db, projects, updateLastDbModTime } from 'db';
import { BaseRepository } from './BaseRepository';
import type { Types } from 'types';

/**
 * Типы для репозитория проектов
 */
type Project = Types.Project;
type ProjectCreateData = Types.ProjectCreateData;
type ProjectUpdateData = Types.ProjectUpdateData;

/**
 * Репозиторий для работы с проектами
 * Инкапсулирует всю логику доступа к данным проектов
 */
export class ProjectRepository extends BaseRepository<Project, ProjectCreateData, ProjectUpdateData> {
  /**
   * Найти все проекты
   * @returns {Project[]} Массив всех проектов, отсортированных по дате создания
   */
  findAll(): Project[] {
    const results = db.select().from(projects).orderBy(desc(projects.created_at)).all();
    return results.map(this.mapToApiFormat);
  }

  /**
   * Найти проект по ID
   * @param {number} id - ID проекта
   * @returns {Project | null} Проект или null, если не найден
   */
  findById(id: number): Project | null {
    const validatedId = this.validateId(id, 'id');
    const result = db.select().from(projects).where(eq(projects.id, validatedId)).limit(1).get();
    return result ? this.mapToApiFormat(result) : null;
  }

  /**
   * Создать новый проект
   * @param {ProjectCreateData} data - Данные проекта
   * @returns {Project} Созданный проект
   */
  create(data: ProjectCreateData): Project {
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

    console.log(`[Repository] Project created: ID=${result.id}, name="${data.name}"`);

    // Обновляем время модификации БД для обновления соединения
    updateLastDbModTime();

    return this.mapToApiFormat(result);
  }

  /**
   * Обновить проект
   * @param {number} id - ID проекта
   * @param {ProjectUpdateData} data - Новые данные проекта
   * @returns {Project} Обновлённый проект
   * @throws {Error} Если проект не найден
   */
  update(id: number, data: ProjectUpdateData): Project {
    const validatedId = this.validateId(id, 'id');
    this.ensureExists(validatedId, 'Проект');

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
      .where(eq(projects.id, validatedId))
      .returning()
      .get();

    if (!result) {
      throw new Error('Project not found');
    }

    console.log(`[Repository] Project updated: ID=${validatedId}, name="${result.name}"`);
    return this.mapToApiFormat(result);
  }

  /**
   * Удалить проект
   * @param {number} id - ID проекта
   * @returns {boolean} true, если проект удалён
   */
  delete(id: number): boolean {
    const validatedId = this.validateId(id, 'id');
    
    const result = db.delete(projects).where(eq(projects.id, validatedId)).returning().get();
    
    if (result) {
      console.log(`[Repository] Project deleted: ID=${validatedId}, name="${result.name}"`);
      return true;
    }
    
    return false;
  }

  /**
   * Преобразовать данные из БД в формат API
   * @param {typeof projects.$inferSelect} dbProject - Проект из БД
   * @returns {Project} Проект в формате API
   */
  private mapToApiFormat(dbProject: typeof projects.$inferSelect): Project {
    return {
      id: dbProject.id,
      name: dbProject.name,
      address: dbProject.address,
      budget: dbProject.budget,
      start_date: dbProject.date_start,
      end_date: dbProject.date_end,
      description: dbProject.description,
      created_at: dbProject.created_at,
      updated_at: dbProject.updated_at,
    };
  }
}

/**
 * Экспорт экземпляра репозитория (Singleton pattern)
 * Для использования в сервисах
 */
export const projectRepository = new ProjectRepository();
