const { query } = require('../db');

class Task {
  static async create(taskData) {
    const { title, description, status, priority, category, dueDate, due_date, userId } = taskData;
    
    // Use dueDate if due_date is not provided (handles both camelCase and snake_case)
    let finalDueDate = dueDate !== undefined ? dueDate : due_date;
    // PostgreSQL DATE column rejects empty strings — convert to null
    if (finalDueDate === '' || finalDueDate === undefined) finalDueDate = null;
    
    const result = await query(
      `INSERT INTO tasks (title, description, status, priority, category, due_date, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, status || 'pending', priority || 'medium', category, finalDueDate, userId]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(userId, filters = {}) {
    let queryText = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    // Add filters
    if (filters.status && filters.status !== 'all') {
      queryText += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.priority && filters.priority !== 'all') {
      queryText += ` AND priority = $${paramIndex}`;
      params.push(filters.priority);
      paramIndex++;
    }

    if (filters.category) {
      queryText += ` AND category ILIKE $${paramIndex}`;
      params.push(`%${filters.category}%`);
      paramIndex++;
    }

    if (filters.search) {
      queryText += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex + 1})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
      paramIndex += 2;
    }

    // Add sorting
    if (filters.sortBy === 'date') {
      queryText += ' ORDER BY created_at DESC';
    } else if (filters.sortBy === 'priority') {
      queryText += ' ORDER BY CASE priority WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 WHEN \'low\' THEN 3 END, created_at DESC';
    } else if (filters.sortBy === 'dueDate') {
      queryText += ' ORDER BY due_date ASC';
    } else {
      queryText += ' ORDER BY created_at DESC';
    }

    const result = await query(queryText, params);
    return result.rows;
  }

  static async update(id, taskData) {
    const { title, description, status, priority, category, due_date, dueDate } = taskData;
    
    // Only include due_date in update if caller explicitly provided a date field
    const hasDateField = ('dueDate' in taskData) || ('due_date' in taskData);
    let finalDueDate = null;
    if (hasDateField) {
      finalDueDate = dueDate !== undefined ? dueDate : due_date;
      // PostgreSQL DATE column rejects empty strings — convert to null
      if (finalDueDate === '' || finalDueDate === undefined) finalDueDate = null;
    }
    
    // Build dynamic update query based on provided fields
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(title);
      paramIndex++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }
    if (category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    if (hasDateField) {
      updates.push(`due_date = $${paramIndex}`);
      params.push(finalDueDate);
      paramIndex++;
    }
    
    // Always update updated_at
    updates.push('updated_at = NOW()');
    
    if (updates.length === 1) {
      // Only updated_at, nothing else to change
      return await Task.findById(id);
    }
    
    params.push(id);
    const queryText = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await query(queryText, params);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM tasks WHERE id = $1',
      [id]
    );
    return { deleted: result.rowCount > 0 };
  }

  static async getUserTaskCount(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM tasks WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  static async deleteCompletedByUserId(userId) {
    const result = await query(
      'DELETE FROM tasks WHERE user_id = $1 AND status = $2',
      [userId, 'completed']
    );
    return { deletedCount: result.rowCount };
  }

  static async deleteAllByUserId(userId) {
    const result = await query(
      'DELETE FROM tasks WHERE user_id = $1',
      [userId]
    );
    return { deletedCount: result.rowCount };
  }
}

module.exports = Task;
