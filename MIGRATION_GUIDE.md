# Руководство по миграции компонентов

## ✅ Выполнено

1. ✅ Создана структура папок: `common/`, `forms/`, `lists/`, `features/`
2. ✅ Системные компоненты перемещены в `common/`:
   - LoadingSpinner.jsx
   - NotificationSystem.jsx
   - ConfirmDialog.jsx
   - FormErrors.jsx
   - Navigation.jsx
3. ✅ Созданы index.js файлы для экспортов
4. ✅ Обновлён App.jsx для использования новых путей

## ⏳ Требуется выполнить

### Шаг 1: Переместить формы в forms/

Для каждой формы (`*Form.jsx`):
1. Скопировать файл в `renderer/components/forms/`
2. Обновить импорты:
   ```javascript
   // Старый импорт
   import FormErrors, { FieldError, getFieldClasses } from './FormErrors';
   
   // Новый импорт
   import FormErrors, { FieldError, getFieldClasses } from '../common/FormErrors';
   ```
3. Обновить пути к utils:
   ```javascript
   // Старый
   import FormValidator from '../utils/formValidator';
   
   // Новый (если форма в forms/)
   import FormValidator from '../../utils/formValidator';
   ```

### Шаг 2: Переместить списки в lists/

Для каждого списка (`*List.jsx`):
1. Скопировать файл в `renderer/components/lists/`
2. Обновить пути к utils (если используются):
   ```javascript
   // Старый
   import { formatCurrency } from '../utils/formatters';
   
   // Новый
   import { formatCurrency } from '../../utils/formatters';
   ```

### Шаг 3: Обновить импорты в страницах

В файлах `renderer/components/pages/*.jsx`:

```javascript
// Старые импорты
import { useNotifications } from '../../components/NotificationSystem';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProjectForm from '../ProjectForm';
import ProjectList from '../ProjectList';

// Новые импорты
import { useNotifications, useConfirmDialog, LoadingSpinner } from '../common';
import { ProjectForm } from '../forms';
import { ProjectList } from '../lists';
```

### Шаг 4: Обновить router/index.js

```javascript
// Старый импорт
import ProjectsPage from '../components/pages/ProjectsPage';

// Новый импорт (если используется экспорт из index.js)
import { ProjectsPage } from '../components/pages';
```

### Шаг 5: Удалить старые файлы

После проверки, что всё работает:
- Удалить старые файлы из корня `components/`:
  - LoadingSpinner.jsx
  - NotificationSystem.jsx
  - ConfirmDialog.jsx
  - FormErrors.jsx
  - Navigation.jsx
  - Все *Form.jsx
  - Все *List.jsx

## Автоматизация

Можно использовать следующий скрипт для автоматической миграции (выполнить из корня проекта):

```powershell
# Переместить формы
Get-ChildItem "renderer\components\*Form.jsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    # Обновить импорты FormErrors
    $content = $content -replace "from '\./FormErrors'", "from '../common/FormErrors'"
    $content = $content -replace "from '\.\./utils", "from '../../utils"
    Set-Content -Path "renderer\components\forms\$($_.Name)" -Value $content
}

# Переместить списки
Get-ChildItem "renderer\components\*List.jsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    # Обновить пути к utils
    $content = $content -replace "from '\.\./utils", "from '../../utils"
    Set-Content -Path "renderer\components\lists\$($_.Name)" -Value $content
}
```

## Проверка

После миграции проверить:
1. ✅ Приложение запускается без ошибок
2. ✅ Все страницы работают
3. ✅ Формы открываются и сохраняются
4. ✅ Списки отображаются корректно
5. ✅ Навигация работает

## Структура после миграции

```
renderer/components/
├── common/          ✅ Готово
├── forms/           ⏳ Требует миграции
├── lists/           ⏳ Требует миграции
├── pages/           ✅ Уже в правильном месте
└── index.js         ✅ Готово
```

