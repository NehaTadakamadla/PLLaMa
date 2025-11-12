export function canUseVoice() {
  return typeof window !== "undefined" && ("speechSynthesis" in window);
}

export function speak(text) {
  if (!canUseVoice()) return;
  const utter = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function listen() {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return reject("Speech recognition not supported");

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      resolve(transcript);
    };

    rec.onerror = (e) => reject(e.error || e);
    rec.onend = () => {};

    rec.start();
  });
}
