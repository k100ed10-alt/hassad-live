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
      var m=line.match(/^[أبجدA-Da-d1-4][\)\.\u060c:]\s*(.+)$/);
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
function esc(s){return String(s||"").replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">");}
function mathText(s){
  var raw=String(s||"");
  var neg=/(^|[^=])\s*[-\u2212\u2013\u2014]\s*[\d\u0660-\u0669]/.test(raw) || /[\d\u0660-\u0669]\s*[-\u2212]\s*$/.test(raw);
  if(neg){
    var num=raw.replace(/[\s*\u2212\u2013\u2014\-]/g," ").replace(/سالب/g,"").replace(/\s+/g," ").trim();
    return esc("سالب "+num);
  }
  return esc(raw);
}
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
function markChoice(wrap, item, oi){
  var buttons=wrap.querySelectorAll("button");
  buttons.forEach(function(b){ b.disabled=true; });
  var ok=Number(item.ok)||0;
  if(buttons[ok]) buttons[ok].style.background="#e5f6ec";
  if(oi!==ok && buttons[oi]) buttons[oi].style.background="#ffe4e8";
  return oi===ok;
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
  const sid=assignmentId+"_"+(user&&(user.uid||user.phone)||"guest");
  var done=data.submissions[sid];
  box.style.display="block";
  box.innerHTML='<h3 style="color:#0e5160;margin-bottom:8px">'+esc(a.title)+'</h3><div id="quiz-body"></div><p id="quiz-score"></p>';
  const body=document.getElementById("quiz-body");
  const qs=a.questions||[];
  if(!qs.length){ body.innerHTML="<p>لا أسئلة في هذا الواجب</p>"; return; }
  qs.forEach(function(item,qi){
    const div=document.createElement("div");
    div.className="card"; div.style.marginBottom="10px";
    div.innerHTML="<strong>"+arN(qi+1)+") "+mathText(item.q)+"</strong><div style=\"margin-top:8px\">"+(item.opts||[]).map(function(o,oi){
      return '<button class="qbtn" data-q="'+qi+'" data-o="'+oi+'" style="display:block;width:100%;text-align:right;margin:6px 0;padding:10px 14px;border-radius:12px;border:1px solid #d9d0bc;background:#fff">'+mathText(o)+'</button>';
    }).join("")+"</div>";
    body.appendChild(div);
  });
  if(done){
    document.getElementById("quiz-score").textContent="سُجِّل: "+arN(done.score||0)+" من "+arN(done.total||qs.length);
    body.querySelectorAll(".card").forEach(function(card,qi){
      var item=qs[qi]; if(!item) return;
      var wrap=card.querySelector("div");
      var buttons=wrap.querySelectorAll("button");
      if(buttons[item.ok||0]) buttons[item.ok||0].style.background="#e5f6ec";
    });
  }
  const answers={};
  body.querySelectorAll(".qbtn").forEach(function(btn){
    btn.onclick=function(){
      const qi=+btn.dataset.q, oi=+btn.dataset.o;
      const item=qs[qi];
      const wrap=btn.parentElement;
      if(wrap.getAttribute("data-locked")) return;
      wrap.setAttribute("data-locked","1");
      var good=markChoice(wrap, item, oi);
      answers[qi]=good;
      if(done) return;
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
