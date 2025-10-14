// APIエンドポイント
const emotionApiUrl = "https://m9n5uqrgil.execute-api.ap-northeast-1.amazonaws.com/dev/emotion";
const historyApiUrl = "https://lw4077g1f9.execute-api.ap-northeast-1.amazonaws.com/dev/history";

// グラフ用カラー（最新版）
const colorMap = {
  "喜び": "#F7D65C",
  "怒り": "#FF6B6B",
  "悲しみ": "#4DA3FF",
  "恐れ": "#7E6BFF",
  "驚き": "#F5A623",
  "疲労": "#BFC5CC",
  "リラックス": "#7EDFB3"
};
const weekdayLabels = ['日','月','火','水','木','金','土'];

// --------------- ログイン ---------------
function login() {
  const name = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  const message = document.getElementById("message");
  if (!userData[name]) { message.textContent = "ユーザが存在しません。新規登録してください。"; return; }
  if (userData[name] !== pass) { message.textContent = "パスワードが間違っています。"; return; }

  localStorage.setItem("user", name);
  window.location.href = "main.html";
}

// ログインページ用：フラッシュメッセージ表示
window.addEventListener("DOMContentLoaded", () => {
  const message = document.getElementById("message");
  const flash = localStorage.getItem("flash");
  if (message && flash) {
    message.style.color = "#2ecc71";
    message.textContent = flash;
    localStorage.removeItem("flash");
  }

  // main/history の初期化
  const user = localStorage.getItem("user");
  const welcome = document.getElementById("welcome");
  if (welcome && user) welcome.textContent = `${user}さん、こんにちは！`;

  const view = document.getElementById("viewSelect");
  const chartCanvas = document.getElementById("emotionChart");
  if (view && chartCanvas) setupHistoryPage(user);
});

// --------------- メイン（送信） ---------------
let selectedEmotion = "";
let lastEmotionBtn = null;

function selectEmotion(btn, emotion) {
  if (lastEmotionBtn) lastEmotionBtn.classList.remove("selected");
  selectedEmotion = emotion;
  btn.classList.add("selected");
  lastEmotionBtn = btn;
}

function send() {
  const user = localStorage.getItem("user");
  if (!user) { alert("ログインしてください"); location.href = "index.html"; return; }
  if (!selectedEmotion) { document.getElementById("result").textContent = "感情を選んでください"; return; }

  fetch(emotionApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, emotion: selectedEmotion })
  })
  .then(res => res.json())
  .then(data => { document.getElementById("result").textContent = data.message || "送信完了"; })
  .catch(err => { document.getElementById("result").textContent = "送信エラー：" + err; });
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

// --------------- 履歴 ---------------
function setupHistoryPage(user) {
  if (!user) return;
  fetch(`${historyApiUrl}?user=${encodeURIComponent(user)}`)
    .then(res => res.json())
    .then(data => { renderHistory(data || []); document.getElementById("viewSelect").addEventListener("change", () => renderHistory(data || [])); })
    .catch(() => { const ul = document.getElementById("historyList"); if (ul) ul.innerHTML = "<li>履歴の取得に失敗しました</li>"; });

  function renderHistory(allData) {
    const mode = document.getElementById("viewSelect").value;
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    const grouped = {};
    allData.forEach(item => {
      const d = new Date(item.timestamp);
      const key = mode === "date" ? d.toISOString().slice(0,10) : weekdayLabels[d.getDay()];
      (grouped[key] ||= []).push({ time: d.toTimeString().slice(0,5), emotion: item.emotion });
    });

    Object.keys(grouped).sort().forEach(k => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${k}</strong><ul>` + grouped[k].map(v => `<li>${v.time} - ${v.emotion}</li>`).join("") + "</ul>";
      list.appendChild(li);
    });

    drawChart(grouped, mode);
  }

  let chart;
  function drawChart(grouped, mode) {
    const ctx = document.getElementById("emotionChart").getContext("2d");
    const emotions = Object.keys(colorMap);
    const labels = Object.keys(grouped).sort();
    const datasets = emotions.map(emotion => ({
      label: emotion,
      backgroundColor: colorMap[emotion],
      data: labels.map(label => grouped[label].filter(e => e.emotion.includes(emotion)).length)
    }));

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: mode === "date" ? "日別感情分布" : "曜日別感情分布" } },
        scales: { y: { beginAtZero: true, title: { display: true, text: "件数" } }, x: { title: { display: true, text: mode === "date" ? "日付" : "曜日" } } }
      }
    });
  }
}
