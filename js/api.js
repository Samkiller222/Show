// Talks to the show database (Supabase). Team members sign in once per phone.
// Every page calls mncfApi(action, data) and gets back the same shapes the pages already use.
(function(){
  const SB_URL="https://cyikakfookjygycziqfg.supabase.co";
  const SB_KEY="sb_publishable_aYoBUyS09IpSzcz_7flzbA_WMeUUK38";
  const sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  window.mncfSb=sb;
  const GROUPS=["Utility","Hound","Gundog","Toy","Working","Terrier","Pastoral"];
  const CLASSES=["Puppy Dog","Puppy Bitch","Junior Dog","Junior Bitch","Open Dog","Open Bitch","Veteran Dog","Veteran Bitch","AV Locally Bred","Junior Handler","Childrens Class"];
  const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  // ---- sign in ----
  let gateP=null;
  (function(){const st=document.createElement("style");st.textContent=`
.gate{position:fixed;inset:0;z-index:50;background:color-mix(in srgb,var(--bg,#f3f4f7) 94%,transparent);display:flex;align-items:center;justify-content:center;padding:16px}
.gate form{background:var(--card,#fff);color:var(--fg,#1b1f2a);border:1px solid var(--line,#dde0e8);border-radius:12px;padding:20px;max-width:380px;width:100%;display:flex;flex-direction:column;gap:12px;box-shadow:0 10px 30px rgba(0,0,0,.15)}
.gate h2{margin:0;font-family:var(--display,inherit);font-size:24px;text-transform:uppercase;letter-spacing:.03em}
.gate .field{display:flex;flex-direction:column;gap:4px}
.gate label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#5d6475)}
.gate input{font:inherit;font-size:16px;color:var(--fg,#1b1f2a);background:var(--bg,#f3f4f7);border:1px solid var(--line,#dde0e8);border-radius:8px;padding:10px 12px;width:100%;box-sizing:border-box}
.gate .note{font-size:13px;color:var(--muted,#5d6475);margin:0}
.gate .err{color:var(--red,#c8322f);font-size:14px;font-weight:600;margin:0}
.gate .err:empty{display:none}
.gate button{font:inherit;font-weight:600;border-radius:8px;padding:11px 16px;border:1px solid var(--accent,#4b2fa3);background:var(--accent,#4b2fa3);color:#fff;cursor:pointer;width:100%}`;document.head.appendChild(st)})();
  function askLogin(msg){
    if(gateP) return gateP;
    gateP=new Promise(res=>{
      const g=document.createElement("div");g.className="gate";
      g.innerHTML=`<form><h2>Sign in</h2><p class="note">Use your MNCF team login. This phone stays signed in.</p>${msg?`<p class="err">${esc(msg)}</p>`:""}
        <div class="field"><label for="loginEmail">Email</label><input type="email" id="loginEmail" autocomplete="username" required></div>
        <div class="field"><label for="loginPw">Password</label><input type="password" id="loginPw" autocomplete="current-password" required></div>
        <p class="err" id="loginErr"></p><div class="btns"><button class="pri" type="submit">Sign in</button></div></form>`;
      document.body.appendChild(g);setTimeout(()=>g.querySelector("input").focus(),50);
      g.querySelector("form").addEventListener("submit",async ev=>{
        ev.preventDefault();const b=g.querySelector("button");b.disabled=true;b.textContent="Signing in…";
        const {error}=await sb.auth.signInWithPassword({email:g.querySelector("#loginEmail").value.trim(),password:g.querySelector("#loginPw").value});
        if(error){g.querySelector("#loginErr").textContent=/invalid/i.test(error.message)?"That email and password don't match a team login.":error.message;b.disabled=false;b.textContent="Sign in";return}
        clearCache();g.remove();gateP=null;roleP=null;res();
      });
    });
    return gateP;
  }
  // Saved copies of lists belong to whoever was signed in: drop them when the login changes (handlers only see their own dogs).
  function clearCache(){try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith("mncf-cache-"))localStorage.removeItem(k)}}catch(e){}}
  async function signedIn(){const {data}=await sb.auth.getSession();if(!data.session)await askLogin();}
  window.mncfSignOut=async()=>{try{localStorage.removeItem("mncf-role");sessionStorage.removeItem("mncf-preview-role");clearCache()}catch(e){}await sb.auth.signOut();location.reload()};
  // ---- roles: admin, organiser, steward (awards only), viewer (read only) ----
  // The database enforces these; pages only use the role to hide what this login can't do.
  const ROLE_NAMES={admin:"Admin",organiser:"Organiser",steward:"Steward",viewer:"Viewer",handler:"Handler"};
  let roleP=null;
  window.mncfRoleName=r=>ROLE_NAMES[r]||"Not on the team";
  // Admins can preview the site as another role (kept for this browser tab only).
  // The preview only changes what this page shows and allows; the database still sees an admin.
  const PREVIEW_KEY="mncf-preview-role";
  // A handler preview can name the handler ("handler:email") so the page shows that person's dogs.
  window.mncfPreview={
    raw(){try{return sessionStorage.getItem(PREVIEW_KEY)||""}catch(e){return ""}},
    get(){const r=this.raw().split(":")[0];return ["organiser","steward","viewer","handler"].includes(r)?r:""},
    email(){const r=this.raw();return r.startsWith("handler:")?r.slice(8).toLowerCase():""},
    set(r){try{if(r&&r!=="admin")sessionStorage.setItem(PREVIEW_KEY,r);else sessionStorage.removeItem(PREVIEW_KEY)}catch(e){}clearCache()} // saved lists differ per role
  };
  const asPreview=r=>r==="admin"&&mncfPreview.get()?mncfPreview.get():r;
  // the login's real role
  window.mncfRealRole=(fresh)=>{
    if(!roleP||fresh) roleP=(async()=>{await signedIn();const {data,error}=await sb.rpc("my_role");if(error)throw error;
      try{localStorage.setItem("mncf-role",data||"")}catch(e){}return data||""})().catch(e=>{roleP=null;return null}); // null: unknown, the database still decides
    return roleP;
  };
  // the role the page acts as: the real role, or the previewed one for an admin
  window.mncfRole=async(fresh)=>{const r=await mncfRealRole(fresh);return r===null?null:asPreview(r)};
  // last known role on this phone, so the page can hide things before the database answers
  window.mncfRoleCached=()=>{try{return asPreview(localStorage.getItem("mncf-role")||"")}catch(e){return ""}};
  const EDIT_ACTIONS=["addShow","updateShow","setSchedule","saveEntry","deleteEntry","setAbsent","addBreed","setBreedGroup","saveDog","importEntries"];
  // Handlers enter, change and withdraw their own dogs, and edit their own dogs' details. The database checks which dogs are theirs.
  const HANDLER_ACTIONS=["saveEntry","deleteEntry","saveDog"];
  const canEdit=r=>r==="admin"||r==="organiser", canAward=r=>canEdit(r)||r==="steward";
  function roleBlock(action,data,r){
    if(r==="handler"&&HANDLER_ACTIONS.includes(action)) return "";
    if(EDIT_ACTIONS.includes(action)&&!canEdit(r)) return `Your login is ${r?"a "+ROLE_NAMES[r]:"not on the team"}, so it can't change shows, entries, dogs or breeds. Ask an admin to change your role.`;
    if(action==="syncState"&&(data.changes||[]).length&&!canAward(r)) return `Your login is ${r?"a "+ROLE_NAMES[r]:"not on the team"}, so it can't record awards. Ask an admin to change your role.`;
    if(["team","setMember","removeMember"].includes(action)&&r!=="admin") return "Only admins can see and change users.";
    return "";
  }
  window.mncfWho=async()=>{const {data}=await sb.auth.getSession();return data.session?data.session.user.email:""};

  // ---- shapes the pages use ----
  const showOut=s=>({id:s.id,Show:s.name,Date:s.show_date,Venue:s.venue,Judge:s.judge,Status:s.status,Notes:s.notes,Schedule:Array.isArray(s.schedule)?s.schedule:[]});
  const dogOut=d=>({"Dog name":d.name,Breed:d.breed,Sex:d.sex,"Date of birth":d.dob,Owner:d.owner,Phone:d.phone,Address:d.address,Breeder:d.breeder,Sire:d.sire,Dam:d.dam,Handlers:Array.isArray(d.handler_emails)?d.handler_emails:null});
  const breedOut=b=>({Breed:b.name,Group:b.grp});
  const entryOut=e=>({_row:e.id,Show:e.show_name,"Ring No":e.ring_no,"Dog name":e.dog_name,Class:e.class,Absent:e.absent,Breed:e.breed,Group:e.grp,Sex:e.sex,Owner:e.owner});
  const fail=e=>{throw new Error(e.message||String(e))};
  async function all(table,order,filter){
    const out=[];for(let from=0;;from+=1000){
      let q=sb.from(table).select("*").order(order).range(from,from+999);if(filter)q=filter(q);
      const {data,error}=await q;if(error)fail(error);out.push(...data);if(data.length<1000)return out;
    }
  }
  const likeExact=s=>String(s).replace(/[\\%_]/g,m=>"\\"+m);
  async function findShow(name){
    const {data,error}=await sb.from("shows").select("*").ilike("name",likeExact(String(name).trim())).limit(1);
    if(error)fail(error);return data[0]||null;
  }
  const shows=async()=>(await all("shows","created_at")).map(showOut);
  const breeds=async()=>(await all("breeds","name")).map(breedOut);
  const dogs=async()=>(await all("dogs","name")).map(dogOut);
  async function entries(show){
    const s=await findShow(show);if(!s)return [];
    return (await all("entries_view","created_at",q=>q.eq("show_id",s.id))).map(entryOut);
  }

  const actions={
    async ping(){return {ok:true}},
    async bootstrap(){const [a,b,c]=await Promise.all([shows(),breeds(),dogs()]);return {ok:true,shows:a,breeds:b,dogs:c,groups:GROUPS,classes:CLASSES}},
    async show(d){const s=await findShow(d.show);if(!s)return {ok:true,show:null,entries:[],dogs:[],breeds:[]};
      const [e,g,b]=await Promise.all([entries(s.name),dogs(),breeds()]);return {ok:true,show:showOut(s),entries:e,dogs:g,breeds:b}},
    async addShow(d){
      const s=d.show||{},name=String(s.Show||"").trim();if(!name)fail({message:"Give the show a name."});
      const row={name,show_date:s.Date||"",venue:s.Venue||"",judge:s.Judge||"",status:s.Status||"Open",notes:s.Notes||""};
      const cur=await findShow(name);
      const {error}=cur?await sb.from("shows").update(row).eq("id",cur.id):await sb.from("shows").insert(row);
      if(error)fail(error);return {ok:true,shows:await shows()};
    },
    // Change the details of an existing show, including its name. Entries and results follow, since they're linked by id.
    async updateShow(d){
      const s=d.show||{},name=String(s.Show||"").trim();if(!name)fail({message:"Give the show a name."});if(!d.id)fail({message:"That show wasn't found. Reload and try again."});
      const other=await findShow(name);if(other&&other.id!==d.id)fail({message:"Another show is already called "+name+"."});
      const row={name,show_date:s.Date||"",venue:s.Venue||"",judge:s.Judge||"",status:s.Status||"Open",notes:s.Notes||""};
      const {data,error}=await sb.from("shows").update(row).eq("id",d.id).select();if(error)fail(error);
      if(!data||!data.length)fail({message:"That show was removed or you can't change it. Reload and try again."});
      return {ok:true,show:showOut(data[0]),shows:await shows()};
    },
    // Judging days and times: the whole list of sessions for one show (see schedule.js).
    async setSchedule(d){
      if(!d.id)fail({message:"That show wasn't found. Reload and try again."});
      const {data,error}=await sb.from("shows").update({schedule:d.schedule||[]}).eq("id",d.id).select();
      if(error)fail(/schedule/i.test(error.message)?{message:"The show database isn't ready for judging days yet (the shows table needs its schedule column)."}:error);
      if(!data||!data.length)fail({message:"That show was removed or you can't change it. Reload and try again."});
      return {ok:true,show:showOut(data[0])};
    },
    // Club dog register (dogs.html): every dog the club knows, with its id, so one dog can be opened and edited.
    async dogs(){return {ok:true,dogs:(await all("dogs","name")).map(d=>Object.assign(dogOut(d),{id:d.id,Added:d.created_at})),breeds:await breeds()}},
    // Add a dog (no id) or change one (id). Renaming a dog also renames its show entries, which are linked by name.
    async saveDog(d){
      const g=d.dog||{},name=String(g["Dog name"]||"").trim(),breed=String(g.Breed||"").trim();
      if(!name)fail({message:"Type the dog's name."});if(!breed)fail({message:"Pick the dog's breed."});
      const row={name,breed,sex:["Dog","Bitch"].includes(g.Sex)?g.Sex:""};
      [["dob","Date of birth"],["owner","Owner"],["phone","Phone"],["address","Address"],["breeder","Breeder"],["sire","Sire"],["dam","Dam"]].forEach(([c,k])=>row[c]=String(g[k]||"").trim());
      // handler logins (organisers set these; a handler's own new dog is linked to them by the database)
      if(Array.isArray(g.Handlers)){
        const bad=g.Handlers.find(e=>!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));if(bad)fail({message:bad+" isn't a valid email."});
        row.handler_emails=[...new Set(g.Handlers.map(e=>String(e).trim().toLowerCase()).filter(Boolean))];
      }
      let old=null;
      if(d.id){const r=await sb.from("dogs").select("name").eq("id",d.id).maybeSingle();if(r.error)fail(r.error);if(!r.data)fail({message:"That dog was removed. Reload and try again."});old=r.data.name}
      const q=d.id?sb.from("dogs").update(row).eq("id",d.id).select():sb.from("dogs").insert(row).select();
      const {data,error}=await q;
      if(error)fail(/duplicate|unique/i.test(error.message)?{message:"A dog called "+name+" is already registered."}:/breed/i.test(error.message)?{message:breed+" isn't in the breed list. Add it on Breeds and groups first."}:error);
      if(!data||!data.length)fail({message:"That dog couldn't be saved. Reload and try again."});
      if(old&&old!==name){const r=await sb.from("entries").update({dog_name:name}).ilike("dog_name",likeExact(old));if(r.error)fail({message:"The dog was renamed, but its show entries still use the old name: "+r.error.message})}
      return {ok:true,dog:Object.assign(dogOut(data[0]),{id:data[0].id,Added:data[0].created_at})};
    },
    // Everything tied to one dog: its show entries and the results recorded for them.
    async dogHistory(d){
      const name=String(d.name||"").trim();if(!name)return {ok:true,entries:[],results:[],shows:[]};
      const {data:ents,error}=await sb.from("entries_view").select("*").ilike("dog_name",likeExact(name)).not("class","in",'("Junior Handler","Childrens Class")');
      if(error)fail(error);
      const ids=[...new Set(ents.map(e=>e.show_id))];
      let res=[],shw=[];
      if(ids.length){
        const [r,s]=await Promise.all([sb.from("live_results").select("show_id,key,value").in("show_id",ids).not("key","like","g|%").not("key","like","auto-off|%").limit(5000),sb.from("shows").select("*").in("id",ids)]);
        if(r.error)fail(r.error);if(s.error)fail(s.error);res=r.data;shw=s.data.map(showOut);
      }
      return {ok:true,entries:ents.map(e=>Object.assign(entryOut(e),{show_id:e.show_id})),results:res,shows:shw};
    },
    async saveEntry(d){
      const {error}=await sb.rpc("save_entry",{p_show:d.entry.Show,p_entry:d.entry,p_dog:d.dog||null});if(error)fail(error);
      const [e,g,b]=await Promise.all([entries(d.entry.Show),dogs(),breeds()]);return {ok:true,entries:e,dogs:g,breeds:b};
    },
    async deleteEntry(d){const {error}=await sb.from("entries").delete().eq("id",d._row);if(error)fail(error);return {ok:true,entries:await entries(d.show)}},
    async setAbsent(d){const {error}=await sb.from("entries").update({absent:!!d.absent}).eq("id",d._row);if(error)fail(error);return {ok:true}},
    async saveResults(){return {ok:true}},
    async addBreed(d){
      const name=String(d.breed||"").trim(),grp=String(d.group||"").trim();
      if(!name)fail({message:"Type the breed's name."});if(!GROUPS.includes(grp))fail({message:"Pick a group for "+name+"."});
      const ex=(await breeds()).find(b=>b.Breed.toLowerCase()===name.toLowerCase());
      if(ex)fail({message:ex.Breed+" is already in the list, in the "+ex.Group+" group."});
      const {error}=await sb.from("breeds").insert({name,grp});if(error)fail(error);return {ok:true,breeds:await breeds()};
    },
    async setBreedGroup(d){
      if(!GROUPS.includes(d.group))fail({message:"Pick a group."});
      const {error}=await sb.from("breeds").update({grp:d.group}).eq("name",d.breed);if(error)fail(error);return {ok:true,breeds:await breeds()};
    },
    // admin view (users.html)
    async team(){const {data,error}=await sb.rpc("team_list");if(error)fail(error);return {ok:true,members:data||[]}},
    async setMember(d){const {error}=await sb.rpc("set_team_member",{p_email:d.email,p_role:d.role,p_name:d.name==null?null:d.name});if(error)fail(error);return actions.team()},
    async removeMember(d){const {error}=await sb.rpc("remove_team_member",{p_email:d.email});if(error)fail(error);return actions.team()},
    async importEntries(d){const {data,error}=await sb.rpc("import_entries",{p_show:d.show,p_entries:d.entries});if(error)fail(error);return Object.assign({ok:true},data)},
    async syncState(d){const {data,error}=await sb.rpc("sync_state",{p_show:d.show,p_changes:d.changes||[],p_since:d.since||0});if(error)fail(error);return Object.assign({ok:true},data)},
    async extract(d){
      const b=(await breeds()).map(x=>`${x.Breed} (${x.Group})`).join("; ");
      const {data,error}=await sb.functions.invoke("extract",{body:{files:d.files,breeds:b}});
      if(error){let msg=error.message;try{const j=await error.context.json();msg=j.error||j.msg||msg}catch(e){}fail({message:msg})}
      if(!data||!data.ok)fail({message:(data&&data.error)||"Claude couldn't read the files."});
      return data;
    }
  };

  async function api(action,data){
    await signedIn();
    if(!actions[action]) throw new Error("Unknown action "+action);
    const myRole=await window.mncfRole();
    const blocked=myRole===null?"":roleBlock(action,data||{},myRole);
    if(blocked) throw new Error(blocked);
    try{return previewFilter(action,await actions[action](data||{}))}
    catch(e){
      const m=e.message||"";
      if(/JWT|not authenticated|permission denied|row-level security/i.test(m)){
        // Signed in but the role doesn't allow it: say so, don't sign out.
        const {data:sd}=await sb.auth.getSession();
        if(sd.session&&!/JWT|not authenticated/i.test(m)){const r=await window.mncfRole(true);if(r)throw new Error(roleBlock(action,Object.assign({changes:[1]},data||{}),r)||"Your login can't do that. Ask an admin to change your role.")}
        await sb.auth.signOut();await askLogin("Please sign in again.");return actions[action](data||{})}
      if(/Failed to fetch|NetworkError|Load failed/i.test(m)) throw new Error("Can't reach the show database. Check the internet connection.");
      throw e;
    }
  }
  // Previewing as a handler: the database still answers as the admin, so narrow the lists here
  // to the dogs of the handler being previewed (or none), the way the database would for them.
  function previewFilter(action,j){
    if(mncfPreview.get()!=="handler"||!j||typeof j!=="object")return j;
    const me=mncfPreview.email(),mine=d=>me&&Array.isArray(d.Handlers)&&d.Handlers.includes(me);
    const out=Object.assign({},j);
    if(Array.isArray(j.dogs))out.dogs=j.dogs.filter(mine);
    const names=new Set((out.dogs||[]).map(d=>String(d["Dog name"]).toLowerCase()));
    if(Array.isArray(j.entries)){
      if(!out.dogs){const all=(mncfCache.get("club-dogs")||{}).dogs||[];all.filter(mine).forEach(d=>names.add(String(d["Dog name"]).toLowerCase()))}
      out.entries=j.entries.filter(e=>names.has(String(e["Dog name"]).toLowerCase()))}
    if(Array.isArray(j.results))out.results=[];
    if(Array.isArray(j.rows))out.rows=[];
    return out;
  }
  window.mncfApi=api;
  window.mncfCache={get:k=>{try{return JSON.parse(localStorage.getItem("mncf-cache-"+k))}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem("mncf-cache-"+k,JSON.stringify(v))}catch(e){}}};
  window.mncfEsc=esc;
  // mncfToast("Saved") or mncfToast("Dog removed",{action:"Undo",onAction(){…},ms:5000}). Slides up above the bottom tabs.
  window.mncfToast=(t,o)=>{o=o||{};let el=document.getElementById("toast");if(!el){el=document.createElement("div");el.id="toast";el.className="toast";document.body.appendChild(el)}
    el.setAttribute("role","status");el.setAttribute("aria-live","polite");el.textContent="";
    const sp=document.createElement("span");sp.textContent=t;el.appendChild(sp);
    const hide=()=>{clearTimeout(el._t);el.classList.remove("show")};
    if(o.action){const b=document.createElement("button");b.type="button";b.className="toast-act";b.textContent=o.action;b.onclick=()=>{hide();if(o.onAction)o.onAction()};el.appendChild(b)}
    el.classList.toggle("has-act",!!o.action);el.classList.remove("show");void el.offsetWidth;el.classList.add("show");
    clearTimeout(el._t);el._t=setTimeout(hide,o.ms||(o.action?5000:2200));return {hide};
  };
  window.mncfQuery=k=>new URLSearchParams(location.search).get(k)||"";
})();
