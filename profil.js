// profil.js (robust version)
// Import modular Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase config (RuangCurhat)
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

// fallback toast
function toast(text, opts = {}) {
  try {
    // Toastify global is loaded via CDN in profil.html
    Toastify({
      text,
      duration: opts.duration ?? 3000,
      gravity: opts.gravity ?? "top",
      position: opts.position ?? "center",
      style: opts.style ?? { background: "linear-gradient(90deg,#7b5be4,#a78bfa)", borderRadius: "10px" }
    }).showToast();
  } catch (e) {
    // fallback simple alert if Toastify missing
    console.log("Toast:", text);
    if (opts.fallbackAlert !== false) alert(text);
  }
}

// helper safe text
function safeText(t) {
  return typeof t === "string" ? t : "";
}

// wrap everything after DOM ready
document.addEventListener("DOMContentLoaded", () => {
  try {
    const emojis = ["🌻","🧸","☁️","🦋","💫","🍃","💖","🌷","🌈","🐚","🫶","🌼","🪷","🐰","🕊️","⭐","🐨","🍀"];
    const grid = document.getElementById("emojiGrid");
    const inputNama = document.getElementById("namaSamaran");
    const saveBtn = document.getElementById("saveProfile");

    if (!grid || !inputNama || !saveBtn) {
      console.error("Profil: elemen DOM tidak lengkap (emojiGrid / namaSamaran / saveProfile).");
      toast("Terjadi kesalahan: elemen profil tidak ditemukan.", { fallbackAlert: true });
      return;
    }

    let selectedEmoji = null;

    // build emoji grid (idempotent: clear first)
    grid.innerHTML = "";
    emojis.forEach((emoji, i) => {
      const div = document.createElement("div");
      div.className = `emoji-item pastel-${(i % 8) + 1}`;
      div.textContent = emoji;
      div.tabIndex = 0;
      div.addEventListener("click", () => {
        document.querySelectorAll(".emoji-item").forEach(e => e.classList.remove("selected"));
        div.classList.add("selected");
        selectedEmoji = emoji;
      });
      div.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          div.click();
        }
      });
      grid.appendChild(div);
    });

    // Load saved profile if exists
    try {
      const savedProfile = JSON.parse(localStorage.getItem("profile") || "null");
      if (savedProfile) {
        inputNama.value = savedProfile.nama || "";
        selectedEmoji = savedProfile.emoji || null;
        if (selectedEmoji) {
          const found = [...document.querySelectorAll(".emoji-item")].find(e => e.textContent === selectedEmoji);
          if (found) found.classList.add("selected");
        }
      }
    } catch (e) {
      console.warn("Gagal baca localStorage profile:", e);
    }

    // Robust click handler
    saveBtn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      try {
        if (!selectedEmoji) {
          toast("Pilih emoji avatar dulu ya 🌸", { style: { background: "linear-gradient(90deg,#f9a8d4,#fbcfe8)" } });
          return;
        }

        const namaRaw = inputNama.value || "";
        const nama = namaRaw.trim() || "Anonim";
        const anonId = "anon-" + Math.random().toString(36).substring(2, 10);
        const profile = { id: anonId, nama, emoji: selectedEmoji };
        // save locally
        localStorage.setItem("profile", JSON.stringify(profile));

        // optional: save user doc in 'users' collection (helps other features)
        try {
          await setDoc(doc(db, "users", anonId), {
            id: anonId,
            nama,
            emoji: selectedEmoji,
            lastActive: new Date().toISOString()
          });
        } catch (e) {
          console.warn("Gagal simpan users doc:", e);
          // non-fatal
        }

        toast("Profil anonim disimpan 🎭");

        // check pending curhat
        const pending = JSON.parse(sessionStorage.getItem("pendingCurhat") || "null");
        if (pending) {
          try {
            const docRef = await addDoc(collection(db, "curhatan"), {
              nama: nama,
              kategori: pending.kategori,
              isi: pending.isi,
              avatar: selectedEmoji,
              likes: 0,
              comments: 0,
              waktu: pending.waktu,
              lastActive: new Date().toISOString()
            });

            // save doc id to curhatanSaya
            const saved = JSON.parse(localStorage.getItem("curhatanSaya") || "[]");
            saved.unshift(docRef.id);
            localStorage.setItem("curhatanSaya", JSON.stringify(saved));

            sessionStorage.removeItem("pendingCurhat");
            toast("Curhatanmu berhasil dikirim 💌");
            setTimeout(() => (window.location.href = "feed.html"), 900);
            return;
          } catch (err) {
            console.error("Gagal kirim curhat tertunda:", err);
            toast("Profil tersimpan, tapi curhatan belum terkirim 😢", { style: { background: "#f87171" } });
            setTimeout(() => (window.location.href = "feed.html"), 900);
            return;
          }
        }

        // no pending => go back to index
        setTimeout(() => (window.location.href = "index.html"), 700);
      } catch (err) {
        console.error("Error saat klik simpan profil:", err);
        toast("Terjadi kesalahan internal. Coba lagi.", { style: { background: "#f87171" } });
      }
    });

    // Expose for debug (optional)
    window.__profil_debug_ready = true;
  } catch (outerErr) {
    console.error("Profil init error:", outerErr);
    alert("Terjadi kesalahan saat memuat profil. Cek console.");
  }
});