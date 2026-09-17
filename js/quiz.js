function parseQuestions(text){
  const raw=(text||"").trim();
  if(!raw) return [];
  const blocks=raw.split(/\n\s*\n|(?=^\s*(?:س[:：]|\d+[\.\)\-]\s))/m).map(b=>b.trim()).filter(Boolean);
  const out=[];
  blocks.forEach(block=>{
    const lines=block.split(/\n/).map(l=>l.trim()).filter(Boolean);
    if(!lines.length) return;
    let q=lines[0].replace(/^س[:：]\s*/,"").replace(/^\d+[\.\)\-]\s*/,"");
    const opts=[]; let ok=0;
    lines.slice(1).forEach(line=>{
      const m=line.match(/^(?:[-*]|أ|[أابجد1-4]\)|[A-Da-d]\))\s*(.+)$/);
      const m2=line.match(/^(?:[-*]|[أابجد]\)|[A-Da-d1-4]\))\s*(.+)$/);
      const mm=m2||m; if(!mm) return;
      let t=mm[1].trim();
      const star=/\*|صحيح|√/.test(line);
      t=t.replace(/\s*(\*|صحيح|√)\s*$/,"").trim();
      if(star) ok=opts.length;
      opts.push(t);
    });
    if(q && opts.length>=2) out.push({q,opts,ok});
  });
  return out;
}
function arN(n){return String(n).replace(/[0-9]/g,d=>"٠١٢٣٤٥٦٧٨٩"[d])}
Hassad.saveHw=function(e){
  e.preventDefault();
  const el=document.getElementById("hw-questions");
  const questions=parseQuestions(el?el.value:"");
  const data=JSON.parse(localStorage.getItem("hassad-db"));
  data.assignments.unshift({
    id:"a"+Date.now(),
    subject_id:document.getElementById("hw-subject").value,
    title:document.getElementById("hw-title").value,
    description:questions.length?arN(questions.length)+" أسئلة تفاعلية":"واجب",
    due_date:document.getElementById("hw-due").value,
    created_at:new Date().toISOString().slice(0,10),
    questions
  });
  localStorage.setItem("hassad-db",JSON.stringify(data));
  Hassad.toast(questions.length?"نُشر الواجب مع "+arN(questions.length)+" أسئلة":"نُشر الواجب");
  Hassad.renderAdmin();
  e.target.reset();
};
Hassad.startQuiz=function(assignmentId){
  const user=Hassad.currentUser();
  const data=JSON.parse(localStorage.getItem("hassad-db"));
  const a=(data.assignments||[]).find(x=>x.id===assignmentId);
  const box=document.getElementById("quiz-box");
  if(!box){location.href="subject.html?id="+(a?a.subject_id:"math");return;}
  if(!a||!a.questions||!a.questions.length){Hassad.toast("لا توجد أسئلة");return;}
  Hassad.switchTab("hw", document.querySelectorAll(".tab")[2]||document.querySelector(".tab"));
  const done=data.submissions[assignmentId+"_"+user.uid];
  box.style.display="block";
  box.innerHTML=`<h3 style="color:var(--teal-900);margin-bottom:8px">${a.title}</h3><div id="quiz-body"></div><p class="hint" id="quiz-score"></p>`;
  const body=document.getElementById("quiz-body");
  a.questions.forEach((item,qi)=>{
    const div=document.createElement("div");
    div.className="card"; div.style.marginBottom="10px";
    div.innerHTML=`<strong>${arN(qi+1)}) ${item.q}</strong><div class="list" style="margin-top:8px">${item.opts.map((o,oi)=>`<button class="btn-outline qbtn" data-q="${qi}" data-o="${oi}" style="color:var(--teal-900);border-color:#d9d0bc;width:100%;text-align:right">${o}</button>`).join("")}</div>`;
    body.appendChild(div);
  });
  if(done) document.getElementById("quiz-score").textContent=`سُجّل سابقاً: ${arN(done.score||0)} من ${arN(done.total||a.questions.length)}`;
  const answers={};
  body.querySelectorAll(".qbtn").forEach(btn=>{
    btn.onclick=()=>{
      if(done) return;
      const qi=+btn.dataset.q, oi=+btn.dataset.o;
      const item=a.questions[qi];
      const wrap=btn.parentElement;
      wrap.querySelectorAll("button").forEach(b=>b.disabled=true);
      if(oi===item.ok){btn.style.background="#e5f6ec";btn.style.borderColor="#1b7a4a";answers[qi]=true;}
      else {btn.style.background="#ffe4e8";btn.style.borderColor="#b42318";wrap.querySelectorAll("button")[item.ok].style.background="#e5f6ec";answers[qi]=false;}
      const total=a.questions.length;
      const correct=Object.values(answers).filter(Boolean).length;
      if(Object.keys(answers).length===total){
        const pts=correct*10;
        data.submissions[assignmentId+"_"+user.uid]={status:"submitted",score:correct,total,points:pts};
        localStorage.setItem("hassad-db",JSON.stringify(data));
        const prog=JSON.parse(localStorage.getItem("hassad-prog")||"{}");
        prog.points=(prog.points||0)+pts; localStorage.setItem("hassad-prog",JSON.stringify(prog));
        document.getElementById("quiz-score").textContent=`النتيجة: ${arN(correct)} من ${arN(total)} — +${arN(pts)} نقطة`;
        Hassad.toast("+"+arN(pts)+" نقطة");
      }
    };
  });
};
const _rs=Hassad.renderSubject;
Hassad.renderSubject=function(){
  _rs();
  const user=Hassad.currentUser(); if(!user) return;
  const id=new URLSearchParams(location.search).get("id")||"math";
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const hw=document.getElementById("hw"); if(!hw) return;
  hw.innerHTML=(data.assignments||[]).filter(a=>a.subject_id===id).map(a=>{
    const sub=data.submissions[a.id+"_"+user.uid];
    const n=(a.questions||[]).length;
    const label=n?(sub?"مشاهدة النتيجة":"ابدأ النشاط"):(sub?"تم":"تسليم");
    return `<div class="row"><div><strong>${a.title}</strong><div style="color:var(--muted);font-size:13px">${n?arN(n)+" أسئلة":"واجب"}${sub&&sub.score!=null?" — "+arN(sub.score)+"/‏"+arN(sub.total):""}</div></div><button class="btn" onclick="Hassad.startQuiz('${a.id}')">${label}</button></div>`;
  }).join("")||"<p class='hint'>لا واجبات بعد</p>";
};
