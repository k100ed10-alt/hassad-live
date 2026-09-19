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
function saveDb(data){
  localStorage.setItem("hassad-db", JSON.stringify(data));
}
function findByPhone(data, phone){
  var list=data.students||{};
  var keys=Object.keys(list);
  for(var i=0;i<keys.length;i++){
    var s=list[keys[i]];
    if(s && s.phone===phone) return {uid:keys[i], rec:s};
  }
  if(list["phone_"+phone]) return {uid:"phone_"+phone, rec:list["phone_"+phone]};
  return null;
}
function registerStudent(e){
  e.preventDefault();
  var err=document.getElementById("err");
  err.textContent="";
  var name=document.getElementById("name").value.trim();
  var grade=document.getElementById("grade").value.trim();
  var phone=normPhone(document.getElementById("phone").value);
  if(!name || name.length<3){ err.textContent="اكتب الاسم الثلاثي كاملاً"; return; }
  if(!phone){ err.textContent="رقم الهاتف غير صحيح. مثال عمان: 9689xxxxxxx"; return; }
  if(!grade){ err.textContent="اختر الصف"; return; }
  var data=loadDb();
  var exist=findByPhone(data, phone);
  if(exist){
    err.textContent="هذا الرقم مسجل مسبقاً. ادخل برقم الهاتف وكلمة المرور.";
    return;
  }
  var email="s"+phone+"@hassad.om";
  var password=genPass();
  var uid="phone_"+phone;
  var rec={
    name:name,
    phone:phone,
    email:email,
    password:password,
    grade:grade,
    subscription_status:"active",
    points:0,
    streak:0,
    created_at:new Date().toISOString()
  };
  data.students[uid]=rec;
  saveDb(data);
  try{
    if(window.HassadFB && HassadFB.put){
      HassadFB.init().then(function(){ HassadFB.put("students", uid, rec); });
    }
  }catch(ex){}
  document.getElementById("form").style.display="none";
  document.getElementById("ok").style.display="block";
  document.getElementById("o-phone").textContent=phone;
  document.getElementById("o-email").textContent=email;
  document.getElementById("o-pass").textContent=password;
}
document.getElementById("form").addEventListener("submit", registerStudent);
