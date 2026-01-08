/**
 * Базовый класс для всех сервисов
 * Предоставляет общую функциональность и устраняет дублирование кода
 * @module services/base/BaseService
 */

import Database from 'better-sqlite3';

// Тип для базы данных с расширенными методами
export type ExtendedDatabase = Database.Database & {
    dbPath?: string;
    closeDatabase?: () => void;
    reopenDatabase?: () => ExtendedDatabase;
};

/**
 * Получить актуальное соединение с базой данных
 * Очищает кеш модуля для получения актуальной ссылки
 * @returns {ExtendedDatabase} Объект базы данных
 */
export function getDb(): ExtendedDatabase {
    // Очищаем кеш модуля для получения актуальной ссылки
    delete require.cache[require.resolve('../../database')];
    return require('../../database').default as ExtendedDatabase;
}

/**
 * Проверить доступность соединения с БД
 * @param {ExtendedDatabase | null | undefined} db - Объект базы данных
 * @throws {Error} Если соединение недоступно
 */
export function ensureDbConnection(db: ExtendedDatabase | null | undefined): asserts db is ExtendedDatabase {
    if (!db) {
        throw new Error('Database connection is not available');
    }
    // Проверяем, что соединение действительно открыто
    try {
        db.prepare('SELECT 1').get();
    } catch (error) {
        throw new Error('Database connection is not open');
    }
}

/**
 * Базовый класс для сервисов
 * Предоставляет общие методы для работы с БД
 */
export class BaseService {
    /**
     * Получить соединение с БД
     * @returns {ExtendedDatabase} Объект базы данных
     */
    static getDb(): ExtendedDatabase {
        return getDb();
    }

    /**
     * Выполнить запрос с проверкой соединения
     * @param {Function} queryFn - Функция запроса, принимающая db
     * @returns {T} Результат запроса
     */
    static executeQuery<T>(queryFn: (db: ExtendedDatabase) => T): T {
        const db = getDb();
        ensureDbConnection(db);
        return queryFn(db);
    }

    /**
     * Выполнить транзакцию
     * @param {Function} transactionFn - Функция транзакции
     * @returns {T} Результат транзакции
     */
    static executeTransaction<T>(transactionFn: () => T): T {
        const db = getDb();
        ensureDbConnection(db);
        if (!db.transaction) {
            throw new Error('Transaction support is not available');
        }
        const txn = db.transaction(transactionFn);
        return txn();
    }
}

