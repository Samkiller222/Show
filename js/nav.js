// Jump bar for long pages: one chip per group, a "go to round" list, "next to do", and "hide finished".
// Usage: mncfJumpNav({containers:["#breeds","#groups"], mount:"header", rounds:true})
(function(){
  const css=`
.jump{display:flex;flex-direction:column;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--line)}
.jump-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:2px}
.jump-chips::-webkit-scrollbar{display:none}
.jump-chips button{flex:none;font-size:13px;font-weight:600;padding:6px 11px;border-radius:999px;border:1px solid var(--line);background:var(--bg);color:var(--fg);white-space:nowrap;display:inline-flex;gap:6px;align-items:center}
.jump-chips button .n{font-weight:500;color:var(--muted);font-variant-numeric:tabular-nums}
.jump-chips button.done{border-color:var(--ok);color:var(--ok)}
.jump-chips button.done .n{color:var(--ok)}
.jump-chips button.here{background:var(--accent);border-color:var(--accent);color:var(--card)}
.jump-chips button.here .n{color:var(--card)}
.jump-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.jump-row select{flex:1 1 120px;min-width:0;padding:7px 9px;font-size:14px}
.jump-row button{padding:7px 12px;font-size:14px}
.jump-row label{display:inline-flex;gap:6px;align-items:center;font-size:13px;color:var(--muted);white-space:nowrap}
.jump-row label input{width:18px;height:18px}
body.hide-done .breed.done{display:none}
.top-btn{position:fixed;left:calc(16px + env(safe-area-inset-left,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:6;width:46px;height:46px;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--fg);font-size:20px;box-shadow:0 4px 14px rgba(0,0,0,.18);opacity:0;pointer-events:none;transition:opacity .2s}
.top-btn.show{opacity:1;pointer-events:auto}
.breed.flash{outline:3px solid var(--accent);outline-offset:2px;transition:outline-color 1.2s}
header.compact > .nav, header.compact > .sub, header.compact > .save{display:none}
header.compact h1{font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
header.compact .jump{margin-top:6px;padding-top:6px}

`;
  window.mncfJumpNav=function(opt){
    const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
    const mount=document.querySelector(opt.mount||"header");
    const box=document.createElement("div");box.className="jump";
    box.innerHTML=`<div class="jump-chips" role="navigation" aria-label="Jump to group"></div>`+
      `<div class="jump-row"><select aria-label="Go to round"></select>`+
      (opt.rounds?`<button type="button" class="pri" data-next>Next to do</button><label><input type="checkbox" data-hide>Hide done</label>`:"")+`</div>`;
    mount.appendChild(box);
    const chips=box.querySelector(".jump-chips"), sel=box.querySelector("select");
    const top=document.createElement("button");top.className="top-btn";top.type="button";top.setAttribute("aria-label","Back to top");top.textContent="↑";document.body.appendChild(top);
    top.onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
    const KEY="mncf-hide-done";
    const hide=box.querySelector("[data-hide]");
    if(hide){try{hide.checked=localStorage.getItem(KEY)==="1"}catch(e){}document.body.classList.toggle("hide-done",hide.checked);
      hide.onchange=()=>{document.body.classList.toggle("hide-done",hide.checked);try{localStorage.setItem(KEY,hide.checked?"1":"0")}catch(e){}build()}}
    let cards=[],busy=false;
    const headerH=()=>{const h=document.querySelector("header");return h?h.getBoundingClientRect().height:0};
    function categoryOf(card,container){
      const h2=(card.querySelector("h2")||{}).textContent||"", small=(card.querySelector(".bhead small")||{}).textContent||"";
      if(/Best in Show finals/i.test(h2)) return "Finals";
      if(container.matches(opt.groupsContainer||"#groups")) return "Groups";
      const m=small.match(/([A-Za-z]+) Group/); if(m) return m[1];
      return "Specials";
    }
    function build(){
      busy=true;
      cards=[];
      (opt.containers||[]).forEach(sel=>{const c=document.querySelector(sel);if(!c)return;
        c.querySelectorAll(":scope > .breed").forEach(card=>cards.push({card,cat:categoryOf(card,c),title:(card.querySelector("h2")||{}).textContent||"",done:card.classList.contains("done")}))});
      cards.forEach((x,i)=>{x.card.id=x.card.id||("round-"+(i+1));x.card.style.scrollMarginTop=(headerH()+12)+"px"});
      const cats=[];cards.forEach(x=>{let c=cats.find(c=>c.name===x.cat);if(!c){c={name:x.cat,items:[]};cats.push(c)}c.items.push(x)});
      chips.innerHTML=cats.map(c=>{const d=c.items.filter(x=>x.done).length,all=d===c.items.length;
        return `<button type="button" data-cat="${c.name}" class="${opt.rounds&&all?"done":""}">${c.name}${opt.rounds?` <span class="n">${d}/${c.items.length}</span>`:opt.counts===false?"":` <span class="n">${c.items.length}</span>`}</button>`}).join("");
      const keep=sel.value;
      sel.innerHTML=`<option value="">${opt.rounds?"Go to round…":"Go to breed…"}</option>`+cats.map(c=>`<optgroup label="${c.name}">`+c.items.map(x=>`<option value="${x.card.id}">${opt.rounds?(cards.indexOf(x)+1)+". ":""}${x.title}${opt.rounds&&x.done?" ✓":""}</option>`).join("")+`</optgroup>`).join("");
      sel.value=keep&&document.getElementById(keep)?"":"";
      box.hidden=!cards.length;
      spy();
      setTimeout(()=>busy=false,0);
    }
    const hdr=document.querySelector("header");let jumping=0;
    function go(card){if(!card)return;
      if(window.mncfFocus&&window.mncfFocus.active()){window.mncfFocus.goCard(card);return}if(card.classList.contains("done")&&document.body.classList.contains("hide-done")){hide.checked=false;hide.onchange()}
      if(hdr)hdr.classList.add("compact");
      jumping=Date.now()+1500;
      const y=card.getBoundingClientRect().top+window.scrollY-(hdr?hdr.getBoundingClientRect().height:0)-10;
      window.scrollTo({top:Math.max(0,y),behavior:Math.abs(y-window.scrollY)>2500?"auto":"smooth"});card.classList.add("flash");setTimeout(()=>card.classList.remove("flash"),1400)}
    chips.addEventListener("click",e=>{const b=e.target.closest("button[data-cat]");if(!b)return;const cat=b.dataset.cat;
      const list=cards.filter(x=>x.cat===cat);go((opt.rounds&&list.find(x=>!x.done)||list[0]||{}).card)});
    sel.addEventListener("change",()=>{const c=document.getElementById(sel.value);sel.value="";go(c)});
    const next=box.querySelector("[data-next]");
    if(next) next.onclick=()=>{const y=window.scrollY+headerH()+20;
      const after=cards.find(x=>!x.done&&x.card.getBoundingClientRect().top+window.scrollY>y);
      let any=after||cards.find(x=>!x.done);
      if(window.mncfFocus&&window.mncfFocus.active()){const i=cards.findIndex(x=>x.card.classList.contains("current"));any=cards.slice(i+1).find(x=>!x.done)||cards.find(x=>!x.done)}
      if(any)go(any.card);else if(window.mncfToast)mncfToast("Every round is done")};
    function spy(){
      const y=headerH()+40;let cur=null;
      for(const x of cards){if(x.card.offsetParent===null)continue;if(x.card.getBoundingClientRect().top<=y)cur=x;else break}
      chips.querySelectorAll("button").forEach(b=>b.classList.toggle("here",!!cur&&b.dataset.cat===cur.cat));
      const h=chips.querySelector(".here");if(h){const r=h.getBoundingClientRect(),cr=chips.getBoundingClientRect();if(r.left<cr.left||r.right>cr.right)chips.scrollLeft+=r.left-cr.left-20}
      top.classList.toggle("show",window.scrollY>600);
      if(hdr&&Date.now()>jumping){if(window.scrollY>160)hdr.classList.add("compact");else if(window.scrollY<40)hdr.classList.remove("compact")}
    }
    let t=null;window.addEventListener("scroll",()=>{if(t)return;t=requestAnimationFrame(()=>{t=null;spy()})},{passive:true});
    window.addEventListener("resize",build);
    const mo=new MutationObserver(()=>{if(!busy){clearTimeout(mo._t);mo._t=setTimeout(build,60)}});
    (opt.containers||[]).forEach(s=>{const c=document.querySelector(s);if(c)mo.observe(c,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]})});
    build();
    return {build};
  };
})();
