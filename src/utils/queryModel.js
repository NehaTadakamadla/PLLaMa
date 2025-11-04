/// frontend/src/utils/queryModel.js
export async function queryModel({ prompt }) {
  try {
    const res = await fetch("http://localhost:5000/api/model/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    return data.output || "No response from model.";
  } catch (err) {
    console.error("queryModel error:", err);
    return "Error contacting the model API.";
  }
}
