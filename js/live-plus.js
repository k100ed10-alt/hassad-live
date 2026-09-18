function toEmbed(url){
  if(!url) return "";
  url=url.trim();
  let m=url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  if(m) return "https://www.youtube.com/embed/"+m[1]+"?autoplay=1";
  if(/streamyard\.com/i.test(url)){
    if(url.includes("/watch")) return url;
    return url;
  }
  if(url.includes("<iframe")) return "";
  return url;
}
function parseStart(s){
  if(!s) return null;
  if(s.starts_at) return new Date(s.starts_at);
  if(s.scheduled_iso) return new Date(s.scheduled_iso);
  return null;
}
function fmtRemain(ms){
  if(ms<=0) return "بدأت الآن";
  const s=Math.floor(ms/1000);
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
  if(h>0) return h+" س و "+m+" د و "+sec+" ث";
  return String(m).padStart(2,"0")+":"+String(sec).padStart(2,"0");
}
Hassad.nextSessionFor=function(user){
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const now=Date.now();
  return (data.live_sessions||[])
    .filter(s=>s.status!=="completed")
    .filter(s=>!user.grade||!s.grade||s.grade===user.grade)
    .map(s=>({s,t:parseStart(s)}))
    .filter(x=>x.t && !isNaN(x.t) && x.t.getTime()+3*3600000>=now)
    .sort((a,b)=>a.t-b.t)[0]||null;
};
Hassad.renderCountdown=function(){
  const el=document.getElementById("class-countdown");
  if(!el) return;
  const user=Hassad.currentUser&&Hassad.currentUser();
  if(!user||user.role!=="student"){el.style.display="none";return;}
  const n=Hassad.nextSessionFor(user);
  if(!n){el.innerHTML="<strong>لا حصة قادمة مجدولة</strong>";return;}
  const left=n.t.getTime()-Date.now();
  const subj=((JSON.parse(localStorage.getItem("hassad-db")||"{}").subjects||{})[n.s.subject_id]||{}).name||"";
  el.innerHTML=`<div><strong>الحصة القادمة</strong><div class="hint">${n.s.title} — ${subj}</div></div><div class="count-num">${fmtRemain(left)}</div>`;
};
Hassad.watchReminders=function(){
  const user=Hassad.currentUser&&Hassad.currentUser();
  if(!user||user.role!=="student") return;
  if("Notification" in window && Notification.permission==="default"){
    const b=document.getElementById("enable-alerts");
    if(b) b.style.display="inline-flex";
  }
  setInterval(()=>{
    Hassad.renderCountdown();
    const n=Hassad.nextSessionFor(user); if(!n) return;
    const left=n.t.getTime()-Date.now();
    if(left>14*60000 && left<16*60000){
      const key="alerted-"+n.s.id;
      if(sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key,"1");
      if(Notification.permission==="granted"){
        new Notification("حَصاد: الحصة بعد 15 دقيقة",{body:n.s.title,tag:n.s.id});
      }
      Hassad.toast&&Hassad.toast("الحصة بعد 15 دقيقة");
    }
  },1000);
};
Hassad.enableAlerts=function(){
  if(!("Notification" in window)){alert("المتصفح لا يدعم الإشعارات");return;}
  Notification.requestPermission().then(p=>{
    const b=document.getElementById("enable-alerts");
    if(b) b.style.display=p==="granted"?"none":"inline-flex";
    Hassad.toast&&Hassad.toast(p==="granted"?"تم تفعيل التنبيه":"لم يُسمح بالإشعار");
  });
};
Hassad.renderPlayer=function(){
  const user=Hassad.currentUser&&Hassad.currentUser(); if(!user) return;
  const id=new URLSearchParams(location.search).get("id")||"math";
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const sessions=(data.live_sessions||[]).filter(s=>s.subject_id===id && (!s.grade||!user.grade||s.grade===user.grade));
  const live=sessions.find(s=>s.status!=="completed" && s.stream_url) || sessions[0];
  const player=document.getElementById("player");
  const meta=document.getElementById("live-meta");
  if(!player) return;
  if(!live){
    if(meta) meta.textContent="لا حصة مجدولة";
    player.innerHTML='<div class="player-empty"><div><h3>لا يوجد بث الآن</h3></div></div>';
    return;
  }
  if(meta) meta.textContent=(live.title||"")+" — "+(live.scheduled_time||"");
  const src=toEmbed(live.stream_url);
  player.innerHTML=src?`<iframe src="${src}" allow="autoplay; fullscreen" allowfullscreen></iframe>`:'<div class="player-empty"><div><h3>انتظر رابط البث</h3></div></div>';
  const box=document.getElementById("class-chat");
  if(box){ box.dataset.sid=live.id||"live"; Hassad.drawChat(); }
};
Hassad.drawChat=function(){
  const box=document.getElementById("chat-list"); if(!box) return;
  const sid=(document.getElementById("class-chat")||{}).dataset.sid||"live";
  const msgs=JSON.parse(localStorage.getItem("hassad-chat-"+sid)||"[]");
  box.innerHTML=msgs.map(m=>`<div class="chat-item"><strong>${m.name}</strong><span>${m.text}</span></div>`).join("")||"<p class='hint'>لا رسائل بعد</p>";
  box.scrollTop=box.scrollHeight;
};
Hassad.sendChat=function(e){
  e.preventDefault();
  const input=document.getElementById("chat-text");
  const text=(input.value||"").trim(); if(!text) return;
  const user=Hassad.currentUser();
  const sid=(document.getElementById("class-chat")||{}).dataset.sid||"live";
  const key="hassad-chat-"+sid;
  const msgs=JSON.parse(localStorage.getItem(key)||"[]");
  msgs.push({name:user.name,text,at:Date.now()});
  localStorage.setItem(key,JSON.stringify(msgs.slice(-80)));
  input.value=""; Hassad.drawChat();
};
Hassad.renderArchive=function(){
  const el=document.getElementById("archive"); if(!el) return;
  const user=Hassad.currentUser&&Hassad.currentUser(); if(!user) return;
  const id=new URLSearchParams(location.search).get("id")||"math";
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const items=(data.live_sessions||[]).filter(s=>s.subject_id===id && (s.recording_url||s.status==="completed"));
  el.innerHTML=items.map(s=>`<div class="row"><div><strong>${s.title}</strong><div class="hint">${s.scheduled_time||""}</div></div>${s.recording_url?`<a class="btn" href="${s.recording_url}" target="_blank">مشاهدة</a>`:""}</div>`).join("")||"<p class='hint'>لا تسجيلات بعد لهذه المادة</p>";
};
const _sl=Hassad.saveLive;
Hassad.saveLive=function(e){
  e.preventDefault();
  const date=document.getElementById("live-date").value;
  const hour=document.getElementById("live-hour").value;
  const rec=(document.getElementById("live-rec")||{}).value||"";
  const data=JSON.parse(localStorage.getItem("hassad-db"));
  const DAYS=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  const [y,m,d]=(date||"").split("-").map(Number);
  const day=date?DAYS[new Date(y,m-1,d).getDay()]:"";
  let clock=hour||"";
  if(hour&&hour.includes(":")){const[hh,mm]=hour.split(":");let h=+hh;const ap=h>=12?"مساء":"صباح";h=h%12||12;clock=h+":"+mm+" "+ap;}
  data.live_sessions.unshift({
    id:"l"+Date.now(),
    title:document.getElementById("live-title").value,
    subject_id:document.getElementById("live-form-subject").value,
    grade:(document.getElementById("live-grade")||{}).value||"",
    stream_url:(document.getElementById("live-embed").value||"").trim(),
    recording_url:rec.trim(),
    starts_at:date&&hour?`${date}T${hour}:00`:null,
    scheduled_time:day?day+" "+d+"/"+m+" — "+clock:"",
    status:rec?"completed":"upcoming"
  });
  localStorage.setItem("hassad-db",JSON.stringify(data));
  Hassad.toast&&Hassad.toast("نُشرت الحصة");
  Hassad.renderAdmin&&Hassad.renderAdmin(); e.target.reset();
};
