const ADMIN={email:"admin@hassad.om",password:"Admin#1",name:"مدير حَصاد",role:"admin"};
const ADMIN_ALIASES=["admin@hassad.om"];
const ALL_GRADES=["الصف الخامس","الصف السادس","الصف السابع","الصف الثامن","الصف التاسع","الصف العاشر","الصف الحادي عشر","الصف الثاني عشر"];
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
  if(d.length===11 && d.indexOf("968")===0) return d;
  return d;
}
function phoneMatch(a,b){
  var x=digits(a), y=digits(b);
  if(!x||!y) return false;
  if(x===y) return true;
  if(normPhone(x) && normPhone(x)===normPhone(y)) return true;
  return x.slice(-8)===y.slice(-8);
}
function passEq(a,b){
  return String(a||"").replace(/[\s\u2010-\u2015]/g,"")===String(b||"").replace(/[\s\u2010-\u2015]/g,"");
}
function dest(user){
  if(user.role==="admin") return "admin.html";
  if(user.role==="teacher") return "teacher.html";
  return "home.html";
}
function cloudReady(){ return window.HassadFB && typeof firebase!=="undefined"; }
function teacherGrades(t){
  if(t && Array.isArray(t.grades) && t.grades.length) return t.grades;
  if(t && t.grade) return [t.grade];
  return [];
}
function asTeacher(t, uid){
  var gs=teacherGrades(t);
  return {email:t.email||"",name:t.name,role:"teacher",uid:uid||t.id,subject_id:t.subject_id,grade:gs[0]||"",grades:gs,phone:t.phone||""};
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
    location.href = dest(user);
  }
  if(ADMIN_ALIASES.includes(email)&&passEq(password,ADMIN.password)){
    return finish({email:ADMIN.email,name:ADMIN.name,role:"admin",uid:"uid_admin"});
  }
  function afterCloudFail(){ localLogin(email,password,err,finish,raw); }
  if(cloudReady()){
    if(err) err.textContent="جارٍ التحقق...";
    HassadFB.init().then(function(ok){
      if(!ok || !HassadFB.db){ afterCloudFail(); return; }
      return HassadFB.db.collection("teachers").get().then(function(snap){
        var hit=null;
        snap.forEach(function(doc){
          var t=Object.assign({id:doc.id}, doc.data());
          if(phoneMatch(t.phone||doc.id, raw) || (t.email&&t.email.toLowerCase()===email)) hit={t:t,id:doc.id};
        });
        if(hit){
          if(!passEq(hit.t.password,password)) return finish("badpass");
          return finish(asTeacher(hit.t, hit.id));
        }
        return HassadFB.db.collection("students").get().then(function(ss){
          var sh=null;
          ss.forEach(function(doc){
            var s=Object.assign({id:doc.id}, doc.data());
            if(phoneMatch(s.phone||doc.id, raw) || (s.email&&s.email.toLowerCase()===email)) sh=s;
          });
          if(sh){
            if(!passEq(sh.password,password)) return finish("badpass");
            return finish({email:sh.email,name:sh.name,role:"student",uid:sh.id,grade:sh.grade,phone:sh.phone,subscription_status:sh.subscription_status});
          }
          afterCloudFail();
        });
      });
    }).catch(afterCloudFail);
    return;
  }
  afterCloudFail();
};
function localLogin(email,password,err,finish,raw){
  const data=ensureTeachers();
  const tEntry=Object.entries(data.teachers||{}).find(function(pair){
    var t=pair[1]||{};
    if(t.email && t.email.toLowerCase()===email) return true;
    if(phoneMatch(t.phone||pair[0], raw)) return true;
    return false;
  });
  if(tEntry){
    const [uid,t]=tEntry;
    if(!passEq(t.password,password)) return finish("badpass");
    return finish(asTeacher(t, uid));
  }
  const sEntry=Object.entries(data.students||{}).find(function(pair){
    var s=pair[1]||{};
    if(s.email && s.email.toLowerCase()===email) return true;
    if(phoneMatch(s.phone||pair[0], raw)) return true;
    return false;
  });
  if(sEntry){
    if(!passEq(sEntry[1].password,password)) return finish("badpass");
    const uid=sEntry[0], s=sEntry[1];
    return finish({email:s.email,name:s.name,role:"student",uid,grade:s.grade,phone:s.phone,subscription_status:s.subscription_status});
  }
  finish(null);
}
Hassad.createTeacher=function(e){
  e.preventDefault();
  const data=ensureTeachers();
  const name=document.getElementById("tc-name").value.trim();
  const phone=normPhone(document.getElementById("tc-phone")?document.getElementById("tc-phone").value:"");
  if(!phone || phone.length<8){ document.getElementById("tc-msg").textContent="اكتب رقم هاتف المعلم"; return; }
  var grades=[];
  document.querySelectorAll('input[name="tc-grade"]:checked').forEach(function(c){ grades.push(c.value); });
  if(!grades.length){ document.getElementById("tc-msg").textContent="اختر صفاً واحداً على الأقل"; return; }
  const uid="phone_"+phone;
  var prev=data.teachers[uid]||{};
  const password=prev.password || (Hassad.genPassword&&Hassad.genPassword()) || ("Hs-"+Math.random().toString(36).slice(2,8));
  const rec=Object.assign({},prev,{name:name||prev.name,phone:phone,email:prev.email||("t"+phone+"@hassad.om"),password:password,subject_id:document.getElementById("tc-subject").value,grade:grades[0],grades:grades,role:"teacher"});
  data.teachers[uid]=rec;
  localStorage.setItem("hassad-db",JSON.stringify(data));
  var box=document.getElementById("tc-pass"); if(box) box.value=password;
  document.getElementById("tc-msg").textContent="حُفظت صفوف المعلم: "+grades.join("، ");
  Hassad.renderTeachers();
  if(cloudReady()) HassadFB.put("teachers", uid, rec);
};
Hassad.editTeacher=function(id){
  var data=ensureTeachers();
  var t=data.teachers[id]; if(!t) return;
  document.getElementById("tc-name").value=t.name||"";
  document.getElementById("tc-phone").value=t.phone||"";
  if(document.getElementById("tc-subject") && t.subject_id) document.getElementById("tc-subject").value=t.subject_id;
  if(document.getElementById("tc-pass")) document.getElementById("tc-pass").value=t.password||"";
  document.querySelectorAll('input[name="tc-grade"]').forEach(function(c){
    c.checked = teacherGrades(t).indexOf(c.value)!==-1;
  });
  document.getElementById("tc-msg").textContent="عدّل الصفوف ثم اضغط حفظ";
  window.scrollTo(0,0);
};
Hassad.renderTeachers=function(){
  var tb=document.getElementById("teachers");
  if(!tb) return;
  var data=ensureTeachers();
  tb.innerHTML=Object.keys(data.teachers||{}).map(function(id){
    var t=data.teachers[id];
    return "<tr><td>"+(t.name||"")+"</td><td>"+(t.phone||"")+"</td><td><code>"+(t.password||"")+"</code></td><td>"+teacherGrades(t).join("، ")+" <button type='button' onclick=\"Hassad.editTeacher('"+id+"')\">تعديل</button></td></tr>";
  }).join("") || "<tr><td colspan='4'>لا معلمين بعد</td></tr>";
};
Hassad.requireAuth=function(){return Hassad.currentUser&&Hassad.currentUser();};
