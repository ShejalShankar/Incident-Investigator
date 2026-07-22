export interface SimulatedIncident {
    scenario: "payload_schema_mismatch";
    startedAt: string;
    deploymentId: string;
    eventCount: number;
    queueSnapshotCount: number;
}

const API_SERVICE_ID = "svc-api";
const CONSUMER_SERVICE_ID = "svc-consumer";
const QUEUE_NAME = "notifications";

export async function simulatePayloadSchemaMismatch(
    db: D1Database,
): Promise<SimulatedIncident> {
    const now = new Date();
    const startedAt = now.toISOString();
    const deploymentId = `deploy-${crypto.randomUUID()}`;

    const healthyTime = offsetIso(now, -10 * 60);
    const deploymentTime = offsetIso(now, -8 * 60);
    const firstFailureTime = offsetIso(now, -7 * 60);
    const degradedTime = offsetIso(now, -4 * 60);
    const severeTime = offsetIso(now, -1 * 60);

    /*
     * Clean up the existing demo incident first.
     *
     * Delete telemetry before deployments because telemetry_events.deployment_id
     * references deployments.id.
     *
     * The deployment-based condition also removes any event belonging to another
     * service that still references one of the demo deployments.
     */
    await db.batch([
        db.prepare(`
      DELETE FROM telemetry_events
      WHERE service_id IN (?, ?)
         OR deployment_id IN (
           SELECT id
           FROM deployments
           WHERE service_id IN (?, ?)
         )
    `).bind(
            API_SERVICE_ID,
            CONSUMER_SERVICE_ID,
            API_SERVICE_ID,
            CONSUMER_SERVICE_ID,
        ),

        db.prepare(`
      DELETE FROM queue_snapshots
      WHERE queue_name = ?
    `).bind(QUEUE_NAME),

        db.prepare(`
      DELETE FROM deployments
      WHERE service_id IN (?, ?)
    `).bind(
            API_SERVICE_ID,
            CONSUMER_SERVICE_ID,
        ),
    ]);

    const statements: D1PreparedStatement[] = [
        db.prepare(`
      INSERT INTO queue_snapshots (
        timestamp,
        queue_name,
        depth,
        oldest_message_age_seconds,
        retry_count,
        failure_rate
      )
      VALUES (?, ?, 8, 14, 1, 0.01)
    `).bind(
            healthyTime,
            QUEUE_NAME,
        ),

        db.prepare(`
      INSERT INTO deployments (
        id,
        service_id,
        version,
        commit_sha,
        deployed_at,
        summary
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
            deploymentId,
            API_SERVICE_ID,
            "1.8.0",
            "a7f39c2",
            deploymentTime,
            "Normalize outbound payload fields to snake_case",
        ),

        db.prepare(`
      INSERT INTO telemetry_events (
        id,
        timestamp,
        service_id,
        event_type,
        severity,
        correlation_id,
        deployment_id,
        attributes_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
            `event-${crypto.randomUUID()}`,
            deploymentTime,
            API_SERVICE_ID,
            "deployment_completed",
            "info",
            `deploy-correlation-${crypto.randomUUID()}`,
            deploymentId,
            JSON.stringify({
                version: "1.8.0",
                commitSha: "a7f39c2",
                summary:
                    "Normalize outbound payload fields to snake_case",
            }),
        ),

        db.prepare(`
      INSERT INTO queue_snapshots (
        timestamp,
        queue_name,
        depth,
        oldest_message_age_seconds,
        retry_count,
        failure_rate
      )
      VALUES (?, ?, 48, 122, 18, 0.24)
    `).bind(
            firstFailureTime,
            QUEUE_NAME,
        ),

        ...buildFailureEvents(
            db,
            deploymentId,
            firstFailureTime,
            4,
        ),

        db.prepare(`
      INSERT INTO queue_snapshots (
        timestamp,
        queue_name,
        depth,
        oldest_message_age_seconds,
        retry_count,
        failure_rate
      )
      VALUES (?, ?, 112, 386, 57, 0.31)
    `).bind(
            degradedTime,
            QUEUE_NAME,
        ),

        db.prepare(`
      INSERT INTO queue_snapshots (
        timestamp,
        queue_name,
        depth,
        oldest_message_age_seconds,
        retry_count,
        failure_rate
      )
      VALUES (?, ?, 184, 612, 91, 0.38)
    `).bind(
            severeTime,
            QUEUE_NAME,
        ),
    ];

    await db.batch(statements);

    return {
        scenario: "payload_schema_mismatch",
        startedAt,
        deploymentId,
        eventCount: 5,
        queueSnapshotCount: 4,
    };
}

function buildFailureEvents(
    db: D1Database,
    deploymentId: string,
    startTime: string,
    count: number,
): D1PreparedStatement[] {
    const start = new Date(startTime);
    const statements: D1PreparedStatement[] = [];

    for (let index = 0; index < count; index++) {
        const timestamp = offsetIso(
            start,
            index * 45,
        );

        const messageId =
            `message-${String(index + 1).padStart(3, "0")}`;

        statements.push(
            db.prepare(`
        INSERT INTO telemetry_events (
          id,
          timestamp,
          service_id,
          event_type,
          severity,
          correlation_id,
          deployment_id,
          attributes_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(

                `event-${crypto.randomUUID()}`,

                timestamp,

                CONSUMER_SERVICE_ID,

                "message_processing_failed",

                "error",

                `correlation-${messageId}`,

                null,

                JSON.stringify({

                    messageId,

                    errorCode: "MISSING_REQUIRED_FIELD",

                    field: "userId",

                    receivedField: "user_id",

                    attempt: index + 1,

                    queueName: QUEUE_NAME,

                    producerService: "notification-api",

                    producerDeploymentId: deploymentId,

                }),

            ),
        );
    }

    return statements;
}

function offsetIso(
    date: Date,
    offsetSeconds: number,
): string {
    return new Date(
        date.getTime() + offsetSeconds * 1000,
    ).toISOString();
}