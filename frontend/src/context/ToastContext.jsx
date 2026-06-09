import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 99999,
        display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380,
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 10,
            animation: 'slideIn 0.25s ease-out',
            background: t.type === 'success' ? '#ecfdf5' : t.type === 'error' ? '#fef2f2' : '#fffbeb',
            color: t.type === 'success' ? '#065f46' : t.type === 'error' ? '#b91c1c' : '#92400e',
            border: `1px solid ${t.type === 'success' ? '#a7f3d0' : t.type === 'error' ? '#fecaca' : '#fde68a'}`,
          }}>
            <i className={`fa-solid ${t.type === 'success' ? 'fa-check-circle' : t.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`} style={{ fontSize: 16 }}></i>
            {t.message}
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, fontSize: 14 }}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
