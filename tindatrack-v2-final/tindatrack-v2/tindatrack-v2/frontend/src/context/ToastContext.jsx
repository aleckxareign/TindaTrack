import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ msg: '', show: false });

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2200);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
        background: '#2C2C2A', color: '#fff', padding: '10px 20px',
        borderRadius: 999, fontSize: 14, zIndex: 999, whiteSpace: 'nowrap',
        opacity: toast.show ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: 'none'
      }}>{toast.msg}</div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
