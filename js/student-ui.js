function arNum(n){return String(n).replace(/[0-9]/g,d=>"٠١٢٣٤٥٦٧٨٩"[d])}
const SUB_META={math:{cls:"sub-math",ico:"📐"},islamic:{cls:"sub-islamic",ico:"📖"},arabic:{cls:"sub-arabic",ico:"✍️"},science:{cls:"sub-science",ico:"🔬"}};
const CHALLENGES=[
  {q:"٥ + ٧ كم يساوي؟",opts:["١٠","١١","١٢","٩"],ok:2},
  {q:"ما مجموع زوايا المربع؟",opts:["١٨٠°","٣٦٠°","٩٠°","٢٧٠°"],ok:1},
  {q:"نصف ١٦ يساوي",opts:["٦","٧","٨","٩"],ok:2}
];
function todayKey(){return new Date().toISOString().slice(0,10)}
function loadProg(){
  const raw=localStorage.getItem("hassad-prog");
  if(raw) return JSON.parse(raw);
  return {points:40,streak:5,lastDay:todayKey(),lastSubject:"math",progress:75,challengeDay:"",challengeDone:false};
}
function saveProg(p){localStorage.setItem("hassad-prog",JSON.stringify(p))}
function touchStreak(){
  const p=loadProg(); const t=todayKey();
  if(p.lastDay===t) return p;
  const y=new Date(); y.setDate(y.getDate()-1);
  const yk=y.toISOString().slice(0,10);
  p.streak = p.lastDay===yk ? (p.streak||0)+1 : 1;
  p.lastDay=t; saveProg(p); return p;
}
function openCount(subjectId){
  const user=Hassad.currentUser&&Hassad.currentUser();
  if(!user) return 0;
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  return (data.assignments||[]).filter(a=>a.subject_id===subjectId && !data.submissions[`${a.id}_${user.uid}`]).length;
}
function liveNow(){
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  return (data.live_sessions||[]).find(s=>s.stream_url && s.status!=="completed") || null;
}
const _dash=Hassad.renderDashboard;
Hassad.renderDashboard=function(){
  _dash();
  const user=Hassad.currentUser();
  if(!user) return;
  const p=touchStreak();
  const welcome=document.getElementById("welcome");
  if(welcome) welcome.textContent="مرحباً "+user.name;
  const chip=document.getElementById("chip-name"); if(chip) chip.textContent=user.name;
  const av=document.getElementById("avatar"); if(av) av.textContent=user.name.charAt(0);
  const pp=document.getElementById("points-pill"); if(pp) pp.textContent="★ "+arNum(p.points)+" نقطة";
  const sp=document.getElementById("streak-pill"); if(sp) sp.textContent="🔥 "+arNum(p.streak)+" أيام متتالية";
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const live=liveNow();
  const banner=document.getElementById("live-banner");
  if(banner){
    if(live){
      banner.classList.add("show");
      document.getElementById("live-banner-text").textContent=live.title+" — "+(live.scheduled_time||"");
      document.getElementById("live-banner-btn").href="subject.html?id="+live.subject_id;
    } else banner.classList.remove("show");
  }
  const last=data.subjects[p.lastSubject]||data.subjects.math;
  const cc=document.getElementById("continue-card");
  if(cc){
    cc.href="subject.html?id="+(p.lastSubject||"math");
    document.getElementById("continue-title").textContent=last.name+" · آخر درس";
    document.getElementById("continue-pct").textContent=arNum(p.progress)+"٪";
    document.getElementById("continue-bar").style.width=p.progress+"%";
  }
  const grid=document.getElementById("subject-grid");
  if(grid){
    grid.className="subjects-grid";
    grid.innerHTML=Object.values(data.subjects).map(s=>{
      const n=openCount(s.id);
      const meta=SUB_META[s.id]||{cls:"sub-math",ico:"📚"};
      return `<a class="sub-card ${meta.cls}" href="subject.html?id=${s.id}">${n?`<span class="note-badge">${arNum(n)}</span>`:""}<div><h3>${meta.ico} ${s.name}</h3><p>${s.teacher||""}</p></div></a>`;
    }).join("");
  }
  document.querySelectorAll("#side-nav [data-sub]").forEach(a=>{
    const n=openCount(a.dataset.sub);
    const dot=a.querySelector(".count-dot");
    if(!dot) return;
    if(n){dot.hidden=false;dot.textContent=arNum(n)} else dot.hidden=true;
  });
  const path=document.getElementById("path");
  if(path){
    const nodes=Object.values(data.subjects);
    path.innerHTML=nodes.map((s,i)=>`<div class="path-node ${i===0||p.progress>30*i?"done":""}">${arNum(i+1)}</div>${i<nodes.length-1?`<div class="path-line"></div>`:""}`).join("");
  }
  const list=document.getElementById("assignment-list");
  if(list){
    list.innerHTML=(data.assignments||[]).map(a=>{
      const sub=data.submissions[`${a.id}_${user.uid}`];
      return `<div class="row"><div><strong>${a.title}</strong><div style="color:var(--muted);font-size:13px">${data.subjects[a.subject_id].name} — ${a.due_date||""}</div></div><span class="badge ${sub?"badge-done":"badge-wait"}">${sub?"مُسلَّم":"مفتوح"}</span></div>`;
    }).join("");
  }
  renderChallenge();
};
function renderChallenge(){
  const box=document.getElementById("challenge"); if(!box) return;
  const p=loadProg(); const t=todayKey();
  const q=CHALLENGES[t.length % CHALLENGES.length];
  document.getElementById("challenge-q").textContent=q.q;
  const opts=document.getElementById("challenge-opts");
  if(p.challengeDay===t && p.challengeDone){
    opts.innerHTML=""; document.getElementById("challenge-msg").textContent="أنجزت تحدي اليوم ✓  +١٠ نقاط"; return;
  }
  opts.innerHTML=q.opts.map((o,i)=>`<button class="btn-outline" style="color:var(--teal-900);border-color:#d9d0bc" onclick="Hassad.answerChallenge(${i})">${o}</button>`).join("");
  document.getElementById("challenge-msg").textContent="";
}
Hassad.answerChallenge=function(i){
  const t=todayKey(); const p=loadProg();
  const q=CHALLENGES[t.length % CHALLENGES.length];
  const msg=document.getElementById("challenge-msg");
  if(i===q.ok){
    p.points=(p.points||0)+10; p.challengeDay=t; p.challengeDone=true; saveProg(p);
    msg.textContent="إجابة صحيحة! +١٠ نقاط";
    Hassad.renderDashboard();
  } else msg.textContent="حاول مرة أخرى";
};
const _submit=Hassad.submitWork;
Hassad.submitWork=function(id){
  _submit(id);
  const p=loadProg(); p.points=(p.points||0)+15; p.progress=Math.min(100,(p.progress||0)+8); saveProg(p);
  Hassad.toast("+١٥ نقطة");
};
const _subj=Hassad.renderSubject;
Hassad.renderSubject=function(){
  const id=new URLSearchParams(location.search).get("id")||"math";
  const p=loadProg(); p.lastSubject=id; saveProg(p);
  _subj();
};
