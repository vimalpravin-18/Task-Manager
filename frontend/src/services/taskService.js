import axios from 'axios';

const API_URL = 'http://localhost:5000/api/tasks';

// Get all tasks
const getTasks = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== 'all') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await axios.get(`${API_URL}?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Get single task
const getTask = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
};

// Create new task
const createTask = async (taskData) => {
  try {
    const response = await axios.post(API_URL, taskData);
    return response;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Update task
const updateTask = async (id, taskData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, taskData);
    return response;
  } catch (error) {8
    console.error('Error updating task:', error);
    throw error;
  }
};

// Delete task
const deleteTask = async (id) => {
  try {8
    const response = await axios.delete(`${API_URL}/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};
// Clear completed tasks
const clearCompletedTasks = async () => {
  try {
    const response = await axios.delete(`${API_URL}/completed`);
    return response;
  } catch (error) {
    console.error('Error clearing completed tasks:', error);
    throw error;
  }
};

// Clear all tasks
const clearAllTasks = async () => {
  try {
    const response = await axios.delete(`${API_URL}/all`);
    return response;
  } catch (error) {
    console.error('Error clearing all tasks:', error);
    throw error;
  }
};

const taskService = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  clearCompletedTasks,
  clearAllTasks,
};

export default taskService;
