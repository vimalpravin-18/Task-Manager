const cron = require('node-cron');
const { query } = require('../db');
const { sendOverdueTaskEmail } = require('../services/emailService');

// Run every day at 7:00 AM
const taskReminderCron = cron.schedule('0 7 * * *', async () => {
  console.log('[Cron] Checking for overdue tasks...');
  try {
    // Find tasks that are past due date, not completed, and haven't had a reminder sent yet
    const result = await query(`
      SELECT t.id, t.title, t.due_date, u.name as user_name, u.email as user_email
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE t.due_date < CURRENT_DATE
        AND t.status != 'completed'
        AND t.reminder_sent = FALSE
        AND (up.email_notifications IS NULL OR up.email_notifications = TRUE)
    `);

    const overdueTasks = result.rows;

    if (overdueTasks.length === 0) {
      console.log('[Cron] No overdue tasks found needing reminders.');
      return;
    }

    console.log(`[Cron] Found ${overdueTasks.length} overdue tasks to process.`);

    for (const task of overdueTasks) {
      const emailSent = await sendOverdueTaskEmail(
        task.user_email,
        task.user_name,
        task.title,
        task.due_date
      );

      // Only mark as sent if email actually sent successfully
      if (emailSent) {
        await query(
          'UPDATE tasks SET reminder_sent = TRUE WHERE id = $1',
          [task.id]
        );
      }
    }

    console.log('[Cron] Finished processing overdue tasks.');
  } catch (error) {
    console.error('[Cron] Error processing task reminders:', error.message);
  }
}, {
  scheduled: false // Do not start automatically upon import
});

module.exports = {
  taskReminderCron
};
