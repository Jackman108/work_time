/**
 * Утилита для проверки дубликатов файлов в папках db и dist-main
 */

import * as fs from 'fs';
import * as path from 'path';
import { calculateFileHash } from './utils';
import { getProjectRoot } from '../utils/pathUtils';

/**
 * Найти дубликаты файлов в директории
 */
async function findDuplicatesInDirectory(dirPath: string): Promise<Map<string, string[]>> {
    const hashMap = new Map<string, string[]>();

    if (!fs.existsSync(dirPath)) {
        return hashMap;
    }

    const files = fs.readdirSync(dirPath, { recursive: true });

    for (const file of files) {
        const filePath = path.join(dirPath, file as string);

        try {
            const stats = fs.statSync(filePath);
            if (stats.isFile() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
                const hash = await calculateFileHash(filePath);

                if (!hashMap.has(hash)) {
                    hashMap.set(hash, []);
                }
                hashMap.get(hash)!.push(filePath);
            }
        } catch (e) {
            // Игнорируем ошибки чтения файлов
        }
    }

    return hashMap;
}

/**
 * Проверить дубликаты в папках db и dist-main
 */
export async function checkDuplicates(): Promise<{ db: Map<string, string[]>, distMain: Map<string, string[]> }> {
    const projectRoot = getProjectRoot(__dirname);

    const dbDir = path.join(projectRoot, 'db');
    const distMainDir = path.join(projectRoot, 'dist-main');

    const dbDuplicates = await findDuplicatesInDirectory(dbDir);
    const distMainDuplicates = await findDuplicatesInDirectory(distMainDir);

    return {
        db: dbDuplicates,
        distMain: distMainDuplicates
    };
}

/**
 * Получить отчет о дубликатах
 */
export async function getDuplicatesReport(): Promise<string> {
    const { db, distMain } = await checkDuplicates();

    let report = '=== Отчет о дубликатах ===\n\n';

    // Дубликаты в db
    report += '--- Папка db ---\n';
    let dbCount = 0;
    for (const [hash, files] of db.entries()) {
        if (files.length > 1) {
            dbCount++;
            report += `\nДубликат ${dbCount} (хеш: ${hash.substring(0, 8)}...):\n`;
            files.forEach(file => {
                report += `  - ${file}\n`;
            });
        }
    }
    if (dbCount === 0) {
        report += 'Дубликатов не найдено\n';
    }

    // Дубликаты в dist-main
    report += '\n--- Папка dist-main ---\n';
    let distMainCount = 0;
    for (const [hash, files] of distMain.entries()) {
        if (files.length > 1) {
            distMainCount++;
            report += `\nДубликат ${distMainCount} (хеш: ${hash.substring(0, 8)}...):\n`;
            files.forEach(file => {
                report += `  - ${file}\n`;
            });
        }
    }
    if (distMainCount === 0) {
        report += 'Дубликатов не найдено\n';
    }

    report += `\n=== Итого: ${dbCount} групп дубликатов в db, ${distMainCount} групп дубликатов в dist-main ===\n`;

    return report;
}
