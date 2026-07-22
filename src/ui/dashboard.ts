export function renderDashboard(): Response {
  return new Response(DASHBOARD_HTML, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  });
}

const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Incident Investigator</title>

  <style>
    :root {
      color-scheme: light;

      --background: #f5f7fb;
      --surface: #ffffff;
      --surface-raised: #f8faff;
      --surface-muted: #f0f4fa;

      --border: #dfe5ee;
      --border-strong: #ccd5e2;

      --text: #172033;
      --text-soft: #34425a;
      --muted: #6e7b91;

      --accent: #526fe8;
      --accent-hover: #405dce;
      --accent-soft: #edf1ff;

      --success: #16845b;
      --success-soft: #eaf8f2;

      --warning: #ad6900;
      --warning-soft: #fff6e5;

      --danger: #c5424f;
      --danger-soft: #fff0f1;

      --shadow:
        0 12px 34px rgba(31, 45, 74, 0.08);
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      color: var(--text);
      background:
        radial-gradient(
          circle at 15% 0%,
          rgba(82, 111, 232, 0.1),
          transparent 30rem
        ),
        linear-gradient(
          180deg,
          #fbfcff 0%,
          var(--background) 38%
        );
    }

    button,
    input {
      font: inherit;
    }

    button {
      appearance: none;
    }

    .shell {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding-top: 40px;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 28px;
      margin-bottom: 26px;
    }

    .header-content {
      max-width: 720px;
    }

    h1 {
      margin: 0;
      max-width: none;
      font-size: clamp(36px, 5vw, 54px);
      line-height: 1;
      letter-spacing: -0.055em;
    }

    .subtitle {
      max-width: 720px;
      margin: 18px 0 0;
      color: var(--muted);
      font-size: 17px;
      line-height: 1.65;
    }

    .technology-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 20px;
    }

    .technology-list span {
      padding: 6px 10px;
      border: 1px solid var(--border);
      border-radius: 999px;
      color: var(--muted);
      background: rgba(255, 255, 255, 0.72);
      font-size: 12px;
      font-weight: 600;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 999px;
      color: var(--muted);
      background: rgba(255, 255, 255, 0.88);
      box-shadow: 0 8px 22px rgba(31, 45, 74, 0.06);
      font-size: 14px;
      font-weight: 650;
    }

    .status-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #a6b0c0;
    }

    .status-pill.loading {
      color: var(--accent);
      border-color: #d4dcff;
      background: var(--accent-soft);
    }

    .status-pill.loading .status-dot {
      background: var(--accent);
      animation: pulse 1.1s infinite ease-in-out;
    }

    .status-pill.success {
      color: var(--success);
      border-color: #bce8d5;
      background: var(--success-soft);
    }

    .status-pill.success .status-dot {
      background: var(--success);
      box-shadow: 0 0 12px rgba(22, 132, 91, 0.3);
    }

    .status-pill.error {
      color: var(--danger);
      border-color: #f0c8cc;
      background: var(--danger-soft);
    }

    .status-pill.error .status-dot {
      background: var(--danger);
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 0.45;
        transform: scale(0.9);
      }

      50% {
        opacity: 1;
        transform: scale(1.12);
      }
    }

    .panel {
      border: 1px solid var(--border);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.94);
      box-shadow: var(--shadow);
    }

    .investigation-panel {
      margin-bottom: 26px;
      padding: 22px;
    }

    .investigation-heading {
      margin-bottom: 18px;
    }

    .investigation-heading h2 {
      margin: 3px 0 6px;
      font-size: 21px;
      letter-spacing: -0.025em;
    }

    .investigation-heading p {
      margin: 0;
      color: var(--muted);
      line-height: 1.55;
    }

    .section-kicker {
      color: var(--accent) !important;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .question-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      margin-bottom: 16px;
    }

    .question-chip {
      padding: 9px 12px;
      border: 1px solid var(--border);
      border-radius: 999px;
      color: var(--text-soft);
      background: var(--surface-muted);
      font-size: 13px;
      font-weight: 650;
      cursor: pointer;
      transition:
        border-color 120ms ease,
        background 120ms ease,
        color 120ms ease,
        transform 120ms ease;
    }

    .question-chip:hover {
      transform: translateY(-1px);
      border-color: #b9c5ed;
      background: var(--accent-soft);
    }

    .question-chip.active {
      color: var(--accent);
      border-color: #b9c5ed;
      background: var(--accent-soft);
    }

    .controls {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 12px;
    }

    .question-input {
      width: 100%;
      min-width: 0;
      padding: 14px 16px;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: 11px;
      outline: none;
      transition:
        border-color 120ms ease,
        box-shadow 120ms ease;
    }

    .question-input::placeholder {
      color: #98a3b5;
    }

    .question-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px rgba(82, 111, 232, 0.12);
    }

    .button {
      border-radius: 11px;
      padding: 14px 18px;
      font-weight: 700;
      cursor: pointer;
      transition:
        transform 120ms ease,
        box-shadow 120ms ease,
        background 120ms ease,
        border-color 120ms ease;
    }

    .button:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .button-primary {
      color: #ffffff;
      background: var(--accent);
      border: 1px solid var(--accent);
      box-shadow: 0 7px 18px rgba(82, 111, 232, 0.22);
    }

    .button-primary:hover:not(:disabled) {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
    }

    .button-secondary {
      color: var(--text-soft);
      background: var(--surface);
      border: 1px solid var(--border-strong);
    }

    .button-secondary:hover:not(:disabled) {
      border-color: #b6c1d2;
      background: var(--surface-raised);
    }

    .error-box {
      display: none;
      margin-bottom: 22px;
      padding: 14px 16px;
      border: 1px solid #f0c8cc;
      border-radius: 11px;
      color: var(--danger);
      background: var(--danger-soft);
      line-height: 1.5;
    }

    .error-box.visible {
      display: block;
    }

    .empty-state {
      padding: 68px 24px;
      text-align: center;
      color: var(--muted);
    }

    .empty-icon {
      display: grid;
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      place-items: center;
      border-radius: 14px;
      color: var(--accent);
      background: var(--accent-soft);
      font-size: 21px;
    }

    .empty-state h2 {
      margin: 0 0 10px;
      color: var(--text);
      font-size: 24px;
      letter-spacing: -0.025em;
    }

    .empty-state p {
      margin: 0;
      line-height: 1.6;
    }

    .dashboard {
      display: none;
    }

    .dashboard.visible {
      display: block;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }

    .metric-card {
      padding: 19px;
    }

    .metric-label {
      margin: 0 0 9px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 600;
    }

    .metric-value {
      margin: 0;
      color: var(--text);
      font-size: 31px;
      font-weight: 780;
      letter-spacing: -0.04em;
    }

    .metric-change {
      display: inline-flex;
      margin: 9px 0 0;
      padding: 4px 7px;
      border-radius: 6px;
      color: var(--danger);
      background: var(--danger-soft);
      font-size: 12px;
      font-weight: 700;
    }

    .content-grid {
      display: grid;
      grid-template-columns:
        minmax(0, 1.45fr)
        minmax(340px, 0.9fr);
      gap: 24px;
      align-items: start;
    }

    .section {
      padding: 22px;
    }

    .section + .section {
      margin-top: 24px;
    }

    .section-title {
      margin: 0 0 18px;
      font-size: 18px;
      letter-spacing: -0.02em;
    }

    .timeline {
      position: relative;
      display: grid;
      gap: 18px;
    }

    .timeline::before {
      content: "";
      position: absolute;
      top: 9px;
      bottom: 9px;
      left: 7px;
      width: 1px;
      background: var(--border);
    }

    .timeline-item {
      position: relative;
      display: grid;
      grid-template-columns: 16px 82px minmax(0, 1fr);
      gap: 12px;
      align-items: flex-start;
    }

    .timeline-marker {
      width: 15px;
      height: 15px;
      margin-top: 2px;
      border: 3px solid var(--surface);
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 1px rgba(82, 111, 232, 0.1);
      z-index: 1;
    }

    .timeline-marker.warning {
      background: #f2a93b;
    }

    .timeline-marker.error {
      background: #e75c67;
    }

    .timeline-time {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.55;
    }

    .timeline-content strong {
      display: block;
      margin-bottom: 4px;
      color: var(--text);
      font-size: 14px;
    }

    .timeline-content p {
      margin: 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.55;
    }

    .root-cause {
      padding: 18px;
      border: 1px solid #f0c8cc;
      border-radius: 13px;
      background: var(--danger-soft);
    }

    .root-cause-heading {
      margin: 0 0 9px;
      color: var(--danger);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }

    .root-cause p {
      margin: 0;
      color: var(--text-soft);
      line-height: 1.65;
    }

    .confidence-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid #f0c8cc;
    }

    .confidence-label {
      color: var(--muted);
      font-size: 13px;
      font-weight: 650;
    }

    .confidence-value {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: var(--success);
      font-size: 13px;
      font-weight: 800;
    }

    .confidence-value::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
    }

    .report {
      color: var(--text-soft);
      line-height: 1.7;
    }

    .report h1,
    .report h2,
    .report h3 {
      color: var(--text);
      letter-spacing: -0.02em;
    }

    .report h1 {
      margin: 0 0 14px;
      font-size: 24px;
    }

    .report h2 {
      margin: 30px 0 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
      font-size: 18px;
    }

    .report h2:first-child {
      margin-top: 0;
    }

    .report h3 {
      margin: 24px 0 8px;
      font-size: 16px;
    }

    .report p {
      margin: 8px 0 14px;
    }

    .report ul,
    .report ol {
      margin: 10px 0 18px;
      padding-left: 22px;
    }

    .report li {
      margin: 7px 0;
    }

    .report code {
      padding: 2px 6px;
      border: 1px solid var(--border);
      border-radius: 5px;
      color: #3d55b5;
      background: var(--accent-soft);
      font-family:
        "SFMono-Regular",
        Consolas,
        monospace;
      font-size: 0.9em;
    }

    .trace-list {
      display: grid;
      gap: 10px;
    }

    details {
      border: 1px solid var(--border);
      border-radius: 11px;
      background: var(--surface-raised);
      overflow: hidden;
    }

    details[open] {
      border-color: #cbd4e3;
    }

    summary {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 13px 14px;
      color: var(--text-soft);
      cursor: pointer;
      font-weight: 700;
      list-style: none;
    }

    summary::-webkit-details-marker {
      display: none;
    }

    summary::before {
      content: "✓";
      display: grid;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      place-items: center;
      border-radius: 50%;
      color: var(--success);
      background: var(--success-soft);
      font-size: 12px;
      font-weight: 900;
    }

    pre {
      max-height: 320px;
      margin: 0;
      padding: 14px;
      overflow: auto;
      border-top: 1px solid var(--border);
      color: #46546a;
      background: #f5f7fb;
      font-size: 12px;
      line-height: 1.55;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .agent-progress {
      display: grid;
      gap: 12px;
    }

    .agent-progress-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .agent-progress-icon {
      display: grid;
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      place-items: center;
      border-radius: 50%;
      color: var(--success);
      background: var(--success-soft);
      font-size: 12px;
      font-weight: 900;
    }

    .agent-progress-item strong {
      display: block;
      margin-bottom: 3px;
      color: var(--text);
      font-size: 13px;
    }

    .agent-progress-item p {
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.45;
    }

    .footer {
      margin-top: 28px;
      padding: 20px 0 0;
      color: var(--muted);
      text-align: center;
      font-size: 13px;
    }

    .footer strong {
      color: var(--text-soft);
    }

    @media (max-width: 900px) {
      .header {
        flex-direction: column;
      }

      .controls {
        grid-template-columns: 1fr 1fr;
      }

      .question-input {
        grid-column: 1 / -1;
      }

      .metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 560px) {
      .shell {
        width: min(100% - 20px, 1180px);
        padding-top: 28px;
      }

      .controls {
        grid-template-columns: 1fr;
      }

      .question-input {
        grid-column: auto;
      }

      .metrics {
        grid-template-columns: 1fr;
      }

      .timeline-item {
        grid-template-columns: 16px 68px minmax(0, 1fr);
      }

      .section,
      .investigation-panel {
        padding: 18px;
      }
    }
  </style>
</head>

<body>
  <main class="shell">
    <header class="header">
      <div class="header-content">
        <h1>Incident Investigator</h1>

        <p class="subtitle">
          Generate a realistic production incident and watch an autonomous agent
          investigate queue health, deployments, and failure telemetry to identify
          the root cause.
        </p>

        <div class="technology-list">
          <span>Cloudflare Workers</span>
          <span>Workers AI</span>
          <span>D1</span>
          <span>Tool calling</span>
        </div>
      </div>

      <div id="statusPill" class="status-pill">
        <span class="status-dot"></span>
        <span id="statusText">Ready</span>
      </div>
    </header>

    <section class="panel investigation-panel">
      <div class="investigation-heading">
        <div>
          <p class="section-kicker">Start an investigation</p>

          <h2>What would you like the agent to investigate?</h2>

          <p>
            Choose a suggested question or enter your own.
          </p>
        </div>
      </div>

      <div class="question-suggestions">
        <button
          class="question-chip active"
          type="button"
          data-question="Investigate why notifications are delayed."
        >
            Investigate delayed notifications
        </button>

        <button
          class="question-chip"
          type="button"
          data-question="Identify the cause of the notification queue backlog."
        >
          What caused the queue backlog?
        </button>

        <button
          class="question-chip"
          type="button"
          data-question="Investigate the notification-consumer processing failures."
        >
            Investigate consumer failures
        </button>

        <button
          class="question-chip"
          type="button"
          data-question="Determine whether a recent deployment is related to the increase in notification failures."
        >
          Was a deployment involved?
        </button>
      </div>

      <div class="controls">
        <input
          id="questionInput"
          class="question-input"
          value="Investigate why notifications are delayed."
          placeholder="Enter an investigation question"
          aria-label="Investigation question"
        />

        <button
          id="generateButton"
          class="button button-secondary"
          type="button"
        >
          Generate demo incident
        </button>

        <button
          id="investigateButton"
          class="button button-primary"
          type="button"
        >
          Run investigation
        </button>
      </div>
    </section>

    <div id="errorBox" class="error-box"></div>

    <section id="emptyState" class="panel empty-state">
      <div class="empty-icon">⌁</div>

      <h2>No investigation yet</h2>

      <p>
        Generate the demo incident, then ask the agent to investigate it.
      </p>
    </section>

    <section id="dashboard" class="dashboard">
      <div id="metrics" class="metrics"></div>

      <div class="content-grid">
        <div>
          <section class="panel section">
            <h2 class="section-title">Incident timeline</h2>
            <div id="timeline" class="timeline"></div>
          </section>

          <section class="panel section">
            <h2 class="section-title">Investigation report</h2>
            <article id="report" class="report"></article>
          </section>
        </div>

        <aside>
          <section class="panel section">
            <h2 class="section-title">Likely root cause</h2>
            <div id="rootCause" class="root-cause"></div>
          </section>

          <section class="panel section">
            <h2 class="section-title">Investigation flow</h2>
            <div id="agentProgress" class="agent-progress"></div>
          </section>

          <section class="panel section">
            <h2 class="section-title">Agent tool trace</h2>
            <div id="traceList" class="trace-list"></div>
          </section>
        </aside>
      </div>
    </section>

    <footer class="footer">
      Built with <strong>Cloudflare Workers, Workers AI, D1, and tool calling</strong>.
    </footer>
  </main>

  <script>
    const generateButton =
      document.getElementById("generateButton");

    const investigateButton =
      document.getElementById("investigateButton");

    const questionInput =
      document.getElementById("questionInput");

    const questionChips =
      document.querySelectorAll(".question-chip");

    const statusPill =
      document.getElementById("statusPill");

    const statusText =
      document.getElementById("statusText");

    const errorBox =
      document.getElementById("errorBox");

    generateButton.addEventListener(
      "click",
      generateIncident,
    );

    investigateButton.addEventListener(
      "click",
      investigateIncident,
    );

    for (const chip of questionChips) {
      chip.addEventListener("click", () => {
        const question = chip.dataset.question;

        if (!question) {
          return;
        }

        questionInput.value = question;

        for (const currentChip of questionChips) {
          currentChip.classList.remove("active");
        }

        chip.classList.add("active");
      });
    }

    questionInput.addEventListener("input", () => {
      for (const chip of questionChips) {
        if (chip.dataset.question === questionInput.value) {
          chip.classList.add("active");
        } else {
          chip.classList.remove("active");
        }
      }
    });

    questionInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        investigateIncident();
      }
    });

    async function generateIncident() {
      clearError();
      setBusy(true, "Generating incident");

      try {
        const response = await fetch(
          "/api/demo/scenarios/payload-schema-mismatch",
          {
            method: "POST",
          },
        );

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error || "Incident generation failed",
          );
        }

        setStatus("success", "Incident generated");
      } catch (error) {
        showError(error);
        setStatus("error", "Generation failed");
      } finally {
        setBusy(false);
      }
    }

    async function investigateIncident() {
      clearError();

      const question = questionInput.value.trim();

      if (!question) {
        showError(
          new Error("Enter an investigation question."),
        );

        return;
      }

      setBusy(true, "Investigating");

      try {
        const response = await fetch("/investigate", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ question }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error || "Investigation failed",
          );
        }

        renderInvestigation(payload);
        setStatus("success", "Investigation complete");
      } catch (error) {
        showError(error);
        setStatus("error", "Investigation failed");
      } finally {
        setBusy(false);
      }
    }

    function renderInvestigation(payload) {
      const steps = Array.isArray(payload.steps)
        ? payload.steps
        : [];

      const queueStep = steps.find(
        (step) => step.tool === "inspect_queue",
      );

      const deploymentStep = steps.find(
        (step) =>
          step.tool === "get_recent_deployments" &&
          Array.isArray(step.result) &&
          step.result.length > 0,
      );

      const eventStep = steps.find(
        (step) =>
          step.tool === "query_events" &&
          Array.isArray(step.result) &&
          step.result.length > 0,
      );

      renderMetrics(queueStep?.result);

      renderTimeline(
        queueStep?.result,
        deploymentStep?.result ?? [],
        eventStep?.result ?? [],
      );

      renderRootCause(
        deploymentStep?.result?.[0],
        eventStep?.result?.[0],
      );

      renderReport(payload.answer || "");

      renderAgentProgress(steps);

      renderTrace(steps);

      document
        .getElementById("emptyState")
        .style.display = "none";

      document
        .getElementById("dashboard")
        .classList.add("visible");

      document
        .getElementById("dashboard")
        .scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }

    function renderMetrics(queue) {
      const container =
        document.getElementById("metrics");

      if (!queue) {
        container.innerHTML = "";
        return;
      }

      const oldestSeconds =
        Number(queue.current?.oldestMessageAgeSeconds ?? 0);

      const cards = [
        {
          label: "Queue depth",
          value: queue.current?.depth ?? 0,
          change:
            "+" + (queue.changes?.depthIncrease ?? 0),
        },
        {
          label: "Oldest message",
          value:
            Math.round(oldestSeconds / 60) + " min",
          change: oldestSeconds + " seconds",
        },
        {
          label: "Retries",
          value: queue.current?.retryCount ?? 0,
          change:
            "+" + (queue.changes?.retryIncrease ?? 0),
        },
        {
          label: "Failure rate",
          value:
            Math.round(
              Number(queue.current?.failureRate ?? 0) *
                100,
            ) + "%",
          change:
            "+" +
            Math.round(
              Number(
                queue.changes?.failureRateIncrease ?? 0,
              ) * 100,
            ) +
            " points",
        },
      ];

      container.innerHTML = cards
        .map(
          (card) => \`
            <article class="panel metric-card">
              <p class="metric-label">
                \${escapeHtml(card.label)}
              </p>

              <p class="metric-value">
                \${escapeHtml(String(card.value))}
              </p>

              <p class="metric-change">
                \${escapeHtml(card.change)}
              </p>
            </article>
          \`,
        )
        .join("");
    }

    function renderTimeline(
      queue,
      deployments,
      events,
    ) {
      const items = [];

      for (const snapshot of queue?.snapshots ?? []) {
        const failureRate =
          Number(snapshot.failureRate ?? 0);

        items.push({
          timestamp: snapshot.timestamp,
          type:
            failureRate >= 0.3
              ? "error"
              : failureRate >= 0.1
                ? "warning"
                : "normal",
          title:
            Number(snapshot.depth ?? 0) <= 10
              ? "Queue healthy"
              : "Queue degradation",
          description:
            "Depth " +
            snapshot.depth +
            ", retries " +
            snapshot.retryCount +
            ", failure rate " +
            Math.round(failureRate * 100) +
            "%.",
        });
      }

      for (const deployment of deployments) {
        items.push({
          timestamp: deployment.deployedAt,
          type: "warning",
          title:
            deployment.serviceName +
            " " +
            deployment.version +
            " deployed",
          description:
            deployment.summary ||
            "A new deployment was recorded.",
        });
      }

      for (const event of events) {
        const attributes = event.attributes ?? {};

        const expectedField =
          attributes.field ?? "required field";

        const receivedField =
          attributes.receivedField ?? "unknown field";

        items.push({
          timestamp: event.timestamp,
          type: "error",
          title:
            event.serviceName +
            " failed to process a message",
          description:
            (attributes.errorCode || "Processing failure") +
            ": expected " +
            expectedField +
            ", received " +
            receivedField +
            ".",
        });
      }

      items.sort(
        (left, right) =>
          new Date(left.timestamp).getTime() -
          new Date(right.timestamp).getTime(),
      );

      const timeline =
        document.getElementById("timeline");

      if (items.length === 0) {
        timeline.innerHTML =
          "<p>No timeline evidence was returned.</p>";

        return;
      }

      timeline.innerHTML = items
        .map(
          (item) => \`
            <div class="timeline-item">
              <div
                class="timeline-marker \${escapeHtml(
                  item.type,
                )}"
              ></div>

              <time class="timeline-time">
                \${formatTime(item.timestamp)}
              </time>

              <div class="timeline-content">
                <strong>
                  \${escapeHtml(item.title)}
                </strong>

                <p>
                  \${escapeHtml(item.description)}
                </p>
              </div>
            </div>
          \`,
        )
        .join("");
    }

    function renderRootCause(
      deployment,
      failureEvent,
    ) {
      const rootCauseContainer =
        document.getElementById("rootCause");

      if (deployment && failureEvent) {
        const attributes =
          failureEvent.attributes ?? {};

        const expectedField =
          attributes.field ?? "the original field";

        const receivedField =
          attributes.receivedField ??
          "a renamed field";

        const rootCause =
          deployment.serviceName +
          " " +
          deployment.version +
          " changed outbound payload fields. " +
          "The consumer still expected " +
          expectedField +
          ", but received " +
          receivedField +
          ", causing validation failures and retries.";

        rootCauseContainer.innerHTML = \`
          <p class="root-cause-heading">
            Schema contract mismatch
          </p>

          <p>
            \${escapeHtml(rootCause)}
          </p>

          <div class="confidence-row">
            <span class="confidence-label">
              Confidence
            </span>

            <span class="confidence-value">
              Evidence-backed
            </span>
          </div>
        \`;

        return;
      }

      rootCauseContainer.innerHTML = \`
        <p class="root-cause-heading">
          Investigation completed
        </p>

        <p>
          No structured root-cause summary could be
          extracted from the tool results.
        </p>

        <div class="confidence-row">
          <span class="confidence-label">
            Confidence
          </span>

          <span class="confidence-value">
            Medium
          </span>
        </div>
      \`;
    }

    function renderReport(markdown) {
      const report =
        document.getElementById("report");

      if (!markdown) {
        report.innerHTML =
          "<p>No written report was returned.</p>";

        return;
      }

      report.innerHTML =
        markdownToHtml(markdown);
    }

    function renderAgentProgress(steps) {
      const progressItems = steps.map((step) => {
        if (step.tool === "inspect_queue") {
          return {
            title: "Inspected queue health",
            description:
              "Compared current queue metrics with the healthy baseline.",
          };
        }

        if (step.tool === "query_events") {
          return {
            title: "Analyzed failure events",
            description:
              "Examined error telemetry from the affected service.",
          };
        }

        if (
          step.tool === "get_recent_deployments"
        ) {
          const serviceName =
            step.arguments?.serviceName ||
            "a related service";

          return {
            title:
              "Checked " +
              serviceName +
              " deployments",
            description:
              "Looked for changes near the start of the incident.",
          };
        }

        return {
          title:
            "Used " + String(step.tool),
          description:
            "Collected additional incident evidence.",
        };
      });

      const container =
        document.getElementById("agentProgress");

      if (progressItems.length === 0) {
        container.innerHTML =
          "<p>No tool activity was recorded.</p>";

        return;
      }

      container.innerHTML = progressItems
        .map(
          (item) => \`
            <div class="agent-progress-item">
              <span class="agent-progress-icon">
                ✓
              </span>

              <div>
                <strong>
                  \${escapeHtml(item.title)}
                </strong>

                <p>
                  \${escapeHtml(item.description)}
                </p>
              </div>
            </div>
          \`,
        )
        .join("");
    }

    function renderTrace(steps) {
      const traceList =
        document.getElementById("traceList");

      if (steps.length === 0) {
        traceList.innerHTML =
          "<p>No tool calls were recorded.</p>";

        return;
      }

      traceList.innerHTML = steps
        .map(
          (step) => \`
            <details>
              <summary>
                \${escapeHtml(
                  step.step + ". " + step.tool,
                )}
              </summary>

              <pre>\${escapeHtml(
                JSON.stringify(
                  {
                    arguments: step.arguments,
                    result: step.result,
                  },
                  null,
                  2,
                ),
              )}</pre>
            </details>
          \`,
        )
        .join("");
    }

    function markdownToHtml(markdown) {
      const escaped = escapeHtml(markdown)
        .replace(
          /\`([^\`]+)\`/g,
          "<code>$1</code>",
        )
        .replace(
          /\\*\\*(.*?)\\*\\*/g,
          "<strong>$1</strong>",
        );

      const lines = escaped.split("\\n");
      const output = [];

      let listType = null;

      function closeList() {
        if (!listType) {
          return;
        }

        output.push("</" + listType + ">");
        listType = null;
      }

      for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line) {
          closeList();
          continue;
        }

        if (line.startsWith("### ")) {
          closeList();

          output.push(
            "<h3>" +
              line.slice(4) +
            "</h3>",
          );

          continue;
        }

        if (line.startsWith("## ")) {
          closeList();

          output.push(
            "<h2>" +
              line.slice(3) +
            "</h2>",
          );

          continue;
        }

        if (line.startsWith("# ")) {
          closeList();

          output.push(
            "<h1>" +
              line.slice(2) +
            "</h1>",
          );

          continue;
        }

        if (/^[-*] /.test(line)) {
          if (listType !== "ul") {
            closeList();
            output.push("<ul>");
            listType = "ul";
          }

          output.push(
            "<li>" +
              line.slice(2) +
            "</li>",
          );

          continue;
        }

        if (/^\\d+\\. /.test(line)) {
          if (listType !== "ol") {
            closeList();
            output.push("<ol>");
            listType = "ol";
          }

          output.push(
            "<li>" +
              line.replace(/^\\d+\\. /, "") +
            "</li>",
          );

          continue;
        }

        closeList();

        output.push(
          "<p>" + line + "</p>",
        );
      }

      closeList();

      return output.join("");
    }

    function formatTime(timestamp) {
      const date = new Date(timestamp);

      if (Number.isNaN(date.getTime())) {
        return "Unknown";
      }

      return new Intl.DateTimeFormat(
        undefined,
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        },
      ).format(date);
    }

    function setBusy(isBusy, text) {
      generateButton.disabled = isBusy;
      investigateButton.disabled = isBusy;
      questionInput.disabled = isBusy;

      for (const chip of questionChips) {
        chip.disabled = isBusy;
      }

      if (isBusy) {
        setStatus("loading", text);
      }
    }

    function setStatus(type, text) {
      statusPill.className =
        "status-pill" +
        (type ? " " + type : "");

      statusText.textContent = text;
    }

    function showError(error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      errorBox.textContent = message;
      errorBox.classList.add("visible");
    }

    function clearError() {
      errorBox.textContent = "";
      errorBox.classList.remove("visible");
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }
  </script>
</body>
</html>`;