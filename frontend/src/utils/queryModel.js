export async function queryModel({ prompt, lang = "auto" }) {
  try {
    const res = await fetch("http://localhost:5000/api/model/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, lang }),
    });

    if (!res.ok) throw new Error(`Model API returned ${res.status}`);

    const data = await res.json();
    // backend returns { output: "<translated reply>", lang: "<hi|te|en>" }
    return data;
  } catch (err) {
    console.error("queryModel error:", err);
    return { output: "❌ मॉडल से उत्तर प्राप्त करने में असफल।", lang: lang };
  }
}
