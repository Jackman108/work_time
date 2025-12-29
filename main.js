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

// ---------- Проекты (строительные объекты) ----------
registerIpcHandler('projects:getAll', () => projectsService.getAllProjects());
registerIpcHandler('projects:getById', (id) => projectsService.getProjectById(id));
registerIpcHandler('projects:create', (data) => projectsService.createProject(data));
registerIpcHandler('projects:update', (id, data) => projectsService.updateProject(id, data));
registerIpcHandler('projects:delete', (id) => projectsService.deleteProject(id));
registerIpcHandler('projects:getStats', (projectId) => projectsService.getProjectStats(projectId));

// ---------- Сотрудники ----------
registerIpcHandler('employees:getAll', () => employeesService.getAllEmployees());
registerIpcHandler('employees:getById', (id) => employeesService.getEmployeeById(id));
registerIpcHandler('employees:create', (data) => employeesService.createEmployee(data));
registerIpcHandler('employees:update', (id, data) => employeesService.updateEmployee(id, data));
registerIpcHandler('employees:delete', (id) => employeesService.deleteEmployee(id));
registerIpcHandler('employees:getStats', (employeeId, dateFrom, dateTo) =>
  employeesService.getEmployeeStats(employeeId, dateFrom, dateTo));

// ---------- Материалы ----------
registerIpcHandler('materials:getAll', () => materialsService.getAllMaterials());
registerIpcHandler('materials:getById', (id) => materialsService.getMaterialById(id));
registerIpcHandler('materials:create', (data) => materialsService.createMaterial(data));
registerIpcHandler('materials:update', (id, data) => materialsService.updateMaterial(id, data));
registerIpcHandler('materials:delete', (id) => materialsService.deleteMaterial(id));
registerIpcHandler('materials:getStats', (materialId) => materialsService.getMaterialStats(materialId));

// ---------- Учёт рабочего времени ----------
registerIpcHandler('workLog:getAll', (filters) => workLogService.getAllWorkLogs(filters));
registerIpcHandler('workLog:create', (data) => workLogService.createWorkLog(data));
registerIpcHandler('workLog:update', (id, data) => workLogService.updateWorkLog(id, data));
registerIpcHandler('workLog:delete', (id) => workLogService.deleteWorkLog(id));

// ---------- Учёт списания материалов ----------
registerIpcHandler('materialLog:getAll', (filters) => materialLogService.getAllMaterialLogs(filters));
registerIpcHandler('materialLog:create', (data) => materialLogService.createMaterialLog(data));
registerIpcHandler('materialLog:update', (id, data) => materialLogService.updateMaterialLog(id, data));
registerIpcHandler('materialLog:delete', (id) => materialLogService.deleteMaterialLog(id));

// ---------- Поступления денег на проекты ----------
registerIpcHandler('projectPayments:getAll', (filters) => projectPaymentsService.getAllProjectPayments(filters));
registerIpcHandler('projectPayments:create', (data) => projectPaymentsService.createProjectPayment(data));
registerIpcHandler('projectPayments:update', (id, data) => projectPaymentsService.updateProjectPayment(id, data));
registerIpcHandler('projectPayments:delete', (id) => projectPaymentsService.deleteProjectPayment(id));
registerIpcHandler('projectPayments:getTotalByProject', (projectId) =>
  projectPaymentsService.getTotalPaymentsByProject(projectId));

// ---------- Отчёты и аналитика ----------
registerIpcHandler('reports:getAllProjects', () => reportsService.getAllProjectsReport());
registerIpcHandler('reports:getAllEmployees', (dateFrom, dateTo) =>
  reportsService.getAllEmployeesReport(dateFrom, dateTo));
registerIpcHandler('reports:getAllMaterials', () => reportsService.getAllMaterialsReport());
registerIpcHandler('reports:getOverallStats', () => reportsService.getOverallStats());

