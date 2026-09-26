Hassad.saveKey=function(){
  const k=(document.getElementById("xai-key")||{}).value||"";
  localStorage.setItem("hassad-xai-key",k.trim());
};
function shrinkImage(src){
  return new Promise(function(resolve){
    var im=new Image();
    im.onload=function(){
      var max=1400, w=im.width, h=im.height;
      if(w>max){ h=Math.round(h*max/w); w=max; }
      var c=document.createElement("canvas"); c.width=w; c.height=h;
      c.getContext("2d").drawImage(im,0,0,w,h);
      resolve(c.toDataURL("image/jpeg",0.8));
    };
    im.onerror=function(){ resolve(src); };
    im.src=src;
  });
}
function xaiKey(){ return (localStorage.getItem("hassad-xai-key")||"").trim(); }
Hassad.convertImage=async function(){
  const key=xaiKey();
  const img=document.getElementById("hw-preview");
  const out=document.getElementById("hw-questions");
  const msg=document.getElementById("convert-msg");
  const note=((document.getElementById("hw-style")||{}).value||"").trim();
  if(!key || key.indexOf("xai-")!==0){if(msg) msg.textContent="احفظ مفتاح xAI من لوحة المدير أولاً"; return;}
  if(!img||!img.src||img.style.display==="none"){if(msg) msg.textContent="ارفع الصورة أولاً"; return;}
  if(msg) msg.textContent="جارٍ التحويل حسب تعليماتك...";
  const imageUrl=await shrinkImage(img.src);
  const prompt="حوّل ورقة الواجب إلى أسئلة اختيار من متعدد بالعربية.\nالشكل فقط:\n\nس: السؤال\nأ) خيار\nب) خيار\nج) خيار\nد) خيار\n\nضع * في نهاية سطر الإجابة الصحيحة.\nتعليمات المعلم:\n"+(note||"صغ الأسئلة بوضوح لطالب المرحلة، غطِّ كل بنود الورقة.");
  const models=["grok-2-vision-1212","grok-2-vision","grok-4"];
  try{
    var lastErr="";
    for(var i=0;i<models.length;i++){
      var res=await fetch("https://api.x.ai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
        body:JSON.stringify({
          model:models[i], temperature:0.2,
          messages:[{role:"user",content:[
            {type:"image_url",image_url:{url:imageUrl,detail:"high"}},
            {type:"text",text:prompt}
          ]}]
        })
      });
      var data=await res.json().catch(function(){return {};});
      if(res.ok){
        var text=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||"";
        out.value=String(text).replace(/^```[a-z]*\n?|```$/g,"").trim();
        var n=typeof parseQuestions==="function"?parseQuestions(out.value).length:0;
        if(msg) msg.textContent=n?("تم استخراج "+n+" أسئلة. راجع ثم انشر."):"راجع النص قبل النشر.";
        return;
      }
      lastErr=(data.error&&(data.error.message||data.error))||("رفض "+res.status);
    }
    if(msg) msg.textContent=String(lastErr);
  }catch(err){
    if(msg) msg.textContent="تعذر الاتصال. أعد المحاولة.";
  }
};
