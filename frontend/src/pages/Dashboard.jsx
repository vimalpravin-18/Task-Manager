import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTask } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const useCountUp = (end, duration = 800) => {
  const [count, setCount] = useState(0);
  const endRef = useRef(end);
  const durationRef = useRef(duration);

  useEffect(() => {
    endRef.current = end;
  }, [end]);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / durationRef.current, 1);
      
      setCount(Math.floor(percentage * endRef.current));

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return count;
};

const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        if (options.triggerOnce) {
          observer.unobserve(entry.target);
        }
      } else if (!options.triggerOnce) {
        setIsIntersecting(false);
      }
    }, { threshold: 0.1, ...options });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options.triggerOnce, options.threshold]);

  return [ref, isIntersecting];
};

const Dashboard = () => {
  const { tasks, getTasks, loading } = useTask();
  const { user, preferences, updatePreferences } = useAuth();
  const navigate = useNavigate();
  const [activityFeed, setActivityFeed] = useState([]);

  // Scroll animations
  const [goalsRef, goalsVisible] = useIntersectionObserver({ triggerOnce: true, threshold: 0.05 });
  const [statsRef, statsVisible] = useIntersectionObserver({ triggerOnce: true, threshold: 0.05 });
  const [chartsRef, chartsVisible] = useIntersectionObserver({ triggerOnce: true, threshold: 0.05 });

  // Productivity Goals State
  const dailyGoal = preferences?.daily_task_goal || 5;
  const weeklyGoal = preferences?.weekly_task_goal || 20;

  const [isEditDailyOpen, setIsEditDailyOpen] = useState(false);
  const [isEditWeeklyOpen, setIsEditWeeklyOpen] = useState(false);
  const [tempDailyGoal, setTempDailyGoal] = useState(dailyGoal);
  const [tempWeeklyGoal, setTempWeeklyGoal] = useState(weeklyGoal);
  const [updatingGoal, setUpdatingGoal] = useState(false);

  useEffect(() => {
    setTempDailyGoal(dailyGoal);
  }, [dailyGoal]);

  useEffect(() => {
    setTempWeeklyGoal(weeklyGoal);
  }, [weeklyGoal]);

  const handleSaveDailyGoal = async () => {
    setUpdatingGoal(true);
    const res = await updatePreferences({ ...preferences, daily_task_goal: parseInt(tempDailyGoal, 10) });
    if (res.success) {
      toast.success('Daily task goal updated!');
      setIsEditDailyOpen(false);
    } else {
      toast.error('Failed to update goal');
    }
    setUpdatingGoal(false);
  };

  const handleSaveWeeklyGoal = async () => {
    setUpdatingGoal(true);
    const res = await updatePreferences({ ...preferences, weekly_task_goal: parseInt(tempWeeklyGoal, 10) });
    if (res.success) {
      toast.success('Weekly productivity goal updated!');
      setIsEditWeeklyOpen(false);
    } else {
      toast.error('Failed to update goal');
    }
    setUpdatingGoal(false);
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(task => task.status === 'completed').length,
    inprogress: tasks.filter(task => task.status === 'inprogress').length,
    pending: tasks.filter(task => task.status === 'pending').length,
  };

  // Daily Progress Tracker
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tasksCompletedToday = tasks.filter(task => {
    if (!task.updatedAt) return false;
    const taskDate = new Date(task.updatedAt);
    taskDate.setHours(0, 0, 0, 0);
    return task.status === 'completed' && taskDate.getTime() === today.getTime();
  }).length;

  const tasksDueToday = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime() && task.status !== 'completed';
  }).length;

  // Weekly Progress Tracker (Monday 00:00 to now)
  const getTasksCompletedThisWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    return tasks.filter(task => {
      if (!task.updatedAt || task.status !== 'completed') return false;
      const taskDate = new Date(task.updatedAt);
      return taskDate >= monday;
    }).length;
  };
  const tasksCompletedThisWeek = getTasksCompletedThisWeek();

  const dailyProgress = stats.total > 0 ? Math.round((tasksCompletedToday / stats.total) * 100) : 0;

  // Streak System - Calculate consecutive days with completed tasks
  const calculateStreak = () => {
    const completedTasks = tasks.filter(task => task.status === 'completed' && task.updatedAt);
    if (completedTasks.length === 0) return 0;

    // Get unique dates when tasks were completed
    const completedDates = [...new Set(
      completedTasks.map(task => {
        const date = new Date(task.updatedAt);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    )].sort((a, b) => b - a);

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    let currentTimestamp = currentDate.getTime();

    for (let i = 0; i < completedDates.length; i++) {
      if (completedDates[i] === currentTimestamp) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
        currentTimestamp = currentDate.getTime();
      } else if (completedDates[i] === currentTimestamp) {
        // Continue checking previous days
        currentDate.setDate(currentDate.getDate() - 1);
        currentTimestamp = currentDate.getTime();
        i--; // Check the same date again
      } else {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();

  // Chart data
  const statusData = [
    { name: 'Completed', value: stats.completed, color: '#22c55e' },
    { name: 'In Progress', value: stats.inprogress, color: '#38bdf8' },
    { name: 'Pending', value: stats.pending, color: '#f59e0b' },
  ];

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#22c55e' },
  ];

  // Dynamic values that start at 0 and scale up when scrolled into view
  const activeStatusData = chartsVisible
    ? statusData
    : statusData.map(d => ({ ...d, value: 0 }));

  const activePriorityData = chartsVisible
    ? priorityData
    : priorityData.map(d => ({ ...d, value: 0 }));

  const animatedTotal = useCountUp(stats.total);
  const animatedCompleted = useCountUp(stats.completed);
  const animatedInprogress = useCountUp(stats.inprogress);
  const animatedPending = useCountUp(stats.pending);

  useEffect(() => {
    if (user) {
      getTasks();
      
      // Check for tasks due soon (within next 24 hours)
      const checkReminders = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const tasksDueSoon = tasks.filter(task => {
            if (!task.dueDate || task.status === 'completed') return false;
            const dueDate = new Date(task.dueDate);
            return dueDate <= tomorrow && dueDate >= now;
          });

        if (tasksDueSoon.length > 0) {
          toast(`You have ${tasksDueSoon.length} task(s) due soon! 📅`, {
            duration: 5000,
            icon: '⏰',
          });
        }
      };

      // Check reminders on mount and every 5 minutes
      checkReminders();
      const reminderInterval = setInterval(checkReminders, 5 * 60 * 1000);
      
      return () => clearInterval(reminderInterval);
    }
  }, [user, getTasks]);

  useEffect(() => {
    const savedFeed = localStorage.getItem('activityFeed');
    if (savedFeed) {
      setActivityFeed(JSON.parse(savedFeed));
    }
  }, []);

  const addActivity = (action, taskTitle) => {
    const newActivity = {
      id: Date.now(),
      action,
      taskTitle,
      timestamp: new Date().toISOString(),
    };
    const updatedFeed = [newActivity, ...activityFeed].slice(0, 10);
    setActivityFeed(updatedFeed);
    localStorage.setItem('activityFeed', JSON.stringify(updatedFeed));
  };

    const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const recentTasks = tasks.slice(0, 5);
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 animate-fadeSlideUp">
      {/* Section 1 - Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2 relative">
            <span>{getGreeting()},</span>
            <span className="bg-gradient-to-r from-[var(--accent)] to-purple-400 bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span>
            <span className="animate-breathe inline-block origin-bottom-right">👋</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Here's your productivity overview for today</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => navigate('/tasks', { state: { openCreate: true } })}
            className="px-6 py-3"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => navigate('/tasks')}
            className="px-6 py-3"
          >
            View All Tasks
          </Button>
        </div>
      </div>

      {/* Section 1.5 - Productivity Goals */}
      <div 
        ref={goalsRef}
        className={`mb-8 transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) transform ${
          goalsVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-[0.98] pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Productivity Goals</h2>
          <span className="text-xs text-[var(--text-muted)]">Resets daily &amp; weekly</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* ── Daily Goal Card ── */}
          <Card className="relative overflow-hidden p-6 glass-card card-lift border border-[var(--border-default)]">
            {/* Decorative blob */}
            <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[var(--accent)]/10 blur-2xl transition-all group-hover:scale-110" />

            {/* Header row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Daily Target</p>
                  <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">Task Goal</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditDailyOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-all cursor-pointer"
                title="Edit Daily Goal"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </button>
            </div>

            {/* Body: ring + text side by side */}
            <div className="flex items-center gap-6">
              {/* SVG Ring */}
              <div className="relative flex-shrink-0 w-[88px] h-[88px] transition-transform duration-500 hover:scale-105">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                  <defs>
                    <linearGradient id="dailyGreenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                    <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <circle cx="44" cy="44" r="36" fill="none" stroke="var(--border)" strokeWidth="6" />
                  <circle
                    cx="44"
                    cy="44"
                    r="36"
                    fill="none"
                    stroke="url(#dailyGreenGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - Math.min((goalsVisible ? tasksCompletedToday : 0) / (dailyGoal || 1), 1))}`}
                    className={`transition-all duration-[1500ms] cubic-bezier(0.16, 1, 0.3, 1) ${
                      tasksCompletedToday >= dailyGoal ? 'animate-[pulse_2s_infinite]' : ''
                    }`}
                    filter="url(#greenGlow)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[18px] font-black text-[var(--text-primary)] leading-none">
                    {dailyGoal > 0 ? Math.round(((goalsVisible ? tasksCompletedToday : 0) / dailyGoal) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Text stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-[36px] font-black leading-none text-[var(--text-primary)]">{goalsVisible ? tasksCompletedToday : 0}</span>
                  <span className="text-sm font-medium text-[var(--text-muted)]">/ {dailyGoal}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-3">tasks completed today</p>

                {/* Mini bar */}
                <div className="w-full h-1.5 rounded-full bg-[var(--bg-input)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-purple-400 transition-all duration-[1200ms] cubic-bezier(0.16, 1, 0.3, 1)"
                    style={{ width: `${Math.min(((goalsVisible ? tasksCompletedToday : 0) / (dailyGoal || 1)) * 100, 100)}%` }}
                  />
                </div>

                {tasksCompletedToday >= dailyGoal ? (
                  <p className="mt-2 text-xs font-semibold text-[var(--color-success)] flex items-center gap-1">
                    <span>🎉</span> Goal achieved! Great job!
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {dailyGoal - tasksCompletedToday} more to hit your target
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* ── Weekly Goal Card ── */}
          <Card className="relative overflow-hidden p-6 glass-card card-lift border border-[var(--border-default)]">
            {/* Decorative blob */}
            <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-purple-500/10 blur-2xl transition-all group-hover:scale-110" />

            {/* Header row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Weekly Progress</p>
                  <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">Productivity Goal</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditWeeklyOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-500 bg-purple-500/10 hover:bg-purple-500/20 transition-all cursor-pointer"
                title="Edit Weekly Goal"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </button>
            </div>

            {/* Body: full-width stat + bar */}
            <div>
              {/* Count row */}
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[36px] font-black leading-none text-[var(--text-primary)]">{goalsVisible ? tasksCompletedThisWeek : 0}</span>
                    <span className="text-sm font-medium text-[var(--text-muted)]">/ {weeklyGoal} tasks</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">completed this week</p>
                </div>
                <span className={`text-sm font-black px-3 py-1 rounded-full ${
                  tasksCompletedThisWeek >= weeklyGoal
                    ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                    : 'bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
                }`}>
                  {weeklyGoal > 0 ? Math.round(((goalsVisible ? tasksCompletedThisWeek : 0) / weeklyGoal) * 100) : 0}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-[var(--bg-input)] overflow-hidden border border-[var(--border-default)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-purple-500 transition-all duration-[1200ms] cubic-bezier(0.16, 1, 0.3, 1)"
                  style={{ width: `${Math.min(((goalsVisible ? tasksCompletedThisWeek : 0) / (weeklyGoal || 1)) * 100, 100)}%` }}
                />
              </div>

              {/* Step indicators */}
              <div className="flex justify-between mt-1.5 px-0.5">
                {[0, 25, 50, 75, 100].map(mark => (
                  <span key={mark} className="text-[10px] text-[var(--text-muted)]">{mark}%</span>
                ))}
              </div>

              {/* Status message */}
              {tasksCompletedThisWeek >= weeklyGoal ? (
                <p className="mt-3 text-xs font-semibold text-[var(--color-success)] flex items-center gap-1">
                  <span>🏆</span> Weekly target reached! You're crushing it!
                </p>
              ) : (
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  {weeklyGoal - tasksCompletedThisWeek} more tasks to reach your weekly goal
                </p>
              )}
            </div>
          </Card>

        </div>
      </div>



      {/* Section 2 - Stats Grid */}
      <div 
        ref={statsRef}
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) transform ${
          statsVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-[0.98] pointer-events-none'
        }`}
      >
        <Card className="p-5 flex items-center gap-4 glass-card card-lift group cursor-pointer transition-all duration-300 hover:border-[var(--accent)]/30">
          <div className="w-10 h-10 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-[var(--accent)]/35 transition-all duration-300">
            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Total Tasks</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{animatedTotal}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 glass-card card-lift group cursor-pointer transition-all duration-300 hover:border-[var(--color-success)]/30">
          <div className="w-10 h-10 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-[var(--color-success-bg)]/180 transition-all duration-300">
            <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Completed</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{animatedCompleted} ({stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 glass-card card-lift group cursor-pointer transition-all duration-300 hover:border-[var(--color-inprogress)]/30">
          <div className="w-10 h-10 rounded-full bg-[var(--color-inprogress-bg)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-[var(--color-inprogress-bg)]/180 transition-all duration-300">
            <svg className="w-5 h-5 text-[var(--color-inprogress)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">In Progress</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{animatedInprogress}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 glass-card card-lift group cursor-pointer transition-all duration-300 hover:border-[var(--color-pending)]/30">
          <div className="w-10 h-10 rounded-full bg-[var(--color-pending-bg)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-[var(--color-pending-bg)]/180 transition-all duration-300">
            <svg className="w-5 h-5 text-[var(--color-pending)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Pending</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{animatedPending}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 glass-card card-lift group cursor-pointer transition-all duration-300 hover:border-[var(--accent)]/30">
          <div className="w-10 h-10 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-[var(--accent)]/35 transition-all duration-300">
            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Completed Today</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{tasksCompletedToday}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 glass-card card-lift group cursor-pointer transition-all duration-300 hover:border-[var(--color-success)]/30">
          <div className="w-10 h-10 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-[var(--color-success-bg)]/180 transition-all duration-300">
            <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Daily Progress</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{dailyProgress}%</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 glass-card card-lift group cursor-pointer transition-all duration-300 hover:border-orange-500/30">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-orange-500/35 transition-all duration-300">
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Streak</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{streak} day{streak !== 1 ? 's' : ''}</p>
          </div>
        </Card>
      </div>

      {/* Section 3 - Charts */}
      <div 
        ref={chartsRef}
        className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) transform ${
          chartsVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-[0.98] pointer-events-none'
        }`}
      >
        <Card className="p-6 relative overflow-hidden glass-card hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95}/>
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.80}/>
                </linearGradient>
                <linearGradient id="colorInProgress" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity={0.95}/>
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.80}/>
                </linearGradient>
                <linearGradient id="colorPending" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95}/>
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.80}/>
                </linearGradient>
                <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.25"/>
                </filter>
              </defs>
              <Pie
                data={activeStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                isAnimationActive={chartsVisible}
                animationDuration={1500}
                animationEasing="ease-out"
                className={`transition-all duration-[1500ms] cubic-bezier(0.16, 1, 0.3, 1) transform ${
                  chartsVisible ? 'rotate-0 scale-100' : '-rotate-90 scale-95'
                }`}
                style={{ transformOrigin: '50% 50%' }}
              >
                {activeStatusData.map((entry, index) => {
                  let fillUrl = entry.color;
                  if (entry.name === 'Completed') fillUrl = 'url(#colorCompleted)';
                  else if (entry.name === 'In Progress') fillUrl = 'url(#colorInProgress)';
                  else if (entry.name === 'Pending') fillUrl = 'url(#colorPending)';
                  return <Cell key={`cell-${index}`} fill={fillUrl} filter="url(#pieShadow)" className="hover:scale-105 hover:opacity-90 transition-transform origin-center duration-300 cursor-pointer" />;
                })}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '2px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 relative overflow-hidden glass-card hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart 
              data={activePriorityData}
              className={`transition-all duration-[1500ms] cubic-bezier(0.16, 1, 0.3, 1) transform ${
                chartsVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
              }`}
            >
              <defs>
                <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95}/>
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0.70}/>
                </linearGradient>
                <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95}/>
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.70}/>
                </linearGradient>
                <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95}/>
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.70}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '2px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)'
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={chartsVisible} animationDuration={1500} animationEasing="ease-out">
                {activePriorityData.map((entry, index) => {
                  let fillUrl = entry.color;
                  if (entry.name === 'High') fillUrl = 'url(#colorHigh)';
                  else if (entry.name === 'Medium') fillUrl = 'url(#colorMedium)';
                  else if (entry.name === 'Low') fillUrl = 'url(#colorLow)';
                  return <Cell key={`cell-${index}`} fill={fillUrl} className="hover:opacity-90 transition-opacity duration-200 cursor-pointer" />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Section 4 - Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT - Recent Tasks (60%) */}
        <div className="lg:col-span-2">
          <Card className="p-6 glass-card hover:shadow-xl transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Recent Tasks</h3>
              <Link to="/tasks" className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 bg-[var(--bg-card)]/40 rounded-xl border border-[var(--border-default)] border-l-4 ${
                      task.status === 'completed' ? 'border-l-[var(--color-completed)]' :
                      task.status === 'inprogress' ? 'border-l-[var(--color-inprogress)]' :
                      'border-l-[var(--color-pending)]'
                    } hover:translate-x-1.5 hover:bg-[var(--bg-card-hover)]/70 hover:border-[var(--border-strong)] hover:shadow-md transition-all duration-300 cursor-pointer`}
                    onClick={() => navigate('/tasks')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={task.status}>{task.status}</Badge>
                          <Badge variant={task.priority}>{task.priority}</Badge>
                          {task.dueDate && (
                            <span className="text-xs text-[var(--text-muted)] flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-[var(--text-muted)]">No tasks yet</p>
                  <button
                    onClick={() => navigate('/tasks/create')}
                    className="text-[var(--accent)] hover:text-[var(--accent-hover)] text-sm font-medium mt-2"
                  >
                    Create your first task →
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT - Task Overview (40%) */}
        <div className="lg:col-span-1">
          <Card className="p-6 mb-6 glass-card hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-secondary)]">Pending</span>
                  <span className="text-[var(--text-primary)] font-medium">{stats.pending}</span>
                </div>
                <div className="w-full bg-[var(--bg-input)] rounded-full h-2">
                  <div
                    className="h-full rounded-full bg-[var(--color-pending)] transition-all"
                    style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-secondary)]">In Progress</span>
                  <span className="text-[var(--text-primary)] font-medium">{stats.inprogress}</span>
                </div>
                <div className="w-full bg-[var(--bg-input)] rounded-full h-2">
                  <div
                    className="h-full rounded-full bg-[var(--color-inprogress)] transition-all"
                    style={{ width: `${stats.total > 0 ? (stats.inprogress / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-secondary)]">Completed</span>
                  <span className="text-[var(--text-primary)] font-medium">{stats.completed}</span>
                </div>
                <div className="w-full bg-[var(--bg-input)] rounded-full h-2">
                  <div
                    className="h-full rounded-full bg-[var(--color-completed)] transition-all"
                    style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>

      {/* Edit Daily Goal Modal */}
      <Modal isOpen={isEditDailyOpen} onClose={() => setIsEditDailyOpen(false)} title="Update Daily Task Goal" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
              Set Daily Target (number of tasks to complete today)
            </label>
            <Input 
              type="number"
              min="1"
              value={tempDailyGoal}
              onChange={(e) => setTempDailyGoal(e.target.value)}
              placeholder="e.g. 5"
              className="text-lg font-bold"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsEditDailyOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveDailyGoal}
              disabled={updatingGoal || !tempDailyGoal || parseInt(tempDailyGoal, 10) < 1}
              loading={updatingGoal}
            >
              Save Goal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Weekly Goal Modal */}
      <Modal isOpen={isEditWeeklyOpen} onClose={() => setIsEditWeeklyOpen(false)} title="Update Weekly Productivity Goal" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
              Set Weekly Target (number of tasks to complete this week)
            </label>
            <Input 
              type="number"
              min="1"
              value={tempWeeklyGoal}
              onChange={(e) => setTempWeeklyGoal(e.target.value)}
              placeholder="e.g. 20"
              className="text-lg font-bold"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsEditWeeklyOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveWeeklyGoal}
              disabled={updatingGoal || !tempWeeklyGoal || parseInt(tempWeeklyGoal, 10) < 1}
              loading={updatingGoal}
            >
              Save Goal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;

