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
  },

  ac: {
    waveform: "/ac/waveform",
    impedance: "/ac/impedance",
    rlc: "/ac/rlc",
    power: "/ac/power",
    resonance: "/ac/resonance"
  },

  machines: {
    dc_motor: "/machines/dc-motor",
    induction_motor: "/machines/induction-motor",
    inverter: "/machines/inverter",
    ups: "/machines/ups",
    smps: "/machines/smps",
    batteries: "/machines/batteries",
    comparison: "/machines/comparison"
  },

  digital: {
    convert: "/digital/convert",
    binary_add: "/digital/binary-add",
    binary_sub: "/digital/binary-sub",
    bcd: "/digital/bcd",
    gray: "/digital/gray"
  },

  logic: {
    truth_table: "/logic/truth-table",
    simplify: "/logic/simplify",
    kmap: "/logic/kmap",
    universal_gates: "/logic/universal-gates"
  },

  combinational: {
    half_adder: "/combinational/half-adder",
    full_adder: "/combinational/full-adder",
    half_subtractor: "/combinational/half-subtractor",
    full_subtractor: "/combinational/full-subtractor",
    mux: "/combinational/mux",
    demux: "/combinational/demux",
    encoder: "/combinational/encoder",
    decoder: "/combinational/decoder",
    comparator: "/combinational/comparator"
  }
};

const OPERATION_ALIASES = {
  dc: {
    kcl: "kcl_kvl",
    kvl: "kcl_kvl",
    kcl_and_kvl: "kcl_kvl",
    nodal_analysis: "nodal",
    mesh_analysis: "mesh",
    max_power_transfer: "max_power"
  },

  digital: {
    add: "binary_add",
    subtract: "binary_sub",
    conversion: "convert"
  },

  logic: {
    truth: "truth_table",
    simplify_expression: "simplify",
    k_map: "kmap"
  },

  combinational: {
    halfadder: "half_adder",
    fulladder: "full_adder",
    mux: "mux",
    demux: "demux"
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
    // 🔹 DIGITAL DOMAIN HANDLING (NO EQUATIONS)
if (domain === "digital") {
  const solverResult = await callSolver(
    ROUTES.digital[operation],
    payload
  );

  addMessage(formatResult(domain, operation, solverResult), "ai");
  return;
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

