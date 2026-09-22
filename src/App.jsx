import React, { useState, useEffect, useRef } from "react";
import {
  Bell, Home, Calendar, MessageSquare, User, MapPin, Check, X, Clock, Trophy,
  ChevronRight, ChevronLeft, LogOut, Shield, Users, Search, Plus, Play, Loader2, Pencil, Trash2, Download, Gift, Star, Wallet, FileText, Heart, Coffee, Sparkles, GraduationCap, BarChart3, Lock
} from "lucide-react";
import { supabase, SUPA_URL } from "./supabase.js";

const C = {
  page:"#E9EDF5", primary:"#255FF0", primaryDark:"#1E4FD0", primarySoft:"rgba(37,95,240,0.10)",
  sidebar:"#1B222A", sidebarMut:"#8A96A6", accent:"#7170F1", accentSoft:"rgba(113,112,241,0.12)",
  surface:"#FFFFFF", bg:"#F5F7FB", border:"#E6EAF1", text:"#17202E", mut:"#6B7688",
  success:"#22B36B", successSoft:"rgba(34,179,107,0.12)", amber:"#F5A623", amberSoft:"#FEF3E2",
};
const CAT = {
  NOTTE_EVENTO:{ label:"Notte Evento", color:C.primary },
  PROMOZIONALE:{ label:"Promozionale", color:C.accent },
  RTS:{ label:"Road To Summer", color:C.amber },
};
const LOGO_W="/logo.png";
const LOGO_B="/logo.png";
const head={fontFamily:"'Barlow Condensed', sans-serif"};
const ruoli={UFFICIO:"Ufficio",CA:"Capo Animazione",CM:"Capo Meta",ACM:"Aiuto Capo Meta",FOTOGRAFO:"Fotografo",VIDEOMAKER:"Videomaker",DJ:"DJ",VOCALIST:"Vocalist",BALLERINA:"Ballerino/a",STAFF:"Staff",CONTENT_CREATOR:"Content Creator",RM:"Resp. Materiali"};
const rlabel=r=>ruoli[r]||r||"Staff";
const isDonna=x=>{const v=(x||"").toUpperCase();return v.startsWith("D")||v.startsWith("F");};
const ICONS={heart:Heart,coffee:Coffee,sparkles:Sparkles,gift:Gift,mappin:MapPin,cap:GraduationCap,star:Star,users:Users,calendar:Calendar,bell:Bell};
const LEVELS=[[0,"Rookie"],[40,"Staff"],[120,"Pro"],[250,"Veterano"],[450,"Leggenda"]];
const PERCORSO_STEPS=[["Candidatura","Il primo passo per entrare nel team."],["Colloquio 1-to-1","Ci conosciamo di persona."],["Meeting di gruppo","Conosci il resto dello staff."],["Disponibilità estiva","Ci dici quando ci sei."],["Stage 1 & 2","Ti formi sul campo."],["Assegnazione ruolo","CA, CM, RM e gli altri ruoli."],["Convocazioni","Ti diciamo dove e quando."],["Road To Summer","La carica prima dell'estate."],["Formazione in meta","Pronti a far divertire."],["Reunion","La grande rimpatriata."],["Feedback & riconferme","Cresci e riparti più forte."]];
const VAPID_PUBLIC="BORRtvXlPR6H4TDNvq9x41WbjyIeuQ3v45MKvcesotxjmRMyvWAqm6kYCEj2rK1BlCyw0mEVpHb_04vVcFHpCDI";
function urlB64ToUint8Array(b){ const pad="=".repeat((4-b.length%4)%4); const s2=(b+pad).replace(/-/g,"+").replace(/_/g,"/"); const raw=atob(s2); const out=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i); return out; }
async function attivaNotifiche(me){
  try{
    if(!("serviceWorker" in navigator) || !("PushManager" in window)){ alert("Le notifiche non sono supportate su questo dispositivo."); return false; }
    const perm=await Notification.requestPermission();
    if(perm!=="granted") return false;
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlB64ToUint8Array(VAPID_PUBLIC)});
    const j=sub.toJSON();
    await supabase.from("push_subscriptions").upsert({staff_id:me.id,endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth},{onConflict:"endpoint"});
    return true;
  }catch(e){ alert("Non è stato possibile attivare le notifiche."); return false; }
}
function useMedia(q){ const [m,setM]=useState(()=>typeof window!=="undefined"&&window.matchMedia(q).matches); useEffect(()=>{const mq=window.matchMedia(q); const h=e=>setM(e.matches); mq.addEventListener("change",h); return ()=>mq.removeEventListener("change",h);},[q]); return m; }

/* =============================== ROOT =============================== */
export default function App(){
  const [me,setMe]=useState(null);
  const [ready,setReady]=useState(false);

  async function loadMe(){
    const { data:{ user } }=await supabase.auth.getUser();
    if(!user){ setMe(null); return; }
    const { data }=await supabase.from("staff_anagrafica").select("*").eq("auth_user_id",user.id).maybeSingle();
    setMe(data||null);
  }
  useEffect(()=>{ (async()=>{ await loadMe(); setReady(true); })(); },[]);
  useEffect(()=>{ if("serviceWorker" in navigator){ navigator.serviceWorker.register("/sw.js").catch(()=>{}); } },[]);

  if(!ready) return <Splash/>;
  if(!me) return <Login onDone={async(sess)=>{ await supabase.auth.setSession(sess); await loadMe(); }}/>;
  if(me.ruolo!=="UFFICIO" && !me.profilo_completato) return <Onboarding me={me} onDone={loadMe} onLogout={async()=>{ await supabase.auth.signOut(); setMe(null); }}/>;
  return <Shell me={me} onLogout={async()=>{ await supabase.auth.signOut(); setMe(null); }} reload={loadMe}/>;
}

function Splash(){
  return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:C.primary}}>
    <img src={LOGO_W} alt="INVIBE" style={{height:96}}/>
  </div>;
}

/* =============================== LOGIN =============================== */
function Login({ onDone }){
  const [u,setU]=useState(""); const [p,setP]=useState("");
  const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(uu=u, pp=p){
    setErr(""); setBusy(true);
    try{
      const r=await fetch(`${SUPA_URL}/functions/v1/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:uu,password:pp})});
      const d=await r.json();
      if(d.session) onDone(d.session); else setErr(d.error||"Accesso non riuscito");
    }catch(e){ setErr("Errore di rete"); }
    setBusy(false);
  }
  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",background:C.primary,padding:24}}>
      <img src={LOGO_W} alt="INVIBE" style={{height:104}}/>
      <p style={{color:"#cfe0ff",margin:"0 0 26px",fontSize:15}}>Area staff</p>
      <div style={{width:"100%",maxWidth:360,background:C.surface,borderRadius:20,padding:22}}>
        <label style={lbl}>Username</label>
        <input value={u} onChange={e=>setU(e.target.value)} placeholder="nomecognome" autoCapitalize="none" style={inp}/>
        <label style={lbl}>Password</label>
        <input value={p} onChange={e=>setP(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()} style={inp}/>
        {err && <p style={{color:"#d33",fontSize:13,margin:"4px 2px 0"}}>{err}</p>}
        <button onClick={submit} disabled={busy||!u||!p} style={{...btnPrimary,width:"100%",marginTop:16,opacity:(busy||!u||!p)?.6:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"13px 0",fontSize:15}}>
          {busy && <Loader2 size={17} className="spin"/>} Entra
        </button>
        <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
          <p style={{fontSize:11,color:C.mut,fontWeight:700,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:.4}}>Accesso rapido</p>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setU("bobogiunipero");setP("c50237c7db");submit("bobogiunipero","c50237c7db");}} style={quickBtn}>Ufficio</button>
            <button onClick={()=>{setU("auroraalberti");setP("3cb1f7677e");submit("auroraalberti","3cb1f7677e");}} style={quickBtn}>Staff</button>
          </div>
        </div>
      </div>
      <p style={{color:"#bfd4ff",fontSize:12,marginTop:18}}>Credenziali fornite dall'ufficio</p>
      <style>{`.spin{animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
const lbl={display:"block",fontSize:12.5,fontWeight:700,color:C.mut,margin:"10px 2px 5px"};
const inp={width:"100%",border:`1px solid ${C.border}`,borderRadius:11,padding:"11px 13px",fontSize:15,color:C.text,outline:"none"};
const quickBtn={flex:1,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 0",background:"#f2f5fb",color:C.text,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Barlow"};

/* =============================== SHELL =============================== */
function OField({label,value,onChange,type,req,valid,placeholder,hint,options}){
  return (
    <div style={{marginBottom:12}}>
      <label style={lbl}>{label}{req?<span style={{color:"#d33"}}> *</span>:null}</label>
      {options
        ? <select value={value} onChange={e=>onChange(e.target.value)} style={inp}><option value="">Seleziona…</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>
        : <input type={type||"text"} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} style={{...inp,borderColor:(req&&value&&!valid)?"#e0a0a0":C.border}}/>}
      {req&&value&&!valid&&hint?<p style={{color:"#d33",fontSize:11.5,margin:"4px 2px 0"}}>{hint}</p>:null}
    </div>
  );
}

function Onboarding({ me, onDone, onLogout }){
  const [f,setF]=useState({nascita:me.nascita||"",sesso:me.sesso||"",citta:me.citta||"",indirizzo:me.indirizzo||"",codice_fiscale:me.codice_fiscale||"",email:me.email||"",telefono:me.telefono||"",instagram:me.instagram||"",professione:me.professione||"",aspirazioni:me.aspirazioni||""});
  const [busy,setBusy]=useState(false); const [err,setErr]=useState("");
  const set=(k,v)=>setF(o=>({...o,[k]:v}));
  const cf=(f.codice_fiscale||"").trim().toUpperCase();
  const emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((f.email||"").trim());
  const telOk=(f.telefono||"").replace(/[^0-9]/g,"").length>=6;
  const cfOk=cf.length===16;
  const req={nascita:!!f.nascita,sesso:!!f.sesso,citta:!!f.citta.trim(),indirizzo:!!f.indirizzo.trim(),codice_fiscale:cfOk,email:emailOk,telefono:telOk};
  const mancanti=Object.values(req).filter(v=>!v).length;
  const ok=mancanti===0;
  async function completa(){
    if(!ok||busy) return; setBusy(true); setErr("");
    const { error }=await supabase.from("staff_anagrafica").update({nascita:f.nascita||null,sesso:f.sesso||null,citta:f.citta.trim()||null,indirizzo:f.indirizzo.trim()||null,codice_fiscale:cf||null,email:f.email.trim()||null,telefono:f.telefono.trim()||null,instagram:f.instagram.trim()||null,professione:f.professione.trim()||null,aspirazioni:f.aspirazioni.trim()||null,profilo_completato:true}).eq("id",me.id);
    setBusy(false);
    if(error){ setErr(error.message); return; }
    onDone();
  }
  return (
    <div style={{minHeight:"100%",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:C.primary,flexShrink:0}}>
        <div style={{maxWidth:640,margin:"0 auto",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <img src={LOGO_W} alt="INVIBE" style={{height:34}}/>
          <button onClick={onLogout} style={iconBtn}><LogOut size={19} color="#cfe0ff"/></button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{maxWidth:640,margin:"0 auto",width:"100%",padding:"18px 16px 40px"}}>
          <h1 style={{...head,fontSize:28,fontWeight:800,margin:"6px 0 6px"}}>Benvenut{isDonna(me.sesso)?"a":"o"}, {me.nome}!</h1>
          <p style={{color:C.mut,fontSize:14,lineHeight:1.5,margin:"0 0 12px"}}>Prima di entrare, controlla che i dati siano giusti e completa quelli mancanti. Ti serve una volta sola.</p>
          <div style={{background:"#fdecec",border:"1px solid #f3b4b4",borderRadius:12,padding:"11px 14px",marginBottom:16,display:"flex",gap:9,alignItems:"flex-start"}}>
            <span style={{fontSize:17,lineHeight:1.1}}>⚠️</span>
            <div style={{fontSize:13,color:"#a12727",fontWeight:600,lineHeight:1.4}}>Attenzione: azione irreversibile. Una volta salvati, questi dati <b>non potrai più modificarli</b> da solo — solo l'ufficio potrà correggerli. Controlla bene prima di confermare.</div>
          </div>
          <div style={{background:ok?C.successSoft:C.amberSoft,border:`1px solid ${ok?"rgba(34,179,107,0.3)":"#f4d9a6"}`,borderRadius:12,padding:"10px 13px",marginBottom:18,fontSize:13.5,fontWeight:700,color:ok?"#177a4a":"#8a5a12"}}>
            {ok?"Tutto pronto — puoi entrare.":`Mancano ${mancanti} ${mancanti===1?"dato":"dati"} da sistemare.`}
          </div>
          <div style={card}>
            <h3 style={{...sect,marginTop:0}}>I tuoi dati</h3>
            <OField label="Data di nascita" type="date" value={f.nascita} onChange={v=>set("nascita",v)} req valid={!!f.nascita}/>
            <OField label="Sesso" value={f.sesso} onChange={v=>set("sesso",v)} req valid={!!f.sesso} options={["Uomo","Donna"]}/>
            <OField label="Città" value={f.citta} onChange={v=>set("citta",v)} req valid={!!f.citta.trim()} placeholder="Es. Torino"/>
            <OField label="Indirizzo di casa" value={f.indirizzo} onChange={v=>set("indirizzo",v)} req valid={!!f.indirizzo.trim()} placeholder="Via, numero, città"/>
            <OField label="Codice fiscale" value={f.codice_fiscale} onChange={v=>set("codice_fiscale",v.toUpperCase())} req valid={cfOk} hint="Deve avere 16 caratteri" placeholder="16 caratteri"/>
          </div>
          <div style={{...card,marginTop:14}}>
            <h3 style={{...sect,marginTop:0}}>Contatti</h3>
            <OField label="Email" type="email" value={f.email} onChange={v=>set("email",v)} req valid={emailOk} hint="Email non valida" placeholder="nome@email.it"/>
            <OField label="Telefono" value={f.telefono} onChange={v=>set("telefono",v)} req valid={telOk} hint="Numero non valido" placeholder="+39 ..."/>
            <OField label="Instagram" value={f.instagram} onChange={v=>set("instagram",v)} placeholder="@tuonome" valid={true}/>
          </div>
          <div style={{...card,marginTop:14}}>
            <h3 style={{...sect,marginTop:0}}>Su di te</h3>
            <OField label="Cosa fai nella vita / studi" value={f.professione} onChange={v=>set("professione",v)} placeholder="Es. Studente di economia" valid={true}/>
            <OField label="Aspirazioni" value={f.aspirazioni} onChange={v=>set("aspirazioni",v)} placeholder="Cosa ti piacerebbe fare in Invibe" valid={true}/>
          </div>
          {err?<p style={{color:"#d33",fontSize:13,margin:"12px 2px 0"}}>{err}</p>:null}
          <button onClick={completa} disabled={!ok||busy} style={{...btnPrimary,width:"100%",marginTop:18,padding:"14px 0",fontSize:15,opacity:(!ok||busy)?.55:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {busy&&<Loader2 size={17} className="spin"/>} Completa e entra
          </button>
          <style>{`.spin{animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    </div>
  );
}

function Shell({ me, onLogout, reload }){
  const [admin,setAdmin]=useState(false);
  const isUff=me.ruolo==="UFFICIO";
  if(admin && isUff) return <Admin me={me} onLogout={onLogout} onBack={()=>setAdmin(false)}/>;
  return <StaffApp me={me} onLogout={onLogout} isUff={isUff} openAdmin={()=>setAdmin(true)} reload={reload}/>;
}

/* =============================== STAFF =============================== */
function StaffApp({ me, onLogout, isUff, openAdmin, reload }){
  const desktop=useMedia("(min-width:860px)");
  const [tab,setTab]=useState("home");
  const [openEvent,setOpenEvent]=useState(null);
  const [events,setEvents]=useState([]); const [rsvp,setRsvp]=useState({});
  const [coms,setComs]=useState([]); const [letto,setLetto]=useState({}); const [classifica,setClassifica]=useState([]); const [riscatti,setRiscatti]=useState([]); const [novita,setNovita]=useState([]); const [impost,setImpost]=useState({}); const [vita,setVita]=useState([]);
  useEffect(()=>{ (async()=>{
    const { data:ev }=await supabase.from("eventi").select("*").order("inizio",{ascending:true});
    setEvents(ev||[]);
    const { data:parts }=await supabase.from("eventi_partecipazioni").select("evento_id,rsvp,citta_partenza,ha_macchina").eq("staff_id",me.id);
    const m={}; (parts||[]).forEach(p=>m[p.evento_id]={rsvp:p.rsvp,citta_partenza:p.citta_partenza,ha_macchina:p.ha_macchina}); setRsvp(m);
    const { data:c }=await supabase.from("comunicazioni").select("*").order("created_at",{ascending:false});
    setComs(c||[]);
    const { data:le }=await supabase.from("comunicazioni_letture").select("comunicazione_id,confermata_at").eq("staff_id",me.id);
    const lm={}; (le||[]).forEach(x=>{ if(x.confermata_at) lm[x.comunicazione_id]=true; }); setLetto(lm);
    const { data:cl }=await supabase.rpc("classifica"); setClassifica(cl||[]);
    await loadRiscatti();
    const { data:nv }=await supabase.from("novita").select("*").eq("attivo",true).order("created_at",{ascending:false}); setNovita(nv||[]);
    const { data:imp }=await supabase.from("impostazioni").select("key,value"); const im={}; (imp||[]).forEach(x=>im[x.key]=x.value); setImpost(im);
    const { data:vs }=await supabase.from("vita_staff").select("*").eq("attivo",true).order("ordine"); setVita(vs||[]);
  })(); },[me.id]);
  async function answer(ev,patch){
    setRsvp(r=>({...r,[ev]:{...(r[ev]||{}),...patch}}));
    const extra=patch.rsvp?{rsvp_at:new Date().toISOString()}:{};
    await supabase.from("eventi_partecipazioni").upsert({evento_id:ev,staff_id:me.id,...patch,...extra},{onConflict:"evento_id,staff_id"});
  }
  async function loadRiscatti(){ const { data }=await supabase.from("riscatti").select("*").eq("staff_id",me.id).order("created_at",{ascending:false}); setRiscatti(data||[]); }
  async function conferma(cid){ setLetto(l=>({...l,[cid]:true})); await supabase.from("comunicazioni_letture").upsert({comunicazione_id:cid,staff_id:me.id,confermata_at:new Date().toISOString()},{onConflict:"comunicazione_id,staff_id"}); }
  const ev=events.find(e=>e.id===openEvent);
  const myPunti=(classifica.find(x=>x.staff_id===me.id)||{}).punti||0;
  const [notifOpen,setNotifOpen]=useState(false); const [notifClosing,setNotifClosing]=useState(false); const [avvisoOpen,setAvvisoOpen]=useState(null);
  const unread=(coms||[]).filter(c=>c.richiede_conferma && !letto[c.id]).length;
  const closeNotif=()=>{ setNotifClosing(true); setTimeout(()=>{ setNotifOpen(false); setNotifClosing(false); },210); };
  const NAV=[["home",Home,"Home"],["eventi",Calendar,"Eventi"],["avvisi",MessageSquare,"Avvisi"],["premi",Gift,"Premi"],["profilo",User,"Profilo"]];
  const content = ev ? <EventDetail ev={ev} part={rsvp[ev.id]||{}} onA={answer} onBack={()=>setOpenEvent(null)} me={me}/>
    : tab==="home" ? <SHome me={me} events={events} rsvp={rsvp} onA={answer} open={setOpenEvent} isUff={isUff} openAdmin={openAdmin} coms={coms} letto={letto} conferma={conferma} classifica={classifica} novita={novita} impost={impost} vita={vita}/>
    : tab==="eventi" ? <SEventi events={events} rsvp={rsvp} open={setOpenEvent}/>
    : tab==="avvisi" ? <SAvvisi coms={coms} letto={letto} conferma={conferma}/>
    : tab==="premi" ? <SPremi me={me} myPunti={myPunti} riscatti={riscatti} reloadRiscatti={loadRiscatti}/>
    : <SProfilo me={me} onLogout={onLogout} reload={reload}/>;
  return (
    <div style={{background:C.bg,display:"flex",flexDirection:"column",height:desktop?undefined:"100%",minHeight:desktop?"100%":undefined}}>
      <div style={{background:C.primary,flexShrink:0}}>
        <div style={{maxWidth:1080,margin:"0 auto",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
          <img src={LOGO_W} alt="INVIBE" style={{height:34,display:"block"}}/>
          {desktop && <div style={{display:"flex",gap:6}}>
            {NAV.map(([k,Ic,l])=>{ const on=tab===k; return (
              <button key={k} onClick={()=>{setTab(k);setOpenEvent(null);}} style={{display:"flex",alignItems:"center",gap:7,border:"none",cursor:"pointer",borderRadius:9,padding:"8px 14px",background:on?"rgba(255,255,255,0.18)":"transparent",color:"#fff",fontFamily:"Barlow",fontWeight:on?700:600,fontSize:14}}>
                <Ic size={17}/> {l}</button>); })}
          </div>}
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <button onClick={()=>setNotifOpen(true)} style={{...iconBtn,position:"relative"}}><Bell size={20} color="#fff"/>{unread>0 && <span style={{position:"absolute",top:-5,right:-5,minWidth:16,height:16,borderRadius:8,background:"#ff4d4f",color:"#fff",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px"}}>{unread}</span>}</button>
            <button onClick={onLogout} style={iconBtn}><LogOut size={19} color="#cfe0ff"/></button>
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{maxWidth:desktop?680:480,margin:"0 auto",width:"100%",paddingBottom:desktop?0:86}}>{content}</div>
      </div>
      {!ev && !desktop && <nav style={{position:"fixed",bottom:0,left:0,right:0,height:64,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:50}}>
        {NAV.map(([k,Ic,l])=>{ const on=tab===k; return <button key={k} onClick={()=>setTab(k)} style={{flex:1,border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,paddingTop:9,color:on?C.primary:C.mut}}><Ic size={21} strokeWidth={on?2.4:1.9}/><span style={{fontSize:11,fontWeight:on?700:500}}>{l}</span></button>; })}
      </nav>}
      {notifOpen && (
        <div onMouseDown={e=>{ if(e.target===e.currentTarget) closeNotif(); }} style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,0.15)",animation:notifClosing?"bgOut .2s ease forwards":"bgIn .3s ease forwards"}}>
          <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:58,right:12,left:12,maxWidth:400,marginLeft:"auto",background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,boxShadow:"0 20px 50px rgba(20,40,80,0.22)",maxHeight:"72vh",overflowY:"auto",transformOrigin:"top right",animation:notifClosing?"notifOut .2s cubic-bezier(.4,0,1,1) forwards":"notifIn .42s cubic-bezier(.16,1,.3,1) forwards"}}>
            <div style={{padding:"13px 16px",fontFamily:"'Barlow Condensed', sans-serif",fontWeight:800,fontSize:17}}>Notifiche</div>
            {(()=>{ const uncon=(coms||[]).filter(c=>c.richiede_conferma && !letto[c.id]); const up=(events||[]).slice(0,5); const otherC=(coms||[]).filter(c=>!(c.richiede_conferma && !letto[c.id])).slice(0,6);
              if(uncon.length===0 && up.length===0 && otherC.length===0) return <div style={{padding:"6px 16px 18px",color:C.mut,fontSize:13}}>Nessuna notifica.</div>;
              return <div>
                {uncon.map(c=><NotifRow key={c.id} color={C.amber} title={c.titolo} sub="Da confermare" onClick={()=>{ setNotifOpen(false); setAvvisoOpen(c); }}/>)}
                {up.map(e=>{ const cat=CAT[e.categoria]||CAT.NOTTE_EVENTO; return <NotifRow key={e.id} color={cat.color} title={e.titolo} sub={cat.label+" · "+fdate(e.inizio)} onClick={()=>{ setNotifOpen(false); setOpenEvent(e.id); }}/>; })}
                {otherC.map(c=><NotifRow key={c.id} color={C.primary} title={c.titolo} sub={"Avviso · "+fdate(c.created_at)} onClick={()=>{ setNotifOpen(false); setAvvisoOpen(c); }}/>)}
              </div>; })()}
          </div>
        </div>
      )}
      {avvisoOpen && <AvvisoModal c={avvisoOpen} confermato={!!letto[avvisoOpen.id]} onConferma={()=>conferma(avvisoOpen.id)} onClose={()=>setAvvisoOpen(null)}/>}
    </div>
  );
}

function NotifRow({ color, title, sub, onClick }){
  return <button onClick={onClick} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",borderTop:`1px solid ${C.border}`,cursor:"pointer",padding:"12px 16px",display:"flex",gap:10,alignItems:"center"}}>
    <span style={{width:8,height:8,borderRadius:4,background:color,flexShrink:0}}/>
    <span style={{flex:1,minWidth:0}}><span style={{display:"block",fontWeight:700,fontSize:14,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</span><span style={{display:"block",fontSize:12,color:C.mut,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sub}</span></span>
    <ChevronRight size={16} color={C.mut}/>
  </button>;
}

function SHome({ me, events, rsvp, onA, open, isUff, openAdmin, coms, letto, conferma, classifica, novita, impost, vita }){
  const [openAvviso,setOpenAvviso]=useState(null); const [clAll,setClAll]=useState(false);
  const upcoming=events.slice(0,6);
  const bannerComs=(coms||[]).filter(c=>c.richiede_conferma && !letto[c.id]);
  const cl=classifica||[];
  const myIdx=cl.findIndex(x=>x.staff_id===me.id);
  const myPunti=myIdx>=0?cl[myIdx].punti:0;
  const myRank=myIdx>=0?myIdx+1:0;
  const top=cl.slice(0,5);
  const P=Number(myPunti)||0;
  let lvlIdx=0; LEVELS.forEach((l,i)=>{ if(P>=l[0]) lvlIdx=i; });
  const lvl=LEVELS[lvlIdx]; const nextL=LEVELS[lvlIdx+1];
  const prog=nextL?Math.min(100,Math.round((P-lvl[0])/(nextL[0]-lvl[0])*100)):100;
  return (
    <div style={{padding:"16px 16px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <p style={{margin:0,color:C.mut,fontSize:13}}>Ciao,</p>
          <h1 style={{...head,fontSize:30,fontWeight:800,margin:"1px 0 3px"}}>{me.nome}</h1>
          <p style={{margin:0,color:C.mut,fontSize:12.5}}>{rlabel(me.ruolo)}{me.zona?` · ${me.zona}`:""}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:C.accentSoft,borderRadius:999,padding:"6px 11px"}}>
          <Trophy size={14} color={C.accent}/><span style={{...head,fontWeight:700,fontSize:14,color:C.accent}}>{myPunti}</span>
        </div>
      </div>

      {bannerComs.length>0 && <div style={{marginBottom:18,display:"flex",flexDirection:"column",gap:10}}>
        {bannerComs.map(bc=>(
          <div key={bc.id} style={{background:C.amberSoft,border:"1px solid #f4d9a6",borderRadius:16,padding:14}}>
            <button onClick={()=>setOpenAvviso(bc)} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",cursor:"pointer",padding:0,display:"flex",gap:9}}>
              <Bell size={17} color={C.amber} style={{flexShrink:0,marginTop:1}}/>
              <div style={{flex:1}}>
                <p style={{margin:0,fontWeight:700,fontSize:14}}>{bc.titolo}</p>
                {bc.corpo && <p style={{margin:"2px 0 0",fontSize:12.5,color:C.mut,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{bc.corpo}</p>}
                {bc.corpo && <span style={{fontSize:11.5,color:C.amber,fontWeight:700,display:"inline-block",marginTop:3}}>Apri</span>}
              </div>
            </button>
            <button onClick={()=>conferma(bc.id)} style={{...btnPrimary,width:"100%",marginTop:11,background:C.amber,color:"#1a1206"}}>Ho letto e confermo</button>
          </div>))}
      </div>}
      {isUff && <button onClick={openAdmin} style={{...btnPrimary,width:"100%",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 0"}}>
        <Shield size={17}/> Pannello Admin</button>}

      <h3 style={sect}>Aftermovie Estate 2026</h3>
      <button onClick={()=>{ const u=(impost||{}).aftermovie_url; if(u) window.open(u,"_blank"); }} style={{position:"relative",width:"100%",height:190,borderRadius:18,overflow:"hidden",marginBottom:24,background:"linear-gradient(130deg,#7170F1,#255FF0 55%,#18C7D0)",display:"flex",alignItems:"center",justifyContent:"center",border:"none",padding:0,cursor:(impost&&impost.aftermovie_url)?"pointer":"default"}}>
        <div style={{width:58,height:58,borderRadius:30,background:"rgba(255,255,255,0.92)",display:"flex",alignItems:"center",justifyContent:"center"}}><Play size={24} color={C.primary} style={{marginLeft:3}}/></div>
        <div style={{position:"absolute",left:14,bottom:12,right:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{...head,color:"#fff",fontWeight:700,fontSize:18}}>{(impost&&impost.aftermovie_titolo)||"Rivivi l'estate"}</span>
        </div>
      </button>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}>
        <h3 style={{...sect,margin:0}}>Prossimi eventi</h3>
      </div>
      {upcoming.length===0
        ? <div style={{...card,color:C.mut,fontSize:13,marginBottom:24}}>Nessun evento in programma. Arriverà un avviso quando ce ne sarà uno.</div>
        : <div style={{display:"flex",gap:11,overflowX:"auto",paddingBottom:6,marginBottom:24}}>
            {upcoming.map(e=>{ const cat=CAT[e.categoria]||CAT.NOTTE_EVENTO; return (
              <button key={e.id} onClick={()=>open(e.id)} style={{flex:"0 0 200px",textAlign:"left",cursor:"pointer",background:C.surface,border:`1px solid ${C.border}`,borderRadius:15,padding:0,overflow:"hidden"}}>
                <div style={{height:6,background:cat.color}}/>
                <div style={{padding:13}}>
                  <span style={{fontSize:11,fontWeight:700,color:cat.color}}>{cat.label}</span>
                  <div style={{...head,fontSize:17,fontWeight:700,margin:"3px 0 7px",color:C.text}}>{e.titolo}</div>
                  <div style={{fontSize:12,color:C.mut,display:"flex",alignItems:"center",gap:5}}><Clock size={12}/> {fdate(e.inizio)}</div>
                  {e.luogo && <div style={{fontSize:12,color:C.mut,display:"flex",alignItems:"center",gap:5,marginTop:3}}><MapPin size={12}/> {e.luogo}</div>}
                </div>
              </button>); })}
          </div>}

      {(novita||[]).length>0 && <>
        <h3 style={sect}>Novità</h3>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          {novita.map((n,i)=><News key={n.id} tag={n.tag||"Novità"} color={i%2?C.primary:C.accent} title={n.titolo} body={n.corpo||""} time={fdate(n.created_at)}/>)}
        </div>
      </>}
      <h3 style={{...sect,marginTop:24}}>Il tuo livello</h3>
      <div style={{...card,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
          <span style={{...head,fontSize:20,fontWeight:800,color:C.primary}}>{lvl[1]}</span>
          <span style={{...head,fontSize:16,fontWeight:800,color:C.accent}}>{P} punti</span>
        </div>
        <div style={{height:9,borderRadius:5,background:"#eef1f6",overflow:"hidden"}}><div style={{width:prog+"%",height:"100%",background:`linear-gradient(90deg,${C.primary},${C.accent})`,borderRadius:5}}/></div>
        <p style={{fontSize:12,color:C.mut,margin:"7px 0 0"}}>{nextL?`Ti mancano ${Math.max(0,nextL[0]-P)} punti per il livello "${nextL[1]}"`:"Hai raggiunto il livello massimo!"}</p>
      </div>
      <h3 style={{...sect,marginTop:24}}>Il tuo percorso in Invibe</h3>
      <PercorsoStaff stadio={me.percorso_stadio}/>
      {(vita||[]).length>0 && <>
        <h3 style={{...sect,marginTop:24}}>Vita da staff</h3>
        <VitaStaff items={vita}/>
      </>}
      {openAvviso && <AvvisoModal c={openAvviso} confermato={!!letto[openAvviso.id]} onConferma={()=>conferma(openAvviso.id)} onClose={()=>setOpenAvviso(null)}/>}
    </div>
  );
}

function SEventi({ events, rsvp, open }){
  return (
    <div style={{padding:"16px 16px 24px"}}>
      <h1 style={{...head,fontSize:26,fontWeight:800,margin:"4px 0 3px"}}>Eventi</h1>
      <p style={{margin:"0 0 18px",color:C.mut,fontSize:13}}>Metti se ci sarai.</p>
      {events.length===0 ? <div style={{...card,color:C.mut,fontSize:13}}>Nessun evento al momento.</div>
      : <div style={{display:"flex",flexDirection:"column",gap:11}}>
          {events.map(e=><ERow key={e.id} e={e} state={rsvp[e.id]} onClick={()=>open(e.id)}/>)}
        </div>}
    </div>
  );
}

function SAvvisi({ coms, letto, conferma }){
  const [open,setOpen]=useState(null);
  return (
    <div style={{padding:"16px 16px 24px"}}>
      <h1 style={{...head,fontSize:26,fontWeight:800,margin:"4px 0 3px"}}>Avvisi</h1>
      <p style={{margin:"0 0 18px",color:C.mut,fontSize:13}}>Comunicazioni dall'ufficio. Tocca per aprire.</p>
      {coms.length===0 ? <div style={{...card,color:C.mut,fontSize:13}}>Nessun avviso.</div>
      : <div style={{display:"flex",flexDirection:"column",gap:11}}>
          {coms.map(c=>{ const confermato=!!letto[c.id]; return (
            <button key={c.id} onClick={()=>setOpen(c)} style={{...card,textAlign:"left",cursor:"pointer",width:"100%",display:"block"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,gap:8}}>
                <span style={{fontWeight:700,fontSize:14.5}}>{c.titolo}</span>
                {c.richiede_conferma && (confermato
                  ? <span style={{fontSize:10.5,fontWeight:700,color:C.success,background:C.successSoft,borderRadius:6,padding:"3px 7px",whiteSpace:"nowrap"}}>CONFERMATO</span>
                  : <span style={{fontSize:10.5,fontWeight:700,color:C.amber,background:C.amberSoft,borderRadius:6,padding:"3px 7px",whiteSpace:"nowrap"}}>DA CONFERMARE</span>)}
              </div>
              {c.corpo && <p style={{margin:"0 0 7px",fontSize:13,color:C.mut,lineHeight:1.45,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{c.corpo}</p>}
              <span style={{fontSize:11.5,color:C.mut}}>{fdate(c.created_at)}</span>
            </button>); })}
        </div>}
      {open && <AvvisoModal c={open} confermato={!!letto[open.id]} onConferma={()=>conferma(open.id)} onClose={()=>setOpen(null)}/>}
    </div>
  );
}

function AvvisoModal({ c, confermato, onConferma, onClose }){
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}} onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:18,width:"100%",maxWidth:520,margin:"24px 0",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:8}}>
          <h3 style={{...head,fontSize:22,fontWeight:800,margin:0}}>{c.titolo}</h3>
          <button onClick={onClose} style={iconBtn}><X size={22} color={C.mut}/></button>
        </div>
        <span style={{fontSize:12,color:C.mut}}>{fdate(c.created_at)}</span>
        {c.corpo && <p style={{margin:"14px 0 0",fontSize:14.5,color:C.text,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{c.corpo}</p>}
        {c.richiede_conferma && (confermato
          ? <div style={{marginTop:18,display:"inline-flex",alignItems:"center",gap:6,color:C.success,fontSize:13.5,fontWeight:700}}><Check size={16}/> Confermato</div>
          : <button onClick={()=>{ onConferma(); onClose(); }} style={{...btnPrimary,width:"100%",marginTop:18,background:C.amber,color:"#1a1206"}}>Ho letto e confermo</button>)}
      </div>
    </div>
  );
}

function SProfilo({ me, onLogout, reload }){
  const [edit,setEdit]=useState(false);
  const [pw,setPw]=useState(false);
  const [notif,setNotif]=useState(typeof Notification!=="undefined" && Notification.permission==="granted");
  const pub=[["Ruolo",rlabel(me.ruolo)],["Zona",me.zona||"—"],["Anno d'ingresso",me.anno_ingresso||"—"],["Turni fatti",me.settimane_2025??"—"],["Taglia divisa",me.taglia_maglia||"—"]];
  const priv=[["Email",me.email||"—"],["Telefono",me.telefono||"—"],["Città",me.citta||"—"],["Indirizzo",me.indirizzo||"—"],["Codice fiscale",me.codice_fiscale||"—"]];
  const ini=((me.nome||" ")[0]+(me.cognome||" ")[0]).toUpperCase();
  return (
    <div style={{padding:"16px 16px 28px"}}>
      <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:16}}>
        <div style={{width:62,height:62,borderRadius:31,background:C.primarySoft,display:"flex",alignItems:"center",justifyContent:"center",...head,fontSize:22,fontWeight:800,color:C.primary}}>{ini}</div>
        <div><h1 style={{...head,fontSize:23,fontWeight:800,margin:0}}>{me.nome} {me.cognome}</h1>
          <p style={{margin:"2px 0 0",color:C.mut,fontSize:13}}>{rlabel(me.ruolo)}{me.zona?` · ${me.zona}`:""}</p></div>
      </div>
      <button onClick={async()=>{ const ok=await attivaNotifiche(me); setNotif(ok||notif); }} style={{...btnGhost,width:"100%",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:notif?C.success:C.text,borderColor:notif?"#bfe6cf":C.border}}><Bell size={16}/> {notif?"Notifiche attive":"Attiva notifiche"}</button>
      <button onClick={()=>setPw(true)} style={{...btnGhost,width:"100%",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>Cambia password</button>
      <h3 style={sect}>Informazioni</h3><Info rows={pub}/>
      <h3 style={{...sect,marginTop:18}}>Dati personali · solo tu e l'ufficio</h3><Info rows={priv}/>
      <button onClick={onLogout} style={{...btnGhost,width:"100%",marginTop:20,color:"#d33",borderColor:"#f0c4c4",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><LogOut size={17}/> Esci</button>
      {pw && <PasswordEdit me={me} onClose={()=>setPw(false)}/>}
    </div>
  );
}

function EventDetail({ ev, part, onA, onBack, me }){
  const cat=CAT[ev.categoria]||CAT.NOTTE_EVENTO;
  const rs=part.rsvp;
  const [citta,setCitta]=useState(part.citta_partenza||"");
  const [auto,setAuto]=useState(part.ha_macchina);
  const [voto,setVoto]=useState(0); const [commento,setCommento]=useState("");
  useEffect(()=>{ supabase.from("valutazioni").select("voto,commento").eq("evento_id",ev.id).eq("staff_id",me.id).eq("tipo","staff_su_evento").maybeSingle().then(({data})=>{ if(data){ setVoto(data.voto||0); setCommento(data.commento||""); } }); },[ev.id]);
  async function saveVal(v,c){ await supabase.from("valutazioni").upsert({evento_id:ev.id,staff_id:me.id,tipo:"staff_su_evento",voto:v||null,commento:(c||"").trim()||null},{onConflict:"evento_id,staff_id,tipo"}); }
  const tb=(active)=>({flex:1,cursor:"pointer",borderRadius:11,padding:"11px 0",fontFamily:"Barlow",fontWeight:700,fontSize:14,border:active?"none":`1px solid ${C.border}`,background:active?C.primary:C.surface,color:active?"#fff":C.text});
  return (
    <div style={{paddingBottom:28}}>
      <div style={{padding:"10px 14px 0"}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:3,background:"transparent",border:"none",cursor:"pointer",color:C.mut,fontSize:14,padding:"6px 0"}}><ChevronLeft size={18}/> Indietro</button>
      </div>
      <div style={{margin:"8px 16px 0",...card,borderTop:`3px solid ${cat.color}`,padding:20}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}><span style={{width:8,height:8,borderRadius:4,background:cat.color}}/><span style={{fontSize:12,fontWeight:700,color:cat.color}}>{cat.label}</span></div>
        <h1 style={{...head,fontSize:27,fontWeight:800,margin:"0 0 14px",lineHeight:1.03}}>{ev.titolo}</h1>
        <Line icon={<Clock size={16} color={C.mut}/>} t={fdate(ev.inizio)}/>
        {ev.luogo && <Line icon={<MapPin size={16} color={C.mut}/>} t={ev.luogo}/>}
        {ev.descrizione && <p style={{margin:"14px 0 0",fontSize:13.5,color:C.mut,lineHeight:1.5}}>{ev.descrizione}</p>}
      </div>
      <div style={{margin:"20px 16px 0"}}>
        <p style={{...head,fontSize:15,fontWeight:700,margin:"0 0 10px"}}>Ci sarai?</p>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onA(ev.id,{rsvp:"ci_saro"})} style={{...bigBtn,background:rs==="ci_saro"?C.success:C.surface,color:rs==="ci_saro"?"#fff":C.text,border:rs==="ci_saro"?"none":`1px solid ${C.border}`}}><Check size={18}/> Ci sarò</button>
          <button onClick={()=>onA(ev.id,{rsvp:"non_ci_saro"})} style={{...bigBtn,background:rs==="non_ci_saro"?"#eef1f6":C.surface,color:C.text,border:`1px solid ${C.border}`}}><X size={18}/> Non ci sarò</button>
        </div>
        {rs==="ci_saro" && (
          <div style={{...card,marginTop:14}}>
            <label style={lbl}>Da dove parti?</label>
            <input value={citta} onChange={e=>setCitta(e.target.value)} onBlur={()=>onA(ev.id,{citta_partenza:citta.trim()||null})} placeholder="Città di partenza" style={inp}/>
            <label style={{...lbl,marginTop:12}}>Hai la macchina?</label>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button onClick={()=>{setAuto(true);onA(ev.id,{ha_macchina:true});}} style={tb(auto===true)}>Sì</button>
              <button onClick={()=>{setAuto(false);onA(ev.id,{ha_macchina:false});}} style={{...tb(auto===false),background:auto===false?"#eef1f6":C.surface,color:C.text,border:auto===false?"none":`1px solid ${C.border}`}}>No</button>
            </div>
          </div>
        )}
        {rs && <p style={{fontSize:12.5,color:C.mut,margin:"12px 2px 0"}}>{rs==="ci_saro"?"Risposta salvata. L'ufficio confermerà la presenza alla serata.":"Ok, l'ufficio è stato avvisato."}</p>}
      </div>
    </div>
  );
}

function Admin({ me, onLogout, onBack }){
  const desktop=useMedia("(min-width:860px)");
  const [section,setSection]=useState("staff");
  const NAV=[["staff",Users,"Staff"],["eventi",Calendar,"Eventi"],["stats",BarChart3,"Stats"],["avvisi",MessageSquare,"Avvisi"],["premi",Gift,"Premi"],["economia",Wallet,"Economia"],["contratti",FileText,"Contratti"]];
  const body = section==="staff" ? <AdminStaff/>
    : section==="eventi" ? <AdminEventi me={me}/>
    : section==="avvisi" ? <AdminComunicazioni me={me}/>
    : section==="premi" ? <AdminPremi/>
    : section==="economia" ? <AdminEconomia/>
    : section==="contratti" ? <AdminContratti/>
    : section==="stats" ? <AdminStats/>
    : null;
  return (
    <div style={{background:C.bg,display:"flex",flexDirection:desktop?"row":"column",height:desktop?undefined:"100%",minHeight:desktop?"100%":undefined}}>
      {desktop &&
      <div style={{width:92,background:C.sidebar,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:16}}>
        <img src={LOGO_W} alt="INVIBE" style={{width:48,marginBottom:20}}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:6,width:92}}>
          {NAV.map(([k,Ic,l])=>{ const on=section===k; return (
            <button key={k} onClick={()=>setSection(k)} style={{width:92,border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 0",color:on?"#fff":C.sidebarMut}}><Ic size={21}/><span style={{fontSize:10.5,fontWeight:on?700:500}}>{l}</span></button>); })}
        </div>
        <button onClick={onLogout} style={{...iconBtn,color:C.sidebarMut,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"14px 0"}}><LogOut size={20}/><span style={{fontSize:10.5}}>Esci</span></button>
      </div>}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <div style={{background:C.primary,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px",height:56}}>
          <div style={{display:"flex",alignItems:"center",gap:9,color:"#fff"}}>
            <button onClick={onBack} style={iconBtn}><ChevronLeft size={20} color="#fff"/></button>
            <Shield size={18} color="#fff"/><span style={{...head,fontWeight:700,fontSize:18,color:"#fff"}}>Pannello Admin</span>
          </div>
          <img src={LOGO_W} alt="INVIBE" style={{height:30}}/>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:20,paddingBottom:desktop?20:96}}>{body}</div>
      </div>
      {!desktop &&
      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:C.sidebar,display:"flex",borderTop:"1px solid rgba(255,255,255,0.08)",zIndex:50}}>
        {NAV.map(([k,Ic,l])=>{ const on=section===k; return (
          <button key={k} onClick={()=>setSection(k)} style={{flex:1,border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"9px 0",color:on?"#fff":C.sidebarMut}}><Ic size={20}/><span style={{fontSize:10,fontWeight:on?700:500}}>{l}</span></button>); })}
        <button onClick={onLogout} style={{flex:1,border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"9px 0",color:C.sidebarMut}}><LogOut size={20}/><span style={{fontSize:10}}>Esci</span></button>
      </nav>}
    </div>
  );
}

function AdminStaff(){
  const [rows,setRows]=useState(null); const [q,setQ]=useState(""); const [detail,setDetail]=useState(null);
  const [fRuolo,setFRuolo]=useState(""); const [fStato,setFStato]=useState("tutti"); const [fSesso,setFSesso]=useState("tutti");
  const [sortKey,setSortKey]=useState(0); const [sortDir,setSortDir]=useState("asc");
  async function load(){ const { data }=await supabase.from("staff_anagrafica").select("id,nome,cognome,ruolo,sesso,nascita,citta,indirizzo,email,telefono,codice_fiscale,instagram,anno_ingresso,settimane_2024,settimane_2025,settimane_2026,taglia_maglia,professione,attivo").order("cognome"); setRows(data||[]); }
  useEffect(()=>{ load(); },[]);
  async function esporta(){
    const { data }=await supabase.from("staff_anagrafica").select("nome,cognome,ruolo,username,password_iniziale").order("cognome");
    const lines=[["Nome","Cognome","Ruolo","Username","Password"]].concat((data||[]).map(r=>[r.nome,r.cognome,r.ruolo,r.username,r.password_iniziale]));
    const csv=lines.map(r=>r.map(x=>`"${(x==null?"":String(x)).replace(/"/g,String.fromCharCode(34)+String.fromCharCode(34))}"`).join(",")).join(String.fromCharCode(10));
    downloadCSV("credenziali-staff.csv",csv);
  }
  if(detail) return <StaffDetail id={detail} onBack={()=>{setDetail(null);load();}}/>;
  const dt=v=>v?new Date(v).toLocaleDateString("it-IT"):"—";
  const COLS=[
    ["Nome",r=>`${r.nome} ${r.cognome}`,"180px",r=>`${r.cognome} ${r.nome}`.toLowerCase()],
    ["Ruolo",r=>rlabel(r.ruolo),"130px",r=>rlabel(r.ruolo)],
    ["Sesso",r=>r.sesso||"—","80px",r=>r.sesso],
    ["Nascita",r=>dt(r.nascita),"100px",r=>r.nascita],
    ["Città",r=>r.citta||"—","120px",r=>r.citta],
    ["Indirizzo",r=>r.indirizzo||"—","190px",r=>r.indirizzo],
    ["Email",r=>r.email||"—","210px",r=>r.email],
    ["Telefono",r=>r.telefono||"—","130px",r=>r.telefono],
    ["Cod. fiscale",r=>r.codice_fiscale||"—","150px",r=>r.codice_fiscale],
    ["Instagram",r=>r.instagram||"—","130px",r=>r.instagram],
    ["Anno",r=>r.anno_ingresso||"—","60px",r=>r.anno_ingresso],
    ["S.24",r=>r.settimane_2024??"—","56px",r=>r.settimane_2024],
    ["S.25",r=>r.settimane_2025??"—","56px",r=>r.settimane_2025],
    ["S.26",r=>r.settimane_2026??"—","56px",r=>r.settimane_2026],
    ["Taglia",r=>r.taglia_maglia||"—","70px",r=>r.taglia_maglia],
    ["Cosa fa",r=>r.professione||"—","170px",r=>r.professione],
    ["Stato",null,"92px",r=>r.attivo?1:0],
  ];
  const grid=COLS.map(c=>c[2]).join(" ");
  const cell={overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.mut};
  const fsel={border:`1px solid ${C.border}`,borderRadius:9,padding:"7px 10px",fontSize:13,color:C.text,background:C.surface,fontFamily:"Barlow"};
  let list=(rows||[]).filter(r=>{
    if(q && !(`${r.nome} ${r.cognome}`).toLowerCase().includes(q.toLowerCase())) return false;
    if(fRuolo && r.ruolo!==fRuolo) return false;
    if(fStato==="attivi" && !r.attivo) return false;
    if(fStato==="inattivi" && r.attivo) return false;
    if(fSesso==="donna" && !isDonna(r.sesso)) return false;
    if(fSesso==="uomo" && (isDonna(r.sesso)|| !r.sesso)) return false;
    return true;
  });
  const sv=COLS[sortKey][3];
  list=[...list].sort((a,b)=>{ const x=sv(a),y=sv(b); if(x==null&&y==null)return 0; if(x==null)return 1; if(y==null)return -1; if(typeof x==="number"&&typeof y==="number")return x-y; return String(x).localeCompare(String(y),"it"); });
  if(sortDir==="desc") list.reverse();
  const clickSort=ci=>{ if(sortKey===ci) setSortDir(d=>d==="asc"?"desc":"asc"); else { setSortKey(ci); setSortDir("asc"); } };
  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <BigStat n={rows?rows.length:"…"} l="Staff totali" Ic={Users} col={C.primary}/>
        <BigStat n={rows?rows.filter(r=>r.attivo).length:"…"} l="Attivi" Ic={Check} col={C.success}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
        <h2 style={{...head,fontSize:22,fontWeight:800,margin:0,flex:1}}>Anagrafica staff</h2>
        <div style={{display:"flex",alignItems:"center",gap:7,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 11px"}}>
          <Search size={15} color={C.mut}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cerca…" style={{border:"none",outline:"none",fontSize:13,color:C.text,width:120}}/>
        </div>
        <button onClick={esporta} style={{...btnGhost,display:"flex",alignItems:"center",gap:6,padding:"8px 12px",fontSize:13}}><Download size={15}/> Credenziali</button>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
        <select value={fRuolo} onChange={e=>setFRuolo(e.target.value)} style={fsel}>
          <option value="">Tutti i ruoli</option>
          {Object.entries(ruoli).map(([k,l])=><option key={k} value={k}>{l}</option>)}
        </select>
        <select value={fStato} onChange={e=>setFStato(e.target.value)} style={fsel}>
          <option value="tutti">Tutti gli stati</option><option value="attivi">Solo attivi</option><option value="inattivi">Solo inattivi</option>
        </select>
        <select value={fSesso} onChange={e=>setFSesso(e.target.value)} style={fsel}>
          <option value="tutti">Uomo e Donna</option><option value="uomo">Solo uomini</option><option value="donna">Solo donne</option>
        </select>
        {(fRuolo||fStato!=="tutti"||fSesso!=="tutti") && <button onClick={()=>{setFRuolo("");setFStato("tutti");setFSesso("tutti");}} style={{...fsel,cursor:"pointer",color:C.primary,fontWeight:700}}>Azzera filtri</button>}
        <span style={{alignSelf:"center",fontSize:12.5,color:C.mut}}>{list.length} risultati</span>
      </div>
      <p style={{fontSize:12,color:C.mut,margin:"0 0 8px"}}>Scorri in orizzontale · clic sull'intestazione per riordinare · tocca una riga per la scheda. (S.24/25/26 = turni per anno)</p>
      <div style={{...card,padding:0,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <div style={{minWidth:2000}}>
            <div style={{display:"grid",gridTemplateColumns:grid,gap:10,padding:"11px 16px",background:"#fbfcfe",borderBottom:`1px solid ${C.border}`,fontSize:11,fontWeight:700,color:C.mut,textTransform:"uppercase",letterSpacing:.3}}>
              {COLS.map((c,ci)=><span key={c[0]} onClick={()=>clickSort(ci)} style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer",color:sortKey===ci?C.primary:C.mut}}>{c[0]}{sortKey===ci?(sortDir==="asc"?" ▲":" ▼"):""}</span>)}
            </div>
            {rows===null ? <div style={{padding:20,color:C.mut,fontSize:13}}>Carico…</div>
            : list.map((r,i)=>(
              <div key={r.id} onClick={()=>setDetail(r.id)} style={{display:"grid",gridTemplateColumns:grid,gap:10,padding:"11px 16px",borderBottom:i<list.length-1?`1px solid ${C.border}`:"none",alignItems:"center",fontSize:13,cursor:"pointer"}}>
                {COLS.map((c,ci)=> c[0]==="Stato"
                  ? <span key="stato">{r.attivo?<Tag c={C.success} bg={C.successSoft} t="Attivo"/>:<Tag c={C.mut} bg="#eef1f6" t="Inattivo"/>}</span>
                  : <span key={c[0]} style={ci===0?{fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}:cell}>{c[1](r)}</span>)}
              </div>))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminEventi({ me }){
  const [rows,setRows]=useState(null);
  const [editing,setEditing]=useState(null);
  const [detail,setDetail]=useState(null);
  async function load(){ const { data }=await supabase.from("eventi").select("*").order("inizio",{ascending:true,nullsFirst:false}); setRows(data||[]); }
  useEffect(()=>{ load(); },[]);
  async function del(id){ if(!window.confirm("Eliminare questo evento?")) return; await supabase.from("eventi").delete().eq("id",id); load(); }
  if(detail) return <EventoPresenze ev={detail} onBack={()=>{setDetail(null);load();}}/>;
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <h2 style={{...head,fontSize:22,fontWeight:800,margin:0,flex:1}}>Eventi</h2>
        <button onClick={()=>setEditing({})} style={{...btnPrimary,display:"flex",alignItems:"center",gap:6,padding:"9px 14px"}}><Plus size={16}/> Nuovo evento</button>
      </div>
      {rows===null ? <div style={{...card,color:C.mut,fontSize:13}}>Carico…</div>
       : rows.length===0 ? <div style={{...card,color:C.mut,fontSize:14}}>Nessun evento. Creane uno con "Nuovo evento" — arriverà a tutto lo staff.</div>
       : <div style={{display:"flex",flexDirection:"column",gap:11}}>
          {rows.map(e=>{ const cat=CAT[e.categoria]||CAT.NOTTE_EVENTO; return (
            <div key={e.id} style={{...card,display:"flex",alignItems:"center",gap:10,borderLeft:`4px solid ${cat.color}`}}>
              <button onClick={()=>setDetail(e)} style={{flex:1,minWidth:0,textAlign:"left",border:"none",background:"transparent",cursor:"pointer",padding:0}}>
                <span style={{fontSize:11,fontWeight:700,color:cat.color}}>{cat.label}</span>
                <div style={{...head,fontSize:17,fontWeight:700,margin:"2px 0 3px"}}>{e.titolo}</div>
                <div style={{fontSize:12.5,color:C.mut}}>{fdate(e.inizio)}{e.luogo?` · ${e.luogo}`:""}{e.zona?` · ${e.zona}`:""}</div>
                <div style={{fontSize:12,color:C.primary,fontWeight:700,marginTop:6}}>Gestisci presenze ›</div>
              </button>
              <button onClick={()=>setEditing(e)} style={{...iconBtn,color:C.primary,padding:6}}><Pencil size={17}/></button>
              <button onClick={()=>del(e.id)} style={{...iconBtn,color:"#d33",padding:6}}><Trash2 size={17}/></button>
            </div>); })}
         </div>}
      {editing!==null && <EventForm me={me} ev={editing} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);load();}}/>}
    </div>
  );
}

function EventoPresenze({ ev, onBack }){
  const [staff,setStaff]=useState(null);
  const [part,setPart]=useState({});
  const [valut,setValut]=useState({});
  const [valOpen,setValOpen]=useState(null);
  const [filter,setFilter]=useState("tutti");
  const [q,setQ]=useState("");
  async function load(){
    const { data:st }=await supabase.from("staff_anagrafica").select("id,nome,cognome,ruolo,attivo").eq("attivo",true).order("cognome");
    setStaff(st||[]);
    const { data:pp }=await supabase.from("eventi_partecipazioni").select("staff_id,rsvp,presente,citta_partenza,ha_macchina").eq("evento_id",ev.id);
    const m={}; (pp||[]).forEach(p=>m[p.staff_id]={rsvp:p.rsvp,presente:p.presente,citta_partenza:p.citta_partenza,ha_macchina:p.ha_macchina}); setPart(m);
    const { data:vv }=await supabase.from("valutazioni").select("staff_id,voto,commento").eq("evento_id",ev.id).eq("tipo","uff_su_staff");
    const vm={}; (vv||[]).forEach(x=>vm[x.staff_id]={voto:x.voto,commento:x.commento}); setValut(vm);
  }
  useEffect(()=>{ load(); },[ev.id]);
  async function togglePresente(sid){
    const nv=!(part[sid]&&part[sid].presente===true);
    setPart(m=>({...m,[sid]:{...(m[sid]||{}),presente:nv}}));
    await supabase.from("eventi_partecipazioni").upsert({evento_id:ev.id,staff_id:sid,presente:nv,presente_at:new Date().toISOString()},{onConflict:"evento_id,staff_id"});
  }
  const cat=CAT[ev.categoria]||CAT.NOTTE_EVENTO;
  const all=staff||[];
  const macchinaTxt=v=>v===true?"Sì":v===false?"No":"—";
  const list=all.filter(s=>{
    const p=part[s.id]||{};
    if(q && !(`${s.nome} ${s.cognome}`).toLowerCase().includes(q.toLowerCase())) return false;
    if(filter==="si") return p.rsvp==="ci_saro";
    if(filter==="no") return p.rsvp==="non_ci_saro";
    if(filter==="presenti") return p.presente===true;
    if(filter==="assenti") return p.presente!==true;
    if(filter==="auto") return p.ha_macchina===true;
    return true;
  });
  const nSi=all.filter(s=>(part[s.id]||{}).rsvp==="ci_saro").length;
  const nPres=all.filter(s=>(part[s.id]||{}).presente===true).length;
  const nAuto=all.filter(s=>(part[s.id]||{}).ha_macchina===true).length;
  const chips=[["tutti","Tutti"],["si","Ci sarò"],["no","Non ci sarò"],["presenti","Presenti"],["assenti","Assenti"],["auto","Con macchina"]];
  function esporta(){
    const lines=[["Nome","Cognome","Ruolo","Disponibilità","Città partenza","Macchina","Presente","Voto"]];
    all.forEach(s=>{ const p=part[s.id]||{}; const v=valut[s.id]||{}; lines.push([s.nome,s.cognome,rlabel(s.ruolo), p.rsvp==="ci_saro"?"Ci sarò":p.rsvp==="non_ci_saro"?"Non ci sarò":"—", p.citta_partenza||"", macchinaTxt(p.ha_macchina), p.presente===true?"Sì":"No", v.voto||""]); });
    const csv=lines.map(r=>r.map(x=>`"${(x==null?"":String(x)).replace(/"/g,String.fromCharCode(34)+String.fromCharCode(34))}"`).join(",")).join(String.fromCharCode(10));
    downloadCSV("resoconto-"+(ev.titolo||"evento")+".csv",csv);
  }
  return (
    <div>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:4,background:"transparent",border:"none",cursor:"pointer",color:C.mut,fontSize:14,padding:"2px 0 10px",fontFamily:"Barlow"}}><ChevronLeft size={18}/> Eventi</button>
      <div style={{...card,borderLeft:`4px solid ${cat.color}`,marginBottom:14,display:"flex",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:180}}>
          <span style={{fontSize:11,fontWeight:700,color:cat.color}}>{cat.label}</span>
          <div style={{...head,fontSize:20,fontWeight:800,margin:"2px 0 3px"}}>{ev.titolo}</div>
          <div style={{fontSize:12.5,color:C.mut}}>{fdate(ev.inizio)}{ev.luogo?` · ${ev.luogo}`:""}</div>
        </div>
        <button onClick={esporta} style={{...btnGhost,display:"flex",alignItems:"center",gap:6,padding:"8px 12px",fontSize:13}}><Download size={15}/> Resoconto</button>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <BigStat n={nSi} l="Hanno detto sì" Ic={Check} col={C.success}/>
        <BigStat n={nPres} l="Presenti segnati" Ic={Users} col={C.primary}/>
        <BigStat n={nAuto} l="Con macchina" Ic={Check} col={C.accent}/>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {chips.map(([k,l])=>{ const on=filter===k; return <button key={k} onClick={()=>setFilter(k)} style={{border:`1px solid ${on?C.primary:C.border}`,background:on?C.primarySoft:C.surface,color:on?C.primary:C.mut,borderRadius:999,padding:"6px 12px",fontSize:12.5,fontWeight:700,cursor:"pointer",fontFamily:"Barlow"}}>{l}</button>; })}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:7,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 11px",marginBottom:12,maxWidth:280}}>
        <Search size={15} color={C.mut}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cerca…" style={{border:"none",outline:"none",fontSize:13,color:C.text,flex:1}}/>
      </div>
      {staff===null ? <div style={{...card,color:C.mut,fontSize:13}}>Carico…</div>
       : <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {list.map(s=>{ const p=part[s.id]||{}; const pres=p.presente===true; const v=valut[s.id]||{}; return (
            <div key={s.id} style={{...card,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:150}}>
                <div style={{fontWeight:600,fontSize:14}}>{s.nome} {s.cognome}</div>
                <div style={{fontSize:12,color:C.mut}}>{rlabel(s.ruolo)}</div>
                {p.rsvp==="ci_saro" && <div style={{fontSize:12,color:C.mut,marginTop:3}}>Parte da: {p.citta_partenza||"—"} · Macchina: {macchinaTxt(p.ha_macchina)}</div>}
              </div>
              {p.rsvp==="ci_saro"?<Tag c={C.success} bg={C.successSoft} t="Ci sarò"/>:p.rsvp==="non_ci_saro"?<Tag c={C.mut} bg="#eef1f6" t="Non ci sarò"/>:<Tag c={C.mut} bg="#f2f5fb" t="Nessuna risposta"/>}
              <button onClick={()=>togglePresente(s.id)} style={{border:"none",cursor:"pointer",borderRadius:9,padding:"7px 12px",fontFamily:"Barlow",fontWeight:700,fontSize:12.5,background:pres?C.success:"#eef1f6",color:pres?"#fff":C.mut,display:"flex",alignItems:"center",gap:5}}>{pres?<><Check size={14}/> Presente</>:"Segna presente"}</button>
            </div>); })}
         </div>}
    </div>
  );
}

function Stars({ value, onSelect, size }){
  return <div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>onSelect(n)} style={{background:"transparent",border:"none",cursor:"pointer",padding:2}}><Star size={size||24} color={C.amber} fill={n<=(value||0)?C.amber:"none"}/></button>)}</div>;
}

function ValutaStaff({ ev, staff, existing, onClose, onSaved }){
  const [voto,setVoto]=useState(existing.voto||0); const [commento,setCommento]=useState(existing.commento||""); const [busy,setBusy]=useState(false);
  async function save(){ setBusy(true); await supabase.from("valutazioni").upsert({evento_id:ev.id,staff_id:staff.id,tipo:"uff_su_staff",voto:voto||null,commento:commento.trim()||null},{onConflict:"evento_id,staff_id,tipo"}); setBusy(false); onSaved(); }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}} onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:18,width:"100%",maxWidth:420,margin:"24px 0",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h3 style={{...head,fontSize:19,fontWeight:800,margin:0}}>Valuta {staff.nome} {staff.cognome}</h3>
          <button onClick={onClose} style={iconBtn}><X size={20} color={C.mut}/></button>
        </div>
        <Stars value={voto} onSelect={setVoto}/>
        <textarea value={commento} onChange={e=>setCommento(e.target.value)} rows={3} placeholder="Commento (facoltativo)" style={{...inp,resize:"vertical",marginTop:12}}/>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={onClose} style={{...btnGhost,flex:1}}>Annulla</button>
          <button onClick={save} disabled={busy} style={{...btnPrimary,flex:1,opacity:busy?.6:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>{busy&&<Loader2 size={16} className="spin"/>} Salva</button>
        </div>
        <style>{`.spin{animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function AdminComunicazioni({ me }){
  const [rows,setRows]=useState(null);
  const [editing,setEditing]=useState(null);
  const [counts,setCounts]=useState({}); const [confBy,setConfBy]=useState({}); const [staffNames,setStaffNames]=useState({}); const [confOpen,setConfOpen]=useState(null);
  const [nov,setNov]=useState(null);
  const [editingN,setEditingN]=useState(null);
  const [af,setAf]=useState({aftermovie_url:"",aftermovie_titolo:""}); const [afMsg,setAfMsg]=useState("");
  const [vita,setVita]=useState(null); const [editingV,setEditingV]=useState(null);
  async function load(){
    const { data }=await supabase.from("comunicazioni").select("*").order("created_at",{ascending:false});
    setRows(data||[]);
    const { data:le }=await supabase.from("comunicazioni_letture").select("comunicazione_id,staff_id,confermata_at");
    const c={}; const cb={}; (le||[]).forEach(x=>{ if(x.confermata_at){ c[x.comunicazione_id]=(c[x.comunicazione_id]||0)+1; (cb[x.comunicazione_id]=cb[x.comunicazione_id]||[]).push(x.staff_id); } }); setCounts(c); setConfBy(cb);
    const { data:stn }=await supabase.from("staff_anagrafica").select("id,nome,cognome"); const sm={}; (stn||[]).forEach(x=>sm[x.id]=x.nome+" "+x.cognome); setStaffNames(sm);
    const { data:nv }=await supabase.from("novita").select("*").order("created_at",{ascending:false}); setNov(nv||[]);
    const { data:imp }=await supabase.from("impostazioni").select("key,value"); const im={}; (imp||[]).forEach(x=>im[x.key]=x.value); setAf({aftermovie_url:im.aftermovie_url||"",aftermovie_titolo:im.aftermovie_titolo||""});
    const { data:vs }=await supabase.from("vita_staff").select("*").order("ordine"); setVita(vs||[]);
  }
  useEffect(()=>{ load(); },[]);
  async function del(id){ if(!window.confirm("Eliminare questa comunicazione?")) return; await supabase.from("comunicazioni").delete().eq("id",id); load(); }
  async function delN(id){ if(!window.confirm("Eliminare questa novità?")) return; await supabase.from("novita").delete().eq("id",id); load(); }
  async function delV(id){ if(!window.confirm("Eliminare questa tessera?")) return; await supabase.from("vita_staff").delete().eq("id",id); load(); }
  async function saveAf(){ await supabase.from("impostazioni").upsert([{key:"aftermovie_url",value:af.aftermovie_url.trim()||null},{key:"aftermovie_titolo",value:af.aftermovie_titolo.trim()||null}],{onConflict:"key"}); setAfMsg("Salvato"); setTimeout(()=>setAfMsg(""),2000); }
  return (
    <div>
      <div style={{...card,marginBottom:20}}>
        <h3 style={{...sect,marginTop:0}}>Aftermovie in Home</h3>
        <label style={lbl}>Link del video (YouTube, Drive, ecc.)</label>
        <input value={af.aftermovie_url} onChange={e=>setAf(a=>({...a,aftermovie_url:e.target.value}))} placeholder="https://..." style={inp}/>
        <label style={lbl}>Titolo mostrato</label>
        <input value={af.aftermovie_titolo} onChange={e=>setAf(a=>({...a,aftermovie_titolo:e.target.value}))} placeholder="Rivivi l'estate" style={inp}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:12}}>
          <button onClick={saveAf} style={{...btnPrimary,padding:"9px 16px"}}>Salva aftermovie</button>
          {afMsg && <span style={{color:C.success,fontSize:13,fontWeight:700}}>{afMsg}</span>}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <h2 style={{...head,fontSize:22,fontWeight:800,margin:0,flex:1}}>Comunicazioni</h2>
        <button onClick={()=>setEditing({})} style={{...btnPrimary,display:"flex",alignItems:"center",gap:6,padding:"9px 14px"}}><Plus size={16}/> Nuova</button>
      </div>
      {rows===null ? <div style={{...card,color:C.mut,fontSize:13}}>Carico…</div>
       : rows.length===0 ? <div style={{...card,color:C.mut,fontSize:14}}>Nessuna comunicazione. Creane una — arriverà a tutto lo staff.</div>
       : <div style={{display:"flex",flexDirection:"column",gap:11}}>
          {rows.map(c=>(
            <div key={c.id} style={{...card,display:"flex",alignItems:"flex-start",gap:10}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{...head,fontSize:17,fontWeight:700}}>{c.titolo}</span>
                  {c.richiede_conferma && <span style={{fontSize:10,fontWeight:700,color:C.amber,background:C.amberSoft,borderRadius:6,padding:"2px 7px"}}>CONFERMA</span>}
                </div>
                {c.corpo && <p style={{margin:"0 0 5px",fontSize:13,color:C.mut,lineHeight:1.45}}>{c.corpo}</p>}
                <span style={{fontSize:11.5,color:C.mut}}>{fdate(c.created_at)}{c.richiede_conferma && <> · <button onClick={()=>setConfOpen(c.id)} style={{border:"none",background:"transparent",padding:0,cursor:"pointer",color:C.primary,fontWeight:700,fontSize:11.5,fontFamily:"Barlow"}}>confermata da {counts[c.id]||0} ›</button></>}</span>
              </div>
              <button onClick={()=>setEditing(c)} style={{...iconBtn,color:C.primary,padding:6}}><Pencil size={17}/></button>
              <button onClick={()=>del(c.id)} style={{...iconBtn,color:"#d33",padding:6}}><Trash2 size={17}/></button>
            </div>))}
         </div>}

      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:26,marginBottom:12}}>
        <div style={{flex:1}}>
          <h2 style={{...head,fontSize:22,fontWeight:800,margin:0}}>Novità in Home</h2>
          <p style={{fontSize:12.5,color:C.mut,margin:"2px 0 0"}}>Card informative mostrate nella Home dello staff.</p>
        </div>
        <button onClick={()=>setEditingN({})} style={{...btnPrimary,display:"flex",alignItems:"center",gap:6,padding:"9px 14px"}}><Plus size={16}/> Nuova</button>
      </div>
      {nov===null ? <div style={{...card,color:C.mut,fontSize:13}}>Carico…</div>
       : nov.length===0 ? <div style={{...card,color:C.mut,fontSize:14}}>Nessuna novità. Creane una per la Home.</div>
       : <div style={{display:"flex",flexDirection:"column",gap:11}}>
          {nov.map(n=>(
            <div key={n.id} style={{...card,display:"flex",alignItems:"flex-start",gap:10,borderLeft:`3px solid ${C.accent}`}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  {n.tag && <span style={{fontSize:10.5,fontWeight:700,color:C.accent}}>{n.tag.toUpperCase()}</span>}
                  {!n.attivo && <span style={{fontSize:10,fontWeight:700,color:C.mut,background:"#eef1f6",borderRadius:6,padding:"2px 7px"}}>NASCOSTA</span>}
                </div>
                <div style={{...head,fontSize:16,fontWeight:700}}>{n.titolo}</div>
                {n.corpo && <p style={{margin:"3px 0 0",fontSize:13,color:C.mut,lineHeight:1.45}}>{n.corpo}</p>}
              </div>
              <button onClick={()=>setEditingN(n)} style={{...iconBtn,color:C.primary,padding:6}}><Pencil size={17}/></button>
              <button onClick={()=>delN(n.id)} style={{...iconBtn,color:"#d33",padding:6}}><Trash2 size={17}/></button>
            </div>))}
         </div>}

      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:26,marginBottom:12}}>
        <div style={{flex:1}}>
          <h2 style={{...head,fontSize:22,fontWeight:800,margin:0}}>Vita da staff</h2>
          <p style={{fontSize:12.5,color:C.mut,margin:"2px 0 0"}}>Le tessere mostrate nella Home dello staff.</p>
        </div>
        <button onClick={()=>setEditingV({})} style={{...btnPrimary,display:"flex",alignItems:"center",gap:6,padding:"9px 14px"}}><Plus size={16}/> Nuova</button>
      </div>
      {vita===null ? <div style={{...card,color:C.mut,fontSize:13}}>Carico…</div>
       : vita.length===0 ? <div style={{...card,color:C.mut,fontSize:14}}>Nessuna tessera.</div>
       : <div style={{display:"flex",flexDirection:"column",gap:11}}>
          {vita.map(v=>{ const Ic=ICONS[v.icona]||Sparkles; return (
            <div key={v.id} style={{...card,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:9,background:C.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic size={17} color={C.accent}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14.5}}>{v.titolo}{!v.attivo && <span style={{fontSize:10,fontWeight:700,color:C.mut,background:"#eef1f6",borderRadius:6,padding:"2px 7px",marginLeft:7}}>NASCOSTA</span>}</div>
                {v.sottotitolo && <div style={{fontSize:12.5,color:C.mut}}>{v.sottotitolo}</div>}
              </div>
              <button onClick={()=>setEditingV(v)} style={{...iconBtn,color:C.primary,padding:6}}><Pencil size={17}/></button>
              <button onClick={()=>delV(v.id)} style={{...iconBtn,color:"#d33",padding:6}}><Trash2 size={17}/></button>
            </div>); })}
         </div>}
      {confOpen && (
        <div onMouseDown={e=>{ if(e.target===e.currentTarget) setConfOpen(null); }} style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:18,width:"100%",maxWidth:420,margin:"24px 0",padding:20,maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h3 style={{...head,fontSize:19,fontWeight:800,margin:0}}>Chi ha confermato ({(confBy[confOpen]||[]).length})</h3>
              <button onClick={()=>setConfOpen(null)} style={iconBtn}><X size={22} color={C.mut}/></button>
            </div>
            <div style={{overflowY:"auto"}}>
              {(confBy[confOpen]||[]).length===0 ? <span style={{color:C.mut,fontSize:13}}>Ancora nessuno.</span>
               : (confBy[confOpen]||[]).map((sid,i)=><div key={sid} style={{padding:"8px 0",borderTop:i?`1px solid ${C.border}`:"none",fontSize:14,fontWeight:600}}>{staffNames[sid]||"—"}</div>)}
            </div>
          </div>
        </div>
      )}
      {editing!==null && <ComForm me={me} com={editing} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);load();}}/>}
      {editingN!==null && <NovitaForm nov={editingN} onClose={()=>setEditingN(null)} onSaved={()=>{setEditingN(null);load();}}/>}
      {editingV!==null && <VitaForm item={editingV} onClose={()=>setEditingV(null)} onSaved={()=>{setEditingV(null);load();}}/>}
    </div>
  );
}

function VitaForm({ item, onClose, onSaved }){
  const isEdit=!!item.id;
  const [f,setF]=useState({titolo:item.titolo||"",sottotitolo:item.sottotitolo||"",contenuto:item.contenuto||"",icona:item.icona||"sparkles",ordine:(item.ordine!=null?item.ordine:0),attivo:item.id?!!item.attivo:true});
  const [busy,setBusy]=useState(false); const [err,setErr]=useState("");
  const set=(k,v)=>setF(o=>({...o,[k]:v}));
  const ok=f.titolo.trim();
  async function save(){
    if(!ok||busy) return; setBusy(true); setErr("");
    const payload={titolo:f.titolo.trim(),sottotitolo:f.sottotitolo.trim()||null,contenuto:f.contenuto.trim()||null,icona:f.icona,ordine:(f.ordine===""||f.ordine==null)?0:(parseInt(f.ordine)||0),attivo:f.attivo};
    let error;
    if(isEdit){ ({ error }=await supabase.from("vita_staff").update(payload).eq("id",item.id)); }
    else { ({ error }=await supabase.from("vita_staff").insert(payload)); }
    setBusy(false);
    if(error){ setErr(error.message); return; }
    onSaved();
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}} onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:18,width:"100%",maxWidth:460,margin:"24px 0",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{...head,fontSize:20,fontWeight:800,margin:0}}>{isEdit?"Modifica tessera":"Nuova tessera"}</h3>
          <button onClick={onClose} style={iconBtn}><X size={20} color={C.mut}/></button>
        </div>
        <label style={lbl}>Titolo *</label>
        <input value={f.titolo} onChange={e=>set("titolo",e.target.value)} placeholder="Es. Aperitivi & rinfreschi" style={inp}/>
        <label style={lbl}>Sottotitolo</label>
        <input value={f.sottotitolo} onChange={e=>set("sottotitolo",e.target.value)} placeholder="Breve descrizione" style={inp}/>
        <label style={lbl}>Contenuto esteso (si apre al tocco)</label>
        <textarea value={f.contenuto} onChange={e=>set("contenuto",e.target.value)} rows={4} placeholder="Racconta più nel dettaglio questa iniziativa…" style={{...inp,resize:"vertical"}}/>
        <label style={lbl}>Icona</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:2}}>
          {Object.keys(ICONS).map(k=>{ const Ic=ICONS[k]; const on=f.icona===k; return <button key={k} onClick={()=>set("icona",k)} style={{width:42,height:42,borderRadius:11,border:`1px solid ${on?C.primary:C.border}`,background:on?C.primarySoft:C.surface,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic size={19} color={on?C.primary:C.mut}/></button>; })}
        </div>
        <label style={{...lbl,marginTop:14}}>Ordine</label>
        <input type="number" value={f.ordine} onChange={e=>set("ordine",e.target.value)} style={inp}/>
        <label style={{display:"flex",alignItems:"center",gap:9,marginTop:14,cursor:"pointer"}}>
          <input type="checkbox" checked={f.attivo} onChange={e=>set("attivo",e.target.checked)} style={{width:18,height:18,accentColor:C.primary}}/>
          <span style={{fontSize:13.5,color:C.text}}>Mostra in Home</span>
        </label>
        {err?<p style={{color:"#d33",fontSize:13,margin:"8px 2px 0"}}>{err}</p>:null}
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={onClose} style={{...btnGhost,flex:1}}>Annulla</button>
          <button onClick={save} disabled={!ok||busy} style={{...btnPrimary,flex:1,opacity:(!ok||busy)?.55:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>{busy&&<Loader2 size={16} className="spin"/>} {isEdit?"Salva":"Crea"}</button>
        </div>
        <style>{`.spin{animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function NovitaForm({ nov, onClose, onSaved }){
  const isEdit=!!nov.id;
  const [f,setF]=useState({tag:nov.tag||"",titolo:nov.titolo||"",corpo:nov.corpo||"",attivo:nov.id?!!nov.attivo:true});
  const [busy,setBusy]=useState(false); const [err,setErr]=useState("");
  const set=(k,v)=>setF(o=>({...o,[k]:v}));
  const ok=f.titolo.trim();
  async function save(){
    if(!ok||busy) return; setBusy(true); setErr("");
    const payload={tag:f.tag.trim()||null,titolo:f.titolo.trim(),corpo:f.corpo.trim()||null,attivo:f.attivo};
    let error;
    if(isEdit){ ({ error }=await supabase.from("novita").update(payload).eq("id",nov.id)); }
    else { ({ error }=await supabase.from("novita").insert(payload)); }
    setBusy(false);
    if(error){ setErr(error.message); return; }
    onSaved();
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}} onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:18,width:"100%",maxWidth:460,margin:"24px 0",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{...head,fontSize:20,fontWeight:800,margin:0}}>{isEdit?"Modifica novità":"Nuova novità"}</h3>
          <button onClick={onClose} style={iconBtn}><X size={20} color={C.mut}/></button>
        </div>
        <label style={lbl}>Etichetta (facoltativa)</label>
        <input value={f.tag} onChange={e=>set("tag",e.target.value)} placeholder="Es. Reunion, Merch, Formazione" style={inp}/>
        <label style={lbl}>Titolo *</label>
        <input value={f.titolo} onChange={e=>set("titolo",e.target.value)} placeholder="Es. Aperte le iscrizioni al Reunion" style={inp}/>
        <label style={lbl}>Testo</label>
        <textarea value={f.corpo} onChange={e=>set("corpo",e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/>
        <label style={{display:"flex",alignItems:"center",gap:9,marginTop:14,cursor:"pointer"}}>
          <input type="checkbox" checked={f.attivo} onChange={e=>set("attivo",e.target.checked)} style={{width:18,height:18,accentColor:C.primary}}/>
          <span style={{fontSize:13.5,color:C.text}}>Mostra in Home</span>
        </label>
        {err?<p style={{color:"#d33",fontSize:13,margin:"8px 2px 0"}}>{err}</p>:null}
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={onClose} style={{...btnGhost,flex:1}}>Annulla</button>
          <button onClick={save} disabled={!ok||busy} style={{...btnPrimary,flex:1,opacity:(!ok||busy)?.55:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>{busy&&<Loader2 size={16} className="spin"/>} {isEdit?"Salva":"Pubblica"}</button>
        </div>
        <style>{`.spin{animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function ComForm({ me, com, onClose, onSaved }){
  const isEdit=!!com.id;
  const [f,setF]=useState({titolo:com.titolo||"",corpo:com.corpo||"",richiede_conferma:!!com.richiede_conferma});
  const [busy,setBusy]=useState(false); const [err,setErr]=useState("");
  const set=(k,v)=>setF(o=>({...o,[k]:v}));
  const ok=f.titolo.trim();
  async function save(){
    if(!ok||busy) return; setBusy(true); setErr("");
    const payload={titolo:f.titolo.trim(),corpo:f.corpo.trim()||null,richiede_conferma:f.richiede_conferma};
    let error;
    if(isEdit){ ({ error }=await supabase.from("comunicazioni").update(payload).eq("id",com.id)); }
    else { ({ error }=await supabase.from("comunicazioni").insert({...payload,created_by:me.id})); }
    setBusy(false);
    if(error){ setErr(error.message); return; }
    if(!isEdit){ try{ await supabase.functions.invoke("send-push",{body:{title:f.titolo.trim(),body:(f.corpo.trim()||"Nuovo avviso dall'ufficio"),tag:"avviso"}}); }catch(e){} }
    onSaved();
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}} onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:18,width:"100%",maxWidth:460,margin:"24px 0",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{...head,fontSize:20,fontWeight:800,margin:0}}>{isEdit?"Modifica comunicazione":"Nuova comunicazione"}</h3>
          <button onClick={onClose} style={iconBtn}><X size={20} color={C.mut}/></button>
        </div>
        <label style={lbl}>Titolo *</label>
        <input value={f.titolo} onChange={e=>set("titolo",e.target.value)} placeholder="Es. Consegna materiali entro venerdì" style={inp}/>
        <label style={lbl}>Testo</label>
        <textarea value={f.corpo} onChange={e=>set("corpo",e.target.value)} rows={4} style={{...inp,resize:"vertical"}}/>
        <label style={{display:"flex",alignItems:"center",gap:9,marginTop:14,cursor:"pointer"}}>
          <input type="checkbox" checked={f.richiede_conferma} onChange={e=>set("richiede_conferma",e.target.checked)} style={{width:18,height:18,accentColor:C.primary}}/>
          <span style={{fontSize:13.5,color:C.text}}>Richiede conferma — resta come banner finché lo staff non conferma</span>
        </label>
        {err?<p style={{color:"#d33",fontSize:13,margin:"8px 2px 0"}}>{err}</p>:null}
        <p style={{fontSize:12,color:C.mut,margin:"10px 2px 0"}}>Arriva a tutto lo staff Invibe.</p>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={onClose} style={{...btnGhost,flex:1}}>Annulla</button>
          <button onClick={save} disabled={!ok||busy} style={{...btnPrimary,flex:1,opacity:(!ok||busy)?.55:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>{busy&&<Loader2 size={16} className="spin"/>} {isEdit?"Salva":"Invia"}</button>
        </div>
        <style>{`.spin{animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function downloadCSV(filename, text){
  const blob=new Blob([text],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function ProfiloEdit({ me, onClose, onSaved }){
  const [f,setF]=useState({nascita:me.nascita||"",sesso:me.sesso||"",citta:me.citta||"",indirizzo:me.indirizzo||"",codice_fiscale:me.codice_fiscale||"",email:me.email||"",telefono:me.telefono||"",instagram:me.instagram||"",professione:me.professione||"",aspirazioni:me.aspirazioni||""});
  const [busy,setBusy]=useState(false); const [err,setErr]=useState("");
  const set=(k,v)=>setF(o=>({...o,[k]:v}));
  const cf=(f.codice_fiscale||"").trim().toUpperCase();
  const emailOk=!f.email.trim()||(f.email.includes("@")&&f.email.includes("."));
  const cfOk=!cf||cf.length===16;
  const telOk=!f.telefono.trim()||f.telefono.replace(/[^0-9]/g,"").length>=6;
  const ok=emailOk&&cfOk&&telOk;
  async function save(){
    if(!ok||busy) return; setBusy(true); setErr("");
    const { error }=await supabase.from("staff_anagrafica").update({nascita:f.nascita||null,sesso:f.sesso||null,citta:f.citta.trim()||null,indirizzo:f.indirizzo.trim()||null,codice_fiscale:cf||null,email:f.email.trim()||null,telefono:f.telefono.trim()||null,instagram:f.instagram.trim()||null,professione:f.professione.trim()||null,aspirazioni:f.aspirazioni.trim()||null}).eq("id",me.id);
    setBusy(false);
    if(error){ setErr(error.message); return; }
    onSaved();
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}} onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:18,width:"100%",maxWidth:460,margin:"24px 0",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <h3 style={{...head,fontSize:20,fontWeight:800,margin:0}}>Modifica profilo</h3>
          <button onClick={onClose} style={iconBtn}><X size={20} color={C.mut}/></button>
        </div>
        <OField label="Data di nascita" type="date" value={f.nascita} onChange={v=>set("nascita",v)} valid={true}/>
        <OField label="Sesso" value={f.sesso} onChange={v=>set("sesso",v)} valid={true} options={["Uomo","Donna"]}/>
        <OField label="Città" value={f.citta} onChange={v=>set("citta",v)} valid={true}/>
        <OField label="Indirizzo di casa" value={f.indirizzo} onChange={v=>set("indirizzo",v)} valid={true}/>
        <OField label="Codice fiscale" value={f.codice_fiscale} onChange={v=>set("codice_fiscale",v.toUpperCase())} req valid={cfOk} hint="Deve avere 16 caratteri"/>
        <OField label="Email" type="email" value={f.email} onChange={v=>set("email",v)} req valid={emailOk} hint="Email non valida"/>
        <OField label="Telefono" value={f.telefono} onChange={v=>set("telefono",v)} req valid={telOk} hint="Numero non valido"/>
        <OField label="Instagram" value={f.instagram} onChange={v=>set("instagram",v)} valid={true}/>
        <OField label="Cosa fai nella vita / studi" value={f.professione} onChange={v=>set("professione",v)} valid={true}/>
        <OField label="Aspirazioni" value={f.aspirazioni} onChange={v=>set("aspirazioni",v)} valid={true}/>
        {err?<p style={{color:"#d33",fontSize:13,margin:"6px 2px 0"}}>{err}</p>:null}
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={onClose} style={{...btnGhost,flex:1}}>Annulla</button>
          <button onClick={save} disabled={!ok||busy} style={{...btnPrimary,flex:1,opacity:(!ok||busy)?.55:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>{busy&&<Loader2 size={16} className="spin"/>} Salva</button>
        </div>
        <style>{`.spin{animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function StaffDetail({ id, onBack }){
  const [f,setF]=useState(null);
  const [note,setNote]=useState({potenziale:"",note:""});
  const [storico,setStorico]=useState([]);
  const [busy,setBusy]=useState(false); const [msg,setMsg]=useState("");
  useEffect(()=>{ (async()=>{
    const { data:r }=await supabase.from("staff_anagrafica").select("*").eq("id",id).maybeSingle();
    setF(r||null);
    const { data:n }=await supabase.from("staff_note_interne").select("potenziale,note").eq("staff_id",id).maybeSingle();
    if(n) setNote({potenziale:n.potenziale||"",note:n.note||""});
    const { data:pp }=await supabase.from("eventi_partecipazioni").select("evento_id,rsvp,presente").eq("staff_id",id);
    const { data:vv }=await supabase.from("valutazioni").select("evento_id,voto").eq("staff_id",id).eq("tipo","uff_su_staff");
    const ids=(pp||[]).map(x=>x.evento_id);
    if(ids.length){ const { data:evs }=await supabase.from("eventi").select("id,titolo,inizio,categoria").in("id",ids); const vm={}; (vv||[]).forEach(x=>vm[x.evento_id]=x.voto);
      const list=(pp||[]).map(p=>{ const e=(evs||[]).find(x=>x.id===p.evento_id)||{}; return {...p,titolo:e.titolo,inizio:e.inizio,voto:vm[p.evento_id]}; }).sort((a,b)=>new Date(b.inizio||0)-new Date(a.inizio||0));
      setStorico(list);
    } else setStorico([]);
  })(); },[id]);
  const set=(k,v)=>setF(o=>({...o,[k]:v}));
  async function save(){
    setBusy(true); setMsg("");
    const keys=["nome","cognome","nascita","sesso","citta","indirizzo","codice_fiscale","email","telefono","instagram","ruolo","zona","anno_ingresso","taglia_maglia","professione","aspirazioni","progetti_invibe","att_antincendio","att_primo_soccorso","att_blsd","att_libretto","percorso_stadio","punti_bonus","attivo"];
    const p={}; keys.forEach(k=>{ p[k]=(f[k]===""?null:f[k]); });
    if(p.anno_ingresso) p.anno_ingresso=parseInt(p.anno_ingresso)||null;
    p.percorso_stadio=(p.percorso_stadio===""||p.percorso_stadio==null)?null:parseInt(p.percorso_stadio);
    p.punti_bonus=(p.punti_bonus===""||p.punti_bonus==null)?0:(parseInt(p.punti_bonus)||0);
    const { error:e1 }=await supabase.from("staff_anagrafica").update(p).eq("id",id);
    const { error:e2 }=await supabase.from("staff_note_interne").upsert({staff_id:id,potenziale:note.potenziale||null,note:note.note||null},{onConflict:"staff_id"});
    setBusy(false);
    setMsg((e1||e2) ? ("Errore: "+((e1||e2).message)) : "Salvato ✓");
    setTimeout(()=>setMsg(""),2500);
  }
  if(!f) return <div style={{...card,color:C.mut,fontSize:13}}>Carico…</div>;
  const ruoliOpts=Object.entries(ruoli);
  return (
    <div>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:4,background:"transparent",border:"none",cursor:"pointer",color:C.mut,fontSize:14,padding:"2px 0 10px",fontFamily:"Barlow"}}><ChevronLeft size={18}/> Staff</button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        <h2 style={{...head,fontSize:22,fontWeight:800,margin:0,flex:1}}>{f.nome} {f.cognome}</h2>
        <button onClick={()=>set("attivo",!f.attivo)} style={{border:"none",cursor:"pointer",borderRadius:9,padding:"7px 12px",fontWeight:700,fontSize:12.5,fontFamily:"Barlow",background:f.attivo?C.successSoft:"#fdecec",color:f.attivo?C.success:"#d33"}}>{f.attivo?"Attivo":"Disattivato"}</button>
      </div>
      <div style={{...card,marginBottom:14}}>
        <h3 style={{...sect,marginTop:0}}>Credenziali</h3>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13.5,marginBottom:6}}><span style={{color:C.mut}}>Username</span><span style={{fontWeight:600}}>{f.username}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13.5}}><span style={{color:C.mut}}>Password</span><span style={{fontWeight:600}}>{f.password_iniziale}</span></div>
        <button onClick={()=>navigator.clipboard.writeText(f.username+" / "+f.password_iniziale)} style={{...btnGhost,width:"100%",marginTop:10,fontSize:13}}>Copia credenziali</button>
      </div>
      <div style={card}>
        <h3 style={{...sect,marginTop:0}}>Anagrafica</h3>
        <OField label="Nome" value={f.nome||""} onChange={v=>set("nome",v)} valid={true}/>
        <OField label="Cognome" value={f.cognome||""} onChange={v=>set("cognome",v)} valid={true}/>
        <OField label="Data di nascita" type="date" value={f.nascita||""} onChange={v=>set("nascita",v)} valid={true}/>
        <OField label="Sesso" value={f.sesso||""} onChange={v=>set("sesso",v)} valid={true} options={["Uomo","Donna"]}/>
        <OField label="Città" value={f.citta||""} onChange={v=>set("citta",v)} valid={true}/>
        <OField label="Indirizzo" value={f.indirizzo||""} onChange={v=>set("indirizzo",v)} valid={true}/>
        <OField label="Codice fiscale" value={f.codice_fiscale||""} onChange={v=>set("codice_fiscale",v.toUpperCase())} valid={true}/>
        <OField label="Email" value={f.email||""} onChange={v=>set("email",v)} valid={true}/>
        <OField label="Telefono" value={f.telefono||""} onChange={v=>set("telefono",v)} valid={true}/>
        <OField label="Instagram" value={f.instagram||""} onChange={v=>set("instagram",v)} valid={true}/>
      </div>
      <div style={{...card,marginTop:14}}>
        <h3 style={{...sect,marginTop:0}}>Ruolo & percorso</h3>
        <label style={lbl}>Ruolo</label>
        <select value={f.ruolo||""} onChange={e=>set("ruolo",e.target.value)} style={inp}>
          <option value="">—</option>
          {ruoliOpts.map(([k,l])=><option key={k} value={k}>{l}</option>)}
        </select>
        <OField label="Zona" value={f.zona||""} onChange={v=>set("zona",v)} valid={true}/>
        <OField label="Anno d'ingresso" type="number" value={f.anno_ingresso||""} onChange={v=>set("anno_ingresso",v)} valid={true}/>
        <label style={lbl}>Punto del percorso</label>
        <select value={f.percorso_stadio??""} onChange={e=>set("percorso_stadio",e.target.value)} style={inp}>
          <option value="">Non impostato</option>
          {PERCORSO_STEPS.map((st,i)=><option key={i} value={i}>{(i+1)+". "+st[0]}</option>)}
        </select>
        <label style={lbl}>Punti bonus (gamification)</label>
        <input type="number" value={f.punti_bonus??0} onChange={e=>set("punti_bonus",e.target.value)} style={inp}/>
        <OField label="Taglia divisa" value={f.taglia_maglia||""} onChange={v=>set("taglia_maglia",v)} valid={true}/>
        <OField label="Cosa fa nella vita / studi" value={f.professione||""} onChange={v=>set("professione",v)} valid={true}/>
        <OField label="Aspirazioni" value={f.aspirazioni||""} onChange={v=>set("aspirazioni",v)} valid={true}/>
        <OField label="Progetti Invibe" value={f.progetti_invibe||""} onChange={v=>set("progetti_invibe",v)} valid={true}/>
      </div>
      <div style={{...card,marginTop:14}}>
        <h3 style={{...sect,marginTop:0}}>Certificati</h3>
        <OField label="Antincendio" value={f.att_antincendio||""} onChange={v=>set("att_antincendio",v)} valid={true} placeholder="Es. sì / data"/>
        <OField label="Primo soccorso" value={f.att_primo_soccorso||""} onChange={v=>set("att_primo_soccorso",v)} valid={true} placeholder="Es. sì / data"/>
        <OField label="BLSD" value={f.att_blsd||""} onChange={v=>set("att_blsd",v)} valid={true}/>
        <OField label="Libretto assicurativo" value={f.att_libretto||""} onChange={v=>set("att_libretto",v)} valid={true}/>
      </div>
      <div style={{...card,marginTop:14}}>
        <h3 style={{...sect,marginTop:0}}>Storico eventi</h3>
        {storico.length===0 ? <span style={{color:C.mut,fontSize:13}}>Nessuna partecipazione registrata.</span>
         : storico.map((e,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderTop:i?`1px solid ${C.border}`:"none",flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:120}}>
              <div style={{fontWeight:600,fontSize:13.5}}>{e.titolo||"—"}</div>
              <div style={{fontSize:11.5,color:C.mut}}>{fdate(e.inizio)}</div>
            </div>
            {e.rsvp==="ci_saro"?<Tag c={C.success} bg={C.successSoft} t="Ci sarò"/>:e.rsvp==="non_ci_saro"?<Tag c={C.mut} bg="#eef1f6" t="No"/>:null}
            {e.presente===true && <Tag c={C.primary} bg={C.primarySoft} t="Presente"/>}
            {e.voto && <span style={{display:"flex",alignItems:"center",gap:3,fontSize:12.5,fontWeight:700,color:C.amber}}><Star size={13} color={C.amber} fill={C.amber}/>{e.voto}</span>}
          </div>))}
      </div>
      <div style={{...card,marginTop:14,borderLeft:`4px solid ${C.accent}`}}>
        <h3 style={{...sect,marginTop:0}}>Note interne · solo ufficio</h3>
        <label style={lbl}>Potenziale / crescita</label>
        <input value={note.potenziale} onChange={e=>setNote(n=>({...n,potenziale:e.target.value}))} placeholder="Es. ARM, AACM, ACA…" style={inp}/>
        <label style={lbl}>Note</label>
        <textarea value={note.note} onChange={e=>setNote(n=>({...n,note:e.target.value}))} rows={3} style={{...inp,resize:"vertical"}}/>
      </div>
      {msg?<p style={{fontSize:13,fontWeight:600,color:msg.startsWith("Errore")?"#d33":C.success,margin:"12px 2px 0"}}>{msg}</p>:null}
      <button onClick={save} disabled={busy} style={{...btnPrimary,width:"100%",marginTop:14,padding:"13px 0",fontSize:15,opacity:busy?.6:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{busy&&<Loader2 size={17} className="spin"/>} Salva modifiche</button>
      <style>{`.spin{animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function SPremi({ me, myPunti, riscatti, reloadRiscatti }){
  const [premi,setPremi]=useState(null);
  useEffect(()=>{ supabase.from("premi").select("*").eq("attivo",true).order("costo_punti").then(({data})=>setPremi(data||[])); },[]);
  const P=Number(myPunti)||0;
  async function riscatta(p){
    if(P<p.costo_punti) return;
    if((riscatti||[]).some(r=>r.premio_id===p.id)) return;
    if(!window.confirm(`Riscattare "${p.nome}"? L'ufficio ti dirà come ritirarlo.`)) return;
    await supabase.from("riscatti").insert({staff_id:me.id,premio_id:p.id,premio_nome:p.nome,punti_spesi:0,stato:"richiesto"});
    reloadRiscatti();
  }
  return (
    <div style={{padding:"16px 16px 24px"}}>
      <h1 style={{...head,fontSize:26,fontWeight:800,margin:"4px 0 12px"}}>Premi</h1>
      <div style={{...card,marginBottom:18}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:54,height:54,borderRadius:15,background:C.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Trophy size={26} color={C.accent}/></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{...head,fontSize:40,fontWeight:900,color:C.accent,lineHeight:1}}>{P}</div>
            <div style={{fontSize:12.5,color:C.mut,marginTop:2}}>punti totali · più ne accumuli, più premi sblocchi</div>
          </div>
        </div>
        <div style={{display:"flex",gap:5,marginTop:16}}>
          {LEVELS.map((l,i)=>{ const on=P>=l[0]; return (
            <div key={i} style={{flex:1,textAlign:"center"}}>
              <div style={{height:6,borderRadius:3,background:on?C.accent:"#e6e9f0",marginBottom:5}}/>
              <div style={{fontSize:9.5,fontWeight:on?800:600,color:on?C.accent:C.mut,whiteSpace:"nowrap"}}>{l[1]}</div>
            </div>); })}
        </div>
      </div>
      {premi===null ? <div style={{...card,color:C.mut,fontSize:13}}>Carico…</div>
       : premi.length===0 ? <div style={{...card,color:C.mut,fontSize:14}}>Nessun premio al momento.</div>
       : <div>
          {premi.map((p,i)=>{ const unlocked=P>=p.costo_punti; const ric=(riscatti||[]).find(r=>r.premio_id===p.id); return (
            <div key={p.id} style={{display:"flex",gap:12}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                <div style={{width:28,height:28,borderRadius:14,background:unlocked?C.success:"#e6e9f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>{unlocked?<Check size={16} color="#fff"/>:<Lock size={13} color={C.mut}/>}</div>
                {i<premi.length-1 && <div style={{width:2,flex:1,background:unlocked?C.success:C.border,minHeight:22}}/>}
              </div>
              <div style={{...card,flex:1,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{...head,fontSize:16,fontWeight:700}}>{p.nome}</div>
                    {p.descrizione && <div style={{fontSize:12.5,color:C.mut,marginTop:2}}>{p.descrizione}</div>}
                  </div>
                  <span style={{fontSize:12,fontWeight:800,color:C.accent,whiteSpace:"nowrap"}}>{p.costo_punti} pt</span>
                </div>
                {unlocked
                  ? (ric ? <div style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,color:ric.stato==="consegnato"?C.success:C.amber}}><Check size={15}/> {ric.stato==="consegnato"?"Consegnato":"Richiesto"}</div>
                         : <button onClick={()=>riscatta(p)} style={{...btnPrimary,marginTop:10,padding:"8px 14px"}}>Riscatta</button>)
                  : <div style={{marginTop:10}}>
                      <div style={{height:6,borderRadius:3,background:"#eef1f6",overflow:"hidden",marginBottom:4}}><div style={{width:Math.min(100,Math.round(P/p.costo_punti*100))+"%",height:"100%",background:C.primary,borderRadius:3}}/></div>
                      <span style={{fontSize:12,color:C.mut}}>Ti mancano {Math.max(0,p.costo_punti-P)} punti per sbloccarlo</span>
                    </div>}
              </div>
            </div>); })}
         </div>}
      {(riscatti||[]).length>0 && <><h3 style={{...sect,marginTop:14}}>I miei riscatti</h3>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {riscatti.map(r=>(
            <div key={r.id} style={{...card,display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{r.premio_nome}</div><div style={{fontSize:12,color:C.mut}}>{fdate(r.created_at)}</div></div>
              <Tag c={r.stato==="consegnato"?C.success:C.amber} bg={r.stato==="consegnato"?C.successSoft:C.amberSoft} t={r.stato==="consegnato"?"Consegnato":"Richiesto"}/>
            </div>))}
        </div></>}
    </div>
  );
}

function AdminPremi(){
  const [premi,setPremi]=useState(null); const [editing,setEditing]=useState(null);
  const [ris,setRis]=useState([]); const [staff,setStaff]=useState({});
  const [ptc,setPtc]=useState({pt_rsvp:"",pt_conferma:"",pt_valutazione:"",pt_profilo:""}); const [ptcMsg,setPtcMsg]=useState("");
  async function load(){
    const { data:p }=await supabase.from("premi").select("*").order("costo_punti"); setPremi(p||[]);
    const { data:r }=await supabase.from("riscatti").select("*").order("created_at",{ascending:false}); setRis(r||[]);
    const { data:st }=await supabase.from("staff_anagrafica").select("id,nome,cognome"); const m={}; (st||[]).forEach(x=>m[x.id]=x.nome+" "+x.cognome); setStaff(m);
    const { data:imp }=await supabase.from("impostazioni").select("key,value").in("key",["pt_rsvp","pt_conferma","pt_valutazione","pt_profilo"]); const im={}; (imp||[]).forEach(x=>im[x.key]=x.value); setPtc({pt_rsvp:im.pt_rsvp||"0",pt_conferma:im.pt_conferma||"0",pt_valutazione:im.pt_valutazione||"0",pt_profilo:im.pt_profilo||"0"});
  }
  useEffect(()=>{ load(); },[]);
  async function del(id){ if(!window.confirm("Eliminare questo premio?")) return; await supabase.from("premi").delete().eq("id",id); load(); }
  async function consegna(id){ await supabase.from("riscatti").update({stato:"consegnato"}).eq("id",id); load(); }
  async function saveCfg(){ await supabase.from("impostazioni").upsert([{key:"pt_rsvp",value:String(parseInt(ptc.pt_rsvp)||0)},{key:"pt_conferma",value:String(parseInt(ptc.pt_conferma)||0)},{key:"pt_valutazione",value:String(parseInt(ptc.pt_valutazione)||0)},{key:"pt_profilo",value:String(parseInt(ptc.pt_profilo)||0)}],{onConflict:"key"}); setPtcMsg("Salvato"); setTimeout(()=>setPtcMsg(""),2000); }
  async function annullaRiscatto(id){ if(!window.confirm("Annullare questo riscatto? I punti torneranno disponibili allo staff.")) return; await supabase.from("riscatti").delete().eq("id",id); load(); }
  return (
    <div>
      <div style={{...card,marginBottom:18}}>
        <h3 style={{...sect,marginTop:0}}>Punti per ogni azione</h3>
        <p style={{fontSize:12,color:C.mut,margin:"0 0 10px"}}>Quanti punti guadagna lo staff facendo queste cose.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={lbl}>RSVP "ci sarò"</label><input type="number" value={ptc.pt_rsvp} onChange={e=>setPtc(a=>({...a,pt_rsvp:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Conferma avviso</label><input type="number" value={ptc.pt_conferma} onChange={e=>setPtc(a=>({...a,pt_conferma:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Valutazione evento</label><input type="number" value={ptc.pt_valutazione} onChange={e=>setPtc(a=>({...a,pt_valutazione:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Profilo completato</label><input type="number" value={ptc.pt_profilo} onChange={e=>setPtc(a=>({...a,pt_profilo:e.target.value}))} style={inp}/></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:12}}>
          <button onClick={saveCfg} style={{...btnPrimary,padding:"9px 16px"}}>Salva punti azioni</button>
          {ptcMsg && <span style={{color:C.success,fontSize:13,fontWeight:700}}>{ptcMsg}</span>}
        </div>
        <p style={{fontSize:11.5,color:C.mut,margin:"10px 0 0"}}>La presenza reale a un evento vale i punti impostati su quell'evento. I punti bonus si assegnano dalla scheda di ogni staff.</p>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <h2 style={{...head,fontSize:22,fontWeight:800,margin:0,flex:1}}>Catalogo premi</h2>
        <button onClick={()=>setEditing({})} style={{...btnPrimary,display:"flex",alignItems:"center",gap:6,padding:"9px 14px"}}><Plus size={16}/> Nuovo premio</button>
      </div>
      {premi===null ? <div style={{...card,color:C.mut,fontSize:13}}>Carico…</div>
       : premi.length===0 ? <div style={{...card,color:C.mut,fontSize:14}}>Nessun premio. Creane uno.</div>
       : <div style={{display:"flex",flexDirection:"column",gap:11}}>
          {premi.map(p=>(
            <div key={p.id} style={{...card,display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span style={{...head,fontSize:17,fontWeight:700}}>{p.nome}</span>
                  <span style={{fontSize:11,fontWeight:700,color:C.accent,background:C.accentSoft,borderRadius:6,padding:"2px 7px"}}>{p.costo_punti} pt</span>
                  {!p.attivo && <span style={{fontSize:10.5,fontWeight:700,color:C.mut,background:"#eef1f6",borderRadius:6,padding:"2px 7px"}}>NASCOSTO</span>}
                </div>
                {p.descrizione && <div style={{fontSize:12.5,color:C.mut,marginTop:3}}>{p.descrizione}</div>}
              </div>
              <button onClick={()=>setEditing(p)} style={{...iconBtn,color:C.primary,padding:6}}><Pencil size={17}/></button>
              <button onClick={()=>del(p.id)} style={{...iconBtn,color:"#d33",padding:6}}><Trash2 size={17}/></button>
            </div>))}
         </div>}
      <h3 style={{...sect,marginTop:24}}>Riscatti</h3>
      {ris.length===0 ? <div style={{...card,color:C.mut,fontSize:13}}>Nessun riscatto ancora.</div>
       : <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {ris.map(r=>(
            <div key={r.id} style={{...card,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:150}}>
                <div style={{fontWeight:600,fontSize:14}}>{staff[r.staff_id]||"—"}</div>
                <div style={{fontSize:12,color:C.mut}}>{r.premio_nome} · {r.punti_spesi} pt · {fdate(r.created_at)}</div>
              </div>
              {r.stato==="consegnato"
                ? <Tag c={C.success} bg={C.successSoft} t="Consegnato"/>
                : <button onClick={()=>consegna(r.id)} style={{...btnPrimary,padding:"7px 12px",fontSize:12.5}}>Segna consegnato</button>}
              <button onClick={()=>annullaRiscatto(r.id)} title="Annulla riscatto" style={{...iconBtn,color:"#d33",padding:6}}><Trash2 size={16}/></button>
            </div>))}
         </div>}
      {editing!==null && <PremioForm premio={editing} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);load();}}/>}
    </div>
  );
}

function PremioForm({ premio, onClose, onSaved }){
  const isEdit=!!premio.id;
  const [f,setF]=useState({nome:premio.nome||"",descrizione:premio.descrizione||"",costo_punti:(premio.costo_punti!=null?premio.costo_punti:0),attivo:premio.id?!!premio.attivo:true});
  const [busy,setBusy]=useState(false); const [err,setErr]=useState("");
  const set=(k,v)=>setF(o=>({...o,[k]:v}));
  const ok=f.nome.trim();
  async function save(){
    if(!ok||busy) return; setBusy(true); setErr("");
    const payload={nome:f.nome.trim(),descrizione:f.descrizione.trim()||null,costo_punti:(f.costo_punti===""||f.costo_punti==null)?0:(parseInt(f.costo_punti)||0),attivo:f.attivo};
    let error;
    if(isEdit){ ({ error }=await supabase.from("premi").update(payload).eq("id",premio.id)); }
    else { ({ error }=await supabase.from("premi").insert(payload)); }
    setBusy(false);
    if(error){ setErr(error.message); return; }
    onSaved();
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}} onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:18,width:"100%",maxWidth:460,margin:"24px 0",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{...head,fontSize:20,fontWeight:800,margin:0}}>{isEdit?"Modifica premio":"Nuovo premio"}</h3>
          <button onClick={onClose} style={iconBtn}><X size={20} color={C.mut}/></button>
        </div>
        <label style={lbl}>Nome *</label>
        <input value={f.nome} onChange={e=>set("nome",e.target.value)} placeholder="Es. Ingresso omaggio" style={inp}/>
        <label style={lbl}>Descrizione</label>
        <textarea value={f.descrizione} onChange={e=>set("descrizione",e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/>
        <label style={lbl}>Punti per sbloccarlo</label>
        <input type="number" value={f.costo_punti} onChange={e=>set("costo_punti",e.target.value)} style={inp}/>
        <label style={{display:"flex",alignItems:"center",gap:9,marginTop:14,cursor:"pointer"}}>
          <input type="checkbox" checked={f.attivo} onChange={e=>set("attivo",e.target.checked)} style={{width:18,height:18,accentColor:C.primary}}/>
          <span style={{fontSize:13.5,color:C.text}}>Visibile agli staff</span>
        </label>
        {err?<p style={{color:"#d33",fontSize:13,margin:"8px 2px 0"}}>{err}</p>:null}
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={onClose} style={{...btnGhost,flex:1}}>Annulla</button>
          <button onClick={save} disabled={!ok||busy} style={{...btnPrimary,flex:1,opacity:(!ok||busy)?.55:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>{busy&&<Loader2 size={16} className="spin"/>} {isEdit?"Salva":"Crea"}</button>
        </div>
        <style>{`.spin{animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function AdminEconomia(){
  const [rows,setRows]=useState(null); const [eventi,setEventi]=useState([]); const [editing,setEditing]=useState(null); const [filter,setFilter]=useState("tutti");
  async function load(){
    const { data }=await supabase.from("economia").select("*").order("created_at",{ascending:false}); setRows(data||[]);
    const { data:ev }=await supabase.from("eventi").select("id,titolo").order("inizio",{ascending:false}); setEventi(ev||[]);
  }
  useEffect(()=>{ load(); },[]);
  async function del(id){ if(!window.confirm("Eliminare questa voce?")) return; await supabase.from("economia").delete().eq("id",id); load(); }
  async function toggleSaldato(r){ await supabase.from("economia").update({saldato:!r.saldato}).eq("id",r.id); load(); }
  const evName=id=>{ const e=eventi.find(x=>x.id===id); return e?e.titolo:null; };
  const eur=n=>"€ "+Number(n||0).toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2});
  const all=rows||[];
  const entrate=all.filter(r=>r.tipo==="entrata").reduce((a,r)=>a+Number(r.importo||0),0);
  const uscite=all.filter(r=>r.tipo==="uscita").reduce((a,r)=>a+Number(r.importo||0),0);
  const daIncassare=all.filter(r=>r.chi_deve && !r.saldato).reduce((a,r)=>a+Number(r.importo||0),0);
  const list=all.filter(r=> filter==="dasaldare"?(r.chi_deve && !r.saldato) : filter==="entrate"?r.tipo==="entrata" : filter==="uscite"?r.tipo==="uscita" : true);
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <h2 style={{...head,fontSize:22,fontWeight:800,margin:0,flex:1}}>Economia</h2>
        <button onClick={()=>setEditing({})} style={{...btnPrimary,display:"flex",alignItems:"center",gap:6,padding:"9px 14px"}}><Plus size={16}/> Nuova voce</button>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <BigStat n={eur(entrate)} l="Entrate" Ic={Wallet} col={C.success}/>
        <BigStat n={eur(uscite)} l="Uscite" Ic={Wallet} col={"#d33"}/>
        <BigStat n={eur(entrate-uscite)} l="Saldo" Ic={Wallet} col={C.primary}/>
        <BigStat n={eur(daIncassare)} l="Da incassare" Ic={Wallet} col={C.amber}/>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {[["tutti","Tutte"],["entrate","Entrate"],["uscite","Uscite"],["dasaldare","Da saldare"]].map(([k,l])=>{ const on=filter===k; return <button key={k} onClick={()=>setFilter(k)} style={{border:`1px solid ${on?C.primary:C.border}`,background:on?C.primarySoft:C.surface,color:on?C.primary:C.mut,borderRadius:999,padding:"6px 12px",fontSize:12.5,fontWeight:700,cursor:"pointer",fontFamily:"Barlow"}}>{l}</button>; })}
      </div>
      {rows===null ? <div style={{...card,color:C.mut,fontSize:13}}>Carico…</div>
       : list.length===0 ? <div style={{...card,color:C.mut,fontSize:14}}>Nessuna voce. Aggiungine una.</div>
       : <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {list.map(r=>(
            <div key={r.id} style={{...card,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",borderLeft:`4px solid ${r.tipo==="entrata"?C.success:"#d33"}`}}>
              <div style={{flex:1,minWidth:160}}>
                <div style={{fontWeight:700,fontSize:15}}>{r.voce}</div>
                <div style={{fontSize:12,color:C.mut,marginTop:2}}>
                  {r.tipo==="entrata"?"Entrata":"Uscita"}{evName(r.evento_id)?` · ${evName(r.evento_id)}`:""}{r.chi_deve?` · Deve dare: ${r.chi_deve}`:""}
                </div>
                {r.note && <div style={{fontSize:12,color:C.mut,marginTop:2}}>{r.note}</div>}
              </div>
              <div style={{...head,fontWeight:800,fontSize:16,color:r.tipo==="entrata"?C.success:"#d33"}}>{r.tipo==="entrata"?"+":"−"}{eur(r.importo)}</div>
              {r.chi_deve && <button onClick={()=>toggleSaldato(r)} style={{border:"none",cursor:"pointer",borderRadius:9,padding:"6px 11px",fontFamily:"Barlow",fontWeight:700,fontSize:12,background:r.saldato?C.successSoft:C.amberSoft,color:r.saldato?C.success:C.amber}}>{r.saldato?"Saldato":"Da saldare"}</button>}
              <button onClick={()=>setEditing(r)} style={{...iconBtn,color:C.primary,padding:6}}><Pencil size={16}/></button>
              <button onClick={()=>del(r.id)} style={{...iconBtn,color:"#d33",padding:6}}><Trash2 size={16}/></button>
            </div>))}
         </div>}
      {editing!==null && <EconForm voce={editing} eventi={eventi} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);load();}}/>}
    </div>
  );
}

function EconForm({ voce, eventi, onClose, onSaved }){
  const isEdit=!!voce.id;
  const [f,setF]=useState({voce:voce.voce||"",tipo:voce.tipo||"uscita",importo:(voce.importo!=null?voce.importo:""),evento_id:voce.evento_id||"",chi_deve:voce.chi_deve||"",note:voce.note||"",saldato:!!voce.saldato});
  const [busy,setBusy]=useState(false); const [err,setErr]=useState("");
  const set=(k,v)=>setF(o=>({...o,[k]:v}));
  const ok=f.voce.trim();
  async function save(){
    if(!ok||busy) return; setBusy(true); setErr("");
    const payload={voce:f.voce.trim(),tipo:f.tipo,importo:(f.importo===""||f.importo==null)?0:Number(f.importo)||0,evento_id:f.evento_id||null,chi_deve:f.chi_deve.trim()||null,note:f.note.trim()||null,saldato:f.saldato};
    let error;
    if(isEdit){ ({ error }=await supabase.from("economia").update(payload).eq("id",voce.id)); }
    else { ({ error }=await supabase.from("economia").insert(payload)); }
    setBusy(false);
    if(error){ setErr(error.message); return; }
    onSaved();
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}} onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:18,width:"100%",maxWidth:460,margin:"24px 0",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{...head,fontSize:20,fontWeight:800,margin:0}}>{isEdit?"Modifica voce":"Nuova voce"}</h3>
          <button onClick={onClose} style={iconBtn}><X size={20} color={C.mut}/></button>
        </div>
        <label style={lbl}>Voce *</label>
        <input value={f.voce} onChange={e=>set("voce",e.target.value)} placeholder="Es. Sponsor serata / Rimborso benzina" style={inp}/>
        <label style={lbl}>Tipo</label>
        <select value={f.tipo} onChange={e=>set("tipo",e.target.value)} style={inp}><option value="entrata">Entrata</option><option value="uscita">Uscita</option></select>
        <label style={lbl}>Importo (€)</label>
        <input type="number" step="0.01" value={f.importo} onChange={e=>set("importo",e.target.value)} style={inp}/>
        <label style={lbl}>Evento collegato (facoltativo)</label>
        <select value={f.evento_id} onChange={e=>set("evento_id",e.target.value)} style={inp}><option value="">—</option>{eventi.map(e=><option key={e.id} value={e.id}>{e.titolo}</option>)}</select>
        <label style={lbl}>Chi deve dare i soldi (facoltativo)</label>
        <input value={f.chi_deve} onChange={e=>set("chi_deve",e.target.value)} placeholder="Nome / locale / sponsor" style={inp}/>
        <label style={lbl}>Note</label>
        <textarea value={f.note} onChange={e=>set("note",e.target.value)} rows={2} style={{...inp,resize:"vertical"}}/>
        <label style={{display:"flex",alignItems:"center",gap:9,marginTop:14,cursor:"pointer"}}>
          <input type="checkbox" checked={f.saldato} onChange={e=>set("saldato",e.target.checked)} style={{width:18,height:18,accentColor:C.primary}}/>
          <span style={{fontSize:13.5,color:C.text}}>Già saldato / incassato</span>
        </label>
        {err?<p style={{color:"#d33",fontSize:13,margin:"8px 2px 0"}}>{err}</p>:null}
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={onClose} style={{...btnGhost,flex:1}}>Annulla</button>
          <button onClick={save} disabled={!ok||busy} style={{...btnPrimary,flex:1,opacity:(!ok||busy)?.55:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>{busy&&<Loader2 size={16} className="spin"/>} {isEdit?"Salva":"Aggiungi"}</button>
        </div>
        <style>{`.spin{animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function AdminContratti(){
  const [rows,setRows]=useState(null); const [staff,setStaff]=useState({}); const [eventi,setEventi]=useState({});
  const [selStaff,setSelStaff]=useState(""); const [selEvento,setSelEvento]=useState("");
  const [uploading,setUploading]=useState(false); const [err,setErr]=useState("");
  const fileRef=useRef();
  async function load(){
    const { data }=await supabase.from("contratti").select("*").order("created_at",{ascending:false}); setRows(data||[]);
    const { data:st }=await supabase.from("staff_anagrafica").select("id,nome,cognome").order("cognome"); const sm={}; (st||[]).forEach(x=>sm[x.id]={nome:x.nome+" "+x.cognome}); setStaff(sm);
    const { data:ev }=await supabase.from("eventi").select("id,titolo").order("inizio",{ascending:false}); const em={}; (ev||[]).forEach(x=>em[x.id]=x.titolo); setEventi(em);
  }
  useEffect(()=>{ load(); },[]);
  async function onFile(e){
    const file=e.target.files[0]; if(!file) return;
    setUploading(true); setErr("");
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=Date.now()+"_"+safe;
    const up=await supabase.storage.from("contratti").upload(path,file,{contentType:file.type||"application/pdf"});
    if(up.error){ setErr(up.error.message); setUploading(false); e.target.value=""; return; }
    await supabase.from("contratti").insert({nome:file.name,path,staff_id:selStaff||null,evento_id:selEvento||null});
    setUploading(false); e.target.value=""; load();
  }
  async function scarica(r){ const { data }=await supabase.storage.from("contratti").createSignedUrl(r.path,120); if(data&&data.signedUrl) window.open(data.signedUrl,"_blank"); }
  async function del(r){ if(!window.confirm("Eliminare questo contratto?")) return; await supabase.storage.from("contratti").remove([r.path]); await supabase.from("contratti").delete().eq("id",r.id); load(); }
  const staffOpts=Object.entries(staff);
  const eventiOpts=Object.entries(eventi);
  return (
    <div>
      <h2 style={{...head,fontSize:22,fontWeight:800,margin:"0 0 14px"}}>Contratti</h2>
      <div style={{...card,marginBottom:16}}>
        <h3 style={{...sect,marginTop:0}}>Carica un contratto (PDF)</h3>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
          <select value={selStaff} onChange={e=>setSelStaff(e.target.value)} style={{...inp,width:"auto",flex:1,minWidth:150}}><option value="">Staff (facoltativo)</option>{staffOpts.map(([id,x])=><option key={id} value={id}>{x.nome}</option>)}</select>
          <select value={selEvento} onChange={e=>setSelEvento(e.target.value)} style={{...inp,width:"auto",flex:1,minWidth:150}}><option value="">Evento (facoltativo)</option>{eventiOpts.map(([id,t])=><option key={id} value={id}>{t}</option>)}</select>
        </div>
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={onFile} style={{display:"none"}}/>
        <button onClick={()=>fileRef.current&&fileRef.current.click()} disabled={uploading} style={{...btnPrimary,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 0",opacity:uploading?.6:1}}>{uploading?<Loader2 size={17} className="spin"/>:<Plus size={17}/>} {uploading?"Carico…":"Scegli PDF e carica"}</button>
        {err?<p style={{color:"#d33",fontSize:13,margin:"8px 2px 0"}}>{err}</p>:null}
      </div>
      {rows===null ? <div style={{...card,color:C.mut,fontSize:13}}>Carico…</div>
       : rows.length===0 ? <div style={{...card,color:C.mut,fontSize:14}}>Nessun contratto caricato.</div>
       : <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {rows.map(r=>(
            <div key={r.id} style={{...card,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{width:38,height:38,borderRadius:10,background:C.primarySoft,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><FileText size={18} color={C.primary}/></div>
              <div style={{flex:1,minWidth:150}}>
                <div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.nome}</div>
                <div style={{fontSize:12,color:C.mut,marginTop:2}}>{(r.staff_id&&staff[r.staff_id])?staff[r.staff_id].nome:""}{r.staff_id&&r.evento_id?" · ":""}{r.evento_id?eventi[r.evento_id]:""}{(!r.staff_id&&!r.evento_id)?fdate(r.created_at):` · ${fdate(r.created_at)}`}</div>
              </div>
              <button onClick={()=>scarica(r)} style={{...btnGhost,display:"flex",alignItems:"center",gap:6,padding:"8px 12px",fontSize:13}}><Download size={15}/> Apri</button>
              <button onClick={()=>del(r)} style={{...iconBtn,color:"#d33",padding:6}}><Trash2 size={17}/></button>
            </div>))}
         </div>}
    </div>
  );
}

function PasswordEdit({ me, onClose }){
  const [p1,setP1]=useState(""); const [p2,setP2]=useState("");
  const [busy,setBusy]=useState(false); const [err,setErr]=useState(""); const [msg,setMsg]=useState("");
  const ok=p1.length>=6 && p1===p2;
  async function save(){
    if(!ok||busy) return; setBusy(true); setErr(""); setMsg("");
    const { error }=await supabase.auth.updateUser({password:p1});
    if(error){ setBusy(false); setErr(error.message); return; }
    await supabase.from("staff_anagrafica").update({password_iniziale:null}).eq("id",me.id);
    setBusy(false); setMsg("Password aggiornata"); setTimeout(onClose,1200);
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}} onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:18,width:"100%",maxWidth:420,margin:"24px 0",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <h3 style={{...head,fontSize:20,fontWeight:800,margin:0}}>Cambia password</h3>
          <button onClick={onClose} style={iconBtn}><X size={20} color={C.mut}/></button>
        </div>
        <label style={lbl}>Nuova password</label>
        <input type="password" value={p1} onChange={e=>setP1(e.target.value)} placeholder="Almeno 6 caratteri" style={inp}/>
        <label style={lbl}>Ripeti password</label>
        <input type="password" value={p2} onChange={e=>setP2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} style={inp}/>
        {p1&&p1.length<6?<p style={{color:"#d33",fontSize:12,margin:"5px 2px 0"}}>Minimo 6 caratteri</p>:null}
        {p1&&p2&&p1!==p2?<p style={{color:"#d33",fontSize:12,margin:"5px 2px 0"}}>Le password non coincidono</p>:null}
        {err?<p style={{color:"#d33",fontSize:13,margin:"8px 2px 0"}}>{err}</p>:null}
        {msg?<p style={{color:C.success,fontSize:13,fontWeight:600,margin:"8px 2px 0"}}>{msg}</p>:null}
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button onClick={onClose} style={{...btnGhost,flex:1}}>Annulla</button>
          <button onClick={save} disabled={!ok||busy} style={{...btnPrimary,flex:1,opacity:(!ok||busy)?.55:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>{busy&&<Loader2 size={16} className="spin"/>} Salva</button>
        </div>
        <style>{`.spin{animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function AdminStats(){
  const [d,setD]=useState(null); const [roleOpen,setRoleOpen]=useState(null);
  useEffect(()=>{ (async()=>{
    const { data:staff }=await supabase.from("staff_anagrafica").select("id,nome,cognome,ruolo,attivo");
    const { count:nEventi }=await supabase.from("eventi").select("*",{count:"exact",head:true});
    const { count:nComun }=await supabase.from("comunicazioni").select("*",{count:"exact",head:true});
    const { data:part }=await supabase.from("eventi_partecipazioni").select("rsvp,presente");
    const { data:cl }=await supabase.rpc("classifica");
    const sa=staff||[];
    const perRuolo={}; sa.forEach(x=>{ const r=x.ruolo||"—"; perRuolo[r]=(perRuolo[r]||0)+1; });
    setD({ tot:sa.length, att:sa.filter(x=>x.attivo).length, nEventi:nEventi||0, nComun:nComun||0,
      perRuolo, nPres:(part||[]).filter(x=>x.presente===true).length, nSi:(part||[]).filter(x=>x.rsvp==="ci_saro").length,
      top:(cl||[]).slice(0,5), lista:sa });
  })(); },[]);
  if(!d) return <div style={{...card,color:C.mut,fontSize:13}}>Carico…</div>;
  const ruoliArr=Object.entries(d.perRuolo).sort((a,b)=>b[1]-a[1]);
  const maxN=Math.max(1,...ruoliArr.map(x=>x[1]));
  return (
    <div>
      <h2 style={{...head,fontSize:22,fontWeight:800,margin:"0 0 14px"}}>Statistiche</h2>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <BigStat n={d.tot} l="Staff totali" Ic={Users} col={C.primary}/>
        <BigStat n={d.att} l="Attivi" Ic={Check} col={C.success}/>
        <BigStat n={d.nEventi} l="Eventi" Ic={Calendar} col={C.accent}/>
        <BigStat n={d.nPres} l="Presenze segnate" Ic={Check} col={C.primary}/>
      </div>
      <div style={{...card,marginBottom:14}}>
        <h3 style={{...sect,marginTop:0}}>Staff per ruolo</h3>
        {ruoliArr.map(([r,n])=>{ const w=Math.round(n/maxN*100); return (
          <button key={r} onClick={()=>setRoleOpen(r)} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",cursor:"pointer",padding:0,marginBottom:9,display:"block"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}><span style={{display:"flex",alignItems:"center",gap:4}}>{rlabel(r)} <ChevronRight size={13} color={C.mut}/></span><span style={{fontWeight:700}}>{n}</span></div>
            <div style={{height:8,borderRadius:4,background:"#eef1f6",overflow:"hidden"}}><div style={{width:w+"%",height:"100%",background:C.primary,borderRadius:4}}/></div>
          </button>); })}
      </div>
      <div style={{...card,marginBottom:14}}>
        <h3 style={{...sect,marginTop:0}}>Partecipazione</h3>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:14,padding:"6px 0"}}><span style={{color:C.mut}}>Risposte "ci sarò"</span><span style={{fontWeight:700}}>{d.nSi}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:14,padding:"6px 0",borderTop:`1px solid ${C.border}`}}><span style={{color:C.mut}}>Presenze reali segnate</span><span style={{fontWeight:700}}>{d.nPres}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:14,padding:"6px 0",borderTop:`1px solid ${C.border}`}}><span style={{color:C.mut}}>Comunicazioni inviate</span><span style={{fontWeight:700}}>{d.nComun}</span></div>
      </div>
      <div style={card}>
        <h3 style={{...sect,marginTop:0}}>Classifica punti (top 5)</h3>
        {d.top.length===0 ? <span style={{color:C.mut,fontSize:13}}>Ancora nessun punto.</span>
         : d.top.map((r,i)=>(
          <div key={r.staff_id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:i?`1px solid ${C.border}`:"none"}}>
            <span style={{...head,fontSize:16,fontWeight:800,color:i<3?C.accent:C.mut,width:22}}>{i+1}</span>
            <span style={{flex:1,fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.nome} {r.cognome}</span>
            <span style={{...head,fontWeight:800,color:C.accent}}>{r.punti}</span>
          </div>))}
      </div>
      {roleOpen && (
        <div onMouseDown={e=>{ if(e.target===e.currentTarget) setRoleOpen(null); }} style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:18,width:"100%",maxWidth:460,margin:"24px 0",padding:20,maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h3 style={{...head,fontSize:20,fontWeight:800,margin:0}}>{rlabel(roleOpen)}</h3>
              <button onClick={()=>setRoleOpen(null)} style={iconBtn}><X size={22} color={C.mut}/></button>
            </div>
            <div style={{overflowY:"auto"}}>
              {(d.lista||[]).filter(x=>(x.ruolo||"—")===roleOpen).sort((a,b)=>(a.cognome||"").localeCompare(b.cognome||"")).map((x,i)=>(
                <div key={x.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:i?`1px solid ${C.border}`:"none"}}>
                  <span style={{flex:1,fontWeight:600,fontSize:14}}>{x.nome} {x.cognome}</span>
                  {x.attivo?<Tag c={C.success} bg={C.successSoft} t="Attivo"/>:<Tag c={C.mut} bg="#eef1f6" t="Inattivo"/>}
                </div>))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventForm({ me, ev, onClose, onSaved }){
  const isEdit=!!ev.id;
  const [f,setF]=useState({titolo:ev.titolo||"",categoria:ev.categoria||"NOTTE_EVENTO",inizio:ev.inizio?toLocalInput(ev.inizio):"",luogo:ev.luogo||"",zona:ev.zona||"",descrizione:ev.descrizione||"",punti:(ev.punti!=null?ev.punti:10)});
  const [busy,setBusy]=useState(false); const [err,setErr]=useState("");
  const set=(k,v)=>setF(o=>({...o,[k]:v}));
  const ok=f.titolo.trim()&&f.categoria;
  async function save(){
    if(!ok||busy) return; setBusy(true); setErr("");
    const payload={titolo:f.titolo.trim(),categoria:f.categoria,inizio:f.inizio?new Date(f.inizio).toISOString():null,luogo:f.luogo.trim()||null,zona:f.zona.trim()||null,descrizione:f.descrizione.trim()||null,punti:(f.punti===""||f.punti==null)?10:(parseInt(f.punti)||10)};
    let error;
    if(isEdit){ ({ error }=await supabase.from("eventi").update(payload).eq("id",ev.id)); }
    else { ({ error }=await supabase.from("eventi").insert({...payload,created_by:me.id})); }
    setBusy(false);
    if(error){ setErr(error.message); return; }
    if(!isEdit){ try{ await supabase.functions.invoke("send-push",{body:{title:"Nuovo evento: "+f.titolo.trim(),body:(f.luogo.trim()?f.luogo.trim()+" · ":"")+"apri per dire se ci sarai",tag:"evento"}}); }catch(e){} }
    onSaved();
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}} onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:18,width:"100%",maxWidth:460,margin:"24px 0",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{...head,fontSize:20,fontWeight:800,margin:0}}>{isEdit?"Modifica evento":"Nuovo evento"}</h3>
          <button onClick={onClose} style={iconBtn}><X size={20} color={C.mut}/></button>
        </div>
        <label style={lbl}>Titolo *</label>
        <input value={f.titolo} onChange={e=>set("titolo",e.target.value)} placeholder="Es. Opening Party" style={inp}/>
        <label style={lbl}>Categoria *</label>
        <select value={f.categoria} onChange={e=>set("categoria",e.target.value)} style={inp}>
          <option value="NOTTE_EVENTO">Notte Evento</option>
          <option value="PROMOZIONALE">Promozionale</option>
          <option value="RTS">Road To Summer</option>
        </select>
        <label style={lbl}>Data e ora</label>
        <input type="datetime-local" value={f.inizio} onChange={e=>set("inizio",e.target.value)} style={inp}/>
        <label style={lbl}>Luogo</label>
        <input value={f.luogo} onChange={e=>set("luogo",e.target.value)} placeholder="Es. Villa delle Rose, Torino" style={inp}/>
        <label style={lbl}>Zona (informativa)</label>
        <input value={f.zona} onChange={e=>set("zona",e.target.value)} placeholder="Es. Piemonte" style={inp}/>
        <label style={lbl}>Punti presenza</label>
        <input type="number" value={f.punti} onChange={e=>set("punti",e.target.value)} style={inp}/>
        <label style={lbl}>Descrizione</label>
        <textarea value={f.descrizione} onChange={e=>set("descrizione",e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/>
        {err?<p style={{color:"#d33",fontSize:13,margin:"8px 2px 0"}}>{err}</p>:null}
        <p style={{fontSize:12,color:C.mut,margin:"10px 2px 0"}}>L'evento arriva a tutto lo staff Invibe.</p>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={onClose} style={{...btnGhost,flex:1}}>Annulla</button>
          <button onClick={save} disabled={!ok||busy} style={{...btnPrimary,flex:1,opacity:(!ok||busy)?.55:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>{busy&&<Loader2 size={16} className="spin"/>} {isEdit?"Salva":"Crea"}</button>
        </div>
        <style>{`.spin{animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function toLocalInput(iso){ const d=new Date(iso); const p=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; }

function fdate(s){ if(!s) return "Data da definire"; try{ return new Date(s).toLocaleDateString("it-IT",{weekday:"short",day:"numeric",month:"short"}); }catch{ return s; } }
const iconBtn={background:"transparent",border:"none",cursor:"pointer",padding:0};
const btnPrimary={border:"none",cursor:"pointer",borderRadius:11,padding:"10px 14px",background:C.primary,color:"#fff",fontWeight:700,fontSize:14,fontFamily:"Barlow"};
const btnGhost={border:`1px solid ${C.border}`,cursor:"pointer",borderRadius:11,padding:"10px 0",background:C.surface,color:C.text,fontWeight:600,fontSize:14,fontFamily:"Barlow"};
const bigBtn={flex:1,cursor:"pointer",borderRadius:13,padding:"13px 0",fontFamily:"Barlow",fontWeight:700,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:7};
const card={background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:15};
const sect={...head,fontSize:13,fontWeight:700,color:C.mut,textTransform:"uppercase",letterSpacing:.4,margin:"0 0 11px"};
function ERow({ e, state, onClick }){ const cat=CAT[e.categoria]||CAT.NOTTE_EVENTO; return (
  <button onClick={onClick} style={{width:"100%",textAlign:"left",cursor:"pointer",background:C.surface,border:`1px solid ${C.border}`,borderRadius:15,padding:0,overflow:"hidden",display:"flex"}}>
    <span style={{width:4,alignSelf:"stretch",background:cat.color}}/>
    <span style={{padding:"13px 14px",flex:1,display:"flex",alignItems:"center",gap:10}}>
      <span style={{flex:1}}><span style={{fontSize:11,fontWeight:700,color:cat.color}}>{cat.label}</span>
        <span style={{display:"block",fontSize:15,fontWeight:700,color:C.text,marginTop:2}}>{e.titolo}</span>
        <span style={{display:"block",fontSize:12.5,color:C.mut,marginTop:3}}>{fdate(e.inizio)}{e.luogo?` · ${e.luogo}`:""}</span></span>
      {state&&state.rsvp==="ci_saro"?<span style={{display:"flex",alignItems:"center",gap:4,color:C.success,fontSize:12,fontWeight:700}}><Check size={15}/> Ci sarò</span>
       :state&&state.rsvp==="non_ci_saro"?<span style={{color:C.mut,fontSize:12,fontWeight:600}}>Assente</span>
       :<ChevronRight size={18} color={C.mut}/>}
    </span></button>); }
function Line({ icon, t }){ return <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:9,fontSize:14}}>{icon}{t}</div>; }
function Info({ rows }){ return <div style={{...card,padding:0,overflow:"hidden"}}>{rows.map((r,i)=>(
  <div key={r[0]} style={{display:"flex",justifyContent:"space-between",padding:"12px 15px",borderTop:i?`1px solid ${C.border}`:"none"}}>
    <span style={{fontSize:13,color:C.mut}}>{r[0]}</span><span style={{fontSize:13.5,color:C.text,fontWeight:600}}>{r[1]}</span></div>))}</div>; }
function PercorsoStaff({ stadio }){
  const cur=(stadio===undefined||stadio===null||stadio==="")?-1:Number(stadio);
  return (
    <div style={card}>
      {PERCORSO_STEPS.map(([t,d],i)=>{ const done=i<cur, isCur=i===cur; const col=done?C.success:isCur?C.primary:C.border; return (
        <div key={i} style={{display:"flex",gap:12}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{width:isCur?16:12,height:isCur?16:12,borderRadius:8,background:col,marginTop:4,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{done && <Check size={9} color="#fff"/>}</div>
            {i<PERCORSO_STEPS.length-1 && <div style={{width:2,flex:1,background:i<cur?C.success:C.border,minHeight:18}}/>}
          </div>
          <div style={{paddingBottom:i<PERCORSO_STEPS.length-1?14:0}}>
            <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:14.5,color:(done||isCur)?C.text:C.mut}}>{t}</span>
              {isCur && <span style={{fontSize:10,fontWeight:800,color:"#fff",background:C.primary,borderRadius:6,padding:"2px 7px"}}>SEI QUI</span>}
            </div>
            <div style={{fontSize:12.5,color:C.mut,marginTop:1}}>{d}</div>
          </div>
        </div>); })}
    </div>
  );
}

function VitaStaff({ items }){
  const [open,setOpen]=useState(null);
  return (
    <>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
      {(items||[]).map(t=>{ const Ic=ICONS[t.icona]||Sparkles; return (
        <button key={t.id} onClick={()=>setOpen(t)} style={{...card,padding:14,textAlign:"left",cursor:"pointer",border:"none",display:"block"}}>
          <div style={{width:36,height:36,borderRadius:10,background:C.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}><Ic size={18} color={C.accent}/></div>
          <div style={{fontWeight:700,fontSize:13.5}}>{t.titolo}</div>
          {t.sottotitolo && <div style={{fontSize:11.5,color:C.mut,marginTop:2,lineHeight:1.35}}>{t.sottotitolo}</div>}
        </button>); })}
    </div>
    {open && <VitaModal item={open} onClose={()=>setOpen(null)}/>}
    </>
  );
}

function VitaModal({ item, onClose }){
  const Ic=ICONS[item.icona]||Sparkles;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}} onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:18,width:"100%",maxWidth:460,margin:"24px 0",padding:22}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:12}}>
          <div style={{width:48,height:48,borderRadius:13,background:C.accentSoft,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic size={24} color={C.accent}/></div>
          <button onClick={onClose} style={iconBtn}><X size={22} color={C.mut}/></button>
        </div>
        <h3 style={{...head,fontSize:23,fontWeight:800,margin:"0 0 4px"}}>{item.titolo}</h3>
        {item.sottotitolo && <p style={{margin:0,fontSize:14,color:C.mut}}>{item.sottotitolo}</p>}
        {item.contenuto ? <p style={{margin:"14px 0 0",fontSize:14.5,color:C.text,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{item.contenuto}</p>
          : <p style={{margin:"14px 0 0",fontSize:13.5,color:C.mut}}>Presto altri dettagli su questa iniziativa.</p>}
      </div>
    </div>
  );
}

function News({ tag, color, title, body, time }){ return (
  <div style={{...card,padding:0,overflow:"hidden"}}>
    <div style={{height:5,background:`linear-gradient(90deg,${color},${C.accent})`}}/>
    <div style={{padding:"14px 16px"}}>
      <span style={{fontSize:10,fontWeight:800,color:"#fff",background:color,borderRadius:999,padding:"3px 11px",textTransform:"uppercase",letterSpacing:.6}}>{tag}</span>
      <div style={{...head,fontSize:18.5,fontWeight:800,margin:"10px 0 4px",lineHeight:1.12}}>{title}</div>
      <p style={{margin:0,fontSize:13.5,color:C.mut,lineHeight:1.45}}>{body}</p>
      {time && <div style={{fontSize:11,color:C.mut,marginTop:8,fontWeight:600}}>{time}</div>}
    </div>
  </div>); }
function BigStat({ n, l, Ic, col }){ return (
  <div style={{flex:1,minWidth:150,...card,display:"flex",alignItems:"center",gap:13}}>
    <div style={{width:42,height:42,borderRadius:12,background:col+"22",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic size={20} color={col}/></div>
    <div><div style={{...head,fontSize:24,fontWeight:800,lineHeight:1}}>{n}</div><div style={{fontSize:12,color:C.mut,marginTop:2}}>{l}</div></div></div>); }
function Tag({ c, bg, t }){ return <span style={{fontSize:11.5,fontWeight:700,color:c,background:bg,borderRadius:7,padding:"4px 9px"}}>{t}</span>; }
