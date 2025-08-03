// ✅ APIエンドポイントを入力（あなたのURLに置き換えてください）
const emotionApiUrl = "https://m9n5uqrgil.execute-api.ap-northeast-1.amazonaws.com/dev/emotion";
const historyApiUrl = "https://lw4077g1f9.execute-api.ap-northeast-1.amazonaws.com/dev/history";

// 🔐 ログイン
function login() {
  const name = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  if (!userData[name]) {
    document.getElementById("message").textContent = "ユーザが存在しません。登録してください。";
    return;
  }
  if (userData[name] !== pass) {
    document.getElementById("message").textContent = "パスワードが間違っています。";
    return;
  }

  localStorage.setItem("user", name);
  window.location.href = "main.html";
}

// 🆕 新規登録
function register() {
  const name = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  if (!name || !pass) {
    document.getElementById("message").textContent = "名前とパスワードを入力してください。";
    return;
  }

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  if (userData[name]) {
    document.getElementById("message").textContent = "その名前は既に使われています。";
    return;
  }

  userData[name] = pass;
  localStorage.setItem("userData", JSON.stringify(userData));
  document.getElementById("message").textContent = "登録完了。ログインしてください。";
}

// 😊 感情送信
function sendEmotion(emotion) {
  const user = localStorage.getItem("user");
  if (!user) {
    alert("ログインしてください");
    window.location.href = "index.html";
    return;
  }

  fetch(emotionApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: user, emotion: emotion })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("result").textContent = data.message || "送信完了";
    loadHistory(); // 送信後に履歴更新
  })
  .catch(err => {
    document.getElementById("result").textContent = "送信エラー：" + err;
  });
}

// 📜 履歴表示
function loadHistory() {
  const user = localStorage.getItem("user");
  fetch(`${historyApiUrl}?user=${encodeURIComponent(user)}`)
    .then(res => res.json())
    .then(data => {
      const ul = document.getElementById("historyList");
      ul.innerHTML = "";
      data.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.timestamp} - ${item.emotion}`;
        ul.appendChild(li);
      });
    })
    .catch(err => {
      console.error("履歴取得失敗", err);
    });
}

// 👋 ログアウト
function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

// ✅ 初期表示（main.html）
window.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("user");
  const welcome = document.getElementById("welcome");
  if (user && welcome) {
    welcome.textContent = `${user}さん、こんにちは！`;
    loadHistory();
  }
});
