
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [theme, setTheme] = useState('dark');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutModal(false);
    setMobileMenuOpen(false);
  };

  const handleProfileClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/tasks', label: 'Tasks' },
    { path: '/profile', label: 'Profile' },
    { path: '/settings', label: 'Settings' },
  ];

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  };

  return (
    <header className="sticky top-0 z-[100] h-16 flex items-center px-4 md:px-6 bg-[var(--bg-surface)] backdrop-blur-[16px] border-b-2 border-[var(--border-default)]">
      <div className="w-full flex items-center justify-between">
        {/* Mobile Logo & Hamburger */}
        <div className="md:hidden flex items-center gap-3 flex-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors"
            title="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-[16px] font-bold text-[var(--accent)]">TaskFlow</span>
          </Link>
        </div>

        {/* Desktop - Empty space or spacing */}
        <div className="hidden md:flex flex-1" />

        {/* RIGHT - User Actions (Both Mobile & Desktop) */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Desktop: Username Display */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-semibold">
              {getInitials(user?.name)}
            </div>
            <span className="text-[13px] text-[var(--text-secondary)]">
              {user?.name}
            </span>
          </div>

          {/* Mobile: Clickable Profile Dropdown */}
          <div className="md:hidden relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-semibold">
                {getInitials(user?.name)}
              </div>
              <svg className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] rounded-lg shadow-lg border border-[var(--border-default)] z-50">
                <div className="p-3 border-b border-[var(--border-default)]">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{user?.name}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => handleProfileClick('/profile')}
                  className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </button>
                
                <button
                  onClick={() => handleProfileClick('/settings')}
                  className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>

                <div className="border-t border-[var(--border-default)]">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop: Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Desktop: Logout */}
          <button
            onClick={handleLogout}
            className="hidden md:flex p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        onConfirm={confirmLogout}
        onClose={() => setShowLogoutModal(false)}
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
      />
    </header>
  );
};

export default Header;
