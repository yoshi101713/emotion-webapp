const emotionApiUrl = "https://m9n5uqrgil.execute-api.ap-northeast-1.amazonaws.com/dev/emotion";
const historyApiUrl = "https://lw4077g1f9.execute-api.ap-northeast-1.amazonaws.com/dev/history";

const colorMap = {
  "喜び": "#f39c12",
  "怒り": "#e74c3c",
  "悲しみ": "#3498db",
  "恐れ": "#9b59b6",
  "驚き": "#1abc9c",
  "疲労": "#7f8c8d",
  "リラックス": "#2ecc71"
};

const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土'];

// ---------- ページロード時 ----------
window.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("user");

  // ログイン確認
  if (!user) {
    alert("ログインしてください");
    window.location.href = "index.html";
    return;
  }

  // main.html にユーザー名表示
  const welcome = document.getElementById("welcome");
  if (welcome) welcome.textContent = `${user}さん、こんにちは！`;

  // historyページなら履歴表示
  const view = document.getElementById("viewSelect");
  const chartCanvas = document.getElementById("emotionChart");
  if (view && chartCanvas) {
    setupHistoryPage(user);
  }
});

// ---------- 感情送信 ----------
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
  if (!user || !selectedEmotion) {
    document.getElementById("result").textContent = "感情を選んでください";
    return;
  }

  fetch(emotionApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: user, emotion: selectedEmotion })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("result").textContent = data.message || "送信完了";
  })
  .catch(err => {
    document.getElementById("result").textContent = "送信エラー：" + err;
  });
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

// ---------- 履歴・グラフ ----------
function setupHistoryPage(user) {
  let allData = [];

  fetch(`${historyApiUrl}?user=${encodeURIComponent(user)}`)
    .then(res => res.json())
    .then(data => {
      allData = data;
      renderHistory(allData);
      document.getElementById("viewSelect")
        .addEventListener("change", () => renderHistory(allData));
    });

  function renderHistory(data) {
    const mode = document.getElementById("viewSelect").value;
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    const grouped = {};
    data.forEach(item => {
      const date = new Date(item.timestamp);
      const key = mode === "date"
        ? date.toISOString().slice(0,10)
        : weekdayLabels[date.getDay()];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ time: date.toTimeString().slice(0,8), emotion: item.emotion });
    });

    Object.keys(grouped).sort().forEach(key => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${key}</strong><ul>` +
        grouped[key].map(d => `<li>${d.time} - ${d.emotion}</li>`).join('') +
        '</ul>';
      list.appendChild(li);
    });

    drawChart(grouped, mode);
  }

  let chart;
  function drawChart(grouped, mode) {
    const ctx = document.getElementById('emotionChart').getContext('2d');
    const emotions = Object.keys(colorMap);
    const labels = Object.keys(grouped).sort();
    const datasets = emotions.map(emotion => ({
      label: emotion,
      backgroundColor: colorMap[emotion],
      data: labels.map(label =>
        grouped[label].filter(e => e.emotion.includes(emotion)).length)
    }));

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'bar',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: mode === 'date' ? '日別感情分布' : '曜日別感情分布'
          }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: '件数' } },
          x: { title: { display: true, text: mode === 'date' ? '日付' : '曜日' } }
        }
      }
    });
  }
}
