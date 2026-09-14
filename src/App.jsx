import React, { useState, useEffect } from "react";
import {
  Bell, Home, Calendar, MessageSquare, User, MapPin, Check, X, Clock, Trophy,
  ChevronRight, ChevronLeft, LogOut, Shield, Users, Search, Plus, Play, Loader2, Pencil, Trash2
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

  if(!ready) return <Splash/>;
  if(!me) return <Login onDone={async(sess)=>{ await supabase.auth.setSession(sess); await loadMe(); }}/>;
  if(me.ruolo!=="UFFICIO" && !me.profilo_completato) return <Onboarding me={me} onDone={loadMe} onLogout={async()=>{ await supabase.auth.signOut(); setMe(null); }}/>;
  return <Shell me={me} onLogout={async()=>{ await supabase.auth.signOut(); setMe(null); }}/>;
}

function Splash(){
  return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:C.primary}}>
    <img src={LOGO_W} alt="INVIBE" style={{height:32}}/>
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
      <img src={LOGO_W} alt="INVIBE" style={{height:36}}/>
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
          <img src={LOGO_W} alt="INVIBE" style={{height:22}}/>
          <button onClick={onLogout} style={iconBtn}><LogOut size={19} color="#cfe0ff"/></button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{maxWidth:640,margin:"0 auto",width:"100%",padding:"18px 16px 40px"}}>
          <h1 style={{...head,fontSize:28,fontWeight:800,margin:"6px 0 6px"}}>Benvenut{isDonna(me.sesso)?"a":"o"}, {me.nome}!</h1>
          <p style={{color:C.mut,fontSize:14,lineHeight:1.5,margin:"0 0 16px"}}>Prima di entrare, controlla che i dati siano giusti e completa quelli mancanti. Ti serve una volta sola.</p>
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

function Shell({ me, onLogout }){
  const [admin,setAdmin]=useState(false);
  const isUff=me.ruolo==="UFFICIO";
  if(admin && isUff) return <Admin me={me} onLogout={onLogout} onBack={()=>setAdmin(false)}/>;
  return <StaffApp me={me} onLogout={onLogout} isUff={isUff} openAdmin={()=>setAdmin(true)}/>;
}

/* =============================== STAFF =============================== */
function StaffApp({ me, onLogout, isUff, openAdmin }){
  const desktop=useMedia("(min-width:860px)");
  const [tab,setTab]=useState("home");
  const [openEvent,setOpenEvent]=useState(null);
  const [events,setEvents]=useState([]); const [rsvp,setRsvp]=useState({});
  const [coms,setComs]=useState([]); const [letto,setLetto]=useState({});
  useEffect(()=>{ (async()=>{
    const { data:ev }=await supabase.from("eventi").select("*").order("inizio",{ascending:true});
    setEvents(ev||[]);
    const { data:parts }=await supabase.from("eventi_partecipazioni").select("evento_id,rsvp").eq("staff_id",me.id);
    const m={}; (parts||[]).forEach(p=>m[p.evento_id]=p.rsvp); setRsvp(m);
    const { data:c }=await supabase.from("comunicazioni").select("*").order("created_at",{ascending:false});
    setComs(c||[]);
    const { data:le }=await supabase.from("comunicazioni_letture").select("comunicazione_id,confermata_at").eq("staff_id",me.id);
    const lm={}; (le||[]).forEach(x=>{ if(x.confermata_at) lm[x.comunicazione_id]=true; }); setLetto(lm);
  })(); },[me.id]);
  async function answer(ev,val){
    setRsvp(r=>({...r,[ev]:val}));
    await supabase.from("eventi_partecipazioni").upsert({evento_id:ev,staff_id:me.id,rsvp:val,rsvp_at:new Date().toISOString()},{onConflict:"evento_id,staff_id"});
  }
  async function conferma(cid){ setLetto(l=>({...l,[cid]:true})); await supabase.from("comunicazioni_letture").upsert({comunicazione_id:cid,staff_id:me.id,confermata_at:new Date().toISOString()},{onConflict:"comunicazione_id,staff_id"}); }
  const ev=events.find(e=>e.id===openEvent);
  const NAV=[["home",Home,"Home"],["eventi",Calendar,"Eventi"],["avvisi",MessageSquare,"Avvisi"],["profilo",User,"Profilo"]];
  const content = ev ? <EventDetail ev={ev} answer={rsvp[ev.id]} onA={answer} onBack={()=>setOpenEvent(null)}/>
    : tab==="home" ? <SHome me={me} events={events} rsvp={rsvp} onA={answer} open={setOpenEvent} isUff={isUff} openAdmin={openAdmin} coms={coms} letto={letto} conferma={conferma}/>
    : tab==="eventi" ? <SEventi events={events} rsvp={rsvp} open={setOpenEvent}/>
    : tab==="avvisi" ? <SAvvisi coms={coms} letto={letto} conferma={conferma}/>
    : <SProfilo me={me} onLogout={onLogout}/>;
  return (
    <div style={{background:C.bg,display:"flex",flexDirection:"column",height:desktop?undefined:"100%",minHeight:desktop?"100%":undefined}}>
      <div style={{background:C.primary,flexShrink:0}}>
        <div style={{maxWidth:1080,margin:"0 auto",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
          <img src={LOGO_W} alt="INVIBE" style={{height:22,display:"block"}}/>
          {desktop && <div style={{display:"flex",gap:6}}>
            {NAV.map(([k,Ic,l])=>{ const on=tab===k; return (
              <button key={k} onClick={()=>{setTab(k);setOpenEvent(null);}} style={{display:"flex",alignItems:"center",gap:7,border:"none",cursor:"pointer",borderRadius:9,padding:"8px 14px",background:on?"rgba(255,255,255,0.18)":"transparent",color:"#fff",fontFamily:"Barlow",fontWeight:on?700:600,fontSize:14}}>
                <Ic size={17}/> {l}</button>); })}
          </div>}
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <Bell size={20} color="#fff"/>
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
    </div>
  );
}

function SHome({ me, events, rsvp, onA, open, isUff, openAdmin, coms, letto, conferma }){
  const upcoming=events.slice(0,6);
  const bannerCom=(coms||[]).find(c=>c.richiede_conferma && !letto[c.id]);
  return (
    <div style={{padding:"16px 16px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <p style={{margin:0,color:C.mut,fontSize:13}}>Ciao,</p>
          <h1 style={{...head,fontSize:30,fontWeight:800,margin:"1px 0 3px"}}>{me.nome}</h1>
          <p style={{margin:0,color:C.mut,fontSize:12.5}}>{rlabel(me.ruolo)}{me.zona?` · ${me.zona}`:""}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:C.accentSoft,borderRadius:999,padding:"6px 11px"}}>
          <Trophy size={14} color={C.accent}/><span style={{...head,fontWeight:700,fontSize:14,color:C.accent}}>0</span>
        </div>
      </div>

      {bannerCom && (
        <div style={{background:C.amberSoft,border:"1px solid #f4d9a6",borderRadius:16,padding:14,marginBottom:18}}>
          <div style={{display:"flex",gap:9}}>
            <Bell size={17} color={C.amber} style={{flexShrink:0,marginTop:1}}/>
            <div style={{flex:1}}>
              <p style={{margin:0,fontWeight:700,fontSize:14}}>{bannerCom.titolo}</p>
              {bannerCom.corpo && <p style={{margin:"2px 0 0",fontSize:12.5,color:C.mut}}>{bannerCom.corpo}</p>}
            </div>
          </div>
          <button onClick={()=>conferma(bannerCom.id)} style={{...btnPrimary,width:"100%",marginTop:11,background:C.amber,color:"#1a1206"}}>Ho letto e confermo</button>
        </div>
      )}
      {isUff && <button onClick={openAdmin} style={{...btnPrimary,width:"100%",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 0"}}>
        <Shield size={17}/> Pannello Admin</button>}

      <h3 style={sect}>Aftermovie Estate 2026</h3>
      <div style={{position:"relative",width:"100%",height:190,borderRadius:18,overflow:"hidden",marginBottom:24,background:"linear-gradient(130deg,#7170F1,#255FF0 55%,#18C7D0)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:58,height:58,borderRadius:30,background:"rgba(255,255,255,0.92)",display:"flex",alignItems:"center",justifyContent:"center"}}><Play size={24} color={C.primary} style={{marginLeft:3}}/></div>
        <div style={{position:"absolute",left:14,bottom:12,right:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{...head,color:"#fff",fontWeight:700,fontSize:18}}>Rivivi l'estate</span>
          <span style={{color:"#fff",fontSize:12.5,background:"rgba(0,0,0,0.28)",borderRadius:6,padding:"2px 7px"}}>3:24</span>
        </div>
      </div>

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

      <h3 style={sect}>Novità</h3>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <News tag="Reunion" color={C.accent} title="Aperte le iscrizioni al Reunion" body="Segna la data: la grande rimpatriata dello staff." time="di recente"/>
        <News tag="Merch" color={C.primary} title="Nuovo merch INVIBE in sede" body="Poli e felpe nuove disponibili. Passa a ritirarle." time="di recente"/>
      </div>
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
  return (
    <div style={{padding:"16px 16px 24px"}}>
      <h1 style={{...head,fontSize:26,fontWeight:800,margin:"4px 0 3px"}}>Avvisi</h1>
      <p style={{margin:"0 0 18px",color:C.mut,fontSize:13}}>Comunicazioni dall'ufficio.</p>
      {coms.length===0 ? <div style={{...card,color:C.mut,fontSize:13}}>Nessun avviso.</div>
      : <div style={{display:"flex",flexDirection:"column",gap:11}}>
          {coms.map(c=>{ const confermato=!!letto[c.id]; return (
            <div key={c.id} style={card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,gap:8}}>
                <span style={{fontWeight:700,fontSize:14.5}}>{c.titolo}</span>
                {c.richiede_conferma && (confermato
                  ? <span style={{fontSize:10.5,fontWeight:700,color:C.success,background:C.successSoft,borderRadius:6,padding:"3px 7px",whiteSpace:"nowrap"}}>CONFERMATO</span>
                  : <span style={{fontSize:10.5,fontWeight:700,color:C.amber,background:C.amberSoft,borderRadius:6,padding:"3px 7px",whiteSpace:"nowrap"}}>DA CONFERMARE</span>)}
              </div>
              {c.corpo && <p style={{margin:"0 0 7px",fontSize:13,color:C.mut,lineHeight:1.45}}>{c.corpo}</p>}
              <span style={{fontSize:11.5,color:C.mut}}>{fdate(c.created_at)}</span>
              {c.richiede_conferma && !confermato && <button onClick={()=>conferma(c.id)} style={{...btnPrimary,marginTop:10,padding:"9px 16px"}}>Conferma</button>}
            </div>); })}
        </div>}
    </div>
  );
}

function SProfilo({ me, onLogout }){
  const pub=[["Ruolo",rlabel(me.ruolo)],["Zona",me.zona||"—"],["Anno d'ingresso",me.anno_ingresso||"—"],["Turni fatti",me.settimane_2025??"—"],["Taglia divisa",me.taglia_maglia||"—"]];
  const priv=[["Email",me.email||"—"],["Telefono",me.telefono||"—"],["Città",me.citta||"—"],["Codice fiscale",me.codice_fiscale||"—"]];
  const ini=((me.nome||" ")[0]+(me.cognome||" ")[0]).toUpperCase();
  return (
    <div style={{padding:"16px 16px 28px"}}>
      <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:18}}>
        <div style={{width:62,height:62,borderRadius:31,background:C.primarySoft,display:"flex",alignItems:"center",justifyContent:"center",...head,fontSize:22,fontWeight:800,color:C.primary}}>{ini}</div>
        <div><h1 style={{...head,fontSize:23,fontWeight:800,margin:0}}>{me.nome} {me.cognome}</h1>
          <p style={{margin:"2px 0 0",color:C.mut,fontSize:13}}>{rlabel(me.ruolo)}{me.zona?` · ${me.zona}`:""}</p></div>
      </div>
      <h3 style={sect}>Informazioni</h3><Info rows={pub}/>
      <h3 style={{...sect,marginTop:18}}>Dati personali · solo tu e l'ufficio</h3><Info rows={priv}/>
      <button onClick={onLogout} style={{...btnGhost,width:"100%",marginTop:20,color:"#d33",borderColor:"#f0c4c4",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><LogOut size={17}/> Esci</button>
    </div>
  );
}

function EventDetail({ ev, answer, onA, onBack }){
  const cat=CAT[ev.categoria]||CAT.NOTTE_EVENTO;
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
          <button onClick={()=>onA(ev.id,"ci_saro")} style={{...bigBtn,background:answer==="ci_saro"?C.success:C.surface,color:answer==="ci_saro"?"#fff":C.text,border:answer==="ci_saro"?"none":`1px solid ${C.border}`}}><Check size={18}/> Ci sarò</button>
          <button onClick={()=>onA(ev.id,"non_ci_saro")} style={{...bigBtn,background:answer==="non_ci_saro"?"#eef1f6":C.surface,color:C.text,border:`1px solid ${C.border}`}}><X size={18}/> Non ci sarò</button>
        </div>
      </div>
    </div>
  );
}

/* =============================== ADMIN =============================== */
function Admin({ me, onLogout, onBack }){
  const desktop=useMedia("(min-width:860px)");
  const [section,setSection]=useState("staff");
  const NAV=[["staff",Users,"Staff"],["eventi",Calendar,"Eventi"],["presenze",Check,"Presenze"],["avvisi",MessageSquare,"Avvisi"]];
  const body = section==="staff" ? <AdminStaff/>
    : section==="eventi" ? <AdminEventi me={me}/>
    : section==="avvisi" ? <AdminComunicazioni me={me}/>
    : <div style={{...card,color:C.mut,fontSize:14}}>Presenze — si gestiscono dentro ogni evento (Eventi › Gestisci presenze).</div>;
  return (
    <div style={{background:C.bg,display:"flex",flexDirection:desktop?"row":"column",height:desktop?undefined:"100%",minHeight:desktop?"100%":undefined}}>
      {desktop &&
      <div style={{width:92,background:C.sidebar,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:16}}>
        <img src={LOGO_W} alt="INVIBE" style={{width:34,marginBottom:20}}/>
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
          <img src={LOGO_W} alt="INVIBE" style={{height:20}}/>
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
  const [rows,setRows]=useState(null); const [q,setQ]=useState("");
  useEffect(()=>{ supabase.from("staff_anagrafica").select("id,nome,cognome,ruolo,zona,attivo").order("cognome").then(({data})=>setRows(data||[])); },[]);
  const filt=(rows||[]).filter(r=>(`${r.nome} ${r.cognome}`).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <BigStat n={rows?rows.length:"…"} l="Staff totali" Ic={Users} col={C.primary}/>
        <BigStat n={rows?rows.filter(r=>r.attivo).length:"…"} l="Attivi" Ic={Check} col={C.success}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <h2 style={{...head,fontSize:22,fontWeight:800,margin:0,flex:1}}>Anagrafica staff</h2>
        <div style={{display:"flex",alignItems:"center",gap:7,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 11px"}}>
          <Search size={15} color={C.mut}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cerca…" style={{border:"none",outline:"none",fontSize:13,color:C.text,width:120}}/>
        </div>
      </div>
      <div style={{...card,padding:0,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"1.6fr 1.2fr 1fr 0.7fr",padding:"11px 16px",background:"#fbfcfe",borderBottom:`1px solid ${C.border}`,fontSize:11.5,fontWeight:700,color:C.mut,textTransform:"uppercase",letterSpacing:.4}}>
          <span>Nome</span><span>Ruolo</span><span>Zona</span><span>Stato</span>
        </div>
        {rows===null ? <div style={{padding:20,color:C.mut,fontSize:13}}>Carico…</div>
        : filt.map((r,i)=>(
          <div key={r.id} style={{display:"grid",gridTemplateColumns:"1.6fr 1.2fr 1fr 0.7fr",padding:"12px 16px",borderBottom:i<filt.length-1?`1px solid ${C.border}`:"none",alignItems:"center",fontSize:13.5}}>
            <span style={{fontWeight:600}}>{r.nome} {r.cognome}</span>
            <span style={{color:C.mut}}>{rlabel(r.ruolo)}</span>
            <span style={{color:C.mut}}>{r.zona||"—"}</span>
            <span>{r.attivo?<Tag c={C.success} bg={C.successSoft} t="Attivo"/>:<Tag c={C.mut} bg="#eef1f6" t="Inattivo"/>}</span>
          </div>))}
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
  const [filter,setFilter]=useState("tutti");
  const [q,setQ]=useState("");
  async function load(){
    const { data:st }=await supabase.from("staff_anagrafica").select("id,nome,cognome,ruolo,attivo").eq("attivo",true).order("cognome");
    setStaff(st||[]);
    const { data:pp }=await supabase.from("eventi_partecipazioni").select("staff_id,rsvp,presente").eq("evento_id",ev.id);
    const m={}; (pp||[]).forEach(p=>m[p.staff_id]={rsvp:p.rsvp,presente:p.presente}); setPart(m);
  }
  useEffect(()=>{ load(); },[ev.id]);
  async function togglePresente(sid){
    const nv=!(part[sid]&&part[sid].presente===true);
    setPart(m=>({...m,[sid]:{...(m[sid]||{}),presente:nv}}));
    await supabase.from("eventi_partecipazioni").upsert({evento_id:ev.id,staff_id:sid,presente:nv,presente_at:new Date().toISOString()},{onConflict:"evento_id,staff_id"});
  }
  const cat=CAT[ev.categoria]||CAT.NOTTE_EVENTO;
  const all=staff||[];
  const list=all.filter(s=>{
    const p=part[s.id]||{};
    if(q && !(`${s.nome} ${s.cognome}`).toLowerCase().includes(q.toLowerCase())) return false;
    if(filter==="si") return p.rsvp==="ci_saro";
    if(filter==="no") return p.rsvp==="non_ci_saro";
    if(filter==="presenti") return p.presente===true;
    if(filter==="assenti") return p.presente!==true;
    return true;
  });
  const nSi=all.filter(s=>(part[s.id]||{}).rsvp==="ci_saro").length;
  const nPres=all.filter(s=>(part[s.id]||{}).presente===true).length;
  const chips=[["tutti","Tutti"],["si","Ci sarò"],["no","Non ci sarò"],["presenti","Presenti"],["assenti","Assenti"]];
  return (
    <div>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:4,background:"transparent",border:"none",cursor:"pointer",color:C.mut,fontSize:14,padding:"2px 0 10px",fontFamily:"Barlow"}}><ChevronLeft size={18}/> Eventi</button>
      <div style={{...card,borderLeft:`4px solid ${cat.color}`,marginBottom:14}}>
        <span style={{fontSize:11,fontWeight:700,color:cat.color}}>{cat.label}</span>
        <div style={{...head,fontSize:20,fontWeight:800,margin:"2px 0 3px"}}>{ev.titolo}</div>
        <div style={{fontSize:12.5,color:C.mut}}>{fdate(ev.inizio)}{ev.luogo?` · ${ev.luogo}`:""}</div>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <BigStat n={nSi} l="Hanno detto sì" Ic={Check} col={C.success}/>
        <BigStat n={nPres} l="Presenti segnati" Ic={Users} col={C.primary}/>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {chips.map(([k,l])=>{ const on=filter===k; return <button key={k} onClick={()=>setFilter(k)} style={{border:`1px solid ${on?C.primary:C.border}`,background:on?C.primarySoft:C.surface,color:on?C.primary:C.mut,borderRadius:999,padding:"6px 12px",fontSize:12.5,fontWeight:700,cursor:"pointer",fontFamily:"Barlow"}}>{l}</button>; })}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:7,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 11px",marginBottom:12,maxWidth:280}}>
        <Search size={15} color={C.mut}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cerca…" style={{border:"none",outline:"none",fontSize:13,color:C.text,flex:1}}/>
      </div>
      {staff===null ? <div style={{...card,color:C.mut,fontSize:13}}>Carico…</div>
       : <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {list.map(s=>{ const p=part[s.id]||{}; const pres=p.presente===true; return (
            <div key={s.id} style={{...card,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:150}}>
                <div style={{fontWeight:600,fontSize:14}}>{s.nome} {s.cognome}</div>
                <div style={{fontSize:12,color:C.mut}}>{rlabel(s.ruolo)}</div>
              </div>
              {p.rsvp==="ci_saro"?<Tag c={C.success} bg={C.successSoft} t="Ci sarò"/>:p.rsvp==="non_ci_saro"?<Tag c={C.mut} bg="#eef1f6" t="Non ci sarò"/>:<Tag c={C.mut} bg="#f2f5fb" t="Nessuna risposta"/>}
              <button onClick={()=>togglePresente(s.id)} style={{border:"none",cursor:"pointer",borderRadius:9,padding:"7px 12px",fontFamily:"Barlow",fontWeight:700,fontSize:12.5,background:pres?C.success:"#eef1f6",color:pres?"#fff":C.mut,display:"flex",alignItems:"center",gap:5}}>{pres?<><Check size={14}/> Presente</>:"Segna presente"}</button>
            </div>); })}
         </div>}
    </div>
  );
}

function AdminComunicazioni({ me }){
  const [rows,setRows]=useState(null);
  const [editing,setEditing]=useState(null);
  const [counts,setCounts]=useState({});
  async function load(){
    const { data }=await supabase.from("comunicazioni").select("*").order("created_at",{ascending:false});
    setRows(data||[]);
    const { data:le }=await supabase.from("comunicazioni_letture").select("comunicazione_id,confermata_at");
    const c={}; (le||[]).forEach(x=>{ if(x.confermata_at) c[x.comunicazione_id]=(c[x.comunicazione_id]||0)+1; }); setCounts(c);
  }
  useEffect(()=>{ load(); },[]);
  async function del(id){ if(!window.confirm("Eliminare questa comunicazione?")) return; await supabase.from("comunicazioni").delete().eq("id",id); load(); }
  return (
    <div>
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
                <span style={{fontSize:11.5,color:C.mut}}>{fdate(c.created_at)}{c.richiede_conferma?` · confermata da ${counts[c.id]||0}`:""}</span>
              </div>
              <button onClick={()=>setEditing(c)} style={{...iconBtn,color:C.primary,padding:6}}><Pencil size={17}/></button>
              <button onClick={()=>del(c.id)} style={{...iconBtn,color:"#d33",padding:6}}><Trash2 size={17}/></button>
            </div>))}
         </div>}
      {editing!==null && <ComForm me={me} com={editing} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);load();}}/>}
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
    onSaved();
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}} onClick={onClose}>
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

function EventForm({ me, ev, onClose, onSaved }){
  const isEdit=!!ev.id;
  const [f,setF]=useState({titolo:ev.titolo||"",categoria:ev.categoria||"NOTTE_EVENTO",inizio:ev.inizio?toLocalInput(ev.inizio):"",luogo:ev.luogo||"",zona:ev.zona||"",descrizione:ev.descrizione||""});
  const [busy,setBusy]=useState(false); const [err,setErr]=useState("");
  const set=(k,v)=>setF(o=>({...o,[k]:v}));
  const ok=f.titolo.trim()&&f.categoria;
  async function save(){
    if(!ok||busy) return; setBusy(true); setErr("");
    const payload={titolo:f.titolo.trim(),categoria:f.categoria,inizio:f.inizio?new Date(f.inizio).toISOString():null,luogo:f.luogo.trim()||null,zona:f.zona.trim()||null,descrizione:f.descrizione.trim()||null};
    let error;
    if(isEdit){ ({ error }=await supabase.from("eventi").update(payload).eq("id",ev.id)); }
    else { ({ error }=await supabase.from("eventi").insert({...payload,created_by:me.id})); }
    setBusy(false);
    if(error){ setErr(error.message); return; }
    onSaved();
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(10,20,40,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,zIndex:100,overflowY:"auto"}} onClick={onClose}>
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
      {state==="ci_saro"?<span style={{display:"flex",alignItems:"center",gap:4,color:C.success,fontSize:12,fontWeight:700}}><Check size={15}/> Ci sarò</span>
       :state==="non_ci_saro"?<span style={{color:C.mut,fontSize:12,fontWeight:600}}>Assente</span>
       :<ChevronRight size={18} color={C.mut}/>}
    </span></button>); }
function Line({ icon, t }){ return <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:9,fontSize:14}}>{icon}{t}</div>; }
function Info({ rows }){ return <div style={{...card,padding:0,overflow:"hidden"}}>{rows.map((r,i)=>(
  <div key={r[0]} style={{display:"flex",justifyContent:"space-between",padding:"12px 15px",borderTop:i?`1px solid ${C.border}`:"none"}}>
    <span style={{fontSize:13,color:C.mut}}>{r[0]}</span><span style={{fontSize:13.5,color:C.text,fontWeight:600}}>{r[1]}</span></div>))}</div>; }
function News({ tag, color, title, body, time }){ return (
  <div style={{...card,display:"flex",gap:12}}>
    <div style={{width:4,alignSelf:"stretch",background:color,borderRadius:3,flexShrink:0}}/>
    <div style={{flex:1}}><span style={{fontSize:10.5,fontWeight:700,color,textTransform:"uppercase",letterSpacing:.4}}>{tag}</span>
      <div style={{...head,fontSize:17,fontWeight:700,margin:"2px 0 4px"}}>{title}</div>
      <p style={{margin:0,fontSize:13,color:C.mut,lineHeight:1.45}}>{body}</p>
      <span style={{fontSize:11.5,color:C.mut,display:"block",marginTop:6}}>{time}</span></div></div>); }
function BigStat({ n, l, Ic, col }){ return (
  <div style={{flex:1,minWidth:150,...card,display:"flex",alignItems:"center",gap:13}}>
    <div style={{width:42,height:42,borderRadius:12,background:col+"22",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic size={20} color={col}/></div>
    <div><div style={{...head,fontSize:24,fontWeight:800,lineHeight:1}}>{n}</div><div style={{fontSize:12,color:C.mut,marginTop:2}}>{l}</div></div></div>); }
function Tag({ c, bg, t }){ return <span style={{fontSize:11.5,fontWeight:700,color:c,background:bg,borderRadius:7,padding:"4px 9px"}}>{t}</span>; }
