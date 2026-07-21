DELETE FROM queue_snapshots;
DELETE FROM telemetry_events;
DELETE FROM deployments;
DELETE FROM services;

INSERT INTO services (id, name, type) VALUES
  ('svc-api', 'notification-api', 'api'),
  ('svc-queue', 'notification-queue', 'queue'),
  ('svc-consumer', 'notification-consumer', 'consumer'),
  ('svc-email', 'email-provider', 'external');

INSERT INTO deployments (
  id,
  service_id,
  version,
  commit_sha,
  deployed_at,
  summary
) VALUES (
  'deploy-42',
  'svc-api',
  '1.8.0',
  'a7f39c2',
  '2026-07-21T03:00:00Z',
  'Normalize outbound payload fields to snake_case'
);

INSERT INTO telemetry_events (
  id,
  timestamp,
  service_id,
  event_type,
  severity,
  correlation_id,
  deployment_id,
  attributes_json
) VALUES
  (
    'event-001',
    '2026-07-21T02:55:00Z',
    'svc-consumer',
    'message_processed',
    'info',
    'msg-1001',
    NULL,
    '{"durationMs":82,"attempt":1}'
  ),
  (
    'event-002',
    '2026-07-21T03:00:00Z',
    'svc-api',
    'deployment_completed',
    'info',
    NULL,
    'deploy-42',
    '{"version":"1.8.0","commitSha":"a7f39c2"}'
  ),
  (
    'event-003',
    '2026-07-21T03:02:00Z',
    'svc-api',
    'notification_enqueued',
    'info',
    'msg-1002',
    'deploy-42',
    '{"payload":{"user_id":"user-17","templateId":"welcome"}}'
  ),
  (
    'event-004',
    '2026-07-21T03:02:01Z',
    'svc-consumer',
    'message_processing_failed',
    'error',
    'msg-1002',
    'deploy-42',
    '{"errorCode":"MISSING_REQUIRED_FIELD","field":"userId","attempt":1}'
  ),
  (
    'event-005',
    '2026-07-21T03:03:10Z',
    'svc-consumer',
    'message_processing_failed',
    'error',
    'msg-1002',
    'deploy-42',
    '{"errorCode":"MISSING_REQUIRED_FIELD","field":"userId","attempt":2}'
  ),
  (
    'event-006',
    '2026-07-21T03:04:20Z',
    'svc-consumer',
    'message_processing_failed',
    'error',
    'msg-1002',
    'deploy-42',
    '{"errorCode":"MISSING_REQUIRED_FIELD","field":"userId","attempt":3}'
  ),
  (
    'event-007',
    '2026-07-21T03:05:00Z',
    'svc-api',
    'notification_enqueued',
    'info',
    'msg-1003',
    'deploy-42',
    '{"payload":{"user_id":"user-29","templateId":"password-reset"}}'
  ),
  (
    'event-008',
    '2026-07-21T03:05:01Z',
    'svc-consumer',
    'message_processing_failed',
    'error',
    'msg-1003',
    'deploy-42',
    '{"errorCode":"MISSING_REQUIRED_FIELD","field":"userId","attempt":1}'
  );

INSERT INTO queue_snapshots (
  timestamp,
  queue_name,
  depth,
  oldest_message_age_seconds,
  retry_count,
  failure_rate
) VALUES
  ('2026-07-21T02:55:00Z', 'notifications', 8, 14, 1, 0.01),
  ('2026-07-21T03:01:00Z', 'notifications', 11, 19, 2, 0.02),
  ('2026-07-21T03:03:00Z', 'notifications', 48, 121, 17, 0.24),
  ('2026-07-21T03:05:00Z', 'notifications', 103, 267, 46, 0.35),
  ('2026-07-21T03:08:00Z', 'notifications', 184, 612, 91, 0.38);