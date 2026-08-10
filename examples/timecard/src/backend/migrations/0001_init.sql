CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  clock_in_time TEXT NOT NULL,
  clock_out_time TEXT,
  duration_seconds INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts (user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_open ON shifts (user_id, clock_out_time);
CREATE INDEX IF NOT EXISTS idx_shifts_user_clock_in ON shifts (user_id, clock_in_time);
