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
   CANONICAL ROUTE MAP
   (SINGLE SOURCE OF TRUTH)
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

/* ===========================
   SYSTEM PROMPT (STRICT)
=========================== */
const SYSTEM_PROMPT = `
You are an Electronics Engineering Assistant.

STRICT RULES:
- Respond ONLY in valid JSON.
- NO explanations, NO markdown, NO extra text.
- NEVER return URLs.
- NEVER return raw math results.
- Only choose domain and operation.

Allowed domains:
dc, ac, machines, digital, logic, combinational

Response format for solving:
{
  "action": "solve",
  "domain": "<domain>",
  "operation": "<operation>",
  "payload": { }
}

Response format for theory:
{
  "action": "explain",
  "content": "<clear explanation>"
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
   MAIN FLOW
=========================== */
function normalizeOperation(op) {
  return op
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
    .trim();
}
function extractVariables(equations) {
  const vars = new Set();

  equations.forEach(eq => {
    const matches = eq.match(/[A-Za-z]+\d*/g);
    if (matches) {
      matches.forEach(v => {
        if (!isNaN(v)) return;
        vars.add(v);
      });
    }
  });

  return Array.from(vars);
}

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

  const { domain, operation } = decision;
  let { payload } = decision;

  const normalizedOperation = normalizeOperation(operation);

  if (!ROUTES[domain] || !ROUTES[domain][normalizedOperation]) {
    throw new Error("Unsupported domain or operation");
  }

  const endpoint = ROUTES[domain][normalizedOperation];

  // 🔒 ENSURE PAYLOAD STRUCTURE
  payload = payload || {};
  payload.equations = payload.equations || [];
  payload.variables =
    payload.variables && payload.variables.length
      ? payload.variables
      : extractVariables(payload.equations);

  if (!payload.equations.length || !payload.variables.length) {
    throw new Error("Incomplete solver payload");
  }

  const solverResult = await callSolver(endpoint, payload);

  const formatted = formatResult(domain, normalizedOperation, solverResult);

  addMessage(formatted, "ai");
  return;
}


    addMessage("I need more information to proceed.", "ai");

  } catch (err) {
    console.error(err);
    addMessage(
      "I couldn’t process that request. Please rephrase or provide clearer information.",
      "ai"
    );
  }
}

/* ===========================
   AI DECISION CALL
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

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();
  const raw = data.choices[0].message.content;

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Invalid AI JSON");
  }

  return JSON.parse(match[0]);
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

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return await res.json();
}

/* ===========================
   RESULT FORMATTER
=========================== */
function formatResult(domain, operation, result) {
  if (domain === "dc" && result.solution) {
    let text = "The circuit was analyzed using DC network laws.\n\n";
    text += "Calculated results:\n";

    for (const [k, v] of Object.entries(result.solution)) {
      text += `• ${k} = ${Number(v).toFixed(4)}\n`;
    }

    return text;
  }

  if (domain === "ac") {
    return "AC circuit analysis result:\n\n" +
           JSON.stringify(result, null, 2);
  }

  if (domain === "digital") {
    return "Digital logic result:\n\n" +
           JSON.stringify(result, null, 2);
  }

  if (domain === "machines") {
    return "Electrical machine analysis:\n\n" +
           JSON.stringify(result, null, 2);
  }

  if (domain === "logic") {
    return "Logic gate analysis:\n\n" +
           JSON.stringify(result, null, 2);
  }

  if (domain === "combinational") {
    return "Combinational circuit result:\n\n" +
           JSON.stringify(result, null, 2);
  }

  return "Result:\n\n" + JSON.stringify(result, null, 2);
}

