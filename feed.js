import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  increment,
  addDoc,
  limit
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

const feed = document.getElementById("feed");

function showToast(text, color = "linear-gradient(90deg,#7b5be4,#a78bfa)") {
  Toastify({ text, duration: 3000, gravity: "top", position: "center",
    style:{background:color,borderRadius:"10px"} }).showToast();
}
function getStatusBadge(lastActive) {
  if (!lastActive) return "";
  const diff = Date.now() - new Date(lastActive).getTime();
  const minutes = diff / 60000;
  if (minutes < 5) return `<span class="status-badge online" title="Aktif sekarang"></span>`;
  if (minutes < 60) return `<span class="status-badge recent" title="Aktif baru-baru ini"></span>`;
  return "";
}
function sanitize(str) {
  return str.replace(/[&<>\"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
}
function iconByCategory(cat){
  switch(cat){
    case"​Cinta":return"💔";
    case"​Keluarga":return"👪";
    case"​Pekerjaan":return"💼";
    case"​Sekolah":return"🎓";
    default:return"💬";
  }
}

// === FEED REALTIME ===
function loadFeed(){
  const q=query(collection(db,"curhatan"),orderBy("waktu","desc"));
  onSnapshot(q,(snapshot)=>{
    feed.innerHTML="";
    snapshot.forEach(docSnap=>renderPost(docSnap.id,docSnap.data()));
  });
}

function renderPost(id,data){
  const waktu=new Date(data.waktu).toLocaleString("id-ID",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short"});
  const post=document.createElement("div");
  post.className="post";
  post.innerHTML = `
  <div class="post-header">
    <div class="avatar-emoji">${sanitize(data.avatar || "💬")}</div>
    <div class="meta">
      <strong>${sanitize(data.nama || "Anonim")}</strong>
      ${getStatusBadge(data.lastActive)}
      <br>
      <span>${iconByCategory(data.kategori)} ${data.kategori}</span> •
      <span>${waktu}</span>
    </div>
  </div>
  <p>${sanitize(data.isi)}</p>
    <div class="actions">
      <button class="btn-like">❤️ <span>${data.likes||0}</span></button>
      <button class="btn-comment">💬 <span>${data.comments||0}</span> Komentar</button>
      <button class="btn-share">🔗 Share</button>
    </div>
    <div class="comments" id="comments-${id}"></div>
  `;
  feed.appendChild(post);

  post.querySelector(".btn-like").addEventListener("click",()=>handleLike(id));
  post.querySelector(".btn-comment").addEventListener("click",()=>handleComment(id));
  post.querySelector(".btn-share").addEventListener("click",()=>handleShare(id,data.isi));
  loadLimitedComments(id);
}

async function handleLike(id){
  try{await updateDoc(doc(db,"curhatan",id),{likes:increment(1)});}
  catch(err){console.error(err);}
}

function handleComment(curhatId){
  const boxId=`comments-${curhatId}`;
  const post=document.getElementById(boxId);
  let box=post.querySelector(".comment-box");
  if(!box){
    box=document.createElement("div");
    box.classList.add("comment-box");
    box.innerHTML=`
      <textarea placeholder="Tulis dukunganmu..." class="comment-input"></textarea>
      <button class="comment-send">Kirim</button>
    `;
    post.appendChild(box);

    const input=box.querySelector(".comment-input");
    const send=box.querySelector(".comment-send");
    send.addEventListener("click",async()=>{
      const text=input.value.trim();if(!text)return;
      await addDoc(collection(db,`curhatan/${curhatId}/comments`),
        {nama:"Anonim",isi:text,waktu:new Date().toISOString()});
      await updateDoc(doc(db,"curhatan",curhatId),{comments:increment(1)});
      input.value="";
      showToast("Komentarmu terkirim 💜");
    });
  }else box.classList.toggle("active");
}

function loadLimitedComments(curhatId){
  const q=query(collection(db,`curhatan/${curhatId}/comments`),orderBy("waktu","desc"),limit(2));
  const box=document.getElementById(`comments-${curhatId}`);
  onSnapshot(q,(snapshot)=>{
    box.innerHTML="";
    const list=[];snapshot.forEach(d=>list.push(d.data()));
    list.reverse().forEach(c=>{
      const t=new Date(c.waktu).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});
      const el=document.createElement("div");
      el.classList.add("comment-item");
      el.innerHTML=`<strong>${c.nama}</strong> <span class="time">(${t})</span><br>${sanitize(c.isi)}`;
      box.appendChild(el);
    });
  });
}

function handleShare(id,isi){
  const link=`${window.location.origin}/feed.html?id=${id}`;
  if(navigator.share){
    navigator.share({title:"Curhatan dari RuangCurhat",text:isi.slice(0,100)+"...",url:link});
  }else{
    navigator.clipboard.writeText(link);
    showToast("Link curhatan disalin 📋");
  }
}

loadFeed();

