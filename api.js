// Talks to the Google Sheet database. Needs the team password from the sheet's Settings tab.
window.MNCF_API = "https://script.google.com/macros/s/AKfycbwZXJWqdwfEazAzIQagVfHfXDbVrp-C-BkceyAnUQrkfRpZYexlhKxloQmLPyZ0PAq1/exec";
(function(){
  const KEY="mncf-team-key";
  const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
  const set=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
  let gateP=null;
  function askKey(wrong){
    if(gateP) return gateP;
    gateP=new Promise(res=>{
      const g=document.createElement("div");g.className="gate";
      g.innerHTML=`<form><h2>Team password</h2><p class="note">${wrong?'<span class="err">That password didn\'t work.</span> ':''}Type the password from the Settings tab of the show sheet. This phone remembers it.</p><input type="password" id="teamKey" autocomplete="current-password" required><div class="btns"><button class="pri" type="submit">Continue</button></div></form>`;
      document.body.appendChild(g);
      const f=g.querySelector("form");setTimeout(()=>g.querySelector("input").focus(),50);
      f.addEventListener("submit",ev=>{ev.preventDefault();set(KEY,g.querySelector("input").value.trim());g.remove();gateP=null;res()});
    });
    return gateP;
  }
  async function api(action,data){
    if(!get(KEY)) await askKey(false);
    let r;
    try{
      r=await fetch(window.MNCF_API,{method:"POST",body:JSON.stringify(Object.assign({action,key:get(KEY)},data||{}))});
    }catch(e){throw new Error("Can't reach the show sheet. Check the internet connection.")}
    const j=await r.json();
    if(!j.ok&&j.error==="password"){set(KEY,null);await askKey(true);return api(action,data)}
    if(!j.ok&&j.error==="nopassword") throw new Error("No team password is set yet. Type one in the Settings tab of the show sheet.");
    if(!j.ok) throw new Error(j.error||"The sheet couldn't do that.");
    return j;
  }
  window.mncfApi=api;
  window.mncfForget=()=>set(KEY,null);
  window.mncfCache={get:k=>{try{return JSON.parse(get("mncf-cache-"+k))}catch(e){return null}},set:(k,v)=>set("mncf-cache-"+k,JSON.stringify(v))};
  window.mncfEsc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  window.mncfToast=t=>{let el=document.getElementById("toast");if(!el){el=document.createElement("div");el.id="toast";el.className="toast";document.body.appendChild(el)}el.textContent=t;el.classList.add("show");clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove("show"),2200)};
  window.mncfQuery=k=>new URLSearchParams(location.search).get(k)||"";
})();
