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
   CANONICAL ROUTES (FULL)
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
  },

  digital: {
    convert: "/digital/convert",
    binary_add: "/digital/binary-add",
    binary_sub: "/digital/binary-sub",
    bcd: "/digital/bcd",
    gray: "/digital/gray"
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

/* ===========================
   OPERATION ALIASES
=========================== */
const OPERATION_ALIASES = {
  dc: {
    nodal_analysis: "nodal",
    nodal: "nodal",
    kcl: "kcl_kvl",
    kvl: "kcl_kvl"
  },
  digital: {
    binary_addition: "binary_add",
    binary_subtraction: "binary_sub"
  }
};

/* ===========================
   SYSTEM PROMPT (DECISION ONLY)
=========================== */
const SYSTEM_PROMPT = `
You are an Electronics Engineering Assistant.

Return ONLY valid JSON.

Do NOT extract equations.
Do NOT compute.
Do NOT explain unless asked.

Solve response:
{
  "action": "solve",
  "domain": "<dc|ac|digital|machines|logic|combinational>",
  "operation": "<operation>"
}

Explain response:
{
  "action": "explain",
  "content": "..."
}
`;

/* ===========================
   UI
=========================== */
function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.textContent = text;
  CHAT.appendChild(div);
  CHAT.scrollTop = CHAT.scrollHeight;
}

/* ===========================
   NORMALIZATION
=========================== */
function normalizeDomain(domain) {
  if (typeof domain !== "string") return "dc";
  domain = domain.toLowerCase();
  if (ROUTES[domain]) return domain;
  return "dc";
}

function normalizeOperation(op) {
  if (typeof op !== "string") return null;
  return op.toLowerCase().replace(/\s+/g, "_");
}

/* ===========================
   EXTRACTION (FRONTEND)
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

/* ===========================
   MAIN FLOW (FAIL-SAFE)
=========================== */
async function sendMessage() {
  const userText = INPUT.value.trim();
  if (!userText) return;

  addMessage(userText, "user");
  INPUT.value = "";

  try {
    const decision = await callAI(userText);

    if (!decision || typeof decision !== "object") {
      throw new Error("Invalid AI response");
    }

    if (decision.action === "explain") {
      addMessage(decision.content || "Explanation unavailable.", "ai");
      return;
    }

    if (decision.action !== "solve") {
      throw new Error("Unknown action");
    }

    // ✅ DECLARE EVERYTHING FIRST (NO TDZ)
    let domain = normalizeDomain(decision.domain);
    let operation = normalizeOperation(decision.operation);

    if (OPERATION_ALIASES[domain]?.[operation]) {
      operation = OPERATION_ALIASES[domain][operation];
    }

    if (!ROUTES[domain] || !ROUTES[domain][operation]) {
      addMessage("Sorry, I don’t support that operation yet.", "ai");
      return;
    }

    addMessage("Solving using engineering laws…", "ai");

    // DIGITAL / LOGIC / MACHINES (NO EQUATIONS)
    if (domain !== "dc" && domain !== "ac") {
      const solverResult = await callSolver(
        ROUTES[domain][operation],
        {}
      );
      addMessage(formatResult(solverResult), "ai");
      return;
    }

    // DC / AC (EQUATIONS REQUIRED)
    const equations = extractEquations(userText);
    const variables = extractVariables(equations);

    if (!equations.length || !variables.length) {
      addMessage("Please provide valid equations.", "ai");
      return;
    }

    const solverResult = await callSolver(
      ROUTES[domain][operation],
      { equations, variables }
    );

    addMessage(formatResult(solverResult), "ai");

  } catch (err) {
    console.error(err);
    addMessage(
      "I couldn’t process that request. Please rephrase or provide clearer input.",
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
  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

/* ===========================
   FORMAT RESULT (HUMAN)
=========================== */
function formatResult(result) {
  if (result?.solution) {
    let out = "✅ Solution:\n\n";
    for (const [k, v] of Object.entries(result.solution)) {
      out += `${k} = ${Number(v).toFixed(4)}\n`;
    }
    return out;
  }
  return JSON.stringify(result, null, 2);
}
