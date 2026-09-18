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
  p.streak = p.lastDay===y.toISOString().slice(0,10) ? (p.streak||0)+1 : 1;
  p.lastDay=t; saveProg(p); return p;
}
function openCount(subjectId){
  const user=Hassad.currentUser&&Hassad.currentUser();
  if(!user) return 0;
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  return (data.assignments||[]).filter(a=>a.subject_id===subjectId && !data.submissions[`${a.id}_${user.uid}`]).length;
}
function lastRecording(user){
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  return (data.live_sessions||[]).find(s=>s.recording_url && (!s.grade||!user.grade||s.grade===user.grade))||null;
}
function weekSessions(user){
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  return (data.live_sessions||[]).filter(s=>s.status!=="completed" && (!s.grade||!user.grade||s.grade===user.grade)).slice(0,5);
}
const _dash=Hassad.renderDashboard;
Hassad.renderDashboard=function(){
  _dash();
  const user=Hassad.currentUser();
  if(!user) return;
  const p=touchStreak();
  const welcome=document.getElementById("welcome");
  if(welcome) welcome.textContent="مرحباً "+user.name;
  const pp=document.getElementById("points-pill"); if(pp){pp.className="pill pill-points"; pp.textContent="★ "+arNum(p.points)+" نقطة";}
  const sp=document.getElementById("streak-pill"); if(sp){sp.className="pill pill-streak"; sp.textContent="🔥 "+arNum(p.streak)+" يوم";}
  const gp=document.getElementById("grade-pill"); if(gp){gp.className="pill pill-grade"; gp.textContent=user.grade||"";}
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const live=(data.live_sessions||[]).find(s=>s.stream_url && s.status!=="completed");
  const banner=document.getElementById("live-banner");
  const fab=document.getElementById("fab-live");
  if(live){
    if(banner){banner.classList.add("show"); const t=document.getElementById("live-banner-text"); if(t) t.textContent=live.title; const b=document.getElementById("live-banner-btn"); if(b) b.href="subject.html?id="+live.subject_id;}
    if(fab){fab.hidden=false; fab.onclick=()=>location.href="subject.html?id="+live.subject_id;}
  }else{
    if(banner) banner.classList.remove("show");
    if(fab) fab.hidden=true;
  }
  const rec=lastRecording(user);
  const cc=document.getElementById("continue-card");
  if(cc){
    if(rec){
      cc.href="subject.html?id="+(rec.subject_id||"math");
      document.getElementById("continue-title").textContent="آخر تسجيل: "+rec.title;
    }else{
      const last=data.subjects[p.lastSubject]||data.subjects.math;
      cc.href="subject.html?id="+(p.lastSubject||"math");
      document.getElementById("continue-title").textContent=(last&&last.name||"")+" · آخر درس";
    }
    document.getElementById("continue-pct").textContent=arNum(p.progress)+"٪";
    document.getElementById("continue-bar").style.width=p.progress+"%";
  }
  const week=document.getElementById("week-list");
  if(week){
    const items=weekSessions(user);
    week.innerHTML=items.length?items.map(s=>`<div class="week-item"><span>${s.title}</span><span>${s.scheduled_time||""}</span></div>`).join(""):"<div class=\"week-item\">لا حصص هذا الأسبوع — راجع آخر درس من البطاقة أعلاه</div>";
  }
  const grid=document.getElementById("subject-grid");
  if(grid){
    grid.innerHTML=Object.values(data.subjects||{}).map(s=>{
      const n=openCount(s.id);
      const meta=SUB_META[s.id]||{cls:"sub-math",ico:"📚"};
      return `<a class="sub-card ${meta.cls}" href="subject.html?id=${s.id}">${n?`<span class="note-badge">${arNum(n)}</span>`:""}<div><h3>${meta.ico} ${s.name}</h3><p>${s.teacher||""}</p></div></a>`;
    }).join("");
  }
  const openHw=(data.assignments||[]).filter(a=>!data.submissions[`${a.id}_${user.uid}`]).length;
  const hwBadge=document.getElementById("hw-count"); if(hwBadge) hwBadge.textContent=arNum(openHw);
  const chBadge=document.getElementById("ch-count");
  if(chBadge) chBadge.textContent=(p.challengeDay===todayKey()&&p.challengeDone)?"٠":"١";
  const list=document.getElementById("assignment-list");
  if(list){
    list.innerHTML=(data.assignments||[]).map(a=>{
      const sub=data.submissions[`${a.id}_${user.uid}`];
      const subj=(data.subjects[a.subject_id]||{}).name||"";
      return `<div class="row"><div><strong>${a.title}</strong><div style="color:var(--muted);font-size:13px">${subj}</div></div><span class="badge ${sub?"badge-done":"badge-wait"}">${sub?"مُسلَّم":"مفتوح"}</span></div>`;
    }).join("")||"<p class='hint'>لا واجبات مفتوحة</p>";
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
    opts.innerHTML=""; document.getElementById("challenge-msg").textContent="أنجزت تحدي اليوم ✓"; return;
  }
  opts.innerHTML=q.opts.map((o,i)=>`<button class="btn" style="margin-top:8px;width:100%" onclick="Hassad.answerChallenge(${i})">${o}</button>`).join("");
  document.getElementById("challenge-msg").textContent="";
}
Hassad.answerChallenge=function(i){
  const t=todayKey(); const p=loadProg();
  const q=CHALLENGES[t.length % CHALLENGES.length];
  const msg=document.getElementById("challenge-msg");
  if(i===q.ok){p.points=(p.points||0)+10; p.challengeDay=t; p.challengeDone=true; saveProg(p); Hassad.renderDashboard();}
  else msg.textContent="حاول مرة أخرى";
};
const _subj=Hassad.renderSubject;
Hassad.renderSubject=function(){
  const id=new URLSearchParams(location.search).get("id")||"math";
  const p=loadProg(); p.lastSubject=id; saveProg(p);
  _subj();
};
