// === Import Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === Firebase Config ===
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

// === Helper ===
function safe(t) {
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML;
}

// ============================
// 🔥 REALTIME FEED TANPA KEDIP
// ============================
function loadFeed() {
  const feed = document.getElementById("feed");
  feed.innerHTML = "<p style='text-align:center;color:gray;'>⏳ Memuat...</p>";

  const q = query(collection(db, "curhatan"), orderBy("lastActive", "desc"));

  onSnapshot(q, (snapshot) => {
    // Saat pertama kali load, hapus loading
    if (feed.innerHTML.includes("Memuat")) feed.innerHTML = "";

    snapshot.docChanges().forEach((change) => {
      const d = { id: change.doc.id, ...change.doc.data() };

      if (change.type === "added") {
        // === Buat elemen baru ===
        const card = document.createElement("div");
        card.className = "post";
        card.id = `post-${d.id}`;
        card.innerHTML = `
          <div class="post-header">
            <div class="avatar-emoji">${safe(d.avatar || "🙂")}</div>
            <div class="meta">
              <strong>${safe(d.nama || "Anonim")}</strong> · ${safe(d.kategori || "-")}
            </div>
          </div>

          <div class="post-body">
            <p>${safe(d.isi)}</p>
          </div>

          <div class="actions">
            <button class="like-btn" data-id="${d.id}">❤️ ${d.likes || 0}</button>
            <button disabled class="comment-btn">💬 ${d.comments || 0}</button>
          </div>

          <div class="comments" id="comments-${d.id}"></div>
          <div class="comment-box">
            <textarea class="comment-input" id="input-${d.id}" placeholder="Tulis komentar..."></textarea>
            <button class="comment-send" data-id="${d.id}">Kirim</button>
          </div>
        `;

        feed.appendChild(card);

        listenLikeRealtime(d.id, card);
        listenCommentsRealtime(d.id, card);
        loadLimitedComments(d.id);
      }

      if (change.type === "modified") {
        const card = document.getElementById(`post-${d.id}`);
        if (!card) return;
        // Update likes & comments tanpa re-render seluruh feed
        const likeBtn = card.querySelector(".like-btn");
        const commentBtn = card.querySelector(".comment-btn");
        if (likeBtn) likeBtn.textContent = `❤️ ${d.likes || 0}`;
        if (commentBtn) commentBtn.textContent = `💬 ${d.comments || 0}`;
      }

      if (change.type === "removed") {
        const card = document.getElementById(`post-${d.id}`);
        if (card) card.remove();
      }
    });
  });
}

// ============================
// ❤️ LIKE REALTIME
// ============================
function listenLikeRealtime(id, card) {
  const ref = doc(db, "curhatan", id);
  onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    const likes = snap.data().likes || 0;
    const btn = card.querySelector(".like-btn");
    btn.textContent = `❤️ ${likes}`;

    let liked = JSON.parse(localStorage.getItem("likedPosts") || "[]");
    if (liked.includes(id)) btn.style.color = "red";
  });
}

// ✅ ANTI-SPAM LIKE
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("like-btn")) return;

  const id = e.target.dataset.id;
  const btn = e.target;

  let liked = JSON.parse(localStorage.getItem("likedPosts") || "[]");
  if (liked.includes(id)) return;

  liked.push(id);
  localStorage.setItem("likedPosts", JSON.stringify(liked));

  const old = parseInt(btn.textContent.split(" ")[1]) || 0;
  btn.textContent = `❤️ ${old + 1}`;
  btn.style.color = "red";

  await updateDoc(doc(db, "curhatan", id), {
    likes: increment(1)
    // Tidak update lastActive → Tidak naik feed
  });
});

// ============================
// 💬 COMMENT REALTIME
// ============================
function listenCommentsRealtime(id, card) {
  const ref = doc(db, "curhatan", id);
  onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    const comments = snap.data().comments || 0;
    const btn = card.querySelector(".comment-btn");
    if (btn) btn.textContent = `💬 ${comments}`;
  });
}

function loadLimitedComments(id) {
  const ref = collection(db, `curhatan/${id}/comments`);
  const q = query(ref, orderBy("waktu", "desc"), limit(2));
  const box = document.getElementById(`comments-${id}`);

  onSnapshot(q, (snap) => {
    box.innerHTML = "";
    const arr = [];
    snap.forEach((d) => arr.push(d.data()));
    arr.reverse().forEach((c) => {
      const el = document.createElement("div");
      el.className = "comment-item";
      el.innerHTML = `<strong>${safe(c.nama || "Anonim")}</strong><br>${safe(c.isi)}`;
      box.appendChild(el);
    });

    if (snap.size === 2) {
      const btn = document.createElement("button");
      btn.className = "lihat-semua";
      btn.textContent = "Lihat semua komentar";
      btn.onclick = () => loadAllComments(id);
      box.appendChild(btn);
    }
  });
}

function loadAllComments(id) {
  const ref = collection(db, `curhatan/${id}/comments`);
  const q = query(ref, orderBy("waktu", "asc"));
  const box = document.getElementById(`comments-${id}`);

  onSnapshot(q, (snap) => {
    box.innerHTML = "";
    snap.forEach((d) => {
      const c = d.data();
      const el = document.createElement("div");
      el.className = "comment-item";
      el.innerHTML = `<strong>${safe(c.nama || "Anonim")}</strong><br>${safe(c.isi)}`;
      box.appendChild(el);
    });

    const btn = document.createElement("button");
    btn.className = "lihat-semua";
    btn.textContent = "Tutup komentar";
    btn.onclick = () => loadLimitedComments(id);
    box.appendChild(btn);
  });
}

// ============================
// ✍️ KOMENTAR KIRIM
// ============================
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("comment-send")) return;

  const id = e.target.dataset.id;
  const input = document.getElementById(`input-${id}`);
  const isi = input.value.trim();
  if (!isi) return;

  await addDoc(collection(db, `curhatan/${id}/comments`), {
    isi,
    nama: "Anonim",
    waktu: new Date().toISOString()
  });

  await updateDoc(doc(db, "curhatan", id), {
    comments: increment(1),
    lastActive: new Date().toISOString() // Komentar menaikkan posting
  });

  input.value = "";
});

// 🚀 Start Feed
loadFeed();