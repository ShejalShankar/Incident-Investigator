import {
  TelemetryRepository,
  type QueryEventsInput,
  type TelemetryEvent,
} from "../telemetry/repository";

export type QueryEventsToolInput = QueryEventsInput;

export async function queryEvents(
  db: D1Database,
  input: QueryEventsToolInput,
): Promise<TelemetryEvent[]> {
  if (
    input.serviceName !== undefined &&
    input.serviceName.trim().length === 0
  ) {
    throw new Error("serviceName cannot be empty");
  }

  if (
    input.eventTypes !== undefined &&
    input.eventTypes.some((eventType) => eventType.trim().length === 0)
  ) {
    throw new Error("eventTypes cannot contain empty values");
  }

  const repository = new TelemetryRepository(db);

  return repository.queryEvents({
    ...input,
    serviceName: input.serviceName?.trim(),
    eventTypes: input.eventTypes?.map((eventType) => eventType.trim()),
  });
}