/**
 * Мобильное модальное окно для форм
 * 
 * На мобильных устройствах формы отображаются в полноэкранном модальном окне
 * для лучшего UX и удобства ввода данных.
 * 
 * Принципы:
 * - Полноэкранный режим на мобильных
 * - Обычное модальное окно на desktop
 * - Touch-friendly элементы
 * - Плавная анимация
 */

import { ReactElement, ReactNode, useEffect } from 'react';

interface MobileFormModalProps {
  /** Открыто ли модальное окно */
  isOpen: boolean;
  /** Функция закрытия */
  onClose: () => void;
  /** Заголовок */
  title: string;
  /** Дети (содержимое формы) */
  children: ReactNode;
  /** Дополнительный CSS класс */
  className?: string;
}

export default function MobileFormModal({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}: MobileFormModalProps): ReactElement | null {
  // Предотвращаем скролл body когда модальное окно открыто
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Desktop модальное окно (Bootstrap modal) */}
      <div 
        className={`modal fade d-none d-md-block ${isOpen ? 'show' : ''}`}
        style={{ display: isOpen ? 'block' : 'none' }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          // Закрываем при клике на overlay
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className={`modal-content ${className}`}>
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Закрыть"
              ></button>
            </div>
            <div className="modal-body">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Мобильное полноэкранное окно */}
      <div 
        className={`mobile-form-modal d-md-none ${isOpen ? 'open' : ''} ${className}`}
        onClick={(e) => {
          // Закрываем при клике на overlay
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="mobile-form-content">
          {/* Заголовок с кнопкой закрытия */}
          <div className="mobile-form-header">
            <h5 className="mb-0">{title}</h5>
            <button
              type="button"
              className="btn btn-link text-dark"
              onClick={onClose}
              aria-label="Закрыть"
              style={{ 
                minWidth: '44px', 
                minHeight: '44px',
                padding: '0.5rem',
                fontSize: '1.5rem'
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Тело формы */}
          <div className="mobile-form-body">
            {children}
          </div>
        </div>
      </div>

      {/* Overlay для мобильного окна */}
      {isOpen && (
        <div 
          className="modal-backdrop fade show d-md-none"
          onClick={onClose}
        ></div>
      )}

      {/* Стили для мобильного модального окна */}
      <style>{`
        .mobile-form-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1055;
          display: flex;
          align-items: flex-end;
          pointer-events: none;
        }

        .mobile-form-modal.open {
          pointer-events: auto;
        }

        .mobile-form-content {
          width: 100%;
          max-height: 90vh;
          background: white;
          border-radius: 1rem 1rem 0 0;
          display: flex;
          flex-direction: column;
          transform: translateY(100%);
          transition: transform 0.3s ease;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
        }

        .mobile-form-modal.open .mobile-form-content {
          transform: translateY(0);
        }

        .mobile-form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
          border-radius: 1rem 1rem 0 0;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .mobile-form-body {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          -webkit-overflow-scrolling: touch;
        }

        /* Улучшения для iOS */
        @supports (-webkit-touch-callout: none) {
          .mobile-form-body {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }

        /* Отключение анимации для пользователей с prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .mobile-form-content {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}
