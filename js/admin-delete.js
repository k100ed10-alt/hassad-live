function readDb(){return JSON.parse(localStorage.getItem("hassad-db")||"{}")}
function writeDb(d){localStorage.setItem("hassad-db",JSON.stringify(d))}
Hassad.deleteSelected=function(kind){
  const boxes=[...document.querySelectorAll('input[data-kind="'+kind+'"]:checked')];
  if(!boxes.length){alert("علّم على العناصر أولاً");return;}
  if(!confirm("حذف "+boxes.length+" عنصر؟")) return;
  const data=readDb();
  const ids=new Set(boxes.map(b=>String(b.value)));
  if(kind==="student") ids.forEach(id=>delete data.students[id]);
  if(kind==="live") data.live_sessions=(data.live_sessions||[]).filter((l,i)=>!ids.has(String(l.id||i)));
  if(kind==="hw") data.assignments=(data.assignments||[]).filter(a=>!ids.has(String(a.id)));
  writeDb(data); Hassad.renderAdmin();
};
Hassad.toggleAll=function(kind,el){
  document.querySelectorAll('input[data-kind="'+kind+'"]').forEach(b=>b.checked=el.checked);
};
const _ra=Hassad.renderAdmin;
Hassad.renderAdmin=function(){
  _ra();
  const data=readDb();
  const st=document.getElementById("students");
  if(st) st.innerHTML=Object.entries(data.students||{}).map(([uid,s])=>`<tr>
    <td><input type="checkbox" data-kind="student" value="${uid}"></td>
    <td>${s.name}</td><td>${s.email}</td><td><code>${s.password||""}</code></td>
    <td>${s.grade||""}</td>
    <td><span class="badge ${s.subscription_status==="active"?"badge-done":"badge-live"}">${s.subscription_status==="active"?"نشط":"موقوف"}</span></td>
  </tr>`).join("");
  const lt=document.getElementById("live-table");
  if(lt) lt.innerHTML=(data.live_sessions||[]).map((l,i)=>`<tr>
    <td><input type="checkbox" data-kind="live" value="${l.id||i}"></td>
    <td>${(data.subjects[l.subject_id]||{}).name||""}</td>
    <td>${l.title||""}</td><td>${l.scheduled_time||""}</td>
    <td>${l.stream_url?"مربوط":"—"}</td>
  </tr>`).join("");
  const hw=document.getElementById("admin-hw");
  if(hw) hw.innerHTML=(data.assignments||[]).map(a=>`<label class="row" style="cursor:pointer">
    <span style="display:flex;align-items:center;gap:10px">
      <input type="checkbox" data-kind="hw" value="${a.id}">
      <strong>${a.title}</strong>
    </span>
    <span class="hint">${a.grade||""}</span>
  </label>`).join("")||"<p class='hint'>لا واجبات</p>";
};
