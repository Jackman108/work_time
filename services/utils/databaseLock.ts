/**
 * Утилита для защиты от race conditions в операциях с БД
 * Реализует простую систему блокировок для критичных операций
 * Следует принципам Thread Safety и Resource Management
 * 
 * @module services/utils/databaseLock
 */

/**
 * Тип операции с БД
 */
enum DatabaseOperation {
  READ = 'read',
  WRITE = 'write',
  BACKUP = 'backup',
  RESTORE = 'restore'
}

/**
 * Интерфейс для блокировки операции
 */
interface OperationLock {
  operation: DatabaseOperation;
  timestamp: number;
  timeout: number;
}

/**
 * Менеджер блокировок для операций с БД
 * Предотвращает одновременное выполнение конфликтующих операций
 */
class DatabaseLockManager {
  /**
   * Активные блокировки операций
   */
  private activeLocks: Map<string, OperationLock> = new Map();

  /**
   * Время жизни блокировки по умолчанию (30 секунд)
   */
  private readonly DEFAULT_TIMEOUT = 30000;

  /**
   * Время жизни блокировки для долгих операций (5 минут)
   */
  private readonly LONG_OPERATION_TIMEOUT = 300000;

  /**
   * Очистить устаревшие блокировки
   */
  private cleanupExpiredLocks(): void {
    const now = Date.now();
    for (const [key, lock] of this.activeLocks.entries()) {
      if (now - lock.timestamp > lock.timeout) {
        this.activeLocks.delete(key);
      }
    }
  }

  /**
   * Проверить, можно ли выполнить операцию
   * 
   * @param {DatabaseOperation} operation - Тип операции
   * @param {string} [resource] - Ресурс (например, ID проекта)
   * @returns {boolean} true, если операция разрешена
   */
  canAcquireLock(operation: DatabaseOperation, resource?: string): boolean {
    this.cleanupExpiredLocks();

    // Проверяем конфликты операций
    for (const [key, lock] of this.activeLocks.entries()) {
      // BACKUP и RESTORE блокируют все операции
      if (lock.operation === DatabaseOperation.BACKUP || 
          lock.operation === DatabaseOperation.RESTORE) {
        return false;
      }

      // Если есть активный BACKUP или RESTORE, блокируем
      if (operation === DatabaseOperation.BACKUP || 
          operation === DatabaseOperation.RESTORE) {
        return false;
      }

      // WRITE операции блокируют другие WRITE на том же ресурсе
      if (operation === DatabaseOperation.WRITE && 
          lock.operation === DatabaseOperation.WRITE) {
        if (!resource || key.includes(resource)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Получить блокировку для операции
   * 
   * @param {DatabaseOperation} operation - Тип операции
   * @param {string} [resource] - Ресурс (например, ID проекта)
   * @param {number} [timeout] - Таймаут блокировки в миллисекундах
   * @returns {string | null} Ключ блокировки или null, если не удалось получить
   */
  acquireLock(
    operation: DatabaseOperation,
    resource?: string,
    timeout?: number
  ): string | null {
    this.cleanupExpiredLocks();

    if (!this.canAcquireLock(operation, resource)) {
      return null;
    }

    const lockKey = resource ? `${operation}:${resource}` : operation;
    const isLongOperation = operation === DatabaseOperation.BACKUP || 
                          operation === DatabaseOperation.RESTORE;
    const lockTimeout = timeout || 
      (isLongOperation ? this.LONG_OPERATION_TIMEOUT : this.DEFAULT_TIMEOUT);

    this.activeLocks.set(lockKey, {
      operation,
      timestamp: Date.now(),
      timeout: lockTimeout
    });

    return lockKey;
  }

  /**
   * Освободить блокировку
   * 
   * @param {string} lockKey - Ключ блокировки
   * @returns {boolean} true, если блокировка была освобождена
   */
  releaseLock(lockKey: string): boolean {
    return this.activeLocks.delete(lockKey);
  }

  /**
   * Выполнить операцию с автоматической блокировкой
   * 
   * @param {DatabaseOperation} operation - Тип операции
   * @param {Function} fn - Функция для выполнения
   * @param {string} [resource] - Ресурс
   * @param {number} [timeout] - Таймаут блокировки
   * @returns {Promise<T>} Результат выполнения функции
   */
  async executeWithLock<T>(
    operation: DatabaseOperation,
    fn: () => Promise<T> | T,
    resource?: string,
    timeout?: number
  ): Promise<T> {
    const lockKey = this.acquireLock(operation, resource, timeout);

    if (!lockKey) {
      throw new Error(
        `Не удалось получить блокировку для операции ${operation}${resource ? ` на ресурсе ${resource}` : ''}`
      );
    }

    try {
      const result = await Promise.resolve(fn());
      return result;
    } finally {
      this.releaseLock(lockKey);
    }
  }

  /**
   * Получить список активных блокировок (для отладки)
   */
  getActiveLocks(): Array<{ key: string; operation: DatabaseOperation; age: number }> {
    this.cleanupExpiredLocks();
    const now = Date.now();
    return Array.from(this.activeLocks.entries()).map(([key, lock]) => ({
      key,
      operation: lock.operation,
      age: now - lock.timestamp
    }));
  }
}

/**
 * Глобальный экземпляр менеджера блокировок
 */
const lockManager = new DatabaseLockManager();

/**
 * Выполнить операцию чтения с блокировкой
 */
export async function executeReadOperation<T>(
  fn: () => Promise<T> | T,
  resource?: string
): Promise<T> {
  return lockManager.executeWithLock(DatabaseOperation.READ, fn, resource);
}

/**
 * Выполнить операцию записи с блокировкой
 */
export async function executeWriteOperation<T>(
  fn: () => Promise<T> | T,
  resource?: string
): Promise<T> {
  return lockManager.executeWithLock(DatabaseOperation.WRITE, fn, resource);
}

/**
 * Выполнить операцию бэкапа с блокировкой
 */
export async function executeBackupOperation<T>(
  fn: () => Promise<T> | T
): Promise<T> {
  return lockManager.executeWithLock(DatabaseOperation.BACKUP, fn);
}

/**
 * Выполнить операцию восстановления с блокировкой
 */
export async function executeRestoreOperation<T>(
  fn: () => Promise<T> | T
): Promise<T> {
  return lockManager.executeWithLock(DatabaseOperation.RESTORE, fn);
}

/**
 * Экспорт для прямого доступа к менеджеру (для продвинутого использования)
 */
export { lockManager, DatabaseLockManager };

// Экспортируем DatabaseOperation как значение (не тип)
export { DatabaseOperation };
