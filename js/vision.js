Hassad.saveKey=function(){
  const k=(document.getElementById("xai-key")||{}).value||"";
  localStorage.setItem("hassad-xai-key",k.trim());
  Hassad.toast(k?"حُفظ المفتاح":"مسح المفتاح");
};
Hassad.convertImage=async function(){
  const key=localStorage.getItem("hassad-xai-key")||(document.getElementById("xai-key")||{}).value;
  const img=document.getElementById("hw-preview");
  const out=document.getElementById("hw-questions");
  const msg=document.getElementById("convert-msg");
  if(!key){if(msg) msg.textContent="الصق مفتاح xAI أولاً من console.x.ai"; return;}
  if(!img||!img.src||img.style.display==="none"){if(msg) msg.textContent="ارفع الصورة أولاً"; return;}
  localStorage.setItem("hassad-xai-key",key.trim());
  if(msg) msg.textContent="جارٍ قراءة الصورة...";
  const prompt="اقرأ ورقة الأسئلة. أرجع فقط نصاً عربياً بهذا الشكل بدون شرح:\n\nس: السؤال\nأ) خيار\nب) خيار\nج) خيار\nد) خيار\n\nضع * بعد الإجابة الصحيحة. إذا لم تكن الأسئلة اختياراً حوّلها إلى اختيار من متعدد. فصل بين الأسئلة بسطر فارغ.";
  try{
    const res=await fetch("https://api.x.ai/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+key.trim()},
      body:JSON.stringify({
        model:"grok-4-fast-non-reasoning",
        temperature:0,
        messages:[{role:"user",content:[
          {type:"image_url",image_url:{url:img.src,detail:"high"}},
          {type:"text",text:prompt}
        ]}]
      })
    });
    const data=await res.json();
    if(!res.ok){
      if(msg) msg.textContent=data.error&&data.error.message?data.error.message:"رفض الواجهة. تحقق من المفتاح والرصيد.";
      return;
    }
    let text=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||"";
    text=text.replace(/^```[a-z]*\n?|```$/g,"").trim();
    out.value=text;
    const n=parseQuestions(text).length;
    if(msg) msg.textContent=n?"تم استخراج "+String(n).replace(/[0-9]/g,d=>"٠١٢٣٤٥٦٧٨٩"[d])+" أسئلة. راجع ثم انشر.":"قرأت الصورة لكن راجع النص قبل النشر.";
  }catch(err){
    if(msg) msg.textContent="المتصفح منع الاتصال المباشر بواجهة xAI (غالباً CORS). الحل: افتح اللوحة من جهاز فيه إضافة تسمح الطلب؁ أو أرسل الصورة هنا للتحويل.";
  }
};
