/**
 * Компонент для отображения данных в виде карточек на мобильных устройствах
 * 
 * Автоматически заменяет таблицы на карточки на экранах меньше 768px.
 * Обеспечивает лучшую читаемость и удобство использования на мобильных.
 * 
 * Принципы:
 * - Responsive дизайн (таблицы на desktop, карточки на mobile)
 * - Touch-friendly элементы
 * - Оптимизация для маленьких экранов
 */

import { ReactElement, ReactNode, useEffect, useState } from 'react';

/**
 * Конфигурация колонки для карточки
 */
export interface CardColumnConfig {
  /** Ключ поля в данных */
  key: string;
  /** Заголовок колонки (для таблицы) */
  label: string;
  /** Заголовок для карточки (опционально, если отличается от label) */
  cardLabel?: string;
  /** Функция форматирования значения */
  format?: (value: any, item: any) => ReactNode;
  /** Занимает полную ширину на мобильных */
  fullWidth?: boolean;
  /** Приоритет отображения (выше = раньше) */
  priority?: number;
  /** Скрыть на мобильных */
  hideOnMobile?: boolean;
}

/**
 * Пропсы компонента MobileCardView
 */
interface MobileCardViewProps<T = Record<string, any>> {
  /** Данные для отображения */
  data: T[];
  /** Конфигурация колонок */
  columns: CardColumnConfig[];
  /** Функция рендеринга действий (кнопки редактирования, удаления) */
  renderActions?: (item: T) => ReactNode;
  /** Ключ для уникальной идентификации элемента */
  keyField?: string;
  /** Дополнительный CSS класс */
  className?: string;
  /** Пустое состояние (когда нет данных) */
  emptyState?: ReactNode;
}

/**
 * Компонент для отображения данных в виде карточек на мобильных
 * и таблицы на desktop
 */
export default function MobileCardView<T extends Record<string, any>>({
  data,
  columns,
  renderActions,
  keyField = 'id',
  className = '',
  emptyState
}: MobileCardViewProps<T>): ReactElement {
  // Сортируем колонки по приоритету
  const sortedColumns = [...columns].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Фильтруем колонки для мобильных (убираем скрытые)
  const mobileColumns = sortedColumns.filter(col => !col.hideOnMobile);

  if (data.length === 0) {
    return (
      <div className={`mobile-card-view ${className}`}>
        {emptyState || (
          <div className="alert alert-info">Данные не найдены</div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Мобильный вид (карточки) - виден только на мобильных */}
      <div className={`mobile-card-view d-md-none ${className}`}>
        {data.map((item) => {
          const itemKey = item[keyField] || item.id;
          
          return (
            <div key={itemKey} className="data-card">
              {/* Заголовок карточки */}
              <div className="data-card-header">
                <h6 className="data-card-title">
                  {item.name || item.title || `Запись #${itemKey}`}
                </h6>
              </div>

              {/* Тело карточки с данными */}
              <div className="data-card-body">
                {mobileColumns.map((column) => {
                  const value = item[column.key];
                  const formattedValue = column.format 
                    ? column.format(value, item)
                    : value ?? '-';

                  return (
                    <div
                      key={column.key}
                      className={`data-card-field ${column.fullWidth ? 'full-width' : ''}`}
                    >
                      <div className="data-card-label">
                        {column.cardLabel || column.label}
                      </div>
                      <div className="data-card-value">
                        {formattedValue}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Действия (кнопки) */}
              {renderActions && (
                <div className="data-card-actions">
                  {renderActions(item)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop вид (таблица) - виден только на desktop */}
      <div className="d-none d-md-block">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                {sortedColumns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                {renderActions && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const itemKey = item[keyField] || item.id;
                
                return (
                  <tr key={itemKey}>
                    {sortedColumns.map((column) => {
                      const value = item[column.key];
                      const formattedValue = column.format
                        ? column.format(value, item)
                        : value ?? '-';

                      return (
                        <td key={column.key}>{formattedValue}</td>
                      );
                    })}
                    {renderActions && (
                      <td>{renderActions(item)}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/**
 * Хук для определения мобильного устройства
 * 
 * ПРИМЕЧАНИЕ: Этот хук дублируется здесь для обратной совместимости.
 * Основная реализация находится в @renderer/hooks/useIsMobile.ts
 * 
 * @deprecated Используйте useIsMobile из @renderer/hooks
 */
export function useIsMobileFromCardView(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}
