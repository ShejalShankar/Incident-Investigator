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
}