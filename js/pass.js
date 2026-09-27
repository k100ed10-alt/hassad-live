function newAskCode(){
  var part=Math.random().toString(36).slice(2,8).toUpperCase().replace(/O/g,"A").replace(/0/g,"B");
  return "HS-"+part;
}
Hassad.makeAskCode=function(){
  var code=newAskCode();
  var item={id:code,code:code,used:false,phone:"",at:Date.now()};
  return HassadFB.put("codes", code, item).then(function(){
    var box=document.getElementById("new-code");
    if(box) box.textContent="الرمز: "+code+" — أرسله للطالب بعد الدفع";
    if(Hassad.listAskCodes) Hassad.listAskCodes();
    return code;
  });
};
Hassad.listAskCodes=function(){
  var el=document.getElementById("codes-list"); if(!el || !HassadFB.db) return;
  HassadFB.db.collection("codes").get().then(function(snap){
    var rows=[];
    snap.forEach(function(doc){ rows.push(Object.assign({id:doc.id}, doc.data()||{})); });
    rows.sort(function(a,b){return (b.at||0)-(a.at||0);});
    el.innerHTML=rows.slice(0,20).map(function(c){
      return "<div>"+c.code+" — "+(c.used?("مستخدم "+(c.phone||"")):"متاح")+"</div>";
    }).join("")||"لا رموز بعد";
  });
};
Hassad.redeemAskCode=function(code){
  code=String(code||"").trim().toUpperCase();
  if(!code) return Promise.reject(new Error("اكتب الرمز"));
  var u=null; try{u=JSON.parse(localStorage.getItem("hassad-user")||"null")}catch(e){}
  if(!u || !u.uid) return Promise.reject(new Error("ادخل بحساب الطالب أولاً"));
  return HassadFB.init().then(function(){
    return HassadFB.db.collection("codes").doc(code).get();
  }).then(function(doc){
    if(!doc.exists) throw new Error("الرمز غير صحيح");
    var d=doc.data()||{};
    if(d.used && d.phone && String(d.phone)!==String(u.phone||u.uid)) throw new Error("الرمز مستخدم");
    return HassadFB.put("codes", code, {used:true, phone:u.phone||u.uid, usedBy:u.uid, usedAt:Date.now()}).then(function(){
      return HassadFB.put("students", u.uid, {askCode:code, subscription_status:"active"});
    }).then(function(){
      u.askCode=code; u.subscription_status="active";
      localStorage.setItem("hassad-user", JSON.stringify(u));
    });
  });
};
