import React, { useState } from 'react';

const TaskItem = ({ task, onEdit, onDelete, onToggleStatus, onUpdatePriority }) => {
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className={`task-card ${getPriorityColor(task.priority)} ${
      task.status === 'completed' ? 'opacity-75' : ''
    }`}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {/* Checkbox */}
          <button
            onClick={() => onToggleStatus(task.id)}
            className="mt-1 flex-shrink-0"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              task.status === 'completed'
                ? 'bg-blue-600 border-blue-600'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
            }`}>
              {task.status === 'completed' && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className={`text-base md:text-lg font-medium text-gray-900 dark:text-white ${
                task.status === 'completed' ? 'line-through' : ''
              }`}>
                {task.title}
              </h3>
              
              {/* Status Badge */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(task.status)}`}>
                {task.status}
              </span>

              {/* Overdue Badge */}
              {isOverdue && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Overdue
                </span>
              )}
            </div>

            {/* Priority Badge - Mobile friendly */}
            <div className="relative mb-2 inline-block">
              <button
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all ${getPriorityBadgeColor(task.priority)}`}
              >
                <span className="capitalize">{task.priority}</span>
                <svg className="w-3 h-3 ml-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{transform: showPriorityMenu ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showPriorityMenu && (
                <div className="absolute left-0 mt-1 w-28 bg-white dark:bg-[var(--bg-card)] rounded-md shadow-lg border border-gray-200 dark:border-[var(--border-default)] z-20">
                  <div className="py-1">
                    {['low', 'medium', 'high'].map(p => (
                      <button
                        key={p}
                        onClick={() => {
                          onUpdatePriority(task.id, p);
                          setShowPriorityMenu(false);
                        }}
                        className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-[var(--bg-base)] capitalize transition-colors ${task.priority === p ? 'font-bold text-[var(--accent)] bg-gray-50 dark:bg-[var(--bg-base)]' : 'text-[var(--text-primary)]'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {task.description && (
              <p className={`text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 ${
                task.status === 'completed' ? 'line-through' : ''
              }`}>
                {task.description}
              </p>
            )}

            {/* Task Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {task.category && (
                <span className="flex items-center">
                  <span className="mr-1">🏷️</span>
                  <span className="truncate">{task.category}</span>
                </span>
              )}
              
              {task.dueDate && (
                <span className={`flex items-center ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                  <span className="mr-1">📅</span>
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions - Responsive buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-auto">
          <button
            onClick={() => onEdit(task)}
            className="p-2.5 md:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Edit task"
          >
            <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            onClick={() => onDelete(task.id)}
            className="p-2.5 md:p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete task"
          >
            <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
