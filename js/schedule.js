// Judging days and times for a show. A show's schedule is a list of sessions, each with a date, a start time,
// the breed groups judged in it, any single breeds moved into it, the special classes (Junior Handler,
// Childrens Class) and, on one session, the Best in Show finals.
// Stored on the show as  Schedule: [{id,date:"2026-11-01",start:"09:00",title,groups:[],breeds:[],specials:[],finals}]
// Used by the Entries, Awards and catalogue pages and by the schedule editor (schedule.html).
(function(){
  const norm=s=>String(s||"").trim().toLowerCase();
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const ord=n=>n+(n%100>=11&&n%100<=13?"th":["th","st","nd","rd"][n%10]||"th");
  const parseDate=d=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d||"");return m?new Date(+m[1],+m[2]-1,+m[3]):null};
  // "09:00" -> "9.00AM" (catalogue style) or "9:00am" (short)
  function time(t,style){
    const m=/^(\d{1,2}):(\d{2})/.exec(t||"");if(!m)return "";
    let h=+m[1];const ap=h<12?"am":"pm";h=h%12||12;
    return style==="long"?`${h}.${m[2]}${ap.toUpperCase()}`:`${h}:${m[2]}${ap}`;
  }
  const S={
    list(show){const s=show&&show.Schedule;return Array.isArray(s)?s.filter(x=>x&&typeof x==="object"):[]},
    // "Sunday 1st November 2026"
    longDate(d){const x=parseDate(d);return x?`${DAYS[x.getDay()]} ${ord(x.getDate())} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`:""},
    // "Sun 1 Nov"
    shortDate(d){const x=parseDate(d);return x?`${DAYS[x.getDay()].slice(0,3)} ${x.getDate()} ${MONTHS[x.getMonth()].slice(0,3)}`:""},
    time,
    // "Sunday 1st November 2026 – judging starts at 9.00AM"
    heading(s){const d=S.longDate(s.date),t=time(s.start,"long");return [d,t?(d?"judging starts at ":"Judging starts at ")+t:""].filter(Boolean).join(" – ")||s.title||"Judging session"},
    // "Sun 1 Nov · 9:00am"
    short(s){return [S.shortDate(s.date),time(s.start)].filter(Boolean).join(" · ")||s.title||"Session"},
    // What the session covers, e.g. "Gundog & Toy · Childrens Class"
    summary(s){const g=(s.groups||[]).join(" & ");return [g,...(s.breeds||[]).length?[(s.breeds.length===1?s.breeds[0]:s.breeds.length+" breeds")]:[],...(s.specials||[]),s.finals?"Best in Show":""].filter(Boolean).join(" · ")},
    // Sessions in time order, each with its index in the stored list kept as .i
    ordered(list){return list.map((s,i)=>Object.assign({},s,{i})).sort((a,b)=>String(a.date||"9").localeCompare(String(b.date||"9"))||String(a.start||"99").localeCompare(String(b.start||"99"))||a.i-b.i)},
    // Which session judges this. what: {breed, group} | {special:"Junior Handler"} | {finals:true}.
    // Returns the session's index in the stored list, or -1 when it isn't on any day.
    find(list,what){
      if(!list.length)return -1;
      if(what.finals){const i=list.findIndex(s=>s.finals);return i>=0?i:-1}
      if(what.special){return list.findIndex(s=>(s.specials||[]).some(x=>norm(x)===norm(what.special)))}
      if(what.breed){const i=list.findIndex(s=>(s.breeds||[]).some(x=>norm(x)===norm(what.breed)));if(i>=0)return i}
      if(what.group){return list.findIndex(s=>(s.groups||[]).some(x=>norm(x)===norm(what.group)))}
      return -1;
    },
    // A session's order on the day list (for sorting), unscheduled things last.
    rank(list,i){if(i<0)return 1e6;const o=S.ordered(list);return o.findIndex(s=>s.i===i)},
    // The day picked on this phone for a show: "all", or a session's stored index as a string
    picked(show){try{return localStorage.getItem("mncf-day::"+show)||""}catch(e){return ""}},
    pick(show,v){try{localStorage.setItem("mncf-day::"+show,v)}catch(e){}},
    // The session judged today, when there is one (later sessions win once they've started)
    today(list){
      const n=new Date(),d=`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`,t=`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
      const todays=S.ordered(list).filter(s=>s.date===d);if(!todays.length)return -1;
      const started=todays.filter(s=>!s.start||s.start<=t);return (started.length?started[started.length-1]:todays[0]).i;
    },
    // Chip bar to pick a day. opt: {mount, show, list, hasUnscheduled, onChange(value), editHref}
    // value is "all", "none" (not on a day) or the session's index as a string.
    bar(opt){
      const list=opt.list;if(!list.length)return null;
      if(!document.getElementById("mncf-day-css")){const st=document.createElement("style");st.id="mncf-day-css";st.textContent=`
.daybar{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:2px 0;margin-top:8px}
.daybar::-webkit-scrollbar{display:none}
.daybar button,.daybar a{flex:none;display:inline-flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:0;min-height:44px;padding:4px 12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--fg);font:inherit;font-size:14px;font-weight:600;line-height:1.15;text-align:left;white-space:nowrap;text-decoration:none;cursor:pointer}
.daybar button small{font-size:11px;font-weight:500;color:var(--muted)}
.daybar button[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--card)}
.daybar button[aria-pressed="true"] small{color:var(--card);opacity:.85}
.daybar a{color:var(--accent);border-style:dashed;align-items:center}
.dayhead{font-family:var(--display);font-size:20px;text-transform:uppercase;letter-spacing:.03em;margin:8px 0 -4px;display:flex;flex-direction:column;gap:2px}
.dayhead small{font-family:var(--body);font-size:13px;text-transform:none;letter-spacing:0;color:var(--muted);font-weight:500}
header.compact .daybar{margin-top:4px}`;document.head.appendChild(st)}
      const box=document.createElement("div");box.className="daybar";box.setAttribute("role","group");box.setAttribute("aria-label","Judging day");
      let v=S.picked(opt.show);
      const valid=x=>x==="all"||(x==="none"&&opt.hasUnscheduled)||(/^\d+$/.test(x)&&list[+x]);
      if(!valid(v)){const t=S.today(list);v=t>=0?String(t):"all"}
      const items=[["all","Whole show",list.length+" "+(list.length===1?"session":"sessions")],...S.ordered(list).map(s=>[String(s.i),S.short(s),S.summary(s)||"Nothing assigned yet"])];
      if(opt.hasUnscheduled)items.push(["none","Not on a day","Needs a session"]);
      box.innerHTML=items.map(([k,a,b])=>`<button type="button" data-day="${k}" aria-pressed="${k===v}">${mncfEsc(a)}<small>${mncfEsc(b)}</small></button>`).join("")+(opt.editHref?`<a href="${opt.editHref}">Edit days</a>`:"");
      opt.mount.appendChild(box);
      box.addEventListener("click",e=>{const b=e.target.closest("button[data-day]");if(!b)return;v=b.dataset.day;S.pick(opt.show,v);
        box.querySelectorAll("button[data-day]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));opt.onChange(v)});
      const here=box.querySelector('[aria-pressed="true"]');if(here)setTimeout(()=>here.scrollIntoView({block:"nearest",inline:"center"}),0);
      return {value:()=>v};
    },
    // Does a thing's session match the picked day value?
    matches(v,i){return !v||v==="all"||(v==="none"?i<0:String(i)===v)}
  };
  window.mncfSchedule=S;
})();
