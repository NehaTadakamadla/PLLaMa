// backend/src/lib/modelClient.js
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// ✅ Use environment variable if available, otherwise default to your local FastAPI server
const MODEL_URL = process.env.PLLAMA_MODEL_URL;

/**
 * Sends a query to the PLLaMA model API.
 * Communicates with the FastAPI backend to get an AI-generated reply.
 */
async function modelClient({
  user_query,
  user_id,
  user_location,
  user_name,
  use_web_search,
}) {
  try {
    const res = await fetch(MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_query,
        user_id,
        user_location,
        user_name,
        use_web_search,
      }),
    });

    if (!res.ok) {
      // Log the full status and URL for clarity
      throw new Error(`Model API returned status ${res.status} (${MODEL_URL})`);
    }

    const data = await res.json();

    // ✅ Handle multiple possible response formats
    if (typeof data.answer === "string") return data.answer;
    if (typeof data.response === "string") return data.response;
    if (data.response?.text) return data.response.text;
    if (data.output) return data.output;
    if (typeof data.result === "string") return data.result;
    if (typeof data.message === "string") return data.message;
    if (typeof data.text === "string") return data.text;
    if (data.data && typeof data.data === "string") return data.data;

    // Fallback: return the raw data if no known format matches
    return JSON.stringify(data);
  } catch (err) {
    console.error("❌ modelClient error:", err.message);
    // Throw the error upward so model.js can handle it
    throw err;
  }
}

export default modelClient;
