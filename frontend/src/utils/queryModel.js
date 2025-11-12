// frontend/src/utils/queryModel.js
export async function queryModel({
  user_query,
  user_id,
  user_location,
  user_name,
  use_web_search = false,
}) {
  try {
    const res = await fetch("http://localhost:5000/api/model/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_query,
        user_id,
        user_location,
        user_name,
        use_web_search,
        lang: localStorage.getItem("preferred_lang") || "auto",
      }),
    });

    if (!res.ok) {
      throw new Error(`Model API returned ${res.status}`);
    }

    const data = await res.json();

    // Standardize return to string output
    if (typeof data.output === "string") {
      return data.output.trim();
    }

    // Fallback for alternate response shapes
    if (typeof data.result === "string") {
      return data.result.trim();
    }

    return JSON.stringify(data);
  } catch (err) {
    console.error("queryModel error:", err);
    return "❌ Failed to get response from PLLaMA model. Please try again.";
  }
}
