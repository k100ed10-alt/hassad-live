function normPhone(raw){
  var d=String(raw||"").replace(/[^0-9]/g,"");
  if(d.indexOf("00968")===0) d=d.slice(2);
  if(d.indexOf("968")===0 && d.length>=11) return d.slice(0,11);
  if(d.length===8 && /^[79]/.test(d)) return "968"+d;
  if(d.length===11 && d.indexOf("968")===0) return d;
  return "";
}
function genPass(){
  var a="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  var s="Hs-";
  for(var i=0;i<6;i++) s+=a[Math.floor(Math.random()*a.length)];
  return s;
}
function loadDb(){
  var data={};
  try{data=JSON.parse(localStorage.getItem("hassad-db")||"{}")}catch(e){}
  if(!data.students) data.students={};
  return data;
}
function saveDb(data){ localStorage.setItem("hassad-db", JSON.stringify(data)); }
function matchPhone(a,b){
  var x=String(a||"").replace(/[^0-9]/g,"");
  var y=String(b||"").replace(/[^0-9]/g,"");
  return x && y && (x===y || x.slice(-8)===y.slice(-8));
}
function registerStudent(e){
  e.preventDefault();
  var err=document.getElementById("err");
  err.textContent="";
  var name=document.getElementById("name").value.trim();
  var grade=document.getElementById("grade").value.trim();
  var phone=normPhone(document.getElementById("phone").value);
  if(!name || name.length<3){ err.textContent="اكتب الاسم الثلاثي كاملاً"; return; }
  if(!phone){ err.textContent="رقم الهاتف غير صحيح"; return; }
  if(!grade){ err.textContent="اختر الصف"; return; }
  var btn=e.target.querySelector("[type=submit]");
  if(btn) btn.disabled=true;
  err.textContent="نبحث عن الحساب في السحابة...";
  var uid="phone_"+phone;
  var email="s"+phone+"@hassad.om";
  function showOk(rec, existed){
    var data=loadDb(); data.students[uid]=rec; saveDb(data);
    document.getElementById("form").style.display="none";
    document.getElementById("ok").style.display="block";
    document.getElementById("o-phone").textContent=phone;
    document.getElementById("o-email").textContent=rec.email||email;
    document.getElementById("o-pass").textContent=rec.password;
    var h=document.querySelector("#ok h2");
    if(h) h.textContent=existed?"الحساب موجود — هذه كلمة المرور الثابتة":"تم إنشاء حسابك على السحابة";
  }
  if(!window.HassadFB){ err.textContent="لا يوجد اتصال."; if(btn) btn.disabled=false; return; }
  HassadFB.init().then(function(){
    return HassadFB.db.collection("students").get();
  }).then(function(snap){
    var found=null;
    snap.forEach(function(doc){
      var s=Object.assign({id:doc.id}, doc.data());
      if(matchPhone(s.phone||doc.id, phone)) found=s;
    });
    if(found && found.password){
      found.name=name||found.name;
      found.grade=grade||found.grade;
      found.phone=phone;
      return HassadFB.put("students", found.id||uid, {name:found.name,grade:found.grade,phone:phone}).then(function(){
        showOk(found, true);
      });
    }
    var rec={name:name,phone:phone,email:email,password:genPass(),grade:grade,subscription_status:"active",points:0,streak:0,created_at:new Date().toISOString()};
    return HassadFB.put("students", uid, rec).then(function(){ showOk(rec, false); });
  }).catch(function(ex){
    err.textContent="لم يُحفظ. "+(ex&&ex.message||"");
    if(btn) btn.disabled=false;
  });
}
document.getElementById("form").addEventListener("submit", registerStudent);
