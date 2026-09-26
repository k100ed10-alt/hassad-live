Hassad.saveKey=function(){
  const k=(document.getElementById("xai-key")||{}).value||"";
  localStorage.setItem("hassad-xai-key",k.trim());
};
function shrinkImage(src){
  return new Promise(function(resolve){
    var im=new Image();
    im.onload=function(){
      var max=1200, w=im.width, h=im.height;
      if(w>max){ h=Math.round(h*max/w); w=max; }
      var c=document.createElement("canvas"); c.width=w; c.height=h;
      c.getContext("2d").drawImage(im,0,0,w,h);
      resolve(c.toDataURL("image/jpeg",0.72));
    };
    im.onerror=function(){ resolve(src); };
    im.src=src;
  });
}
Hassad.convertImage=async function(){
  const key=localStorage.getItem("hassad-xai-key")||"";
  const img=document.getElementById("hw-preview");
  const out=document.getElementById("hw-questions");
  const msg=document.getElementById("convert-msg");
  if(!key || key.indexOf("xai-")!==0){if(msg) msg.textContent="احفظ مفتاح xAI من لوحة المدير أولاً"; return;}
  if(!img||!img.src||img.style.display==="none"){if(msg) msg.textContent="ارفع الصورة أولاً"; return;}
  if(msg) msg.textContent="جارٍ تجهيز الصورة...";
  const imageUrl=await shrinkImage(img.src);
  const prompt="اقرأ ورقة الأسئلة بالعربية. حوّل كل فراغ إلى سؤال اختيار من متعدد. أرجع فقط:\n\nس: السؤال\nأ) خيار\nب) خيار\nج) خيار\nد) خيار\n\nضع * بعد الإجابة الصحيحة.";
  const models=["grok-2-vision-1212","grok-2-vision","grok-4"];
  async function callModel(model){
    const res=await fetch("https://api.x.ai/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+key.trim()},
      body:JSON.stringify({
        model:model,
        temperature:0,
        messages:[{role:"user",content:[
          {type:"image_url",image_url:{url:imageUrl,detail:"high"}},
          {type:"text",text:prompt}
        ]}]
      })
    });
    const data=await res.json().catch(function(){return {};});
    return {ok:res.ok, data:data, status:res.status};
  }
  try{
    var lastErr="";
    for(var i=0;i<models.length;i++){
      if(msg) msg.textContent="جارٍ التحويل...";
      var r=await callModel(models[i]);
      if(r.ok){
        var text=(r.data.choices&&r.data.choices[0]&&r.data.choices[0].message&&r.data.choices[0].message.content)||"";
        text=String(text).replace(/^```[a-z]*\n?|```$/g,"").trim();
        out.value=text;
        var n=typeof parseQuestions==="function"?parseQuestions(text).length:0;
        if(msg) msg.textContent=n?("تم استخراج "+n+" أسئلة. راجع ثم انشر."):"قرأت الصورة. راجع النص.";
        return;
      }
      lastErr=(r.data.error&&(r.data.error.message||r.data.error))||("رفض "+r.status);
    }
    if(msg) msg.textContent=String(lastErr);
  }catch(err){
    if(msg) msg.textContent="تعذر الاتصال. أعد المحاولة من واي فاي أو الصق الأسئلة.";
  }
};
