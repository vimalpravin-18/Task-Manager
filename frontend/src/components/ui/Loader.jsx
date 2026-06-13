import React from 'react';

const Loader = ({ size = 'md' }) => {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex items-center justify-center">
      <div 
        className={`${sizeStyles[size]} rounded-full border-[var(--border-default)] border-t-[var(--accent)] animate-spin`}
      />
    </div>
  );
};

const SkeletonCard = () => {
  return (
    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-default)] rounded-[var(--radius-lg)] p-5">
      <div className="skeleton h-4 w-3/4 mb-3" />
      <div className="skeleton h-3 w-1/2 mb-2" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  );
};

export { Loader, SkeletonCard };
export default Loader;
