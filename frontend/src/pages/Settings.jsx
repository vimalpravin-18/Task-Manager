import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { user, preferences, updatePreferences, logout } = useAuth();
  const { tasks, clearCompletedTasks, clearAllTasks } = useTask();
  
  const [activeSection, setActiveSection] = useState('appearance');
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showClearCompletedConfirm, setShowClearCompletedConfirm] = useState(false);
  const [deleteAllText, setDeleteAllText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Custom states
  const [taskSettings, setTaskSettings] = useState({
    defaultStatus: 'pending',
    defaultPriority: 'medium',
    defaultView: 'list',
    autoArchive: 'never',
    showTaskIds: false
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    enableReminders: true,
    playGoalAudio: true,
    reminderLeadTime: '24',
    weekStartDay: 'monday',
    focusDuration: '25'
  });

  const dailyGoal = preferences?.daily_task_goal || 5;
  const weeklyGoal = preferences?.weekly_task_goal || 20;

  // Load configs on mount
  useEffect(() => {
    const savedTaskSettings = localStorage.getItem('taskSettings');
    if (savedTaskSettings) setTaskSettings(JSON.parse(savedTaskSettings));

    const savedNotifications = localStorage.getItem('notificationPrefs');
    if (savedNotifications) setNotificationPrefs(JSON.parse(savedNotifications));
  }, []);

  const updateTaskSetting = (key, value) => {
    const updated = { ...taskSettings, [key]: value };
    setTaskSettings(updated);
    localStorage.setItem('taskSettings', JSON.stringify(updated));
    toast.success('Task defaults updated! ⚡');
  };

  const updateNotificationPref = (key, value) => {
    const updated = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(updated);
    localStorage.setItem('notificationPrefs', JSON.stringify(updated));
    
    // Show appropriate feedback
    if (key === 'playGoalAudio') {
      if (value === true) {
        // Play test audio when enabled
        playTestTone();
      } else {
        toast.success('Sound alerts disabled');
      }
    } else if (key === 'enableReminders') {
      if (value) {
        toast.success('Reminders enabled - you\'ll get notified about upcoming tasks');
      } else {
        toast.success('Reminders disabled');
      }
    } else {
      toast.success('Preferences updated!');
    }
  };

  const handleSaveDailyGoalSetting = async (val) => {
    const intVal = parseInt(val, 10);
    if (isNaN(intVal) || intVal < 1) return;
    await updatePreferences({ ...preferences, daily_task_goal: intVal });
  };

  const handleSaveWeeklyGoalSetting = async (val) => {
    const intVal = parseInt(val, 10);
    if (isNaN(intVal) || intVal < 1) return;
    await updatePreferences({ ...preferences, weekly_task_goal: intVal });
  };

  const accentColors = [
    { hex: '#7c6ff7', name: 'Indigo' },
    { hex: '#a855f7', name: 'Violet' },
    { hex: '#06b6d4', name: 'Cyan' },
    { hex: '#14b8a6', name: 'Teal' },
    { hex: '#f43f5e', name: 'Rose' },
    { hex: '#f59e0b', name: 'Amber' },
    { hex: '#22c55e', name: 'Green' },
    { hex: '#f97316', name: 'Orange' },
  ];

  // Synthesize custom sound tone for Premium auditory feedback
  const playTestTone = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.35);
      toast.success('Soft alert tone successfully previewed! 🎵');
    } catch (e) {
      console.warn('AudioContext support warning:', e);
    }
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.json';
    a.click();
    toast.success('Tasks exported as JSON!');
  };

  const handleExportCSV = () => {
    const headers = ['id', 'title', 'description', 'status', 'priority', 'dueDate'];
    const csvContent = [
      headers.join(','),
      ...tasks.map(t => [t.id, t.title, t.description, t.status, t.priority, (t.dueDate ?? t.due_date) || ''].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
    toast.success('Tasks exported as CSV!');
  };

  const handleClearCompleted = async () => {
    setLoading(true);
    const result = await clearCompletedTasks();
    if (result.success) {
      toast.success('Completed tasks cleared!');
      setShowClearCompletedConfirm(false);
    } else {
      toast.error('Failed to clear completed tasks.');
    }
    setLoading(false);
  };

  const handleClearAll = async () => {
    if (deleteAllText !== 'DELETE') return;
    setLoading(true);
    const result = await clearAllTasks();
    if (result.success) {
      toast.success('All tasks cleared successfully!');
      setShowDeleteAllConfirm(false);
      setDeleteAllText('');
    } else {
      toast.error('Failed to clear all tasks.');
    }
    setLoading(false);
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
    toast.success('Signed out successfully.');
  };

  const navItems = [
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'profile',    label: 'Account Profile', icon: '👤' },
    { id: 'tasks',      label: 'Tasks Defaults', icon: '✅' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'data',       label: 'Data & Privacy', icon: '🛡️' },
    { id: 'about',      label: 'About Version', icon: 'ℹ️' },
  ];

  return (
    <div className="max-w-[1050px] mx-auto px-6 py-8 animate-fadeSlideUp">
      {/* Header section with accent dot */}
      <div className="flex items-center gap-2 mb-8 border-b border-[var(--border-default)] pb-5">
        <h1 className="text-[28px] font-black text-[var(--text-primary)] tracking-tight">Settings</h1>
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)] animate-pulse mt-2"></span>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar */}
        <nav className="w-full lg:w-60 flex-shrink-0">
          <Card className="p-2.5 glass-card shadow-lg border border-[var(--border-default)] rounded-2xl w-full">
            <div className="space-y-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeSection === item.id
                      ? 'bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/15 shadow-sm'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]/60 hover:text-[var(--text-primary)] border border-transparent'
                  }`}
                >
                  <span className="text-base transition-transform group-hover:scale-110">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </nav>

        {/* Right Content Panels */}
        <div className="flex-1 w-full">
          {activeSection === 'appearance' && (
            <div className="space-y-6 animate-fadeSlideUp">
              <Card className="p-6 lg:p-8 glass-card border border-[var(--border-default)] rounded-2xl">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 border-b border-[var(--border-default)] pb-4">Theme Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {['dark', 'light', 'system'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${theme === t ? 'border-[var(--accent)] bg-[var(--accent-light)]/20 ring-2 ring-[var(--accent)] ring-opacity-20' : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'}`}
                    >
                      <div className={`w-full h-16 rounded-lg mb-3 shadow-inner ${t === 'dark' ? 'bg-zinc-950 border border-zinc-800' : t === 'light' ? 'bg-zinc-100 border border-zinc-300' : 'bg-gradient-to-r from-zinc-950 to-zinc-100 border border-zinc-700'}`} />
                      <p className="text-sm font-semibold capitalize text-center text-[var(--text-primary)]">{t}</p>
                    </button>
                  ))}
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 border-b border-[var(--border-default)] pb-4">Color Palette</h3>
                <div className="flex gap-3 flex-wrap">
                  {accentColors.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => setAccentColor(c.hex)}
                      className={`w-11 h-11 rounded-full border-2 transition-all hover:scale-110 cursor-pointer ${accentColor === c.hex ? 'border-white dark:border-white ring-4 ring-offset-2 ring-offset-[var(--bg-card)]' : 'border-transparent shadow-sm'}`}
                      style={{ backgroundColor: c.hex, '--tw-ring-color': c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="space-y-6 animate-fadeSlideUp">
              <Card className="p-6 lg:p-8 glass-card border border-[var(--border-default)] rounded-2xl">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 border-b border-[var(--border-default)] pb-4">User Profile</h3>
                
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 bg-[var(--bg-card-hover)]/30 p-5 rounded-2xl border border-[var(--border-default)]">
                  {/* User Initials Avatar */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                    {user?.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                  </div>
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <h4 className="text-xl font-bold text-[var(--text-primary)] truncate">{user?.name || 'TaskFlow User'}</h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate">{user?.email || 'user@taskflow.com'}</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/20 text-xs font-bold text-[var(--accent)] mt-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
                      Pro Member
                    </div>
                  </div>
                </div>

                <div className="space-y-6 max-w-md">
                  <div>
                    <label className="text-sm font-semibold text-[var(--text-secondary)] block mb-1.5">Registered Name</label>
                    <Input disabled value={user?.name || ''} className="bg-[var(--bg-card-hover)]/40 text-[var(--text-muted)] cursor-not-allowed font-medium" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[var(--text-secondary)] block mb-1.5">Email Address</label>
                    <Input disabled value={user?.email || ''} className="bg-[var(--bg-card-hover)]/40 text-[var(--text-muted)] cursor-not-allowed font-medium" />
                  </div>

                  <div className="pt-6 border-t border-[var(--border-default)] flex gap-4">
                    <Button variant="primary" onClick={() => navigate('/profile')} className="py-2.5 px-5 font-semibold text-sm shadow-sm cursor-pointer rounded-xl">
                      Edit Profile Info
                    </Button>
                    <Button variant="danger" onClick={handleLogoutClick} className="py-2.5 px-5 font-semibold text-sm shadow-sm cursor-pointer rounded-xl">
                      Sign Out
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'tasks' && (
            <Card className="p-6 lg:p-8 glass-card border border-[var(--border-default)] rounded-2xl animate-fadeSlideUp">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 border-b border-[var(--border-default)] pb-4">Task Defaults</h3>
              <div className="space-y-6">
                <div>
                  <label className="font-semibold text-sm text-[var(--text-secondary)] block mb-3">Default Status for New Tasks</label>
                  <div className="flex gap-2.5">
                    {['pending', 'inprogress'].map(status => (
                      <button 
                        key={status}
                        className={`px-4 py-2.5 rounded-xl border-2 transition-all font-semibold cursor-pointer text-xs ${taskSettings.defaultStatus === status ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]' : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'}`} 
                        onClick={() => updateTaskSetting('defaultStatus', status)}
                      >
                        {status === 'inprogress' ? 'In Progress' : 'Pending'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-sm text-[var(--text-secondary)] block mb-3">Default Priority Level</label>
                  <div className="flex gap-2.5">
                    {['low', 'medium', 'high'].map(priority => (
                      <button 
                        key={priority}
                        className={`px-4 py-2.5 rounded-xl border-2 transition-all font-semibold capitalize cursor-pointer text-xs ${taskSettings.defaultPriority === priority ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]' : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'}`} 
                        onClick={() => updateTaskSetting('defaultPriority', priority)}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-sm text-[var(--text-secondary)] block mb-3">Default View Layout</label>
                  <div className="flex gap-2.5">
                    {['list', 'kanban'].map(view => (
                      <button 
                        key={view}
                        className={`px-4 py-2.5 rounded-xl border-2 transition-all font-semibold capitalize cursor-pointer text-xs ${taskSettings.defaultView === view ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]' : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'}`} 
                        onClick={() => updateTaskSetting('defaultView', view)}
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-[var(--text-primary)] mt-8 mb-6 border-b border-[var(--border-default)] pb-4">Productivity Targets</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-[var(--text-secondary)] block mb-2">Daily Completed Target</label>
                    <Input 
                      type="number"
                      min="1"
                      value={dailyGoal}
                      onChange={(e) => handleSaveDailyGoalSetting(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full font-bold"
                    />
                    <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">Task goal completed daily trigger overlay.</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[var(--text-secondary)] block mb-2">Weekly Productivity Target</label>
                    <Input 
                      type="number"
                      min="1"
                      value={weeklyGoal}
                      onChange={(e) => handleSaveWeeklyGoalSetting(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full font-bold"
                    />
                    <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">Tasks to achieve weekly status flame.</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6 animate-fadeSlideUp">
              <Card className="p-6 lg:p-8 glass-card border border-[var(--border-default)] rounded-2xl">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 border-b border-[var(--border-default)] pb-4">Notifications & Alerts</h3>
                
                <div className="space-y-6">
                  {/* Enable Reminders Switch */}
                  <div className="flex items-center justify-between p-4 bg-[var(--bg-card-hover)]/30 rounded-xl border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">Upcoming Due Checkups</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">Toast alert notices on soon-to-be overdue tasks.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.enableReminders}
                        onChange={(e) => updateNotificationPref('enableReminders', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:bg-[var(--accent)] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300"></div>
                    </label>
                  </div>

                  {/* Email Notifications Switch */}
                  <div className="flex items-center justify-between p-4 bg-[var(--bg-card-hover)]/30 rounded-xl border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">Email Notifications</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">Receive overdue task reminders via email.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.email_notifications ?? true}
                        onChange={(e) => updatePreferences({ ...preferences, email_notifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:bg-[var(--accent)] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300"></div>
                    </label>
                  </div>

                  {/* Play sound on completed goals */}
                  <div className="flex items-center justify-between p-4 bg-[var(--bg-card-hover)]/30 rounded-xl border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">Auditory Celebration Alert</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">Synthesize a rich alert tone when daily/weekly targets are achieved.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {notificationPrefs.playGoalAudio && (
                        <button 
                          onClick={playTestTone}
                          className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent-light)]/50 hover:bg-[var(--accent-light)] hover:border-[var(--accent)]/70 transition-all duration-200 cursor-pointer whitespace-nowrap"
                        >
                          🔊 Test Tone
                        </button>
                      )}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationPrefs.playGoalAudio}
                          onChange={(e) => updateNotificationPref('playGoalAudio', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:bg-[var(--accent)] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300"></div>
                      </label>
                    </div>
                  </div>

                  {/* Advanced settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[var(--border-default)]">
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-2">Reminder Lead Time</label>
                      <select
                        value={notificationPrefs.reminderLeadTime}
                        onChange={(e) => updateNotificationPref('reminderLeadTime', e.target.value)}
                        className="appearance-none w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-sm cursor-pointer font-semibold shadow-sm transition-all"
                      >
                        <option value="1">1 Hour Before</option>
                        <option value="3">3 Hours Before</option>
                        <option value="12">12 Hours Before</option>
                        <option value="24">24 Hours Before (1 day)</option>
                        <option value="48">48 Hours Before (2 days)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-2">Week Start Day</label>
                      <select
                        value={notificationPrefs.weekStartDay}
                        onChange={(e) => updateNotificationPref('weekStartDay', e.target.value)}
                        className="appearance-none w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-sm cursor-pointer font-semibold shadow-sm transition-all"
                      >
                        <option value="monday">Monday (Default)</option>
                        <option value="sunday">Sunday</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="space-y-6 animate-fadeSlideUp">
              <Card className="p-6 lg:p-8 glass-card border border-[var(--border-default)] rounded-2xl">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 border-b border-[var(--border-default)] pb-4">Export Workspace</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">Download a copy of all your tasks for backup or use in other applications.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" onClick={handleExportJSON} className="justify-center flex-1 py-3 border-[var(--border-strong)] hover:border-[var(--accent)] cursor-pointer rounded-xl">
                    <span className="mr-2">📄</span> Export as JSON
                  </Button>
                  <Button variant="outline" onClick={handleExportCSV} className="justify-center flex-1 py-3 border-[var(--border-strong)] hover:border-[var(--accent)] cursor-pointer rounded-xl">
                    <span className="mr-2">📊</span> Export as CSV
                  </Button>
                </div>
              </Card>

              <Card className="p-6 lg:p-8 border-2 border-red-500/20 glass-card rounded-2xl shadow-md">
                <h3 className="text-lg font-bold text-red-500 dark:text-red-400 mb-6 border-b border-red-500/20 pb-4">Danger Zone</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">These actions are permanent and cannot be undone. Proceed with caution.</p>
                
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                    <div className="mb-4 sm:mb-0">
                      <h4 className="font-semibold text-[var(--text-primary)]">Clear Completed Tasks</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Remove all tasks marked as completed.</p>
                    </div>
                    <Button variant="danger" onClick={() => setShowClearCompletedConfirm(true)} className="whitespace-nowrap shadow-sm rounded-xl cursor-pointer">
                      Clear Completed
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                    <div className="mb-4 sm:mb-0">
                      <h4 className="font-semibold text-[var(--text-primary)]">Clear All Tasks</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Delete every task in your workspace.</p>
                    </div>
                    <Button variant="danger" onClick={() => setShowDeleteAllConfirm(true)} className="whitespace-nowrap shadow-sm rounded-xl cursor-pointer">
                      Clear All Tasks
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'about' && (
            <Card className="p-6 lg:p-8 glass-card border border-[var(--border-default)] rounded-2xl text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[var(--accent)] to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg mb-6 transform rotate-3 animate-breathe">
                ✓
              </div>
              <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2 tracking-tight">TaskFlow Pro</h3>
              <p className="text-[var(--text-secondary)] mb-6 text-sm">Version 1.0.0 • Premium Edition</p>
              
              <div className="bg-[var(--bg-card-hover)]/40 p-4 rounded-xl max-w-sm mx-auto mb-8 border border-[var(--border-default)]">
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Built with modern tech:</p>
                <p className="text-xs text-[var(--text-muted)]">React 18 • Node.js • PostgreSQL • TailwindCSS</p>
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => window.open('https://github.com/vimalpravin-18', '_blank')} className="min-w-[140px] justify-center shadow-sm rounded-xl cursor-pointer">
                  GitHub
                </Button>
                <Button variant="primary" onClick={() => window.location.href = 'mailto:vimalpravin071@gmail.com'} className="min-w-[140px] justify-center shadow-sm rounded-xl cursor-pointer">
                  Support
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modals */}
      <Modal isOpen={showClearCompletedConfirm} onClose={() => setShowClearCompletedConfirm(false)} title="Clear Completed Tasks" size="sm">
        <div className="space-y-5">
          <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 p-3 rounded-md text-sm border border-orange-200 dark:border-orange-900/50">
            Are you sure you want to delete all completed tasks? This action cannot be undone.
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowClearCompletedConfirm(false)} className="cursor-pointer rounded-xl">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearCompleted} disabled={loading} loading={loading} className="cursor-pointer rounded-xl">
              Yes, Clear Them
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteAllConfirm} onClose={() => { setShowDeleteAllConfirm(false); setDeleteAllText(''); }} title="Clear ALL Tasks" size="sm">
        <div className="space-y-5">
          <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm border border-red-200 dark:border-red-900">
            <strong>Warning:</strong> You are about to delete ALL tasks in your account permanently.
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-2 block">
              Type <span className="font-bold text-[var(--text-primary)]">DELETE</span> to confirm:
            </label>
            <Input 
              value={deleteAllText} 
              onChange={(e) => setDeleteAllText(e.target.value)} 
              placeholder="DELETE" 
              className="font-mono text-center"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowDeleteAllConfirm(false); setDeleteAllText(''); }} className="cursor-pointer rounded-xl">
              Cancel
            </Button>
            <Button 
              variant="danger" 
              disabled={deleteAllText !== 'DELETE' || loading} 
              loading={loading}
              onClick={handleClearAll}
              className="cursor-pointer rounded-xl"
            >
              Nuke Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
