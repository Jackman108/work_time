/**
 * Сервис для резервного копирования и восстановления базы данных (версия 2.0)
 * Отказоустойчивая система с атомарными операциями и полной изоляцией бэкапов
 * 
 * @module services/backup
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { BackupManagerV2 } from './BackupManagerV2';
import { DatabaseConnectionManager } from './DatabaseConnectionManager';
import { quickValidateFile } from './utils';
import { getDatabaseDirectory, isPortable, getProjectRoot } from '../utils/pathUtils';
import type { Types } from 'types';

// Получаем путь к текущей БД
function getCurrentDatabasePath(): string {
    return path.join(getDatabaseDirectory(), 'app.db');
}

// Инициализируем менеджеры
const dbPath = getCurrentDatabasePath();
const connectionManager = DatabaseConnectionManager.getInstance(dbPath);
const backupManager = new BackupManagerV2(connectionManager);

// Отслеживаем последний загруженный бэкап
let lastLoadedBackupPath: string | null = null;

/**
 * Очистить кеш всех модулей, связанных с БД
 */
function clearAllDatabaseModuleCache(): void {
    const modulesToClear = [
        '../../database',
        '../../db',
        '../../db/index',
        '../../db/schema',
        '../projects',
        '../employees',
        '../materials',
        '../workLog',
        '../materialLog',
        '../projectPayments',
        '../reports',
        '../backup',
        '../base/BaseService',
        '../base/ErrorHandler',
        '../utils/fieldMapper',
        '../utils/queryBuilder',
    ];

    modulesToClear.forEach(modulePath => {
        try {
            const resolvedPath = require.resolve(modulePath);
            if (require.cache[resolvedPath]) {
                delete require.cache[resolvedPath];
            }
        } catch (e) {
            // Игнорируем ошибки разрешения путей
        }
    });

    // Очищаем кеш для всех модулей, содержащих 'db', 'database' или 'services'
    Object.keys(require.cache).forEach(key => {
        if (key.includes('db') || key.includes('database') || key.includes('services')) {
            delete require.cache[key];
        }
    });
}

/**
 * Перезагрузить все сервисы
 */
function reloadAllServices(): void {
    clearAllDatabaseModuleCache();

    // Вызываем глобальную функцию reloadServices, если она доступна
    if ((global as any).reloadServices && typeof (global as any).reloadServices === 'function') {
        try {
            (global as any).reloadServices();
        } catch (e) {
            // Игнорируем ошибки
        }
    }
}

/**
 * Экспортировать базу данных в выбранное место
 */
export async function exportDatabaseToFile(savePath: string): Promise<Types.BackupExportResult> {
    if (!savePath) {
        throw new Error('Путь для сохранения не указан');
    }

    try {
        // Создаем директорию, если её нет
        const saveDir = path.dirname(savePath);
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        // Создаем бэкап с указанным именем
        const fileName = path.basename(savePath);
        const result = await backupManager.createBackup(fileName);

        if (!result.success) {
            throw new Error(result.error || 'Ошибка создания бэкапа');
        }

        // Если путь отличается от пути бэкапа, копируем файл
        const normalizedBackupPath = path.resolve(result.backupPath);
        const normalizedSavePath = path.resolve(savePath);

        if (normalizedBackupPath !== normalizedSavePath) {
            fs.copyFileSync(result.backupPath, savePath);
        }

        return {
            success: true,
            message: 'База данных успешно экспортирована',
            path: savePath
        };
    } catch (error) {
        throw new Error(`Ошибка экспорта базы данных: ${(error as Error).message}`);
    }
}

/**
 * Импортировать базу данных из файла
 */
export async function importDatabaseFromFile(filePath: string): Promise<Types.BackupImportResult> {
    if (!filePath) {
        throw new Error('Путь к файлу не указан');
    }

    const normalizedPath = path.resolve(filePath);

    if (!fs.existsSync(normalizedPath)) {
        throw new Error(`Файл не найден: ${normalizedPath}`);
    }

    try {
        // Быстрая валидация файла (только проверка существования и размера)
        quickValidateFile(normalizedPath);

        console.log(`[Backup] Начало импорта бэкапа: ${path.basename(normalizedPath)}`);

        // Восстанавливаем из бэкапа
        // restoreFromBackup уже переоткрывает соединения внутри себя
        const result = await backupManager.restoreFromBackup(normalizedPath);

        if (!result.success) {
            console.error(`[Backup] Ошибка импорта бэкапа: ${result.error}`);
            throw new Error(result.error || 'Ошибка восстановления базы данных');
        }

        // Сохраняем путь к загруженному бэкапу
        lastLoadedBackupPath = normalizedPath;

        // Оптимизация: restoreFromBackup уже переоткрыл соединения и очистил кеш
        // Не перезагружаем все сервисы заново - это замедляет процесс
        // Вместо этого просто сбрасываем флаг принудительного переподключения
        try {
            const dbModule = require('../../db');
            if (dbModule.resetForceReconnect) {
                dbModule.resetForceReconnect();
            }
        } catch (e) {
            // Игнорируем
        }

        console.log(`[Backup] Бэкап успешно импортирован: ${path.basename(normalizedPath)}`);

        // Не создаем бэкап из импортированного файла - это замедляет процесс
        // Пользователь может создать бэкап вручную, если нужно

        return {
            success: true,
            message: 'База данных успешно импортирована'
        };
    } catch (error) {
        throw new Error(`Ошибка импорта базы данных: ${(error as Error).message}`);
    }
}


/**
 * Получить список бэкапов
 */
export async function getBackupList(): Promise<Types.BackupListResult> {
    try {
        const backups = backupManager.getBackupList();

        const result = backups.map(backup => {
            const stats = fs.existsSync(backup.path) ? fs.statSync(backup.path) : null;
            return {
                path: backup.path,
                createdAt: backup.createdAt,
                hash: backup.hash
            };
        });

        return {
            success: true,
            backups: result,
            message: `Найдено ${result.length} резервных копий`
        };
    } catch (error) {
        throw new Error(`Ошибка получения списка бэкапов: ${(error as Error).message}`);
    }
}

/**
 * Удалить бэкап
 */
export async function deleteBackup(filePath: string): Promise<{ success: boolean; message: string }> {
    try {
        const deleted = backupManager.deleteBackup(filePath);
        if (deleted) {
            return {
                success: true,
                message: 'Резервная копия успешно удалена'
            };
        } else {
            return {
                success: false,
                message: 'Резервная копия не найдена'
            };
        }
    } catch (error) {
        throw new Error(`Ошибка удаления бэкапа: ${(error as Error).message}`);
    }
}

/**
 * Получить информацию о текущей базе данных
 * Если загружен бэкап, показывает информацию о бэкапе
 */
export function getCurrentDatabaseInfo(): { name: string; path: string } {
    try {
        // Если загружен бэкап, показываем информацию о нем
        if (lastLoadedBackupPath && fs.existsSync(lastLoadedBackupPath)) {
            return {
                name: path.basename(lastLoadedBackupPath),
                path: lastLoadedBackupPath
            };
        }

        // Иначе показываем информацию о текущей БД
        const dbPath = connectionManager.getDatabasePath();
        const name = path.basename(dbPath);
        return {
            name,
            path: dbPath
        };
    } catch (error) {
        throw new Error(`Не удалось получить информацию о базе данных: ${(error as Error).message}`);
    }
}

/**
 * Получить путь к директории exe файла
 */
export function getExeDirectory(): string {
    if (isPortable()) {
        return process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
    }

    if (app && app.isPackaged) {
        return path.dirname(process.execPath);
    }

    return getProjectRoot(__dirname);
}



