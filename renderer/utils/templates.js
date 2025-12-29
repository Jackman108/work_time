/**
 * Система шаблонов для часто используемых данных
 * Сохраняет шаблоны в localStorage
 * Предоставляет функции для работы с шаблонами
 * 
 * @module renderer/utils/templates
 */

const STORAGE_KEY = 'form_templates';
const MAX_TEMPLATES = 50;

/**
 * Получить все шаблоны
 * @param {string} formType - Тип формы (projects, employees, materials, etc.)
 * @returns {Array} Массив шаблонов
 */
export function getTemplates(formType) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allTemplates = stored ? JSON.parse(stored) : {};
    return allTemplates[formType] || [];
  } catch (error) {
    console.error('Ошибка получения шаблонов:', error);
    return [];
  }
}

/**
 * Сохранить шаблон
 * @param {string} formType - Тип формы
 * @param {string} name - Название шаблона
 * @param {Object} data - Данные шаблона
 */
export function saveTemplate(formType, name, data) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allTemplates = stored ? JSON.parse(stored) : {};
    
    if (!allTemplates[formType]) {
      allTemplates[formType] = [];
    }

    // Удаляем старый шаблон с таким же именем
    allTemplates[formType] = allTemplates[formType].filter(
      t => t.name !== name
    );

    // Добавляем новый шаблон
    allTemplates[formType].push({
      name,
      data: { ...data },
      createdAt: new Date().toISOString()
    });

    // Ограничиваем количество шаблонов
    if (allTemplates[formType].length > MAX_TEMPLATES) {
      allTemplates[formType] = allTemplates[formType]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, MAX_TEMPLATES);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allTemplates));
  } catch (error) {
    console.error('Ошибка сохранения шаблона:', error);
  }
}

/**
 * Удалить шаблон
 * @param {string} formType - Тип формы
 * @param {string} name - Название шаблона
 */
export function deleteTemplate(formType, name) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allTemplates = stored ? JSON.parse(stored) : {};
    
    if (allTemplates[formType]) {
      allTemplates[formType] = allTemplates[formType].filter(
        t => t.name !== name
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allTemplates));
    }
  } catch (error) {
    console.error('Ошибка удаления шаблона:', error);
  }
}

/**
 * Применить шаблон к форме
 * @param {string} formType - Тип формы
 * @param {string} name - Название шаблона
 * @returns {Object|null} Данные шаблона или null
 */
export function applyTemplate(formType, name) {
  try {
    const templates = getTemplates(formType);
    const template = templates.find(t => t.name === name);
    return template ? { ...template.data } : null;
  } catch (error) {
    console.error('Ошибка применения шаблона:', error);
    return null;
  }
}

/**
 * Проверить наличие дублей
 * @param {string} formType - Тип формы
 * @param {Object} data - Данные для проверки
 * @param {Array} existingItems - Существующие элементы
 * @param {Array<string>} fieldsToCheck - Поля для проверки на дубли
 * @param {number} excludeId - ID записи для исключения (при обновлении)
 * @returns {Object} { hasDuplicate: boolean, duplicateField: string, message: string }
 */
export function checkDuplicates(formType, data, existingItems, fieldsToCheck, excludeId = null) {
  if (!existingItems || existingItems.length === 0) {
    return { hasDuplicate: false };
  }

  for (const field of fieldsToCheck) {
    const value = data[field];
    if (!value) continue;

    const duplicate = existingItems.find(item => {
      // Исключаем текущую запись при обновлении
      if (excludeId && item.id === excludeId) {
        return false;
      }

      const itemValue = item[field];
      if (!itemValue) return false;
      
      // Сравниваем без учёта регистра для строк
      if (typeof value === 'string' && typeof itemValue === 'string') {
        return value.toLowerCase().trim() === itemValue.toLowerCase().trim();
      }
      
      return value === itemValue;
    });

    if (duplicate) {
      return {
        hasDuplicate: true,
        duplicateField: field,
        message: `Запись с таким значением "${value}" уже существует в поле "${field}"`
      };
    }
  }

  return { hasDuplicate: false };
}

/**
 * Проверить наличие дубля по комбинации полей
 * Используется для проверки уникальности комбинации нескольких полей
 * @param {Object} data - Данные для проверки
 * @param {Array} existingItems - Существующие элементы
 * @param {Array<string>} fieldsToCheck - Поля для проверки комбинации
 * @param {number} excludeId - ID записи для исключения (при обновлении)
 * @returns {Object} { hasDuplicate: boolean, message: string }
 */
export function checkDuplicateByCombination(data, existingItems, fieldsToCheck, excludeId = null) {
  if (!existingItems || existingItems.length === 0) {
    return { hasDuplicate: false };
  }

  // Проверяем, что все поля заполнены
  for (const field of fieldsToCheck) {
    if (!data[field]) {
      return { hasDuplicate: false };
    }
  }

  const duplicate = existingItems.find(item => {
    // Исключаем текущую запись при обновлении
    if (excludeId && item.id === excludeId) {
      return false;
    }

    // Проверяем совпадение всех полей комбинации
    return fieldsToCheck.every(field => {
      const dataValue = data[field];
      const itemValue = item[field];
      
      if (!dataValue || !itemValue) return false;
      
      // Для строк сравниваем без учёта регистра
      if (typeof dataValue === 'string' && typeof itemValue === 'string') {
        return dataValue.toLowerCase().trim() === itemValue.toLowerCase().trim();
      }
      
      // Для чисел и дат сравниваем напрямую
      return dataValue == itemValue; // Используем == для приведения типов
    });
  });

  if (duplicate) {
    const fieldNames = fieldsToCheck.join(', ');
    return {
      hasDuplicate: true,
      message: `Запись с такой комбинацией полей (${fieldNames}) уже существует`
    };
  }

  return { hasDuplicate: false };
}

