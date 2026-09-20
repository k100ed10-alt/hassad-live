const ADMIN={email:"admin@hassad.om",password:"Admin#1",name:"مدير حَصاد",role:"admin"};
const ADMIN_ALIASES=["admin@hassad.om"];
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
  if(ADMIN_ALIASES.includes(email)&&password===ADMIN.password){
    return finish({email:ADMIN.email,name:ADMIN.name,role:"admin",uid:"uid_admin"});
  }
  if(cloudReady()){
    if(err) err.textContent="جارٍ التحقق...";
    HassadFB.init().then(function(ok){
      if(!ok || !HassadFB.db){ localLogin(email,password,err,finish,raw); return; }
      var phone=normPhone(raw);
      var tDoc=phone ? HassadFB.db.collection("teachers").doc("phone_"+phone).get() : Promise.resolve({exists:false});
      tDoc.then(function(doc){
        if(doc && doc.exists){
          var t=Object.assign({id:doc.id}, doc.data());
          if(t.password!==password) return finish("badpass");
          return finish(asTeacher(t, doc.id));
        }
        return HassadFB.db.collection("teachers").where("email","==",email).limit(1).get().then(function(snap){
          if(!snap.empty){
            var t=Object.assign({id:snap.docs[0].id}, snap.docs[0].data());
            if(t.password!==password) return finish("badpass");
            return finish(asTeacher(t, snap.docs[0].id));
          }
          if(phone){
            return HassadFB.db.collection("teachers").where("phone","==",phone).limit(1).get().then(function(ts){
              if(!ts.empty){
                var t2=Object.assign({id:ts.docs[0].id}, ts.docs[0].data());
                if(t2.password!==password) return finish("badpass");
                return finish(asTeacher(t2, ts.docs[0].id));
              }
              return studentCloud(phone,email,password,finish,err,raw);
            });
          }
          return studentCloud(phone,email,password,finish,err,raw);
        });
      }).catch(function(){ localLogin(email,password,err,finish,raw); });
    });
    return;
  }
  localLogin(email,password,err,finish,raw);
};
function studentCloud(phone,email,password,finish,err,raw){
  var q=phone? HassadFB.db.collection("students").doc("phone_"+phone).get() : Promise.resolve({exists:false});
  q.then(function(doc){
    if(doc && doc.exists){
      var s=Object.assign({id:doc.id}, doc.data());
      if(s.password!==password) return finish("badpass");
      return finish({email:s.email,name:s.name,role:"student",uid:s.id,grade:s.grade,phone:s.phone,subscription_status:s.subscription_status});
    }
    return HassadFB.db.collection("students").where("email","==",email).limit(1).get().then(function(ss){
      if(!ss.empty){
        var s2=Object.assign({id:ss.docs[0].id}, ss.docs[0].data());
        if(s2.password!==password) return finish("badpass");
        return finish({email:s2.email,name:s2.name,role:"student",uid:s2.id,grade:s2.grade,phone:s2.phone,subscription_status:s2.subscription_status});
      }
      localLogin(email,password,err,finish,raw);
    });
  });
}
function localLogin(email,password,err,finish,raw){
  const data=ensureTeachers();
  const phone=normPhone(raw||email);
  const tEntry=Object.entries(data.teachers||{}).find(function(pair){
    var t=pair[1]||{};
    if(t.email && t.email.toLowerCase()===email) return true;
    if(phone && t.phone===phone) return true;
    if(phone && pair[0]==="phone_"+phone) return true;
    return false;
  });
  if(tEntry){
    const [uid,t]=tEntry;
    if(t.password!==password) return finish("badpass");
    return finish(asTeacher(t, uid));
  }
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
  const name=document.getElementById("tc-name").value.trim();
  const phone=normPhone(document.getElementById("tc-phone")?document.getElementById("tc-phone").value:"");
  if(!phone){ document.getElementById("tc-msg").textContent="اكتب رقم هاتف المعلم"; return; }
  var grades=[];
  document.querySelectorAll('input[name="tc-grade"]:checked').forEach(function(c){ grades.push(c.value); });
  if(!grades.length && document.getElementById("tc-grade")) grades=[document.getElementById("tc-grade").value];
  if(!grades.length){ document.getElementById("tc-msg").textContent="اختر صفاً واحداً على الأقل"; return; }
  if(Object.values(data.teachers).some(function(t){return t.phone===phone;})){
    document.getElementById("tc-msg").textContent="هذا الرقم مسجل مسبقاً";
    return;
  }
  const uid="phone_"+phone;
  const password=(Hassad.genPassword&&Hassad.genPassword())||("Hs-"+Math.random().toString(36).slice(2,8));
  const rec={name:name,phone:phone,email:"t"+phone+"@hassad.om",password,subject_id:document.getElementById("tc-subject").value,grade:grades[0],grades:grades,role:"teacher"};
  data.teachers[uid]=rec;
  localStorage.setItem("hassad-db",JSON.stringify(data));
  var box=document.getElementById("tc-pass");
  if(box) box.value=password;
  document.getElementById("tc-msg").textContent="يدخل بالهاتف "+phone+" والكلمة "+password+" — الصفوف: "+grades.join("، ");
  Hassad.renderTeachers();
  if(cloudReady()) HassadFB.init().then(function(){ return HassadFB.put("teachers", uid, rec); });
};
Hassad.renderTeachers=function(){
  var tb=document.getElementById("teachers");
  if(!tb) return;
  var data=ensureTeachers();
  tb.innerHTML=Object.values(data.teachers||{}).map(function(t){
    var gs=teacherGrades(t).join("، ");
    return "<tr><td>"+(t.name||"")+"</td><td>"+(t.phone||t.email||"")+"</td><td><code>"+(t.password||"")+"</code></td><td>"+gs+"</td></tr>";
  }).join("") || "<tr><td colspan='4'>لا معلمين بعد</td></tr>";
};
Hassad.requireAuth=function(){return Hassad.currentUser&&Hassad.currentUser();};
