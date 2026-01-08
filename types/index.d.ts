/**
 * Типы для приложения Builder Manager
 * Определения типов для TypeScript через JSDoc
 */

// Экспортируем типы из других модулей
export * from './config';
export * from './ipc-channels';
export * from './database-schema';

/**
 * Базовые типы данных
 */
export namespace Types {
  /**
   * Проект (строительный объект)
   */
  export interface Project {
    id: number;
    name: string;
    address: string | null;
    budget: number;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
  }

  /**
   * Данные для создания проекта
   */
  export interface ProjectCreateData {
    name: string;
    address: string;
    budget: number;
    start_date: string | null;
    end_date: string | null;
    description?: string | null;
  }

  /**
   * Данные для обновления проекта
   */
  export interface ProjectUpdateData extends Partial<ProjectCreateData> { }

  /**
   * Сотрудник
   */
  export interface Employee {
    id: number;
    name: string;
    phone: string | null;
    position: string | null;
    hire_date: string | null;
    salary_per_day: number | null;
    created_at: string;
    updated_at: string;
  }

  /**
   * Данные для создания сотрудника
   */
  export interface EmployeeCreateData {
    name: string;
    phone: string;
    position: string;
    hire_date?: string | null;
    salary_per_day?: number | null;
  }

  /**
   * Данные для обновления сотрудника
   */
  export interface EmployeeUpdateData extends Partial<EmployeeCreateData> { }

  /**
   * Материал
   */
  export interface Material {
    id: number;
    name: string;
    unit: string;
    price_per_unit: number;
    created_at: string;
    updated_at: string;
  }

  /**
   * Данные для создания материала
   */
  export interface MaterialCreateData {
    name: string;
    unit: string;
    price_per_unit: number;
  }

  /**
   * Данные для обновления материала
   */
  export interface MaterialUpdateData extends Partial<MaterialCreateData> { }

  /**
   * Фильтры для учёта рабочего времени
   */
  export interface WorkLogFilters {
    project_id?: number | null;
    employee_id?: number | null;
    start_date?: string | null;
    end_date?: string | null;
  }

  /**
   * Фильтры для учёта списания материалов
   */
  export interface MaterialLogFilters {
    project_id?: number | null;
    material_id?: number | null;
    start_date?: string | null;
    end_date?: string | null;
  }

  /**
   * Фильтры для платежей по проектам
   */
  export interface ProjectPaymentFilters {
    project_id?: number | null;
    start_date?: string | null;
    end_date?: string | null;
  }

  /**
   * Запись рабочего времени
   */
  export interface WorkLog {
    id: number;
    employee_id: number;
    project_id: number;
    date: string;
    salary_per_day: number;
    notes?: string | null;
    created_at: string;
    // Joined fields
    employee_name?: string;
    project_name?: string;
  }

  /**
   * Данные для создания записи рабочего времени
   */
  export interface WorkLogCreateData {
    employee_id: number;
    project_id: number;
    date: string;
    salary_per_day: number;
    notes?: string | null;
  }

  /**
   * Данные для обновления записи рабочего времени
   */
  export interface WorkLogUpdateData extends Partial<WorkLogCreateData> { }

  /**
   * Запись списания материала
   */
  export interface MaterialLog {
    id: number;
    project_id: number;
    material_id: number;
    date: string;
    amount: number;
    notes?: string | null;
    created_at: string;
    // Joined fields
    material_name?: string;
    project_name?: string;
    unit?: string;
    price_per_unit?: number;
  }

  /**
   * Данные для создания записи списания материала
   */
  export interface MaterialLogCreateData {
    project_id: number;
    material_id: number;
    date: string;
    amount: number;
    notes?: string | null;
  }

  /**
   * Данные для обновления записи списания материала
   */
  export interface MaterialLogUpdateData extends Partial<MaterialLogCreateData> { }

  /**
   * Платёж по проекту
   */
  export interface ProjectPayment {
    id: number;
    project_id: number;
    date: string;
    amount: number;
    description?: string | null;
    notes?: string | null;
    created_at: string;
    // Joined fields
    project_name?: string;
  }

  /**
   * Данные для создания платежа по проекту
   */
  export interface ProjectPaymentCreateData {
    project_id: number;
    date: string;
    amount: number;
    description?: string | null;
    notes?: string | null;
  }

  /**
   * Данные для обновления платежа по проекту
   */
  export interface ProjectPaymentUpdateData extends Partial<ProjectPaymentCreateData> { }

  /**
   * Ошибки валидации формы
   */
  export interface FormErrors {
    [fieldName: string]: string;
  }

  /**
   * Ответ от API
   */
  export interface ApiResponse {
    success: boolean;
    data?: any;
    error?: string | { message: string };
  }

  /**
   * Опции для хука useAsyncOperation
   */
  export interface UseAsyncOperationOptions {
    /** Обработчик успешного выполнения операции */
    onSuccess?: ((result: any) => void) | null;
    /** Обработчик ошибки выполнения операции */
    onError?: ((error: Error) => void) | null;
    /** Показывать уведомление об успехе */
    showSuccessNotification?: boolean;
    /** Показывать уведомление об ошибке */
    showErrorNotification?: boolean;
    /** Сообщение об успехе */
    successMessage?: string;
    /** Сообщение об ошибке */
    errorMessage?: string;
  }

  /**
   * Результат хука useAsyncOperation
   */
  export interface UseAsyncOperationReturn {
    /** Функция для выполнения асинхронной операции */
    execute: (asyncFn: Function, operationOptions?: {
      showSuccessNotification?: boolean;
      showErrorNotification?: boolean;
      successMessage?: string | Function;
      errorMessage?: string | ((error: Error) => string);
    }) => Promise<any>;
    /** Флаг загрузки */
    loading: boolean;
    /** Ошибка, если произошла */
    error: Error | null;
  }

  /**
   * Отчёт по проекту
   */
  export interface ProjectReport extends Project {
    date_start: string | null;
    date_end: string | null;
    salary_costs: number;
    material_costs: number;
    total_costs: number;
    payments_received: number;
    balance: number;
    budget_remaining: number;
  }

  /**
   * Отчёт по сотруднику
   */
  export interface EmployeeReport extends Employee {
    role?: string | null;
    total_salary: number;
    total_received: number;
    days_worked: number;
    projects_count: number;
  }

  /**
   * Отчёт по материалу
   */
  export interface MaterialReport extends Material {
    total_amount: number;
    total_cost: number;
    projects_count: number;
  }

  /**
   * Статистика проекта
   */
  export interface ProjectStats {
    project: Project;
    totalSalary: number;
    workDays: number;
    totalMaterialCost: number;
    totalPayments: number;
    totalCost: number;
    balance: number;
  }

  /**
   * Статистика сотрудника
   */
  export interface EmployeeStats {
    employee: Employee;
    totalEarned: number;
    workDays: number;
  }

  /**
   * Статистика материала
   */
  export interface MaterialStats {
    material: Material;
    totalAmount: number;
    usageCount: number;
    totalCost: number;
  }

  /**
   * Общая статистика
   */
  export interface OverallStats {
    projectsCount: number;
    employeesCount: number;
    materialsCount: number;
    totalSalary: number;
    totalSalaryCosts: number;
    totalMaterialCost: number;
    totalMaterialCosts: number;
    totalCost: number;
    totalCosts: number;
    totalPayments: number;
    totalPaymentsReceived: number;
    totalBudget: number;
    balance: number;
    totalBalance: number;
  }

  /**
   * Результат экспорта базы данных
   */
  export interface BackupExportResult {
    success: boolean;
    message: string;
    path?: string;
  }

  /**
   * Результат импорта базы данных
   */
  export interface BackupImportResult {
    success: boolean;
    message: string;
    backupPath?: string;
    isDuplicate?: boolean;
  }

  /**
   * Резервная копия
   */
  export interface Backup {
    path: string;
    createdAt: string;
    hash?: string;
  }

  /**
   * Список резервных копий
   */
  export interface BackupListResult {
    success: boolean;
    backups: Backup[];
    message?: string;
  }

  /**
   * Опции диалога открытия файла
   */
  export interface OpenDialogOptions {
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
    filters?: Array<{ name: string; extensions: string[] }>;
    title?: string;
    defaultPath?: string;
  }

  /**
   * Опции диалога сохранения файла
   */
  export interface SaveDialogOptions {
    filters?: Array<{ name: string; extensions: string[] }>;
    title?: string;
    defaultPath?: string;
  }

  /**
   * Данные для графика проектов
   */
  export interface ProjectChartData {
    name: string;
    fullName: string;
    budget: number;
    costs: number;
    payments: number;
    balance: number;
  }

  /**
   * Данные для графика сотрудников
   */
  export interface EmployeeChartData {
    name: string;
    fullName: string;
    earned: number;
    received: number;
    daysWorked: number;
  }

  /**
   * Данные для круговой диаграммы затрат
   */
  export interface CostChartData {
    name: string;
    value: number;
    color: string;
  }

  /**
   * Данные для круговой диаграммы материалов
   */
  export interface MaterialChartData {
    name: string;
    value: number;
    amount: number;
  }

  /**
   * Данные для графика общей статистики
   */
  export interface OverallStatsChartData {
    name: string;
    value: number;
    color: string;
  }
}

