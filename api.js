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
        g.remove();gateP=null;res();
      });
    });
    return gateP;
  }
  async function signedIn(){const {data}=await sb.auth.getSession();if(!data.session)await askLogin();}
  window.mncfSignOut=async()=>{await sb.auth.signOut();location.reload()};
  window.mncfWho=async()=>{const {data}=await sb.auth.getSession();return data.session?data.session.user.email:""};

  // ---- shapes the pages use ----
  const showOut=s=>({id:s.id,Show:s.name,Date:s.show_date,Venue:s.venue,Judge:s.judge,Status:s.status,Notes:s.notes});
  const dogOut=d=>({"Dog name":d.name,Breed:d.breed,Sex:d.sex,"Date of birth":d.dob,Owner:d.owner,Phone:d.phone,Address:d.address,Breeder:d.breeder,Sire:d.sire,Dam:d.dam});
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
    async saveEntry(d){
      const {error}=await sb.rpc("save_entry",{p_show:d.entry.Show,p_entry:d.entry,p_dog:d.dog||null});if(error)fail(error);
      const [e,g,b]=await Promise.all([entries(d.entry.Show),dogs(),breeds()]);return {ok:true,entries:e,dogs:g,breeds:b};
    },
    async deleteEntry(d){const {error}=await sb.from("entries").delete().eq("id",d._row);if(error)fail(error);return {ok:true,entries:await entries(d.show)}},
    async setAbsent(d){const {error}=await sb.from("entries").update({absent:!!d.absent}).eq("id",d._row);if(error)fail(error);return {ok:true}},
    async saveResults(){return {ok:true}},
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
    try{return await actions[action](data||{})}
    catch(e){
      const m=e.message||"";
      if(/JWT|not authenticated|permission denied|row-level security/i.test(m)){await sb.auth.signOut();await askLogin("Please sign in again.");return actions[action](data||{})}
      if(/Failed to fetch|NetworkError|Load failed/i.test(m)) throw new Error("Can't reach the show database. Check the internet connection.");
      throw e;
    }
  }
  window.mncfApi=api;
  window.mncfCache={get:k=>{try{return JSON.parse(localStorage.getItem("mncf-cache-"+k))}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem("mncf-cache-"+k,JSON.stringify(v))}catch(e){}}};
  window.mncfEsc=esc;
  window.mncfToast=t=>{let el=document.getElementById("toast");if(!el){el=document.createElement("div");el.id="toast";el.className="toast";document.body.appendChild(el)}el.textContent=t;el.classList.add("show");clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove("show"),2200)};
  window.mncfQuery=k=>new URLSearchParams(location.search).get(k)||"";
})();
