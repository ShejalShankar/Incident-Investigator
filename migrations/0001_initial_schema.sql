CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (
    type IN ('api', 'queue', 'consumer', 'external')
  )
);

CREATE TABLE deployments (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  version TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  deployed_at TEXT NOT NULL,
  summary TEXT NOT NULL,
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE telemetry_events (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  service_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (
    severity IN ('info', 'warning', 'error')
  ),
  correlation_id TEXT,
  deployment_id TEXT,
  attributes_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (deployment_id) REFERENCES deployments(id)
);

CREATE TABLE queue_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  queue_name TEXT NOT NULL,
  depth INTEGER NOT NULL CHECK (depth >= 0),
  oldest_message_age_seconds INTEGER NOT NULL CHECK (
    oldest_message_age_seconds >= 0
  ),
  retry_count INTEGER NOT NULL CHECK (retry_count >= 0),
  failure_rate REAL NOT NULL CHECK (
    failure_rate >= 0 AND failure_rate <= 1
  )
);

CREATE TABLE investigations (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('running', 'completed', 'failed')
  ),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  report_json TEXT
);

CREATE INDEX idx_events_service_timestamp
ON telemetry_events(service_id, timestamp);

CREATE INDEX idx_events_type_timestamp
ON telemetry_events(event_type, timestamp);

CREATE INDEX idx_queue_name_timestamp
ON queue_snapshots(queue_name, timestamp);

CREATE INDEX idx_deployments_service_time
ON deployments(service_id, deployed_at);