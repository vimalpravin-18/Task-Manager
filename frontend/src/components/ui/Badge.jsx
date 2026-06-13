import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
}) => {
  const variants = {
    default: 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)]',
    success: 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20',
    danger: 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20',
    accent: 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20',
    high: 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20',
    medium: 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20',
    low: 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${variants[variant]} ${sizes[size]} border-2`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current ${variant === 'high' ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
