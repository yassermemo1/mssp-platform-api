import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import './ToastProvider.css';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  success: (message: string, options?: Partial<Toast>) => string;
  error: (message: string, options?: Partial<Toast>) => string;
  warning: (message: string, options?: Partial<Toast>) => string;
  info: (message: string, options?: Partial<Toast>) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  defaultDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
  defaultDuration = 5000,
  position = 'top-right',
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? defaultDuration,
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit the number of toasts
      return updated.slice(0, maxToasts);
    });

    // Auto-remove toast after duration (unless persistent)
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [generateId, defaultDuration, maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for different toast types
  const success = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast({ ...options, type: 'success', message });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast({ ...options, type: 'error', message, persistent: options?.persistent ?? true });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast({ ...options, type: 'warning', message });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast({ ...options, type: 'info', message });
  }, [addToast]);

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} position={position} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  position: string;
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, position, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className={`toast-container toast-container-${position}`}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300); // Match CSS transition duration
  }, [toast.id, onRemove]);

  const handleAction = useCallback(() => {
    if (toast.action) {
      toast.action.onClick();
      handleRemove();
    }
  }, [toast.action, handleRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        toast-item
        toast-${toast.type}
        ${isVisible ? 'toast-visible' : ''}
        ${isExiting ? 'toast-exiting' : ''}
      `.trim()}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-icon">
        {getIcon()}
      </div>
      
      <div className="toast-content">
        {toast.title && (
          <div className="toast-title">{toast.title}</div>
        )}
        <div className="toast-message">{toast.message}</div>
        
        {toast.action && (
          <button
            className="toast-action"
            onClick={handleAction}
            type="button"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      
      <button
        className="toast-close"
        onClick={handleRemove}
        type="button"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default ToastProvider; 