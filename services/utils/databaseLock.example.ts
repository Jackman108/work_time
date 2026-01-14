/**
 * Примеры использования системы блокировок для операций с БД
 * Демонстрирует защиту от race conditions
 * 
 * @module services/utils/databaseLock.example
 */

import {
  executeReadOperation,
  executeWriteOperation,
  executeBackupOperation,
  executeRestoreOperation,
  DatabaseOperation,
  lockManager
} from './databaseLock';

/**
 * Пример 1: Защита операции чтения
 */
export async function exampleReadOperation() {
  return executeReadOperation(async () => {
    // Операция чтения защищена от конфликтов с операциями записи
    // Можно выполнять параллельно с другими операциями чтения
    const db = require('../../db').default;
    return db.select().from(require('../../db/schema').projects).all();
  });
}

/**
 * Пример 2: Защита операции записи с указанием ресурса
 */
export async function exampleWriteOperation(projectId: number, data: any) {
  return executeWriteOperation(
    async () => {
      // Операция записи защищена от конфликтов с другими операциями записи
      // на том же ресурсе (projectId)
      const db = require('../../db').default;
      const { projects } = require('../../db/schema');
      const { eq } = require('drizzle-orm');
      
      return db.update(projects)
        .set(data)
        .where(eq(projects.id, projectId))
        .returning()
        .get();
    },
    `project:${projectId}` // Ресурс для блокировки
  );
}

/**
 * Пример 3: Защита операции бэкапа
 */
export async function exampleBackupOperation() {
  return executeBackupOperation(async () => {
    // Операция бэкапа блокирует все другие операции
    // Гарантирует целостность данных во время создания бэкапа
    // const backupManager = require('../backup/BackupManagerV2').BackupManagerV2;
    // const result = await backupManager.createBackup();
    // return result;
    return { success: true };
  });
}

/**
 * Пример 4: Защита операции восстановления
 */
export async function exampleRestoreOperation(_backupPath: string) {
  return executeRestoreOperation(async () => {
    // Операция восстановления блокирует все другие операции
    // Гарантирует целостность данных во время восстановления
    // const backupManager = require('../backup/BackupManagerV2').BackupManagerV2;
    // const result = await backupManager.restoreFromBackup(_backupPath);
    // return result;
    return { success: true };
  });
}

/**
 * Пример 5: Прямое использование менеджера блокировок
 */
export async function exampleDirectLockUsage() {
  // Получаем блокировку вручную
  const lockKey = lockManager.acquireLock(
    DatabaseOperation.WRITE,
    'project:123',
    60000 // 60 секунд
  );

  if (!lockKey) {
    throw new Error('Не удалось получить блокировку');
  }

  try {
    // Выполняем операцию
    // ...
  } finally {
    // Освобождаем блокировку
    lockManager.releaseLock(lockKey);
  }
}

/**
 * Пример 6: Проверка активных блокировок (для отладки)
 */
export function exampleCheckActiveLocks() {
  const activeLocks = lockManager.getActiveLocks();
  console.log('Активные блокировки:', activeLocks);
  // Вывод: [{ key: 'write:project:123', operation: 'write', age: 1500 }, ...]
}
