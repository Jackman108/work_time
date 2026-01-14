/**
 * Базовый класс репозитория
 * Предоставляет общую функциональность для всех репозиториев
 * Следует принципам DRY и Template Method
 * 
 * @module services/repositories/BaseRepository
 */

import type { IRepository } from './IRepository';
import { InputValidator } from '@services/validation';

/**
 * Базовый класс репозитория с общей функциональностью
 * @template T - Тип сущности
 * @template TCreate - Тип данных для создания
 * @template TUpdate - Тип данных для обновления
 */
export abstract class BaseRepository<T, TCreate, TUpdate> implements IRepository<T, TCreate, TUpdate> {
  /**
   * Найти все сущности
   * Должен быть реализован в наследниках
   */
  abstract findAll(): T[];

  /**
   * Найти сущность по ID
   * Должен быть реализован в наследниках
   */
  abstract findById(id: number): T | null;

  /**
   * Создать новую сущность
   * Должен быть реализован в наследниках
   */
  abstract create(data: TCreate): T;

  /**
   * Обновить сущность
   * Должен быть реализован в наследниках
   */
  abstract update(id: number, data: TUpdate): T;

  /**
   * Удалить сущность
   * Должен быть реализован в наследниках
   */
  abstract delete(id: number): boolean;

  /**
   * Проверить существование сущности
   * Реализация по умолчанию через findById
   * 
   * @param {number} id - ID сущности
   * @returns {boolean} true, если сущность существует
   */
  exists(id: number): boolean {
    const validatedId = InputValidator.validateId(id, 'id');
    return this.findById(validatedId) !== null;
  }

  /**
   * Валидировать ID перед операцией
   * 
   * @param {unknown} id - ID для валидации
   * @param {string} [fieldName='id'] - Имя поля
   * @returns {number} Валидированный ID
   * @throws {Error} Если ID невалиден
   */
  protected validateId(id: unknown, fieldName: string = 'id'): number {
    return InputValidator.validateId(id, fieldName);
  }

  /**
   * Проверить, что сущность существует, иначе выбросить ошибку
   * 
   * @param {number} id - ID сущности
   * @param {string} [entityName='Сущность'] - Имя сущности для сообщения об ошибке
   * @throws {Error} Если сущность не найдена
   */
  protected ensureExists(id: number, entityName: string = 'Сущность'): void {
    if (!this.exists(id)) {
      throw new Error(`${entityName} с ID ${id} не найдена`);
    }
  }
}
