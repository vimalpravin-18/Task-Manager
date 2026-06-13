import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const ConfirmModal = ({
  isOpen,
  onClose,
  onCancel,    // alias for onClose (backward compat)
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
}) => {
  // Support both onClose and onCancel (some callers use onCancel)
  const handleCancel = onClose || onCancel || (() => {});

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleCancel();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      iconBg: 'bg-rose-500/15',
      iconColor: 'text-rose-400',
      confirmBtn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]',
      glow: 'rgba(239,68,68,0.15)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
    },
    warning: {
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
      confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)]',
      glow: 'rgba(245,158,11,0.15)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      iconBg: 'bg-sky-500/15',
      iconColor: 'text-sky-400',
      confirmBtn: 'bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)]',
      glow: 'rgba(14,165,233,0.15)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const config = typeConfig[type] || typeConfig.danger;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onClick={handleCancel}
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.65)' }}
    >
      <div
        className="relative w-full max-w-sm animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(15, 20, 40, 0.97)',
          border: '1.5px solid rgba(148,163,184,0.18)',
          borderRadius: '20px',
          boxShadow: `0 25px 60px rgba(0,0,0,0.7), 0 0 40px ${config.glow}`,
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Header / Icon */}
        <div className="flex flex-col items-center pt-8 px-6 pb-2">
          <div className={`w-16 h-16 rounded-2xl ${config.iconBg} ${config.iconColor} flex items-center justify-center mb-4`}
            style={{ boxShadow: `0 0 30px ${config.glow}` }}
          >
            {config.icon}
          </div>
          <h3 className="text-xl font-bold text-center text-white mb-2 tracking-tight">{title}</h3>
          <p className="text-center text-sm leading-relaxed mb-6"
            style={{ color: 'rgba(148,163,184,0.9)' }}
          >
            {message}
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(148,163,184,0.12)', margin: '0 24px' }} />

        {/* Actions */}
        <div className="flex gap-3 p-6">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: 'rgba(148,163,184,0.10)',
              color: 'rgba(226,232,240,0.85)',
              border: '1.5px solid rgba(148,163,184,0.18)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(148,163,184,0.18)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(148,163,184,0.10)';
              e.currentTarget.style.color = 'rgba(226,232,240,0.85)';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm?.(); }}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${config.confirmBtn}`}
            style={{ border: 'none' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
