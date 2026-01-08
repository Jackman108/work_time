/**
 * Централизованный API для общения с main process через IPC
 */

import type {
  Project, Employee, Material, WorkLog, MaterialLog, ProjectPayment,
  ProjectReport, EmployeeReport, MaterialReport, OverallStats, BackupResult
} from '../types';

const IPC_CHANNELS = {
  PROJECTS: {
    GET_ALL: 'projects:getAll',
    GET_BY_ID: 'projects:getById',
    CREATE: 'projects:create',
    UPDATE: 'projects:update',
    DELETE: 'projects:delete',
    GET_STATS: 'projects:getStats'
  },
  EMPLOYEES: {
    GET_ALL: 'employees:getAll',
    GET_BY_ID: 'employees:getById',
    CREATE: 'employees:create',
    UPDATE: 'employees:update',
    DELETE: 'employees:delete',
    GET_STATS: 'employees:getStats'
  },
  MATERIALS: {
    GET_ALL: 'materials:getAll',
    GET_BY_ID: 'materials:getById',
    CREATE: 'materials:create',
    UPDATE: 'materials:update',
    DELETE: 'materials:delete',
    GET_STATS: 'materials:getStats'
  },
  WORK_LOG: {
    GET_ALL: 'workLog:getAll',
    CREATE: 'workLog:create',
    UPDATE: 'workLog:update',
    DELETE: 'workLog:delete'
  },
  MATERIAL_LOG: {
    GET_ALL: 'materialLog:getAll',
    CREATE: 'materialLog:create',
    UPDATE: 'materialLog:update',
    DELETE: 'materialLog:delete'
  },
  PROJECT_PAYMENTS: {
    GET_ALL: 'projectPayments:getAll',
    CREATE: 'projectPayments:create',
    UPDATE: 'projectPayments:update',
    DELETE: 'projectPayments:delete',
    GET_TOTAL_BY_PROJECT: 'projectPayments:getTotalByProject'
  },
  REPORTS: {
    GET_ALL_PROJECTS: 'reports:getAllProjects',
    GET_ALL_EMPLOYEES: 'reports:getAllEmployees',
    GET_ALL_MATERIALS: 'reports:getAllMaterials',
    GET_OVERALL_STATS: 'reports:getOverallStats'
  },
  BACKUP: {
    EXPORT: 'backup:export',
    EXPORT_TO_EXE_DIR: 'backup:exportToExeDir',
    IMPORT: 'backup:import',
    IMPORT_FROM_FILE: 'backup:importFromFile',
    CREATE_AUTO_BACKUP: 'backup:createAutoBackup',
    GET_BACKUP_LIST: 'backup:getBackupList',
    DELETE_BACKUP: 'backup:deleteBackup',
    GET_EXE_DIRECTORY: 'backup:getExeDirectory',
    CLEANUP_OLD_FILES: 'backup:cleanupOldFiles'
  },
  DIALOG: {
    SHOW_OPEN_DIALOG: 'dialog:showOpenDialog',
    SHOW_SAVE_DIALOG: 'dialog:showSaveDialog'
  }
} as const;

interface IpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | { message: string };
}

function handleResponse<T>(response: IpcResponse<T>): T {
  if (!response) {
    throw new Error('Пустой ответ от сервера');
  }

  if (response.success === false) {
    const error = response.error;
    let errorMessage = 'Произошла ошибка';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = error.message || String(error) || 'Произошла ошибка';
    }
    throw new Error(errorMessage);
  }

  return response.data as T;
}

async function safeInvoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  try {
    if (!channel) {
      throw new Error('Канал IPC не указан');
    }
    if (!window.electronAPI) {
      throw new Error('electronAPI не доступен');
    }
    const response = await window.electronAPI.invoke(channel, ...args);
    return handleResponse<T>(response as IpcResponse<T>);
  } catch (error) {
    const err = error as Error;
    const errorMessage = err?.message || String(error) || 'Неизвестная ошибка';
    console.error(`Ошибка при вызове ${channel}:`, errorMessage);
    throw new Error(errorMessage);
  }
}

// ============ Проекты ============

export async function getProjects(): Promise<Project[]> {
  return safeInvoke<Project[]>(IPC_CHANNELS.PROJECTS.GET_ALL);
}

export async function getProjectById(id: number): Promise<Project> {
  return safeInvoke<Project>(IPC_CHANNELS.PROJECTS.GET_BY_ID, id);
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  return safeInvoke<Project>(IPC_CHANNELS.PROJECTS.CREATE, data);
}

export async function updateProject(id: number, data: Partial<Project>): Promise<Project> {
  return safeInvoke<Project>(IPC_CHANNELS.PROJECTS.UPDATE, id, data);
}

export async function deleteProject(id: number): Promise<boolean> {
  return safeInvoke<boolean>(IPC_CHANNELS.PROJECTS.DELETE, id);
}

export async function getProjectStats(projectId: number): Promise<unknown> {
  return safeInvoke(IPC_CHANNELS.PROJECTS.GET_STATS, projectId);
}

// ============ Сотрудники ============

export async function getEmployees(): Promise<Employee[]> {
  return safeInvoke<Employee[]>(IPC_CHANNELS.EMPLOYEES.GET_ALL);
}

export async function getEmployeeById(id: number): Promise<Employee> {
  return safeInvoke<Employee>(IPC_CHANNELS.EMPLOYEES.GET_BY_ID, id);
}

export async function createEmployee(data: Partial<Employee>): Promise<Employee> {
  return safeInvoke<Employee>(IPC_CHANNELS.EMPLOYEES.CREATE, data);
}

export async function updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
  return safeInvoke<Employee>(IPC_CHANNELS.EMPLOYEES.UPDATE, id, data);
}

export async function deleteEmployee(id: number): Promise<boolean> {
  return safeInvoke<boolean>(IPC_CHANNELS.EMPLOYEES.DELETE, id);
}

export async function getEmployeeStats(employeeId: number, dateFrom?: string | null, dateTo?: string | null): Promise<unknown> {
  return safeInvoke(IPC_CHANNELS.EMPLOYEES.GET_STATS, employeeId, dateFrom, dateTo);
}

// ============ Материалы ============

export async function getMaterials(): Promise<Material[]> {
  return safeInvoke<Material[]>(IPC_CHANNELS.MATERIALS.GET_ALL);
}

export async function getMaterialById(id: number): Promise<Material> {
  return safeInvoke<Material>(IPC_CHANNELS.MATERIALS.GET_BY_ID, id);
}

export async function createMaterial(data: Partial<Material>): Promise<Material> {
  return safeInvoke<Material>(IPC_CHANNELS.MATERIALS.CREATE, data);
}

export async function updateMaterial(id: number, data: Partial<Material>): Promise<Material> {
  return safeInvoke<Material>(IPC_CHANNELS.MATERIALS.UPDATE, id, data);
}

export async function deleteMaterial(id: number): Promise<boolean> {
  return safeInvoke<boolean>(IPC_CHANNELS.MATERIALS.DELETE, id);
}

export async function getMaterialStats(materialId: number): Promise<unknown> {
  return safeInvoke(IPC_CHANNELS.MATERIALS.GET_STATS, materialId);
}

// ============ Учёт рабочего времени ============

interface WorkLogFilters {
  employee_id?: number | null;
  project_id?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export async function getWorkLogs(filters: WorkLogFilters = {}): Promise<WorkLog[]> {
  return safeInvoke<WorkLog[]>(IPC_CHANNELS.WORK_LOG.GET_ALL, filters);
}

export async function createWorkLog(data: Partial<WorkLog>): Promise<WorkLog> {
  return safeInvoke<WorkLog>(IPC_CHANNELS.WORK_LOG.CREATE, data);
}

export async function updateWorkLog(id: number, data: Partial<WorkLog>): Promise<WorkLog> {
  return safeInvoke<WorkLog>(IPC_CHANNELS.WORK_LOG.UPDATE, id, data);
}

export async function deleteWorkLog(id: number): Promise<boolean> {
  return safeInvoke<boolean>(IPC_CHANNELS.WORK_LOG.DELETE, id);
}

// ============ Учёт списания материалов ============

interface MaterialLogFilters {
  material_id?: number | null;
  project_id?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export async function getMaterialLogs(filters: MaterialLogFilters = {}): Promise<MaterialLog[]> {
  return safeInvoke<MaterialLog[]>(IPC_CHANNELS.MATERIAL_LOG.GET_ALL, filters);
}

export async function createMaterialLog(data: Partial<MaterialLog>): Promise<MaterialLog> {
  return safeInvoke<MaterialLog>(IPC_CHANNELS.MATERIAL_LOG.CREATE, data);
}

export async function updateMaterialLog(id: number, data: Partial<MaterialLog>): Promise<MaterialLog> {
  return safeInvoke<MaterialLog>(IPC_CHANNELS.MATERIAL_LOG.UPDATE, id, data);
}

export async function deleteMaterialLog(id: number): Promise<boolean> {
  return safeInvoke<boolean>(IPC_CHANNELS.MATERIAL_LOG.DELETE, id);
}

// ============ Поступления денег ============

interface PaymentFilters {
  project_id?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export async function getProjectPayments(filters: PaymentFilters = {}): Promise<ProjectPayment[]> {
  return safeInvoke<ProjectPayment[]>(IPC_CHANNELS.PROJECT_PAYMENTS.GET_ALL, filters);
}

export async function createProjectPayment(data: Partial<ProjectPayment>): Promise<ProjectPayment> {
  return safeInvoke<ProjectPayment>(IPC_CHANNELS.PROJECT_PAYMENTS.CREATE, data);
}

export async function updateProjectPayment(id: number, data: Partial<ProjectPayment>): Promise<ProjectPayment> {
  return safeInvoke<ProjectPayment>(IPC_CHANNELS.PROJECT_PAYMENTS.UPDATE, id, data);
}

export async function deleteProjectPayment(id: number): Promise<boolean> {
  return safeInvoke<boolean>(IPC_CHANNELS.PROJECT_PAYMENTS.DELETE, id);
}

export async function getTotalPaymentsByProject(projectId: number): Promise<number> {
  return safeInvoke<number>(IPC_CHANNELS.PROJECT_PAYMENTS.GET_TOTAL_BY_PROJECT, projectId);
}

// ============ Отчёты ============

export async function getAllProjectsReport(): Promise<ProjectReport[]> {
  return safeInvoke<ProjectReport[]>(IPC_CHANNELS.REPORTS.GET_ALL_PROJECTS);
}

export async function getAllEmployeesReport(dateFrom?: string | null, dateTo?: string | null): Promise<EmployeeReport[]> {
  return safeInvoke<EmployeeReport[]>(IPC_CHANNELS.REPORTS.GET_ALL_EMPLOYEES, dateFrom, dateTo);
}

export async function getAllMaterialsReport(): Promise<MaterialReport[]> {
  return safeInvoke<MaterialReport[]>(IPC_CHANNELS.REPORTS.GET_ALL_MATERIALS);
}

export async function getOverallStats(): Promise<OverallStats> {
  return safeInvoke<OverallStats>(IPC_CHANNELS.REPORTS.GET_OVERALL_STATS);
}

// ============ Резервное копирование ============

export async function exportDatabase(): Promise<BackupResult> {
  return safeInvoke<BackupResult>(IPC_CHANNELS.BACKUP.EXPORT);
}

export async function exportDatabaseToExeDir(): Promise<BackupResult> {
  return safeInvoke<BackupResult>(IPC_CHANNELS.BACKUP.EXPORT_TO_EXE_DIR);
}

export async function importDatabase(filePath?: string | null): Promise<BackupResult> {
  return safeInvoke<BackupResult>(IPC_CHANNELS.BACKUP.IMPORT, filePath || undefined);
}

export async function importDatabaseFromFile(filePath: string | null): Promise<BackupResult> {
  return safeInvoke<BackupResult>(IPC_CHANNELS.BACKUP.IMPORT_FROM_FILE, filePath);
}

export async function createAutoBackup(): Promise<BackupResult> {
  return safeInvoke<BackupResult>(IPC_CHANNELS.BACKUP.CREATE_AUTO_BACKUP);
}

interface BackupListResult {
  success: boolean;
  backups: Array<{ name: string; path: string; date: string; size: number }>;
  message?: string;
}

export async function getBackupList(): Promise<BackupListResult> {
  return safeInvoke<BackupListResult>(IPC_CHANNELS.BACKUP.GET_BACKUP_LIST);
}

export async function deleteBackup(filePath: string): Promise<BackupResult> {
  return safeInvoke<BackupResult>(IPC_CHANNELS.BACKUP.DELETE_BACKUP, filePath);
}

export async function getExeDirectory(): Promise<string> {
  return safeInvoke<string>(IPC_CHANNELS.BACKUP.GET_EXE_DIRECTORY);
}

interface CleanupResult {
  deletedCount: number;
  message: string;
}

export async function cleanupOldBackupFiles(): Promise<CleanupResult> {
  return safeInvoke<CleanupResult>(IPC_CHANNELS.BACKUP.CLEANUP_OLD_FILES);
}

// ============ Диалоги ============

interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: string[];
}

interface OpenDialogResult {
  canceled: boolean;
  filePaths: string[];
}

export async function showOpenDialog(options?: OpenDialogOptions): Promise<OpenDialogResult | null> {
  return safeInvoke<OpenDialogResult | null>(IPC_CHANNELS.DIALOG.SHOW_OPEN_DIALOG, options);
}

interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

export async function showSaveDialog(options?: SaveDialogOptions): Promise<string | null> {
  return safeInvoke<string | null>(IPC_CHANNELS.DIALOG.SHOW_SAVE_DIALOG, options);
}


