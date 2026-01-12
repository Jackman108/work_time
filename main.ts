/**
 * Главный процесс Electron приложения
 * Управляет созданием окон и обработкой IPC запросов
 * Следует принципам Single Responsibility и Separation of Concerns
 * 
 * @module main
 */

import { app, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import type { AppConfig } from './types/config';
import type { IpcChannels } from './types/ipc-channels';
import { ErrorHandler } from './services/base/ErrorHandler';
import configModule from './config/app.config';
import { IPC_CHANNELS as IPC_CHANNELS_IMPORT } from './config/ipc-channels';
import type * as ProjectsService from './services/projects';
import type * as EmployeesService from './services/employees';
import type * as MaterialsService from './services/materials';
import type * as WorkLogService from './services/workLog';
import type * as MaterialLogService from './services/materialLog';
import type * as ProjectPaymentsService from './services/projectPayments';
import type * as ReportsService from './services/reports';
import type * as BackupService from './services/backup/index';

// Настройка кодировки консоли для Windows (исправление иероглифов)
if (process.platform === 'win32') {
    try {
        execSync('chcp 65001', { stdio: 'ignore' });
    } catch (e) {
        // Игнорируем ошибки chcp
    }
    process.env.CHCP = '65001';
}

// Устанавливаем переменную окружения для конфига перед загрузкой
if (app.isPackaged) {
    process.env.APP_IS_PACKAGED = 'true';
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';

    // Определяем портативную версию по имени exe файла
    const execPath = process.execPath;
    const execName = path.basename(execPath, '.exe');
    const isPortableExe = execName.includes('portable') || execName.includes('Portable');

    if (isPortableExe && !process.env.PORTABLE_EXECUTABLE_DIR) {
        process.env.PORTABLE_EXECUTABLE_DIR = path.dirname(execPath);
        console.log('[MAIN] Portable version detected. Executable directory:', process.env.PORTABLE_EXECUTABLE_DIR);
    }
}

// Загружаем конфигурацию с обработкой ошибок
const config: AppConfig = configModule;
const IPC_CHANNELS: IpcChannels = IPC_CHANNELS_IMPORT;

// Проверяем, что ErrorHandler загружен правильно
if (!ErrorHandler || typeof ErrorHandler.handle !== 'function') {
    throw new Error('ErrorHandler не загружен правильно');
}

// Импорт сервисов для работы с данными
let projectsService: typeof ProjectsService;
let employeesService: typeof EmployeesService;
let materialsService: typeof MaterialsService;
let workLogService: typeof WorkLogService;
let materialLogService: typeof MaterialLogService;
let projectPaymentsService: typeof ProjectPaymentsService;
let reportsService: typeof ReportsService;
let backupService: typeof BackupService;

/**
 * Загрузить все сервисы
 */
function loadServices(): void {
    try {
        projectsService = require('./services/projects');
        employeesService = require('./services/employees');
        materialsService = require('./services/materials');
        workLogService = require('./services/workLog');
        materialLogService = require('./services/materialLog');
        projectPaymentsService = require('./services/projectPayments');
        reportsService = require('./services/reports');
        backupService = require('./services/backup/index');
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Ошибка загрузки сервисов:', err.message);
        throw err;
    }
}

/**
 * Перезагрузить все сервисы после импорта БД
 * Очищает кеш модулей и перезагружает сервисы для получения нового соединения с БД
 */
function reloadServices(): void {
    // Убрали лог перезагрузки сервисов - это происходит слишком часто

    // Очищаем кеш всех модулей, связанных с БД
    const modulesToClear = [
        './database',
        './db',
        './db/index',
        './db/schema',
        './services/projects',
        './services/employees',
        './services/materials',
        './services/workLog',
        './services/materialLog',
        './services/projectPayments',
        './services/reports',
        './services/backup',
        './services/base/BaseService',
        './services/base/ErrorHandler',
        './services/utils/fieldMapper',
        './services/utils/queryBuilder'
    ];

    modulesToClear.forEach(modulePath => {
        try {
            const resolvedPath = require.resolve(modulePath);
            delete require.cache[resolvedPath];
        } catch (e) {
            // Игнорируем ошибки (файл может не существовать)
        }
    });

    // Оптимизированная очистка: удаляем только критичные модули БД (не все сервисы!)
    // Очистка всех модулей с 'services' слишком медленная и не нужна
    const criticalKeys = Object.keys(require.cache).filter(key => 
        (key.includes('/db/') || key.includes('\\db\\')) || 
        (key.includes('/database') || key.includes('\\database'))
    );
    criticalKeys.forEach(key => {
        try {
            delete require.cache[key];
        } catch (e) {
            // Игнорируем ошибки
        }
    });

    // Переоткрываем соединения с БД перед перезагрузкой сервисов
    try {
        const dbModule = require('./db');
        if (dbModule.reconnectDatabase) {
            dbModule.reconnectDatabase();
        }
        if (dbModule.setForceReconnect) {
            dbModule.setForceReconnect();
        }
    } catch (e) {
        // Игнорируем
    }

    // Перезагружаем сервисы ПОСЛЕ переоткрытия соединений (синхронно)
    // Это гарантирует, что сервисы получат уже открытые соединения с восстановленной БД
    loadServices();

    // Убрали лог успешной перезагрузки - это происходит слишком часто
}

// Первоначальная загрузка сервисов
loadServices();

/**
 * Создать главное окно приложения
 * @returns {BrowserWindow} Созданное окно
 */
function createWindow(): BrowserWindow {
    const preloadPath = path.join(__dirname, 'preload.js');

    // В dev режиме __dirname = dist-main, dist находится в корне проекта (на уровень выше)
    // В production - dist находится рядом с dist-main
    const projectRoot = __dirname.endsWith('dist-main')
        ? path.dirname(__dirname)
        : __dirname;
    const distPath = path.join(projectRoot, 'dist', 'index.html');

    // Логирование путей только в режиме разработки
    if (config.env.isDev) {
        console.log('[MAIN] __dirname:', __dirname);
        console.log('[MAIN] app.isPackaged:', app.isPackaged);
        console.log('[MAIN] preloadPath:', preloadPath);
        console.log('[MAIN] distPath:', distPath);
    }

    // Проверяем существование файлов только в production
    if (!config.env.isDev) {
        if (!fs.existsSync(preloadPath)) {
            console.error('[MAIN] ОШИБКА: preload.js не найден по пути:', preloadPath);
        }
        if (!fs.existsSync(distPath)) {
            console.error('[MAIN] ОШИБКА: dist/index.html не найден по пути:', distPath);
        }
    }

    const win = new BrowserWindow({
        width: config.electron.window.width,
        height: config.electron.window.height,
        minWidth: config.electron.window.minWidth,
        minHeight: config.electron.window.minHeight,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath,
            sandbox: false, // better-sqlite3 требует sandbox: false
            webSecurity: true
        }
    });

    // Открываем DevTools только в режиме разработки
    if (config.env.isDev) {
        win.webContents.openDevTools();
    }

    // Обработка ошибок загрузки
    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        console.error('[MAIN] Ошибка загрузки:', errorCode, errorDescription, validatedURL);
    });

    // Загрузка приложения в зависимости от режима
    if (config.env.isDev) {
        console.log('[MAIN] Загрузка из dev server:', config.electron.devServerUrl);
        win.loadURL(config.electron.devServerUrl);
        win.webContents.on('console-message', (_event, level, message) => {
            console.log(`[Renderer ${level}]`, message);
        });
    } else {
        win.loadFile(distPath).catch((error) => {
            console.error('[MAIN] Ошибка загрузки файла:', error);
        });
    }

    // Логирование ошибок рендерера
    win.webContents.on('render-process-gone', (_event, details) => {
        console.error('[MAIN] Render process gone:', details);
    });

    return win;
}

/**
 * Тип для IPC обработчика
 */
type IpcHandler<T extends any[] = any[], R = any> =
    | ((...args: T) => Promise<R> | R)
    | ((event: IpcMainInvokeEvent, ...args: T) => Promise<R> | R);

/**
 * Обёртка для IPC обработчиков с автоматической обработкой ошибок
 * @param channel - Канал IPC
 * @param handler - Функция-обработчик (может принимать event как первый параметр)
 */
function registerIpcHandler<T extends any[] = any[], R = any>(
    channel: string,
    handler: IpcHandler<T, R>
): void {
    ipcMain.handle(channel, async (event, ...args: any[]) => {
        try {
            const handlerStr = handler.toString();
            const needsEvent = handlerStr.includes('(event') || handlerStr.includes('( event');

            let result: R;
            if (needsEvent) {
                result = await (handler as (event: IpcMainInvokeEvent, ...args: any[]) => Promise<R> | R)(event, ...args);
            } else {
                result = await (handler as (...args: any[]) => Promise<R> | R)(...args);
            }
            return ErrorHandler.success(result);
        } catch (error) {
            return ErrorHandler.handle(error, channel);
        }
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ==========

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Делаем функцию reloadServices доступной глобально для использования в backup.ts
declare global {
    // eslint-disable-next-line no-var
    var reloadServices: () => void;
}

(global as any).reloadServices = reloadServices;

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Обработка необработанных исключений
process.on('uncaughtException', (error: Error) => {
    console.error('[MAIN] Uncaught exception:', error.message);
});

process.on('unhandledRejection', (reason: unknown) => {
    console.error('[MAIN] Unhandled rejection:', reason);
});

// ========== IPC ОБРАБОТЧИКИ ==========

// ---------- Проекты (строительные объекты) ----------
registerIpcHandler(IPC_CHANNELS.PROJECTS.GET_ALL, () => projectsService.getAllProjects());
registerIpcHandler(IPC_CHANNELS.PROJECTS.GET_BY_ID, (id: number) => projectsService.getProjectById(id));
registerIpcHandler(IPC_CHANNELS.PROJECTS.CREATE, (data: any) => projectsService.createProject(data));
registerIpcHandler(IPC_CHANNELS.PROJECTS.UPDATE, (id: number, data: any) => projectsService.updateProject(id, data));
registerIpcHandler(IPC_CHANNELS.PROJECTS.DELETE, (id: number) => projectsService.deleteProject(id));
registerIpcHandler(IPC_CHANNELS.PROJECTS.GET_STATS, (projectId: number) => projectsService.getProjectStats(projectId));

// ---------- Сотрудники ----------
registerIpcHandler(IPC_CHANNELS.EMPLOYEES.GET_ALL, () => employeesService.getAllEmployees());
registerIpcHandler(IPC_CHANNELS.EMPLOYEES.GET_BY_ID, (id: number) => employeesService.getEmployeeById(id));
registerIpcHandler(IPC_CHANNELS.EMPLOYEES.CREATE, (data: any) => employeesService.createEmployee(data));
registerIpcHandler(IPC_CHANNELS.EMPLOYEES.UPDATE, (id: number, data: any) => employeesService.updateEmployee(id, data));
registerIpcHandler(IPC_CHANNELS.EMPLOYEES.DELETE, (id: number) => employeesService.deleteEmployee(id));
registerIpcHandler(
    IPC_CHANNELS.EMPLOYEES.GET_STATS,
    (employeeId: number, dateFrom: string | null, dateTo: string | null) =>
        employeesService.getEmployeeStats(employeeId, dateFrom, dateTo)
);

// ---------- Материалы ----------
registerIpcHandler(IPC_CHANNELS.MATERIALS.GET_ALL, () => materialsService.getAllMaterials());
registerIpcHandler(IPC_CHANNELS.MATERIALS.GET_BY_ID, (id: number) => materialsService.getMaterialById(id));
registerIpcHandler(IPC_CHANNELS.MATERIALS.CREATE, (data: any) => materialsService.createMaterial(data));
registerIpcHandler(IPC_CHANNELS.MATERIALS.UPDATE, (id: number, data: any) => materialsService.updateMaterial(id, data));
registerIpcHandler(IPC_CHANNELS.MATERIALS.DELETE, (id: number) => materialsService.deleteMaterial(id));
registerIpcHandler(IPC_CHANNELS.MATERIALS.GET_STATS, (materialId: number) => materialsService.getMaterialStats(materialId));

// ---------- Учёт рабочего времени ----------
registerIpcHandler(IPC_CHANNELS.WORK_LOG.GET_ALL, (filters: any) => workLogService.getAllWorkLogs(filters));
registerIpcHandler(IPC_CHANNELS.WORK_LOG.CREATE, (data: any) => workLogService.createWorkLog(data));
registerIpcHandler(IPC_CHANNELS.WORK_LOG.UPDATE, (id: number, data: any) => workLogService.updateWorkLog(id, data));
registerIpcHandler(IPC_CHANNELS.WORK_LOG.DELETE, (id: number) => workLogService.deleteWorkLog(id));

// ---------- Учёт списания материалов ----------
registerIpcHandler(IPC_CHANNELS.MATERIAL_LOG.GET_ALL, (filters: any) => materialLogService.getAllMaterialLogs(filters));
registerIpcHandler(IPC_CHANNELS.MATERIAL_LOG.CREATE, (data: any) => materialLogService.createMaterialLog(data));
registerIpcHandler(IPC_CHANNELS.MATERIAL_LOG.UPDATE, (id: number, data: any) => materialLogService.updateMaterialLog(id, data));
registerIpcHandler(IPC_CHANNELS.MATERIAL_LOG.DELETE, (id: number) => materialLogService.deleteMaterialLog(id));

// ---------- Поступления денег на проекты ----------
registerIpcHandler(IPC_CHANNELS.PROJECT_PAYMENTS.GET_ALL, (filters: any) => projectPaymentsService.getAllProjectPayments(filters));
registerIpcHandler(IPC_CHANNELS.PROJECT_PAYMENTS.CREATE, (data: any) => projectPaymentsService.createProjectPayment(data));
registerIpcHandler(IPC_CHANNELS.PROJECT_PAYMENTS.UPDATE, (id: number, data: any) => projectPaymentsService.updateProjectPayment(id, data));
registerIpcHandler(IPC_CHANNELS.PROJECT_PAYMENTS.DELETE, (id: number) => projectPaymentsService.deleteProjectPayment(id));
registerIpcHandler(
    IPC_CHANNELS.PROJECT_PAYMENTS.GET_TOTAL_BY_PROJECT,
    (projectId: number) => projectPaymentsService.getTotalPaymentsByProject(projectId)
);

// ---------- Отчёты и аналитика ----------
registerIpcHandler(IPC_CHANNELS.REPORTS.GET_ALL_PROJECTS, () => reportsService.getAllProjectsReport());
registerIpcHandler(
    IPC_CHANNELS.REPORTS.GET_ALL_EMPLOYEES,
    (dateFrom: string | null, dateTo: string | null) => reportsService.getAllEmployeesReport(dateFrom, dateTo)
);
registerIpcHandler(IPC_CHANNELS.REPORTS.GET_ALL_MATERIALS, () => reportsService.getAllMaterialsReport());
registerIpcHandler(IPC_CHANNELS.REPORTS.GET_OVERALL_STATS, () => reportsService.getOverallStats());

// ---------- Резервное копирование и восстановление БД ----------
registerIpcHandler(IPC_CHANNELS.BACKUP.EXPORT_TO_FILE, (savePath: string) => backupService.exportDatabaseToFile(savePath));
registerIpcHandler(IPC_CHANNELS.BACKUP.IMPORT_FROM_FILE, (filePath: string) => backupService.importDatabaseFromFile(filePath));
registerIpcHandler(IPC_CHANNELS.BACKUP.GET_BACKUP_LIST, () => backupService.getBackupList());
registerIpcHandler(IPC_CHANNELS.BACKUP.DELETE_BACKUP, (filePath: string) => backupService.deleteBackup(filePath));
registerIpcHandler(IPC_CHANNELS.BACKUP.GET_EXE_DIRECTORY, () => backupService.getExeDirectory());
registerIpcHandler(IPC_CHANNELS.BACKUP.GET_CURRENT_DATABASE_INFO, () => backupService.getCurrentDatabaseInfo());

// ---------- Диалоги выбора файлов ----------
registerIpcHandler(IPC_CHANNELS.DIALOG.SHOW_OPEN_DIALOG, async (event: IpcMainInvokeEvent, options?: Electron.OpenDialogOptions) => {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getAllWindows()[0];
    const result = await dialog.showOpenDialog(win, options || {
        properties: ['openFile'],
        filters: [
            { name: 'База данных', extensions: ['db'] },
            { name: 'Все файлы', extensions: ['*'] }
        ]
    });
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return null;
    }
    return {
        canceled: false,
        filePaths: result.filePaths
    };
});

registerIpcHandler(IPC_CHANNELS.DIALOG.SHOW_SAVE_DIALOG, async (event: IpcMainInvokeEvent, options?: Electron.SaveDialogOptions) => {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getAllWindows()[0];
    const result = await dialog.showSaveDialog(win, options || {
        filters: [
            { name: 'База данных', extensions: ['db'] },
            { name: 'Все файлы', extensions: ['*'] }
        ],
        defaultPath: 'app_backup.db'
    });
    return result.canceled ? null : result.filePath;
});

