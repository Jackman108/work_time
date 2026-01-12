/**
 * Утилиты для работы с путями приложения
 * Общие функции для определения путей в разных режимах (dev, packaged, portable)
 * @module services/utils/pathUtils
 */

import * as path from 'path';
import { app } from 'electron';

/**
 * Проверить, запущено ли приложение в portable режиме
 */
export function isPortable(): boolean {
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
        return true;
    }
    if (process.execPath) {
        const execName = path.basename(process.execPath, '.exe');
        return execName.includes('portable') || execName.includes('Portable');
    }
    return false;
}

/**
 * Получить корневую директорию проекта
 * Обрабатывает случаи с dist-main в пути
 */
export function getProjectRoot(currentDir: string = __dirname): string {
    if (currentDir.endsWith('dist-main')) {
        return path.dirname(currentDir);
    }
    if (currentDir.includes('dist-main')) {
        const distMainIndex = currentDir.indexOf('dist-main');
        const distMainPath = currentDir.substring(0, distMainIndex + 'dist-main'.length);
        return path.dirname(distMainPath);
    }
    // Если не содержит dist-main, идем на два уровня выше от текущей директории
    return path.join(currentDir, '..', '..');
}

/**
 * Получить директорию базы данных
 */
export function getDatabaseDirectory(): string {
    if (isPortable()) {
        const exeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
        return path.join(exeDir, 'db');
    }

    if (app && app.isPackaged) {
        return path.join(path.dirname(process.execPath), 'db');
    }

    const projectRoot = getProjectRoot();
    return path.join(projectRoot, 'db');
}
