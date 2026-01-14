/**
 * Компонент индикатора загрузки
 */

import { ReactElement } from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  text?: string;
  size?: SpinnerSize;
  className?: string;
}

export default function LoadingSpinner({ 
  fullScreen = false, 
  text = 'Загрузка...', 
  size = 'md',
  className = ''
}: LoadingSpinnerProps): ReactElement {
  const sizeClasses: Record<SpinnerSize, string> = {
    sm: 'spinner-border-sm',
    md: '',
    lg: ''
  };

  const spinnerSize: Record<SpinnerSize, { width: string; height: string }> = {
    sm: { width: '1rem', height: '1rem' },
    md: { width: '2rem', height: '2rem' },
    lg: { width: '3rem', height: '3rem' }
  };

  const spinner = (
    <div className={`d-flex flex-column align-items-center justify-content-center ${className}`}>
      <div 
        className={`spinner-border text-primary ${sizeClasses[size]}`}
        style={spinnerSize[size]}
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
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}


