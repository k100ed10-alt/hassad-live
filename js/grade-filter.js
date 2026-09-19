const GRADES=["الصف الخامس","الصف السادس","الصف السابع","الصف الثامن","الصف التاسع","الصف العاشر","الصف الحادي عشر","الصف الثاني عشر"];
function fillGradeSelects(){
  ["hw-grade","live-grade","st-grade"].forEach(id=>{
    const el=document.getElementById(id); if(!el||el.tagName!=="SELECT") return;
    if(el.options.length) return;
    el.innerHTML=GRADES.map(g=>`<option>${g}</option>`).join("");
  });
}
function forGrade(list,grade){
  return (list||[]).filter(x=>!x.grade||x.grade===grade);
}
const _saveLive=Hassad.saveLive;
Hassad.saveLive=function(e){
  e.preventDefault();
  const date=document.getElementById("live-date").value;
  const hour=document.getElementById("live-hour").value;
  const data=JSON.parse(localStorage.getItem("hassad-db"));
  const DAYS=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  const [y,m,d]=date.split("-").map(Number);
  const day=DAYS[new Date(y,m-1,d).getDay()];
  let clock=hour||"";
  if(hour&&hour.includes(":")){const[hh,mm]=hour.split(":");let h=+hh;const ap=h>=12?"مساء":"صباح";h=h%12||12;clock=h+":"+mm+" "+ap;}
  data.live_sessions.unshift({
    id:"l"+Date.now(),
    title:document.getElementById("live-title").value,
    subject_id:document.getElementById("live-form-subject").value,
    grade:(document.getElementById("live-grade")||{}).value||"",
    stream_url:(document.getElementById("live-embed").value||"").trim(),
    scheduled_time:day+" "+d+"/"+m+" — "+clock,
    status:"upcoming"
  });
  localStorage.setItem("hassad-db",JSON.stringify(data));
  Hassad.toast("نُشرت الحصة للصف المحدد");
  Hassad.renderAdmin(); e.target.reset();
};
const _saveHw=Hassad.saveHw;
Hassad.saveHw=function(e){
  e.preventDefault();
  const questions=typeof parseQuestions==="function"?parseQuestions((document.getElementById("hw-questions")||{}).value||""):[];
  const preview=document.getElementById("hw-preview");
  const image=(preview&&preview.src&&preview.style.display!=="none")?preview.src:"";
  const data=JSON.parse(localStorage.getItem("hassad-db"));
  data.assignments.unshift({
    id:"a"+Date.now(),
    subject_id:document.getElementById("hw-subject").value,
    grade:(document.getElementById("hw-grade")||{}).value||"",
    title:document.getElementById("hw-title").value,
    due_date:document.getElementById("hw-due").value,
    created_at:new Date().toISOString().slice(0,10),
    questions,image
  });
  localStorage.setItem("hassad-db",JSON.stringify(data));
  Hassad.toast("نُشر الواجب للصف المحدد");
  Hassad.renderAdmin(); e.target.reset();
};
const _dash=Hassad.renderDashboard;
Hassad.renderDashboard=function(){
  _dash();
  const user=Hassad.currentUser&&Hassad.currentUser(); if(!user||user.role!=="student") return;
  const grade=user.grade;
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const list=document.getElementById("assignment-list");
  if(list){
    const items=forGrade(data.assignments,grade);
    list.innerHTML=items.map(a=>{
      const sub=data.submissions[(a.id+"_"+user.uid)];
      const subj=(data.subjects[a.subject_id]||{}).name||"";
      return `<div class="row"><div><strong>${a.title}</strong><div style="color:var(--muted);font-size:13px">${subj} — ${grade||""}</div></div><span class="badge ${sub?"badge-done":"badge-wait"}">${sub?"مُسلَّم":"مفتوح"}</span></div>`;
    }).join("")||"<p class='hint'>لا واجبات لصفك حالياً</p>";
  }
};
const _sub=Hassad.renderSubject;
Hassad.renderSubject=function(){
  _sub();
  const user=Hassad.currentUser&&Hassad.currentUser(); if(!user) return;
  const id=new URLSearchParams(location.search).get("id")||"math";
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const hw=document.getElementById("hw");
  if(hw){
    const items=forGrade(data.assignments,user.grade).filter(a=>a.subject_id===id);
    hw.innerHTML=items.map(a=>`<div class="row"><div><strong>${a.title}</strong></div><button class="btn" onclick="Hassad.startQuiz('${a.id}')">افتح</button></div>`).join("")||"<p class='hint'>لا واجب لهذا الصف</p>";
  }
};
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",fillGradeSelects);
else fillGradeSelects();
