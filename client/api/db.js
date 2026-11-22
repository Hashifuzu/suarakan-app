const path = require('path');
const fs = require('fs');

let mode = 'sqlite';
let db = null;

// Determine storage path: writable /tmp on Vercel/AWS Lambda, or local dir
const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION;
const tempDir = isVercel ? '/tmp' : __dirname;
const sqlitePath = path.join(tempDir, 'suggestions.db');
const jsonPath = path.join(tempDir, 'suggestions_store.json');

// Initialize memory store for fallback
let memoryStore = {
  suggestions: [],
  auditLogs: []
};

function loadJsonStore() {
  try {
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      memoryStore = JSON.parse(raw);
      if (!Array.isArray(memoryStore.suggestions)) memoryStore.suggestions = [];
      if (!Array.isArray(memoryStore.auditLogs)) memoryStore.auditLogs = [];
    }
  } catch (err) {
    // Keep in-memory
  }
}

function saveJsonStore() {
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    // Ignore write error if environment is strict read-only
  }
}

try {
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(sqlitePath);
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
  mode = 'sqlite';
} catch (e) {
  mode = 'json';
  loadJsonStore();
}

module.exports = {
  createSuggestion: ({ ticketCode, category, title, content, urgency }) => {
    const now = new Date().toISOString();
    const id = 'sug_' + Math.random().toString(36).substring(2, 10);
    const code = ticketCode.toUpperCase().trim();

    if (mode === 'sqlite') {
      const stmt = db.prepare(`
        INSERT INTO suggestions (id, ticket_code, category, title, content, urgency, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'Submitted', ?, ?)
      `);
      stmt.run(id, code, category, title, content, urgency || 'Normal', now, now);
      
      const logStmt = db.prepare(`
        INSERT INTO audit_logs (action, ticket_code, timestamp)
        VALUES (?, ?, ?)
      `);
      logStmt.run('SUGGESTION_CREATED', code, now);
    } else {
      loadJsonStore();
      const newSug = {
        id,
        ticket_code: code,
        category,
        title,
        content,
        urgency: urgency || 'Normal',
        status: 'Submitted',
        hr_response: null,
        hr_responded_at: null,
        created_at: now,
        updated_at: now
      };
      memoryStore.suggestions.unshift(newSug);
      memoryStore.auditLogs.push({ action: 'SUGGESTION_CREATED', ticket_code: code, timestamp: now });
      saveJsonStore();
    }

    return {
      id,
      ticket_code: code,
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
    if (mode === 'sqlite') {
      const stmt = db.prepare(`SELECT * FROM suggestions ORDER BY created_at DESC`);
      return stmt.all();
    }
    loadJsonStore();
    return [...memoryStore.suggestions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getSuggestionByTicket: (ticketCode) => {
    if (!ticketCode) return null;
    const code = ticketCode.toUpperCase().trim();
    if (mode === 'sqlite') {
      const stmt = db.prepare(`SELECT * FROM suggestions WHERE ticket_code = ?`);
      return stmt.get(code);
    }
    loadJsonStore();
    return memoryStore.suggestions.find(s => s.ticket_code === code) || null;
  },

  updateSuggestionStatus: (ticketCode, status, hrResponse) => {
    if (!ticketCode) return null;
    const code = ticketCode.toUpperCase().trim();
    const now = new Date().toISOString();

    if (mode === 'sqlite') {
      let stmt;
      if (hrResponse !== undefined) {
        stmt = db.prepare(`
          UPDATE suggestions 
          SET status = ?, hr_response = ?, hr_responded_at = ?, updated_at = ?
          WHERE ticket_code = ?
        `);
        stmt.run(status, hrResponse, now, now, code);
      } else {
        stmt = db.prepare(`
          UPDATE suggestions 
          SET status = ?, updated_at = ?
          WHERE ticket_code = ?
        `);
        stmt.run(status, now, code);
      }

      const logStmt = db.prepare(`
        INSERT INTO audit_logs (action, ticket_code, timestamp)
        VALUES (?, ?, ?)
      `);
      logStmt.run(`STATUS_UPDATED_${status}`, code, now);

      const getStmt = db.prepare(`SELECT * FROM suggestions WHERE ticket_code = ?`);
      return getStmt.get(code);
    } else {
      loadJsonStore();
      const item = memoryStore.suggestions.find(s => s.ticket_code === code);
      if (item) {
        item.status = status || item.status;
        if (hrResponse !== undefined) {
          item.hr_response = hrResponse;
          item.hr_responded_at = now;
        }
        item.updated_at = now;
        memoryStore.auditLogs.push({ action: `STATUS_UPDATED_${status}`, ticket_code: code, timestamp: now });
        saveJsonStore();
        return { ...item };
      }
      return null;
    }
  },

  deleteSuggestion: (ticketCode) => {
    if (!ticketCode) return { success: false };
    const code = ticketCode.toUpperCase().trim();
    const now = new Date().toISOString();

    if (mode === 'sqlite') {
      const stmt = db.prepare(`DELETE FROM suggestions WHERE ticket_code = ?`);
      stmt.run(code);

      const logStmt = db.prepare(`
        INSERT INTO audit_logs (action, ticket_code, timestamp)
        VALUES (?, ?, ?)
      `);
      logStmt.run('SUGGESTION_DELETED', code, now);
    } else {
      loadJsonStore();
      memoryStore.suggestions = memoryStore.suggestions.filter(s => s.ticket_code !== code);
      memoryStore.auditLogs.push({ action: 'SUGGESTION_DELETED', ticket_code: code, timestamp: now });
      saveJsonStore();
    }

    return { success: true, ticket_code: code };
  },

  getStats: () => {
    if (mode === 'sqlite') {
      const total = db.prepare(`SELECT COUNT(*) as count FROM suggestions`).get().count;
      const submitted = db.prepare(`SELECT COUNT(*) as count FROM suggestions WHERE status = 'Submitted'`).get().count;
      const inReview = db.prepare(`SELECT COUNT(*) as count FROM suggestions WHERE status = 'In Review'`).get().count;
      const resolved = db.prepare(`SELECT COUNT(*) as count FROM suggestions WHERE status = 'Resolved'`).get().count;
      const rejected = db.prepare(`SELECT COUNT(*) as count FROM suggestions WHERE status = 'Rejected'`).get().count;
      return { total, submitted, inReview, resolved, rejected };
    }
    loadJsonStore();
    const list = memoryStore.suggestions;
    return {
      total: list.length,
      submitted: list.filter(s => s.status === 'Submitted').length,
      inReview: list.filter(s => s.status === 'In Review').length,
      resolved: list.filter(s => s.status === 'Resolved').length,
      rejected: list.filter(s => s.status === 'Rejected').length
    };
  }
};
