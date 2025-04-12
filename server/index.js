const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const { format, addDays, startOfYear, eachDayOfInterval } = require('date-fns');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, '../wfh.db');
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS status_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, date)
  );

  CREATE TABLE IF NOT EXISTS users (
    igg TEXT PRIMARY KEY,         -- Assuming IGG is the unique identifier
    fullName TEXT NOT NULL,
    jobTitle TEXT NOT NULL,
    area TEXT,
    email TEXT NOT NULL UNIQUE, -- Ensure email is unique
    reportsTo TEXT,              -- This might reference another user's fullName or IGG
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const statuses = ['H', 'O', 'L', 'T', 'S'];
const startDate = new Date(2025, 0, 1); // January 1st, 2025
const endDate = new Date(2025, 2, 31); // March 31st, 2025

const days = eachDayOfInterval({ start: startDate, end: endDate });
const insertStatus = db.prepare(`
  INSERT OR IGNORE INTO status_entries (email, date, status, comment)
  VALUES (@email, @date, @status, @comment)
`);

const insertAuditLog = db.prepare(`
  INSERT OR IGNORE INTO audit_logs (timestamp, user_id, action, details)
  VALUES (@timestamp, @userId, @action, @details)
`);

// Function to seed data
const seedData = () => {
  console.log('Starting data seeding process...');

  // 1. Seed Users Table (if empty)
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('Users table is empty, seeding from users.json...');
    const fs = require('fs'); // Require fs only here
    const usersDataPath = path.join(__dirname, '../src/data/users.json');
    try {
      const usersData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
      const insertUser = db.prepare(`
        INSERT INTO users (igg, fullName, jobTitle, area, email, reportsTo)
        VALUES (@igg, @fullName, @jobTitle, @area, @email, @reportsTo)
      `);
      const seedUsersTransaction = db.transaction((usersToSeed) => {
        for (const user of usersToSeed) {
          insertUser.run(user);
        }
      });
      seedUsersTransaction(usersData.users);
      console.log(`Seeded ${usersData.users.length} users.`);
    } catch (error) {
      console.error(`Error reading or seeding from ${usersDataPath}:`, error);
      // Decide if we should proceed without users or stop
      return; 
    }
  } else {
    console.log(`Found ${userCount} existing users, skipping user seed.`);
  }

  // 2. Seed Status Entries (if empty)
  const statusEntryCount = db.prepare('SELECT COUNT(*) as count FROM status_entries').get().count;
  if (statusEntryCount > 0) {
    console.log(`Found ${statusEntryCount} existing status entries, skipping status seed.`);
    return;
  }

  console.log('No existing status entries found, starting status seed process...');
  // Fetch users from the database now for status seeding
  const usersFromDb = db.prepare('SELECT * FROM users').all();
  if (usersFromDb.length === 0) {
    console.warn('No users found in the database to seed statuses for. Aborting status seed.');
    return;
  }

  // Begin transaction for statuses
  const seedStatusesTransaction = db.transaction(() => {
    days.forEach(day => {
      usersFromDb.forEach(user => { // Use usersFromDb here
        // Skip weekends
        if (day.getDay() === 0 || day.getDay() === 6) return;

        // Clear any existing entries first
        db.prepare('DELETE FROM status_entries WHERE email = ? AND date = ?').run(user.email, format(day, 'yyyy-MM-dd'));
        
        // 80% chance of having a status entry for workdays
        if (Math.random() < 0.8) {
          // Weighted status distribution
          let status;
          const rand = Math.random();
          if (rand < 0.6) { // 60% chance of office or home
            status = Math.random() < 0.5 ? 'O' : 'H';
          } else if (rand < 0.8) { // 20% chance of leave
            status = 'L';
          } else if (rand < 0.9) { // 10% chance of training
            status = 'T';
          } else { // 10% chance of sick
            status = 'S';
          }

          const entry = {
            email: user.email,
            date: format(day, 'yyyy-MM-dd'),
            status,
            comment: `Auto-generated ${status} status for ${user.fullName}`
          };

          insertStatus.run(entry);

          // Add audit log entry
          insertAuditLog.run({
            timestamp: format(day, 'yyyy-MM-dd HH:mm:ss'),
            userId: user.email,
            action: 'UPDATE_STATUS',
            details: JSON.stringify(entry)
          });
        }
      });
    });
  });

  // Execute the transaction
  seedStatusesTransaction();
  console.log('Seed process completed successfully!');
};

// Call seedData function
seedData();

// Routes

// Get monthly statuses
app.get('/api/status/monthly/:date', (req, res) => {
  try {
    const monthKey = format(new Date(req.params.date), 'yyyy-MM');
    const statuses = db.prepare(`
      SELECT * FROM status_entries 
      WHERE date LIKE ? || '%'
      ORDER BY date ASC
    `).all(monthKey);
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user status
app.get('/api/status/:email/:date', (req, res) => {
  try {
    const status = db.prepare(`
      SELECT * FROM status_entries 
      WHERE email = ? AND date = ?
    `).get(req.params.email, req.params.date);
    res.json(status || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update status
app.post('/api/status', (req, res) => {
  try {
    const { email, date, status, comment } = req.body;
    db.prepare(`
      INSERT OR REPLACE INTO status_entries (email, date, status, comment)
      VALUES (@email, @date, @status, @comment)
    `).run({ email, date, status, comment });

    // Log the update
    db.prepare(`
      INSERT INTO audit_logs (timestamp, user_id, action, details)
      VALUES (@timestamp, @userId, @action, @details)
    `).run({
      timestamp: new Date().toISOString(),
      userId: email,
      action: 'UPDATE_STATUS',
      details: JSON.stringify({ date, status, comment })
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete status
app.delete('/api/status/:email/:date', (req, res) => {
  try {
    db.prepare(`
      DELETE FROM status_entries 
      WHERE email = ? AND date = ?
    `).run(req.params.email, req.params.date);

    // Log the deletion
    db.prepare(`
      INSERT INTO audit_logs (timestamp, user_id, action, details)
      VALUES (@timestamp, @userId, @action, @details)
    `).run({
      timestamp: new Date().toISOString(),
      userId: req.params.email,
      action: 'DELETE_STATUS',
      details: `Deleted status for date: ${req.params.date}`
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs
app.get('/api/audit-logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = db.prepare(`
      SELECT * FROM audit_logs 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get users
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY fullName ASC').all();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Add status count endpoint
app.get('/api/status/count', (req, res) => {
  try {
    const result = db.prepare('SELECT COUNT(*) as count FROM status_entries').get();
    res.json({ count: result.count });
  } catch (error) {
    console.error('Error getting status count:', error);
    res.status(500).json({ error: 'Failed to get status count' });
  }
});

// Clear database endpoint (for testing)
app.post('/api/reset-database', (req, res) => {
  try {
    db.prepare('DELETE FROM status_entries').run();
    db.prepare('DELETE FROM audit_logs').run();
    seedData();
    res.json({ message: 'Database reset and reseeded successfully' });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
