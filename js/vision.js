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
function rewritePrompt(extra){
  return "أنت معلم رياضيات عماني. أعد صياغة كل الأسئلة بلغة واضحة للطالب. لا تختصر الورقة. حوّل كل فراغ وكل بند إلى سؤال مستقل اختيار من متعدد.\nاكتب بالعربية فقط بهذا الشكل:\n\nس: نص السؤال بوضوح\nأ) الخيار الأول\nب) الخيار الثاني\nج) الخيار الثالث\nد) الخيار الرابع\n\nضع علامة * في نهاية سطر الإجابة الصحيحة فقط، مثال: ب) ٣,٥ *\nلا تضع النجمة قبل الرقم. افصل كل سؤال بسطر فارغ.\n"+(extra||"");
}
Hassad.convertImage=async function(){
  const key=xaiKey();
  const img=document.getElementById("hw-preview");
  const out=document.getElementById("hw-questions");
  const msg=document.getElementById("convert-msg");
  if(!key || key.indexOf("xai-")!==0){if(msg) msg.textContent="احفظ مفتاح xAI من لوحة المدير أولاً"; return;}
  if(!img||!img.src||img.style.display==="none"){if(msg) msg.textContent="ارفع الصورة أولاً"; return;}
  if(msg) msg.textContent="جارٍ قراءة الورقة وإعادة صياغتها...";
  const imageUrl=await shrinkImage(img.src);
  const prompt=rewritePrompt("اقرأ الصورة كاملة: النشاط الجماعي والتدريبي والإثرائي والتقويم الختامي.");
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
        if(msg) msg.textContent=n?("صيغت "+n+" أسئلة. يمكنك تعديل النص أو تحسين الصياغة ثم انشر."):"راجع النص وعدّله يدوياً أو اضغط حسّن الصياغة.";
        return;
      }
      lastErr=(data.error&&(data.error.message||data.error))||("رفض "+res.status);
    }
    if(msg) msg.textContent=String(lastErr);
  }catch(err){
    if(msg) msg.textContent="تعذر الاتصال. عدّل النص يدوياً أو أعد المحاولة.";
  }
};
Hassad.rewriteQuestions=async function(){
  const key=xaiKey();
  const out=document.getElementById("hw-questions");
  const msg=document.getElementById("convert-msg");
  const raw=(out&&out.value||"").trim();
  if(!key || key.indexOf("xai-")!==0){if(msg) msg.textContent="احفظ مفتاح xAI أولاً"; return;}
  if(!raw){if(msg) msg.textContent="حوّل الصورة أولاً أو اكتب الأسئلة"; return;}
  if(msg) msg.textContent="جارٍ تحسين صياغة الأسئلة...";
  try{
    var res=await fetch("https://api.x.ai/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
      body:JSON.stringify({
        model:"grok-2-1212",
        temperature:0.3,
        messages:[
          {role:"system",content:rewritePrompt("حافظ على نفس الإجابات الصحيحة.")},
          {role:"user",content:raw}
        ]
      })
    });
    var data=await res.json().catch(function(){return {};});
    if(!res.ok){ if(msg) msg.textContent=(data.error&&data.error.message)||"تعذر التحسين"; return; }
    var text=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||"";
    out.value=String(text).replace(/^```[a-z]*\n?|```$/g,"").trim();
    var n=typeof parseQuestions==="function"?parseQuestions(out.value).length:0;
    if(msg) msg.textContent=n?("حُسّنت صياغة "+n+" أسئلة. راجع ثم انشر."):"حُسّن النص. راجعه قبل النشر.";
  }catch(e){
    if(msg) msg.textContent="تعذر تحسين الصياغة من المتصفح. عدّل النص بيدك.";
  }
};
