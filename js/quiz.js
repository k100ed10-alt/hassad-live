function parseQuestions(text){
  var raw=String(text||"").replace(/\r/g,"\n").trim();
  if(!raw) return [];
  var chunks=raw.split(/\n\s*\n+/);
  if(chunks.length<2){
    chunks=raw.split(/(?=^\s*س\s*[:：])/m).filter(function(x){return x.trim();});
  }
  var out=[];
  chunks.forEach(function(block){
    var lines=block.split(/\n/).map(function(l){return l.trim();}).filter(Boolean);
    if(!lines.length) return;
    var q=lines[0].replace(/^س\s*[:：]\s*/,"").replace(/^\d+[\.\)\-]\s*/,"").trim();
    var opts=[]; var ok=0;
    lines.slice(1).forEach(function(line){
      var m=line.match(/^(?:[-*•]|[أابجدA-Da-d1-4])[\)\.\-\u060c:]\s*(.+)$/);
      if(!m) m=line.match(/^[أبجد]\)\s*(.+)$/);
      if(!m) return;
      var t=m[1].trim();
      var star=/\*|صحيح|√/.test(line);
      t=t.replace(/^[\*\s]+/,"").replace(/\s*[\*√]\s*$/,"").replace(/صحيح/g,"").trim();
      if(star) ok=opts.length;
      if(t) opts.push(t);
    });
    if(q && opts.length>=2) out.push({q:q,opts:opts,ok:ok});
  });
  return out;
}
function arN(n){return String(n).replace(/[0-9]/g,function(d){return "٠١٢٣٤٥٦٧٨٩"[d];});}
function pushPoints(uid, rec, subId, sub){
  try{
    if(window.HassadFB && uid){
      HassadFB.init().then(function(){
        HassadFB.put("students", uid, rec);
        if(subId) HassadFB.put("submissions", subId, sub);
      });
    }
  }catch(e){}
}
Hassad.startQuiz=function(assignmentId){
  const user=(Hassad.currentUser&&Hassad.currentUser())||JSON.parse(localStorage.getItem("hassad-user")||"null");
  const data=JSON.parse(localStorage.getItem("hassad-db")||"{}");
  const a=(data.assignments||[]).find(function(x){return x.id===assignmentId;});
  const box=document.getElementById("quiz-box");
  if(!box){location.href="subject.html?id=math";return;}
  if(!a){alert("الواجب غير موجود");return;}
  data.submissions=data.submissions||{};
  data.students=data.students||{};
  const sid=assignmentId+"_"+(user&&user.uid);
  const done=data.submissions[sid];
  box.style.display="block";
  box.innerHTML='<h3 style="color:#0e5160;margin-bottom:8px">'+a.title+'</h3><div id="quiz-body"></div><p id="quiz-score"></p>';
  const body=document.getElementById("quiz-body");
  const qs=a.questions||[];
  if(!qs.length){ body.innerHTML="<p>لا أسئلة في هذا الواجب</p>"; return; }
  qs.forEach(function(item,qi){
    const div=document.createElement("div");
    div.className="card"; div.style.marginBottom="10px";
    div.innerHTML="<strong>"+arN(qi+1)+") "+item.q+"</strong><div style=\"margin-top:8px\">"+(item.opts||[]).map(function(o,oi){
      return '<button class="qbtn" data-q="'+qi+'" data-o="'+oi+'" style="display:block;width:100%;text-align:right;margin:6px 0;padding:10px;border-radius:12px;border:1px solid #d9d0bc;background:#fff">'+o+'</button>';
    }).join("")+"</div>";
    body.appendChild(div);
  });
  if(done) document.getElementById("quiz-score").textContent="سُجِّل: "+arN(done.score||0)+" من "+arN(done.total||qs.length);
  const answers={};
  body.querySelectorAll(".qbtn").forEach(function(btn){
    btn.onclick=function(){
      if(done) return;
      const qi=+btn.dataset.q, oi=+btn.dataset.o;
      const item=qs[qi];
      const wrap=btn.parentElement;
      wrap.querySelectorAll("button").forEach(function(b){b.disabled=true;});
      if(oi===item.ok){btn.style.background="#e5f6ec";answers[qi]=true;}
      else {btn.style.background="#ffe4e8";answers[qi]=false; if(wrap.querySelectorAll("button")[item.ok]) wrap.querySelectorAll("button")[item.ok].style.background="#e5f6ec";}
      if(Object.keys(answers).length===qs.length){
        const correct=Object.values(answers).filter(Boolean).length;
        const pts=correct*10;
        const sub={status:"submitted",score:correct,total:qs.length,points:pts,name:(user&&user.name)||"طالب",grade:(user&&user.grade)||"",assignmentId:assignmentId,at:Date.now()};
        data.submissions[sid]=sub;
        if(user && user.uid){
          var rec=data.students[user.uid]||{name:user.name,email:user.email,phone:user.phone,grade:user.grade,subscription_status:"active",points:0,streak:0};
          rec.points=(Number(rec.points)||0)+pts;
          data.students[user.uid]=rec;
          pushPoints(user.uid, rec, sid, sub);
        }
        localStorage.setItem("hassad-db",JSON.stringify(data));
        document.getElementById("quiz-score").textContent="النتيجة: "+arN(correct)+" من "+arN(qs.length)+" — +"+arN(pts)+" نقطة";
      }
    };
  });
};
