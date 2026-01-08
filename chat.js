import { SCHEMAS } from "./schemas.js";

const AI_PROXY_BASE = "https://surudmahajan12-aiproxy.hf.space";
const BACKEND_BASE = "https://surudmahajan12-electronics.hf.space";

let lastBackendResult = null;
let lastUserMessage = null;

/* ===============================
   MAIN ENTRY
================================ */

export async function sendMessage() {
  const inputEl = document.getElementById("userInput");
  const statusEl = document.getElementById("status");
  const outputEl = document.getElementById("output");
  const formEl = document.getElementById("form");

  const message = inputEl.value.trim();
  if (!message) return;

  lastUserMessage = message;
  lastBackendResult = null;

  statusEl.textContent = "Classifying intent…";
  outputEl.textContent = "";
  formEl.innerHTML = "";

  // 1️⃣ CLASSIFY
  const intent = await postJSON(`${AI_PROXY_BASE}/classify`, {
    message
  });

  if (intent.error) {
    statusEl.textContent = "AI classification failed";
    outputEl.textContent = JSON.stringify(intent, null, 2);
    return;
  }

  // 2️⃣ MODE ROUTING
  if (intent.mode === "explain_concept") {
    await handleExplainConcept(message, statusEl, outputEl);
    return;
  }

  if (intent.mode === "calculate") {
    await handleCalculate(intent, message, statusEl, outputEl, formEl);
    return;
  }

  if (intent.mode === "explain_result") {
    await handleExplainResult(message, statusEl, outputEl);
    return;
  }

  statusEl.textContent = "Unknown intent mode";
}

/* ===============================
   MODE HANDLERS
================================ */

async function handleExplainConcept(message, statusEl, outputEl) {
  statusEl.textContent = "Explaining concept…";

  const res = await postJSON(`${AI_PROXY_BASE}/explain`, {
    message
  });

  outputEl.textContent = res.explanation || "No explanation returned";
  statusEl.textContent = "Done";
}

async function handleCalculate(intent, message, statusEl, outputEl, formEl) {
  const key = `${intent.domain}:${intent.operation}`;
  const schema = SCHEMAS[key];

  if (!schema) {
    statusEl.textContent = "No UI schema found for this operation";
    outputEl.textContent = JSON.stringify(intent, null, 2);
    return;
  }

  statusEl.textContent = `Provide inputs for ${schema.title}`;
  renderForm(schema, async payload => {
    statusEl.textContent = "Calling backend…";

    const result = await callBackend(
      intent.endpoint,
      intent.method,
      payload
    );

    lastBackendResult = result;

    outputEl.textContent = JSON.stringify(result, null, 2);
    statusEl.textContent = "Result ready";

    renderExplainResultButton(formEl);
  });
}

async function handleExplainResult(message, statusEl, outputEl) {
  if (!lastBackendResult) {
    statusEl.textContent = "No previous result to explain";
    return;
  }

  statusEl.textContent = "Explaining result…";

  const res = await postJSON(`${AI_PROXY_BASE}/explain`, {
    message,
    backend_result: lastBackendResult
  });

  outputEl.textContent =
    JSON.stringify(lastBackendResult, null, 2) +
    "\n\n--- Explanation ---\n\n" +
    (res.explanation || "");

  statusEl.textContent = "Done";
}

/* ===============================
   FORM RENDERING
================================ */

function renderForm(schema, onSubmit) {
  const formEl = document.getElementById("form");
  formEl.innerHTML = `<h3>${schema.title}</h3>`;

  schema.fields.forEach(f => {
    const id = `field_${f.name}`;

    formEl.innerHTML += `
      <label>${f.label}</label>
      ${
        f.type === "multiline"
          ? `<textarea id="${id}"></textarea>`
          : `<input type="${f.type}" id="${id}" />`
      }
    `;
  });

  const btn = document.createElement("button");
  btn.textContent = "Solve";
  btn.onclick = () => {
    const payload = {};

    schema.fields.forEach(f => {
      const el = document.getElementById(`field_${f.name}`);
      let val = el.value.trim();

      if (f.type === "multiline") {
        val = val.split("\n").filter(x => x);
      }

      if (f.label.toLowerCase().includes("comma")) {
        val = val.split(",").map(x => x.trim());
      }

      if (f.type === "number") {
        val = Number(val);
      }

      payload[f.name] = val;
    });

    onSubmit(payload);
  };

  formEl.appendChild(btn);
}

function renderExplainResultButton(formEl) {
  const btn = document.createElement("button");
  btn.textContent = "Explain Result";
  btn.style.marginLeft = "10px";

  btn.onclick = () => {
    document.getElementById("userInput").value =
      "Explain the result";
    sendMessage();
  };

  formEl.appendChild(btn);
}

/* ===============================
   NETWORK HELPERS
================================ */

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return await res.json();
}

async function callBackend(endpoint, method, payload) {
  const res = await fetch(`${BACKEND_BASE}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify(payload) : null
  });
  return await res.json();
}
