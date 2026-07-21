export const incidentToolDefinitions: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "inspect_queue",
      description:
        "Inspect the health and trend of a message queue. Use this when investigating delayed, stuck, or backlogged asynchronous work.",
      parameters: {
        type: "object",
        properties: {
          queueName: {
            type: "string",
            description:
              "The exact queue name to inspect, such as notifications.",
          },
        },
        required: ["queueName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_events",
      description:
        "Search operational telemetry events using bounded filters. Use this to inspect errors, warnings, service activity, or specific event types during an incident.",
      parameters: {
        type: "object",
        properties: {
          serviceName: {
            type: "string",
            description:
              "Optional exact service name, such as notification-consumer.",
          },
          eventTypes: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "Optional event types to include, such as message_processing_failed.",
          },
          severity: {
            type: "string",
            enum: ["info", "warning", "error"],
            description: "Optional event severity.",
          },
          startTime: {
            type: "string",
            description:
              "Optional inclusive ISO-8601 start timestamp.",
          },
          endTime: {
            type: "string",
            description:
              "Optional inclusive ISO-8601 end timestamp.",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description:
              "Maximum number of events to return.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_deployments",
      description:
        "Retrieve recent code deployments and their change summaries. Use this when checking whether a code change preceded an incident.",
      parameters: {
        type: "object",
        properties: {
          serviceName: {
            type: "string",
            description:
              "Optional exact service name, such as notification-api.",
          },
          startTime: {
            type: "string",
            description:
              "Optional inclusive ISO-8601 start timestamp.",
          },
          endTime: {
            type: "string",
            description:
              "Optional inclusive ISO-8601 end timestamp.",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            description:
              "Maximum number of deployments to return.",
          },
        },
      },
    },
  },
];