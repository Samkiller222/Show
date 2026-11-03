// App shell shared by every page: a top bar with a burger menu, a drawer for finding shows and settings,
// and bottom tabs (Entries / Awards / Results) whenever a show is open.
// Usage: <script src="shell.js"></script> then mncfShell({page:"entries"|"awards"|"results"|"shows"|"breeds"|"import", title:"…"})
(function(){
  const css=`
:root{--tap:46px}
body{font-size:16px}
body.has-tabs{padding-bottom:calc(70px + env(safe-area-inset-bottom,0px))}
body.has-pager{padding-bottom:calc(136px + env(safe-area-inset-bottom,0px))}
header > .nav{display:none!important}
input,select,textarea{font-size:16px!important}
input[type=text],input[type=email],input[type=tel],input[type=password],select{min-height:var(--tap)}
button,a.btn{min-height:42px}
.given{font-size:14px!important}
.given input{width:24px!important;height:24px!important}
.appbar{display:flex;align-items:center;gap:10px;margin:0 0 6px}
.appbar .burger{flex:none;width:44px;height:44px;border-radius:10px;border:1px solid var(--line);background:var(--bg);display:inline-flex;align-items:center;justify-content:center;padding:0;cursor:pointer;color:var(--fg)}
.appbar .burger svg{width:22px;height:22px}
.appbar .crumb{min-width:0;flex:1;display:flex;flex-direction:column}
.appbar .crumb small{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600}
.appbar .crumb b{font-family:var(--display);font-size:20px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.drawer-bg{position:fixed;inset:0;z-index:40;background:rgba(10,12,20,.45);opacity:0;pointer-events:none;transition:opacity .2s}
.drawer{position:fixed;top:0;bottom:0;left:0;z-index:41;width:min(86vw,360px);background:var(--card);color:var(--fg);border-right:1px solid var(--line);transform:translateX(-102%);transition:transform .22s ease;display:flex;flex-direction:column;
  padding:calc(14px + env(safe-area-inset-top,0px)) 16px calc(16px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));overflow-y:auto;gap:14px}
body.drawer-open .drawer{transform:none}
body.drawer-open .drawer-bg{opacity:1;pointer-events:auto}
body.drawer-open{overflow:hidden}
.drawer h3{margin:0;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700}
.drawer .dhead{display:flex;justify-content:space-between;align-items:center}
.drawer .dhead b{font-family:var(--display);font-size:22px;text-transform:uppercase;letter-spacing:.03em}
.drawer .close{width:40px;height:40px;border-radius:10px;border:1px solid var(--line);background:var(--bg);font-size:22px;line-height:1;color:var(--fg)}
.drawer .sec{display:flex;flex-direction:column;gap:6px}
.drawer a.item,.drawer button.item{display:flex;align-items:center;justify-content:space-between;gap:8px;text-decoration:none;color:var(--fg);padding:11px 12px;border-radius:10px;border:1px solid transparent;background:none;font:inherit;text-align:left;width:100%}
.drawer a.item:hover,.drawer button.item:hover{background:var(--bg)}
.drawer a.item.here{background:var(--accent-soft);border-color:var(--accent);font-weight:600}
.drawer a.item small{color:var(--muted);font-size:12px;white-space:nowrap}
.drawer .shows{display:flex;flex-direction:column;gap:2px;max-height:40vh;overflow-y:auto}
.drawer .seg{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line);border-radius:10px;overflow:hidden}
.drawer .seg button{border:0;border-radius:0;background:var(--bg);color:var(--fg);font-weight:600;font-size:14px;padding:10px 6px;min-height:44px}
.drawer .seg button[aria-pressed="true"]{background:var(--accent);color:var(--card)}
.drawer .who{font-size:13px;color:var(--muted)}
.tabs{position:fixed;left:0;right:0;bottom:0;z-index:30;background:var(--card);border-top:1px solid var(--line);display:grid;grid-template-columns:repeat(3,1fr);
  padding:6px max(10px,env(safe-area-inset-right,0px)) calc(6px + env(safe-area-inset-bottom,0px)) max(10px,env(safe-area-inset-left,0px))}
.tabs a{display:flex;flex-direction:column;align-items:center;gap:3px;text-decoration:none;color:var(--muted);font-size:12px;font-weight:600;padding:6px 4px;border-radius:10px;min-height:52px;justify-content:center}
.tabs a svg{width:24px;height:24px}
.tabs a.here{color:var(--accent);background:var(--accent-soft)}
@media (min-width:900px){.tabs{left:50%;right:auto;transform:translateX(-50%);width:560px;border:1px solid var(--line);border-bottom:0;border-radius:14px 14px 0 0}}
@media (prefers-reduced-motion:reduce){.drawer,.drawer-bg{transition:none}}
`;
  const ico={
    burger:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    entries:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6v3H9z"/><path d="M7 5H5v15h14V5h-2"/><path d="M8 11h8M8 15h5"/></svg>',
    awards:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5"/><path d="M9 13.5 7 21l5-2.5 5 2.5-2-7.5"/></svg>',
    results:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>'
  };
  const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const VIEWKEY="mncf-awards-view";
  window.mncfAwardsView={get(){try{return localStorage.getItem(VIEWKEY)||"round"}catch(e){return "round"}},set(v){try{localStorage.setItem(VIEWKEY,v)}catch(e){}}};

  window.mncfShell=function(opt){
    opt=opt||{};
    const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
    const show=(new URLSearchParams(location.search)).get("show")||"";
    const q=show?"?show="+encodeURIComponent(show):"";
    // top bar
    const header=document.querySelector("header");
    const bar=document.createElement("div");bar.className="appbar";
    bar.innerHTML=`<button class="burger" type="button" aria-label="Open menu" aria-expanded="false">${ico.burger}</button><div class="crumb"><small>${esc(opt.kicker||(show?{entries:"Entries",awards:"Awards",results:"Results"}[opt.page]||"":"MNCF Show Desk"))}</small><b id="crumbTitle">${esc(opt.title||show||"All shows")}</b></div>`;
    if(header) header.insertBefore(bar,header.firstChild); else document.body.insertBefore(bar,document.body.firstChild);
    if(header){const h1=header.querySelector("h1");if(h1&&show)h1.hidden=true}
    // drawer
    const bg=document.createElement("div");bg.className="drawer-bg";
    const dr=document.createElement("nav");dr.className="drawer";dr.setAttribute("aria-label","Menu");
    const mode=window.mncfAwardsView.get();
    dr.innerHTML=`<div class="dhead"><b>MNCF Show Desk</b><button class="close" type="button" aria-label="Close menu">×</button></div>
      <div class="sec"><h3>Shows</h3><input type="text" id="drawerQ" placeholder="Find a show" autocomplete="off"><div class="shows" id="drawerShows"><span class="note">Loading…</span></div>
        <a class="item${opt.page==="shows"?" here":""}" href="index.html">All shows and new show <small>›</small></a></div>
      <div class="sec"><h3>Manage</h3><a class="item${opt.page==="breeds"?" here":""}" href="breeds.html">Breeds and groups <small>›</small></a></div>
      <div class="sec"><h3>Awards view on this phone</h3><div class="seg" role="group" aria-label="Awards view"><button type="button" data-view="round" aria-pressed="${mode==="round"}">One round at a time</button><button type="button" data-view="list" aria-pressed="${mode==="list"}">Full list</button></div></div>
      <div class="sec"><h3>Older pages</h3><a class="item" href="nov-2026.html">November 2026, first version <small>›</small></a></div>
      <div class="sec" style="margin-top:auto"><span class="who" id="drawerWho"></span><button class="item" type="button" id="drawerOut">Sign out</button></div>`;
    document.body.appendChild(bg);document.body.appendChild(dr);
    const burger=bar.querySelector(".burger");
    const open=()=>{document.body.classList.add("drawer-open");burger.setAttribute("aria-expanded","true");loadShows();setTimeout(()=>dr.querySelector("#drawerQ").focus(),120)};
    const close=()=>{document.body.classList.remove("drawer-open");burger.setAttribute("aria-expanded","false")};
    burger.onclick=open;bg.onclick=close;dr.querySelector(".close").onclick=close;
    document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
    dr.querySelector("#drawerOut").onclick=()=>window.mncfSignOut&&window.mncfSignOut();
    if(window.mncfWho)window.mncfWho().then(w=>{if(w)dr.querySelector("#drawerWho").textContent="Signed in as "+w});
    dr.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{
      window.mncfAwardsView.set(b.dataset.view);
      dr.querySelectorAll("[data-view]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
      if(window.mncfFocus)window.mncfFocus.setMode(b.dataset.view);
      if(window.mncfToast)mncfToast(b.dataset.view==="round"?"Awards show one round at a time":"Awards show the full list");
    });
    let SHOWS=null;
    function drawShows(){
      const box=dr.querySelector("#drawerShows");if(!SHOWS){return}
      const t=dr.querySelector("#drawerQ").value.trim().toLowerCase();
      const order={Open:0,Closed:1,Finished:2};
      const list=SHOWS.filter(s=>!t||(s.Show+" "+(s.Date||"")).toLowerCase().includes(t)).sort((a,b)=>(order[a.Status]??0)-(order[b.Status]??0));
      box.innerHTML=list.slice(0,40).map(s=>`<a class="item${s.Show===show?" here":""}" href="${opt.page==="entries"?"register":"awards"}.html?show=${encodeURIComponent(s.Show)}"><span>${esc(s.Show)}</span><small>${esc(s.Status||"")}</small></a>`).join("")||'<span class="note">No shows match.</span>';
    }
    async function loadShows(){
      const c=window.mncfCache&&mncfCache.get("bootstrap");if(c&&c.shows){SHOWS=c.shows;drawShows()}
      if(!window.mncfApi)return;
      try{const j=await mncfApi("bootstrap");mncfCache.set("bootstrap",j);SHOWS=j.shows;drawShows()}catch(e){}
    }
    dr.querySelector("#drawerQ").addEventListener("input",drawShows);
    // bottom tabs for a show
    if(show&&["entries","awards","results"].includes(opt.page)){
      const tabs=document.createElement("nav");tabs.className="tabs";tabs.setAttribute("aria-label","Show sections");
      tabs.innerHTML=[["entries","Entries","register.html"+q],["awards","Awards","awards.html"+q],["results","Results","awards.html"+q+"&view=results"]]
        .map(([k,l,h])=>`<a href="${h}"${opt.page===k?' class="here" aria-current="page"':""}>${ico[k]}<span>${l}</span></a>`).join("");
      document.body.appendChild(tabs);document.body.classList.add("has-tabs");
    }
    return {setTitle(t){const el=document.getElementById("crumbTitle");if(el)el.textContent=t}};
  };
})();
