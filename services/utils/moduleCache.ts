/**
 * Утилита для оптимизированного управления кешем модулей Node.js
 * Обеспечивает точечную очистку только критичных модулей
 * Следует принципам Performance и Single Responsibility
 * 
 * @module services/utils/moduleCache
 */

/**
 * Критичные модули, которые должны быть очищены при перезагрузке БД
 * Только модули, напрямую связанные с базой данных
 */
const CRITICAL_DB_MODULES = [
    './database',
    './db',
    './db/index',
    './db/schema'
] as const;

/**
 * Модули сервисов, которые зависят от БД
 * Очищаются только при необходимости полной перезагрузки
 */
const SERVICE_MODULES = [
    './services/projects',
    './services/employees',
    './services/materials',
    './services/workLog',
    './services/materialLog',
    './services/projectPayments',
    './services/reports',
    './services/backup',
    './services/base/BaseService'
] as const;

/**
 * Оптимизированная очистка кеша критичных модулей БД
 * Очищает только модули, напрямую связанные с базой данных
 * 
 * @param {boolean} [includeServices=false] - Очищать ли также модули сервисов
 * @returns {number} Количество очищенных модулей
 */
export function clearDatabaseModuleCache(includeServices: boolean = false): number {
    let clearedCount = 0;

    // Очищаем критичные модули БД
    CRITICAL_DB_MODULES.forEach(modulePath => {
        try {
            const resolvedPath = require.resolve(modulePath);
            if (require.cache[resolvedPath]) {
                delete require.cache[resolvedPath];
                clearedCount++;
            }
        } catch (e) {
            // Игнорируем ошибки (файл может не существовать)
        }
    });

    // Очищаем модули сервисов, если требуется
    if (includeServices) {
        SERVICE_MODULES.forEach(modulePath => {
            try {
                const resolvedPath = require.resolve(modulePath);
                if (require.cache[resolvedPath]) {
                    delete require.cache[resolvedPath];
                    clearedCount++;
                }
            } catch (e) {
                // Игнорируем ошибки
            }
        });
    }

    // Дополнительная очистка: удаляем модули по паттерну пути
    // Это быстрее, чем проверка каждого модуля отдельно
    const criticalPatterns = ['/db/', '\\db\\', '/database', '\\database'];
    const keysToDelete: string[] = [];

    // Собираем ключи для удаления
    Object.keys(require.cache).forEach(key => {
        const shouldDelete = criticalPatterns.some(pattern => key.includes(pattern));
        if (shouldDelete) {
            keysToDelete.push(key);
        }
    });

    // Удаляем собранные ключи
    keysToDelete.forEach(key => {
        try {
            delete require.cache[key];
            clearedCount++;
        } catch (e) {
            // Игнорируем ошибки
        }
    });

    return clearedCount;
}

/**
 * Полная очистка кеша всех модулей, связанных с БД и сервисами
 * Используется только в критичных случаях (например, восстановление бэкапа)
 * 
 * @returns {number} Количество очищенных модулей
 */
export function clearAllDatabaseRelatedCache(): number {
    return clearDatabaseModuleCache(true);
}

/**
 * Очистить кеш конкретного модуля по пути
 * 
 * @param {string} modulePath - Путь к модулю
 * @returns {boolean} true, если модуль был очищен
 */
export function clearModuleCache(modulePath: string): boolean {
    try {
        const resolvedPath = require.resolve(modulePath);
        if (require.cache[resolvedPath]) {
            delete require.cache[resolvedPath];
            return true;
        }
    } catch (e) {
        // Игнорируем ошибки
    }
    return false;
}

/**
 * Проверить, закеширован ли модуль
 * 
 * @param {string} modulePath - Путь к модулю
 * @returns {boolean} true, если модуль закеширован
 */
export function isModuleCached(modulePath: string): boolean {
    try {
        const resolvedPath = require.resolve(modulePath);
        return !!require.cache[resolvedPath];
    } catch (e) {
        return false;
    }
}
