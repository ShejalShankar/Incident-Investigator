export interface QueueSnapshotRow {
  timestamp: string;
  queue_name: string;
  depth: number;
  oldest_message_age_seconds: number;
  retry_count: number;
  failure_rate: number;
}

export interface QueueInspection {
  queueName: string;
  current: {
    depth: number;
    oldestMessageAgeSeconds: number;
    retryCount: number;
    failureRate: number;
  };
  baseline: {
    depth: number;
    oldestMessageAgeSeconds: number;
    retryCount: number;
    failureRate: number;
  };
  changes: {
    depthIncrease: number;
    retryIncrease: number;
    failureRateIncrease: number;
  };
  trend: "stable" | "increasing" | "rapidly_increasing";
  snapshots: Array<{
    timestamp: string;
    depth: number;
    oldestMessageAgeSeconds: number;
    retryCount: number;
    failureRate: number;
  }>;
}

export interface TelemetryEventRow {
  id: string;
  timestamp: string;
  service_id: string;
  service_name: string;
  event_type: string;
  severity: "info" | "warning" | "error";
  correlation_id: string | null;
  deployment_id: string | null;
  attributes_json: string;
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  serviceId: string;
  serviceName: string;
  eventType: string;
  severity: "info" | "warning" | "error";
  correlationId?: string;
  deploymentId?: string;
  attributes: Record<string, unknown>;
}

export interface QueryEventsInput {
  serviceName?: string;
  eventTypes?: string[];
  severity?: "info" | "warning" | "error";
  startTime?: string;
  endTime?: string;
  limit?: number;
}

export interface DeploymentRow {
  id: string;
  service_id: string;
  service_name: string;
  version: string;
  commit_sha: string;
  deployed_at: string;
  summary: string;
}

export interface Deployment {
  id: string;
  serviceId: string;
  serviceName: string;
  version: string;
  commitSha: string;
  deployedAt: string;
  summary: string;
}

export interface GetRecentDeploymentsInput {
  serviceName?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
}

function parseAttributes(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }

    return {};
  } catch {
    return {};
  }
}

export class TelemetryRepository {
  constructor(private readonly db: D1Database) {}

  async inspectQueue(queueName: string): Promise<QueueInspection> {
    const result = await this.db
      .prepare(
        `
        SELECT
          timestamp,
          queue_name,
          depth,
          oldest_message_age_seconds,
          retry_count,
          failure_rate
        FROM queue_snapshots
        WHERE queue_name = ?
        ORDER BY timestamp ASC
        LIMIT 100
        `,
      )
      .bind(queueName)
      .all<QueueSnapshotRow>();

    const rows = result.results;

    if (rows.length === 0) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const first = rows[0];
    const latest = rows[rows.length - 1];

    const depthIncrease = latest.depth - first.depth;
    const retryIncrease = latest.retry_count - first.retry_count;
    const failureRateIncrease =
      latest.failure_rate - first.failure_rate;

    let trend: QueueInspection["trend"] = "stable";

    if (latest.depth >= first.depth * 5) {
      trend = "rapidly_increasing";
    } else if (latest.depth > first.depth) {
      trend = "increasing";
    }

    return {
      queueName,
      current: {
        depth: latest.depth,
        oldestMessageAgeSeconds:
          latest.oldest_message_age_seconds,
        retryCount: latest.retry_count,
        failureRate: latest.failure_rate,
      },
      baseline: {
        depth: first.depth,
        oldestMessageAgeSeconds:
          first.oldest_message_age_seconds,
        retryCount: first.retry_count,
        failureRate: first.failure_rate,
      },
      changes: {
        depthIncrease,
        retryIncrease,
        failureRateIncrease,
      },
      trend,
      snapshots: rows.map((row) => ({
        timestamp: row.timestamp,
        depth: row.depth,
        oldestMessageAgeSeconds:
          row.oldest_message_age_seconds,
        retryCount: row.retry_count,
        failureRate: row.failure_rate,
      })),
    };
  }

  async queryEvents(
    input: QueryEventsInput,
  ): Promise<TelemetryEvent[]> {
    const conditions: string[] = [];
    const bindings: unknown[] = [];

    if (input.serviceName) {
      conditions.push("s.name = ?");
      bindings.push(input.serviceName);
    }

    if (input.severity) {
      conditions.push("e.severity = ?");
      bindings.push(input.severity);
    }

    if (input.startTime) {
      conditions.push("e.timestamp >= ?");
      bindings.push(input.startTime);
    }

    if (input.endTime) {
      conditions.push("e.timestamp <= ?");
      bindings.push(input.endTime);
    }

    if (input.eventTypes && input.eventTypes.length > 0) {
      const placeholders = input.eventTypes
        .map(() => "?")
        .join(", ");

      conditions.push(`e.event_type IN (${placeholders})`);
      bindings.push(...input.eventTypes);
    }

    const limit = Math.min(
      Math.max(input.limit ?? 20, 1),
      100,
    );

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const query = `
      SELECT
        e.id,
        e.timestamp,
        e.service_id,
        s.name AS service_name,
        e.event_type,
        e.severity,
        e.correlation_id,
        e.deployment_id,
        e.attributes_json
      FROM telemetry_events e
      JOIN services s
        ON s.id = e.service_id
      ${whereClause}
      ORDER BY e.timestamp DESC
      LIMIT ?
    `;

    bindings.push(limit);

    const result = await this.db
      .prepare(query)
      .bind(...bindings)
      .all<TelemetryEventRow>();

    return result.results.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      serviceId: row.service_id,
      serviceName: row.service_name,
      eventType: row.event_type,
      severity: row.severity,
      correlationId: row.correlation_id ?? undefined,
      deploymentId: row.deployment_id ?? undefined,
      attributes: parseAttributes(row.attributes_json),
    }));
  }

  async getRecentDeployments(
  input: GetRecentDeploymentsInput,
): Promise<Deployment[]> {
  const conditions: string[] = [];
  const bindings: unknown[] = [];

  if (input.serviceName) {
    conditions.push("s.name = ?");
    bindings.push(input.serviceName);
  }

  if (input.startTime) {
    conditions.push("d.deployed_at >= ?");
    bindings.push(input.startTime);
  }

  if (input.endTime) {
    conditions.push("d.deployed_at <= ?");
    bindings.push(input.endTime);
  }

  const limit = Math.min(
    Math.max(input.limit ?? 10, 1),
    50,
  );

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const query = `
    SELECT
      d.id,
      d.service_id,
      s.name AS service_name,
      d.version,
      d.commit_sha,
      d.deployed_at,
      d.summary
    FROM deployments d
    JOIN services s
      ON s.id = d.service_id
    ${whereClause}
    ORDER BY d.deployed_at DESC
    LIMIT ?
  `;

  bindings.push(limit);

  const result = await this.db
    .prepare(query)
    .bind(...bindings)
    .all<DeploymentRow>();

  return result.results.map((row) => ({
    id: row.id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    version: row.version,
    commitSha: row.commit_sha,
    deployedAt: row.deployed_at,
    summary: row.summary,
  }));
}
}