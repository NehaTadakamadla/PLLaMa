// backend/src/lib/modelClient.js
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const MODEL_URL = `${process.env.PLLAMA_MODEL_URL}/query`;

async function modelClient({ user_query, user_id, user_location, user_name, use_web_search }) {
  try {
    const res = await fetch(MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_query, user_id, user_location, user_name, use_web_search}),
    });

    if (!res.ok) throw new Error(`Model API returned status ${res.status}`);

    const data = await res.json();

    // Always return string
    if (typeof data.answer === "string") {
      return data.answer;
    } else {
      return JSON.stringify(data.answer);
    }

  } catch (err) {
    console.error("modelClient error:", err);
    return "❌ Failed to get response from AI model.";
  }
}

export default modelClient;

