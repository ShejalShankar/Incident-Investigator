import { inspectQueue } from "../tools/inspect-queue";
import { queryEvents } from "../tools/query-events";
import { getRecentDeployments } from "../tools/get-recent-deployments";

export interface AgentToolCall {
  name: string;
  arguments: unknown;
}

export async function executeAgentTool(
  db: D1Database,
  toolCall: AgentToolCall,
): Promise<unknown> {
  switch (toolCall.name) {
    case "inspect_queue": {
      const input = requireObject(toolCall.arguments);

      const queueName = requireString(
        input.queueName,
        "queueName",
      );

      return inspectQueue(db, {
        queueName,
      });
    }

    case "query_events": {
      const input = requireObject(toolCall.arguments);

      return queryEvents(db, {
        serviceName: optionalString(
          input.serviceName,
          "serviceName",
        ),
        eventTypes: optionalStringArray(
          input.eventTypes,
          "eventTypes",
        ),
        severity: optionalSeverity(input.severity),
        startTime: optionalString(
          input.startTime,
          "startTime",
        ),
        endTime: optionalString(
          input.endTime,
          "endTime",
        ),
        limit: optionalInteger(input.limit, "limit"),
      });
    }

    case "get_recent_deployments": {
      const input = requireObject(toolCall.arguments);

      return getRecentDeployments(db, {
        serviceName: optionalString(
          input.serviceName,
          "serviceName",
        ),
        startTime: optionalString(
          input.startTime,
          "startTime",
        ),
        endTime: optionalString(
          input.endTime,
          "endTime",
        ),
        limit: optionalInteger(input.limit, "limit"),
      });
    }

    default:
      throw new Error(`Unknown tool: ${toolCall.name}`);
  }
}

function requireObject(
  value: unknown,
): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error("Tool arguments must be an object");
  }

  return value as Record<string, unknown>;
}

function requireString(
  value: unknown,
  fieldName: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  return value.trim();
}

function optionalString(
  value: unknown,
  fieldName: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return requireString(value, fieldName);
}

function optionalStringArray(
  value: unknown,
  fieldName: string,
): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }

  return value.map((item, index) =>
    requireString(item, `${fieldName}[${index}]`),
  );
}

function optionalInteger(
  value: unknown,
  fieldName: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value)
  ) {
    throw new Error(`${fieldName} must be an integer`);
  }

  return value;
}

function optionalSeverity(
  value: unknown,
): "info" | "warning" | "error" | undefined {
  if (value === undefined) {
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