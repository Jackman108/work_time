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
import type { AppConfig } from 'types/config';
import type { IpcChannels } from 'types/ipc-channels';
import { ErrorHandler } from '@services/base/ErrorHandler';
import { InputValidator, ValidationSchemas } from '@services/validation';
import configModule from '@config/app.config';
import { IPC_CHANNELS as IPC_CHANNELS_IMPORT } from '@config/ipc-channels';
import type * as ProjectsService from '@services/legacy/projects';
import type * as EmployeesService from '@services/legacy/employees';
import type * as MaterialsService from '@services/legacy/materials';
import type * as WorkLogService from '@services/legacy/workLog';
import type * as MaterialLogService from '@services/legacy/materialLog';
import type * as ProjectPaymentsService from '@services/legacy/projectPayments';
import type * as ReportsService from '@services/legacy/reports';
import type * as BackupService from '@services/backup/index';

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
async function loadServices(): Promise<void> {
    try {
        projectsService = await import('@services/legacy/projects');
        employeesService = await import('@services/legacy/employees');
        materialsService = await import('@services/legacy/materials');
        workLogService = await import('@services/legacy/workLog');
        materialLogService = await import('@services/legacy/materialLog');
        projectPaymentsService = await import('@services/legacy/projectPayments');
        reportsService = await import('@services/legacy/reports');
        backupService = await import('@services/backup/index');
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error loading services:', err.message);
        throw err;
    }
}

/**
 * Перезагрузить все сервисы после импорта БД
 * Очищает кеш модулей и перезагружает сервисы для получения нового соединения с БД
 * Оптимизировано: использует централизованную утилиту для очистки кеша
 */
async function reloadServices(): Promise<void> {
    // Импортируем утилиту для управления кешем модулей
    const { clearDatabaseModuleCache } = await import('@services/utils/moduleCache');

    // Очищаем только критичные модули БД (быстро и эффективно)
    // Сервисы не очищаем - они получат новое соединение через Proxy в db/index.ts
    clearDatabaseModuleCache(false);

    // Переоткрываем соединения с БД перед перезагрузкой сервисов
    try {
        const dbModule = await import('db');
        if (dbModule.reconnectDatabase) {
            dbModule.reconnectDatabase();
        }
        if (dbModule.setForceReconnect) {
            dbModule.setForceReconnect();
        }
    } catch (e) {
        // Игнорируем ошибки
    }

    // Перезагружаем сервисы ПОСЛЕ переоткрытия соединений
    // Это гарантирует, что сервисы получат уже открытые соединения с восстановленной БД
    await loadServices();
}

// Первоначальная загрузка сервисов
loadServices().catch(err => {
    console.error('Error loading services on startup:', err);
});

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
            console.error('[MAIN] ERROR: preload.js not found at path:', preloadPath);
        }
        if (!fs.existsSync(distPath)) {
            console.error('[MAIN] ERROR: dist/index.html not found at path:', distPath);
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

    // Проверяем наличие собранных файлов - если они есть, используем их даже в dev режиме
    const hasBuiltFiles = fs.existsSync(distPath);

    // Открываем DevTools только в режиме разработки и только если нет собранных файлов
    if (config.env.isDev && !hasBuiltFiles) {
        win.webContents.openDevTools();
    }

    // Обработка ошибок загрузки
    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        console.error('[MAIN] Load error:', errorCode, errorDescription, validatedURL);
    });

    // Загрузка приложения в зависимости от режима

    if (config.env.isDev && !hasBuiltFiles) {
        // Dev режим и нет собранных файлов - используем dev server
        console.log('[MAIN] Loading from dev server:', config.electron.devServerUrl);
        win.loadURL(config.electron.devServerUrl);
        win.webContents.on('console-message', (_event, level, message) => {
            console.log(`[Renderer ${level}]`, message);
        });
    } else {
        // Production режим или есть собранные файлы - используем их
        if (hasBuiltFiles) {
            console.log('[MAIN] Loading from built files:', distPath);
        } else {
            console.log('[MAIN] Production mode, loading from:', distPath);
        }
        win.loadFile(distPath).catch((error) => {
            console.error('[MAIN] Error loading file:', error);
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
 * Обработчик может принимать event как первый параметр или не принимать его
 */
type IpcHandler<T extends any[] = any[], R = any> =
    | ((...args: T) => Promise<R> | R)
    | ((event: IpcMainInvokeEvent, ...args: T) => Promise<R> | R);

/**
 * Обёртка для IPC обработчиков с автоматической обработкой ошибок и валидацией
 * 
 * УЛУЧШЕНИЕ: Использует проверку количества параметров вместо toString() для определения,
 * нужен ли event. Это более надёжно и работает даже при минификации кода.
 * 
 * @param channel - Канал IPC
 * @param handler - Функция-обработчик (может принимать event как первый параметр)
 * @param validator - Опциональная функция валидации входных данных
 * @param needsEvent - Явно указать, нужен ли event (если не указано, определяется автоматически)
 */
function registerIpcHandler<T extends any[] = any[], R = any>(
    channel: string,
    handler: IpcHandler<T, R>,
    validator?: (args: any[]) => { isValid: boolean; errors?: Record<string, string> },
    needsEvent?: boolean
): void {
    ipcMain.handle(channel, async (event, ...args: any[]) => {
        try {
            // Валидация входных данных, если предоставлена
            if (validator) {
                const validation = validator(args);
                if (!validation.isValid) {
                    const errorMessage = validation.errors
                        ? Object.values(validation.errors).join(', ')
                        : 'Невалидные входные данные';
                    throw new Error(errorMessage);
                }
            }

            // Определяем, нужен ли event как первый параметр
            // УЛУЧШЕНИЕ: Используем явный флаг needsEvent вместо toString()
            // Это более надёжно и работает даже при минификации/обфускации кода
            const shouldPassEvent = needsEvent ?? false;

            let result: R;
            // Вызываем handler с event или без, в зависимости от флага needsEvent
            if (shouldPassEvent) {
                result = await (handler as (event: IpcMainInvokeEvent, ...args: any[]) => Promise<R> | R)(event, ...args);
            } else {
                result = await (handler as (...args: any[]) => Promise<R> | R)(...args);
            }

            return ErrorHandler.success(result, channel);
        } catch (error) {
            return ErrorHandler.handle(error, channel, { args: args.length > 0 ? 'present' : 'empty' });
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
    var reloadServices: () => Promise<void>;
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
registerIpcHandler(
    IPC_CHANNELS.PROJECTS.GET_BY_ID,
    (id: number) => projectsService.getProjectById(InputValidator.validateId(id, 'id')),
    (args) => {
        try {
            InputValidator.validateId(args[0], 'id');
            return { isValid: true };
        } catch (error) {
            return { isValid: false, errors: { id: (error as Error).message } };
        }
    }
);
registerIpcHandler(
    IPC_CHANNELS.PROJECTS.CREATE,
    (data: any) => {
        const validation = InputValidator.validate(data, ValidationSchemas.project);
        if (!validation.isValid) {
            throw new Error(Object.values(validation.errors).join(', '));
        }
        return projectsService.createProject(data);
    }
);
registerIpcHandler(
    IPC_CHANNELS.PROJECTS.UPDATE,
    (id: number, data: any) => {
        const validatedId = InputValidator.validateId(id, 'id');
        const validation = InputValidator.validate(data, ValidationSchemas.project);
        if (!validation.isValid) {
            throw new Error(Object.values(validation.errors).join(', '));
        }
        return projectsService.updateProject(validatedId, data);
    }
);
registerIpcHandler(
    IPC_CHANNELS.PROJECTS.DELETE,
    (id: number) => projectsService.deleteProject(InputValidator.validateId(id, 'id')),
    (args) => {
        try {
            InputValidator.validateId(args[0], 'id');
            return { isValid: true };
        } catch (error) {
            return { isValid: false, errors: { id: (error as Error).message } };
        }
    }
);
registerIpcHandler(
    IPC_CHANNELS.PROJECTS.GET_STATS,
    (projectId: number) => projectsService.getProjectStats(InputValidator.validateId(projectId, 'projectId')),
    (args) => {
        try {
            InputValidator.validateId(args[0], 'projectId');
            return { isValid: true };
        } catch (error) {
            return { isValid: false, errors: { projectId: (error as Error).message } };
        }
    }
);

// ---------- Сотрудники ----------
registerIpcHandler(IPC_CHANNELS.EMPLOYEES.GET_ALL, () => employeesService.getAllEmployees());
registerIpcHandler(
    IPC_CHANNELS.EMPLOYEES.GET_BY_ID,
    (id: number) => employeesService.getEmployeeById(InputValidator.validateId(id, 'id')),
    (args) => {
        try {
            InputValidator.validateId(args[0], 'id');
            return { isValid: true };
        } catch (error) {
            return { isValid: false, errors: { id: (error as Error).message } };
        }
    }
);
registerIpcHandler(
    IPC_CHANNELS.EMPLOYEES.CREATE,
    (data: any) => {
        const validation = InputValidator.validate(data, ValidationSchemas.employee);
        if (!validation.isValid) {
            throw new Error(Object.values(validation.errors).join(', '));
        }
        return employeesService.createEmployee(data);
    }
);
registerIpcHandler(
    IPC_CHANNELS.EMPLOYEES.UPDATE,
    (id: number, data: any) => {
        const validatedId = InputValidator.validateId(id, 'id');
        const validation = InputValidator.validate(data, ValidationSchemas.employee);
        if (!validation.isValid) {
            throw new Error(Object.values(validation.errors).join(', '));
        }
        return employeesService.updateEmployee(validatedId, data);
    }
);
registerIpcHandler(
    IPC_CHANNELS.EMPLOYEES.DELETE,
    (id: number) => employeesService.deleteEmployee(InputValidator.validateId(id, 'id')),
    (args) => {
        try {
            InputValidator.validateId(args[0], 'id');
            return { isValid: true };
        } catch (error) {
            return { isValid: false, errors: { id: (error as Error).message } };
        }
    }
);
registerIpcHandler(
    IPC_CHANNELS.EMPLOYEES.GET_STATS,
    (employeeId: number, dateFrom: string | null, dateTo: string | null) =>
        employeesService.getEmployeeStats(
            InputValidator.validateId(employeeId, 'employeeId'),
            dateFrom,
            dateTo
        ),
    (args) => {
        try {
            InputValidator.validateId(args[0], 'employeeId');
            return { isValid: true };
        } catch (error) {
            return { isValid: false, errors: { employeeId: (error as Error).message } };
        }
    }
);

// ---------- Материалы ----------
registerIpcHandler(IPC_CHANNELS.MATERIALS.GET_ALL, () => materialsService.getAllMaterials());
registerIpcHandler(
    IPC_CHANNELS.MATERIALS.GET_BY_ID,
    (id: number) => materialsService.getMaterialById(InputValidator.validateId(id, 'id')),
    (args) => {
        try {
            InputValidator.validateId(args[0], 'id');
            return { isValid: true };
        } catch (error) {
            return { isValid: false, errors: { id: (error as Error).message } };
        }
    }
);
registerIpcHandler(
    IPC_CHANNELS.MATERIALS.CREATE,
    (data: any) => {
        const validation = InputValidator.validate(data, ValidationSchemas.material);
        if (!validation.isValid) {
            throw new Error(Object.values(validation.errors).join(', '));
        }
        return materialsService.createMaterial(data);
    }
);
registerIpcHandler(
    IPC_CHANNELS.MATERIALS.UPDATE,
    (id: number, data: any) => {
        const validatedId = InputValidator.validateId(id, 'id');
        const validation = InputValidator.validate(data, ValidationSchemas.material);
        if (!validation.isValid) {
            throw new Error(Object.values(validation.errors).join(', '));
        }
        return materialsService.updateMaterial(validatedId, data);
    }
);
registerIpcHandler(
    IPC_CHANNELS.MATERIALS.DELETE,
    (id: number) => materialsService.deleteMaterial(InputValidator.validateId(id, 'id')),
    (args) => {
        try {
            InputValidator.validateId(args[0], 'id');
            return { isValid: true };
        } catch (error) {
            return { isValid: false, errors: { id: (error as Error).message } };
        }
    }
);
registerIpcHandler(
    IPC_CHANNELS.MATERIALS.GET_STATS,
    (materialId: number) => materialsService.getMaterialStats(InputValidator.validateId(materialId, 'materialId')),
    (args) => {
        try {
            InputValidator.validateId(args[0], 'materialId');
            return { isValid: true };
        } catch (error) {
            return { isValid: false, errors: { materialId: (error as Error).message } };
        }
    }
);

// ---------- Учёт рабочего времени ----------
registerIpcHandler(IPC_CHANNELS.WORK_LOG.GET_ALL, (filters: any) => workLogService.getAllWorkLogs(filters));
registerIpcHandler(
    IPC_CHANNELS.WORK_LOG.CREATE,
    (data: any) => {
        const validation = InputValidator.validate(data, ValidationSchemas.workLog);
        if (!validation.isValid) {
            throw new Error(Object.values(validation.errors).join(', '));
        }
        return workLogService.createWorkLog(data);
    }
);
registerIpcHandler(
    IPC_CHANNELS.WORK_LOG.UPDATE,
    (id: number, data: any) => {
        const validatedId = InputValidator.validateId(id, 'id');
        const validation = InputValidator.validate(data, ValidationSchemas.workLog);
        if (!validation.isValid) {
            throw new Error(Object.values(validation.errors).join(', '));
        }
        return workLogService.updateWorkLog(validatedId, data);
    }
);
registerIpcHandler(
    IPC_CHANNELS.WORK_LOG.DELETE,
    (id: number) => workLogService.deleteWorkLog(InputValidator.validateId(id, 'id')),
    (args) => {
        try {
            InputValidator.validateId(args[0], 'id');
            return { isValid: true };
        } catch (error) {
            return { isValid: false, errors: { id: (error as Error).message } };
        }
    }
);

// ---------- Учёт списания материалов ----------
registerIpcHandler(IPC_CHANNELS.MATERIAL_LOG.GET_ALL, (filters: any) => materialLogService.getAllMaterialLogs(filters));
registerIpcHandler(
    IPC_CHANNELS.MATERIAL_LOG.CREATE,
    (data: any) => {
        const validation = InputValidator.validate(data, ValidationSchemas.materialLog);
        if (!validation.isValid) {
            throw new Error(Object.values(validation.errors).join(', '));
        }
        return materialLogService.createMaterialLog(data);
    }
);
registerIpcHandler(
    IPC_CHANNELS.MATERIAL_LOG.UPDATE,
    (id: number, data: any) => {
        const validatedId = InputValidator.validateId(id, 'id');
        const validation = InputValidator.validate(data, ValidationSchemas.materialLog);
        if (!validation.isValid) {
            throw new Error(Object.values(validation.errors).join(', '));
        }
        return materialLogService.updateMaterialLog(validatedId, data);
    }
);
registerIpcHandler(
    IPC_CHANNELS.MATERIAL_LOG.DELETE,
    (id: number) => materialLogService.deleteMaterialLog(InputValidator.validateId(id, 'id')),
    (args) => {
        try {
            InputValidator.validateId(args[0], 'id');
            return { isValid: true };
        } catch (error) {
            return { isValid: false, errors: { id: (error as Error).message } };
        }
    }
);

// ---------- Поступления денег на проекты ----------
registerIpcHandler(IPC_CHANNELS.PROJECT_PAYMENTS.GET_ALL, (filters: any) => projectPaymentsService.getAllProjectPayments(filters));
registerIpcHandler(
    IPC_CHANNELS.PROJECT_PAYMENTS.CREATE,
    (data: any) => {
        const validation = InputValidator.validate(data, ValidationSchemas.projectPayment);
        if (!validation.isValid) {
            throw new Error(Object.values(validation.errors).join(', '));
        }
        return projectPaymentsService.createProjectPayment(data);
    }
);
registerIpcHandler(
    IPC_CHANNELS.PROJECT_PAYMENTS.UPDATE,
    (id: number, data: any) => {
        const validatedId = InputValidator.validateId(id, 'id');
        const validation = InputValidator.validate(data, ValidationSchemas.projectPayment);
        if (!validation.isValid) {
            throw new Error(Object.values(validation.errors).join(', '));
        }
        return projectPaymentsService.updateProjectPayment(validatedId, data);
    }
);
registerIpcHandler(
    IPC_CHANNELS.PROJECT_PAYMENTS.DELETE,
    (id: number) => projectPaymentsService.deleteProjectPayment(InputValidator.validateId(id, 'id')),
    (args) => {
        try {
            InputValidator.validateId(args[0], 'id');
            return { isValid: true };
        } catch (error) {
            return { isValid: false, errors: { id: (error as Error).message } };
        }
    }
);
registerIpcHandler(
    IPC_CHANNELS.PROJECT_PAYMENTS.GET_TOTAL_BY_PROJECT,
    (projectId: number) => projectPaymentsService.getTotalPaymentsByProject(InputValidator.validateId(projectId, 'projectId')),
    (args) => {
        try {
            InputValidator.validateId(args[0], 'projectId');
            return { isValid: true };
        } catch (error) {
            return { isValid: false, errors: { projectId: (error as Error).message } };
        }
    }
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
// УЛУЧШЕНИЕ: Явно указываем needsEvent=true для обработчиков диалогов
registerIpcHandler(
    IPC_CHANNELS.DIALOG.SHOW_OPEN_DIALOG,
    async (event: IpcMainInvokeEvent, options?: Electron.OpenDialogOptions) => {
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
    },
    undefined, // validator
    true // needsEvent - явно указываем, что нужен event
);

registerIpcHandler(
    IPC_CHANNELS.DIALOG.SHOW_SAVE_DIALOG,
    async (event: IpcMainInvokeEvent, options?: Electron.SaveDialogOptions) => {
        const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getAllWindows()[0];
        const result = await dialog.showSaveDialog(win, options || {
            filters: [
                { name: 'База данных', extensions: ['db'] },
                { name: 'Все файлы', extensions: ['*'] }
            ],
            defaultPath: 'app_backup.db'
        });
        return result.canceled ? null : result.filePath;
    },
    undefined, // validator
    true // needsEvent - явно указываем, что нужен event
);

