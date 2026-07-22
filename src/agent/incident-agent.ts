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
            max_tokens: 1800,
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
        max_tokens: 1800,
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
  Your job is to investigate operational incidents using the available tools and produce an evidence-backed incident report.

Investigation rules:

1. Never invent telemetry, deployments, timestamps, services, or root causes.

2. Use tools whenever evidence is required.

3. Choose each tool call based on evidence from previous results.

4. Avoid repeating identical tool calls.

5. Correlation is evidence, not proof of causation.

6. Clearly distinguish confirmed facts from hypotheses.

7. Prefer a small number of targeted tool calls over broad exploratory queries.

8. Continue investigating until you have enough evidence to identify the most likely root cause.

9. If malformed input, schema mismatches, or contract violations are detected, investigate upstream producers and recent deployments before concluding.

10. If deployment references or producer information are available, use them to identify the associated change.

11. Keep conclusions proportional to the available evidence. Do not claim user or infrastructure impact that is not directly supported by telemetry.

12. Keep the final report concise and avoid repeating the same evidence.

13. Prefer the simplest explanation that accounts for all available evidence. If multiple hypotheses remain plausible, explain why.

When finished, produce a concise incident report using this exact structure:

## Executive Summary
Explain what happened, the affected component, and the most likely cause in 2–3 sentences.

## Key Findings
List the most important confirmed observations as short bullet points.

## Timeline
List events chronologically using:
- HH:MM:SS UTC — Event description

## Likely Root Cause
Explain the most likely root cause and how the evidence supports it.

## Confidence and Uncertainty
State confidence as High, Medium, or Low.
Clearly describe anything that remains unverified.

## Supporting Evidence
List the strongest telemetry, event, and deployment evidence.

## Immediate Actions
Provide short, prioritized recovery steps.

## Preventive Actions
Provide practical measures that would reduce recurrence.

Do not use markdown tables.
Do not repeat the same evidence across multiple sections.
Do not claim user impact or infrastructure impact unless it is directly supported by telemetry.
Keep the final report under 700 words.

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
            `Model returned invalid tool arguments: ${error instanceof Error
                ? error.message
                : "Unknown parsing error"
            }`,
        );
    }
}