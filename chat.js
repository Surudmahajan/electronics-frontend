/*
Copyright 2026 Surud Mahajan

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
*/
import { SCHEMAS } from "./schemas.js";

const AI_PROXY_BASE = "https://surudmahajan12-aiproxy.hf.space";
const BACKEND_BASE = "https://surudmahajan12-electronics.hf.space";
const VISUALS_ORIGIN = "https://ovisual.netlify.app";

/* ===============================
   OMNIAI CONTEXT SENDER
================================ */

function sendContextToOmniAI(context) {
  const frame = document.getElementById("omniaiFrame");

  if (!frame || !frame.contentWindow) return;

  frame.contentWindow.postMessage(
    {
      type: "ENGINE_CONTEXT",
      payload: context
    },
    "*"
  );
}
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

  statusEl.textContent = "Understanding your request…";
  outputEl.textContent = "";
  formEl.innerHTML = "";

  /* 1️⃣ CLASSIFY */
  const intent = await postJSON(`${AI_PROXY_BASE}/classify`, { message });

  if (intent.error) {
    statusEl.textContent = "AI classification failed";
    outputEl.textContent = intent.error;
    return;
  }

  /* 2️⃣ CONCEPT EXPLANATION */
  if (intent.mode === "explain_concept") {
    statusEl.textContent = "Explaining concept…";
    const res = await postJSON(`${AI_PROXY_BASE}/explain`, { message });
    outputEl.textContent = res.explanation;
    statusEl.textContent = "Done";
    return;
  }

  /* 3️⃣ CALCULATION */
  if (intent.mode === "calculate") {
    const key = `${intent.domain}:${intent.operation}`;
    const schema = SCHEMAS[key];

    if (!schema) {
      statusEl.textContent = "No input form available for this operation";
      return;
    }

    statusEl.textContent = `Provide inputs for ${schema.title}`;
    renderForm(schema, async payload => {
      statusEl.textContent = "Computing result…";

      /* BACKEND COMPUTE */
      const result = await callBackend(
        intent.endpoint,
        intent.method,
        payload
      );
        console.log("BACKEND RESULT:", result);
        /* SEND RESULT TO VISUALS IFRAME */
const visualsIframe = document.getElementById("visuals-iframe");
if (visualsIframe && visualsIframe.contentWindow) {
  visualsIframe.contentWindow.postMessage(
    {
      type: "ENGINE_RESULT",
      payload: {
        domain: intent.domain,
        operation: intent.operation,
        data: result
      }
    },
    VISUALS_ORIGIN
  );
}


      /* AI EXPLANATION (AUTO) */
      statusEl.textContent = "Explaining solution…";
      const explanation = await postJSON(`${AI_PROXY_BASE}/explain`, {
        message,
        backend_result: result
      });

      /* FINAL OUTPUT */
      outputEl.innerHTML = `
FINAL ANSWER
────────────
${formatResult(result)}

CONCEPTUAL STEPS
────────────────
${formatSteps(explanation.explanation)}
      `;

      statusEl.textContent = "Done";
    });
  }
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

/* ===============================
   FORMATTERS (NO JSON)
================================ */

function formatResult(result) {
  if (result.solution) {
    return Object.entries(result.solution)
      .map(([k, v]) => `• ${k} = ${v}`)
      .join("<br>");
  }

  if (result.voltages) {
    return result.voltages
      .map((v, i) => `• Voltage ${i + 1} = ${v}`)
      .join("<br>");
  }

  if (result.currents) {
    return result.currents
      .map((c, i) => `• Current ${i + 1} = ${c}`)
      .join("<br>");
  }

  return Object.entries(result)
    .map(([k, v]) => `• ${k}: ${v}`)
    .join("<br>");
}

function formatSteps(text) {
  return text
    .split("\n")
    .filter(l => l.trim())
    .map(l => `• ${l}`)
    .join("<br>");
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
