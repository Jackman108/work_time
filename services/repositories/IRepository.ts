/**
 * Базовый интерфейс репозитория
 * Определяет стандартные операции CRUD для всех сущностей
 * Следует принципам Repository Pattern и Dependency Inversion
 * 
 * @module services/repositories/IRepository
 */

/**
 * Базовый интерфейс репозитория
 * @template T - Тип сущности
 * @template TCreate - Тип данных для создания
 * @template TUpdate - Тип данных для обновления
 */
export interface IRepository<T, TCreate, TUpdate> {
  /**
   * Найти все сущности
   * @returns {T[]} Массив всех сущностей
   */
  findAll(): T[];

  /**
   * Найти сущность по ID
   * @param {number} id - ID сущности
   * @returns {T | null} Сущность или null, если не найдена
   */
  findById(id: number): T | null;

  /**
   * Создать новую сущность
   * @param {TCreate} data - Данные для создания
   * @returns {T} Созданная сущность
   */
  create(data: TCreate): T;

  /**
   * Обновить сущность
   * @param {number} id - ID сущности
   * @param {TUpdate} data - Данные для обновления
   * @returns {T} Обновлённая сущность
   * @throws {Error} Если сущность не найдена
   */
  update(id: number, data: TUpdate): T;

  /**
   * Удалить сущность
   * @param {number} id - ID сущности
   * @returns {boolean} true, если сущность удалена
   */
  delete(id: number): boolean;

  /**
   * Проверить существование сущности
   * @param {number} id - ID сущности
   * @returns {boolean} true, если сущность существует
   */
  exists(id: number): boolean;
}

/**
 * Расширенный интерфейс репозитория с поддержкой фильтров
 * @template T - Тип сущности
 * @template TCreate - Тип данных для создания
 * @template TUpdate - Тип данных для обновления
 * @template TFilters - Тип фильтров для поиска
 */
export interface IFilterableRepository<T, TCreate, TUpdate, TFilters = Record<string, unknown>>
  extends IRepository<T, TCreate, TUpdate> {
  /**
   * Найти сущности по фильтрам
   * @param {TFilters} filters - Фильтры для поиска
   * @returns {T[]} Массив найденных сущностей
   */
  findByFilters(filters: TFilters): T[];
}

/**
 * Интерфейс репозитория с поддержкой статистики
 * @template T - Тип сущности
 * @template TCreate - Тип данных для создания
 * @template TUpdate - Тип данных для обновления
 * @template TStats - Тип статистики
 */
export interface IStatsRepository<T, TCreate, TUpdate, TStats = unknown>
  extends IRepository<T, TCreate, TUpdate> {
  /**
   * Получить статистику по сущности
   * @param {number} id - ID сущности
   * @returns {TStats} Статистика
   */
  getStats(id: number): TStats;
}
