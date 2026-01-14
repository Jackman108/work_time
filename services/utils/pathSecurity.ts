/**
 * Утилиты для безопасной работы с путями файлов
 * Защита от path traversal атак и некорректных путей
 * Следует принципам безопасности и Defense in Depth
 * 
 * @module services/utils/pathSecurity
 */

import * as path from 'path';
import * as fs from 'fs';

/**
 * Валидировать и нормализовать путь к файлу
 * Защищает от path traversal атак (../, ..\, и т.д.)
 * 
 * @param filePath - Путь к файлу для валидации
 * @param allowedBaseDir - Базовая директория, в которой должен находиться файл
 * @returns Нормализованный абсолютный путь
 * @throws Error если путь небезопасен или находится вне allowedBaseDir
 * 
 * @example
 * // Безопасно: файл в разрешённой директории
 * validatePath('/app/db/backup.db', '/app/db') // ✅ '/app/db/backup.db'
 * 
 * // Небезопасно: попытка выйти за пределы директории
 * validatePath('/app/db/../../etc/passwd', '/app/db') // ❌ Error
 */
export function validatePath(filePath: string, allowedBaseDir: string): string {
    if (!filePath || typeof filePath !== 'string') {
        throw new Error('Путь к файлу не указан или имеет неверный тип');
    }

    if (!allowedBaseDir || typeof allowedBaseDir !== 'string') {
        throw new Error('Базовая директория не указана или имеет неверный тип');
    }

    // Нормализуем пути (убираем .., ., лишние слеши)
    const normalizedPath = path.normalize(filePath);
    const normalizedBaseDir = path.resolve(allowedBaseDir);

    // Получаем абсолютный путь
    const absolutePath = path.isAbsolute(normalizedPath)
        ? path.resolve(normalizedPath)
        : path.resolve(normalizedBaseDir, normalizedPath);

    // Проверяем, что нормализованный путь не содержит опасных последовательностей
    // (дополнительная проверка на случай, если path.normalize не сработал как ожидалось)
    if (normalizedPath.includes('..')) {
        throw new Error(`Небезопасный путь: обнаружена попытка выхода за пределы директории: ${filePath}`);
    }

    // Проверяем, что файл находится внутри разрешённой директории
    if (!absolutePath.startsWith(normalizedBaseDir + path.sep) && absolutePath !== normalizedBaseDir) {
        throw new Error(
            `Путь находится вне разрешённой директории. ` +
            `Файл: ${absolutePath}, Разрешённая директория: ${normalizedBaseDir}`
        );
    }

    return absolutePath;
}

/**
 * Валидировать путь к файлу для операций чтения
 * Дополнительно проверяет существование файла
 * 
 * @param filePath - Путь к файлу
 * @param allowedBaseDir - Базовая директория
 * @returns Нормализованный абсолютный путь
 * @throws Error если путь небезопасен или файл не существует
 */
export function validateFilePathForRead(filePath: string, allowedBaseDir: string): string {
    const validatedPath = validatePath(filePath, allowedBaseDir);

    if (!fs.existsSync(validatedPath)) {
        throw new Error(`Файл не найден: ${validatedPath}`);
    }

    const stats = fs.statSync(validatedPath);
    if (!stats.isFile()) {
        throw new Error(`Путь не является файлом: ${validatedPath}`);
    }

    return validatedPath;
}

/**
 * Валидировать путь к директории для операций записи
 * Создаёт директорию, если её нет
 * 
 * @param dirPath - Путь к директории
 * @param allowedBaseDir - Базовая директория
 * @returns Нормализованный абсолютный путь
 * @throws Error если путь небезопасен
 */
export function validateDirPathForWrite(dirPath: string, allowedBaseDir: string): string {
    const validatedPath = validatePath(dirPath, allowedBaseDir);

    // Создаём директорию, если её нет
    if (!fs.existsSync(validatedPath)) {
        fs.mkdirSync(validatedPath, { recursive: true });
    }

    const stats = fs.statSync(validatedPath);
    if (!stats.isDirectory()) {
        throw new Error(`Путь не является директорией: ${validatedPath}`);
    }

    return validatedPath;
}

/**
 * Безопасно получить имя файла из пути
 * Защищает от path traversal в имени файла
 * 
 * @param filePath - Путь к файлу
 * @returns Безопасное имя файла
 */
export function getSafeFileName(filePath: string): string {
    if (!filePath || typeof filePath !== 'string') {
        throw new Error('Путь к файлу не указан');
    }

    const fileName = path.basename(filePath);
    
    // Удаляем опасные символы из имени файла
    const safeFileName = fileName.replace(/[<>:"|?*\x00-\x1F]/g, '');
    
    if (!safeFileName || safeFileName.length === 0) {
        throw new Error('Имя файла не может быть пустым после очистки');
    }

    return safeFileName;
}
