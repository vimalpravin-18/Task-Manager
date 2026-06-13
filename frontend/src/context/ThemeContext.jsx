import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || 'dark';
    // Set theme synchronously on initial render
    window.document.documentElement.setAttribute('data-theme', initialTheme);
    if (initialTheme === 'dark' || (initialTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      window.document.documentElement.classList.add('dark');
    }
    return initialTheme;
  });
  const [accentColor, setAccentColorState] = useState(() => {
    const savedAccent = localStorage.getItem('accentColor');
    const initialAccent = savedAccent || '#7c6ff7';
    // Set accent color synchronously on initial render
    window.document.documentElement.style.setProperty('--accent', initialAccent);
    window.document.documentElement.style.setProperty('--accent-light', initialAccent + '26');
    return initialAccent;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--accent', accentColor);
    const lightHex = accentColor + '26';
    root.style.setProperty('--accent-light', lightHex);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setTheme = (name) => {
    setThemeState(name);
  };

  const setAccentColor = (hex) => {
    setAccentColorState(hex);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
