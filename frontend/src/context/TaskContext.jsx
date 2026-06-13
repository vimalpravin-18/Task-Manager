import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import taskService from '../services/taskService';
import { useAuth } from './AuthContext';
import CelebrationOverlay from '../components/ui/CelebrationOverlay';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: '',
    search: '',
    sortBy: 'date',
  });
  
  const { isAuthenticated, isInitialized, preferences } = useAuth();
  const hasFetched = useRef(false);
  const [celebration, setCelebration] = useState(null); // null | 'daily' | 'weekly'
  const celebrationShownRef = useRef({ daily: false, weekly: false });
  const reminderShownRef = useRef(new Set()); // track which task IDs already got reminder toast

  // Read notification preferences from localStorage (set in Settings page)
  const getNotifPrefs = () => {
    try {
      const raw = localStorage.getItem('notificationPrefs');
      return raw ? JSON.parse(raw) : { enableReminders: true, playGoalAudio: true, reminderLeadTime: '24', weekStartDay: 'monday' };
    } catch { return { enableReminders: true, playGoalAudio: true, reminderLeadTime: '24', weekStartDay: 'monday' }; }
  };

  // Synthesize alert tone — same engine as Settings preview
  const playCelebrationTone = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) { /* browser may block autoplay — silent fail */ }
  };

  const normTask = (t) => ({
    ...t,
    id: t.id ?? t._id,
    // Ensure both camelCase and snake_case are available for dates
    due_date: t.due_date ?? t.dueDate ?? null,
    dueDate: t.dueDate ?? t.due_date ?? null,
    created_at: t.created_at ?? t.createdAt ?? null,
    createdAt: t.createdAt ?? t.created_at ?? null,
    updated_at: t.updated_at ?? t.updatedAt ?? null,
    updatedAt: t.updatedAt ?? t.updated_at ?? null,
  });

  const getTasks = useCallback(async (taskFilters = {}) => {
    try {
      setLoading(true);
      const response = await taskService.getTasks(taskFilters);
      const raw = response.data.data || [];
      const normalized = raw.map(normTask);
      setTasks(normalized);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tasks only once on mount when authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated && !hasFetched.current) {
      hasFetched.current = true;
      getTasks();
    }
  }, [isInitialized, isAuthenticated, getTasks]);

  const createTask = useCallback(async (taskData) => {
    try {
      setLoading(true);
      const response = await taskService.createTask(taskData);
      const normalized = normTask(response.data.data);
      setTasks(prevTasks => [normalized, ...prevTasks]);
      setError(null);
      return { success: true, data: normalized };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
      return { success: false, error: err.response?.data?.message || 'Failed to create task' };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (id, taskData) => {
    try {
      setLoading(true);
      const response = await taskService.updateTask(id, taskData);
      const normalized = normTask(response.data.data);
      const strId = String(id);
      setTasks(prevTasks => prevTasks.map(task => 
        String(task.id) === strId ? normalized : task
      ));
      setError(null);
      return { success: true, data: normalized };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
      return { success: false, error: err.response?.data?.message || 'Failed to update task' };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      setLoading(true);
      await taskService.deleteTask(id);
      const strId = String(id);
      setTasks(prevTasks => prevTasks.filter(task => String(task.id) !== strId));
      setError(null);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
      return { success: false, error: err.response?.data?.message || 'Failed to delete task' };
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleTaskStatus = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      return await updateTask(id, { status: newStatus });
    }
  }, [tasks, updateTask]);

  const handleSetFilters = useCallback((newFilters) => {
    setFilters(prev => {
      const updatedFilters = { ...prev, ...newFilters };
      getTasks(updatedFilters);
      return updatedFilters;
    });
  }, [getTasks]);

  const clearCompletedTasks = useCallback(async () => {
    try {
      setLoading(true);
      await taskService.clearCompletedTasks();
      setTasks(prevTasks => prevTasks.filter(task => task.status !== 'completed'));
      setError(null);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clear completed tasks');
      return { success: false, error: err.response?.data?.message || 'Failed to clear completed tasks' };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAllTasks = useCallback(async () => {
    try {
      setLoading(true);
      await taskService.clearAllTasks();
      setTasks([]);
      setError(null);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clear all tasks');
      return { success: false, error: err.response?.data?.message || 'Failed to clear all tasks' };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ── Celebration Calculations & Logic ──
  const dailyGoal = preferences?.daily_task_goal || 5;
  const weeklyGoal = preferences?.weekly_task_goal || 20;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tasksCompletedToday = tasks.filter(task => {
    if (!task.updatedAt) return false;
    const taskDate = new Date(task.updatedAt);
    taskDate.setHours(0, 0, 0, 0);
    return task.status === 'completed' && taskDate.getTime() === todayStart.getTime();
  }).length;

  const getTasksCompletedThisWeek = () => {
    const notifPrefs = getNotifPrefs();
    const startDay = notifPrefs.weekStartDay === 'sunday' ? 0 : 1; // 0 = Sunday, 1 = Monday
    const today = new Date();
    const day = today.getDay();
    const weekStart = new Date(today);
    // Calculate start of week based on user preference
    const diff = startDay === 1
      ? today.getDate() - day + (day === 0 ? -6 : 1)  // Monday start
      : today.getDate() - day;                          // Sunday start
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    return tasks.filter(task => {
      if (!task.updatedAt || task.status !== 'completed') return false;
      const taskDate = new Date(task.updatedAt);
      return taskDate >= weekStart;
    }).length;
  };

  const tasksCompletedThisWeek = getTasksCompletedThisWeek();

  useEffect(() => {
    if (!isAuthenticated || !dailyGoal || !weeklyGoal || tasks.length === 0) return;

    const todayKey = new Date().toISOString().slice(0, 10);
    const weekKey = (() => {
      const d = new Date();
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
      return monday.toISOString().slice(0, 10);
    })();

    const storedDaily  = localStorage.getItem('celebratedDaily');
    const storedWeekly = localStorage.getItem('celebratedWeekly');

    const dailyDone  = tasksCompletedToday  >= dailyGoal  && dailyGoal  > 0;
    const weeklyDone = tasksCompletedThisWeek >= weeklyGoal && weeklyGoal > 0;

    // Show weekly first (higher achievement), otherwise daily
    if (weeklyDone && storedWeekly !== weekKey && !celebrationShownRef.current.weekly) {
      celebrationShownRef.current.weekly = true;
      const delay = setTimeout(() => {
        setCelebration('weekly');
        // Play audio if user has it enabled
        if (getNotifPrefs().playGoalAudio) playCelebrationTone();
      }, 800);
      return () => clearTimeout(delay);
    } else if (dailyDone && storedDaily !== todayKey && !celebrationShownRef.current.daily) {
      celebrationShownRef.current.daily = true;
      const delay = setTimeout(() => {
        setCelebration('daily');
        if (getNotifPrefs().playGoalAudio) playCelebrationTone();
      }, 800);
      return () => clearTimeout(delay);
    }
  }, [tasksCompletedToday, tasksCompletedThisWeek, dailyGoal, weeklyGoal, isAuthenticated, tasks.length]);

  // ── Due Date Reminder Toasts ──
  // Fires when enableReminders is ON and tasks are due within the lead-time window
  useEffect(() => {
    if (!isAuthenticated || tasks.length === 0) return;
    const prefs = getNotifPrefs();
    if (!prefs.enableReminders) return;

    const leadHours = parseInt(prefs.reminderLeadTime || '24', 10);
    const now = new Date();
    const windowEnd = new Date(now.getTime() + leadHours * 60 * 60 * 1000);

    tasks.forEach(task => {
      if (task.status === 'completed') return;
      const due = task.dueDate ?? task.due_date;
      if (!due) return;
      const dueDate = new Date(due);
      dueDate.setHours(23, 59, 59, 0);

      // Only fire if due date falls within the lead-time window and not already shown
      if (dueDate >= now && dueDate <= windowEnd && !reminderShownRef.current.has(task.id)) {
        reminderShownRef.current.add(task.id);
        const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        const msg = daysLeft === 0
          ? `⏰ "${task.title}" is due today!`
          : `📅 "${task.title}" is due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
        // Small delay so toasts don't all fire at once on page load
        setTimeout(() => {
          import('react-hot-toast').then(({ default: toast }) => toast(msg, {
            duration: 5000,
            icon: daysLeft === 0 ? '🔴' : '🟡',
          }));
        }, 1500 + reminderShownRef.current.size * 600);
      }
    });
  }, [tasks, isAuthenticated]);

  const handleDismissCelebration = () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const weekKey = (() => {
      const d = new Date();
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
      return monday.toISOString().slice(0, 10);
    })();
    if (celebration === 'daily')  localStorage.setItem('celebratedDaily',  todayKey);
    if (celebration === 'weekly') localStorage.setItem('celebratedWeekly', weekKey);
    setCelebration(null);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        filters,
        getTasks,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        setFilters: handleSetFilters,
        clearError,
        clearCompletedTasks,
        clearAllTasks,
      }}
    >
      {children}
      {celebration && (
        <CelebrationOverlay type={celebration} onDismiss={handleDismissCelebration} />
      )}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
