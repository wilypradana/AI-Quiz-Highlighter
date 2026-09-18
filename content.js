(async function () {
  console.log("🚀 AI Quiz Helper (Extension Mode): Aktif tanpa tombol layar.");

  const OPENROUTER_API_KEY = "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";
  const MODEL = "inclusionai/ling-3.0-flash-fin:free"; 

  let isEnabled = false;
  let isProcessing = false;
  let lastQuestion = "";

  // --- Menerima Perintah dari Popup Extension ---
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "START") {
      isEnabled = true;
      console.log("✅ AI DISURUH JALAN (ON)");
      startAI();
    } else if (request.action === "STOP") {
      isEnabled = false;
      console.log("🛑 AI DISURUH BERHENTI (OFF)");
      stopAI();
    }
  });

  async function processQuiz() {
    if (!isEnabled || isProcessing) return;

    const questionEl = document.querySelector(".ck-content");
    const optionEls = document.querySelectorAll(".MuiFormControlLabel-root");

    if (!questionEl || optionEls.length === 0) return;

    const question = questionEl.innerText.trim();
    if (question === lastQuestion || question === "") return;

    isProcessing = true;
    lastQuestion = question;

    console.log("📝 Menganalisis soal baru...");

    const options = Array.from(optionEls).map((el, i) => {
      const label = el.querySelector(".MuiFormControlLabel-label") || el;
      return {
        label: String.fromCharCode(65 + i),
        text: (label.innerText || "").replace(/^[A-E]\.\s*/i, "").trim(),
        element: el,
        input: el.querySelector("input")
      };
    });

    const prompt = `Soal: ${question}\n\nPilihan:\n${options.map(o => `${o.label}. ${o.text}`).join("\n")}`;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + OPENROUTER_API_KEY.trim()
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: "Jawab HANYA 1 huruf: A, B, C, D, atau E." },
            { role: "user", content: prompt }
          ],
          max_tokens: 5, 
          temperature: 0
        }),
      });

      const data = await res.json();
      const rawText = data?.choices?.[0]?.message?.content || "";
      const match = rawText.match(/[A-E]/i);
      const aiAnswer = match ? match[0].toUpperCase() : null;

      if (aiAnswer) {
        const index = {A:0, B:1, C:2, D:3, E:4}[aiAnswer];
        const selected = options[index];

        if (selected) {
          // Bersihkan highlight lama
          optionEls.forEach(el => { el.style.background = ""; el.style.border = ""; });
          
          // Tandai jawaban
          selected.element.style.background = "#d4edda";
          selected.element.style.border = "2px solid #28a745";
          selected.element.style.borderRadius = "8px";
          
          // Klik jawaban
          if (selected.input) {
            selected.input.click();
            selected.input.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            selected.element.click();
          }
          console.log("✅ Berhasil pilih:", aiAnswer);
        }
      }
    } catch (err) {
      console.error("❌ Gagal proses:", err.message);
      lastQuestion = ""; 
    } finally {
      isProcessing = false;
    }
  }

  const observer = new MutationObserver(() => {
    if (isEnabled && !isProcessing) processQuiz();
  });

  function startAI() {
    observer.observe(document.body, { childList: true, subtree: true });
    processQuiz(); 
  }

  function stopAI() {
    observer.disconnect(); 
    isProcessing = false;
    lastQuestion = "";
    // Hapus highlight saat dimatikan (opsional)
    document.querySelectorAll(".MuiFormControlLabel-root").forEach(el => {
      el.style.background = ""; el.style.border = "";
    });
  }
})();


chrome.storage.local.get(['active'], (res) => {
  if (res.active) {
    isEnabled = true;
    startAI();
  }
});
