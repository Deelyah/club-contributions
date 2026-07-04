import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { DB_PATH } from './paths.js'

let db

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDb() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      profile_picture TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dues_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      start_date TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      period_label TEXT NOT NULL,
      payment_date TEXT NOT NULL,
      due_amount REAL NOT NULL,
      amount_paid REAL NOT NULL DEFAULT 0,
      receipt_path TEXT,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_member_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Migrations
  const cols = db.prepare('PRAGMA table_info(payments)').all()
  if (cols.find((c) => c.name === 'augmented_amount')) {
    db.exec('ALTER TABLE payments DROP COLUMN augmented_amount')
  }

  // Merge due_date + paid_date into a single payment_date column
  if (cols.find((c) => c.name === 'paid_date') && !cols.find((c) => c.name === 'payment_date')) {
    db.exec('ALTER TABLE payments RENAME COLUMN paid_date TO payment_date')
  }
  if (cols.find((c) => c.name === 'due_date')) {
    // Backfill payment_date from the old due_date wherever it was never recorded
    db.exec("UPDATE payments SET payment_date = due_date WHERE payment_date IS NULL OR payment_date = ''")
    db.exec('ALTER TABLE payments DROP COLUMN due_date')
  }

  const existing = db.prepare("SELECT id FROM users WHERE role = 'admin'").get()
  if (!existing) {
    const id = uuidv4()
    const hash = bcrypt.hashSync('Admin@1234', 10)
    db.prepare(
      'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(id, 'admin', 'admin@club.local', hash, 'admin')
    console.log('Default admin seeded — username: admin  password: Admin@1234')
  }
}
