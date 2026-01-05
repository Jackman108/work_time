# Структура компонентов

## Новая организация

```
renderer/components/
├── common/                    # Общие/системные компоненты
│   ├── LoadingSpinner.jsx    # Индикатор загрузки
│   ├── NotificationSystem.jsx # Система уведомлений
│   ├── ConfirmDialog.jsx     # Диалог подтверждения
│   ├── FormErrors.jsx       # Ошибки форм
│   ├── Navigation.jsx       # Навигация
│   └── index.js             # Экспорт общих компонентов
│
├── forms/                    # Формы для создания/редактирования
│   ├── ProjectForm.jsx
│   ├── EmployeeForm.jsx
│   ├── MaterialForm.jsx
│   ├── WorkLogForm.jsx
│   ├── MaterialLogForm.jsx
│   ├── ProjectPaymentForm.jsx
│   └── index.js            # Экспорт форм
│
├── lists/                    # Компоненты списков
│   ├── ProjectList.jsx
│   ├── EmployeeList.jsx
│   ├── MaterialList.jsx
│   ├── WorkLogList.jsx
│   ├── MaterialLogList.jsx
│   ├── ProjectPaymentList.jsx
│   └── index.js            # Экспорт списков
│
├── pages/                    # Страницы приложения
│   ├── ProjectsPage.jsx
│   ├── EmployeesPage.jsx
│   ├── MaterialsPage.jsx
│   ├── WorkLogPage.jsx
│   ├── MaterialLogPage.jsx
│   ├── PayrollPage.jsx
│   ├── ReportsPage.jsx
│   └── index.js            # Экспорт страниц
│
├── features/                 # Функциональные компоненты (для будущего)
│   └── index.js
│
└── index.js                  # Главный экспорт всех компонентов
```

## Использование

### Импорт из общих компонентов
```javascript
import { LoadingSpinner, NotificationProvider, Navigation } from '../components/common';
// или
import { LoadingSpinner } from '../components';
```

### Импорт форм
```javascript
import { ProjectForm, EmployeeForm } from '../components/forms';
// или
import { ProjectForm } from '../components';
```

### Импорт списков
```javascript
import { ProjectList, EmployeeList } from '../components/lists';
// или
import { ProjectList } from '../components';
```

### Импорт страниц
```javascript
import { ProjectsPage, EmployeesPage } from '../components/pages';
// или через роутер
import { getRouteComponent } from '../router';
```

## Преимущества

1. ✅ **Логическая организация** - компоненты сгруппированы по типу
2. ✅ **Легко найти** - понятно где искать нужный компонент
3. ✅ **Масштабируемость** - легко добавлять новые компоненты
4. ✅ **Чистые импорты** - можно использовать короткие пути
5. ✅ **Единый стиль** - все компоненты следуют одной структуре

## Миграция импортов

### Старые импорты
```javascript
import LoadingSpinner from '../../components/LoadingSpinner';
import ProjectForm from '../ProjectForm';
import ProjectList from '../ProjectList';
```

### Новые импорты
```javascript
import { LoadingSpinner } from '../../components/common';
import { ProjectForm } from '../forms';
import { ProjectList } from '../lists';
// или через главный экспорт
import { LoadingSpinner, ProjectForm, ProjectList } from '../../components';
```

