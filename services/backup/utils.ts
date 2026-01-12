/**
 * Утилиты для системы управления бэкапами
 * Специфичные функции для работы с файлами бэкапов
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { isPortable, getProjectRoot, getDatabaseDirectory } from '../utils/pathUtils';

// Реэкспорт общих функций для удобства
export { isPortable, getProjectRoot, getDatabaseDirectory };

/**
 * Вычислить MD5 хеш файла (асинхронно)
 */
export function calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

/**
 * Удалить WAL/SHM файлы для указанного пути к БД
 */
export function removeWalShmFiles(dbPath: string): void {
    const walPath = dbPath + '-wal';
    const shmPath = dbPath + '-shm';

    try {
        if (fs.existsSync(walPath)) {
            fs.unlinkSync(walPath);
        }
    } catch (e) {
        // Игнорируем ошибки
    }

    try {
        if (fs.existsSync(shmPath)) {
            fs.unlinkSync(shmPath);
        }
    } catch (e) {
        // Игнорируем ошибки
    }
}

/**
 * Быстрая проверка файла (только размер, без открытия)
 */
export function quickValidateFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Файл не найден: ${filePath}`);
    }
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
        throw new Error(`Путь не является файлом: ${filePath}`);
    }
    if (stats.size === 0) {
        throw new Error('Файл пуст');
    }
}
