const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'suggestions.db');
const db = new DatabaseSync(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS suggestions (
    id TEXT PRIMARY KEY,
    ticket_code TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    urgency TEXT DEFAULT 'Normal',
    status TEXT DEFAULT 'Submitted',
    hr_response TEXT DEFAULT NULL,
    hr_responded_at TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    ticket_code TEXT,
    timestamp TEXT NOT NULL
  );
`);

console.log('[DB] SQLite database initialized at:', dbPath);

module.exports = {
  createSuggestion: ({ ticketCode, category, title, content, urgency }) => {
    const now = new Date().toISOString();
    const id = 'sug_' + Math.random().toString(36).substring(2, 10);
    const stmt = db.prepare(`
      INSERT INTO suggestions (id, ticket_code, category, title, content, urgency, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'Submitted', ?, ?)
    `);
    stmt.run(id, ticketCode, category, title, content, urgency || 'Normal', now, now);
    
    const logStmt = db.prepare(`
      INSERT INTO audit_logs (action, ticket_code, timestamp)
      VALUES (?, ?, ?)
    `);
    logStmt.run('SUGGESTION_CREATED', ticketCode, now);

    return {
      id,
      ticket_code: ticketCode,
      category,
      title,
      content,
      urgency: urgency || 'Normal',
      status: 'Submitted',
      created_at: now,
      updated_at: now
    };
  },

  getAllSuggestions: () => {
    const stmt = db.prepare(`SELECT * FROM suggestions ORDER BY created_at DESC`);
    return stmt.all();
  },

  getSuggestionByTicket: (ticketCode) => {
    const stmt = db.prepare(`SELECT * FROM suggestions WHERE ticket_code = ?`);
    return stmt.get(ticketCode);
  },

  updateSuggestionStatus: (ticketCode, status, hrResponse) => {
    const now = new Date().toISOString();
    let stmt;
    if (hrResponse !== undefined) {
      stmt = db.prepare(`
        UPDATE suggestions 
        SET status = ?, hr_response = ?, hr_responded_at = ?, updated_at = ?
        WHERE ticket_code = ?
      `);
      stmt.run(status, hrResponse, now, now, ticketCode);
    } else {
      stmt = db.prepare(`
        UPDATE suggestions 
        SET status = ?, updated_at = ?
        WHERE ticket_code = ?
      `);
      stmt.run(status, now, ticketCode);
    }

    const logStmt = db.prepare(`
      INSERT INTO audit_logs (action, ticket_code, timestamp)
      VALUES (?, ?, ?)
    `);
    logStmt.run(`STATUS_UPDATED_${status}`, ticketCode, now);

    const getStmt = db.prepare(`SELECT * FROM suggestions WHERE ticket_code = ?`);
    return getStmt.get(ticketCode);
  },

  deleteSuggestion: (ticketCode) => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`DELETE FROM suggestions WHERE ticket_code = ?`);
    stmt.run(ticketCode);

    const logStmt = db.prepare(`
      INSERT INTO audit_logs (action, ticket_code, timestamp)
      VALUES (?, ?, ?)
    `);
    logStmt.run('SUGGESTION_DELETED', ticketCode, now);

    return { success: true, ticket_code: ticketCode };
  },

  getStats: () => {
    const total = db.prepare(`SELECT COUNT(*) as count FROM suggestions`).get().count;
    const submitted = db.prepare(`SELECT COUNT(*) as count FROM suggestions WHERE status = 'Submitted'`).get().count;
    const inReview = db.prepare(`SELECT COUNT(*) as count FROM suggestions WHERE status = 'In Review'`).get().count;
    const resolved = db.prepare(`SELECT COUNT(*) as count FROM suggestions WHERE status = 'Resolved'`).get().count;
    const rejected = db.prepare(`SELECT COUNT(*) as count FROM suggestions WHERE status = 'Rejected'`).get().count;
    return { total, submitted, inReview, resolved, rejected };
  }
};
