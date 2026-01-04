/* ===========================
   DOM ELEMENTS
=========================== */
const CHAT = document.getElementById("chat");
const INPUT = document.getElementById("userInput");

/* ===========================
   BACKEND URLS
=========================== */
const AI_PROXY_URL =
  "https://surudmahajan12-electronics-ai-proxy.hf.space/chat";

const ELECTRONICS_BACKEND =
  "https://surudmahajan12-electronics.hf.space";

/* ===========================
   ROUTES (CANONICAL)
=========================== */
const ROUTES = {
  dc: {
    nodal: "/dc/nodal",
    kcl_kvl: "/dc/kcl-kvl",
    mesh: "/dc/mesh",
    series_parallel: "/dc/series-parallel",
    voltage_divider: "/dc/voltage-divider",
    current_divider: "/dc/current-divider",
    superposition: "/dc/superposition",
    thevenin: "/dc/thevenin",
    norton: "/dc/norton",
    max_power: "/dc/max-power"
  }
};

const OPERATION_ALIASES = {
  dc: {
    nodal_analysis: "nodal",
    nodal: "nodal",
    kcl: "kcl_kvl",
    kvl: "kcl_kvl"
  }
};

/* ===========================
   SYSTEM PROMPT (AI = DECISION ONLY)
=========================== */
const SYSTEM_PROMPT = `
You are an Electronics Engineering Assistant.

Respond ONLY in valid JSON.

DO NOT extract equations.
DO NOT extract variables.
DO NOT perform math.

Only decide domain and operation.

Solve response:
{
  "action": "solve",
  "domain": "dc",
  "operation": "nodal"
}

Theory response:
{
  "action": "explain",
  "content": "..."
}
`;

/* ===========================
   UI HELPERS
=========================== */
function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.textContent = text;
  CHAT.appendChild(div);
  CHAT.scrollTop = CHAT.scrollHeight;
}

/* ===========================
   EXTRACTION HELPERS (KEY FIX)
=========================== */
function extractEquations(text) {
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(l => /[A-Za-z]\d*\s*[\+\-\*\/]/.test(l));
}

function extractVariables(equations) {
  const vars = new Set();
  equations.forEach(eq => {
    const matches = eq.match(/[A-Za-z]+\d*/g);
    if (matches) matches.forEach(v => vars.add(v));
  });
  return Array.from(vars);
}

function normalizeDomain(domain) {
  if (!domain || typeof domain !== "string") return "dc";
  return domain.toLowerCase().includes("dc") ? "dc" : "dc";
}

function normalizeOperation(op) {
  if (!op || typeof op !== "string") return null;
  return op.toLowerCase().replace(/\s+/g, "_");
}

/* ===========================
   MAIN FLOW (STABLE)
=========================== */
async function sendMessage() {
  const userText = INPUT.value.trim();
  if (!userText) return;

  addMessage(userText, "user");
  INPUT.value = "";

  try {
    const decision = await callAI(userText);
    console.log("AI decision:", decision);

    if (decision.action === "explain") {
      addMessage(decision.content, "ai");
      return;
    }

    if (decision.action !== "solve") {
      throw new Error("Unknown AI action");
    }

    addMessage("Solving using engineering laws…", "ai");

    // 🧠 FRONTEND DOES EXTRACTION (FINAL FIX)
    const equations = extractEquations(userText);
    const variables = extractVariables(equations);

    if (!equations.length || !variables.length) {
      throw new Error("No equations or variables detected");
    }

    let domain = normalizeDomain(decision.domain);
    let operation = normalizeOperation(decision.operation);

    if (OPERATION_ALIASES[domain]?.[operation]) {
      operation = OPERATION_ALIASES[domain][operation];
    }

    if (!ROUTES[domain]?.[operation]) {
      throw new Error("Unsupported operation");
    }

    const solverResult = await callSolver(
      ROUTES[domain][operation],
      { equations, variables }
    );

    addMessage(formatResult(solverResult), "ai");

  } catch (err) {
    console.error(err);
    addMessage(
      "I couldn’t process that request. Please rephrase or provide clearer equations.",
      "ai"
    );
  }
}

/* ===========================
   AI CALL (SAFE)
=========================== */
async function callAI(userText) {
  const res = await fetch(AI_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "meta-llama/llama-3-8b-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText }
      ],
      temperature: 0
    })
  });

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

/* ===========================
   SOLVER CALL
=========================== */
async function callSolver(endpoint, payload) {
  const res = await fetch(ELECTRONICS_BACKEND + endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error("Solver failed: " + text);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Solver returned non-JSON: " + text);
  }
}


/* ===========================
   RESULT FORMATTER (HUMAN)
=========================== */
function formatResult(result) {
  if (!result.solution) return "Solution computed.";

  let text = "✅ Solution:\n\n";
  for (const [k, v] of Object.entries(result.solution)) {
    text += `${k} = ${Number(v).toFixed(4)} A\n`;
  }
  return text;
}

