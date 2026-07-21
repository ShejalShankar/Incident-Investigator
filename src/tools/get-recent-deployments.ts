import {
  TelemetryRepository,
  type Deployment,
  type GetRecentDeploymentsInput,
} from "../telemetry/repository";

export type GetRecentDeploymentsToolInput =
  GetRecentDeploymentsInput;

export async function getRecentDeployments(
  db: D1Database,
  input: GetRecentDeploymentsToolInput,
): Promise<Deployment[]> {
  if (
    input.serviceName !== undefined &&
    input.serviceName.trim().length === 0
  ) {
    throw new Error("serviceName cannot be empty");
  }

  if (
    input.limit !== undefined &&
    (!Number.isInteger(input.limit) || input.limit < 1)
  ) {
    throw new Error("limit must be a positive integer");
  }

  if (
    input.startTime &&
    input.endTime &&
    input.startTime > input.endTime
  ) {
    throw new Error(
      "startTime must be earlier than or equal to endTime",
    );
  }

  const repository = new TelemetryRepository(db);

  return repository.getRecentDeployments({
    ...input,
    serviceName: input.serviceName?.trim(),
  });
}