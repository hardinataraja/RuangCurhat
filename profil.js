// ===== profil.js (Menyimpan profil & kirim curhatan tertunda) =====
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIdM2v8g49FQPFckd7vtP_fx0JnXjdxJQ",
  authDomain: "curhat-online-56d74.firebaseapp.com",
  projectId: "curhat-online-56d74",
  storageBucket: "curhat-online-56d74.firebasestorage.app",
  messagingSenderId: "284415050305",
  appId: "1:284415050305:web:5ef67cb1cfb768cc95bcc0",
  measurementId: "G-L9KP05K69F"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const emojis = ["🌻","🧸","☁️","🦋","💫","🍃","💖","🌷","🌈","🐚","🫶","🌼","🪷","🐰","🕊️","⭐","🐨","🍀"];
const grid = document.getElementById("emojiGrid");
const inputNama = document.getElementById("namaSamaran");
const saveBtn = document.getElementById("saveProfile");
let selectedEmoji = null;

// Generate grid emoji pastel
emojis.forEach((emoji, i) => {
  const div = document.createElement("div");
  div.className = `emoji-item pastel-${(i % 8) + 1}`;
  div.textContent = emoji;
  div.addEventListener("click", () => {
    document.querySelectorAll(".emoji-item").forEach(e => e.classList.remove("selected"));
    div.classList.add("selected");
    selectedEmoji = emoji;
  });
  grid.appendChild(div);
});

// Jika sudah ada profil tersimpan
const savedProfile = JSON.parse(localStorage.getItem("profile") || "null");
if (savedProfile) {
  inputNama.value = savedProfile.nama || "";
  selectedEmoji = savedProfile.emoji || null;
  if (selectedEmoji) {
    const found = [...document.querySelectorAll(".emoji-item")].find(e => e.textContent === selectedEmoji);
    if (found) found.classList.add("selected");
  }
}

// Simpan profil baru
saveBtn.addEventListener("click", async () => {
  const nama = inputNama.value.trim();
  if (!selectedEmoji) {
    Toastify({
      text: "Pilih emoji avatar dulu ya 🌸",
      duration: 2500,
      gravity: "top",
      position: "center",
      style: { background: "linear-gradient(90deg,#f9a8d4,#fbcfe8)" },
    }).showToast();
    return;
  }

  const anonId = "anon-" + Math.random().toString(36).substring(2, 10);
  const profile = { id: anonId, nama, emoji: selectedEmoji };
  localStorage.setItem("profile", JSON.stringify(profile));

  Toastify({
    text: "Profil anonim disimpan 💖",
    duration: 2000,
    gravity: "top",
    position: "center",
    style: { background: "linear-gradient(90deg,#7b5be4,#a78bfa)" },
  }).showToast();

  // === CEK APAKAH ADA CURHATAN TERTUNDA ===
  const pending = JSON.parse(sessionStorage.getItem("pendingCurhat") || "null");
  if (pending) {
    try {
      await addDoc(collection(db, "curhatan"), {
        nama: nama || "Anonim",
        kategori: pending.kategori,
        isi: pending.isi,
        avatar: selectedEmoji,
        likes: 0,
        comments: 0,
        waktu: pending.waktu,
        lastActive: new Date().toISOString(),
      });

      // simpan juga ke curhatanSaya
      const saved = JSON.parse(localStorage.getItem("curhatanSaya") || "[]");
      saved.unshift(pending.isi.slice(0, 20)); // hanya untuk referensi sederhana
      localStorage.setItem("curhatanSaya", JSON.stringify(saved));

      sessionStorage.removeItem("pendingCurhat");
      Toastify({
        text: "Curhatanmu berhasil dikirim 💌",
        duration: 2500,
        gravity: "top",
        position: "center",
        style: { background: "linear-gradient(90deg,#7b5be4,#a78bfa)" },
      }).showToast();

      setTimeout(() => (window.location.href = "feed.html"), 1200);
    } catch (err) {
      console.error("Gagal kirim curhat tertunda:", err);
      Toastify({
        text: "Profil tersimpan, tapi curhatan belum terkirim 😢",
        duration: 2500,
        gravity: "top",
        position: "center",
        style: { background: "#f87171" },
      }).showToast();
      setTimeout(() => (window.location.href = "feed.html"), 1500);
    }
  } else {
    setTimeout(() => (window.location.href = "index.html"), 1000);
  }
});