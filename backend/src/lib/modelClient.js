// backend/src/lib/modelClient.js
import fetch from "node-fetch";

const MODEL_URL = "https://noneconomically-nontenantable-leanna.ngrok-free.dev/generate";

async function modelClient(prompt) {
  try {
    const res = await fetch(MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({prompt}),
    });

    if (!res.ok) throw new Error(`Model API returned status ${res.status}`);

    const data = await res.json();

    if (typeof data.response === "string") {
      return data.response;
    } else if (data.response?.text) {
      return data.response.text;
    } else {
      return JSON.stringify(data.response);
    }
  } catch (err) {
    console.error("modelClient error:", err);
    return "❌ Failed to get response from AI model.";
  }
}

export default modelClient;



