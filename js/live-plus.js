function toEmbed(url){
  if(!url) return "";
  url=url.trim();
  let m=url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  if(m) return "https://www.youtube.com/embed/"+m[1];
  return url;
}
function parseStart(s){
  if(s&&s.starts_at) return new Date(s.starts_at);
  return null;
}
Hassad.renderCountdown=function(){
  const el=document.getElementById("class-countdown"); if(!el) return;
  el.innerHTML="<strong>حصص الأسبوع في الصندوق أعلاه</strong>";
};
Hassad.watchReminders=function(){};
Hassad.enableAlerts=function(){};
Hassad.renderPlayer=function(){
  const player=document.getElementById("player"); if(!player) return;
  const id=new URLSearchParams(location.search).get("id")||"math";
  const user=Hassad.currentUser&&Hassad.currentUser();
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const live=(data.live_sessions||[]).find(s=>s.subject_id===id && s.stream_url && s.status!=="completed");
  if(!live){player.innerHTML='<div class="player-empty"><h3>لا بث الآن</h3></div>';return;}
  const src=toEmbed(live.stream_url);
  player.innerHTML=src?`<iframe src="${src}" allowfullscreen></iframe>`:"";
};
Hassad.drawChat=function(){};
Hassad.sendChat=function(e){if(e) e.preventDefault();};
Hassad.renderArchive=function(){
  const el=document.getElementById("archive"); if(!el) return;
  const id=new URLSearchParams(location.search).get("id")||"math";
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const items=(data.live_sessions||[]).filter(s=>s.subject_id===id && s.recording_url);
  el.innerHTML=items.map(s=>`<div class="row"><strong>${s.title}</strong></div>`).join("")||"<p class='hint'>لا تسجيلات</p>";
};
Hassad.saveLive=function(e){
  e.preventDefault();
  const date=document.getElementById("live-date").value;
  const hour=document.getElementById("live-hour").value;
  const rec=(document.getElementById("live-rec")||{}).value||"";
  const data=JSON.parse(localStorage.getItem("hassad-db"));
  data.live_sessions.unshift({
    id:"l"+Date.now(),
    title:document.getElementById("live-title").value,
    subject_id:document.getElementById("live-form-subject").value,
    grade:(document.getElementById("live-grade")||{}).value||"",
    stream_url:(document.getElementById("live-embed").value||"").trim(),
    recording_url:rec.trim(),
    starts_at:date&&hour?date+"T"+hour+":00":null,
    scheduled_time:(date||"")+" "+(hour||""),
    status:rec?"completed":"upcoming"
  });
  localStorage.setItem("hassad-db",JSON.stringify(data));
  Hassad.renderAdmin&&Hassad.renderAdmin();
};
