import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import ConfirmModal from './ConfirmModal';
import toast from 'react-hot-toast';

const TaskList = () => {
  const { tasks, loading, updateTask, deleteTask, toggleTaskStatus } = useTask();
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);

  const handleEdit = (task) => {
    setEditingTask(task);
  };

  const handleUpdate = async (taskData) => {
    const result = await updateTask(editingTask.id, taskData);
    if (result.success) {
      setEditingTask(null);
      toast.success('Task updated successfully!');
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (id) => {
    setDeleteTaskId(id);
  };

  const confirmDelete = async () => {
    const result = await deleteTask(deleteTaskId);
    if (result.success) {
      toast.success('Task deleted successfully!');
      setDeleteTaskId(null);
    } else {
      toast.error(result.error);
    }
  };

  const handleToggleStatus = async (id) => {
    const result = await toggleTaskStatus(id);
    if (result.success) {
      toast.success('Task status updated!');
    } else {
      toast.error(result.error);
    }
  };

  const handleUpdatePriority = async (id, priority) => {
    const taskToUpdate = tasks.find(t => t.id === id);
    if (!taskToUpdate) return;
    
    const result = await updateTask(id, { ...taskToUpdate, priority });
    if (result.success) {
      toast.success(`Priority updated to ${priority}`);
    } else {
      toast.error(result.error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No tasks found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Get started by creating your first task!
        </p>
        <button
          onClick={() => setEditingTask({})}
          className="btn btn-primary"
        >
          Create Your First Task
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {editingTask && (
        <div className="animate-slide-down">
          <TaskForm
            initialData={editingTask}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTask(null)}
          />
        </div>
      )}

      <div className="grid gap-4">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onUpdatePriority={handleUpdatePriority}
          />
        ))}
      </div>

      <ConfirmModal
        isOpen={deleteTaskId !== null}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={confirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default TaskList;
