const { query } = require('../db');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { name, email, password } = userData;
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hash]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, name, email, bio, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByIdWithPassword(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getPreferences(userId) {
    const result = await query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  static async savePreferences(userId, preferences) {
    const { theme, accent_color, default_view, default_sort, daily_task_goal, weekly_task_goal, email_notifications, reminder_lead_hours } = preferences;
    const result = await query(
      `INSERT INTO user_preferences (user_id, theme, accent_color, default_view, default_sort, daily_task_goal, weekly_task_goal, email_notifications, reminder_lead_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO UPDATE SET
       theme = COALESCE(EXCLUDED.theme, user_preferences.theme),
       accent_color = COALESCE(EXCLUDED.accent_color, user_preferences.accent_color),
       default_view = COALESCE(EXCLUDED.default_view, user_preferences.default_view),
       default_sort = COALESCE(EXCLUDED.default_sort, user_preferences.default_sort),
       daily_task_goal = COALESCE(EXCLUDED.daily_task_goal, user_preferences.daily_task_goal),
       weekly_task_goal = COALESCE(EXCLUDED.weekly_task_goal, user_preferences.weekly_task_goal),
       email_notifications = COALESCE(EXCLUDED.email_notifications, user_preferences.email_notifications),
       reminder_lead_hours = COALESCE(EXCLUDED.reminder_lead_hours, user_preferences.reminder_lead_hours)
       RETURNING *`,
      [
        userId,
        theme || null,
        accent_color || null,
        default_view || null,
        default_sort || null,
        daily_task_goal !== undefined ? daily_task_goal : null,
        weekly_task_goal !== undefined ? weekly_task_goal : null,
        email_notifications !== undefined ? email_notifications : null,
        reminder_lead_hours !== undefined ? reminder_lead_hours : null
      ]
    );
    return result.rows[0];
  }

  static async updateProfile(id, name, email, bio, avatar_url) {
    const result = await query(
      'UPDATE users SET name = $1, email = $2, bio = $3, avatar_url = $4 WHERE id = $5 RETURNING id, name, email, bio, avatar_url',
      [name, email, bio || '', avatar_url || '', id]
    );
    return result.rows[0];
  }

  static async updatePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hash, id]
    );
    return { success: true };
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return { deleted: result.rowCount > 0 };
  }
}

module.exports = User;
