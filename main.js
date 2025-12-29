// Точка входа для Electron. Создает главное окно и конфигурирует приложение
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Импорт сервисов для работы с данными
const projectsService = require('./services/projects');
const employeesService = require('./services/employees');
const materialsService = require('./services/materials');
const workLogService = require('./services/workLog');
const projectPaymentsService = require('./services/projectPayments');
const reportsService = require('./services/reports');

// Определяем режим разработки
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Логирование только в режиме разработки
if (isDev) {
  console.log('=== Electron запущен (режим разработки) ===');
}

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools(); // Автоматически открываем DevTools в dev-режиме
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
  
  // Логирование из renderer process только в режиме разработки
  if (isDev) {
    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`[Renderer ${level}]`, message);
    });
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// ========== IPC ОБРАБОТЧИКИ ==========
// Все обработчики организованы по модулям для удобства поддержки

// ---------- Проекты (строительные объекты) ----------
ipcMain.handle('projects:getAll', () => projectsService.getAllProjects());
ipcMain.handle('projects:getById', (event, id) => projectsService.getProjectById(id));
ipcMain.handle('projects:create', (event, data) => projectsService.createProject(data));
ipcMain.handle('projects:update', (event, id, data) => projectsService.updateProject(id, data));
ipcMain.handle('projects:delete', (event, id) => projectsService.deleteProject(id));
ipcMain.handle('projects:getStats', (event, projectId) => projectsService.getProjectStats(projectId));

// ---------- Сотрудники ----------
ipcMain.handle('employees:getAll', () => employeesService.getAllEmployees());
ipcMain.handle('employees:getById', (event, id) => employeesService.getEmployeeById(id));
ipcMain.handle('employees:create', (event, data) => employeesService.createEmployee(data));
ipcMain.handle('employees:update', (event, id, data) => employeesService.updateEmployee(id, data));
ipcMain.handle('employees:delete', (event, id) => employeesService.deleteEmployee(id));
ipcMain.handle('employees:getStats', (event, employeeId, dateFrom, dateTo) => 
  employeesService.getEmployeeStats(employeeId, dateFrom, dateTo));

// ---------- Материалы ----------
ipcMain.handle('materials:getAll', () => materialsService.getAllMaterials());
ipcMain.handle('materials:getById', (event, id) => materialsService.getMaterialById(id));
ipcMain.handle('materials:create', (event, data) => materialsService.createMaterial(data));
ipcMain.handle('materials:update', (event, id, data) => materialsService.updateMaterial(id, data));
ipcMain.handle('materials:delete', (event, id) => materialsService.deleteMaterial(id));
ipcMain.handle('materials:getStats', (event, materialId) => materialsService.getMaterialStats(materialId));

// ---------- Учёт рабочего времени ----------
ipcMain.handle('workLog:getAll', (event, filters) => workLogService.getAllWorkLogs(filters));
ipcMain.handle('workLog:create', (event, data) => workLogService.createWorkLog(data));
ipcMain.handle('workLog:update', (event, id, data) => workLogService.updateWorkLog(id, data));
ipcMain.handle('workLog:delete', (event, id) => workLogService.deleteWorkLog(id));

// ---------- Поступления денег на проекты ----------
ipcMain.handle('projectPayments:getAll', (event, filters) => projectPaymentsService.getAllProjectPayments(filters));
ipcMain.handle('projectPayments:create', (event, data) => projectPaymentsService.createProjectPayment(data));
ipcMain.handle('projectPayments:update', (event, id, data) => projectPaymentsService.updateProjectPayment(id, data));
ipcMain.handle('projectPayments:delete', (event, id) => projectPaymentsService.deleteProjectPayment(id));
ipcMain.handle('projectPayments:getTotalByProject', (event, projectId) => 
  projectPaymentsService.getTotalPaymentsByProject(projectId));

// ---------- Отчёты и аналитика ----------
ipcMain.handle('reports:getAllProjects', () => reportsService.getAllProjectsReport());
ipcMain.handle('reports:getAllEmployees', (event, dateFrom, dateTo) => 
  reportsService.getAllEmployeesReport(dateFrom, dateTo));
ipcMain.handle('reports:getAllMaterials', () => reportsService.getAllMaterialsReport());
ipcMain.handle('reports:getOverallStats', () => reportsService.getOverallStats());

