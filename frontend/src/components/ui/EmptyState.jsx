import React from 'react';
import Button from './Button';

const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {icon && (
        <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border)]">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-[var(--text-secondary)] max-w-md mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button type="button" onClick={onAction} className="btn-gradient px-6 py-3 rounded-lg text-white font-medium">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
