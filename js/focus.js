// Awards page view modes. "round": one round at a time with Previous / Next. "list": every round on one page.
// "?view=results": only the results, certificates and export.
(function(){
  const css=`
body.round-mode #breeds > .breed:not(.current), body.round-mode #groups > .breed:not(.current){display:none!important}
body.round-mode .jump-row label,body.round-mode .jump-row select{display:none}
body.round-mode #totalsPanel{padding:0;border:0;background:none;box-shadow:none}
body.round-mode #totalsPanel > :not(#legacyBox){display:none!important}
.pager{position:fixed;left:0;right:0;z-index:29;bottom:calc(64px + env(safe-area-inset-bottom,0px));background:var(--card);border-top:1px solid var(--line);
  display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px max(12px,env(safe-area-inset-right,0px)) 8px max(12px,env(safe-area-inset-left,0px))}
.pager button{min-height:48px;min-width:48px;padding:0 14px;font-size:15px;font-weight:700;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--fg)}
.pager button.go{background:var(--accent);border-color:var(--accent);color:var(--card)}
.pager select{min-height:48px;width:100%;font-weight:600}
@keyframes nudge{0%,100%{transform:none}50%{transform:translateX(3px)}}
.pager button.go.ready{animation:nudge 1s ease-in-out 2}
@media (min-width:900px){.pager{left:50%;right:auto;transform:translateX(-50%);width:560px;border:1px solid var(--line);border-radius:14px;bottom:calc(76px + env(safe-area-inset-bottom,0px))}}
body.results-view #breeds, body.results-view #groups, body.results-view .jump, body.results-view #legacyBox, body.results-view .top-btn{display:none!important}
body.results-view #resultsText{max-height:none}
@media (prefers-reduced-motion:reduce){.pager button.go.ready{animation:none}}
`;
  window.mncfFocus=(function(){
    let mode="list", cur=0, pager=null, KEY="", observer=null;
    const cards=()=>[...document.querySelectorAll("#breeds > .breed, #groups > .breed")];
    const titleOf=c=>((c.querySelector("h2")||{}).textContent||"").trim();
    function save(){try{localStorage.setItem(KEY,String(cur))}catch(e){}}
    function apply(){
      const list=cards();if(!list.length){if(pager)pager.hidden=true;return}
      if(cur>=list.length)cur=list.length-1;if(cur<0)cur=0;
      list.forEach((c,i)=>c.classList.toggle("current",i===cur));
      if(!pager)return;
      pager.hidden=mode!=="round";
      const sel=pager.querySelector("select");
      sel.innerHTML=list.map((c,i)=>`<option value="${i}"${i===cur?" selected":""}>${i+1} of ${list.length} · ${titleOf(c).replace(/[<&]/g,"")}${c.classList.contains("done")?" ✓":""}</option>`).join("");
      pager.querySelector("[data-prev]").disabled=cur===0;
      const nx=pager.querySelector("[data-next]");nx.disabled=cur===list.length-1;
      nx.classList.toggle("ready",list[cur].classList.contains("done"));
    }
    function go(i,scroll){cur=i;save();apply();if(scroll!==false)window.scrollTo({top:0,behavior:"auto"})}
    function build(){
      const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
      pager=document.createElement("div");pager.className="pager";pager.hidden=true;
      pager.innerHTML=`<button type="button" data-prev aria-label="Previous round">‹</button><select aria-label="Choose round"></select><button type="button" class="go" data-next aria-label="Next round">Next ›</button>`;
      document.body.appendChild(pager);
      pager.querySelector("[data-prev]").onclick=()=>go(cur-1);
      pager.querySelector("[data-next]").onclick=()=>go(cur+1);
      pager.querySelector("select").onchange=e=>go(+e.target.value);
      observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(apply,30)});
      ["#breeds","#groups"].forEach(s=>{const el=document.querySelector(s);if(el)observer.observe(el,{childList:true})});
    }
    return {
      init(show){
        KEY="mncf-round::"+show;try{cur=+localStorage.getItem(KEY)||0}catch(e){}
        const params=new URLSearchParams(location.search);
        build();
        if(params.get("view")==="results"){document.body.classList.add("results-view");return}
        this.setMode(window.mncfAwardsView?window.mncfAwardsView.get():"round");
      },
      setMode(m){
        if(document.body.classList.contains("results-view"))return;
        mode=m==="list"?"list":"round";
        document.body.classList.toggle("round-mode",mode==="round");
        document.body.classList.toggle("has-pager",mode==="round");
        if(mode==="round")document.body.classList.remove("hide-done");
        apply();
      },
      // remember the round separately for each judging day: key "mncf-round@<day>::<show>"
      rekey(k){KEY=k;try{cur=+localStorage.getItem(KEY)||0}catch(e){cur=0}apply()},
      active(){return mode==="round"&&!document.body.classList.contains("results-view")},
      step(d){const n=cards().length;const i=cur+d;if(i>=0&&i<n)go(i)},
      goCard(card){const i=cards().indexOf(card);if(i>=0)go(i)},
      refresh:apply
    };
  })();
})();
