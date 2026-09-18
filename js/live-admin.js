document.addEventListener("DOMContentLoaded",function(){
  const embed=document.getElementById("live-embed");
  if(!embed||document.getElementById("live-rec")) return;
  const wrap=document.createElement("div");
  wrap.className="field";
  wrap.innerHTML='<label>رابط التسجيل (أرشيف بعد الحصة)</label><input id="live-rec" dir="ltr" placeholder="https://youtube.com/watch?v=...">';
  embed.parentElement.after(wrap);
});
