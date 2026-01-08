const AI_PROXY = "https://surudmahajan12-aiproxy.hf.space";
const BACKEND = "https://surudmahajan12-electronics.hf.space";

export async function sendMessage() {
  const input = document.getElementById("userInput").value.trim();
  const out = document.getElementById("output");
  const status = document.getElementById("status");

  if (!input) return;

  status.textContent = "Thinking…";
  out.textContent = "";

  const intent = await fetch(`${AI_PROXY}/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: input })
  }).then(r => r.json());

  /* -------- MODE: EXPLAIN CONCEPT -------- */
  if (intent.mode === "explain_concept") {
    const explanation = await fetch(`${AI_PROXY}/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    }).then(r => r.json());

    status.textContent = "Explanation";
    out.textContent = explanation.explanation;
    return;
  }

  /* -------- MODE: CALCULATE -------- */
  if (intent.mode === "calculate") {
    let payload = null;

    if (intent.method === "POST") {
      payload = JSON.parse(prompt("Enter input JSON"));
    }

    const result = await fetch(
      BACKEND + intent.endpoint,
      {
        method: intent.method,
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : null
      }
    ).then(r => r.json());

    /* -------- MODE: EXPLAIN RESULT -------- */
    if (intent.mode === "calculate" && input.toLowerCase().includes("explain")) {
      const explanation = await fetch(`${AI_PROXY}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          backend_result: result
        })
      }).then(r => r.json());

      status.textContent = "Result + Explanation";
      out.textContent =
        JSON.stringify(result, null, 2) + "\n\n" + explanation.explanation;
      return;
    }

    status.textContent = "Result";
    out.textContent = JSON.stringify(result, null, 2);
  }
}


