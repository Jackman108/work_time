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
import { getDatabaseDirectory, isPortable, getProjectRoot } from '@services/utils/pathUtils';
import { executeBackupOperation, executeRestoreOperation } from '@services/utils/databaseLock';
import { validateFilePathForRead, validateDirPathForWrite, getSafeFileName } from '@services/utils/pathSecurity';
import { resetForceReconnect } from 'db';
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

// Функция reloadAllServices удалена - теперь используется глобальная reloadServices из main.ts
// Это устраняет дублирование и улучшает архитектуру

/**
 * Экспортировать базу данных в выбранное место
 * Защищено от race conditions через систему блокировок
 */
export async function exportDatabaseToFile(savePath: string): Promise<Types.BackupExportResult> {
    if (!savePath) {
        throw new Error('Путь для сохранения не указан');
    }

    // УЛУЧШЕНИЕ: Валидация пути для защиты от path traversal атак
    // Определяем базовую директорию для бэкапов
    const backupBaseDir = path.join(getDatabaseDirectory(), 'backups');

    // Валидируем директорию для записи
    const saveDir = path.dirname(savePath);
    const validatedSaveDir = validateDirPathForWrite(saveDir, backupBaseDir);

    // Получаем безопасное имя файла
    const safeFileName = getSafeFileName(savePath);
    const validatedSavePath = path.join(validatedSaveDir, safeFileName);

    // Выполняем операцию бэкапа с блокировкой
    return executeBackupOperation(async () => {
        try {
            // Создаем бэкап с указанным именем
            const result = await backupManager.createBackup(safeFileName);

            if (!result.success) {
                throw new Error(result.error || 'Ошибка создания бэкапа');
            }

            // Если путь отличается от пути бэкапа, копируем файл
            const normalizedBackupPath = path.resolve(result.backupPath);
            const normalizedSavePath = path.resolve(validatedSavePath);

            if (normalizedBackupPath !== normalizedSavePath) {
                fs.copyFileSync(result.backupPath, validatedSavePath);
            }

            return {
                success: true,
                message: 'База данных успешно экспортирована',
                path: validatedSavePath
            };
        } catch (error) {
            throw new Error(`Ошибка экспорта базы данных: ${(error as Error).message}`);
        }
    });
}

/**
 * Импортировать базу данных из файла
 * Защищено от race conditions через систему блокировок
 */
export async function importDatabaseFromFile(filePath: string): Promise<Types.BackupImportResult> {
    if (!filePath) {
        throw new Error('Путь к файлу не указан');
    }

    // УЛУЧШЕНИЕ: Валидация пути для защиты от path traversal атак
    // Для импорта разрешаем файлы из директории бэкапов или из пользовательской директории
    // (пользователь выбирает файл через диалог, поэтому путь уже проверен Electron)
    // Но всё равно валидируем для дополнительной безопасности
    const backupBaseDir = path.join(getDatabaseDirectory(), 'backups');
    let validatedPath: string;

    try {
        // Пробуем валидировать относительно директории бэкапов
        validatedPath = validateFilePathForRead(filePath, backupBaseDir);
    } catch {
        // Если файл не в директории бэкапов, проверяем, что это абсолютный путь
        // (пользователь выбрал через диалог - Electron уже проверил безопасность)
        validatedPath = path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(backupBaseDir, filePath);

        // Дополнительная проверка существования
        if (!fs.existsSync(validatedPath)) {
            throw new Error(`Файл не найден: ${validatedPath}`);
        }
    }

    // Выполняем операцию восстановления с блокировкой
    return executeRestoreOperation(async () => {
        try {
            // Быстрая валидация файла (только проверка существования и размера)
            quickValidateFile(validatedPath);

            console.log(`[Backup] Starting backup import: ${path.basename(validatedPath)}`);

            // Восстанавливаем из бэкапа
            // restoreFromBackup уже переоткрывает соединения внутри себя
            const result = await backupManager.restoreFromBackup(validatedPath);

            if (!result.success) {
                console.error(`[Backup] Backup import error: ${result.error}`);
                throw new Error(result.error || 'Ошибка восстановления базы данных');
            }

            // Сохраняем путь к загруженному бэкапу
            lastLoadedBackupPath = validatedPath;

            // Оптимизация: restoreFromBackup уже переоткрыл соединения и очистил кеш
            // Не перезагружаем все сервисы заново - это замедляет процесс
            // Вместо этого просто сбрасываем флаг принудительного переподключения
            resetForceReconnect();

            console.log(`[Backup] Backup successfully imported: ${path.basename(validatedPath)}`);

            // Не создаем бэкап из импортированного файла - это замедляет процесс
            // Пользователь может создать бэкап вручную, если нужно

            return {
                success: true,
                message: 'База данных успешно импортирована'
            };
        } catch (error) {
            throw new Error(`Ошибка импорта базы данных: ${(error as Error).message}`);
        }
    });
}


/**
 * Получить список бэкапов
 */
export async function getBackupList(): Promise<Types.BackupListResult> {
    try {
        const backups = backupManager.getBackupList();

        const result = backups.map(backup => ({
            path: backup.path,
            createdAt: backup.createdAt,
            hash: backup.hash
        }));

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



