const CHAT = document.getElementById("chat");
const INPUT = document.getElementById("userInput");

const AI_PROXY_URL =
  "https://surudmahajan12-electronics-ai-proxy.hf.space/chat";

const ELECTRONICS_BACKEND =
  "https://surudmahajan12-electronics.hf.space";

/* ===========================
   SYSTEM PROMPT (LOCKED)
=========================== */
const SYSTEM_PROMPT = `
You are an Electronics Engineering Assistant.

Rules:
- You NEVER compute final numeric answers yourself.
- If the user asks for numeric results (current, voltage, power, impedance, etc),
  you MUST request a solver call.
- If the question is conceptual, you may explain directly.
- If information is missing, ask a clarification question.
- NEVER fabricate values.

If a solver is required, respond ONLY in JSON:

{
  "action": "solve",
  "domain": "dc",
  "endpoint": "/dc/kcl-kvl",
  "payload": {
    "equations": [],
    "variables": []
  }
}

Otherwise respond ONLY in JSON:

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
    addMessage("Something went wrong. Please try again.", "ai");
    console.error(err);
  }
}

/* ===========================
   AI CALL (DECISION)
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

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
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

  const data = await res.json();
  return data.choices[0].message.content;
}
