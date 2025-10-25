// backend/src/lib/modelClient.js
import fetch from "node-fetch";

const MODEL_URL = "https://unmelancholy-kylah-higher.ngrok-free.dev/generate";

async function modelClient(prompt) {
  try {
    const res = await fetch(MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({prompt}),
    });

    if (!res.ok) throw new Error(`Model API returned status ${res.status}`);

    const data = await res.json();

    // Always return string
    if (typeof data.output === "string") {
      return data.output;
    } else if (data.output?.text) {
      return data.output.text;
    } else {
      return JSON.stringify(data.output);
    }
  } catch (err) {
    console.error("modelClient error:", err);
    return "❌ Failed to get response from AI model.";
  }
}

export default modelClient;
