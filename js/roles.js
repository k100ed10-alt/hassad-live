const ADMIN={email:"admin@hassad.om",password:"Admin#1",name:"مدير حَصاد",role:"admin"};
const ADMIN_ALIASES=["admin@hassad.om","teacher@hassad.om"];
function ensureTeachers(){
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  if(!data.teachers) data.teachers={};
  localStorage.setItem("hassad-db",JSON.stringify(data));
  return data;
}
Hassad.loginHandler=function(e){
  e.preventDefault();
  const email=document.getElementById("email").value.trim().toLowerCase();
  const password=document.getElementById("password").value;
  const err=document.getElementById("login-error");
  function finish(user){
    if(!user){ if(err) err.textContent="البريد أو كلمة المرور غير صحيحة."; return; }
    if(user==="badpass"){ if(err) err.textContent="كلمة المرور غير صحيحة."; return; }
    localStorage.setItem("hassad-user", JSON.stringify(user));
    location.href = (user.role==="admin"||user.role==="teacher") ? "admin.html" : "home.html";
  }
  if(window.HassadFB && HassadFB.login){
    if(err) err.textContent="جارٍ التحقق...";
    HassadFB.login(email,password).then(function(u){
      if(u) return finish(u);
      localLogin(email,password,err,finish);
    }).catch(function(){ localLogin(email,password,err,finish); });
    return;
  }
  localLogin(email,password,err,finish);
};
function localLogin(email,password,err,finish){
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
  const students=(JSON.parse(localStorage.getItem("hassad-db")||"{}").students)||{};
  const sEntry=Object.entries(students).find(([,s])=>s.email&&s.email.toLowerCase()===email);
  if(sEntry && sEntry[1].password===password){
    const[uid,s]=sEntry;
    return finish({email:s.email,name:s.name,role:"student",uid,grade:s.grade,subscription_status:s.subscription_status});
  }
  finish(null);
}
Hassad.createTeacher=function(e){
  e.preventDefault();
  const data=ensureTeachers();
  const email=document.getElementById("tc-email").value.trim().toLowerCase();
  const uid="tch_"+Date.now();
  const rec={name:document.getElementById("tc-name").value.trim(),email,password:document.getElementById("tc-pass").value.trim(),subject_id:document.getElementById("tc-subject").value,grade:document.getElementById("tc-grade").value,role:"teacher"};
  data.teachers[uid]=rec;
  localStorage.setItem("hassad-db",JSON.stringify(data));
  document.getElementById("tc-msg").textContent="حُفظ: "+email;
  if(window.HassadFB) HassadFB.init().then(function(){ HassadFB.put("teachers", uid, rec); });
};
Hassad.applyRoleUI=function(){
  const user=Hassad.currentUser&&Hassad.currentUser();
  if(!user) return;
  const isAdmin=user.role==="admin";
  document.querySelectorAll("[data-admin-only]").forEach(el=>el.style.display=isAdmin?"":"none");
};
Hassad.requireAuth=function(){return Hassad.currentUser&&Hassad.currentUser();};
