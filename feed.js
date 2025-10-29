// === Import Firebase (versi modular) ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === Firebase Config RuangCurhat ===
const firebaseConfig = {
  apiKey: "AIzaSyBIdM2v8g49FQPFckd7vtP_fx0JnXjdxJQ",
  authDomain: "curhat-online-56d74.firebaseapp.com",
  projectId: "curhat-online-56d74",
  storageBucket: "curhat-online-56d74.firebasestorage.app",
  messagingSenderId: "284415050305",
  appId: "1:284415050305:web:5ef67cb1cfb768cc95bcc0",
  measurementId: "G-L9KP05K69F"
};

// === Init Firebase ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === Sanitize teks (hindari XSS) ===
function safe(t) {
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML;
}

// === Load Feed Curhatan ===
async function loadFeed() {
  const feed = document.getElementById("feed");
  feed.innerHTML = "<p style='text-align:center;color:gray;'>⏳ Memuat curhatan...</p>";

  try {
    const q = query(collection(db, "curhatan"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      feed.innerHTML = "<p style='text-align:center;color:gray;'>Belum ada curhatan.</p>";
      return;
    }

    const data = [];
    snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
    data.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));

    feed.innerHTML = "";

    data.forEach((d) => {
      const waktu = d.waktu
        ? new Date(d.waktu).toLocaleString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "short",
          })
        : "";

      const card = document.createElement("div");
      card.className = "post";
      card.innerHTML = `
        <div class="post-header">
          <div class="avatar-emoji">${safe(d.avatar || "🙂")}</div>
          <div class="meta">
            <strong>${safe(d.nama || "Anonim")}</strong> · ${safe(d.kategori || "-")}
          </div>
        </div>
        <div class="post-body">
          <p>${safe(d.isi || "(tanpa isi)")}</p>
        </div>
        <div class="actions">
          <button disabled>❤️ ${d.likes || 0}</button>
          <button disabled>💬 ${d.comments || 0}</button>
          <small style="color:var(--muted);font-size:12px;">${waktu}</small>
        </div>
        <div class="comments" id="comments-${d.id}"></div>
        <div class="comment-box">
          <textarea class="comment-input" id="input-${d.id}" placeholder="Tulis komentar..."></textarea>
          <button class="comment-send" data-id="${d.id}">Kirim</button>
        </div>
      `;
      feed.appendChild(card);

      // tampilkan komentar terbatas
      loadLimitedComments(d.id);
    });
  } catch (e) {
    feed.innerHTML = `<p style='color:red;text-align:center;'>Gagal memuat data: ${e.message}</p>`;
  }
}

// === Load 2 komentar terbaru ===
function loadLimitedComments(id) {
  const ref = collection(db, `curhatan/${id}/comments`);
  const q = query(ref, orderBy("waktu", "desc"), limit(2));
  const box = document.getElementById(`comments-${id}`);
  if (!box) return;

  onSnapshot(q, (snapshot) => {
    box.innerHTML = "";
    const comments = [];
    snapshot.forEach((d) => comments.push(d.data()));
    comments.reverse().forEach((c) => {
      const el = document.createElement("div");
      el.className = "comment-item";
      el.innerHTML = `<strong>${safe(c.nama || "Anonim")}</strong> <span class="time">${new Date(
        c.waktu || Date.now()
      ).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span><br>${safe(c.isi)}`;
      box.appendChild(el);
    });

    if (snapshot.size === 2) {
      const btn = document.createElement("button");
      btn.className = "lihat-semua";
      btn.textContent = "Lihat semua komentar";
      btn.addEventListener("click", () => loadAllComments(id));
      box.appendChild(btn);
    }
  });
}

// === Load semua komentar ===
function loadAllComments(id) {
  const ref = collection(db, `curhatan/${id}/comments`);
  const q = query(ref, orderBy("waktu", "asc"));
  const box = document.getElementById(`comments-${id}`);
  if (!box) return;

  onSnapshot(q, (snapshot) => {
    box.innerHTML = "";
    snapshot.forEach((d) => {
      const c = d.data();
      const el = document.createElement("div");
      el.className = "comment-item";
      el.innerHTML = `<strong>${safe(c.nama || "Anonim")}</strong> <span class="time">${new Date(
        c.waktu || Date.now()
      ).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span><br>${safe(c.isi)}`;
      box.appendChild(el);
    });

    const btn = document.createElement("button");
    btn.className = "lihat-semua";
    btn.textContent = "Tutup komentar";
    btn.addEventListener("click", () => loadLimitedComments(id));
    box.appendChild(btn);
  });
}

// === Kirim komentar ===
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("comment-send")) {
    const id = e.target.dataset.id;
    const input = document.getElementById(`input-${id}`);
    const isi = input.value.trim();
    if (!isi) return;

    try {
      await addDoc(collection(db, `curhatan/${id}/comments`), {
        isi,
        nama: "Anonim",
        waktu: new Date().toISOString(),
      });
      input.value = "";
      Toastify({
        text: "Komentar terkirim!",
        duration: 2000,
        gravity: "bottom",
        position: "center",
        backgroundColor: "#4CAF50",
      }).showToast();
    } catch (err) {
      Toastify({
        text: "Gagal mengirim komentar!",
        duration: 2000,
        gravity: "bottom",
        position: "center",
        backgroundColor: "#E53935",
      }).showToast();
    }
  }
});

// === Jalankan ===
loadFeed();