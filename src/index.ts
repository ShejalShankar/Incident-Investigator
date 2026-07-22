import { investigateIncident } from "./agent/incident-agent";
import { simulatePayloadSchemaMismatch } from "./demo/incident-simulator";
import { getRecentDeployments } from "./tools/get-recent-deployments";
import { inspectQueue } from "./tools/inspect-queue";
import { queryEvents } from "./tools/query-events";
import { renderDashboard } from "./ui/dashboard";

export interface Env {
  DB: D1Database;
  AI: Ai;
}

interface InvestigationRequestBody {
  question: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (
      request.method === "GET" &&
      url.pathname === "/"
) {

  return renderDashboard();

}

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
      request.method === "POST" &&
      url.pathname ===
        "/api/demo/scenarios/payload-schema-mismatch"
    ) {
      try {
        const result =
          await simulatePayloadSchemaMismatch(env.DB);

        return Response.json({
          status: "success",
          message:
            "Payload schema mismatch incident generated.",
          result,
        });
      } catch (error) {
        console.error(
          "Incident simulation failed",
          error,
        );

        return Response.json(
          {
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : "Unknown simulation error",
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
        return toolErrorResponse("inspect_queue", error);
      }
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/tools/query-events"
    ) {
      try {
        const serviceName =
          url.searchParams.get("serviceName") ?? undefined;

        const severity = parseSeverity(
          url.searchParams.get("severity"),
        );

        const eventTypes = parseCommaSeparatedValues(
          url.searchParams.get("eventTypes"),
        );

        const startTime =
          url.searchParams.get("startTime") ?? undefined;

        const endTime =
          url.searchParams.get("endTime") ?? undefined;

        const limit = parsePositiveInteger(
          url.searchParams.get("limit"),
          "limit",
        );

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
        return toolErrorResponse("query_events", error);
      }
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/tools/get-recent-deployments"
    ) {
      try {
        const serviceName =
          url.searchParams.get("serviceName") ?? undefined;

        const startTime =
          url.searchParams.get("startTime") ?? undefined;

        const endTime =
          url.searchParams.get("endTime") ?? undefined;

        const limit = parsePositiveInteger(
          url.searchParams.get("limit"),
          "limit",
        );

        const result = await getRecentDeployments(env.DB, {
          serviceName,
          startTime,
          endTime,
          limit,
        });

        return Response.json({
          tool: "get_recent_deployments",
          status: "success",
          count: result.length,
          result,
        });
      } catch (error) {
        return toolErrorResponse(
          "get_recent_deployments",
          error,
        );
      }
    }

    if (
      request.method === "POST" &&
      url.pathname === "/investigate"
    ) {
      try {
        const body = await readInvestigationBody(request);

        const result = await investigateIncident(
          env.AI,
          env.DB,
          body.question,
        );

        return Response.json(result);
      } catch (error) {
        console.error("Investigation failed", error);

        return Response.json(
          {
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : "Unknown investigation error",
          },
          { status: 400 },
        );
      }
    }

    if (request.method !== "GET") {
      return Response.json(
        {
          status: "error",
          error: "Method not allowed",
        },
        {
          status: 405,
          headers: {
            Allow: "GET, POST",
          },
        },
      );
    }

    return Response.json({
      name: "Incident Investigator",
      description:
        "An AI agent that investigates operational incidents using queue telemetry, service events, and deployment history.",
      endpoints: {
        health: {
          method: "GET",
          path: "/health",
        },
        databaseHealth: {
          method: "GET",
          path: "/api/db-health",
        },
        simulateIncident: {
          method: "POST",
          path:
            "/api/demo/scenarios/payload-schema-mismatch",
          description:
            "Generates fresh telemetry for a deployment-induced payload schema mismatch.",
        },
        investigate: {
          method: "POST",
          path: "/investigate",
          exampleBody: {
            question:
              "Investigate why notifications are delayed.",
          },
        },
        debugTools: [
          {
            method: "GET",
            path:
              "/api/tools/inspect-queue?queueName=notifications",
          },
          {
            method: "GET",
            path: "/api/tools/query-events?severity=error",
          },
          {
            method: "GET",
            path:
              "/api/tools/query-events?eventTypes=deployment_completed",
          },
          {
            method: "GET",
            path:
              "/api/tools/query-events?serviceName=notification-consumer&severity=error",
          },
          {
            method: "GET",
            path: "/api/tools/get-recent-deployments",
          },
          {
            method: "GET",
            path:
              "/api/tools/get-recent-deployments?serviceName=notification-api",
          },
        ],
      },
      suggestedDemoFlow: [
        {
          step: 1,
          action: "Generate an incident",
          request: {
            method: "POST",
            path:
              "/api/demo/scenarios/payload-schema-mismatch",
          },
        },
        {
          step: 2,
          action: "Ask the agent to investigate",
          request: {
            method: "POST",
            path: "/investigate",
            body: {
              question:
                "Investigate why notifications are delayed.",
            },
          },
        },
      ],
    });
  },
} satisfies ExportedHandler<Env>;

async function readInvestigationBody(
  request: Request,
): Promise<InvestigationRequestBody> {
  const contentType = request.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw new Error(
      "Content-Type must be application/json",
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new Error("Request body must contain valid JSON");
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    throw new Error("Request body must be a JSON object");
  }

  const question = (
    body as Record<string, unknown>
  ).question;

  if (
    typeof question !== "string" ||
    question.trim().length === 0
  ) {
    throw new Error(
      "question must be a non-empty string",
    );
  }

  if (question.length > 1000) {
    throw new Error(
      "question must be 1000 characters or fewer",
    );
  }

  return {
    question: question.trim(),
  };
}

function parseSeverity(
  value: string | null,
): "info" | "warning" | "error" | undefined {
  if (value === null) {
    return undefined;
  }

  if (
    value !== "info" &&
    value !== "warning" &&
    value !== "error"
  ) {
    throw new Error(
      "severity must be info, warning, or error",
    );
  }

  return value;
}

function parseCommaSeparatedValues(
  value: string | null,
): string[] | undefined {
  if (value === null) {
    return undefined;
  }

  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return values.length > 0 ? values : undefined;
}

function parsePositiveInteger(
  value: string | null,
  fieldName: string,
): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1
  ) {
    throw new Error(
      `${fieldName} must be a positive integer`,
    );
  }

  return parsedValue;
}

function toolErrorResponse(
  toolName: string,
  error: unknown,
): Response {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown error";

  return Response.json(
    {
      tool: toolName,
      status: "error",
      error: message,
    },
    { status: 400 },
  );
}