import {
  TelemetryRepository,
  type QueueInspection,
} from "../telemetry/repository";

export interface InspectQueueInput {
  queueName: string;
}

export async function inspectQueue(
  db: D1Database,
  input: InspectQueueInput,
): Promise<QueueInspection> {
  const queueName = input.queueName.trim();

  if (!queueName) {
    throw new Error("queueName is required");
  }

  const repository = new TelemetryRepository(db);

  return repository.inspectQueue(queueName);
}