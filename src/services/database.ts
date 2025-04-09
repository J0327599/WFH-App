import Database from 'better-sqlite3';
import { format } from 'date-fns';
import { generatedData } from '../utils/generateFakeData';
import path from 'path';

const dbPath = path.join(process.cwd(), 'wfh.db');
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

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Prepare statements with type safety
const getMonthlyStatuses = db.prepare<[string]>(`
  SELECT * FROM status_entries 
  WHERE date LIKE ? || '%'
  ORDER BY date ASC
`);

const getUserStatus = db.prepare<[string, string]>(`
  SELECT * FROM status_entries 
  WHERE email = ? AND date = ?
`);

const insertStatus = db.prepare(`
  INSERT OR REPLACE INTO status_entries (email, date, status, comment)
  VALUES (@email, @date, @status, @comment)
`);

const deleteStatus = db.prepare<[string, string]>(`
  DELETE FROM status_entries 
  WHERE email = ? AND date = ?
`);

const insertAuditLog = db.prepare(`
  INSERT INTO audit_logs (timestamp, user_id, action, details)
  VALUES (@timestamp, @userId, @action, @details)
`);

// Seed initial data if the database is empty
const count = (db.prepare('SELECT COUNT(*) as count FROM status_entries').get() as { count: number }).count;
if (count === 0) {
  const insertMany = db.transaction((entries: StatusEntry[]) => {
    for (const entry of entries) {
      insertStatus.run(entry);
    }
  });

  // Convert generated data to flat array
  const entries = Object.values(generatedData.statusHistory).flatMap(
    month => month.statuses
  );
  
  insertMany(entries);

  // Add initial audit log
  insertAuditLog.run({
    timestamp: new Date().toISOString(),
    userId: 'system',
    action: 'SEED_DATA',
    details: 'Initial data seeded from generated data'
  });
}

export interface StatusEntry {
  id?: number;
  email: string;
  date: string;
  status: string;
  comment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id?: number;
  timestamp: string;
  userId: string;
  action: string;
  details?: string;
  created_at?: string;
}

export const dbService = {
  getMonthlyStatuses(date: Date): StatusEntry[] {
    const monthKey = format(date, 'yyyy-MM');
    return getMonthlyStatuses.all(monthKey) as StatusEntry[];
  },

  getUserStatus(email: string, date: string): StatusEntry | undefined {
    return getUserStatus.get(email, date) as StatusEntry | undefined;
  },

  updateStatus(entry: StatusEntry): void {
    insertStatus.run(entry);
    
    // Log the update
    insertAuditLog.run({
      timestamp: new Date().toISOString(),
      userId: entry.email,
      action: 'UPDATE_STATUS',
      details: JSON.stringify({
        date: entry.date,
        status: entry.status,
        comment: entry.comment
      })
    });
  },

  deleteStatus(email: string, date: string): void {
    deleteStatus.run(email, date);
    
    // Log the deletion
    insertAuditLog.run({
      timestamp: new Date().toISOString(),
      userId: email,
      action: 'DELETE_STATUS',
      details: `Deleted status for date: ${date}`
    });
  },

  getAuditLogs(limit: number = 100): AuditLog[] {
    return db.prepare<[number]>(`
      SELECT * FROM audit_logs 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(limit) as AuditLog[];
  }
};
