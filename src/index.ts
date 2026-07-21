import { inspectQueue } from "./tools/inspect-queue";

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        service: "incident-investigator",
      });
    }

    if (url.pathname === "/api/db-health") {
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
          error instanceof Error ? error.message : "Unknown error";

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

    return Response.json({
      name: "Incident Investigator",
      endpoints: [
        "/health",
        "/api/db-health",
        "/api/tools/inspect-queue?queueName=notifications",
      ],
    });
  },
} satisfies ExportedHandler<Env>;