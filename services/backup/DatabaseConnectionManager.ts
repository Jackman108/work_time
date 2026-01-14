/**
 * Менеджер соединений с базой данных
 * Единая точка управления всеми соединениями для обеспечения отказоустойчивости
 * 
 * Принципы:
 * - Атомарность: все операции либо выполняются полностью, либо откатываются
 * - Изоляция: каждое соединение полностью изолировано
 * - Консистентность: гарантия целостности данных
 * - Надежность: восстановление после ошибок
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@db/schema';

/**
 * Интерфейс для управления соединением
 */
interface ConnectionHandle {
    sqlite: Database.Database;
    drizzle: ReturnType<typeof drizzle>;
    path: string;
    isActive: boolean;
}

/**
 * Менеджер соединений с базой данных
 * Обеспечивает единую точку управления всеми соединениями
 */
export class DatabaseConnectionManager {
    private static instance: DatabaseConnectionManager | null = null;
    private currentConnection: ConnectionHandle | null = null;
    private readonly dbPath: string;

    private constructor(dbPath: string) {
        this.dbPath = dbPath;
    }

    /**
     * Получить singleton экземпляр
     */
    public static getInstance(dbPath: string): DatabaseConnectionManager {
        if (!DatabaseConnectionManager.instance) {
            DatabaseConnectionManager.instance = new DatabaseConnectionManager(dbPath);
        }
        return DatabaseConnectionManager.instance;
    }

    /**
     * Получить путь к базе данных
     */
    public getDatabasePath(): string {
        return this.dbPath;
    }

    /**
     * Получить текущее активное соединение
     */
    public getConnection(): ConnectionHandle {
        if (!this.currentConnection || !this.currentConnection.isActive) {
            this.currentConnection = this.createConnection();
        }
        return this.currentConnection;
    }

    /**
     * Создать новое соединение
     */
    private createConnection(): ConnectionHandle {
        // Закрываем старое соединение, если оно существует
        this.closeConnection();

        // Проверяем существование файла
        if (!fs.existsSync(this.dbPath)) {
            throw new Error(`Database file not found: ${this.dbPath}`);
        }

        // Создаем новое SQLite соединение
        const sqlite = new Database(this.dbPath);

        // Настройки SQLite
        sqlite.pragma('foreign_keys = ON');

        try {
            sqlite.pragma('journal_mode = WAL');
            sqlite.pragma('wal_autocheckpoint = 1000');
        } catch (e) {
            // Игнорируем ошибки, если режим не поддерживается
        }

        try {
            sqlite.pragma('cache_size = -64000');
            sqlite.pragma('synchronous = NORMAL');
            sqlite.pragma('optimize');
        } catch (e) {
            // Игнорируем ошибки
        }

        // Создаем Drizzle клиент
        const drizzleClient = drizzle(sqlite, { schema });

        const handle: ConnectionHandle = {
            sqlite,
            drizzle: drizzleClient,
            path: this.dbPath,
            isActive: true,
        };

        return handle;
    }

    /**
     * Закрыть текущее соединение
     */
    public closeConnection(): void {
        if (this.currentConnection && this.currentConnection.isActive) {
            try {
                // Применяем checkpoint перед закрытием
                try {
                    this.currentConnection.sqlite.pragma('wal_checkpoint(FULL)');
                } catch (e) {
                    // Игнорируем ошибки checkpoint
                }

                // Закрываем соединение
                this.currentConnection.sqlite.close();
            } catch (e) {
                // Игнорируем ошибки закрытия
            } finally {
                this.currentConnection.isActive = false;
                this.currentConnection = null;
            }
        }
    }

    /**
     * Полностью закрыть все соединения и очистить состояние
     * Используется перед операциями с файлами БД
     */
    public forceCloseAll(): void {
        this.closeConnection();

        // Дополнительная задержка для завершения операций
        // В реальности это должно быть асинхронно, но для простоты используем синхронный подход
        // В production можно использовать Promise с задержкой
    }

    /**
     * Переоткрыть соединение
     * Используется после операций с файлами БД
     */
    public reopenConnection(): ConnectionHandle {
        this.forceCloseAll();

        // Небольшая задержка для завершения операций с файлами
        // В production это должно быть асинхронно

        return this.getConnection();
    }

    /**
     * Проверить, что соединение активно и валидно
     */
    public validateConnection(): boolean {
        if (!this.currentConnection || !this.currentConnection.isActive) {
            return false;
        }

        try {
            this.currentConnection.sqlite.prepare('SELECT 1').get();
            return true;
        } catch (e) {
            this.currentConnection.isActive = false;
            return false;
        }
    }

    /**
     * Получить SQLite соединение
     */
    public getSqlite(): Database.Database {
        return this.getConnection().sqlite;
    }

    /**
     * Получить Drizzle соединение
     */
    public getDrizzle(): ReturnType<typeof drizzle> {
        return this.getConnection().drizzle;
    }

    /**
     * Очистить все кеши и пересоздать соединение
     */
    public reset(): void {
        this.forceCloseAll();
        this.currentConnection = null;
    }
}
