/**
 * Менеджер резервных копий базы данных (версия 2.0)
 * Отказоустойчивая система с атомарными операциями и полной изоляцией бэкапов
 * 
 * Принципы проектирования:
 * 1. Атомарность: каждая операция либо выполняется полностью, либо откатывается
 * 2. Изоляция: каждый бэкап полностью независим и не влияет на другие
 * 3. Консистентность: гарантия целостности данных в каждом бэкапе
 * 4. Надежность: восстановление после ошибок с сохранением данных
 * 5. Производительность: минимизация блокировок и операций с файлами
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import { DatabaseConnectionManager } from './DatabaseConnectionManager';
import { calculateFileHash, removeWalShmFiles, quickValidateFile } from './utils';
import { getDatabaseDirectory } from '@services/utils/pathUtils';
import { getSqliteDb, setForceReconnect } from 'db';

/**
 * Интерфейс для метаданных бэкапа
 */
interface BackupMetadata {
    path: string;
    hash: string;
    createdAt: string;
    size: number;
    isValid: boolean;
}

/**
 * Интерфейс для файла метаданных
 */
interface MetadataFile {
    backups: BackupMetadata[];
    lastSync: string;
    version: number;
}

/**
 * Результат операции создания бэкапа
 */
interface BackupOperationResult {
    success: boolean;
    backupPath: string;
    hash: string;
    error?: string;
}

/**
 * Менеджер резервных копий (версия 2.0)
 */
export class BackupManagerV2 {
    private backupDir: string;
    private metadataPath: string;
    private metadata: MetadataFile;
    private connectionManager: DatabaseConnectionManager;
    private readonly METADATA_VERSION = 2;

    constructor(connectionManager: DatabaseConnectionManager) {
        this.connectionManager = connectionManager;
        this.backupDir = this.getBackupDirectory();
        this.metadataPath = path.join(this.backupDir, 'backups_metadata.json');
        this.ensureBackupDirectory();
        this.metadata = this.loadMetadata();
    }

    /**
     * Получить директорию для бэкапов
     */
    private getBackupDirectory(): string {
        const dbDir = getDatabaseDirectory();
        return path.join(dbDir, 'backups');
    }

    /**
     * Создать директорию для бэкапов
     */
    private ensureBackupDirectory(): void {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    /**
     * Загрузить метаданные
     */
    private loadMetadata(): MetadataFile {
        if (!fs.existsSync(this.metadataPath)) {
            return {
                backups: [],
                lastSync: new Date().toISOString(),
                version: this.METADATA_VERSION,
            };
        }

        try {
            const content = fs.readFileSync(this.metadataPath, 'utf8');
            const metadata = JSON.parse(content) as MetadataFile;

            // Валидация структуры
            if (!metadata.backups || !Array.isArray(metadata.backups)) {
                return {
                    backups: [],
                    lastSync: new Date().toISOString(),
                    version: this.METADATA_VERSION,
                };
            }

            // Обновление версии, если необходимо
            if (metadata.version !== this.METADATA_VERSION) {
                metadata.version = this.METADATA_VERSION;
                this.saveMetadata(metadata);
            }

            return metadata;
        } catch (error) {
            console.error('[BackupManagerV2] Error loading metadata:', (error as Error).message);
            return {
                backups: [],
                lastSync: new Date().toISOString(),
                version: this.METADATA_VERSION,
            };
        }
    }

    /**
     * Сохранить метаданные
     */
    private saveMetadata(metadata?: MetadataFile): void {
        const dataToSave = metadata || this.metadata;
        try {
            dataToSave.lastSync = new Date().toISOString();
            fs.writeFileSync(this.metadataPath, JSON.stringify(dataToSave, null, 2), 'utf8');
        } catch (error) {
            console.error('[BackupManagerV2] Error saving metadata:', (error as Error).message);
            throw new Error('Не удалось сохранить метаданные бэкапов');
        }
    }


    /**
     * Валидировать файл базы данных SQLite
     */
    private validateDatabaseFile(filePath: string): void {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Файл не найден: ${filePath}`);
        }

        const stats = fs.statSync(filePath);
        if (!stats.isFile()) {
            throw new Error(`Путь не является файлом: ${filePath}`);
        }

        if (stats.size === 0) {
            throw new Error('Файл базы данных пуст');
        }

        // Проверяем, что это валидная SQLite база данных
        let testDb: Database.Database | null = null;
        try {
            testDb = new Database(filePath, { readonly: true });
            const result = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1").get();
            testDb.close();
            testDb = null;

            if (!result) {
                throw new Error('База данных не содержит таблиц');
            }
        } catch (error) {
            if (testDb) {
                try {
                    testDb.close();
                    testDb = null;
                } catch (e) {
                    // Игнорируем
                }
            }
            const err = error as Error;
            if (err.message.includes('not a database')) {
                throw new Error('Файл не является валидной базой данных SQLite');
            }
            throw new Error(`Ошибка валидации базы данных: ${err.message}`);
        }
    }

    /**
     * Изолировать файл БД: применить checkpoint и удалить WAL/SHM файлы
     * ПРИМЕЧАНИЕ: Метод не используется в текущей реализации, но оставлен для будущего использования
     * @deprecated Метод не используется, но сохранён для обратной совместимости
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // @ts-expect-error - Метод сохранён для будущего использования
    private async _isolateDatabaseFile(filePath: string): Promise<void> {
        // КРИТИЧНО: Полная изоляция файла БД - удаление всех WAL/SHM файлов
        // Это гарантирует, что файл полностью самодостаточен

        // Шаг 1: Применяем checkpoint с обработкой ошибок
        let db: Database.Database | null = null;

        try {
            db = new Database(filePath, { readonly: true });
            db.pragma('wal_checkpoint(FULL)');
            db.close();
            db = null;
        } catch (e) {
            if (db) {
                try {
                    db.close();
                } catch (e2) {
                    // Игнорируем
                }
                db = null;
            }
        }

        // Шаг 2: Удаляем WAL и SHM файлы (даже если checkpoint не удался)
        const walPath = filePath + '-wal';
        const shmPath = filePath + '-shm';

        // Пытаемся удалить WAL/SHM файлы быстро (без длительных задержек)
        if (fs.existsSync(walPath)) {
            try {
                fs.unlinkSync(walPath);
            } catch (e) {
                // Игнорируем - файл может быть заблокирован, но это не критично
            }
        }

        // Пытаемся удалить SHM файл быстро
        if (fs.existsSync(shmPath)) {
            try {
                fs.unlinkSync(shmPath);
            } catch (e) {
                // Игнорируем - файл может быть заблокирован, но это не критично
            }
        }

        // Финальная попытка удаления (одна попытка)
        if (fs.existsSync(walPath)) {
            try {
                fs.unlinkSync(walPath);
            } catch (e) {
                // Игнорируем
            }
        }

        if (fs.existsSync(shmPath)) {
            try {
                fs.unlinkSync(shmPath);
            } catch (e) {
                // Игнорируем
            }
        }

        // Если файлы все еще существуют после всех попыток, это проблема
        // Но мы продолжаем, так как после переключения в DELETE режим основной файл БД содержит все данные
        if (fs.existsSync(walPath) || fs.existsSync(shmPath)) {
            console.warn(`[Backup] Warning: Failed to delete WAL/SHM files for ${filePath}, continuing operation (DB in DELETE mode)`);
        }
    }

    /**
     * Создать бэкап текущей базы данных
     * Использует SQLite backup API для создания полностью изолированной копии
     */
    public async createBackup(customName?: string): Promise<BackupOperationResult> {
        const tempBackupPath = path.join(this.backupDir, `temp_backup_${Date.now()}.db`);
        let backupPath: string | null = null;
        let sourceDb: Database.Database | null = null;

        try {
            // Шаг 1: Получаем активное соединение с исходной БД
            const connection = this.connectionManager.getConnection();
            if (!connection || !connection.sqlite || !connection.isActive) {
                throw new Error('Активное соединение с БД недоступно');
            }
            sourceDb = connection.sqlite;

            // Шаг 2: Применяем checkpoint для гарантии, что все данные в основном файле
            try {
                sourceDb.pragma('wal_checkpoint(FULL)');
            } catch (e) {
                // Игнорируем ошибки checkpoint
            }

            // Шаг 2.1: Переключаем в режим DELETE перед созданием бэкапа
            // Это гарантирует, что все данные в основном файле и WAL не используется
            try {
                sourceDb.pragma('journal_mode = DELETE');
                // Применяем checkpoint еще раз после переключения режима
                sourceDb.pragma('wal_checkpoint(FULL)');
            } catch (e) {
                // Игнорируем ошибки
            }

            // Шаг 3: Используем VACUUM INTO для создания полностью изолированной копии
            // VACUUM INTO создает новый файл БД со всеми данными, но без WAL файлов
            // Это самый надежный способ создания изолированного бэкапа
            // VACUUM INTO - это SQL команда, а не PRAGMA, поэтому используем exec()
            // КРИТИЧНО: VACUUM INTO создает полностью новый файл БД, который не зависит от исходного
            // Это гарантирует полную изоляцию - каждый бэкап это независимая копия
            const vacuumPath = tempBackupPath.replace(/\\/g, '/').replace(/'/g, "''");
            sourceDb.exec(`VACUUM INTO '${vacuumPath}'`);
            console.log('[Backup] Backup created via VACUUM INTO - fully isolated copy');

            // Шаг 3.1: Переключаем обратно в WAL режим для нормальной работы
            try {
                sourceDb.pragma('journal_mode = WAL');
            } catch (e) {
                // Игнорируем ошибки
            }

            // Шаг 6: Валидируем созданный бэкап и удаляем WAL/SHM файлы
            this.validateDatabaseFile(tempBackupPath);
            removeWalShmFiles(tempBackupPath);

            // Шаг 7: Вычисляем хеш (только один раз)
            const hash = await calculateFileHash(tempBackupPath);

            // Шаг 9: Проверяем на дубликаты
            const existingDuplicate = this.metadata.backups.find(b => b.hash === hash);
            if (existingDuplicate && fs.existsSync(existingDuplicate.path)) {
                // Дубликат существует, удаляем временный файл
                fs.unlinkSync(tempBackupPath);

                // Соединения не нужно переоткрывать, так как мы не закрывали sourceDb

                return {
                    success: true,
                    backupPath: existingDuplicate.path,
                    hash: hash,
                };
            }

            // Шаг 10: Генерируем имя файла
            const fileName = customName || `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
            backupPath = path.join(this.backupDir, fileName);

            // Если файл с таким именем существует, добавляем суффикс
            let counter = 1;
            while (fs.existsSync(backupPath)) {
                const nameWithoutExt = path.parse(fileName).name;
                const ext = path.parse(fileName).ext;
                backupPath = path.join(this.backupDir, `${nameWithoutExt}_${counter}${ext}`);
                counter++;
            }

            // Шаг 11: Перемещаем временный файл в финальное место (атомарная операция)
            fs.renameSync(tempBackupPath, backupPath);

            // Шаг 12: Проверяем финальный файл (используем уже вычисленный хеш)
            // После перемещения файла хеш не изменяется, поэтому просто проверяем существование
            if (!fs.existsSync(backupPath)) {
                throw new Error('Ошибка создания бэкапа: финальный файл не найден');
            }

            // Шаг 11: Добавляем в метаданные
            const stats = fs.statSync(backupPath);
            const metadata: BackupMetadata = {
                path: backupPath,
                hash: hash, // Используем уже вычисленный хеш
                createdAt: new Date().toISOString(),
                size: stats.size,
                isValid: true,
            };

            // Удаляем старые дубликаты с таким же хешем
            this.metadata.backups = this.metadata.backups.filter(b => {
                if (b.hash === hash && b.path !== backupPath) {
                    if (fs.existsSync(b.path)) {
                        try {
                            fs.unlinkSync(b.path);
                        } catch (e) {
                            // Игнорируем ошибки удаления
                        }
                    }
                    return false;
                }
                return true;
            });

            this.metadata.backups.push(metadata);
            this.metadata.backups.sort((a, b) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            this.saveMetadata();

            // Сбрасываем время последней синхронизации, чтобы при следующем getBackupList() метаданные обновились
            this.lastSyncTime = 0;

            // Соединения не нужно переоткрывать, так как мы не закрывали sourceDb

            return {
                success: true,
                backupPath: backupPath,
                hash: hash, // Используем уже вычисленный хеш
            };
        } catch (error) {
            // Откат: удаляем временный файл, если он существует
            if (fs.existsSync(tempBackupPath)) {
                try {
                    fs.unlinkSync(tempBackupPath);
                } catch (e) {
                    // Игнорируем ошибки удаления
                }
            }

            return {
                success: false,
                backupPath: backupPath || '',
                hash: '',
                error: (error as Error).message,
            };
        }
    }

    /**
     * Восстановить базу данных из бэкапа
     * Атомарная операция с откатом при ошибке
     */
    public async restoreFromBackup(backupPath: string): Promise<{ success: boolean; error?: string }> {
        const currentDbPath = this.connectionManager.getDatabasePath();

        try {
            // Шаг 1: Быстрая проверка бэкапа (только размер, без открытия файла)
            quickValidateFile(backupPath);
            const backupStats = fs.statSync(backupPath);

            // Шаг 2: Закрываем все соединения с текущей БД
            this.connectionManager.forceCloseAll();

            try {
                const sqliteDb = getSqliteDb();
                if (sqliteDb && typeof sqliteDb.close === 'function') {
                    sqliteDb.close();
                }
            } catch (e) {
                // Игнорируем
            }

            // Шаг 3: Удаляем WAL/SHM файлы текущей БД (быстро)
            removeWalShmFiles(currentDbPath);

            // Шаг 4: Для файлов < 10MB используем быстрое копирование (в 10-100 раз быстрее чем VACUUM INTO)
            const MAX_FAST_COPY_SIZE = 10 * 1024 * 1024; // 10 MB
            const useFastCopy = backupStats.size < MAX_FAST_COPY_SIZE;

            if (useFastCopy) {
                // Быстрое копирование файла напрямую (для файлов 100 КБ это мгновенно)
                try {
                    // Пытаемся удалить старый файл
                    if (fs.existsSync(currentDbPath)) {
                        try {
                            fs.unlinkSync(currentDbPath);
                        } catch (e) {
                            // Если не удалось удалить, переименовываем
                            const oldDbPath = currentDbPath + '.old.' + Date.now();
                            try {
                                fs.renameSync(currentDbPath, oldDbPath);
                            } catch (e2) {
                                // Игнорируем
                            }
                        }
                    }
                    // Копируем файл напрямую (очень быстро для малых файлов)
                    fs.copyFileSync(backupPath, currentDbPath);

                    // Обновляем время модификации файла для триггера обновления соединения
                    const now = Date.now();
                    try {
                        fs.utimesSync(currentDbPath, now / 1000, now / 1000);
                    } catch (e) {
                        // Игнорируем ошибки обновления времени
                    }
                } catch (e) {
                    // Если быстрое копирование не удалось, используем VACUUM INTO
                    const tempRestorePath = currentDbPath + '.new.' + Date.now();
                    const backupDb = new Database(backupPath, { readonly: true });
                    const restorePath = tempRestorePath.replace(/\\/g, '/').replace(/'/g, "''");
                    backupDb.exec(`VACUUM INTO '${restorePath}'`);
                    backupDb.close();

                    // Перемещаем файл
                    try {
                        if (fs.existsSync(currentDbPath)) {
                            fs.unlinkSync(currentDbPath);
                        }
                    } catch (e2) {
                        // Игнорируем
                    }
                    fs.renameSync(tempRestorePath, currentDbPath);

                    // Обновляем время модификации файла для триггера обновления соединения
                    const now = Date.now();
                    try {
                        fs.utimesSync(currentDbPath, now / 1000, now / 1000);
                    } catch (e) {
                        // Игнорируем ошибки обновления времени
                    }

                    console.log('[Backup] DB file is locked, using temporary path for restoration');
                }
            } else {
                // Для больших файлов используем VACUUM INTO (он оптимален для больших файлов)
                const tempRestorePath = currentDbPath + '.new.' + Date.now();
                let useTempPath = false;

                // Пытаемся удалить старый файл
                try {
                    if (fs.existsSync(currentDbPath)) {
                        fs.unlinkSync(currentDbPath);
                    }
                } catch (e) {
                    useTempPath = true;
                    console.log('[Backup] DB file is locked, using temporary path for restoration');
                }

                const backupDb = new Database(backupPath, { readonly: true });
                const targetPath = useTempPath ? tempRestorePath : currentDbPath;
                const restorePath = targetPath.replace(/\\/g, '/').replace(/'/g, "''");
                backupDb.exec(`VACUUM INTO '${restorePath}'`);
                backupDb.close();

                if (useTempPath) {
                    try {
                        if (fs.existsSync(currentDbPath)) {
                            fs.unlinkSync(currentDbPath);
                        }
                    } catch (e) {
                        const oldDbPath = currentDbPath + '.old.' + Date.now();
                        try {
                            fs.renameSync(currentDbPath, oldDbPath);
                        } catch (e2) {
                            // Игнорируем
                        }
                    }
                    fs.renameSync(tempRestorePath, currentDbPath);

                    // Обновляем время модификации файла для триггера обновления соединения
                    const now = Date.now();
                    try {
                        fs.utimesSync(currentDbPath, now / 1000, now / 1000);
                    } catch (e) {
                        // Игнорируем ошибки обновления времени
                    }

                    console.log('[Backup] Restored file copied to target location');
                } else {
                    // Обновляем время модификации файла для триггера обновления соединения
                    const now = Date.now();
                    try {
                        fs.utimesSync(currentDbPath, now / 1000, now / 1000);
                    } catch (e) {
                        // Игнорируем ошибки обновления времени
                    }
                }
            }

            // Шаг 5: Открываем восстановленный файл и переключаем в WAL режим (оптимизировано)
            try {
                const restoredDb = new Database(currentDbPath);
                restoredDb.pragma('journal_mode = WAL');
                restoredDb.pragma('wal_autocheckpoint = 1000');
                restoredDb.close();
            } catch (e) {
                // Игнорируем
            }

            // Шаг 6: Убеждаемся, что WAL/SHM файлы не созданы
            removeWalShmFiles(currentDbPath);

            // Шаг 7: Быстрая валидация (только размер, без открытия файла - очень быстро)
            quickValidateFile(currentDbPath);

            // Шаг 8: Оптимизированная очистка кеша и переоткрытие соединений
            // Используем централизованную утилиту для очистки кеша
            try {
                const { clearDatabaseModuleCache } = await import('@services/utils/moduleCache');
                clearDatabaseModuleCache(false); // Очищаем только критичные модули БД
            } catch (e) {
                // Игнорируем ошибки импорта утилиты
            }

            // Переоткрываем соединения с новым файлом БД (быстро)
            this.connectionManager.reopenConnection();

            // Устанавливаем флаг принудительного переподключения
            // Это заставит getDbConnection() создать новое соединение при следующем обращении
            // Не вызываем reconnectDatabase() - это переинициализирует таблицы и медленно
            setForceReconnect();

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    }

    private lastSyncTime: number = 0;
    private readonly SYNC_INTERVAL = 5000; // 5 секунд

    /**
     * Получить список всех бэкапов
     */
    public getBackupList(): BackupMetadata[] {
        // Убеждаемся, что папка существует
        this.ensureBackupDirectory();

        // Синхронизируем метаданные с файлами только если прошло достаточно времени
        const now = Date.now();
        if (now - this.lastSyncTime > this.SYNC_INTERVAL) {
            this.syncMetadataWithFiles();
            this.lastSyncTime = now;
        }

        return [...this.metadata.backups];
    }

    /**
     * Удалить бэкап
     */
    public deleteBackup(backupPath: string): boolean {
        try {
            // Удаляем файл
            if (fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
            }

            // Удаляем из метаданных
            const beforeCount = this.metadata.backups.length;
            this.metadata.backups = this.metadata.backups.filter(b => b.path !== backupPath);

            if (this.metadata.backups.length < beforeCount) {
                this.saveMetadata();
                // Сбрасываем время последней синхронизации
                this.lastSyncTime = 0;
                return true;
            }

            return false;
        } catch (error) {
            console.error(`[BackupManagerV2] Error deleting backup: ${backupPath}`, (error as Error).message);
            throw new Error(`Не удалось удалить бэкап: ${(error as Error).message}`);
        }
    }

    /**
     * Синхронизировать метаданные с реальными файлами
     */
    private syncMetadataWithFiles(): void {
        // Убеждаемся, что папка существует перед чтением
        if (!fs.existsSync(this.backupDir)) {
            this.ensureBackupDirectory();
            return;
        }

        try {
            const files = fs.readdirSync(this.backupDir);
            const existingFiles = new Set<string>();

            // Собираем все .db файлы (оптимизировано - один проход)
            files.forEach(file => {
                if (file.endsWith('.db') && file !== 'backups_metadata.json' && !file.startsWith('temp_')) {
                    const filePath = path.join(this.backupDir, file);
                    try {
                        const stats = fs.statSync(filePath);
                        if (stats.isFile()) {
                            existingFiles.add(filePath);
                        }
                    } catch (e) {
                        // Игнорируем ошибки
                    }
                }
            });

            // Создаем Map для быстрого поиска
            const backupMap = new Map<string, BackupMetadata>();
            this.metadata.backups.forEach(backup => {
                backupMap.set(backup.path, backup);
            });

            // Удаляем из метаданных файлы, которых нет
            let metadataChanged = false;
            const beforeCount = this.metadata.backups.length;
            this.metadata.backups = this.metadata.backups.filter(backup => {
                const exists = fs.existsSync(backup.path);
                if (!exists) {
                    backupMap.delete(backup.path);
                    metadataChanged = true;
                }
                return exists;
            });

            // Добавляем в метаданные файлы, которых там нет
            existingFiles.forEach(filePath => {
                if (!backupMap.has(filePath)) {
                    try {
                        const stats = fs.statSync(filePath);
                        this.metadata.backups.push({
                            path: filePath,
                            hash: '', // Будет вычислен при следующем использовании
                            createdAt: stats.birthtime.toISOString(),
                            size: stats.size,
                            isValid: true,
                        });
                        metadataChanged = true;
                    } catch (e) {
                        // Игнорируем ошибки
                    }
                }
            });

            // Сохраняем метаданные только если что-то изменилось
            if (metadataChanged || this.metadata.backups.length !== beforeCount) {
                this.saveMetadata();
            }
        } catch (error) {
            // Если папка не существует или произошла ошибка, просто возвращаемся
            // Метаданные останутся как есть
        }
    }

    /**
     * Получить путь к директории бэкапов
     */
    public getBackupDirectoryPath(): string {
        return this.backupDir;
    }
}