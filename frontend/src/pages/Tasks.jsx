import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTask } from '../context/TaskContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Loader } from '../components/ui/Loader';
import toast from 'react-hot-toast';
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

const Tasks = () => {
  const { tasks, getTasks, createTask, updateTask, deleteTask, loading, filters, setFilters } = useTask();

  const formatCreatedDate = useCallback((dateVal, formatStr = 'MMMM d, yyyy') => {
    if (!dateVal) return '';
    try {
      const date = typeof dateVal === 'string' ? parseISO(dateVal) : new Date(dateVal);
      if (isNaN(date.getTime())) return '';
      return format(date, formatStr);
    } catch (e) {
      return '';
    }
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // Auto-open the create modal when navigated here with openCreate state (e.g. from Dashboard)
  useEffect(() => {
    if (location.state?.openCreate) {
      setShowModal(true);
      // Clear the state so refreshing doesn't re-open
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [viewMode, setViewMode] = useState('list'); // 'list', 'kanban', 'priority'
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownTimerRef = React.useRef(null);

  const handleDropdownEnter = (taskId) => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setOpenDropdownId(taskId);
  };

  const handleDropdownLeave = () => {
    dropdownTimerRef.current = setTimeout(() => {
      setOpenDropdownId(null);
    }, 120);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetFormData = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      dueDate: '',
    });
    setEditingTask(null);
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Task title cannot be empty.');
      return;
    }
    const result = await createTask(formData);
    if (result.success) {
      toast.success('Task created successfully! 🎉');
      setShowModal(false);
      resetFormData();
      getTasks();
    } else {
      toast.error(result.error || 'Failed to create task.');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Task title cannot be empty.');
      return;
    }
    if (!editingTask) return;
    const result = await updateTask(editingTask.id, formData);
    if (result.success) {
      toast.success('Task updated successfully! ✨');
      setShowModal(false);
      resetFormData();
      getTasks();
    } else {
      toast.error(result.error || 'Failed to update task.');
    }
  };

  const openEditModal = useCallback((task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? format(parseISO(task.dueDate), 'yyyy-MM-dd') : (task.due_date ? format(parseISO(task.due_date), 'yyyy-MM-dd') : ''),
    });
    setShowModal(true);
  }, []);

  const handleDeleteTask = async (id) => {
    const result = await deleteTask(id);
    if (result.success) {
      toast.success('Task deleted successfully! 🗑️');
      setShowDeleteConfirm(null);
      getTasks();
    } else {
      toast.error(result.error || 'Failed to delete task.');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const result = await updateTask(taskId, { status: newStatus });
    if (result.success) {
      toast.success(`Task status updated to ${newStatus === 'inprogress' ? 'In Progress' : newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}!`);
      getTasks();
    } else {
      toast.error(result.error || 'Failed to update status.');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, setFilters]);

  const filteredAndSortedTasks = useMemo(() => {
    let currentTasks = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    currentTasks.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt ?? b.created_at) - new Date(a.createdAt ?? a.created_at);
      if (sortBy === 'due') {
        const dateA = (a.dueDate ?? a.due_date) ? parseISO(a.dueDate ?? a.due_date) : new Date(8640000000000000);
        const dateB = (b.dueDate ?? b.due_date) ? parseISO(b.dueDate ?? b.due_date) : new Date(8640000000000000);
        return dateA.getTime() - dateB.getTime();
      }
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
      return 0;
    });
    return currentTasks;
  }, [tasks, searchTerm, statusFilter, sortBy]);

  const getDateCategory = useCallback((dateString) => {
    if (!dateString) return 'No Date';
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  }, []);

  const tasksByDate = useMemo(() => {
    return filteredAndSortedTasks.reduce((groups, task) => {
      const category = getDateCategory(task.dueDate ?? task.due_date);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(task);
      return groups;
    }, {});
  }, [filteredAndSortedTasks, getDateCategory]);

  const kanbanColumns = useMemo(() => {
    return {
      pending: filteredAndSortedTasks.filter(task => task.status === 'pending'),
      inprogress: filteredAndSortedTasks.filter(task => task.status === 'inprogress'),
      completed: filteredAndSortedTasks.filter(task => task.status === 'completed'),
    };
  }, [filteredAndSortedTasks]);

  const priorityColumns = useMemo(() => {
    return {
      high: filteredAndSortedTasks.filter(task => task.priority === 'high'),
      medium: filteredAndSortedTasks.filter(task => task.priority === 'medium'),
      low: filteredAndSortedTasks.filter(task => task.priority === 'low'),
    };
  }, [filteredAndSortedTasks]);

  const isOverdue = useCallback((dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = parseISO(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  }, []);

  const getRelativeDueText = useCallback((dueDate, status) => {
    if (!dueDate) return { text: 'No Date', style: 'bg-[var(--bg-card)]/40 text-[var(--text-muted)] border-transparent' };
    if (status === 'completed') return { text: 'Done', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = parseISO(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, style: 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold overdue-pulse' };
    }
    if (diffDays === 0) {
      return { text: 'Due Today ⏰', style: 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold' };
    }
    if (diffDays === 1) {
      return { text: 'Due Tomorrow', style: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
    }
    return { text: `Due in ${diffDays} days`, style: 'bg-[var(--bg-card)]/80 text-[var(--text-secondary)] border-[var(--border-default)]' };
  }, []);

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'pending': return 'border-l-[var(--color-pending)]';
      case 'inprogress': return 'border-l-[var(--color-inprogress)]';
      case 'completed': return 'border-l-[var(--color-success)]';
      default: return 'border-l-[var(--text-muted)]';
    }
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      high: { text: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-l-rose-500', label: 'High Priority', dot: 'bg-rose-500' },
      medium: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-l-amber-500', label: 'Medium Priority', dot: 'bg-amber-500' },
      low: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-l-emerald-500', label: 'Low Priority', dot: 'bg-emerald-500' }
    };
    return configs[priority] || {};
  };

  const getStatusTabStyles = (status, isActive) => {
    if (!isActive) return 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]/40 border border-transparent';
    switch (status) {
      case 'all': return 'bg-[var(--accent-light)] text-[var(--accent)] font-semibold shadow-sm border border-[var(--accent)]/20';
      case 'pending': return 'bg-[var(--color-pending-bg)] text-[var(--color-pending)] font-semibold shadow-sm border border-[var(--color-pending)]/20';
      case 'inprogress': return 'bg-[var(--color-inprogress-bg)] text-[var(--color-inprogress)] font-semibold shadow-sm border border-[var(--color-inprogress)]/20';
      case 'completed': return 'bg-[var(--color-success-bg)] text-[var(--color-success)] font-semibold shadow-sm border border-[var(--color-success)]/20';
      default: return 'bg-[var(--accent-light)] text-[var(--accent)] font-semibold border border-[var(--accent)]/20';
    }
  };

  const getStatusButtonClass = (status, currentActive) => {
    const isActive = currentActive === status;
    const base = "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 shadow-sm cursor-pointer ";
    if (!isActive) return base + "border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]";
    switch (status) {
      case 'pending': return base + "border-[var(--color-pending)] bg-[var(--color-pending-bg)] text-[var(--color-pending)]";
      case 'inprogress': return base + "border-[var(--color-inprogress)] bg-[var(--color-inprogress-bg)] text-[var(--color-inprogress)]";
      case 'completed': return base + "border-[var(--color-success)] bg-[var(--color-success-bg)] text-[var(--color-success)]";
      default: return base + "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]";
    }
  };

  const getPriorityButtonClass = (priority, currentActive) => {
    const isActive = currentActive === priority;
    const base = "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 shadow-sm cursor-pointer ";
    if (!isActive) return base + "border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]";
    switch (priority) {
      case 'low': return base + "border-[var(--color-success)] bg-[var(--color-success-bg)] text-[var(--color-success)]";
      case 'medium': return base + "border-[var(--color-pending)] bg-[var(--color-pending-bg)] text-[var(--color-pending)]";
      case 'high': return base + "border-[var(--color-danger)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]";
      default: return base + "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]";
    }
  };

  // Helper to render interactive Status Circle Dropdown (React state-based, no CSS gap issues)
  const renderStatusDropdown = (task, size = "md") => {
    const isKanban = size === "sm";
    const circleSize = isKanban ? "w-7 h-7" : "w-8 h-8";
    const iconSize = isKanban ? "w-3.5 h-3.5" : "w-4 h-4";
    const isOpen = openDropdownId === task.id;

    const statusConfig = {
      pending: {
        bg: 'bg-amber-500/20',
        border: 'border-amber-400',
        shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.4)]',
        activeBg: 'bg-amber-500/30 text-amber-300 border-amber-400/40',
        hoverBg: 'hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-400/30',
        dotColor: 'bg-amber-400',
        label: 'Pending',
        checkColor: 'text-amber-400',
      },
      inprogress: {
        bg: 'bg-sky-500/20',
        border: 'border-sky-400',
        shadow: 'shadow-[0_0_10px_rgba(56,189,248,0.4)]',
        activeBg: 'bg-sky-500/30 text-sky-300 border-sky-400/40',
        hoverBg: 'hover:bg-sky-500/20 hover:text-sky-300 hover:border-sky-400/30',
        dotColor: 'bg-sky-400',
        label: 'In Progress',
        checkColor: 'text-sky-400',
      },
      completed: {
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-400',
        shadow: 'shadow-[0_0_10px_rgba(52,211,153,0.4)]',
        activeBg: 'bg-emerald-500/30 text-emerald-300 border-emerald-400/40',
        hoverBg: 'hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-400/30',
        dotColor: 'bg-emerald-400',
        label: 'Completed',
        checkColor: 'text-emerald-400',
      },
    };

    const currentConfig = statusConfig[task.status] || statusConfig.pending;

    return (
      <div
        className="relative flex-shrink-0"
        onMouseEnter={() => handleDropdownEnter(task.id)}
        onMouseLeave={handleDropdownLeave}
      >
        {/* Status Circle Button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed'); }}
          className={`${circleSize} rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 cursor-pointer ${
            task.status === 'completed'
              ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
              : task.status === 'inprogress'
              ? 'bg-sky-500 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
              : `${currentConfig.bg} ${currentConfig.border} ${currentConfig.shadow}`
          }`}
          title="Click to toggle. Hover for more options."
        >
          {task.status === 'completed' && (
            <svg className={`${iconSize} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {task.status === 'inprogress' && (
            <svg className={`${iconSize} text-white animate-spin`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {task.status === 'pending' && (
            <span className={`w-2 h-2 rounded-full ${currentConfig.dotColor} animate-pulse`}></span>
          )}
        </button>

        {/* Status Dropdown — shown via React state, no CSS gap */}
        {isOpen && (
          <div
            className="absolute left-0 top-full pt-1.5 z-[9999]"
            style={{ minWidth: '148px' }}
            onMouseEnter={() => handleDropdownEnter(task.id)}
            onMouseLeave={handleDropdownLeave}
          >
            <div
              style={{
                background: 'rgba(15, 20, 35, 0.97)',
                border: '1.5px solid rgba(148,163,184,0.22)',
                borderRadius: '10px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.65), 0 2px 10px rgba(0,0,0,0.35)',
                padding: '4px',
                backdropFilter: 'blur(20px)',
              }}
            >
              {[
                { key: 'pending',    label: 'Pending',     dot: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  bgHover: 'rgba(245,158,11,0.22)',  text: '#fbbf24', border: 'rgba(245,158,11,0.35)' },
                { key: 'inprogress', label: 'In Progress', dot: '#38bdf8', bg: 'rgba(56,189,248,0.15)', bgHover: 'rgba(56,189,248,0.22)', text: '#7dd3fc', border: 'rgba(56,189,248,0.35)' },
                { key: 'completed',  label: 'Completed',   dot: '#34d399', bg: 'rgba(52,211,153,0.15)', bgHover: 'rgba(52,211,153,0.22)', text: '#6ee7b7', border: 'rgba(52,211,153,0.35)' },
              ].map(opt => {
                const isActive = task.status === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, opt.key); setOpenDropdownId(null); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '7px',
                      border: isActive ? `1.5px solid ${opt.border}` : '1.5px solid transparent',
                      background: isActive ? opt.bg : 'transparent',
                      color: isActive ? opt.text : 'rgba(226,232,240,0.9)',
                      fontSize: '12px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = opt.bgHover; e.currentTarget.style.color = opt.text; e.currentTarget.style.borderColor = opt.border; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(226,232,240,0.9)'; e.currentTarget.style.borderColor = 'transparent'; } }}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: opt.dot, flexShrink: 0, boxShadow: `0 0 5px ${opt.dot}99` }}></span>
                    <span style={{ flex: 1 }}>{opt.label}</span>
                    {isActive && (
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={opt.dot} strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 animate-fadeSlideUp">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-[28px] md:text-[36px] font-extrabold text-[var(--text-primary)] leading-tight">
            Your Tasks
          </h1>
          <p className="text-[var(--text-secondary)] text-base mt-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <span className="count-badge bg-[var(--accent-light)] text-[var(--accent)] animate-countUp font-bold">{filteredAndSortedTasks.length}</span> tasks found
          </p>
        </div>
        <Button type="button" size="lg" onClick={() => setShowModal(true)} className="btn-gradient animate-breathe cursor-pointer rounded-xl font-semibold shadow-md">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </Button>
      </div>

      {/* Search, Filters and View Mode */}
      <div className="glass-card backdrop-blur-md rounded-2xl p-5 sm:p-6 mb-8 border border-[var(--border-default)] shadow-lg animate-slideInRight">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search tasks by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={
                <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              className="h-12 text-base rounded-xl border border-[var(--border-default)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/50 transition-all bg-[var(--bg-input)]"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Beautiful custom sort select */}
            <div className="relative flex-shrink-0 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] hover:border-[var(--border-strong)] transition-all text-sm w-full sm:w-auto shadow-sm cursor-pointer font-semibold"
              >
                <option value="newest">Sort: Newest</option>
                <option value="due">Sort: Due Soon</option>
                <option value="priority">Sort: Priority</option>
                <option value="alphabetical">Sort: Alphabetical</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--text-secondary)]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Segmented iOS style View Mode Control */}
            <div className="flex bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-1 flex-shrink-0 w-full sm:w-auto justify-between">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-[var(--accent)] text-white shadow-md' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]/60'
                }`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  viewMode === 'kanban' 
                    ? 'bg-[var(--accent)] text-white shadow-md' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]/60'
                }`}
                title="Kanban Board"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('priority')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  viewMode === 'priority' 
                    ? 'bg-[var(--accent)] text-white shadow-md' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]/60'
                }`}
                title="Priority Board"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21v11h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Pills with Custom Status-Theme Highlights */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mb-2">
          {['all', 'pending', 'inprogress', 'completed'].map(status => (
            <button
              type="button"
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer ${getStatusTabStyles(status, statusFilter === status)}`}
            >
              {status !== 'all' && <span className={`status-dot ${status}`}></span>}
              {status.charAt(0).toUpperCase() + status.slice(1).replace('inprogress', 'In Progress')}
            </button>
          ))}
        </div>
      </div>

      {/* Task Content Area */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader size="lg" />
        </div>
      ) : filteredAndSortedTasks.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title="No tasks found"
          description={searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first task to get started'}
          actionLabel="Create New Task"
          onAction={() => setShowModal(true)}
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-3 stagger">
          {Object.keys(tasksByDate).sort((a, b) => {
            const order = { 'Today': 0, 'Tomorrow': 1, 'Yesterday': 2, 'No Date': 999 };
            if (order[a] !== undefined && order[b] !== undefined) return order[a] - order[b];
            if (order[a] !== undefined) return -1;
            if (order[b] !== undefined) return 1;
            return new Date(a) - new Date(b);
          }).flatMap((dateCategory) => tasksByDate[dateCategory]).map((task) => (
            <Card 
              key={task.id} 
              className={`relative z-10 hover:z-30 glass-card card-lift p-5 border-l-4 ${getStatusColorClass(task.status)} ${isOverdue(task.dueDate ?? task.due_date, task.status) ? 'overdue-pulse' : ''} hover:shadow-lg transition-shadow duration-300 animate-fadeSlideUp rounded-2xl`}
            >
              {/* Created Date Badge — top of card */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px 3px 7px',
                borderRadius: '999px',
                background: 'rgba(124,111,247,0.10)',
                border: '1px solid rgba(124,111,247,0.22)',
                marginBottom: '14px',
                width: 'fit-content',
              }}>
                <svg style={{ width: '12px', height: '12px', color: 'var(--accent)', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.02em' }}>
                  Created {formatCreatedDate(task.createdAt ?? task.created_at, 'MMM d, yyyy') || '—'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                {/* Left Section: Status, Title, Description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3.5 mb-3">
                    {renderStatusDropdown(task)}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base font-bold break-words ${task.status === 'completed' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className={`text-sm text-[var(--text-secondary)] mt-1 line-clamp-2 ${task.status === 'completed' ? 'line-through' : ''}`}>
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    <Badge variant={task.priority} size="sm" dot>{task.priority}</Badge>
                    <Badge variant={task.status} size="sm">{task.status === 'inprogress' ? 'In Progress' : task.status}</Badge>
                    {(task.dueDate ?? task.due_date) && (
                      <span className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                        isOverdue(task.dueDate ?? task.due_date, task.status) 
                          ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger)]/20 font-semibold shadow-sm' 
                          : 'bg-[var(--bg-card)]/60 text-[var(--text-secondary)] border-[var(--border-default)]'
                      }`}>
                        {isOverdue(task.dueDate ?? task.due_date, task.status) ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        {isOverdue(task.dueDate ?? task.due_date, task.status) && <span className="font-bold uppercase tracking-wider text-[9px] mr-0.5">Overdue</span>}
                        {format(parseISO(task.dueDate ?? task.due_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Section: Action Buttons with micro-hover backgrounds */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(task)}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-[var(--accent)]/20"
                    title="Edit Task"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(task.id)}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] rounded-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-[var(--color-danger)]/20"
                    title="Delete Task"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeSlideUp">
          {Object.entries(kanbanColumns).map(([status, columnTasks]) => (
            <div key={status} className="glass-card backdrop-blur-md rounded-2xl p-4 border border-[var(--border-default)] shadow-lg animate-slideInRight">
              <div className="section-header justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`status-dot ${status}`}></span>
                  <h3 className="font-bold text-[var(--text-primary)] capitalize text-base">
                    {status === 'inprogress' ? 'In Progress' : status}
                  </h3>
                </div>
                <span className="count-badge bg-[var(--border-default)] text-[var(--text-secondary)] font-bold">{columnTasks.length}</span>
              </div>
              <div className="space-y-3 min-h-[100px] stagger">
                {columnTasks.length === 0 ? (
                  <EmptyState 
                    icon={<svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                    title={`No ${status} tasks`}
                    description="Time to relax!"
                    actionLabel={null}
                    className="py-8 bg-transparent border-none shadow-none"
                  />
                ) : (
                  columnTasks.map((task) => (
                    <Card 
                      key={task.id} 
                      className={`relative z-10 hover:z-30 glass-card card-lift p-4 border-l-4 ${getStatusColorClass(task.status)} ${isOverdue(task.dueDate ?? task.due_date, task.status) ? 'overdue-pulse' : ''} rounded-xl flex flex-col min-h-[140px]`}
                    >
                      {/* Created Date Chip — top of kanban card */}
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px 2px 6px',
                        borderRadius: '999px',
                        background: 'rgba(124,111,247,0.10)',
                        border: '1px solid rgba(124,111,247,0.22)',
                        marginBottom: '10px',
                        width: 'fit-content',
                      }}>
                        <svg style={{ width: '10px', height: '10px', color: 'var(--accent)', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.02em' }}>
                          {formatCreatedDate(task.createdAt ?? task.created_at, 'MMM d, yyyy') || '—'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h4 className={`font-bold text-base truncate ${task.status === 'completed' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                          {task.title}
                        </h4>
                      </div>
                      {task.description && (
                        <p className={`text-xs text-[var(--text-secondary)] line-clamp-2 mb-3 flex-1 ${task.status === 'completed' ? 'line-through' : ''}`}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-col gap-2.5 mt-auto pt-3 border-t border-[var(--border-default)]">
                        <div className="flex items-center justify-between">
                          <Badge variant={task.priority} size="sm" dot>{task.priority}</Badge>
                          {(task.dueDate ?? task.due_date) && (
                            <span className={`text-[11px] flex items-center gap-1.5 px-2 py-0.5 rounded-lg border ${
                              isOverdue(task.dueDate ?? task.due_date, task.status)
                                ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger)]/20 font-semibold shadow-sm'
                                : 'bg-[var(--bg-card)]/60 text-[var(--text-secondary)] border-[var(--border-default)]'
                            }`}>
                              {isOverdue(task.dueDate ?? task.due_date, task.status) && (
                                <svg className="w-3 h-3 text-[var(--color-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              )}
                              {format(parseISO(task.dueDate ?? task.due_date), 'MMM d')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          {renderStatusDropdown(task, "sm")}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-lg transition-all duration-150 cursor-pointer border border-transparent hover:border-[var(--accent)]/10"
                              title="Edit Task"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDeleteConfirm(task.id)}
                              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] rounded-lg transition-all duration-150 cursor-pointer border border-transparent hover:border-[var(--color-danger)]/10"
                              title="Delete Task"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Priority Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeSlideUp">
          {Object.entries(priorityColumns).map(([priority, columnTasks]) => {
            const config = getPriorityConfig(priority);
            return (
              <div key={priority} className="glass-card backdrop-blur-md rounded-2xl p-4 border border-[var(--border-default)] shadow-lg animate-slideInLeft">
                <div className="section-header justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`status-dot ${priority}`}></span>
                    <h3 className="font-bold text-[var(--text-primary)] text-base">
                      {config.label}
                    </h3>
                  </div>
                  <span className="count-badge bg-[var(--border-default)] text-[var(--text-secondary)] font-bold">{columnTasks.length}</span>
                </div>
                <div className="space-y-3 min-h-[100px] stagger">
                  {columnTasks.length === 0 ? (
                    <EmptyState 
                      icon={<svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                      title={`No ${priority} priority tasks`}
                      description="Keep up the great work!"
                      actionLabel={null}
                      className="py-8 bg-transparent border-none shadow-none"
                    />
                  ) : (
                    columnTasks.map((task) => (
                      <Card 
                        key={task.id} 
                        className={`relative z-10 hover:z-30 glass-card card-lift p-4 flex gap-3 ${config.border} ${isOverdue(task.dueDate ?? task.due_date, task.status) ? 'overdue-pulse' : ''} rounded-xl`}
                      >
                        <div className={`priority-bar ${task.priority}`}></div>
                        <div className="flex-1 flex flex-col min-h-[120px]">
                          {/* Created Date Chip — top of priority card */}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px 2px 6px',
                            borderRadius: '999px',
                            background: 'rgba(124,111,247,0.10)',
                            border: '1px solid rgba(124,111,247,0.22)',
                            marginBottom: '10px',
                            width: 'fit-content',
                          }}>
                            <svg style={{ width: '10px', height: '10px', color: 'var(--accent)', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.02em' }}>
                              {formatCreatedDate(task.createdAt ?? task.created_at, 'MMM d, yyyy') || '—'}
                            </span>
                          </div>
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <h4 className={`font-bold text-base truncate ${task.status === 'completed' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                              {task.title}
                            </h4>
                          </div>
                          {task.description && (
                            <p className={`text-xs text-[var(--text-secondary)] line-clamp-2 mb-3 flex-1 ${task.status === 'completed' ? 'line-through' : ''}`}>
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border-default)]">
                            <div className="flex items-center gap-2">
                              {renderStatusDropdown(task, "sm")}
                              {(task.dueDate ?? task.due_date) && (
                                <span className={`text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                                  isOverdue(task.dueDate ?? task.due_date, task.status)
                                    ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger)]/20 font-semibold shadow-sm'
                                    : 'bg-[var(--bg-card)]/60 text-[var(--text-secondary)] border-[var(--border-default)]'
                                }`}>
                                  {format(parseISO(task.dueDate ?? task.due_date), 'MMM d')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(task)}
                                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-lg transition-colors cursor-pointer"
                                title="Edit Task"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(task.id)}
                                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] rounded-lg transition-colors cursor-pointer"
                                title="Delete Task"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation & Editing Modal with Premium Form Elements */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetFormData();
        }}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        size="md"
      >
        <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-5 animate-slideDown">
          <Input
            label="Title"
            name="title"
            placeholder="Enter task title (e.g., 'Finish project report')"
            value={formData.title}
            onChange={handleFormChange}
            autoFocus
            className="text-base rounded-xl border border-[var(--border-default)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/50 transition-all bg-[var(--bg-input)]"
          />

          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/50 transition-all resize-none text-base placeholder-[var(--text-muted)]"
              rows={4}
              placeholder="Add a detailed description for your task..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Status</label>
            <div className="grid grid-cols-3 gap-3">
              {['pending', 'inprogress', 'completed'].map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, status })}
                  className={`${getStatusButtonClass(status, formData.status)}`}
                >
                  <span className={`status-dot ${status}`}></span>
                  {status === 'inprogress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Priority</label>
            <div className="grid grid-cols-3 gap-3">
              {['low', 'medium', 'high'].map(priority => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`${getPriorityButtonClass(priority, formData.priority)}`}
                >
                  <span className={`status-dot ${priority}`}></span>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Due Date</label>
            <Input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleFormChange}
              className="text-base rounded-xl border border-[var(--border-default)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/50 transition-all bg-[var(--bg-input)]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetFormData();
              }}
              className="flex-1 rounded-xl cursor-pointer font-semibold"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 btn-gradient rounded-xl cursor-pointer font-semibold shadow-md">
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Task"
        size="sm"
      >
        <div className="space-y-4 animate-scaleIn">
          <p className="text-[var(--text-secondary)] text-center text-sm font-medium">Are you sure you want to delete this task? This action cannot be undone.</p>
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-xl cursor-pointer font-semibold">
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => showDeleteConfirm && handleDeleteTask(showDeleteConfirm)}
              className="flex-1 rounded-xl cursor-pointer font-semibold bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 border-none shadow-md text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
