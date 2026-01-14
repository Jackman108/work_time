/**
 * Сервис для работы с проектами (строительными объектами)
 * 
 * ПРИМЕЧАНИЕ: Этот файл теперь является обёрткой для обратной совместимости.
 * Внутренняя реализация использует Repository Patterобиn через ProjectService.
 * 
 * Для нового кода рекомендуется использовать:
 * - import { projectService } from './domain/ProjectService';
 * - import { projectRepository } from './repositories/ProjectRepository';
 * 
 * @module services/projects
 */

import type { Types } from 'types';
import { projectService } from '@services/domain/ProjectService';

/**
 * Получить все проекты
 * @returns {Types.Project[]} Список всех проектов
 */
export function getAllProjects(): Types.Project[] {
    return projectService.getAllProjects();
}

/**
 * Получить проект по ID
 * @param {number} id - ID проекта
 * @returns {Types.Project | null} Проект или null
 */
export function getProjectById(id: number): Types.Project | null {
    return projectService.getProjectById(id);
}

/**
 * Создать новый проект
 * @param {Types.ProjectCreateData} data - Данные проекта
 * @returns {Types.Project} Созданный проект
 */
export function createProject(data: Types.ProjectCreateData): Types.Project {
    return projectService.createProject(data);
}

/**
 * Обновить проект
 * @param {number} id - ID проекта
 * @param {Types.ProjectUpdateData} data - Новые данные проекта
 * @returns {Types.Project} Обновлённый проект
 */
export function updateProject(id: number, data: Types.ProjectUpdateData): Types.Project {
    return projectService.updateProject(id, data);
}

/**
 * Удалить проект
 * @param {number} id - ID проекта
 * @returns {boolean} true, если проект удалён
 */
export function deleteProject(id: number): boolean {
    return projectService.deleteProject(id);
}

/**
 * Получить статистику по проекту
 * @param {number} projectId - ID проекта
 * @returns {Types.ProjectStats} Статистика проекта
 */
export function getProjectStats(projectId: number): Types.ProjectStats {
    return projectService.getProjectStats(projectId);
}
