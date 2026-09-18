function toEmbed(url){
  if(!url) return "";
  url=url.trim();
  let m=url.match(/(?:youtu\.be\/|v=)([\w-]{6,})/);
  if(m) return "https://www.youtube.com/embed/"+m[1]+"?autoplay=1";
  m=url.match(/youtube\.com\/embed\/[\w-]+/);
  if(m) return url;
  if(/streamyard\.com/i.test(url)) return url;
  return url;
}
function sessionStart(s){
  if(s.start_ts) return new Date(s.start_ts).getTime();
  const t=s.scheduled_time||"";
  return NaN;
}
function nextSession(grade){
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const now=Date.now();
  return (data.live_sessions||[])
    .filter(s=>!s.grade||!grade||s.grade===grade)
    .map(s=>({s,ts:s.start_ts?new Date(s.start_ts).getTime():0}))
    .filter(x=>x.ts>now-30*60*1000)
    .sort((a,b)=>a.ts-b.ts)[0];
}
function fmtRemain(ms){
  if(ms<=0) return "بدأت الآن";
  const s=Math.floor(ms/1000);
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  if(h) return h+" س و "+m+" د";
  if(m) return m+" د و "+sec+" ث";
  return sec+" ث";
}
Hassad.startCountdown=function(){
  const el=document.getElementById("countdown-box");
  if(!el) return;
  const user=Hassad.currentUser&&Hassad.currentUser();
  const tick=()=>{
    const n=nextSession(user&&user.grade);
    if(!n||!n.ts){el.hidden=true;return;}
    el.hidden=false;
    const left=n.ts-Date.now();
    document.getElementById("countdown-title").textContent=n.s.title||"الحصة القادمة";
    document.getElementById("countdown-time").textContent=fmtRemain(left);
    const btn=document.getElementById("countdown-btn");
    if(btn) btn.href="subject.html?id="+(n.s.subject_id||"math");
    if(left>0 && left<15*60*1000+2000 && left>15*60*1000-2000) Hassad.remindOnce(n.s);
  };
  tick(); setInterval(tick,1000);
};
Hassad.remindOnce=function(session){
  const key="reminded-"+(session.id||session.title);
  if(sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key,"1");
  const msg="الحصة تبدأ بعد ١٥ دقيقة: "+(session.title||"");
  if("Notification" in window){
    if(Notification.permission==="granted") new Notification("حَصاد",{body:msg});
    else if(Notification.permission!=="denied") Notification.requestPermission().then(p=>{if(p==="granted") new Notification("حَصاد",{body:msg});});
  }
  if(Hassad.toast) Hassad.toast(msg);
};
Hassad.renderArchive=function(){
  const box=document.getElementById("archive-list"); if(!box) return;
  const id=new URLSearchParams(location.search).get("id")||"math";
  const user=Hassad.currentUser&&Hassad.currentUser();
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const items=(data.live_sessions||[]).filter(s=>s.subject_id===id && (!s.grade||!user||s.grade===user.grade) && (s.recording_url||s.status==="completed"));
  box.innerHTML=items.map(s=>`<div class="row"><div><strong>${s.title}</strong><div class="hint">${s.scheduled_time||""}</div></div>${s.recording_url?`<button class="btn" onclick="Hassad.playRecord('${(s.recording_url||"").replace(/'/g,"")}');Hassad.switchTab('live',document.querySelector('.tab'))">مشاهدة</button>`:""}</div>`).join("")||"<p class='hint'>لا تسجيلات بعد</p>";
};
Hassad.playRecord=function(url){
  const player=document.getElementById("player");
  if(!player) return;
  const src=toEmbed(url);
  player.innerHTML=`<iframe src="${src}" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
};
Hassad.enhanceLivePlayer=function(){
  const player=document.getElementById("player"); if(!player) return;
  const id=new URLSearchParams(location.search).get("id")||"math";
  const user=Hassad.currentUser&&Hassad.currentUser();
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const live=(data.live_sessions||[]).find(s=>s.subject_id===id && s.status!=="completed" && (!s.grade||!user||s.grade===user.grade));
  if(live&&live.stream_url){
    const src=toEmbed(live.stream_url);
    player.innerHTML=`<iframe src="${src}" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>`;
    const meta=document.getElementById("live-meta");
    if(meta) meta.textContent=(live.title||"")+" — "+(live.scheduled_time||"");
  }
  Hassad.renderChat(live&&live.id);
  Hassad.renderArchive();
};
Hassad.renderChat=function(sid){
  const box=document.getElementById("class-chat"); if(!box) return;
  const key="hassad-chat-"+(sid||"general");
  const msgs=JSON.parse(localStorage.getItem(key)||"[]");
  const user=Hassad.currentUser&&Hassad.currentUser();
  box.innerHTML=msgs.map(m=>`<div class="chat-msg"><strong>${m.name}</strong><span>${m.text}</span></div>`).join("")||"<p class='hint'>ابدأ المحادثة</p>";
  box.scrollTop=box.scrollHeight;
  const form=document.getElementById("chat-form");
  if(form && !form.dataset.bound){
    form.dataset.bound="1";
    form.onsubmit=function(e){
      e.preventDefault();
      const inp=document.getElementById("chat-text");
      const text=inp.value.trim(); if(!text) return;
      msgs.push({name:(user&&user.name)||"طالب",text,t:Date.now()});
      localStorage.setItem(key,JSON.stringify(msgs.slice(-80)));
      inp.value=""; Hassad.renderChat(sid);
    };
  }
};
const _sl=Hassad.saveLive;
Hassad.saveLive=function(e){
  _sl(e);
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  if(data.live_sessions&&data.live_sessions[0]){
    const date=document.getElementById("live-date")&&document.getElementById("live-date").value;
    const hour=document.getElementById("live-hour")&&document.getElementById("live-hour").value;
    const rec=document.getElementById("live-record");
    if(date&&hour) data.live_sessions[0].start_ts=new Date(date+"T"+hour+":00").toISOString();
    if(rec&&rec.value) data.live_sessions[0].recording_url=rec.value.trim();
    localStorage.setItem("hassad-db",JSON.stringify(data));
  }
};
