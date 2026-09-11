CREATE TABLE IF NOT EXISTS daily_events (
  event_date TEXT NOT NULL,
  event_name TEXT NOT NULL,
  page_version TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  offer_id TEXT NOT NULL DEFAULT '',
  copy_type TEXT NOT NULL DEFAULT '',
  event_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (event_date, event_name, page_version, source, offer_id, copy_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_events_date
  ON daily_events (event_date);
