const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase, pool } = require('./db');
const { taskReminderCron } = require('./cron/taskReminders');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize PostgreSQL database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    console.log('PostgreSQL database initialized');

    // Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/tasks', require('./routes/tasks'));

    // Start background jobs
    taskReminderCron.start();
    console.log('Task reminder cron job initialized');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  console.log('PostgreSQL pool closed');
  process.exit(0);
});

startServer();
