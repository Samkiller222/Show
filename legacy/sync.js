// Google Sheet sync. Paste the Apps Script web app URL between the quotes.
window.MNCF_SYNC_URL = "https://script.google.com/macros/s/AKfycbwZXJWqdwfEazAzIQagVfHfXDbVrp-C-BkceyAnUQrkfRpZYexlhKxloQmLPyZ0PAq1/exec";
(function(){
  let timer=null, pending={}, last={}, seen={};
  const fmt=()=>new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
  function status(t,bad){const el=document.getElementById("syncState");if(el){el.textContent=t;el.className="save"+(bad?" bad":"")}}
  async function flush(){
    const url=window.MNCF_SYNC_URL; if(!url) return;
    const tabs=Object.entries(pending).map(([name,rows])=>({name,rows})); if(!tabs.length) return;
    pending={};
    try{
      await fetch(url,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({tabs})});
      tabs.forEach(t=>last[t.name]=JSON.stringify(t.rows));
      status("Sent to Google Sheet "+fmt());
    }catch(e){
      tabs.forEach(t=>{if(!pending[t.name])pending[t.name]=t.rows});
      status("Google Sheet not reached. Retrying…",true);
      clearTimeout(timer);timer=setTimeout(flush,15000);
    }
  }
  window.mncfSync=function(tab,rows){
    if(!window.MNCF_SYNC_URL){status("");return}
    if(last[tab]===JSON.stringify(rows)) return;
    // On page open, never send a blank table: it would wipe results sent from another device.
    if(!(tab in seen)){seen[tab]=1;const hasData=rows.slice(1).some(r=>r.some((v,i)=>i>=4&&v!==""&&v!=null));if(!hasData){last[tab]=JSON.stringify(rows);return}}
    pending[tab]=rows; status("Sending to Google Sheet…");
    clearTimeout(timer); timer=setTimeout(flush,2000);
  };
  window.addEventListener("online",()=>{clearTimeout(timer);flush()});
})();
