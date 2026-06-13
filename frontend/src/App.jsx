import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import OfflineIndicator from './components/OfflineIndicator';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CreateTask from './pages/CreateTask';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <ErrorBoundary>
            <Router>
              <OfflineIndicator />
              <div className="min-h-screen bg-[var(--bg-base)]">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={
                    <PrivateRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </PrivateRoute>
                  } />
                  <Route path="/tasks" element={
                    <PrivateRoute>
                      <Layout>
                        <Tasks />
                      </Layout>
                    </PrivateRoute>
                  } />
                  <Route path="/tasks/create" element={
                    <PrivateRoute>
                      <Layout>
                        <CreateTask />
                      </Layout>
                    </PrivateRoute>
                  } />
                  <Route path="/profile" element={
                    <PrivateRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </PrivateRoute>
                  } />
                  <Route path="/settings" element={
                    <PrivateRoute>
                      <Layout>
                        <Settings />
                      </Layout>
                    </PrivateRoute>
                  } />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster 
                  position="top-right" 
                  toastOptions={{
                    style: { 
                      background: 'var(--bg-card)', 
                      color: 'var(--text-primary)', 
                      border: '2px solid var(--border-strong)', 
                      borderRadius: '12px', 
                      fontSize: '14px' 
                    },
                    success: { 
                      iconTheme: { 
                        primary: 'var(--color-success)', 
                        secondary: 'var(--bg-card)' 
                      } 
                    },
                    error: { 
                      iconTheme: { 
                        primary: 'var(--color-danger)', 
                        secondary: 'var(--bg-card)' 
                      } 
                    }
                  }} 
                />
              </div>
            </Router>
          </ErrorBoundary>
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
