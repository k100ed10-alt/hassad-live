const ADMIN={email:"admin@hassad.om",password:"Admin#1",name:"مدير حَصاد",role:"admin"};
const ADMIN_ALIASES=["admin@hassad.om","teacher@hassad.om"];
function ensureTeachers(){
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  if(!data.teachers) data.teachers={};
  if(!data.students) data.students={};
  localStorage.setItem("hassad-db",JSON.stringify(data));
  return data;
}
function digits(s){return String(s||"").replace(/[^0-9]/g,"");}
function normPhone(raw){
  var d=digits(raw);
  if(d.indexOf("00968")===0) d=d.slice(2);
  if(d.indexOf("968")===0 && d.length>=11) return d.slice(0,11);
  if(d.length===8 && /^[79]/.test(d)) return "968"+d;
  return d.length===11 && d.indexOf("968")===0 ? d : "";
}
Hassad.loginHandler=function(e){
  e.preventDefault();
  const raw=document.getElementById("email").value.trim();
  const email=raw.toLowerCase();
  const password=document.getElementById("password").value;
  const err=document.getElementById("login-error");
  function finish(user){
    if(!user){ if(err) err.textContent="الرقم أو كلمة المرور غير صحيحة."; return; }
    if(user==="badpass"){ if(err) err.textContent="كلمة المرور غير صحيحة."; return; }
    localStorage.setItem("hassad-user", JSON.stringify(user));
    location.href = (user.role==="admin"||user.role==="teacher") ? "admin.html" : "home.html";
  }
  localLogin(email,password,err,finish,raw);
};
function localLogin(email,password,err,finish,raw){
  if(ADMIN_ALIASES.includes(email)&&(password===ADMIN.password||password==="Teacher#1")){
    return finish({email:ADMIN.email,name:ADMIN.name,role:"admin",uid:"uid_admin"});
  }
  const data=ensureTeachers();
  const tEntry=Object.entries(data.teachers||{}).find(([,t])=>t.email && t.email.toLowerCase()===email);
  if(tEntry){
    const [uid,t]=tEntry;
    if(t.password!==password) return finish("badpass");
    return finish({email:t.email,name:t.name,role:"teacher",uid,subject_id:t.subject_id,grade:t.grade});
  }
  const phone=normPhone(raw||email);
  const students=data.students||{};
  const sEntry=Object.entries(students).find(function(pair){
    var s=pair[1]||{};
    if(s.email && s.email.toLowerCase()===email) return true;
    if(phone && s.phone===phone) return true;
    if(phone && pair[0]==="phone_"+phone) return true;
    return false;
  });
  if(sEntry){
    if(sEntry[1].password!==password) return finish("badpass");
    const uid=sEntry[0], s=sEntry[1];
    return finish({email:s.email,name:s.name,role:"student",uid,grade:s.grade,phone:s.phone,subscription_status:s.subscription_status});
  }
  finish(null);
}
Hassad.createTeacher=function(e){
  e.preventDefault();
  const data=ensureTeachers();
  const email=document.getElementById("tc-email").value.trim().toLowerCase();
  if(Object.values(data.teachers).some(function(t){return t.email===email;})){
    document.getElementById("tc-msg").textContent="هذا البريد مسجل مسبقاً";
    return;
  }
  const uid="tch_"+Date.now();
  const password=(Hassad.genPassword&&Hassad.genPassword())||("Hs-"+Math.random().toString(36).slice(2,8));
  const rec={name:document.getElementById("tc-name").value.trim(),email,password,subject_id:document.getElementById("tc-subject").value,grade:document.getElementById("tc-grade").value,role:"teacher"};
  data.teachers[uid]=rec;
  localStorage.setItem("hassad-db",JSON.stringify(data));
  var box=document.getElementById("tc-pass");
  if(box) box.value=password;
  document.getElementById("tc-msg").textContent="كلمة المرور المولَّدة: "+password+" — أرسل للمعلم: "+email+" / "+password;
  Hassad.renderTeachers();
};
Hassad.renderTeachers=function(){
  var tb=document.getElementById("teachers");
  if(!tb) return;
  var data=ensureTeachers();
  tb.innerHTML=Object.values(data.teachers||{}).map(function(t){
    return "<tr><td>"+(t.name||"")+"</td><td>"+(t.email||"")+"</td><td><code>"+(t.password||"")+"</code></td><td>"+(t.grade||"")+"</td></tr>";
  }).join("") || "<tr><td colspan='4'>لا معلمين بعد</td></tr>";
};
Hassad.applyRoleUI=function(){
  const user=Hassad.currentUser&&Hassad.currentUser();
  if(!user) return;
  const isAdmin=user.role==="admin";
  document.querySelectorAll("[data-admin-only]").forEach(el=>el.style.display=isAdmin?"":"none");
};
Hassad.requireAuth=function(){return Hassad.currentUser&&Hassad.currentUser();};
