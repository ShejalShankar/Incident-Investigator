# Incident Investigator
An AI-powered incident investigation agent built on Cloudflare Workers.
The project simulates a production incident, investigates it using tool calling, and generates an evidence-backed incident report.

Live Demo:
https://incident-investigator.shej2802.workers.dev

## What it does
Instead of answering questions from static context, the agent investigates an incident the way an engineer would.
Given a production problem such as:

- Why are notifications delayed?
- What caused the queue backlog?
- Why is the consumer failing?
- Was a deployment involved?

the agent gathers evidence by calling backend tools, correlates telemetry, and produces a root cause report.

The investigation is based only on retrieved data. The agent is instructed not to invent telemetry or assume causation without evidence.


## Demo scenario

The included simulator generates a realistic production incident.
Scenario:
notification-api deploys version 1.8.0 which changes payload fields from

userId

to

user_id

The downstream notification-consumer still expects the original schema.

Messages fail validation.

Retries increase.

Queue depth grows.

The agent investigates the telemetry and identifies the deployment responsible for the schema mismatch.

## Architecture

```

                    Browser
                       │
                       ▼
             Cloudflare Worker
                       │
             Incident Agent
                       │
              Tool Executor
                       │
     ┌──────────┬──────────┬──────────┐
     ▼          ▼          ▼
 inspect_queue query_events deployments
                       │
                       ▼
                 Cloudflare D1
