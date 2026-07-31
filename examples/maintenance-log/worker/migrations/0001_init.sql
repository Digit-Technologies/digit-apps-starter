CREATE TABLE IF NOT EXISTS maintenance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_name TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  scheduled INTEGER NOT NULL DEFAULT 0,
  last_inspection_date TEXT,
  performed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
