// === profil.js ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// === Konfigurasi Firebase RuangCurhat ===
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

// === Fungsi toast ===
function showToast(text, color = "linear-gradient(90deg,#7b5be4,#a78bfa)") {
  Toastify({
    text,
    duration: 3000,
    gravity: "top",
    position: "center",
    style: { background: color, borderRadius: "10px" },
  }).showToast();
}

// === Daftar emoji pilihan ===
const emojis = ["🐨","🦊","🐼","🐸","🐧","🐰","🐻","🐱","🐶","🦁","🐹","🐯","🐮","🐷","🐤","🦄","🐙","🐢","🐥","🐿️"];

const emojiGrid = document.getElementById("emojiGrid");
let selectedEmoji = null;

// tampilkan pilihan emoji
emojis.forEach((em, i) => {
  const div = document.createElement("div");
  div.className = `emoji-item pastel-${(i % 8) + 1}`;
  div.textContent = em;
  div.addEventListener("click", () => {
    document.querySelectorAll(".emoji-item").forEach(e => e.classList.remove("selected"));
    div.classList.add("selected");
    selectedEmoji = em;
  });
  emojiGrid.appendChild(div);
});

// === Fungsi buat profil anonim ===
async function buatProfil(nama, emoji) {
  const id = Date.now().toString(36);
  const profile = { id, nama, emoji };
  localStorage.setItem("profile", JSON.stringify(profile));

  await setDoc(doc(db, "users", id), {
    nama,
    emoji,
    lastActive: new Date().toISOString(),
  });

  return profile;
}

// === Kirim curhatan pending jika ada ===
async function kirimPendingJikaAda(profile) {
  const pending = JSON.parse(sessionStorage.getItem("pendingCurhat") || "null");
  if (!pending) return;

  try {
    const { kategori, isi, waktu } = pending;
    const docRef = await addDoc(collection(db, "curhatan"), {
      nama: profile.nama || "Anonim",
      avatar: profile.emoji || "💬",
      kategori,
      isi,
      likes: 0,
      comments: 0,
      waktu,
      lastActive: new Date().toISOString(),
    });

    // simpan ke curhatanSaya di localStorage
    const saved = JSON.parse(localStorage.getItem("curhatanSaya") || "[]");
    saved.unshift(docRef.id);
    localStorage.setItem("curhatanSaya", JSON.stringify(saved));

    sessionStorage.removeItem("pendingCurhat");
    showToast("Curhatanmu berhasil dikirim 💌");
    setTimeout(() => (window.location.href = "feed.html"), 1500);
  } catch (err) {
    console.error("Gagal kirim curhatan pending:", err);
    showToast("Gagal mengirim curhatan 😢", "#f87171");
  }
}

// === Saat klik tombol Simpan Profil ===
document.getElementById("saveProfile").addEventListener("click", async () => {
  const nama = document.getElementById("namaSamaran").value.trim() || "Anonim";
  const emoji = selectedEmoji || "💬";

  const profile = await buatProfil(nama, emoji);
  showToast("Profil anonim disimpan 🎭");
  await kirimPendingJikaAda(profile);
});

// === Jika user sudah punya profil tapi masih ada curhatan pending ===
const existing = JSON.parse(localStorage.getItem("profile") || "null");
if (existing) kirimPendingJikaAda(existing);