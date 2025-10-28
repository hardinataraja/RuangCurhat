// ===== script.js (Flow baru: tulis dulu, buat profil belakangan) =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc
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

const form = document.getElementById("formCurhatForm");

function showToast(text, color = "linear-gradient(90deg, #7b5be4, #a78bfa)") {
  Toastify({
    text,
    duration: 3000,
    gravity: "top",
    position: "center",
    style: { background: color, borderRadius: "10px" },
  }).showToast();
}

// === UPDATE STATUS ONLINE ===
async function updateLastActive() {
  const profile = JSON.parse(localStorage.getItem("profile") || "{}");
  if (!profile?.id) return;

  try {
    await setDoc(doc(db, "users", profile.id), {
      nama: profile.nama || "Anonim",
      emoji: profile.emoji || "💬",
      lastActive: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Gagal update status online:", err);
  }
}

// Jalankan setiap kali halaman dibuka (jika profil ada)
if (localStorage.getItem("profile")) updateLastActive();

setInterval(() => {
  if (localStorage.getItem("profile")) updateLastActive();
}, 120000);

// === HANDLE FORM CURHAT ===
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const kategori = document.getElementById("kategori").value;
  const isi = document.getElementById("isi").value.trim();
  const profile = JSON.parse(localStorage.getItem("profile") || "null");

  if (!kategori || !isi) {
    showToast("Isi kategori dan curhatanmu dulu ya 🙂", "#f87171");
    return;
  }

  // Jika user belum punya profil → simpan curhatan ke sessionStorage & redirect ke profil
  if (!profile) {
    const pending = { kategori, isi, waktu: new Date().toISOString() };
    sessionStorage.setItem("pendingCurhat", JSON.stringify(pending));
    showToast("Kita buat profil anonim dulu ya 💬");
    setTimeout(() => (window.location.href = "profil.html"), 1200);
    return;
  }

  // Kalau profil sudah ada → kirim langsung ke Firestore
  try {
    const nama = profile.nama?.trim() || "Anonim";
    const avatar = profile.emoji || "💬";

    const docRef = await addDoc(collection(db, "curhatan"), {
      nama,
      kategori,
      isi,
      avatar,
      likes: 0,
      comments: 0,
      waktu: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });

    // simpan ID ke curhatanSaya
    const saved = JSON.parse(localStorage.getItem("curhatanSaya") || "[]");
    saved.unshift(docRef.id);
    localStorage.setItem("curhatanSaya", JSON.stringify(saved));

    form.reset();
    showToast("Curhatanmu terkirim ❤️");
  } catch (err) {
    console.error("Gagal kirim curhat:", err);
    showToast("Terjadi kesalahan saat mengirim 😢", "#f87171");
  }
});