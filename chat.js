const CHAT = document.getElementById("chat");
const INPUT = document.getElementById("userInput");

/* ===========================
   URLs (CONFIRMED)
=========================== */
const AI_PROXY_URL =
  "https://surudmahajan12-electronics-ai-proxy.hf.space/chat";

const ELECTRONICS_BACKEND =
  "https://surudmahajan12-electronics.hf.space";

/* ===========================
   SYSTEM PROMPT (STRICT)
=========================== */
const SYSTEM_PROMPT = `
You are an Electronics Engineering Assistant.

STRICT RULES (MANDATORY):
- Respond ONLY in valid JSON.
- Do NOT include explanations, greetings, markdown, or extra text.
- Do NOT include '=' in equations.
- Every equation MUST be rearranged to the form: expression = 0
- Send ONLY the LEFT-HAND expression.

Example:
Input: 10*I1 + 5*(I1 - I2) = 20
Output equation: "10*I1 + 5*(I1 - I2) - 20"

If numeric computation is required, respond ONLY as:

{
  "action": "solve",
  "domain": "dc",
  "endpoint": "/dc/kcl-kvl",
  "payload": {
    "equations": [],
    "variables": []
  }
}

If the question is conceptual or missing information, respond ONLY as:

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
   MAIN FLOW
=========================== */
async function sendMessage() {
  const userText = INPUT.value.trim();
  if (!userText) return;

  addMessage(userText, "user");
  INPUT.value = "";

  try {
    const decision = await callAI(userText);

    if (decision.action === "explain") {
      addMessage(decision.content, "ai");
      return;
    }

    if (decision.action === "solve") {
      addMessage("Solving using engineering laws…", "ai");

      const solverResult = await callSolver(
        decision.endpoint,
        decision.payload
      );

      const explanation = await explainResult(
        userText,
        solverResult
      );

      addMessage(explanation, "ai");
      return;
    }

    addMessage("I need more information to proceed.", "ai");

  } catch (err) {
    console.error(err);
    addMessage(
      "I couldn’t process that request. Please rephrase or provide clearer equations.",
      "ai"
    );
  }
}

/* ===========================
   AI CALL (SAFE JSON)
=========================== */
async function callAI(userText) {
  const res = await fetch(AI_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText }
      ],
      temperature: 0
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("AI proxy error: " + text);
  }

  const data = await res.json();

  if (!data.choices || !data.choices.length) {
    throw new Error("Invalid AI response: " + JSON.stringify(data));
  }

  const raw = data.choices[0].message.content;

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("AI did not return JSON: " + raw);
  }

  return JSON.parse(match[0]);
}




/* ===========================
   CALL ELECTRONICS BACKEND
=========================== */
async function callSolver(endpoint, payload) {
  const res = await fetch(ELECTRONICS_BACKEND + endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Solver error: " + text);
  }

  return await res.json();
}


/* ===========================
   AI EXPLANATION (2nd PASS)
=========================== */
async function explainResult(question, result) {
  const res = await fetch(AI_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct",
      messages: [
        {
          role: "system",
          content:
            "Explain the solution step by step in clear engineering language. " +
            "Do NOT change numeric results."
        },
        {
          role: "user",
          content:
            `Question: ${question}\nResult: ${JSON.stringify(result)}`
        }
      ],
      temperature: 0
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("AI explain error: " + text);
  }

  const data = await res.json();

  if (!data.choices || !data.choices.length) {
    throw new Error("Invalid explanation response: " + JSON.stringify(data));
  }

  return data.choices[0].message.content;
}

