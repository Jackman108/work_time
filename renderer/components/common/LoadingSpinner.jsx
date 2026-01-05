/**
 * Компонент индикатора загрузки
 * Используется для отображения состояния загрузки операций
 * Следует принципу Single Responsibility
 * 
 * @module renderer/components/common/LoadingSpinner
 */

import React from 'react';

/**
 * Классы размеров спиннера (вынесено за компонент для оптимизации)
 */
const SIZE_CLASSES = {
  sm: 'spinner-border-sm',
  md: '',
  lg: ''
};

/**
 * Размеры спиннера (вынесено за компонент для оптимизации)
 */
const SPINNER_SIZES = {
  sm: { width: '1rem', height: '1rem' },
  md: { width: '2rem', height: '2rem' },
  lg: { width: '3rem', height: '3rem' }
};

/**
 * Индикатор загрузки
 * @param {Object} props - Свойства компонента
 * @param {string} [props.size='md'] - Размер спиннера (sm, md, lg)
 * @param {string} [props.text='Загрузка...'] - Текст под спиннером
 * @param {boolean} [props.fullScreen=false] - Показывать на весь экран
 * @param {string} [props.className=''] - Дополнительные CSS классы
 */
export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Загрузка...', 
  fullScreen = false,
  className = '' 
}) {

  const spinner = (
    <div className={`d-flex flex-column align-items-center justify-content-center ${className}`}>
      <div 
        className={`spinner-border text-primary ${SIZE_CLASSES[size] || SIZE_CLASSES.md}`}
        style={SPINNER_SIZES[size] || SPINNER_SIZES.md}
        role="status"
      >
        <span className="visually-hidden">Загрузка...</span>
      </div>
      {text && (
        <span className="mt-2 text-muted">{text}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9998
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Инлайн индикатор загрузки (для кнопок и небольших элементов)
 * @param {Object} props - Свойства компонента
 * @param {string} props.className - Дополнительные CSS классы
 */
export function InlineSpinner({ className = '' }) {
  return (
    <span className={`spinner-border spinner-border-sm me-2 ${className}`} role="status">
      <span className="visually-hidden">Загрузка...</span>
    </span>
  );
}

