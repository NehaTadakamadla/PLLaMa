// frontend/src/utils/queryModel.js
export async function queryModel({ user_query, user_id, user_location, user_name, use_web_search=false }) {
  try {
    const res = await fetch("http://localhost:5000/api/model/generate", { // Or your ngrok URL
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_query, user_id, user_location, user_name, use_web_search }),
    });

    if (!res.ok) throw new Error(`Model API returned status ${res.status}`);

    const data = await res.json();

    // Ensure we return string only
    if (typeof data.output === "string") {
      return data.output; 
    } else {
      return JSON.stringify(data.output);
    }
  } catch (err) {
    console.error("queryModel error:", err);
    return "❌ Failed to get response from AI model.";
  }
}
