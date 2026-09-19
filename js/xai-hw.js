Hassad.saveXaiKey=function(){
  var k=(document.getElementById("xai-key")||{}).value||"";
  k=k.trim();
  if(!k){ Hassad.toast("الصق المفتاح"); return; }
  localStorage.setItem("hassad-xai-key", k);
  Hassad.toast("حُفظ المفتاح على هذا الجهاز");
};
Hassad.xaiMake=async function(topic, subject, grade, key){
  var res=await fetch("https://api.x.ai/v1/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
    body:JSON.stringify({
      model:"grok-3",
      temperature:0.4,
      messages:[
        {role:"system",content:"أنت معلم في سلطنة عمان. أرجع فقط JSON مصفوفة من 5 أسئلة اختيار من متعدد بالعربية بهذا الشكل: [{\"q\":\"\u0627لسؤال\",\"opts\":[\"أ\",\"ب\",\"ج\",\"د\"],\"ok\":0}] حيث ok هو رقم الإجابة الصحيحة من 0. بلا نص خارج JSON."},
        {role:"user",content:"الصف: "+grade+"\nالمادة: "+subject+"\nالموضوع: "+topic}
      ]
    })
  });
  if(!res.ok) throw new Error("xai "+res.status);
  var json=await res.json();
  var text=((json.choices||[])[0]||{}).message && json.choices[0].message.content || "";
  var m=text.match(/\[[\s\S]*\]/);
  if(!m) throw new Error("nojson");
  var arr=JSON.parse(m[0]);
  return arr.filter(function(x){return x && x.q && x.opts && x.opts.length>=2;}).map(function(x){
    return {q:String(x.q), opts:x.opts.map(String), ok:Number(x.ok)||0};
  });
};
Hassad.saveHw=async function(e){
  e.preventDefault();
  var topic=(document.getElementById("hw-topic")||{}).value || "";
  topic=topic.trim();
  var title=(document.getElementById("hw-title")||{}).value || "";
  var key=localStorage.getItem("hassad-xai-key")||((document.getElementById("xai-key")||{}).value||"").trim();
  if(key) localStorage.setItem("hassad-xai-key", key);
  var questions=[];
  if(topic && key){
    Hassad.toast("جارٍ توليد الواجب بـ xAI...");
    try{ questions=await Hassad.xaiMake(topic, (document.getElementById("hw-subject")||{}).value||"math", (document.getElementById("hw-grade")||{}).value||"", key); }
    catch(err){ Hassad.toast("تعذّر التوليد. تحقق من المفتاح أو اكتب الأسئلة يدوياً."); }
  } else if(topic && typeof parseQuestions==="function"){
    questions=parseQuestions(topic);
  }
  var data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  data.assignments=data.assignments||[];
  data.assignments.unshift({
    id:"a"+Date.now(),
    subject_id:document.getElementById("hw-subject").value,
    grade:(document.getElementById("hw-grade")||{}).value||"",
    title:title,
    topic:topic,
    due_date:document.getElementById("hw-due").value,
    created_at:new Date().toISOString().slice(0,10),
    questions:questions,
    description:questions.length?(questions.length+" أسئلة"):"واجب"
  });
  localStorage.setItem("hassad-db", JSON.stringify(data));
  Hassad.toast(questions.length?("نُشر بـ "+questions.length+" أسئلة"):"نُشر الواجب");
  Hassad.renderAdmin();
  e.target.reset();
};
