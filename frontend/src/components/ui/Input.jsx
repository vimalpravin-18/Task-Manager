import React from 'react';

const Input = ({ 
  label, 
  placeholder, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  icon, 
  suffix,
  className = '',
  ...props 
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };
  
  const handleBlur = (e) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const baseInputStyles = `
    w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] 
    border-2 border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium
    placeholder:text-[var(--text-muted)] placeholder:font-normal
    focus:outline-none focus:border-[var(--accent)]
    transition-all duration-200
  `;

  const errorStyles = error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]' : 'hover:border-[var(--border-strong)]';
  const iconPadding = icon ? 'pl-12' : 'pl-4';
  const suffixPadding = suffix ? 'pr-12' : 'pr-4';

  // Make the placeholder cleaner by prioritizing explicit placeholders, or generating a clean one.
  const displayPlaceholder = placeholder !== undefined ? placeholder : (label ? `Enter your ${label.toLowerCase()}` : '');

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-[var(--text-primary)] pl-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
            {icon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={displayPlaceholder}
          className={`${baseInputStyles} ${errorStyles} ${iconPadding} ${suffixPadding}`}
          style={{
            boxShadow: isFocused ? '0 4px 12px var(--accent-light)' : 'none',
          }}
          {...props}
        />
        
        {suffix && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            {suffix}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs font-medium text-[var(--color-danger)] pl-1 flex items-center mt-0.5 animate-fadeIn">
          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
