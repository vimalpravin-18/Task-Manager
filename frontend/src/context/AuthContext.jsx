import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

const AuthContext = createContext();

// Token expiry check - JWT tokens typically expire after 24 hours (86400000 ms)
const TOKEN_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

const isTokenExpired = (tokenTimestamp) => {
  if (!tokenTimestamp) return true;
  return Date.now() - tokenTimestamp > TOKEN_EXPIRY_TIME;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState(null);

  // Load user from token on mount - with expiry check
  useEffect(() => {
    const loadUser = async () => {
      const savedToken = localStorage.getItem('token');
      const tokenTimestamp = localStorage.getItem('tokenTimestamp');
      
      if (savedToken && !isTokenExpired(tokenTimestamp)) {
        try {
          authService.setAuthToken(savedToken);
          const response = await authService.getCurrentUser();
          setUser(response.data.data || response.data);
          setToken(savedToken);
          setIsAuthenticated(true);
          
          // Load user preferences
          const prefsResponse = await authService.getPreferences();
          setPreferences(prefsResponse.data.data);
        } catch (err) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('tokenTimestamp');
          authService.setAuthToken(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      } else {
        // Token doesn't exist or is expired
        if (savedToken) {
          localStorage.removeItem('token');
          localStorage.removeItem('tokenTimestamp');
        }
        authService.setAuthToken(null);
        setToken(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
      setIsInitialized(true);
    };

    loadUser();
  }, []);

  const login = useCallback(async (email, password, rememberMe = true) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('tokenTimestamp', Date.now().toString());
      
      authService.setAuthToken(response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      setError(null);
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setIsAuthenticated(false);
      return { success: false, error: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password, rememberMe = true) => {
    try {
      setLoading(true);
      const response = await authService.register(name, email, password);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('tokenTimestamp', Date.now().toString());
      
      authService.setAuthToken(response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      setError(null);
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setIsAuthenticated(false);
      return { success: false, error: err.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Authenticate with Firebase Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // 2. Send email and name to our backend to issue our JWT
      const response = await authService.socialLogin(user.displayName, user.email);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('tokenTimestamp', Date.now().toString());
      
      authService.setAuthToken(response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      setError(null);
      
      return { success: true };
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Google Login failed');
      setIsAuthenticated(false);
      return { success: false, error: err.response?.data?.message || err.message || 'Google Login failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenTimestamp');
    authService.setAuthToken(null);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      const response = await authService.savePreferences(newPreferences);
      setPreferences(response.data.data);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to save preferences' };
    }
  }, []);

  const updateProfile = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await authService.updateProfile(userData);
      setUser(response.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update profile' };
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (passwordData) => {
    try {
      setLoading(true);
      await authService.updatePassword(passwordData);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update password' };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      setLoading(true);
      await authService.deleteAccount();
      logout();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to delete account' };
    } finally {
      setLoading(false);
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        isInitialized,
        user,
        token,
        error,
        preferences,
        login,
        register,
        loginWithGoogle,
        logout,
        clearError,
        updatePreferences,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
