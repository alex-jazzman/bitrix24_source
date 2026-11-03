CREATE TABLE IF NOT EXISTS b_disk_flipchart_thread_state (
  thread_id CHAR(36) NOT NULL, user_id INT NOT NULL,
  important TINYINT(1) NOT NULL DEFAULT 0, pinned TINYINT(1) NOT NULL DEFAULT 0,
  pinned_at DATETIME NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  PRIMARY KEY (thread_id, user_id),
  KEY ix_disk_flipchart_thread_state_user_thread (user_id, thread_id),
  KEY ix_disk_flipchart_thread_state_thread (thread_id)
);
