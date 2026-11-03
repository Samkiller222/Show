// App shell shared by every page: a top bar with a burger menu, a drawer for finding shows and settings,
// and bottom tabs (Entries / Awards / Results) whenever a show is open.
// Usage: <script src="js/shell.js"></script> then mncfShell({page:"entries"|"add"|"awards"|"results"|"shows"|"breeds"|"import", title:"…"})
// When a show is open, the top bar has an "Edit show" button that changes the show's name, date, venue, judge and status.
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
.tabs{position:fixed;left:0;right:0;bottom:0;z-index:30;background:var(--card);border-top:1px solid var(--line);display:grid;grid-template-columns:repeat(4,1fr);
  padding:6px max(10px,env(safe-area-inset-right,0px)) calc(6px + env(safe-area-inset-bottom,0px)) max(10px,env(safe-area-inset-left,0px))}
.tabs a{display:flex;flex-direction:column;align-items:center;gap:3px;text-decoration:none;color:var(--muted);font-size:12px;font-weight:600;padding:6px 4px;border-radius:10px;min-height:52px;justify-content:center}
.tabs a svg{width:24px;height:24px}
.tabs a.here{color:var(--accent);background:var(--accent-soft)}
@media (min-width:900px){.tabs{left:50%;right:auto;transform:translateX(-50%);width:560px;border:1px solid var(--line);border-bottom:0;border-radius:14px 14px 0 0}}
.appbar .editshow{flex:none;display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--fg);font-size:14px;font-weight:600}
.appbar .editshow svg{width:18px;height:18px}
.showdlg{border:1px solid var(--line);border-radius:14px;padding:0;background:var(--card);color:var(--fg);width:min(92vw,460px);max-height:90vh;box-shadow:0 18px 40px rgba(0,0,0,.25)}
.showdlg::backdrop{background:rgba(10,12,20,.45)}
.showdlg form{padding:16px;display:flex;flex-direction:column;gap:12px}
.showdlg .dhead{display:flex;justify-content:space-between;align-items:center;gap:8px}
.showdlg .dhead b{font-family:var(--display);font-size:22px;text-transform:uppercase;letter-spacing:.03em}
.showdlg .close{width:40px;height:40px;border-radius:10px;border:1px solid var(--line);background:var(--bg);font-size:22px;line-height:1;color:var(--fg);padding:0}
@media (prefers-reduced-motion:reduce){.drawer,.drawer-bg{transition:none}}
/* toasts slide up above the bottom tabs and the round pager; Undo button when there is one */
.toast{z-index:60;display:flex;align-items:center;gap:12px;width:max-content;max-width:min(92vw,480px);padding:10px 14px;border-radius:10px;font-size:15px;box-shadow:0 8px 24px rgba(0,0,0,.25);
  opacity:0;transform:translate(-50%,14px);transition:opacity .18s ease,transform .24s cubic-bezier(.2,.8,.2,1);pointer-events:none}
.toast.show{opacity:1;transform:translate(-50%,0)}
.toast.has-act.show{pointer-events:auto}
.toast-act{flex:none;min-height:38px!important;padding:6px 14px;border-radius:8px;border:1.5px solid currentColor;background:transparent;color:inherit;font-weight:700;text-transform:uppercase;letter-spacing:.04em;font-size:13px}
body.has-tabs .toast{bottom:calc(82px + env(safe-area-inset-bottom,0px))}
body.has-pager .toast{bottom:calc(146px + env(safe-area-inset-bottom,0px))}
body.has-tabs .top-btn{bottom:calc(82px + env(safe-area-inset-bottom,0px))}
body.has-pager .top-btn{bottom:calc(146px + env(safe-area-inset-bottom,0px))}
/* breed names stay in view while you scroll through a long breed */
.breed{overflow:hidden;overflow:clip}
.breed > .bhead{position:sticky;top:calc(var(--hdr,0px) + env(safe-area-inset-top,0px));z-index:3}
/* small motion: things landing, awards given, rounds finished */
@keyframes mncf-land{0%{box-shadow:0 0 0 3px var(--accent)}100%{box-shadow:0 0 0 3px transparent}}
@keyframes mncf-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@keyframes mncf-pop{0%,100%{transform:scale(1)}45%{transform:scale(1.35)}}
@keyframes mncf-fade{from{opacity:.24}to{opacity:0}}
@keyframes mncf-done{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ok) 60%,transparent)}100%{box-shadow:0 0 0 14px transparent}}
.erow.landed{animation:mncf-land 1.1s ease-out;border-radius:8px}
.erow.in{animation:mncf-in .3s ease-out}
.row{position:relative}
.row.pop .given input{animation:mncf-pop .32s ease-out}
.row.pop::after,.row.picked::after{content:"";position:absolute;inset:-3px -8px;border-radius:8px;background:var(--ok);opacity:0;pointer-events:none;animation:mncf-fade .8s ease-out}
.row.picked::after{background:var(--accent)}
.breed.justdone{animation:mncf-done .9s ease-out}
.lane{transition:background .15s,border-color .15s,box-shadow .15s,opacity .15s}
.keys{display:none}
@media (min-width:900px) and (hover:hover){.keys{display:flex}}
.keys kbd{font:600 12px/1 var(--body);border:1px solid var(--line);border-bottom-width:2px;border-radius:5px;padding:3px 6px;background:var(--bg);margin-right:6px}
.keys p{margin:0;font-size:13px;color:var(--muted)}
/* roles: stewards and viewers don't see the editing controls (the database refuses those changes anyway) */
body.ro-edit #editShowBtn,body.ro-edit #drawerEdit,body.ro-edit .tabs a[data-tab="add"],body.ro-edit #newBtn,body.ro-edit #addLink,
body.ro-edit #breedForm,body.ro-edit .erow .acts,body.ro-edit .erow .grip,body.ro-edit #addBtn,body.ro-edit #editBtn,body.ro-edit #saveBar,body.ro-edit .needs-edit{display:none!important}
body.ro-edit .tabs{grid-template-columns:repeat(3,1fr)}
body.ro-edit select[data-breed]{pointer-events:none;appearance:none;-webkit-appearance:none;border-color:transparent;background:transparent}
body.ro-award [data-k],body.ro-award [data-g]{pointer-events:none;opacity:.75}
.drawer .role{display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:var(--accent-soft);color:var(--fg);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.viewonly{margin:8px 0 0;padding:8px 12px;border-radius:8px;background:var(--accent-soft);font-size:14px;font-weight:600}
@media (prefers-reduced-motion:reduce){.toast{transform:translate(-50%,0)}*,*::before,*::after{animation:none!important;transition:none!important}}
`;
  const ico={
    burger:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    entries:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6v3H9z"/><path d="M7 5H5v15h14V5h-2"/><path d="M8 11h8M8 15h5"/></svg>',
    awards:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5"/><path d="M9 13.5 7 21l5-2.5 5 2.5-2-7.5"/></svg>',
    add:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
    pencil:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
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
    bar.innerHTML=`<button class="burger" type="button" aria-label="Open menu" aria-expanded="false">${ico.burger}</button><div class="crumb"><small>${esc(opt.kicker||(show?{entries:"Entries",add:"Add entry",awards:"Awards",results:"Results"}[opt.page]||"":"MNCF Show Desk"))}</small><b id="crumbTitle">${esc(opt.title||show||"All shows")}</b></div>${show?`<button class="editshow" type="button" id="editShowBtn" aria-label="Edit this show's details">${ico.pencil}<span>Edit show</span></button>`:""}`;
    if(header) header.insertBefore(bar,header.firstChild); else document.body.insertBefore(bar,document.body.firstChild);
    if(header){const h1=header.querySelector("h1");if(h1&&show)h1.hidden=true}
    // drawer
    const bg=document.createElement("div");bg.className="drawer-bg";
    const dr=document.createElement("nav");dr.className="drawer";dr.setAttribute("aria-label","Menu");
    const mode=window.mncfAwardsView.get();
    dr.innerHTML=`<div class="dhead"><b>MNCF Show Desk</b><button class="close" type="button" aria-label="Close menu">×</button></div>
      <div class="sec"><h3>Shows</h3><input type="text" id="drawerQ" placeholder="Find a show" autocomplete="off"><div class="shows" id="drawerShows"><span class="note">Loading…</span></div>
        <a class="item${opt.page==="shows"?" here":""}" href="index.html">All shows and new show <small>›</small></a></div>
      ${show?`<div class="sec"><h3>This show</h3><button class="item" type="button" id="drawerEdit">Edit show details <small>›</small></button><a class="item${opt.page==="schedule"?" here":""}" href="schedule.html${q}">Judging days and times <small>›</small></a><a class="item${opt.page==="catalogue"?" here":""}" href="catalogue.html${q}">Show catalogue to print <small>›</small></a></div>`:""}
      <div class="sec"><h3>Manage</h3><a class="item${opt.page==="dogs"?" here":""}" href="dogs.html">Club dogs <small>›</small></a><a class="item${opt.page==="breeds"?" here":""}" href="breeds.html">Breeds and groups <small>›</small></a><a class="item${opt.page==="users"?" here":""}" href="users.html" id="drawerUsers" hidden>Users and roles <small>›</small></a></div>
      <div class="sec"><h3>Awards view on this phone</h3><div class="seg" role="group" aria-label="Awards view"><button type="button" data-view="round" aria-pressed="${mode==="round"}">One round at a time</button><button type="button" data-view="list" aria-pressed="${mode==="list"}">Full list</button></div></div>
      <div class="sec keys"><h3>Keyboard shortcuts</h3><p><kbd>/</kbd>Search</p>${show?`<p><kbd>N</kbd>Add entry</p><p><kbd>←</kbd><kbd>→</kbd>Previous or next round</p>`:""}<p><kbd>Esc</kbd>Close menu</p></div>
      <div class="sec"><h3>Older pages</h3><a class="item" href="legacy/nov-2026.html">November 2026, first version <small>›</small></a></div>
      <div class="sec" style="margin-top:auto"><span class="who" id="drawerWho"></span><button class="item" type="button" id="drawerOut">Sign out</button></div>`;
    document.body.appendChild(bg);document.body.appendChild(dr);
    const burger=bar.querySelector(".burger");
    const open=()=>{document.body.classList.add("drawer-open");burger.setAttribute("aria-expanded","true");loadShows();setTimeout(()=>dr.querySelector("#drawerQ").focus(),120)};
    const close=()=>{document.body.classList.remove("drawer-open");burger.setAttribute("aria-expanded","false")};
    burger.onclick=open;bg.onclick=close;dr.querySelector(".close").onclick=close;
    document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
    dr.querySelector("#drawerOut").onclick=()=>window.mncfSignOut&&window.mncfSignOut();
    if(window.mncfWho)window.mncfWho().then(w=>{if(w)dr.querySelector("#drawerWho").innerHTML="Signed in as "+esc(w)+'<span class="role" id="drawerRole" hidden></span>'}).then(()=>applyRole(window.mncfRoleCached&&mncfRoleCached(),false));
    // ---- what this login may do ----
    function applyRole(r,known){
      if(r===null||r===undefined)return; // role unknown: leave everything as it was
      const edit=r==="admin"||r==="organiser",award=edit||r==="steward";
      document.body.dataset.role=r;
      document.body.classList.toggle("ro-edit",!edit);document.body.classList.toggle("ro-award",!award);
      const u=dr.querySelector("#drawerUsers");if(u)u.hidden=r!=="admin";
      const rb=dr.querySelector("#drawerRole");if(rb){rb.hidden=false;rb.textContent=window.mncfRoleName?mncfRoleName(r):r}
      if(known&&!edit&&!document.querySelector(".viewonly")&&header){const p=document.createElement("p");p.className="viewonly";
        p.textContent=award?"Steward login: you can record awards but not change entries or shows.":r?"View only: your login can look but not change anything.":"Your login isn't on the team list yet. Ask an admin to add you.";
        header.appendChild(p)}
    }
    if(window.mncfRole)mncfRole().then(r=>applyRole(r,true));
    // Read-only logins: stop award picks and entry drags before the page acts on them.
    window.addEventListener("change",e=>{const t=e.target;if(!document.body.classList.contains("ro-award")||!t||!(t.dataset&&(t.dataset.k||t.dataset.g)))return;
      e.stopImmediatePropagation();if(window.mncfEngine)mncfEngine.render();if(window.mncfToast)mncfToast("View only: your login can't record awards.")},true);
    window.addEventListener("pointerdown",e=>{if(document.body.classList.contains("ro-edit")&&e.target.closest&&e.target.closest(".erow.mv"))e.stopImmediatePropagation()},true);
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
      box.innerHTML=list.slice(0,40).map(s=>`<a class="item${s.Show===show?" here":""}" href="${{entries:"register",add:"entry"}[opt.page]||"awards"}.html?show=${encodeURIComponent(s.Show)}"><span>${esc(s.Show)}</span><small>${esc(s.Status||"")}</small></a>`).join("")||'<span class="note">No shows match.</span>';
    }
    async function loadShows(){
      const c=window.mncfCache&&mncfCache.get("bootstrap");if(c&&c.shows){SHOWS=c.shows;drawShows()}
      if(!window.mncfApi)return;
      try{const j=await mncfApi("bootstrap");mncfCache.set("bootstrap",j);SHOWS=j.shows;drawShows()}catch(e){}
    }
    dr.querySelector("#drawerQ").addEventListener("input",drawShows);
    // bottom tabs for a show
    if(show&&["entries","add","awards","results"].includes(opt.page)){
      const tabs=document.createElement("nav");tabs.className="tabs";tabs.setAttribute("aria-label","Show sections");
      tabs.innerHTML=[["entries","Entries","register.html"+q],["add","Add entry","entry.html"+q],["awards","Awards","awards.html"+q],["results","Results","awards.html"+q+"&view=results"]]
        .map(([k,l,h])=>`<a href="${h}" data-tab="${k}"${opt.page===k?' class="here" aria-current="page"':""}>${ico[k]}<span>${l}</span></a>`).join("");
      document.body.appendChild(tabs);document.body.classList.add("has-tabs");
    }
    // ---- keyboard shortcuts on a computer (ignored while typing) ----
    document.addEventListener("keydown",e=>{
      if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;
      const t=e.target;if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))return;
      if(document.body.classList.contains("drawer-open")||document.querySelector("dialog[open]"))return;
      if(e.key==="/"){const f=[...document.querySelectorAll("#q,#bq,.find input")].find(x=>x.offsetParent);if(f){e.preventDefault();f.focus();f.select()}return}
      if((e.key==="n"||e.key==="N")&&show&&opt.page!=="add"){e.preventDefault();location.href="entry.html"+q;return}
      if((e.key==="ArrowLeft"||e.key==="ArrowRight")&&window.mncfFocus&&mncfFocus.active&&mncfFocus.active()){e.preventDefault();mncfFocus.step(e.key==="ArrowLeft"?-1:1)}
    });
    // header height, so breed headers can stick just under it
    if(header&&window.ResizeObserver){const set=()=>document.documentElement.style.setProperty("--hdr",header.offsetHeight+"px");set();new ResizeObserver(set).observe(header)}
    // ---- edit the open show ----
    if(show){
      const dlg=document.createElement("dialog");dlg.className="showdlg";dlg.setAttribute("aria-labelledby","esTitle");
      dlg.innerHTML=`<form method="dialog" class="form" autocomplete="off"><div class="dhead" style="grid-column:1/-1"><b id="esTitle">Edit show</b><button class="close" type="button" value="cancel" aria-label="Close">×</button></div>
        <div class="field wide"><label for="esName">Show name</label><input type="text" id="esName" required></div>
        <div class="field"><label for="esDate">Date</label><input type="text" id="esDate"></div>
        <div class="field"><label for="esVenue">Venue</label><input type="text" id="esVenue"></div>
        <div class="field"><label for="esJudge">Judge</label><input type="text" id="esJudge"></div>
        <div class="field"><label for="esStatus">Status</label><select id="esStatus"><option>Open</option><option>Closed</option><option>Finished</option></select></div>
        <div class="field wide"><label for="esNotes">Notes</label><input type="text" id="esNotes"></div>
        <div class="field wide"><div class="btns"><button class="pri" type="submit" id="esSave">Save show</button><button type="button" class="esCancel">Cancel</button></div><p class="err" id="esErr"></p></div></form>`;
      document.body.appendChild(dlg);
      const $d=id=>dlg.querySelector("#"+id);let cur=null;
      const fill=s=>{cur=s;$d("esName").value=s.Show||"";$d("esDate").value=s.Date||"";$d("esVenue").value=s.Venue||"";$d("esJudge").value=s.Judge||"";$d("esStatus").value=s.Status||"Open";$d("esNotes").value=s.Notes||""};
      async function openEdit(){
        close();$d("esErr").textContent="";
        const c=window.mncfCache&&mncfCache.get("bootstrap");const known=c&&c.shows&&c.shows.find(s=>s.Show===show);
        if(known)fill(known);else{$d("esName").value=show}
        if(dlg.showModal)dlg.showModal();else dlg.setAttribute("open","");
        try{const j=await mncfApi("bootstrap");mncfCache.set("bootstrap",j);const s=j.shows.find(x=>x.Show===show);if(s&&!dlg.dataset.touched)fill(s);if(!s)$d("esErr").textContent="This show wasn't found. It may have been renamed on another phone."}catch(e){$d("esErr").textContent=e.message}
      }
      const shut=()=>{delete dlg.dataset.touched;dlg.close?dlg.close():dlg.removeAttribute("open")};
      dlg.addEventListener("input",()=>dlg.dataset.touched="1");
      dlg.querySelector(".close").onclick=shut;dlg.querySelector(".esCancel").onclick=shut;
      dlg.querySelector("form").addEventListener("submit",async ev=>{
        ev.preventDefault();const b=$d("esSave");if(!cur){$d("esErr").textContent="Still loading the show. Try again in a moment.";return}
        b.disabled=true;b.textContent="Saving…";$d("esErr").textContent="";
        try{
          const j=await mncfApi("updateShow",{id:cur.id,show:{Show:$d("esName").value,Date:$d("esDate").value,Venue:$d("esVenue").value,Judge:$d("esJudge").value,Status:$d("esStatus").value,Notes:$d("esNotes").value}});
          const c=mncfCache.get("bootstrap")||{};c.shows=j.shows;mncfCache.set("bootstrap",c);
          const nu=j.show.Show;
          if(nu!==show){
            // Results and settings saved on this phone are keyed by show name, so carry them over to the new name.
            try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.endsWith("::"+show)){const nk=k.slice(0,k.length-show.length)+nu;if(localStorage.getItem(nk)===null)localStorage.setItem(nk,localStorage.getItem(k));localStorage.removeItem(k)}}}catch(e){}
            const p=new URLSearchParams(location.search);p.set("show",nu);
            try{sessionStorage.setItem("mncf-flash","Show renamed to "+nu)}catch(e){}
            location.href=location.pathname+"?"+p.toString();return;
          }
          try{sessionStorage.setItem("mncf-flash","Show details saved")}catch(e){}
          location.reload();return;
        }catch(e){$d("esErr").textContent=e.message}
        b.disabled=false;b.textContent="Save show";
      });
      bar.querySelector("#editShowBtn").onclick=openEdit;
      const de=dr.querySelector("#drawerEdit");if(de)de.onclick=openEdit;
      try{const f=sessionStorage.getItem("mncf-flash");if(f){sessionStorage.removeItem("mncf-flash");setTimeout(()=>window.mncfToast&&mncfToast(f),300)}}catch(e){}
    }
    // ---- keep the page up to date ----
    // Phones and browsers keep old copies of pages for a while after an update, which can mix old and new screens.
    // Each page carries its version; if the site has a newer one, reload once from a fresh address.
    (async()=>{
      try{
        const m=document.querySelector('meta[name="mncf-version"]'),have=m?m.content:"";
        const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)return;
        const v=(await r.json()).v;if(!v||v===have)return;
        const gk="mncf-refreshed-"+v;if(sessionStorage.getItem(gk))return;sessionStorage.setItem(gk,"1");
        const u=new URL(location.href);u.searchParams.set("_v",v);location.replace(u.toString());
      }catch(e){}
    })();
    return {setTitle(t){const el=document.getElementById("crumbTitle");if(el)el.textContent=t}};
  };
})();
