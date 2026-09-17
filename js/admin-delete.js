Hassad.deleteStudent=function(uid){
  if(!confirm("حذف هذا الطالب؟")) return;
  const data=JSON.parse(localStorage.getItem("hassad-db"));
  delete data.students[uid];
  localStorage.setItem("hassad-db",JSON.stringify(data));
  Hassad.renderAdmin();
};
Hassad.deleteLive=function(id){
  const data=JSON.parse(localStorage.getItem("hassad-db"));
  data.live_sessions=(data.live_sessions||[]).filter((l,i)=>(l.id||String(i))!==id);
  localStorage.setItem("hassad-db",JSON.stringify(data));
  Hassad.renderAdmin();
};
Hassad.deleteHw=function(id){
  const data=JSON.parse(localStorage.getItem("hassad-db"));
  data.assignments=(data.assignments||[]).filter(a=>a.id!==id);
  localStorage.setItem("hassad-db",JSON.stringify(data));
  Hassad.renderAdmin();
};
Hassad.clearAllContent=function(){
  if(!confirm("مسح كل الطلاب والحصص والواجبات من هذا الجهاز؟")) return;
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  data.students={};
  data.assignments=[];
  data.live_sessions=[];
  data.lessons=[];
  data.submissions={};
  localStorage.setItem("hassad-db",JSON.stringify(data));
  Hassad.toast("تم المسح");
  Hassad.renderAdmin();
};
const _ra=Hassad.renderAdmin;
Hassad.renderAdmin=function(){
  _ra();
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const st=document.getElementById("students");
  if(st) st.innerHTML=Object.entries(data.students||{}).map(([uid,s])=>`<tr><td>${s.name}</td><td>${s.email}</td><td><code>${s.password||""}</code></td><td>${s.grade||""}</td><td><span class="badge ${s.subscription_status==="active"?"badge-done":"badge-live"}">${s.subscription_status==="active"?"نشط":"موقوف"}</span></td><td><button class="btn-outline" onclick="Hassad.deleteStudent('${uid}')">حذف</button></td></tr>`).join("");
  const lt=document.getElementById("live-table");
  if(lt) lt.innerHTML=(data.live_sessions||[]).map((l,i)=>`<tr><td>${(data.subjects[l.subject_id]||{}).name||""}</td><td>${l.title}</td><td>${l.scheduled_time||""}</td><td>${l.stream_url?"مربوط":"—"}</td><td><button class="btn-outline" onclick="Hassad.deleteLive('${l.id||i}')">حذف</button></td></tr>`).join("");
  const hw=document.getElementById("admin-hw");
  if(hw) hw.innerHTML=(data.assignments||[]).map(a=>`<div class="row"><strong>${a.title}</strong><button class="btn-outline" onclick="Hassad.deleteHw('${a.id}')">حذف</button></div>`).join("")||"<p class='hint'>لا واجبات</p>";
};
