/**
 * Менеджер для управления резервными копиями базы данных
 * Единая точка управления всеми операциями с бэкапами
 * 
 * @module services/backup/BackupManager
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { app } from 'electron';
import Database from 'better-sqlite3';
import type { Types } from 'types';

/**
 * Интерфейс для метаданных бэкапа
 */
interface BackupMetadata {
    path: string;
    hash: string;
    createdAt: string;
    size: number;
}

/**
 * Интерфейс для файла метаданных
 */
interface MetadataFile {
    backups: BackupMetadata[];
    lastSync: string;
}

/**
 * Менеджер резервных копий
 */
export class BackupManager {
    private backupDir: string;
    private metadataPath: string;
    private metadata: MetadataFile;

    constructor() {
        this.backupDir = this.getBackupDirectory();
        this.metadataPath = path.join(this.backupDir, 'backups_metadata.json');
        this.ensureBackupDirectory();
        this.metadata = this.loadMetadata();
    }

    /**
     * Получить директорию для бэкапов
     */
    private getBackupDirectory(): string {
        let isPortable = !!process.env.PORTABLE_EXECUTABLE_DIR;
        if (!isPortable && process.execPath) {
            const execName = path.basename(process.execPath, '.exe');
            isPortable = execName.includes('portable') || execName.includes('Portable');
        }

        if (isPortable) {
            const exeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
            return path.join(exeDir, 'backups');
        }

        if (app && app.isPackaged) {
            return path.join(path.dirname(process.execPath), 'backups');
        }

        // В режиме разработки используем db/backups
        const dbDir = path.join(__dirname, '..', '..', 'db');
        return path.join(dbDir, 'backups');
    }

    /**
     * Создать директорию для бэкапов, если её нет
     */
    private ensureBackupDirectory(): void {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    /**
     * Загрузить метаданные из файла
     */
    private loadMetadata(): MetadataFile {
        if (!fs.existsSync(this.metadataPath)) {
            return { backups: [], lastSync: new Date().toISOString() };
        }

        try {
            const content = fs.readFileSync(this.metadataPath, 'utf8');
            const metadata = JSON.parse(content) as MetadataFile;
            // Валидация структуры
            if (!metadata.backups || !Array.isArray(metadata.backups)) {
                return { backups: [], lastSync: new Date().toISOString() };
            }
            return metadata;
        } catch (error) {
            console.error('[BackupManager] Error loading metadata:', (error as Error).message);
            return { backups: [], lastSync: new Date().toISOString() };
        }
    }

    /**
     * Сохранить метаданные в файл
     */
    private saveMetadata(): void {
        try {
            this.metadata.lastSync = new Date().toISOString();
            fs.writeFileSync(this.metadataPath, JSON.stringify(this.metadata, null, 2), 'utf8');
        } catch (error) {
            console.error('[BackupManager] Error saving metadata:', (error as Error).message);
            throw new Error('Не удалось сохранить метаданные бэкапов');
        }
    }

    /**
     * Вычислить MD5 хеш файла
     */
    private async calculateFileHash(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('md5');
            const stream = fs.createReadStream(filePath);
            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
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
        try {
            const testDb = new Database(filePath, { readonly: true });
            const result = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1").get();
            testDb.close();

            if (!result) {
                throw new Error('База данных не содержит таблиц');
            }
        } catch (error) {
            const err = error as Error;
            if (err.message.includes('not a database')) {
                throw new Error('Файл не является валидной базой данных SQLite');
            }
            throw new Error(`Ошибка валидации базы данных: ${err.message}`);
        }
    }

    /**
     * Найти дубликат по хешу
     */
    private findDuplicateByHash(hash: string): BackupMetadata | null {
        return this.metadata.backups.find(b => b.hash === hash) || null;
    }

    /**
     * Удалить дубликаты по хешу (кроме указанного пути)
     */
    private removeDuplicatesByHash(hash: string, keepPath: string): number {
        let removedCount = 0;

        this.metadata.backups = this.metadata.backups.filter(backup => {
            if (backup.hash === hash && backup.path !== keepPath) {
                // Удаляем файл, если он существует
                if (fs.existsSync(backup.path)) {
                    try {
                        fs.unlinkSync(backup.path);
                        console.log(`[BackupManager] Deleted duplicate: ${backup.path}`);
                    } catch (e) {
                        console.warn(`[BackupManager] Could not delete duplicate: ${backup.path}`, (e as Error).message);
                    }
                }
                removedCount++;
                return false;
            }
            return true;
        });

        return removedCount;
    }

    /**
     * Синхронизировать метаданные с реальными файлами
     */
    public syncMetadataWithFiles(): { added: number; removed: number } {
        const files = fs.readdirSync(this.backupDir);
        const existingFiles = new Set<string>();
        let added = 0;
        let removed = 0;

        // Собираем все .db файлы в директории
        files.forEach(file => {
            if (file.endsWith('.db') && file !== 'backups_metadata.json') {
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

        // Удаляем из метаданных файлы, которых нет
        const beforeCount = this.metadata.backups.length;
        this.metadata.backups = this.metadata.backups.filter(backup => {
            if (fs.existsSync(backup.path)) {
                return true;
            } else {
                removed++;
                return false;
            }
        });

        // Добавляем в метаданные файлы, которых там нет
        existingFiles.forEach(filePath => {
            const exists = this.metadata.backups.some(b => b.path === filePath);
            if (!exists) {
                try {
                    const stats = fs.statSync(filePath);
                    this.metadata.backups.push({
                        path: filePath,
                        hash: '', // Будет вычислен при следующем использовании
                        createdAt: stats.birthtime.toISOString(),
                        size: stats.size
                    });
                    added++;
                } catch (e) {
                    // Игнорируем ошибки
                }
            }
        });

        if (added > 0 || removed > 0) {
            this.saveMetadata();
        }

        return { added, removed };
    }

    /**
     * Создать бэкап из файла базы данных
     */
    public async createBackupFromFile(sourcePath: string, customName?: string): Promise<BackupMetadata> {
        // Валидация исходного файла
        this.validateDatabaseFile(sourcePath);

        // Вычисляем хеш
        const hash = await this.calculateFileHash(sourcePath);

        // Проверяем на дубликаты
        const duplicate = this.findDuplicateByHash(hash);
        if (duplicate && fs.existsSync(duplicate.path)) {
            console.log('[BackupManager] Duplicate backup found, returning existing');
            return duplicate;
        }

        // Генерируем имя файла
        const fileName = customName || `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
        let backupPath = path.join(this.backupDir, fileName);

        // Если файл с таким именем существует, добавляем суффикс
        let counter = 1;
        while (fs.existsSync(backupPath)) {
            const nameWithoutExt = path.parse(fileName).name;
            const ext = path.parse(fileName).ext;
            backupPath = path.join(this.backupDir, `${nameWithoutExt}_${counter}${ext}`);
            counter++;
        }

        // Копируем файл
        fs.copyFileSync(sourcePath, backupPath);

        // Получаем размер файла
        const stats = fs.statSync(backupPath);

        // Удаляем дубликаты с таким же хешем
        this.removeDuplicatesByHash(hash, backupPath);

        // Создаем метаданные
        const metadata: BackupMetadata = {
            path: backupPath,
            hash,
            createdAt: new Date().toISOString(),
            size: stats.size
        };

        // Добавляем в метаданные
        const existingIndex = this.metadata.backups.findIndex(b => b.path === backupPath);
        if (existingIndex >= 0) {
            this.metadata.backups[existingIndex] = metadata;
        } else {
            this.metadata.backups.push(metadata);
        }

        // Сортируем по дате (новые сначала)
        this.metadata.backups.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // Сохраняем метаданные
        this.saveMetadata();

        console.log(`[BackupManager] Backup created: ${backupPath}`);
        return metadata;
    }

    /**
     * Получить список всех бэкапов
     */
    public getBackupList(): BackupMetadata[] {
        // Синхронизируем перед возвратом
        this.syncMetadataWithFiles();
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
                console.log(`[BackupManager] Backup deleted: ${backupPath}`);
                return true;
            }

            return false;
        } catch (error) {
            console.error(`[BackupManager] Error deleting backup: ${backupPath}`, (error as Error).message);
            throw new Error(`Не удалось удалить бэкап: ${(error as Error).message}`);
        }
    }

    /**
     * Получить путь к директории бэкапов
     */
    public getBackupDirectoryPath(): string {
        return this.backupDir;
    }

    /**
     * Очистить старые бэкапы (старше указанного количества дней)
     */
    public cleanupOldBackups(daysOld: number = 30): { deletedCount: number; freedSpace: number } {
        const now = Date.now();
        const maxAge = daysOld * 24 * 60 * 60 * 1000;
        let deletedCount = 0;
        let freedSpace = 0;

        this.metadata.backups = this.metadata.backups.filter(backup => {
            const backupAge = now - new Date(backup.createdAt).getTime();

            if (backupAge > maxAge) {
                if (fs.existsSync(backup.path)) {
                    try {
                        freedSpace += backup.size;
                        fs.unlinkSync(backup.path);
                        deletedCount++;
                        console.log(`[BackupManager] Deleted old backup: ${backup.path}`);
                    } catch (e) {
                        console.warn(`[BackupManager] Could not delete old backup: ${backup.path}`, (e as Error).message);
                        return true; // Оставляем в метаданных, если не удалось удалить
                    }
                }
                return false;
            }
            return true;
        });

        if (deletedCount > 0) {
            this.saveMetadata();
        }

        return { deletedCount, freedSpace };
    }
}

// Экспортируем singleton экземпляр
export const backupManager = new BackupManager();

