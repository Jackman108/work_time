/**
 * Главный процесс Electron приложения
 * Управляет созданием окон и обработкой IPC запросов
 * Следует принципам Single Responsibility и Separation of Concerns
 * 
 * @module main
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const config = require('./config/app.config');
const { ErrorHandler } = require('./services/base/ErrorHandler');
const { IPC_CHANNELS } = require('./config/ipc-channels');

// Импорт сервисов для работы с данными
const projectsService = require('./services/projects');
const employeesService = require('./services/employees');
const materialsService = require('./services/materials');
const workLogService = require('./services/workLog');
const materialLogService = require('./services/materialLog');
const projectPaymentsService = require('./services/projectPayments');
const reportsService = require('./services/reports');

/**
 * Создать главное окно приложения
 * @returns {BrowserWindow} Созданное окно
 */
function createWindow() {
  const win = new BrowserWindow({
    width: config.electron.window.width,
    height: config.electron.window.height,
    minWidth: config.electron.window.minWidth,
    minHeight: config.electron.window.minHeight,
    webPreferences: {
      nodeIntegration: false, // Безопасность: отключаем прямой доступ к Node.js
      contextIsolation: true, // Безопасность: изолируем контекст
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Загрузка приложения в зависимости от режима
  if (config.env.isDev) {
    win.loadURL(config.electron.devServerUrl);
    if (config.electron.devTools) {
      win.webContents.openDevTools();
    }
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Логирование из renderer process только в режиме разработки
  if (config.env.isDev) {
    win.webContents.on('console-message', (event, level, message) => {
      console.log(`[Renderer ${level}]`, message);
    });
  }

  return win;
}

/**
 * Обёртка для IPC обработчиков с автоматической обработкой ошибок
 * @param {string} channel - Канал IPC
 * @param {Function} handler - Функция-обработчик
 */
function registerIpcHandler(channel, handler) {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      const result = await handler(...args);
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
    // На macOS пересоздаём окно при клике на иконку в dock
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // На macOS приложения обычно остаются активными даже когда все окна закрыты
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
  console.error('Необработанное исключение:', error);
  // В production можно добавить отправку ошибок в систему мониторинга
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанный rejection:', reason);
});

// ========== IPC ОБРАБОТЧИКИ ==========
// Все обработчики организованы по модулям для удобства поддержки
// Используют централизованную обработку ошибок

// ========== IPC ОБРАБОТЧИКИ ==========
// Все обработчики используют константы из config/ipc-channels.js
// Это обеспечивает единый источник истины и предотвращает ошибки

// ---------- Проекты (строительные объекты) ----------
registerIpcHandler(IPC_CHANNELS.PROJECTS.GET_ALL, () => projectsService.getAllProjects());
registerIpcHandler(IPC_CHANNELS.PROJECTS.GET_BY_ID, (id) => projectsService.getProjectById(id));
registerIpcHandler(IPC_CHANNELS.PROJECTS.CREATE, (data) => projectsService.createProject(data));
registerIpcHandler(IPC_CHANNELS.PROJECTS.UPDATE, (id, data) => projectsService.updateProject(id, data));
registerIpcHandler(IPC_CHANNELS.PROJECTS.DELETE, (id) => projectsService.deleteProject(id));
registerIpcHandler(IPC_CHANNELS.PROJECTS.GET_STATS, (projectId) => projectsService.getProjectStats(projectId));

// ---------- Сотрудники ----------
registerIpcHandler(IPC_CHANNELS.EMPLOYEES.GET_ALL, () => employeesService.getAllEmployees());
registerIpcHandler(IPC_CHANNELS.EMPLOYEES.GET_BY_ID, (id) => employeesService.getEmployeeById(id));
registerIpcHandler(IPC_CHANNELS.EMPLOYEES.CREATE, (data) => employeesService.createEmployee(data));
registerIpcHandler(IPC_CHANNELS.EMPLOYEES.UPDATE, (id, data) => employeesService.updateEmployee(id, data));
registerIpcHandler(IPC_CHANNELS.EMPLOYEES.DELETE, (id) => employeesService.deleteEmployee(id));
registerIpcHandler(IPC_CHANNELS.EMPLOYEES.GET_STATS, (employeeId, dateFrom, dateTo) =>
  employeesService.getEmployeeStats(employeeId, dateFrom, dateTo));

// ---------- Материалы ----------
registerIpcHandler(IPC_CHANNELS.MATERIALS.GET_ALL, () => materialsService.getAllMaterials());
registerIpcHandler(IPC_CHANNELS.MATERIALS.GET_BY_ID, (id) => materialsService.getMaterialById(id));
registerIpcHandler(IPC_CHANNELS.MATERIALS.CREATE, (data) => materialsService.createMaterial(data));
registerIpcHandler(IPC_CHANNELS.MATERIALS.UPDATE, (id, data) => materialsService.updateMaterial(id, data));
registerIpcHandler(IPC_CHANNELS.MATERIALS.DELETE, (id) => materialsService.deleteMaterial(id));
registerIpcHandler(IPC_CHANNELS.MATERIALS.GET_STATS, (materialId) => materialsService.getMaterialStats(materialId));

// ---------- Учёт рабочего времени ----------
registerIpcHandler(IPC_CHANNELS.WORK_LOG.GET_ALL, (filters) => workLogService.getAllWorkLogs(filters));
registerIpcHandler(IPC_CHANNELS.WORK_LOG.CREATE, (data) => workLogService.createWorkLog(data));
registerIpcHandler(IPC_CHANNELS.WORK_LOG.UPDATE, (id, data) => workLogService.updateWorkLog(id, data));
registerIpcHandler(IPC_CHANNELS.WORK_LOG.DELETE, (id) => workLogService.deleteWorkLog(id));

// ---------- Учёт списания материалов ----------
registerIpcHandler(IPC_CHANNELS.MATERIAL_LOG.GET_ALL, (filters) => materialLogService.getAllMaterialLogs(filters));
registerIpcHandler(IPC_CHANNELS.MATERIAL_LOG.CREATE, (data) => materialLogService.createMaterialLog(data));
registerIpcHandler(IPC_CHANNELS.MATERIAL_LOG.UPDATE, (id, data) => materialLogService.updateMaterialLog(id, data));
registerIpcHandler(IPC_CHANNELS.MATERIAL_LOG.DELETE, (id) => materialLogService.deleteMaterialLog(id));

// ---------- Поступления денег на проекты ----------
registerIpcHandler(IPC_CHANNELS.PROJECT_PAYMENTS.GET_ALL, (filters) => projectPaymentsService.getAllProjectPayments(filters));
registerIpcHandler(IPC_CHANNELS.PROJECT_PAYMENTS.CREATE, (data) => projectPaymentsService.createProjectPayment(data));
registerIpcHandler(IPC_CHANNELS.PROJECT_PAYMENTS.UPDATE, (id, data) => projectPaymentsService.updateProjectPayment(id, data));
registerIpcHandler(IPC_CHANNELS.PROJECT_PAYMENTS.DELETE, (id) => projectPaymentsService.deleteProjectPayment(id));
registerIpcHandler(IPC_CHANNELS.PROJECT_PAYMENTS.GET_TOTAL_BY_PROJECT, (projectId) =>
  projectPaymentsService.getTotalPaymentsByProject(projectId));

// ---------- Отчёты и аналитика ----------
registerIpcHandler(IPC_CHANNELS.REPORTS.GET_ALL_PROJECTS, () => reportsService.getAllProjectsReport());
registerIpcHandler(IPC_CHANNELS.REPORTS.GET_ALL_EMPLOYEES, (dateFrom, dateTo) =>
  reportsService.getAllEmployeesReport(dateFrom, dateTo));
registerIpcHandler(IPC_CHANNELS.REPORTS.GET_ALL_MATERIALS, () => reportsService.getAllMaterialsReport());
registerIpcHandler(IPC_CHANNELS.REPORTS.GET_OVERALL_STATS, () => reportsService.getOverallStats());

