import React, { useEffect, useState } from 'react';

interface ToastProps {
  id: number;
  message: string;
  type: 'success' | 'error';
  onDismiss?: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      if (onDismiss) {
        setTimeout(() => onDismiss(id), 300);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const baseClasses = "flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-lg dark:text-gray-400 dark:bg-gray-800 transition-all duration-300";
  const typeClasses = {
    success: 'text-green-500 bg-green-100 dark:bg-gray-700 dark:text-green-200',
    error: 'text-red-500 bg-red-100 dark:bg-gray-700 dark:text-red-200',
  };
  const icon = {
    success: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>,
    error: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
  };

  return (
    <div className={`${baseClasses} ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`} role="alert">
      <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${typeClasses[type]}`}>
        {icon[type]}
      </div>
      <div className="ml-3 text-sm font-normal">{message}</div>
    </div>
  );
};

export default Toast;
