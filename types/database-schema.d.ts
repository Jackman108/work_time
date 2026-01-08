/**
 * Схема базы данных SQLite
 * 
 * База данных содержит следующие таблицы:
 * - projects: Проекты (строительные объекты)
 * - employees: Сотрудники
 * - materials: Материалы
 * - work_log: Учёт рабочего времени и заработной платы
 * - material_log: Учёт списания материалов
 * - project_payments: Поступления денег на проекты
 */

export namespace DatabaseSchema {
    /**
     * Таблица проектов (строительных объектов)
     */
    export interface ProjectsTable {
        id: number; // INTEGER PRIMARY KEY AUTOINCREMENT
        name: string; // TEXT NOT NULL
        address: string | null; // TEXT
        date_start: string | null; // DATE
        date_end: string | null; // DATE
        budget: number; // REAL DEFAULT 0
        created_at: string; // DATETIME DEFAULT CURRENT_TIMESTAMP
        updated_at: string; // DATETIME DEFAULT CURRENT_TIMESTAMP
    }

    /**
     * Таблица сотрудников
     */
    export interface EmployeesTable {
        id: number; // INTEGER PRIMARY KEY AUTOINCREMENT
        name: string; // TEXT NOT NULL
        role: string | null; // TEXT
        wage_per_hour: number; // REAL DEFAULT 0
        phone: string | null; // TEXT
        created_at: string; // DATETIME DEFAULT CURRENT_TIMESTAMP
        updated_at: string; // DATETIME DEFAULT CURRENT_TIMESTAMP
    }

    /**
     * Таблица материалов
     */
    export interface MaterialsTable {
        id: number; // INTEGER PRIMARY KEY AUTOINCREMENT
        name: string; // TEXT NOT NULL
        unit: string; // TEXT DEFAULT 'шт'
        price_per_unit: number; // REAL DEFAULT 0
        created_at: string; // DATETIME DEFAULT CURRENT_TIMESTAMP
        updated_at: string; // DATETIME DEFAULT CURRENT_TIMESTAMP
    }

    /**
     * Таблица учёта рабочего времени и заработной платы
     */
    export interface WorkLogTable {
        id: number; // INTEGER PRIMARY KEY AUTOINCREMENT
        employee_id: number; // INTEGER NOT NULL -> employees(id)
        project_id: number; // INTEGER NOT NULL -> projects(id)
        date: string; // DATE NOT NULL
        salary_per_day: number; // REAL NOT NULL DEFAULT 0
        notes: string | null; // TEXT
        created_at: string; // DATETIME DEFAULT CURRENT_TIMESTAMP
    }

    /**
     * Таблица учёта списания материалов
     */
    export interface MaterialLogTable {
        id: number; // INTEGER PRIMARY KEY AUTOINCREMENT
        material_id: number; // INTEGER NOT NULL -> materials(id)
        project_id: number; // INTEGER NOT NULL -> projects(id)
        date: string; // DATE NOT NULL
        amount: number; // REAL NOT NULL DEFAULT 0
        notes: string | null; // TEXT
        created_at: string; // DATETIME DEFAULT CURRENT_TIMESTAMP
    }

    /**
     * Таблица учёта поступлений денег на проекты
     */
    export interface ProjectPaymentsTable {
        id: number; // INTEGER PRIMARY KEY AUTOINCREMENT
        project_id: number; // INTEGER NOT NULL -> projects(id)
        date: string; // DATE NOT NULL
        amount: number; // REAL NOT NULL DEFAULT 0
        notes: string | null; // TEXT
        created_at: string; // DATETIME DEFAULT CURRENT_TIMESTAMP
    }

    /**
     * Индексы базы данных
     */
    export interface DatabaseIndexes {
        // Индексы для work_log
        idx_work_log_employee: 'work_log(employee_id)';
        idx_work_log_project: 'work_log(project_id)';
        idx_work_log_date: 'work_log(date)';
        idx_work_log_project_date: 'work_log(project_id, date)';
        idx_work_log_employee_date: 'work_log(employee_id, date)';
        idx_work_log_unique: 'work_log(employee_id, project_id, date) UNIQUE';

        // Индексы для material_log
        idx_material_log_material: 'material_log(material_id)';
        idx_material_log_project: 'material_log(project_id)';
        idx_material_log_date: 'material_log(date)';
        idx_material_log_project_date: 'material_log(project_id, date)';
        idx_material_log_material_project: 'material_log(material_id, project_id)';

        // Индексы для project_payments
        idx_project_payments_project: 'project_payments(project_id)';
        idx_project_payments_date: 'project_payments(date)';
        idx_project_payments_project_date: 'project_payments(project_id, date)';

        // Индексы для сортировки
        idx_projects_created_at: 'projects(created_at)';
        idx_employees_name: 'employees(name)';
        idx_materials_name: 'materials(name)';
    }

    /**
     * Внешние ключи (Foreign Keys)
     */
    export interface ForeignKeys {
        work_log_employee_id: 'work_log(employee_id) -> employees(id) ON DELETE CASCADE';
        work_log_project_id: 'work_log(project_id) -> projects(id) ON DELETE CASCADE';
        material_log_material_id: 'material_log(material_id) -> materials(id) ON DELETE CASCADE';
        material_log_project_id: 'material_log(project_id) -> projects(id) ON DELETE CASCADE';
        project_payments_project_id: 'project_payments(project_id) -> projects(id) ON DELETE CASCADE';
    }
}


