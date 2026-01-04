const CHAT = document.getElementById("chat");
const INPUT = document.getElementById("userInput");

const AI_PROXY_URL =
  "https://surudmahajan12-electronics-ai-proxy.hf.space/chat";

const ELECTRONICS_BACKEND =
  "https://surudmahajan12-electronics.hf.space";

/* ===========================
   ROUTES
=========================== */
const ROUTES = {
  dc: {
    kcl_kvl: "/dc/kcl-kvl",
    series_parallel: "/dc/series-parallel",
    voltage_divider: "/dc/voltage-divider",
    current_divider: "/dc/current-divider",
    mesh: "/dc/mesh",
    nodal: "/dc/nodal",
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
    kvl: "kcl_kvl",
    kcl_kvl: "kcl_kvl"
  }
};

/* ===========================
   SYSTEM PROMPT
=========================== */
const SYSTEM_PROMPT = `
You are an Electronics Engineering Assistant.

Respond ONLY in valid JSON.

For solving:
{
  "action": "solve",
  "domain": "dc",
  "operation": "nodal",
  "payload": {
    "equations": [],
    "variables": []
  }
}

For theory:
{
  "action": "explain",
  "content": "..."
}
`;

/* ===========================
   HELPERS
=========================== */
function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.textContent = text;
  CHAT.appendChild(div);
  CHAT.scrollTop = CHAT.scrollHeight;
}

function normalizeOperation(op) {
  if (typeof op !== "string") return null;

  return op
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
    .trim();
}


function normalizeDomain(domain) {
  if (!domain || typeof domain !== "string") {
    return "dc"; // DEFAULT SAFE DOMAIN
  }

  domain = domain.toLowerCase();

  if (domain.includes("dc")) return "dc";
  if (domain.includes("ac")) return "ac";
  if (domain.includes("machine")) return "machines";
  if (domain.includes("digital")) return "digital";
  if (domain.includes("logic")) return "logic";
  if (domain.includes("combinational")) return "combinational";

  return domain;
}


function extractVariables(equations) {
  const vars = new Set();
  equations.forEach(eq => {
    const matches = eq.match(/[A-Za-z]+\d*/g);
    if (matches) matches.forEach(v => vars.add(v));
  });
  return Array.from(vars);
}

/* ===========================
   MAIN FLOW
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

  if (decision.action === "solve") {
  addMessage("Solving using engineering laws…", "ai");

  // HARD DEFAULTS
  let domain = typeof decision.domain === "string" ? decision.domain : "dc";
  let operation =
    typeof decision.operation === "string"
      ? decision.operation
      : "nodal";

  let payload = decision.payload || {};

  domain = normalizeDomain(domain);
  operation = normalizeOperation(operation);

  if (!operation) {
    throw new Error("Operation missing from AI response");
  }

  // Alias resolution
  if (OPERATION_ALIASES[domain]?.[operation]) {
    operation = OPERATION_ALIASES[domain][operation];
  }

  if (!ROUTES[domain] || !ROUTES[domain][operation]) {
    console.error("Resolved domain:", domain);
    console.error("Resolved operation:", operation);
    throw new Error("Unsupported domain or operation");
  }

  payload.equations = Array.isArray(payload.equations)
    ? payload.equations
    : [];

  payload.variables = Array.isArray(payload.variables) && payload.variables.length
    ? payload.variables
    : extractVariables(payload.equations);

  if (!payload.equations.length || !payload.variables.length) {
    throw new Error("Incomplete solver payload");
  }

  const solverResult = await callSolver(
    ROUTES[domain][operation],
    payload
  );

  addMessage(formatResult(domain, operation, solverResult), "ai");
  return;
}

  } catch (err) {
    console.error(err);
    addMessage(
      "I couldn’t process that request. Please rephrase or provide clearer information.",
      "ai"
    );
  }
}

/* ===========================
   AI CALL
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

  return await res.json();
}

/* ===========================
   RESULT FORMAT
=========================== */
function formatResult(domain, operation, result) {
  let text = "The circuit was analyzed using nodal analysis.\n\n";
  for (const [k, v] of Object.entries(result.solution)) {
    text += `• ${k} = ${Number(v).toFixed(4)} A\n`;
  }
  return text;
}

