function slugName(name,i){
  const map={"ا":"a","أ":"a","إ":"a","آ":"a","ب":"b","ت":"t","ث":"th","ج":"j","ح":"h","خ":"kh","د":"d","ذ":"dh","ر":"r","ز":"z","س":"s","ش":"sh","ص":"s","ض":"d","ط":"t","ظ":"z","ع":"a","غ":"gh","ف":"f","ق":"q","ك":"k","ل":"l","م":"m","ن":"n","ه":"h","و":"w","ي":"y","ى":"a","ة":"a"};
  let s=""; for(const ch of (name||"").trim()) s+=map[ch]||(/[a-z0-9]/i.test(ch)?ch.toLowerCase():"");
  s=(s.replace(/[^a-z0-9]/g,"")||"student").slice(0,12);
  return s+(1000+i)+"@hassad.om";
}
Hassad.bulkCreate=function(){
  const raw=(document.getElementById("bulk-names").value||"").trim();
  const grade=document.getElementById("bulk-grade").value;
  if(!raw){alert("الصق الأسماء أولاً");return;}
  const names=raw.split(/\n/).map(l=>l.split(/[,\t|;]/)[0].trim()).filter(Boolean);
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  data.students=data.students||{};
  let added=0;
  names.forEach((name,i)=>{
    const email=slugName(name,Object.keys(data.students).length+i);
    if(Object.values(data.students).some(s=>s.email===email)) return;
    const uid="uid_"+Date.now()+"_"+i;
    data.students[uid]={name,email,password:Hassad.genPassword(),grade,subscription_status:"active"};
    added++;
  });
  localStorage.setItem("hassad-db",JSON.stringify(data));
  document.getElementById("bulk-msg").textContent="تم إنشاء "+added+" حساباً. صدّر الكشف ووزّعه على الطلاب.";
  Hassad.renderAdmin();
};
Hassad.exportStudents=function(){
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const rows=[["الاسم","الصف","البريد","كلمة المرور"]];
  Object.values(data.students||{}).forEach(s=>rows.push([s.name,s.grade||"",s.email,s.password||""]));
  const csv=rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(",")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="hassad-students.csv"; a.click();
};
