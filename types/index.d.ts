/**
 * Типы для приложения Builder Manager
 * Централизованные определения типов для всего приложения
 * 
 * @module types
 */

declare namespace Types {
    // ========== Базовые типы ==========

    /**
     * Базовая сущность с ID и временными метками
     */
    interface BaseEntity {
        id: number;
        created_at?: string;
        updated_at?: string;
    }

    // ========== Проекты ==========

    /**
     * Проект (строительный объект)
     */
    interface Project extends BaseEntity {
        name: string;
        address?: string;
        date_start?: string;
        date_end?: string;
        budget?: number;
    }

    /**
     * Статистика по проекту
     */
    interface ProjectStats {
        totalCosts: number;
        salaryCosts: number;
        materialCosts: number;
        paymentsReceived: number;
    }

    /**
     * Данные для создания проекта
     */
    interface ProjectCreateData {
        name: string;
        address?: string;
        date_start?: string;
        date_end?: string;
        budget?: number;
    }

    /**
     * Данные для обновления проекта
     */
    interface ProjectUpdateData {
        name?: string;
        address?: string;
        date_start?: string;
        date_end?: string;
        budget?: number;
    }

    // ========== Сотрудники ==========

    /**
     * Сотрудник
     */
    interface Employee extends BaseEntity {
        name: string;
        role?: string;
        wage_per_hour?: number;
        phone?: string;
    }

    /**
     * Статистика по сотруднику
     */
    interface EmployeeStats {
        days_worked: number;
        total_salary: number;
        projects_count: number;
    }

    /**
     * Данные для создания сотрудника
     */
    interface EmployeeCreateData {
        name: string;
        role?: string;
        wage_per_hour?: number;
        phone?: string;
    }

    /**
     * Данные для обновления сотрудника
     */
    interface EmployeeUpdateData {
        name?: string;
        role?: string;
        wage_per_hour?: number;
        phone?: string;
    }

    // ========== Материалы ==========

    /**
     * Материал
     */
    interface Material extends BaseEntity {
        name: string;
        unit?: string;
        price_per_unit?: number;
    }

    /**
     * Статистика по материалу
     */
    interface MaterialStats {
        total_amount: number;
        total_cost: number;
        projects_count: number;
    }

    /**
     * Данные для создания материала
     */
    interface MaterialCreateData {
        name: string;
        unit?: string;
        price_per_unit?: number;
    }

    /**
     * Данные для обновления материала
     */
    interface MaterialUpdateData {
        name?: string;
        unit?: string;
        price_per_unit?: number;
    }

    // ========== Учёт рабочего времени ==========

    /**
     * Запись рабочего времени
     */
    interface WorkLog extends BaseEntity {
        employee_id: number;
        project_id: number;
        date: string;
        salary_per_day: number;
        notes?: string;
        employee_name?: string;
        employee_role?: string;
        project_name?: string;
    }

    /**
     * Данные для создания записи рабочего времени
     */
    interface WorkLogCreateData {
        employee_id: number;
        project_id: number;
        date: string;
        salary_per_day: number;
        notes?: string;
    }

    /**
     * Данные для обновления записи рабочего времени
     */
    interface WorkLogUpdateData {
        employee_id?: number;
        project_id?: number;
        date?: string;
        salary_per_day?: number;
        notes?: string;
    }

    /**
     * Фильтры для записей рабочего времени
     */
    interface WorkLogFilters {
        projectId?: number;
        employeeId?: number;
        dateFrom?: string;
        dateTo?: string;
    }

    // ========== Учёт списания материалов ==========

    /**
     * Запись списания материалов
     */
    interface MaterialLog extends BaseEntity {
        material_id: number;
        project_id: number;
        date: string;
        amount: number;
        notes?: string;
        material_name?: string;
        material_unit?: string;
        material_price?: number;
        total_cost?: number;
        project_name?: string;
    }

    /**
     * Данные для создания записи списания материалов
     */
    interface MaterialLogCreateData {
        material_id: number;
        project_id: number;
        date: string;
        amount: number;
        notes?: string;
    }

    /**
     * Данные для обновления записи списания материалов
     */
    interface MaterialLogUpdateData {
        material_id?: number;
        project_id?: number;
        date?: string;
        amount?: number;
        notes?: string;
    }

    /**
     * Фильтры для записей списания материалов
     */
    interface MaterialLogFilters {
        projectId?: number;
        materialId?: number;
        dateFrom?: string;
        dateTo?: string;
    }

    // ========== Поступления денег на проекты ==========

    /**
     * Поступление денег на проект
     */
    interface ProjectPayment extends BaseEntity {
        project_id: number;
        date: string;
        amount: number;
        notes?: string;
        project_name?: string;
        project_address?: string;
    }

    /**
     * Данные для создания поступления денег на проект
     */
    interface ProjectPaymentCreateData {
        project_id: number;
        date: string;
        amount: number;
        notes?: string;
    }

    /**
     * Данные для обновления поступления денег на проект
     */
    interface ProjectPaymentUpdateData {
        project_id?: number;
        date?: string;
        amount?: number;
        notes?: string;
    }

    /**
     * Фильтры для поступлений денег на проекты
     */
    interface ProjectPaymentFilters {
        projectId?: number;
        dateFrom?: string;
        dateTo?: string;
    }

    // ========== Отчёты ==========

    /**
     * Общая статистика
     */
    interface OverallStats {
        projectsCount: number;
        employeesCount: number;
        materialsCount: number;
        totalBudget: number;
        totalCosts: number;
        totalSalaryCosts: number;
        totalMaterialCosts: number;
        totalPaymentsReceived: number;
        totalBalance: number;
    }

    /**
     * Отчёт по проектам
     */
    interface ProjectReport {
        id: number;
        name: string;
        address?: string;
        date_start?: string;
        date_end?: string;
        budget: number;
        payments_received: number;
        salary_costs: number;
        material_costs: number;
        total_costs: number;
        balance: number;
        budget_remaining: number;
    }

    /**
     * Отчёт по сотрудникам
     */
    interface EmployeeReport {
        id: number;
        name: string;
        role?: string;
        days_worked: number;
        total_salary: number;
        projects_count: number;
    }

    /**
     * Отчёт по материалам
     */
    interface MaterialReport {
        id: number;
        name: string;
        unit: string;
        price_per_unit: number;
        total_amount: number;
        total_cost: number;
        projects_count: number;
    }

    // ========== API Response ==========

    /**
     * Ответ от API
     */
    interface ApiResponse {
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: number;
        };
    }

    // ========== Формы и валидация ==========

    /**
     * Опции валидации строки
     */
    interface StringValidationOptions {
        minLength?: number;
        maxLength?: number;
        pattern?: RegExp;
    }

    /**
     * Опции валидации числа
     */
    interface NumberValidationOptions {
        min?: number;
        max?: number;
        allowZero?: boolean;
        allowNegative?: boolean;
    }

    /**
     * Правило валидации поля
     */
    interface ValidationRule {
        type: string;
        label: string;
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        allowZero?: boolean;
        allowNegative?: boolean;
    }

    /**
     * Правила валидации формы
     */
    interface ValidationRules {
        required: string[];
        fields: Record<string, ValidationRule>;
        custom?: Array<{
            field: string;
            validator: (data: any) => ValidationResult;
        }>;
    }

    /**
     * Результат валидации
     */
    interface ValidationResult {
        isValid: boolean;
        errors: Record<string, string>;
        error?: string;
    }

    // ========== Компоненты ==========

    /**
     * Пропсы формы
     */
    interface FormProps {
        item?: any;
        onSave: (data: any) => Promise<void>;
        onCancel: () => void;
        existingItems?: any[];
    }

    /**
     * Пропсы списка
     */
    interface ListProps {
        items: any[];
        onEdit: (item: any) => void;
        onDelete: (id: number) => void;
        stats?: Record<number, any>;
    }

    // ========== Хуки ==========

    /**
     * Конфигурация хука usePageData
     */
    interface UsePageDataConfig {
        loadData: () => Promise<any[]>;
        createItem?: (data: any) => Promise<any>;
        updateItem?: (id: number, data: any) => Promise<any>;
        deleteItem?: (id: number) => Promise<boolean>;
        messages?: {
            loadError?: string;
            createSuccess?: string;
            createError?: string;
            updateSuccess?: string;
            updateError?: string;
            deleteSuccess?: string;
            deleteError?: string;
            deleteConfirmTitle?: string;
            deleteConfirmMessage?: string;
        };
        dependencies?: any[];
    }

    /**
     * Результат хука usePageData
     */
    interface UsePageDataReturn {
        items: any[];
        loading: boolean;
        editingItem: any | null;
        setEditingItem: (item: any | null) => void;
        handleAdd: (data: any) => Promise<void>;
        handleUpdate: (id: number, data: any) => Promise<void>;
        handleDelete: (id: number) => Promise<void>;
        reloadData: () => Promise<void>;
        confirmDialog: any;
        operationLoading: boolean;
    }

    /**
     * Опции хука useAsyncOperation
     */
    interface UseAsyncOperationOptions {
        onSuccess?: (result: any) => void;
        onError?: (error: Error) => void;
        showSuccessNotification?: boolean;
        showErrorNotification?: boolean;
        successMessage?: string;
        errorMessage?: string;
    }

    /**
     * Результат хука useAsyncOperation
     */
    interface UseAsyncOperationReturn {
        execute: (asyncFn: () => Promise<any>, operationOptions?: {
            showSuccessNotification?: boolean;
            showErrorNotification?: boolean;
            successMessage?: string | ((result: any) => string);
            errorMessage?: string | ((error: Error) => string);
        }) => Promise<any>;
        loading: boolean;
        error: Error | null;
    }

    // ========== Уведомления ==========

    /**
     * Тип уведомления
     */
    type NotificationType = 'success' | 'error' | 'warning' | 'info';

    /**
     * Уведомление
     */
    interface Notification {
        id: string;
        type: NotificationType;
        message: string;
        duration?: number;
    }

    // ========== Фильтры ==========

    /**
     * Состояние фильтра
     */
    interface FilterState {
        value?: string | number | null;
        setValue: (value: string | number | null) => void;
        clear: () => void;
    }
}
