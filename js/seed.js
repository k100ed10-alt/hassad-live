function seedDemo(){
  let data={};
  try{data=JSON.parse(localStorage.getItem("hassad-db")||"{}")}catch(e){data={}}
  if(!data.students) data.students={};
  if(!data.students.uid_yousef){
    data.students.uid_yousef={name:"يوسف العلوي",email:"yousef@hassad.om",password:"Yousef#84",grade:"الصف الثامن",subscription_status:"active"};
  }
  if(!data.students.uid_layan){
    data.students.uid_layan={name:"ليان الشامسي",email:"layan@hassad.om",password:"Layan#91",grade:"الصف التاسع",subscription_status:"active"};
  }
  localStorage.setItem("hassad-db",JSON.stringify(data));
}
seedDemo();
