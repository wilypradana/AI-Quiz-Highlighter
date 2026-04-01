const btn = document.getElementById('toggleBtn');

// Cek status terakhir saat popup dibuka
chrome.storage.local.get(['active'], (res) => {
  updateUI(res.active);
});

btn.onclick = () => {
  chrome.storage.local.get(['active'], (res) => {
    const newState = !res.active;
    chrome.storage.local.set({ active: newState });
    updateUI(newState);
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: newState ? "START" : "STOP" });
      }
    });
  });
};

function updateUI(active) {
  if (active) {
    btn.innerText = "AI: ON";
    btn.className = "btn-on";
  } else {
    btn.innerText = "AI: OFF";
    btn.className = "btn-off";
  }
}