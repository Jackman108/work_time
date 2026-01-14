/**
 * Хук для определения мобильного устройства
 * 
 * Определяет, является ли текущее устройство мобильным (ширина < 768px).
 * Автоматически обновляется при изменении размера окна.
 * 
 * Использование:
 * ```tsx
 * const isMobile = useIsMobile();
 * const chartHeight = isMobile ? 250 : 300;
 * ```
 */

import { useState, useEffect } from 'react';

/**
 * Хук для определения мобильного устройства
 * @returns {boolean} true, если ширина экрана меньше 768px
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // Проверяем при первой загрузке
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Проверяем сразу
    checkMobile();

    // Подписываемся на изменения размера окна
    window.addEventListener('resize', checkMobile);

    // Очистка при размонтировании
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}

/**
 * Хук для получения текущей ширины экрана
 * @returns {number} Текущая ширина окна в пикселях
 */
export function useWindowWidth(): number {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1024; // Значение по умолчанию
  });

  useEffect(() => {
    const updateWidth = () => {
      setWidth(window.innerWidth);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  return width;
}
