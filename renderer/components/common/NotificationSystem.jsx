/**
 * Система уведомлений (Toast) для приложения
 * Реализует паттерн Observer для управления уведомлениями
 * Следует принципам Single Responsibility и Open/Closed
 * 
 * @module renderer/components/common/NotificationSystem
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Типы уведомлений
 */
export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Классы для типов уведомлений (вынесено за компонент для оптимизации)
 */
const NOTIFICATION_TYPE_CLASSES = {
  [NotificationType.SUCCESS]: 'alert-success',
  [NotificationType.ERROR]: 'alert-danger',
  [NotificationType.WARNING]: 'alert-warning',
  [NotificationType.INFO]: 'alert-info'
};

/**
 * Иконки для типов уведомлений (вынесено за компонент для оптимизации)
 */
const NOTIFICATION_ICONS = {
  [NotificationType.SUCCESS]: '✅',
  [NotificationType.ERROR]: '❌',
  [NotificationType.WARNING]: '⚠️',
  [NotificationType.INFO]: 'ℹ️'
};

/**
 * Контекст для управления уведомлениями
 */
const NotificationContext = createContext(null);

/**
 * Провайдер контекста уведомлений
 * Управляет состоянием всех уведомлений в приложении
 */
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  /**
   * Добавить уведомление
   * @param {string} message - Текст уведомления
   * @param {string} type - Тип уведомления (success, error, warning, info)
   * @param {number} duration - Длительность отображения в миллисекундах (по умолчанию 5000)
   */
  const showNotification = useCallback((message, type = NotificationType.INFO, duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // Автоматическое удаление через указанное время
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  /**
   * Удалить уведомление
   * @param {number} id - ID уведомления
   */
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /**
   * Очистить все уведомления
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Вспомогательные методы для разных типов уведомлений
   */
  const showSuccess = useCallback((message, duration = 5000) => {
    return showNotification(message, NotificationType.SUCCESS, duration);
  }, [showNotification]);

  const showError = useCallback((message, duration = 7000) => {
    return showNotification(message, NotificationType.ERROR, duration);
  }, [showNotification]);

  const showWarning = useCallback((message, duration = 6000) => {
    return showNotification(message, NotificationType.WARNING, duration);
  }, [showNotification]);

  const showInfo = useCallback((message, duration = 5000) => {
    return showNotification(message, NotificationType.INFO, duration);
  }, [showNotification]);

  const value = {
    notifications,
    showNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

/**
 * Хук для использования системы уведомлений
 * @returns {Object} Методы для работы с уведомлениями
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

/**
 * Контейнер для отображения уведомлений
 * Автоматически отображает все активные уведомления
 */
function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div 
      className="notification-container position-fixed top-0 end-0 p-3"
      style={{ 
        zIndex: 9999,
        maxWidth: '400px',
        pointerEvents: 'none'
      }}
    >
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

/**
 * Компонент отдельного уведомления
 * @param {Object} props - Пропсы компонента
 * @param {Types.Notification} props.notification - Данные уведомления
 * @param {Function} props.onClose - Обработчик закрытия
 * @param {string} [props.key] - Ключ React (не передается в компонент)
 */
function Notification({ notification, onClose }) {
  const { message, type } = notification;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Анимация появления
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const getNotificationClass = () => {
    const baseClass = 'alert alert-dismissible fade show shadow-sm mb-2';
    return `${baseClass} ${NOTIFICATION_TYPE_CLASSES[type] || NOTIFICATION_TYPE_CLASSES[NotificationType.INFO]}`;
  };

  const getIcon = () => {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS[NotificationType.INFO];
  };

  return (
    <div
      className={getNotificationClass()}
      style={{
        pointerEvents: 'auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'all 0.3s ease-in-out',
        minWidth: '300px'
      }}
      role="alert"
    >
      <strong>{getIcon()} </strong>
      {message}
      <button
        type="button"
        className="btn-close"
        onClick={onClose}
        aria-label="Закрыть"
      ></button>
    </div>
  );
}

