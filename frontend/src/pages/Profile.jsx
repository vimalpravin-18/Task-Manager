import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { tasks } = useTask();
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar_url: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Pre-configured elegant avatar gradient options
  const avatarGradients = [
    { name: 'Sunset Orange', class: 'bg-gradient-to-tr from-orange-500 to-rose-500' },
    { name: 'Ocean Breeze', class: 'bg-gradient-to-tr from-blue-600 to-cyan-500' },
    { name: 'Emerald Forest', class: 'bg-gradient-to-tr from-emerald-600 to-teal-500' },
    { name: 'Royal Purple', class: 'bg-gradient-to-tr from-indigo-600 to-purple-600' },
    { name: 'Midnight Neon', class: 'bg-gradient-to-tr from-fuchsia-600 to-pink-500' },
    { name: 'Tech Slate', class: 'bg-gradient-to-tr from-slate-700 to-slate-900' }
  ];

  // Emojis for avatar selector
  const avatarEmojis = ['💼', '🚀', '💻', '🎨', '🧠', '⚡', '🦊', '🐼', '🌟', '🦄', '🥑', '🏆', '🎯', '⚙️', '📈'];

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || avatarGradients[3].class // Default to Royal Purple
      }));
    }
  }, [user]);

  // Dynamically calculate productivity statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inprogress = tasks.filter(t => t.status === 'inprogress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    
    // Priority levels
    const high = tasks.filter(t => t.priority === 'high').length;
    const medium = tasks.filter(t => t.priority === 'medium').length;
    const low = tasks.filter(t => t.priority === 'low').length;
    
    // Percentage rate
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Overdue tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const d = new Date(t.dueDate);
      d.setHours(0, 0, 0, 0);
      return d < today;
    }).length;

    // Due Today tasks
    const dueToday = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const d = new Date(t.dueDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length;

    // Categorization count
    const categories = {};
    tasks.forEach(t => {
      if (t.category) {
        categories[t.category] = (categories[t.category] || 0) + 1;
      }
    });
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

    // Activity timeline calculations
    const timeline = [];
    tasks.forEach(t => {
      if (t.createdAt) {
        timeline.push({
          type: 'create',
          task: t.title,
          time: new Date(t.createdAt),
          description: `Task "${t.title}" created with ${t.priority} priority`,
          icon: '➕',
          color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
        });
      }
      if (t.status === 'completed' && t.updatedAt) {
        timeline.push({
          type: 'complete',
          task: t.title,
          time: new Date(t.updatedAt),
          description: `Task "${t.title}" successfully completed!`,
          icon: '✅',
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
        });
      }
    });
    const sortedTimeline = timeline.sort((a, b) => b.time - a.time).slice(0, 6);

    // Dynamic Streak System
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.updatedAt);
    const uniqueDates = [...new Set(completedTasks.map(t => {
      const d = new Date(t.updatedAt);
      return d.toDateString();
    }))].map(dateStr => new Date(dateStr));
    
    // Sort unique dates descending
    uniqueDates.sort((a, b) => b - a);

    let currentStreak = 0;
    let bestStreak = 0;
    
    if (uniqueDates.length > 0) {
      // Calculate current streak
      const todayStr = new Date().toDateString();
      const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
      
      const checkStart = uniqueDates[0].toDateString();
      const hasActivityRecently = (checkStart === todayStr || checkStart === yesterdayStr);

      if (hasActivityRecently) {
        currentStreak = 1;
        let prevDate = uniqueDates[0];
        
        for (let i = 1; i < uniqueDates.length; i++) {
          const diffTime = Math.abs(prevDate - uniqueDates[i]);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
            prevDate = uniqueDates[i];
          } else if (diffDays > 1) {
            break;
          }
        }
      }

      // Calculate best streak
      let tempStreak = 1;
      let prevDate = uniqueDates[uniqueDates.length - 1];
      bestStreak = 1;

      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const diffTime = Math.abs(uniqueDates[i] - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
          }
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
        prevDate = uniqueDates[i];
      }
    }

    return {
      total,
      completed,
      inprogress,
      pending,
      high,
      medium,
      low,
      rate,
      overdue,
      dueToday,
      topCategory,
      timeline: sortedTimeline,
      currentStreak,
      bestStreak
    };
  }, [tasks]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setProfileLoading(true);
    const result = await updateProfile({
      name: formData.name,
      email: formData.email,
      bio: formData.bio,
      avatar_url: formData.avatar_url
    });
    if (result.success) {
      toast.success('Profile updated successfully! ✨');
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
    setProfileLoading(false);
  };

  const handlePasswordChange = async () => {
    if (!formData.currentPassword || !formData.newPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    const result = await changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });
    if (result.success) {
      toast.success('Password updated successfully! 🔒');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } else {
      toast.error(result.error || 'Failed to update password');
    }
    setPasswordLoading(false);
  };

  const handleSelectAvatar = (avatarClass) => {
    setFormData(prev => ({ ...prev, avatar_url: avatarClass }));
    setShowAvatarModal(false);
    toast.success('Selected new profile style!');
  };

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
    { id: 'edit', label: 'Edit Profile', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { id: 'security', label: 'Security & Sign In', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'activity', label: 'Activity Timeline', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const CircleProgress = ({ value, size = 110, stroke = 9 }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-default)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
    );
  };

  const ProgressBar = ({ label, value, max, color }) => {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-[var(--text-secondary)] font-medium">{label}</span>
          <span className="font-bold text-[var(--text-primary)]">{value}</span>
        </div>
        <div className="w-full bg-[var(--bg-input)] rounded-full h-2">
          <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
    );
  };

  // Check if current avatar_url is a css class gradient
  const isGradient = formData.avatar_url && formData.avatar_url.startsWith('bg-');

  return (
    <>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fadeSlideUp select-none">
      {/* Decorative Full-Bleed Cover Backdrop Banner */}
      <div className="relative w-full h-40 sm:h-52 bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 rounded-3xl overflow-hidden shadow-lg mb-4">
        <div className="absolute inset-0 opacity-20 bg-grid-pattern" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54 48c-2 0-3 1-4 2v4c0 1-1 2-2 2h-4c-1 0-2-1-2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1-1 2-2 2H30c-1 0-2-1-2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1-1 2-2 2H6c-1 0-2-1-2-2v-4c0-1-1-2-2-2H0v-2h4c1 0 2-1 2-2v4c0 1 1 2 2 2h12c1 0 2-1 2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1 1 2 2 2h12c1 0 2-1 2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1 1 2 2 2h12c1 0 2-1 2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1 1 2 2 2h4v2h-4zM6 38c-2 0-3 1-4 2v4c0 1-1 2-2 2h-4c-1 0-2-1-2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1-1 2-2 2h-4c-1 0-2-1-2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1-1 2-2 2H6c-1 0-2-1-2-2v-4c0-1-1-2-2-2H0v-2h4c1 0 2 1 2 2v4c0 1 1 2 2 2h12c1 0 2-1 2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1 1 2 2 2h12c1 0 2-1 2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v-4c0 1 1 2 2 2h12c1 0 2-1 2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1 1 2 2 2h4v2h-4zm0-30c-2 0-3 1-4 2v4c0 1-1 2-2 2h-4c-1 0-2-1-2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1-1 2-2 2h-4c-1 0-2-1-2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1-1 2-2 2H6c-1 0-2-1-2-2v-4c0-1-1-2-2-2H0v-2h4c1 0 2 1 2 2v4c0 1 1 2 2 2h12c1 0 2-1 2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1 1 2 2 2h12c1 0 2-1 2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1 1 2 2 2h12c1 0 2-1 2-2v-4c0-1-1-2-2-2h-4c-1 0-2 1-2 2v4c0 1 1 2 2 2h4v2h-4z\' fill=\'%23ffffff\' fill-opacity=\'0.06\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }} />
      </div>

      {/* Floating Glassmorphic Profile Card */}
      <Card className="relative mx-4 sm:mx-8 -mt-20 sm:-mt-28 mb-6 sm:mb-8 border border-[var(--border-default)] shadow-2xl bg-[var(--bg-card)]/90 backdrop-blur-md p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 z-10">
        
        {/* Left Section: Avatar + Identity */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full lg:w-auto">
          {/* Changeable Avatar */}
          <div className="relative group cursor-pointer flex-shrink-0" onClick={() => setShowAvatarModal(true)}>
            <div className={`w-28 h-28 rounded-2xl flex items-center justify-center text-white text-4xl font-extrabold shadow-lg border-4 border-[var(--bg-card)] transition-all duration-300 transform group-hover:scale-105 ${isGradient ? formData.avatar_url : 'bg-[var(--accent)]'}`}>
              {!isGradient && formData.avatar_url ? formData.avatar_url : getInitials(formData.name)}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-1 tracking-tight">{formData.name || 'User Name'}</h1>
            <p className="text-[var(--text-secondary)] text-sm sm:text-base font-medium mb-3">{formData.email}</p>
            {formData.bio && (
              <p className="text-[var(--text-muted)] text-sm italic max-w-sm sm:max-w-xl mb-4 leading-relaxed bg-[var(--bg-card-hover)] px-3 py-2 rounded-xl border border-[var(--border-default)] inline-block">
                "{formData.bio}"
              </p>
            )}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <Badge variant="success" dot={true}>Active Member</Badge>
              {stats.overdue > 0 && <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">{stats.overdue} overdue</span>}
              {stats.dueToday > 0 && <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">{stats.dueToday} due today</span>}
            </div>
          </div>
        </div>

        {/* Right Section: Mini-Analytics Panel */}
        <div className="flex gap-4 sm:gap-6 justify-center items-center border-t lg:border-t-0 lg:border-l border-[var(--border-default)] pt-5 lg:pt-0 lg:pl-8 w-full lg:w-auto">
          <div className="text-center min-w-[70px] sm:min-w-[90px]">
            <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-extrabold mb-1">Streak</p>
            <p className="text-orange-500 font-extrabold text-xl sm:text-2xl flex items-center justify-center gap-1">
              🔥 {stats.currentStreak}
            </p>
          </div>
          
          <div className="w-[1px] h-8 bg-[var(--border-default)]" />

          <div className="text-center min-w-[70px] sm:min-w-[90px]">
            <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-extrabold mb-1">Completed</p>
            <p className="text-[var(--text-primary)] font-extrabold text-xl sm:text-2xl">
              {stats.completed}
            </p>
          </div>

          <div className="w-[1px] h-8 bg-[var(--border-default)]" />

          <div className="text-center min-w-[70px] sm:min-w-[90px]">
            <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-extrabold mb-1">Joined</p>
            <p className="text-[var(--text-primary)] font-extrabold text-base sm:text-lg">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      {/* Tab Navigation Menu */}
      <div className="flex gap-1.5 mb-6 sm:mb-8 bg-[var(--bg-card)] rounded-2xl p-1.5 border-2 border-[var(--border-default)] overflow-x-auto scrollbar-none shadow-sm">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
            }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Dashboard / Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6 sm:space-y-8 animate-fadeSlideUp">
          
          {/* Productivity Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {[
              { label: 'Total Tasks', value: stats.total, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'var(--accent)' },
              { label: 'Completed', value: stats.completed, icon: 'M5 13l4 4L19 7', color: 'var(--success)' },
              { label: 'Pending', value: stats.pending, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'var(--warning)' },
              { label: 'Overdue Tasks', value: stats.overdue, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'var(--danger)' },
              { label: 'Due Today', value: stats.dueToday, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: '#10b981' }
            ].map(s => (
              <Card key={s.label} className="p-4 sm:p-5 flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border-2 border-transparent" style={{ backgroundColor: s.color + '15', color: s.color }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={s.icon} /></svg>
                  </div>
                  <span className="text-[10px] sm:text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">{s.label}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] leading-none">{s.value}</p>
              </Card>
            ))}
          </div>

          {/* Productivity Streak and Score section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Streak Card */}
            <Card className="p-6 md:col-span-1 flex flex-col justify-between relative overflow-hidden bg-gradient-to-tr from-[var(--bg-card)] to-[var(--bg-card-hover)] border-2">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/10 rounded-full blur-xl" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Productivity Streak</h3>
                  <span className="text-2xl">🔥</span>
                </div>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-black text-orange-500 animate-pulse">{stats.currentStreak}</span>
                  <span className="text-sm font-bold text-[var(--text-secondary)]">consecutive days</span>
                </div>
              </div>
              <div className="space-y-2 border-t-2 border-[var(--border-default)] pt-4">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[var(--text-secondary)] font-medium">Personal Best Streak</span>
                  <span className="font-bold text-[var(--text-primary)]">{stats.bestStreak} days</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                  Complete tasks every day to build your streak and stay motivated!
                </p>
              </div>
            </Card>

            {/* Circular Progress Ring Score */}
            <Card className="p-6 md:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">Productivity Score</h3>
                <div className="flex items-center gap-6 my-2 justify-center sm:justify-start">
                  <div className="relative flex-shrink-0">
                    <CircleProgress value={stats.rate} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-[var(--text-primary)]">{stats.rate}%</span>
                      <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-extrabold">Score</span>
                    </div>
                  </div>
                  <div className="space-y-2.5 flex-1">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-[var(--text-secondary)] font-semibold">Overdue Tasks</span>
                      <span className={`font-bold ${stats.overdue > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{stats.overdue}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-[var(--text-secondary)] font-semibold">Completed Today</span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {tasks.filter(t => {
                          if (!t.updatedAt) return false;
                          const date = new Date(t.updatedAt);
                          return t.status === 'completed' && date.toDateString() === new Date().toDateString();
                        }).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t-2 border-[var(--border-default)] pt-3.5 text-xs text-[var(--text-muted)] flex items-center justify-between">
                <span>Top category:</span>
                <span className="font-bold text-[var(--accent)]">{stats.topCategory ? stats.topCategory[0] : 'None'}</span>
              </div>
            </Card>

            {/* Priority Breakdowns */}
            <Card className="p-6 md:col-span-1 flex flex-col justify-between">
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">Task Priority Breakdown</h3>
              <div className="space-y-4">
                <ProgressBar label="🔴 High Priority" value={stats.high} max={stats.total} color="var(--danger)" />
                <ProgressBar label="🟡 Medium Priority" value={stats.medium} max={stats.total} color="var(--warning)" />
                <ProgressBar label="🟢 Low Priority" value={stats.low} max={stats.total} color="var(--success)" />
              </div>
            </Card>
          </div>

          {/* Activity Timeline Mini View */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-5">Productivity History & Recent Events</h3>
            {stats.timeline.length > 0 ? (
              <div className="relative border-l-2 border-[var(--border-default)] ml-3 pl-6 space-y-6">
                {stats.timeline.map((event, idx) => (
                  <div key={idx} className="relative group">
                    <span className="absolute -left-9 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm bg-[var(--bg-card)] border-2 border-[var(--border-default)]">
                      {event.icon}
                    </span>
                    <div>
                      <span className="text-xs text-[var(--text-muted)] font-semibold block mb-0.5">
                        {event.time.toLocaleDateString()} at {event.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                No activity history available. Work on tasks to generate events!
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Edit Profile Form */}
      {activeTab === 'edit' && (
        <div className="animate-fadeSlideUp">
          <Card className="p-6 sm:p-8 max-w-2xl">
            <div className="mb-6 sm:mb-8 border-b-2 border-[var(--border-default)] pb-4">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Personal Profile Settings</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Configure your personal information and bio profile details.</p>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input label="Display Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                <Input label="Email Address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)]">Short Bio / Profile Summary</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-xl border-2 border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:border-[var(--accent)] transition-all focus:outline-none placeholder-[var(--text-muted)] text-sm sm:text-base"
                  placeholder="Tell us about yourself or your workflow..."
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 pt-6 border-t-2 border-[var(--border-default)]">
                <Button onClick={handleSaveProfile} disabled={profileLoading} loading={profileLoading} className="px-6 sm:px-8 shadow-md">
                  Save Changes
                </Button>
                <Button variant="ghost" onClick={() => setFormData(prev => ({ ...prev, name: user?.name || '', email: user?.email || '', bio: user?.bio || '' }))}>
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Security & Sign In */}
      {activeTab === 'security' && (
        <div className="animate-fadeSlideUp">
          <Card className="p-6 sm:p-8 max-w-2xl">
            <div className="mb-6 sm:mb-8 border-b-2 border-[var(--border-default)] pb-4">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Security & Password</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Manage and change your account security settings here.</p>
            </div>

            <div className="space-y-5">
              <Input 
                label="Current Password" 
                type={showPassword ? 'text' : 'password'} 
                value={formData.currentPassword}
                onChange={e => setFormData({ ...formData, currentPassword: e.target.value })} 
                placeholder="Enter current password" 
                suffix={
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="hover:text-[var(--text-primary)] transition-colors text-base p-1 focus:outline-none"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input 
                  label="New Password" 
                  type={showPassword ? 'text' : 'password'} 
                  value={formData.newPassword}
                  onChange={e => setFormData({ ...formData, newPassword: e.target.value })} 
                  placeholder="Min 6 characters" 
                  suffix={
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="hover:text-[var(--text-primary)] transition-colors text-base p-1 focus:outline-none"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  }
                />
                <Input 
                  label="Confirm New Password" 
                  type={showPassword ? 'text' : 'password'} 
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} 
                  placeholder="Confirm password" 
                  suffix={
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="hover:text-[var(--text-primary)] transition-colors text-base p-1 focus:outline-none"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  }
                />
              </div>

              <div className="pt-6 border-t-2 border-[var(--border-default)]">
                <Button variant="outline" onClick={handlePasswordChange} disabled={passwordLoading} loading={passwordLoading} className="px-6 sm:px-8">
                  Update Password
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Activity Timeline */}
      {activeTab === 'activity' && (
        <div className="animate-fadeSlideUp">
          <Card className="p-6 sm:p-8">
            <div className="mb-6 border-b-2 border-[var(--border-default)] pb-4">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Productivity Timeline</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Your consecutive task history, creations, and completions.</p>
            </div>

            {stats.timeline.length > 0 ? (
              <div className="relative border-l-2 border-[var(--border-default)] ml-4 pl-8 space-y-8">
                {stats.timeline.map((event, idx) => (
                  <div key={idx} className="relative group transition-all duration-300 hover:translate-x-1">
                    {/* Event Icon/Marker */}
                    <span className="absolute -left-[45px] top-0.5 w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-md bg-[var(--bg-card)] border-2 border-[var(--border-default)] group-hover:border-[var(--accent)] transition-all">
                      {event.icon}
                    </span>
                    <div>
                      <span className="text-xs text-[var(--text-muted)] font-bold block mb-1">
                        {event.time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })} at {event.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">{event.description}</h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-[var(--text-secondary)] font-bold text-lg">Timeline is empty</p>
                <p className="text-[var(--text-muted)] text-sm mt-1">Your task actions and completions will record dynamically here.</p>
              </div>
            )}
          </Card>
        </div>
      )}

    </div>

    {/* Avatar Presets & Customizer Dialog Modal */}
    {showAvatarModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <Card className="w-full max-w-lg p-6 sm:p-8 animate-zoomIn relative bg-[var(--bg-card)] border-2">
          <button 
            className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border-2 border-[var(--border-default)]"
            onClick={() => setShowAvatarModal(false)}
          >
            ✕
          </button>
          <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] mb-2">Select Profile Style</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6">Choose a beautiful modern gradient or customize your avatar marker.</p>

          <div className="space-y-6">
            {/* Gradients presets */}
            <div>
              <label className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] block mb-3">Elegant Gradient Presets</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {avatarGradients.map((g, idx) => (
                  <button 
                    key={idx}
                    className={`h-12 w-full rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${g.class} ${formData.avatar_url === g.class ? 'border-[var(--accent)] scale-105 shadow-md shadow-[var(--accent)]/10' : 'border-transparent'}`}
                    title={g.name}
                    onClick={() => handleSelectAvatar(g.class)}
                  />
                ))}
              </div>
            </div>

            {/* Emoji avatar presets */}
            <div>
              <label className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] block mb-3">Custom Symbol Indicators</label>
              <div className="grid grid-cols-5 gap-3">
                {avatarEmojis.map((emoji, idx) => (
                  <button 
                    key={idx}
                    className={`h-11 rounded-xl flex items-center justify-center text-xl bg-[var(--bg-card-hover)] border-2 transition-all duration-300 hover:bg-[var(--border-default)] hover:scale-105 ${formData.avatar_url === emoji ? 'border-[var(--accent)] scale-105' : 'border-[var(--border-default)]'}`}
                    onClick={() => handleSelectAvatar(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    )}
  </>
  );
};

export default Profile;
