const TEACHER={email:"teacher@hassad.om",password:"Teacher#1",name:"إدارة حَصاد"};
const DAYS=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
function formatWhen(dateStr,timeStr){
  if(!dateStr) return timeStr||"";
  const [y,m,d]=dateStr.split("-").map(Number);
  const dt=new Date(y,m-1,d);
  const day=DAYS[dt.getDay()];
  let clock=timeStr||"";
  if(timeStr&&timeStr.includes(":")){
    const [hh,mm]=timeStr.split(":");
    let h=+hh; const ap=h>=12?"مساء":"صباح"; h=h%12||12;
    clock=h+":"+mm+" "+ap;
  }
  return day+" "+d+"/"+m+" — "+clock;
}
const SUBJECTS={math:{id:"math",name:"الرياضيات",icon_url:"",teacher:"أ. خالد المنذري"},islamic:{id:"islamic",name:"التربية الإسلامية",icon_url:"",teacher:"أ. فاطمة الهنائي"},arabic:{id:"arabic",name:"اللغة العربية",icon_url:"",teacher:"أ. سعيد الرواحي"},science:{id:"science",name:"العلوم",icon_url:"",teacher:"أ. مريم البلوشي"}};
const DEFAULT_DB={students:{"uid_yousef":{name:"يوسف العلوي",email:"yousef@hassad.om",password:"Yousef#84",grade:"الصف الثامن",subscription_status:"active"},"uid_layan":{name:"ليان الشامسي",email:"layan@hassad.om",password:"Layan#91",grade:"الصف التاسع",subscription_status:"active"},"uid_hamad":{name:"حمد الكندي",email:"hamad@hassad.om",password:"Hamad#62",grade:"الصف الثامن",subscription_status:"inactive"}},subjects:SUBJECTS,assignments:[],submissions:{},live_sessions:[],lessons:[{subject_id:"math",title:"الكسور",duration:"32 د"},{subject_id:"islamic",title:"أركان الإيمان",duration:"24 د"},{subject_id:"arabic",title:"الإعراب",duration:"36 د"},{subject_id:"science",title:"حالات المادة",duration:"30 د"}]};
function genPassword(){const a="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";let s="Hs-";for(let i=0;i<6;i++)s+=a[Math.floor(Math.random()*a.length)];return s}
function db(){let data;const raw=localStorage.getItem("hassad-db");if(!raw){data=structuredClone(DEFAULT_DB)}else{data=JSON.parse(raw);if(!data.students)data.students={};Object.values(data.students).forEach(s=>{if(!s.password)s.password=genPassword()})}localStorage.setItem("hassad-db",JSON.stringify(data));return data}
function saveDb(next){localStorage.setItem("hassad-db",JSON.stringify(next))}
function currentUser(){const raw=localStorage.getItem("hassad-user");return raw?JSON.parse(raw):null}
function requireAuth(role){
  const user=currentUser();
  if(!user){location.href="login.html";return null;}
  const staff=user.role==="teacher"||user.role==="admin";
  if(staff){
    if(role==="student"){location.href="admin.html";return null;}
    return user;
  }
  if(role==="student"||!role) return user;
  location.href="home.html";
  return null;
}
function logout(){localStorage.removeItem("hassad-user");location.href="index.html"}
function toast(msg){let el=document.querySelector(".toast");if(!el){el=document.createElement("div");el.className="toast";document.body.appendChild(el)}el.textContent=msg;el.style.display="block";setTimeout(()=>el.style.display="none",2500)}
function studentByUid(uid){return db().students[uid]||null}
function canAccessContent(student){return !!student&&student.subscription_status==="active"}
function assignmentsBySubject(subjectId){return db().assignments.filter(a=>a.subject_id===subjectId)}
function latestLive(subjectId){const sessions=db().live_sessions.filter(s=>s.subject_id===subjectId&&s.status!=="completed");return sessions[0]||{title:"لا حصة الآن",scheduled_time:"",stream_url:""}}
function loginHandler(e){e.preventDefault();const email=document.getElementById("email").value.trim().toLowerCase();const password=document.getElementById("password").value;const err=document.getElementById("login-error");if(email===TEACHER.email&&password===TEACHER.password){localStorage.setItem("hassad-user",JSON.stringify({email,name:TEACHER.name,role:"teacher",uid:"uid_teacher"}));location.href="admin.html";return}const data=db();const entry=Object.entries(data.students).find(([,s])=>s.email.toLowerCase()===email);if(!entry||entry[1].password!==password){err.textContent="البريد أو كلمة المرور غير صحيحة.";return}const[uid,student]=entry;localStorage.setItem("hassad-user",JSON.stringify({email:student.email,name:student.name,role:"student",uid,grade:student.grade,subscription_status:student.subscription_status}));location.href="home.html"}
function createStudent(e){e.preventDefault();const data=db();const email=document.getElementById("st-email").value.trim().toLowerCase();const password=genPassword();if(Object.values(data.students).some(s=>s.email===email)){toast("هذا البريد مسجل مسبقاً");return}const uid="uid_"+Date.now();data.students[uid]={name:document.getElementById("st-name").value.trim(),email,password,grade:document.getElementById("st-grade").value.trim(),subscription_status:"active"};saveDb(data);document.getElementById("new-cred").textContent="وُلِّدت الكلمة تلقائياً. أرسل: "+email+" / "+password;toast("تم إنشاء الحساب");e.target.reset();renderAdmin();if(window.HassadFB) HassadFB.pushStudent(uid,data.students[uid]);}
function resetPassword(uid){const data=db();const next=genPassword();data.students[uid].password=next;saveDb(data);toast("الكلمة الجديدة: "+next);renderAdmin();if(window.HassadFB) HassadFB.pushStudent(uid,data.students[uid]);}
function renderDashboard(){const user=currentUser();if(!user||user.role!=="student")return;}
function renderSubject(){const user=requireAuth("student");if(!user)return;const id=new URLSearchParams(location.search).get("id")||"math";const data=db();const s=data.subjects[id];const live=latestLive(id);const t=document.getElementById("subject-title");if(t)t.textContent=s.name;const st=document.getElementById("subject-teacher");if(st)st.textContent=s.teacher||"";const lm=document.getElementById("live-meta");if(lm)lm.textContent=live.title?`${live.title} — ${live.scheduled_time||""}`:"لا حصة";const player=document.getElementById("player");if(player)player.innerHTML=live.stream_url?`<iframe src="${live.stream_url}" allowfullscreen></iframe>`:`<div class="player-empty"><h3>لا بث الآن</h3></div>`;const les=document.getElementById("lessons");if(les)les.innerHTML=data.lessons.filter(l=>l.subject_id===id).map(l=>`<div class="row"><strong>${l.title}</strong></div>`).join("");const hw=document.getElementById("hw");if(hw)hw.innerHTML=assignmentsBySubject(id).map(a=>`<div class="row"><strong>${a.title}</strong></div>`).join("")}
function submitWork(assignmentId){const user=currentUser();const data=db();data.submissions[`${assignmentId}_${user.uid}`]={status:"submitted"};saveDb(data);toast("تم التسليم")}
function switchTab(name,btn){document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));document.getElementById("panel-"+name).classList.add("active");btn.classList.add("active")}
function renderAdmin(){const user=requireAuth("teacher");if(!user)return;const data=db();
const ls=document.getElementById("live-form-subject"); if(ls) ls.innerHTML=Object.values(data.subjects).map(s=>`<option value="${s.id}">${s.name}</option>`).join("");
const hs=document.getElementById("hw-subject"); if(hs) hs.innerHTML=Object.values(data.subjects).map(s=>`<option value="${s.id}">${s.name}</option>`).join("");
const lt=document.getElementById("live-table"); if(lt) lt.innerHTML=data.live_sessions.map(l=>`<tr><td>${data.subjects[l.subject_id]?.name||""}</td><td>${l.title}</td><td>${l.scheduled_time||""}</td><td>${l.stream_url?"مربوط":"—"}</td></tr>`).join("");
const ah=document.getElementById("admin-hw"); if(ah) ah.innerHTML=data.assignments.map(a=>`<div class="row"><strong>${a.title}</strong></div>`).join("");
const tb=document.getElementById("students"); if(tb) tb.innerHTML=Object.entries(data.students).map(([uid,st])=>`<tr><td>${st.name}</td><td>${st.email}</td><td><code>${st.password}</code> <button type="button" class="btn-outline" onclick="Hassad.resetPassword('${uid}')">تجديد</button></td><td>${st.grade}</td><td>${st.subscription_status}</td></tr>`).join("");
}
function saveLive(e){e.preventDefault();const date=document.getElementById("live-date").value;const hour=document.getElementById("live-hour").value;const data=db();data.live_sessions.unshift({id:"l"+Date.now(),title:document.getElementById("live-title").value,subject_id:document.getElementById("live-form-subject").value,stream_url:document.getElementById("live-embed").value.trim(),scheduled_time:formatWhen(date,hour),status:"upcoming"});saveDb(data);toast("تم نشر الحصة");renderAdmin();e.target.reset()}
function saveHw(e){e.preventDefault();const data=db();data.assignments.unshift({id:"a"+Date.now(),subject_id:document.getElementById("hw-subject").value,title:document.getElementById("hw-title").value,description:"واجب",due_date:document.getElementById("hw-due").value,created_at:new Date().toISOString().slice(0,10)});saveDb(data);toast("تم نشر الواجب");renderAdmin();e.target.reset()}
window.Hassad={loginHandler,logout,renderDashboard,renderSubject,renderAdmin,switchTab,saveLive,saveHw,submitWork,toast,currentUser,createStudent,resetPassword,genPassword};
