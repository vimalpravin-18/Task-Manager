import React from 'react';

const Card = ({ children, hover = false, className = '', ...props }) => {
  const baseStyles = 'bg-[var(--bg-card)] border-2 border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-5';
  const hoverStyles = hover ? 'hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-strong)] hover:-translate-y-0.5 transition-all' : '';

  return (
    <div className={`${baseStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
