const { pool } = require('./db');

const exportData = async () => {
  console.log('📊 Exporting PostgreSQL Database Data...\n');

  try {
    // Export Users
    const users = await pool.query('SELECT * FROM users');
    console.log('👥 USERS:');
    console.log(JSON.stringify(users.rows, null, 2));

    // Export Tasks
    const tasks = await pool.query('SELECT * FROM tasks');
    console.log('\n✅ TASKS:');
    console.log(JSON.stringify(tasks.rows, null, 2));

    // Export Tasks with User Info
    const joinedData = await pool.query(`
      SELECT t.*, u.name as user_name, u.email as user_email 
      FROM tasks t 
      JOIN users u ON t.user_id = u.id
    `);
    console.log('\n📋 TASKS WITH USER INFO:');
    console.log(JSON.stringify(joinedData.rows, null, 2));

    console.log('\n✅ Export complete!');
  } catch (error) {
    console.error('Export error:', error.message);
  } finally {
    await pool.end();
  }
};

exportData();
