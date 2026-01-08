const AI_PROXY_URL =
  "https://surudmahajan12-aiproxy.hf.space/classify";

const BACKEND_BASE_URL =
  "https://surudmahajan12-electronics.hf.space";

export async function sendMessage() {
  const input = document.getElementById("userInput").value.trim();
  const output = document.getElementById("output");
  const status = document.getElementById("status");

  output.textContent = "";
  status.textContent = "";

  if (!input) {
    status.textContent = "Please enter a query.";
    return;
  }

  status.textContent = "Classifying intent…";

  let intent;
  try {
    const res = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });
    intent = await res.json();
  } catch {
    status.textContent = "AI proxy not reachable.";
    return;
  }

  if (intent.error) {
    status.textContent = "AI classification failed.";
    output.textContent = JSON.stringify(intent, null, 2);
    return;
  }

  status.textContent =
    `Detected: ${intent.domain} → ${intent.operation}`;

  try {
    let result;

    if (intent.method === "GET") {
      const res = await fetch(
        BACKEND_BASE_URL + intent.endpoint
      );
      result = await res.json();
    } else {
      const payloadText = prompt(
        `Enter JSON payload for ${intent.endpoint}`
      );

      if (!payloadText) {
        status.textContent = "Cancelled.";
        return;
      }

      const payload = JSON.parse(payloadText);

      const res = await fetch(
        BACKEND_BASE_URL + intent.endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      result = await res.json();
    }

    status.textContent = "Completed.";
    output.textContent = JSON.stringify(result, null, 2);

  } catch (err) {
    status.textContent = "Backend call failed.";
  }
}

