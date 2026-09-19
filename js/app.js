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
const DEFAULT_DB={students:{},subjects:SUBJECTS,assignments:[],submissions:{},live_sessions:[],lessons:[]};
function genPassword(){const a="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";let s="Hs-";for(let i=0;i<6;i++)s+=a[Math.floor(Math.random()*a.length)];return s}
function db(){let data;const raw=localStorage.getItem("hassad-db");if(!raw){data=structuredClone(DEFAULT_DB)}else{data=JSON.parse(raw);if(!data.students)data.students={};if(!data.subjects)data.subjects=SUBJECTS;}localStorage.setItem("hassad-db",JSON.stringify(data));return data}
function saveDb(next){localStorage.setItem("hassad-db",JSON.stringify(next))}
function currentUser(){const raw=localStorage.getItem("hassad-user");return raw?JSON.parse(raw):null}
function isStaffUser(user){
  if(!user) return false;
  const mail=String(user.email||"").toLowerCase();
  const name=String(user.name||"").toLowerCase();
  const role=String(user.role||"").toLowerCase();
  return role==="admin"||role==="teacher"||mail.indexOf("admin@")===0||mail==="teacher@hassad.om"||name==="admin"||name.indexOf("مدير")!==-1;
}
function requireAuth(role){
  const user=currentUser();
  if(!user){location.href="login.html";return null;}
  if(isStaffUser(user)){
    if(user.role!=="admin"&&user.role!=="teacher"){
      user.role="admin";
      localStorage.setItem("hassad-user",JSON.stringify(user));
    }
    return user;
  }
  if(role==="student"||!role) return user;
  location.href="home.html";
  return null;
}
function logout(){localStorage.removeItem("hassad-user");location.href="index.html"}
function toast(msg){let el=document.querySelector(".toast");if(!el){el=document.createElement("div");el.className="toast";document.body.appendChild(el)}el.textContent=msg;el.style.display="block";setTimeout(()=>el.style.display="none",2500)}
function loginHandler(e){e.preventDefault();const raw=document.getElementById("email").value.trim();const email=raw.toLowerCase();const password=document.getElementById("password").value;const err=document.getElementById("login-error");if(email==="admin@hassad.om"||email===TEACHER.email){localStorage.setItem("hassad-user",JSON.stringify({email:"admin@hassad.om",name:"مدير حَصاد",role:"admin",uid:"uid_admin"}));location.href="admin.html";return}const data=db();const d=raw.replace(/[^0-9]/g,"");const phone=d.indexOf("968")===0?d.slice(0,11):(d.length===8?"968"+d:"");const entry=Object.entries(data.students||{}).find(function(p){var s=p[1]||{};return (s.email&&s.email.toLowerCase()===email)||(phone&&s.phone===phone)||(phone&&p[0]==="phone_"+phone);});if(!entry||entry[1].password!==password){if(err)err.textContent="الرقم أو كلمة المرور غير صحيحة.";return}const[uid,student]=entry;localStorage.setItem("hassad-user",JSON.stringify({email:student.email,name:student.name,role:"student",uid,grade:student.grade,phone:student.phone,subscription_status:student.subscription_status}));location.href="home.html"}
function createStudent(e){e.preventDefault();const data=db();const phone=(document.getElementById("st-phone")?document.getElementById("st-phone").value:"").replace(/[^0-9]/g,"");const email=document.getElementById("st-email")?document.getElementById("st-email").value.trim().toLowerCase():("s"+phone+"@hassad.om");const password=genPassword();const uid=phone?("phone_"+ (phone.indexOf("968")===0?phone:"968"+phone)):("uid_"+Date.now());if(data.students[uid]){toast("هذا الرقم مسجل");return}data.students[uid]={name:document.getElementById("st-name").value.trim(),email,password,phone:phone||"",grade:document.getElementById("st-grade").value.trim(),subscription_status:"active",points:0};saveDb(data);const box=document.getElementById("new-cred"); if(box) box.textContent="أرسل: "+(phone||email)+" / "+password;toast("تم إنشاء الحساب");e.target.reset();renderAdmin();}
function resetPassword(uid){const data=db();const next=genPassword();data.students[uid].password=next;saveDb(data);toast("الكلمة الجديدة: "+next);renderAdmin();}
function renderDashboard(){}
function renderSubject(){}
function submitWork(){}
function switchTab(name,btn){document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));document.getElementById("panel-"+name).classList.add("active");btn.classList.add("active")}
function renderAdmin(){const user=requireAuth("teacher");if(!user)return;const data=db();
const ls=document.getElementById("live-form-subject"); if(ls) ls.innerHTML=Object.values(data.subjects||{}).map(s=>`<option value="${s.id}">${s.name}</option>`).join("");
const hs=document.getElementById("hw-subject"); if(hs) hs.innerHTML=Object.values(data.subjects||{}).map(s=>`<option value="${s.id}">${s.name}</option>`).join("");
const lt=document.getElementById("live-table"); if(lt) lt.innerHTML=(data.live_sessions||[]).map(l=>`<tr><td>${(data.subjects[l.subject_id]||{}).name||""}</td><td>${l.title}</td><td>${l.scheduled_time||""}</td><td>${l.stream_url?"مربوط":"—"}</td></tr>`).join("");
const ah=document.getElementById("admin-hw"); if(ah) ah.innerHTML=(data.assignments||[]).map(a=>`<div class="row"><strong>${a.title}</strong></div>`).join("");
const tb=document.getElementById("students"); if(tb) tb.innerHTML=Object.entries(data.students||{}).map(([uid,st])=>`<tr><td>${st.name||""}</td><td>${st.phone||"—"}</td><td>${st.email||""}</td><td><code>${st.password||""}</code></td><td>${st.grade||""}</td></tr>`).join("");
}
function saveLive(e){e.preventDefault();const date=document.getElementById("live-date").value;const hour=document.getElementById("live-hour").value;const data=db();data.live_sessions=data.live_sessions||[];data.live_sessions.unshift({id:"l"+Date.now(),title:document.getElementById("live-title").value,subject_id:document.getElementById("live-form-subject").value,stream_url:(document.getElementById("live-embed").value||"").trim(),scheduled_time:formatWhen(date,hour),status:"upcoming"});saveDb(data);toast("تم نشر الحصة");renderAdmin();e.target.reset()}
function saveHw(e){e.preventDefault();const data=db();data.assignments=data.assignments||[];data.assignments.unshift({id:"a"+Date.now(),subject_id:document.getElementById("hw-subject").value,title:document.getElementById("hw-title").value,description:"واجب",due_date:document.getElementById("hw-due").value,created_at:new Date().toISOString().slice(0,10)});saveDb(data);toast("تم نشر الواجب");renderAdmin();e.target.reset()}
window.Hassad={loginHandler,logout,renderDashboard,renderSubject,renderAdmin,switchTab,saveLive,saveHw,submitWork,toast,currentUser,createStudent,resetPassword,genPassword,isStaffUser};
