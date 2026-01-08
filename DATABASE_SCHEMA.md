# Схема базы данных

База данных SQLite для системы управления строительными проектами.

## Структура базы данных

### Таблицы

#### 1. `projects` - Проекты (строительные объекты)

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Уникальный идентификатор проекта |
| `name` | TEXT | NOT NULL | Название проекта |
| `address` | TEXT | NULL | Адрес проекта |
| `date_start` | DATE | NULL | Дата начала проекта |
| `date_end` | DATE | NULL | Дата окончания проекта |
| `budget` | REAL | DEFAULT 0 | Бюджет проекта |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Дата создания записи |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Дата последнего обновления |

**Индексы:**
- `idx_projects_created_at` на `created_at`

---

#### 2. `employees` - Сотрудники

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Уникальный идентификатор сотрудника |
| `name` | TEXT | NOT NULL | ФИО сотрудника |
| `role` | TEXT | NULL | Должность/роль |
| `wage_per_hour` | REAL | DEFAULT 0 | Зарплата за час работы |
| `phone` | TEXT | NULL | Телефон сотрудника |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Дата создания записи |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Дата последнего обновления |

**Индексы:**
- `idx_employees_name` на `name`

---

#### 3. `materials` - Материалы

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Уникальный идентификатор материала |
| `name` | TEXT | NOT NULL | Название материала |
| `unit` | TEXT | DEFAULT 'шт' | Единица измерения |
| `price_per_unit` | REAL | DEFAULT 0 | Цена за единицу |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Дата создания записи |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Дата последнего обновления |

**Индексы:**
- `idx_materials_name` на `name`

---

#### 4. `work_log` - Учёт рабочего времени и заработной платы

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Уникальный идентификатор записи |
| `employee_id` | INTEGER | NOT NULL, FK -> employees(id) | Идентификатор сотрудника |
| `project_id` | INTEGER | NOT NULL, FK -> projects(id) | Идентификатор проекта |
| `date` | DATE | NOT NULL | Дата работы |
| `salary_per_day` | REAL | NOT NULL DEFAULT 0 | Зарплата за день |
| `notes` | TEXT | NULL | Примечания |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Дата создания записи |

**Внешние ключи:**
- `employee_id` → `employees(id)` ON DELETE CASCADE
- `project_id` → `projects(id)` ON DELETE CASCADE

**Индексы:**
- `idx_work_log_employee` на `employee_id`
- `idx_work_log_project` на `project_id`
- `idx_work_log_date` на `date`
- `idx_work_log_project_date` на `(project_id, date)`
- `idx_work_log_employee_date` на `(employee_id, date)`
- `idx_work_log_unique` UNIQUE на `(employee_id, project_id, date)` - предотвращает дубликаты

---

#### 5. `material_log` - Учёт списания материалов

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Уникальный идентификатор записи |
| `material_id` | INTEGER | NOT NULL, FK -> materials(id) | Идентификатор материала |
| `project_id` | INTEGER | NOT NULL, FK -> projects(id) | Идентификатор проекта |
| `date` | DATE | NOT NULL | Дата списания |
| `amount` | REAL | NOT NULL DEFAULT 0 | Количество списанного материала |
| `notes` | TEXT | NULL | Примечания |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Дата создания записи |

**Внешние ключи:**
- `material_id` → `materials(id)` ON DELETE CASCADE
- `project_id` → `projects(id)` ON DELETE CASCADE

**Индексы:**
- `idx_material_log_material` на `material_id`
- `idx_material_log_project` на `project_id`
- `idx_material_log_date` на `date`
- `idx_material_log_project_date` на `(project_id, date)`
- `idx_material_log_material_project` на `(material_id, project_id)`

---

#### 6. `project_payments` - Поступления денег на проекты

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Уникальный идентификатор записи |
| `project_id` | INTEGER | NOT NULL, FK -> projects(id) | Идентификатор проекта |
| `date` | DATE | NOT NULL | Дата поступления |
| `amount` | REAL | NOT NULL DEFAULT 0 | Сумма поступления |
| `notes` | TEXT | NULL | Примечания |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Дата создания записи |

**Внешние ключи:**
- `project_id` → `projects(id)` ON DELETE CASCADE

**Индексы:**
- `idx_project_payments_project` на `project_id`
- `idx_project_payments_date` на `date`
- `idx_project_payments_project_date` на `(project_id, date)`

---

## Связи между таблицами

```
projects (1) ──< (N) work_log
projects (1) ──< (N) material_log
projects (1) ──< (N) project_payments
employees (1) ──< (N) work_log
materials (1) ──< (N) material_log
```

## Особенности

1. **Каскадное удаление**: При удалении проекта, сотрудника или материала автоматически удаляются все связанные записи в логах.

2. **Уникальность записей**: В таблице `work_log` существует уникальный индекс, предотвращающий создание дубликатов записей для одного сотрудника на одном проекте в один день.

3. **Индексы для производительности**: Все таблицы имеют индексы на внешние ключи и часто используемые поля для ускорения запросов.

4. **Временные метки**: Все таблицы имеют поля `created_at` и `updated_at` для отслеживания времени создания и обновления записей.

5. **Внешние ключи**: Включена проверка внешних ключей (`PRAGMA foreign_keys = ON`) для обеспечения целостности данных.


