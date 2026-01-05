# Реструктуризация компонентов

## Новая структура

```
renderer/components/
├── common/              # Общие/системные компоненты
│   ├── LoadingSpinner.jsx
│   ├── NotificationSystem.jsx
│   ├── ConfirmDialog.jsx
│   ├── FormErrors.jsx
│   ├── Navigation.jsx
│   └── index.js
├── forms/               # Формы для создания/редактирования
│   ├── ProjectForm.jsx
│   ├── EmployeeForm.jsx
│   ├── MaterialForm.jsx
│   ├── WorkLogForm.jsx
│   ├── MaterialLogForm.jsx
│   ├── ProjectPaymentForm.jsx
│   └── index.js
├── lists/              # Компоненты списков
│   ├── ProjectList.jsx
│   ├── EmployeeList.jsx
│   ├── MaterialList.jsx
│   ├── WorkLogList.jsx
│   ├── MaterialLogList.jsx
│   ├── ProjectPaymentList.jsx
│   └── index.js
├── pages/              # Страницы приложения
│   ├── ProjectsPage.jsx
│   ├── EmployeesPage.jsx
│   ├── MaterialsPage.jsx
│   ├── WorkLogPage.jsx
│   ├── MaterialLogPage.jsx
│   ├── PayrollPage.jsx
│   ├── ReportsPage.jsx
│   └── index.js
├── features/           # Функциональные компоненты (для будущего)
│   └── index.js
└── index.js            # Главный экспорт всех компонентов
```

## Преимущества новой структуры

1. **Логическая организация** - компоненты сгруппированы по типу
2. **Легче найти** - понятно где искать нужный компонент
3. **Масштабируемость** - легко добавлять новые компоненты
4. **Чистые импорты** - можно использовать `from '../components'` или `from '../components/forms'`

## План миграции

1. ✅ Создать папки common/, forms/, lists/, features/
2. ✅ Переместить системные компоненты в common/
3. ⏳ Переместить формы в forms/
4. ⏳ Переместить списки в lists/
5. ⏳ Обновить все импорты
6. ⏳ Создать index.js файлы
7. ⏳ Удалить старые файлы

