/**
 * Система шаблонов для часто используемых данных
 */

const STORAGE_KEY = 'form_templates';
const MAX_TEMPLATES = 50;

interface Template {
  name: string;
  data: Record<string, unknown>;
  createdAt: string;
}

interface AllTemplates {
  [formType: string]: Template[];
}

export function getTemplates(formType: string): Template[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allTemplates: AllTemplates = stored ? JSON.parse(stored) : {};
    return allTemplates[formType] || [];
  } catch (error) {
    console.error('Ошибка получения шаблонов:', error);
    return [];
  }
}

export function saveTemplate(formType: string, name: string, data: Record<string, unknown>): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allTemplates: AllTemplates = stored ? JSON.parse(stored) : {};
    
    if (!allTemplates[formType]) {
      allTemplates[formType] = [];
    }

    allTemplates[formType] = allTemplates[formType].filter(t => t.name !== name);

    allTemplates[formType].push({
      name,
      data: { ...data },
      createdAt: new Date().toISOString()
    });

    if (allTemplates[formType].length > MAX_TEMPLATES) {
      allTemplates[formType] = allTemplates[formType]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, MAX_TEMPLATES);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allTemplates));
  } catch (error) {
    console.error('Ошибка сохранения шаблона:', error);
  }
}

export function deleteTemplate(formType: string, name: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allTemplates: AllTemplates = stored ? JSON.parse(stored) : {};
    
    if (allTemplates[formType]) {
      allTemplates[formType] = allTemplates[formType].filter(t => t.name !== name);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allTemplates));
    }
  } catch (error) {
    console.error('Ошибка удаления шаблона:', error);
  }
}

export function applyTemplate(formType: string, name: string): Record<string, unknown> | null {
  try {
    const templates = getTemplates(formType);
    const template = templates.find(t => t.name === name);
    return template ? { ...template.data } : null;
  } catch (error) {
    console.error('Ошибка применения шаблона:', error);
    return null;
  }
}

interface DuplicateCheckResult {
  hasDuplicate: boolean;
  duplicateField?: string;
  message?: string;
}

interface ItemWithId {
  id?: number;
  [key: string]: unknown;
}

export function checkDuplicates(
  formType: string, 
  data: Record<string, unknown>, 
  existingItems: ItemWithId[], 
  fieldsToCheck: string[], 
  excludeId: number | null = null
): DuplicateCheckResult {
  if (!existingItems || existingItems.length === 0) {
    return { hasDuplicate: false };
  }

  for (const field of fieldsToCheck) {
    const value = data[field];
    if (!value) continue;

    const duplicate = existingItems.find(item => {
      if (excludeId && item.id === excludeId) {
        return false;
      }

      const itemValue = item[field];
      if (!itemValue) return false;
      
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

export function checkDuplicateByCombination(
  data: Record<string, unknown>, 
  existingItems: ItemWithId[], 
  fieldsToCheck: string[], 
  excludeId: number | null = null
): DuplicateCheckResult {
  if (!existingItems || existingItems.length === 0) {
    return { hasDuplicate: false };
  }

  for (const field of fieldsToCheck) {
    if (!data[field]) {
      return { hasDuplicate: false };
    }
  }

  const duplicate = existingItems.find(item => {
    if (excludeId && item.id === excludeId) {
      return false;
    }

    return fieldsToCheck.every(field => {
      const dataValue = data[field];
      const itemValue = item[field];
      
      if (!dataValue || !itemValue) return false;
      
      if (typeof dataValue === 'string' && typeof itemValue === 'string') {
        return dataValue.toLowerCase().trim() === itemValue.toLowerCase().trim();
      }
      
      return dataValue == itemValue;
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


