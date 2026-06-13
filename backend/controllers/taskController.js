const Task = require('../models/Task');

// @desc    Get all tasks for a user
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, category, search, sortBy } = req.query;
    
    // Build filters object
    const filters = {};
    if (status && status !== 'all') filters.status = status;
    if (priority && priority !== 'all') filters.priority = priority;
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (sortBy) filters.sortBy = sortBy;

    const tasks = await Task.findByUserId(req.user.id, filters);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Make sure user owns task
    if (task.user_id !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this task'
      });
    }
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    // Add user to req.body
    const taskData = {
      ...req.body,
      userId: req.user.id
    };
    
    const task = await Task.create(taskData);
    
    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    // First check if task exists and user owns it
    const existingTask = await Task.findById(req.params.id);
    
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Make sure user owns task
    if (existingTask.user_id !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }
    
    const task = await Task.update(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    // First check if task exists and user owns it
    const existingTask = await Task.findById(req.params.id);
    
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Make sure user owns task
    if (existingTask.user_id !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }
    
    const result = await Task.delete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete all completed tasks
// @route   DELETE /api/tasks/completed
// @access  Private
exports.clearCompletedTasks = async (req, res) => {
  try {
    const result = await Task.deleteCompletedByUserId(req.user.id);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Clear completed tasks error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete all tasks
// @route   DELETE /api/tasks/all
// @access  Private
exports.clearAllTasks = async (req, res) => {
  try {
    const result = await Task.deleteAllByUserId(req.user.id);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Clear all tasks error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
