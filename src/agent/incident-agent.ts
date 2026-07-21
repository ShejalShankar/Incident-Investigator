import { executeAgentTool } from "./tool-executor";
import { incidentToolDefinitions } from "./tool-definitions";

const INCIDENT_MODEL = "@cf/openai/gpt-oss-120b";
const MAX_AGENT_STEPS = 6;

interface AgentMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ModelToolCall {
  id?: string;
  type?: "function";
  function: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
}

interface ChatCompletionMessage {
  role?: "assistant";
  content?: string | null;
  tool_calls?: ModelToolCall[];
}

interface ModelResponse {
  choices?: Array<{
    message?: ChatCompletionMessage;
    finish_reason?: string | null;
  }>;

  // Fallback fields for non-chat-completions response shapes.
  response?: string;
  tool_calls?: ModelToolCall[];
}

interface ExecutedToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface InvestigationStep {
  step: number;
  tool: string;
  arguments: unknown;
  result: unknown;
}

export interface InvestigationResult {
  question: string;
  status: "completed" | "max_steps_reached";
  answer: string;
  steps: InvestigationStep[];
  model: string;
}

export async function investigateIncident(
  ai: Ai,
  db: D1Database,
  question: string,
): Promise<InvestigationResult> {
  const normalizedQuestion = question.trim();

  if (!normalizedQuestion) {
    throw new Error("question is required");
  }

  const messages: AgentMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt(),
    },
    {
      role: "user",
      content: normalizedQuestion,
    },
  ];

  const steps: InvestigationStep[] = [];

  for (
    let stepNumber = 1;
    stepNumber <= MAX_AGENT_STEPS;
    stepNumber++
  ) {
    const rawResponse = await ai.run(INCIDENT_MODEL, {
      messages,
      tools: incidentToolDefinitions,
      max_tokens: 1200,
      temperature: 0.2,
    });

    console.log(
      "Workers AI raw response:",
      JSON.stringify(rawResponse, null, 2),
    );

    const modelResponse = rawResponse as ModelResponse;
    const assistantMessage =
      modelResponse.choices?.[0]?.message;

    const toolCalls =
      assistantMessage?.tool_calls ??
      modelResponse.tool_calls ??
      [];

    const answerText =
      assistantMessage?.content ??
      modelResponse.response ??
      "";

    if (toolCalls.length === 0) {
      const answer = answerText.trim();

      if (!answer) {
        console.error(
          "Unexpected Workers AI response:",
          JSON.stringify(rawResponse, null, 2),
        );

        throw new Error(
          "The model returned neither a tool call nor a final answer",
        );
      }

      return {
        question: normalizedQuestion,
        status: "completed",
        answer,
        steps,
        model: INCIDENT_MODEL,
      };
    }

    if (answerText.trim()) {
      messages.push({
        role: "assistant",
        content: answerText.trim(),
      });
    }

    for (const toolCall of toolCalls) {
      const parsedArguments = parseToolArguments(
        toolCall.function.arguments,
      );

      const executedToolCall: ExecutedToolCall = {
        name: toolCall.function.name,
        arguments: parsedArguments,
      };

      const result = await executeAgentTool(db, {
        name: executedToolCall.name,
        arguments: executedToolCall.arguments,
      });

      steps.push({
        step: steps.length + 1,
        tool: executedToolCall.name,
        arguments: executedToolCall.arguments,
        result,
      });

      messages.push({
        role: "user",
        content: buildToolObservation(
          executedToolCall,
          result,
        ),
      });
    }
  }

  messages.push({
    role: "user",
    content:
      "You have reached the investigation step limit. Produce the best final incident report you can using only the evidence gathered so far. Clearly distinguish confirmed facts from hypotheses.",
  });

  const rawFinalResponse = await ai.run(INCIDENT_MODEL, {
    messages,
    max_tokens: 1400,
    temperature: 0.2,
  });

  const finalResponse =
    rawFinalResponse as ModelResponse;

  const answer =
    finalResponse.choices?.[0]?.message?.content?.trim() ||
    finalResponse.response?.trim() ||
    "The investigation reached its step limit without producing a final report.";

  return {
    question: normalizedQuestion,
    status: "max_steps_reached",
    answer,
    steps,
    model: INCIDENT_MODEL,
  };
}

function buildSystemPrompt(): string {
  return `
You are an incident investigator for a distributed production system.

Your task is to investigate operational problems using the available tools and produce an evidence-backed incident report.

Investigation rules:

1. Do not invent telemetry, services, deployments, timestamps, or causes.
2. Use tools whenever evidence is needed.
3. Choose each next tool based on evidence from previous tool results.
4. Do not repeatedly call the same tool with identical arguments.
5. Treat correlation as evidence, not automatic proof of causation.
6. Clearly distinguish confirmed facts from hypotheses.
7. Prefer a small number of targeted tool calls over broad, repetitive queries.
8. Stop investigating once there is enough evidence to provide a useful conclusion.
9. Never claim that a deployment caused an incident solely because it happened earlier.
10. When finished, provide:
   - Summary
   - Impact
   - Timeline
   - Likely root cause
   - Confidence and uncertainty
   - Supporting evidence
   - Recommended immediate actions
   - Recommended preventive actions

The queue used for notification processing is named "notifications".
Relevant services may include "notification-api" and "notification-consumer".
`.trim();
}

function buildToolObservation(
  toolCall: ExecutedToolCall,
  result: unknown,
): string {
  return `
Tool execution result:

Tool: ${toolCall.name}

Arguments:
${JSON.stringify(toolCall.arguments, null, 2)}

Observation:
${JSON.stringify(result, null, 2)}

Use this observation as evidence. Decide whether another tool is needed or whether you can now produce the final incident report.
`.trim();
}

function parseToolArguments(
  value: string | Record<string, unknown>,
): Record<string, unknown> {
  if (typeof value !== "string") {
    return value;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error(
        "Parsed tool arguments must be an object",
      );
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      `Model returned invalid tool arguments: ${
        error instanceof Error
          ? error.message
          : "Unknown parsing error"
      }`,
    );
  }
}