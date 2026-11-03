CREATE TABLE IF NOT EXISTS b_disk_flipchart_thread_state (
  thread_id UUID NOT NULL, user_id INTEGER NOT NULL,
  important BOOLEAN NOT NULL DEFAULT FALSE, pinned BOOLEAN NOT NULL DEFAULT FALSE,
  pinned_at TIMESTAMP NULL, created_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL,
  PRIMARY KEY (thread_id, user_id)
);
CREATE INDEX IF NOT EXISTS ix_disk_flipchart_thread_state_user_thread
  ON b_disk_flipchart_thread_state (user_id, thread_id);
CREATE INDEX IF NOT EXISTS ix_disk_flipchart_thread_state_thread
  ON b_disk_flipchart_thread_state (thread_id);
