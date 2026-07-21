import { inspectQueue } from "./tools/inspect-queue";
import { queryEvents } from "./tools/query-events";

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (
      request.method === "GET" &&
      url.pathname === "/health"
    ) {
      return Response.json({
        status: "ok",
        service: "incident-investigator",
      });
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/db-health"
    ) {
      try {
        const result = await env.DB.prepare(`
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
          ORDER BY name
        `).all<{ name: string }>();

        return Response.json({
          status: "ok",
          databaseConnected: true,
          tables: result.results.map((row) => row.name),
        });
      } catch (error) {
        console.error("D1 health check failed", error);

        return Response.json(
          {
            status: "error",
            databaseConnected: false,
            message:
              error instanceof Error
                ? error.message
                : "Unknown database error",
          },
          { status: 500 },
        );
      }
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/tools/inspect-queue"
    ) {
      try {
        const queueName =
          url.searchParams.get("queueName") ?? "notifications";

        const result = await inspectQueue(env.DB, {
          queueName,
        });

        return Response.json({
          tool: "inspect_queue",
          status: "success",
          result,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown error";

        return Response.json(
          {
            tool: "inspect_queue",
            status: "error",
            error: message,
          },
          { status: 400 },
        );
      }
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/tools/query-events"
    ) {
      try {
        const serviceName =
          url.searchParams.get("serviceName") ?? undefined;

        const severityValue =
          url.searchParams.get("severity");

        let severity:
          | "info"
          | "warning"
          | "error"
          | undefined;

        if (severityValue !== null) {
          if (
            severityValue !== "info" &&
            severityValue !== "warning" &&
            severityValue !== "error"
          ) {
            throw new Error(
              "severity must be info, warning, or error",
            );
          }

          severity = severityValue;
        }

        const eventTypesValue =
          url.searchParams.get("eventTypes");

        const eventTypes = eventTypesValue
          ? eventTypesValue
              .split(",")
              .map((eventType) => eventType.trim())
              .filter((eventType) => eventType.length > 0)
          : undefined;

        const startTime =
          url.searchParams.get("startTime") ?? undefined;

        const endTime =
          url.searchParams.get("endTime") ?? undefined;

        const limitValue =
          url.searchParams.get("limit");

        let limit: number | undefined;

        if (limitValue !== null) {
          limit = Number(limitValue);

          if (
            !Number.isInteger(limit) ||
            limit < 1
          ) {
            throw new Error(
              "limit must be a positive integer",
            );
          }
        }

        const result = await queryEvents(env.DB, {
          serviceName,
          severity,
          eventTypes,
          startTime,
          endTime,
          limit,
        });

        return Response.json({
          tool: "query_events",
          status: "success",
          count: result.length,
          result,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown error";

        return Response.json(
          {
            tool: "query_events",
            status: "error",
            error: message,
          },
          { status: 400 },
        );
      }
    }

    return Response.json({
      name: "Incident Investigator",
      endpoints: [
        "/health",
        "/api/db-health",
        "/api/tools/inspect-queue?queueName=notifications",
        "/api/tools/query-events?severity=error",
        "/api/tools/query-events?eventTypes=deployment_completed",
        "/api/tools/query-events?serviceName=notification-consumer&severity=error",
      ],
    });
  },
} satisfies ExportedHandler<Env>;