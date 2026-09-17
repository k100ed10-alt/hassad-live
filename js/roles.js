const ADMIN={email:"admin@hassad.om",password:"Admin#1",name:"مدير حَصاد",role:"admin"};
const ADMIN_ALIASES=["admin@hassad.om","teacher@hassad.om"];
function ensureTeachers(){
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  if(!data.teachers) data.teachers={};
  localStorage.setItem("hassad-db",JSON.stringify(data));
  return data;
}
const _login=Hassad.loginHandler;
Hassad.loginHandler=function(e){
  e.preventDefault();
  const email=document.getElementById("email").value.trim().toLowerCase();
  const password=document.getElementById("password").value;
  const err=document.getElementById("login-error");
  if(ADMIN_ALIASES.includes(email)&&(password===ADMIN.password||password==="Teacher#1")){
    localStorage.setItem("hassad-user",JSON.stringify({email:ADMIN.email,name:ADMIN.name,role:"admin",uid:"uid_admin"}));
    location.href="admin.html"; return;
  }
  const data=ensureTeachers();
  const tEntry=Object.entries(data.teachers||{}).find(([,t])=>t.email.toLowerCase()===email);
  if(tEntry){
    const [uid,t]=tEntry;
    if(t.password!==password){err.textContent="البريد أو كلمة المرور غير صحيحة.";return;}
    localStorage.setItem("hassad-user",JSON.stringify({email:t.email,name:t.name,role:"teacher",uid,subject_id:t.subject_id,grade:t.grade}));
    location.href="admin.html"; return;
  }
  _login(e);
};
Hassad.createTeacher=function(e){
  e.preventDefault();
  const user=Hassad.currentUser();
  if(!user||user.role!=="admin"){alert("للمدير فقط");return;}
  const data=ensureTeachers();
  const email=document.getElementById("tc-email").value.trim().toLowerCase();
  if(Object.values(data.teachers).some(t=>t.email===email)||email===ADMIN.email){alert("البريد مسجل");return;}
  const uid="tch_"+Date.now();
  data.teachers[uid]={
    name:document.getElementById("tc-name").value.trim(),
    email,
    password:document.getElementById("tc-pass").value.trim(),
    subject_id:document.getElementById("tc-subject").value,
    grade:document.getElementById("tc-grade").value,
    role:"teacher"
  };
  localStorage.setItem("hassad-db",JSON.stringify(data));
  document.getElementById("tc-msg").textContent="حُفظ: "+email+" / "+data.teachers[uid].password;
  e.target.reset(); Hassad.renderAdmin();
};
Hassad.applyRoleUI=function(){
  const user=Hassad.currentUser(); if(!user) return;
  const isAdmin=user.role==="admin";
  document.querySelectorAll("[data-admin-only]").forEach(el=>el.style.display=isAdmin?"":"none");
  if(!isAdmin && user.role==="teacher"){
    const title=document.querySelector(".topbar h1");
    if(title) title.textContent="معلم: "+(user.name||"")+" — "+(user.grade||"");
    const sub=document.getElementById("live-form-subject");
    const hw=document.getElementById("hw-subject");
    const lg=document.getElementById("live-grade");
    const hg=document.getElementById("hw-grade");
    if(sub){sub.value=user.subject_id; sub.disabled=true;}
    if(hw){hw.value=user.subject_id; hw.disabled=true;}
    if(lg){lg.value=user.grade; lg.disabled=true;}
    if(hg){hg.value=user.grade; hg.disabled=true;}
  }
};
const _req=Hassad.requireAuth;
Hassad.requireAuth=function(role){
  const user=Hassad.currentUser();
  if(!user){location.href="login.html";return null;}
  if(role==="teacher" && (user.role==="admin"||user.role==="teacher")) return user;
  if(role==="admin" && user.role!=="admin"){location.href="admin.html";return null;}
  return _req(role);
};
