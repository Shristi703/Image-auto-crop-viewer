import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ toasts = [], onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        return (
          <div
            key={t.id}
            className={`toast ${
              isSuccess ? 'toast-success' : isError ? 'toast-error' : ''
            }`}
          >
            {isSuccess && (
              <CheckCircle2 size={20} color="var(--emerald)" style={{ flexShrink: 0 }} />
            )}
            {isError && (
              <AlertCircle size={20} color="var(--rose)" style={{ flexShrink: 0 }} />
            )}
            {!isSuccess && !isError && (
              <Info size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
            )}

            <div className="toast-content">
              {t.title && <div className="toast-title">{t.title}</div>}
              <div className="toast-message">{t.message}</div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-light)',
                padding: 2,
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
