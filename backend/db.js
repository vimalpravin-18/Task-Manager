const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function for queries
const query = (text, params) => pool.query(text, params);

// Initialize database tables
const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ensure bio and avatar_url exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT ''
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(50) DEFAULT 'medium',
        category VARCHAR(255),
        due_date DATE,
        reminder_sent BOOLEAN DEFAULT FALSE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ensure reminder_sent exists
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE
    `);

    // Backfill any null created_at values to prevent formatting issues
    await pool.query(`
      UPDATE tasks SET created_at = NOW() WHERE created_at IS NULL
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        theme VARCHAR(50) DEFAULT 'light',
        accent_color VARCHAR(50) DEFAULT '#7c6ff7',
        default_view VARCHAR(50) DEFAULT 'list',
        default_sort VARCHAR(50) DEFAULT 'newest',
        daily_task_goal INTEGER DEFAULT 5,
        weekly_task_goal INTEGER DEFAULT 20
      )
    `);

    await pool.query(`
      ALTER TABLE user_preferences 
      ADD COLUMN IF NOT EXISTS daily_task_goal INTEGER DEFAULT 5,
      ADD COLUMN IF NOT EXISTS weekly_task_goal INTEGER DEFAULT 20
    `);

    // Email notification preferences
    await pool.query(`
      ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS reminder_lead_hours INTEGER DEFAULT 24
    `);

    console.log('PostgreSQL tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error.message);
    throw error;
  }
};

module.exports = { pool, query, initializeDatabase };
