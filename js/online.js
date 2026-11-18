/* Ludicopedia — online games with code rooms.
   Backend: Firebase Realtime Database (configuración en js/online-config.js).
   Con ?prueba en la URL y sin configuración, usa un backend local entre pestañas (para probar). */
(function(){
const SDK="https://www.gstatic.com/firebasejs/10.12.2/";
const LETRAS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const miId = (()=>{ let id=J.lee("online-id",null); if(!id){ id=Math.random().toString(36).slice(2,10); J.guarda("online-id",id); } return id; })();
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------- Backends ---------- */
function backendLocal(){ // entre pestañas del mismo navegador
  const bc=new BroadcastChannel("ludicopedia-salas"); const subs={};
  const cache={}; // localStorage tarda en propagarse entre pestañas: guardamos la última versión vista
  const lee=c=>{ let v=null; try{ v=JSON.parse(localStorage.getItem("sala-"+c)); }catch(e){} const k=cache[c]; return JSON.parse(JSON.stringify(k&&(!v||(k.v||0)>=(v.v||0))?k:v)); };
  const escribe=(c,v)=>{ cache[c]=JSON.parse(JSON.stringify(v)); localStorage.setItem("sala-"+c,JSON.stringify(v)); bc.postMessage({c,v}); (subs[c]||[]).forEach(f=>f(JSON.parse(JSON.stringify(v)))); };
  bc.onmessage=e=>{ const {c,v}=e.data; if(!cache[c]||(v.v||0)>=(cache[c].v||0)) cache[c]=v; (subs[c]||[]).forEach(f=>f(v)); };
  return {
    async leer(c){ return lee(c); },
    async crear(c,v){ if(lee(c)) return false; escribe(c,v); return true; },
    async transaccion(c,fn){ const v=fn(lee(c)); if(v===undefined) return {ok:false,v:lee(c)}; escribe(c,v); return {ok:true,v}; },
    async poner(c,ruta,val){ const v=lee(c)||{}; let o=v; const p=ruta.split("/"); for(let i=0;i<p.length-1;i++){ o[p[i]]=o[p[i]]||{}; o=o[p[i]]; } o[p[p.length-1]]=val; escribe(c,v); },
    escuchar(c,f){ (subs[c]=subs[c]||[]).push(f); f(lee(c)); return ()=>{ subs[c]=subs[c].filter(x=>x!==f); }; },
    presencia(){}
  };
}
let fb=null;
function carga(src){ return new Promise((ok,ko)=>{ const s=document.createElement("script"); s.src=src; s.onload=ok; s.onerror=ko; document.head.append(s); }); }
async function backendFirebase(){
  if(!fb){ await carga(SDK+"firebase-app-compat.js"); await carga(SDK+"firebase-database-compat.js"); firebase.initializeApp(window.FIREBASE_CONFIG); fb=firebase.database(); }
  const ref=c=>fb.ref("salas/"+c);
  return {
    async leer(c){ return (await ref(c).get()).val(); },
    async crear(c,v){ const r=await ref(c).transaction(x=> x===null? v : undefined); return r.committed; },
    async transaccion(c,fn){ const r0=ref(c), h=()=>{}; r0.on("value",h); // con escucha activa la caché local tiene el valor real
      try{ await r0.once("value"); const r=await r0.transaction(x=>{ if(x===null) return null; const n=fn(x); return n===undefined?undefined:n; });
        return {ok:r.committed&&r.snapshot.val()!==null, v:r.snapshot.val()}; } finally { r0.off("value",h); } },
    async poner(c,ruta,val){ await ref(c).child(ruta).set(val); },
    escuchar(c,f){ const h=s=>f(s.val()); ref(c).on("value",h); return ()=>ref(c).off("value",h); },
    presencia(c){ const r=ref(c).child("jugadores/"+miId+"/on"); r.set(true); r.onDisconnect().set(false); }
  };
}
async function backend(){
  if(/[?&]prueba/.test(location.search)) return backendLocal();
  if(window.FIREBASE_CONFIG&&window.FIREBASE_CONFIG.databaseURL) return backendFirebase();
  throw new Error("sin-config");
}
const disponible=()=>!!(window.FIREBASE_CONFIG&&window.FIREBASE_CONFIG.databaseURL)||/[?&]prueba/.test(location.search);

/* ---------- Interfaz ---------- */
document.head.append(J.el("style",{},`
.on-codigo{font-family:var(--titulos);font-size:3rem;letter-spacing:.25em;text-align:center;color:var(--oro);background:var(--panel2);border-radius:16px;padding:10px;margin:10px 0}
.on-lista{list-style:none;padding:0;margin:10px 0;display:grid;gap:6px}
.on-lista li{background:var(--panel2);border-radius:10px;padding:8px 12px;display:flex;gap:8px;align-items:center}
.on-lista li .off{color:var(--suave);font-size:.85rem;margin-left:auto}
.on-in{width:100%;font-size:1.1rem!important;margin:4px 0 10px}
.on-barra{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;background:linear-gradient(90deg,#1d4ed8,#7209b7);border-radius:14px;padding:8px 14px;margin:0 0 12px;color:#fff;font-weight:700}
.on-barra .yo{background:rgba(255,255,255,.18);border-radius:999px;padding:3px 10px}
`));

function nuevoCodigo(){ let c=""; for(let i=0;i<4;i++) c+=LETRAS[J.azar(LETRAS.length)]; return c; }

/* opciones: {juego, titulo, min, max, inicio(jugadores)->estado, alEmpezar(ctx), alCambiar(estado, ctx)} */
function activar(op){
  if(!disponible()) return;
  const acc=J.$(".juego-cab .acciones"); if(!acc) return;
  const b=J.el("button",{class:"btn peq",id:"b-online"},"🌐 Play online");
  b.onclick=()=>abrir(op); acc.prepend(b);
  const m=location.hash.match(/^#sala-([A-Z0-9]{4})$/i); if(m) setTimeout(()=>abrir(op,m[1].toUpperCase()),400);
}
async function abrir(op, codigo){
  let be; try{ be=await backend(); }catch(e){ J.aviso("Couldn’t connect to the game server. Please try again later."); return; }
  const nombre=J.lee("online-nombre","");
  J.modal(`<h2>🌐 Play online with friends</h2>
    <p>Create a room and send the code to your friends, or type the code you were given. Everyone plays on their own phone or computer.</p>
    <label>Your name<input class="on-in" id="on-nom" maxlength="14" value="${esc(nombre)}" placeholder="For example: Alex"></label>
    <div style="display:grid;gap:10px;grid-template-columns:1fr 1fr">
      <button class="btn" id="on-crear">➕ Create room</button>
      <div><input class="on-in" id="on-cod" maxlength="4" placeholder="Code" style="text-transform:uppercase;text-align:center;margin:0 0 6px" value="${codigo||""}"><button class="btn sec" id="on-unir" style="width:100%">Join</button></div>
    </div>`,[{txt:"Cancel",cls:"sec"}]);
  const nom=()=>{ const n=(J.$("#on-nom").value||"").trim().slice(0,14); if(!n){ J.aviso("Type your name"); J.$("#on-nom").focus(); return null; } J.guarda("online-nombre",n); return n; };
  J.$("#on-crear").onclick=async()=>{ const n=nom(); if(!n) return;
    let c, ok=false; for(let k=0;k<6&&!ok;k++){ c=nuevoCodigo(); ok=await be.crear(c,{juego:op.juego, t:Date.now(), anfitrion:miId, max:op.max, min:op.min, empezada:false, jugadores:{[miId]:{n, i:0, on:true}}}); }
    if(!ok){ J.aviso("Couldn’t create the room"); return; }
    sala(be,op,c,true); };
  J.$("#on-unir").onclick=async()=>{ const n=nom(); if(!n) return; const c=(J.$("#on-cod").value||"").trim().toUpperCase();
    if(c.length!==4){ J.aviso("The code has 4 letters or numbers"); return; }
    const r=await be.transaccion(c,s=>{ if(!s) return undefined; if(s.juego!==op.juego) return undefined;
      const js=s.jugadores||{}; if(js[miId]){ js[miId].n=n; return s; } if(s.empezada) return undefined; if(Object.keys(js).length>=s.max) return undefined;
      js[miId]={n, i:Object.keys(js).length, on:true}; s.jugadores=js; return s; });
    if(!r.ok){ const s=await be.leer(c); J.aviso(!s?"There’s no room with that code": s.juego!==op.juego?"That code is for a different game": s.empezada?"That game has already started":"The room is full",3000); return; }
    sala(be,op,c,false); };
}
function lista(s){ return Object.entries(s.jugadores||{}).map(([id,j])=>({id,...j})).sort((a,b)=>a.i-b.i); }
function sala(be,op,c,anfitrion){
  be.presencia(c);
  const url=location.origin+location.pathname+"#sala-"+c;
  J.modal(`<h2>🌐 ${esc(op.titulo)} room</h2><p>Send this code to your friends:</p><div class="on-codigo">${c}</div>
    <div class="centro-txt"><button class="btn sec peq" id="on-copia">📋 Copy link</button> <a class="btn sec peq" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent("Play "+op.titulo+" with me on Ludicopedia! Join here: "+url)}">💬 WhatsApp</a></div>
    <h3>Players (${op.min} to ${op.max})</h3><ul class="on-lista" id="on-lista"></ul><p id="on-msg" style="color:var(--suave)"></p>`,
    anfitrion?[{txt:"▶️ Start game",valor:"go"},{txt:"Leave",cls:"sec",valor:"x"}]:[{txt:"Leave",cls:"sec",valor:"x"}],true)
  .then(async v=>{ if(v==="go"){ const s=await be.leer(c); const js=lista(s);
      if(js.length<op.min){ J.aviso(`You need at least ${op.min} players`); apaga&&apaga(); return sala(be,op,c,true); }
      const estado=op.inicio(js.map(j=>j.n));
      await be.transaccion(c,x=>{ if(!x) return undefined; x.empezada=true; x.estado=JSON.stringify(estado); x.v=1; x.autor=miId; return x; });
    } else if(v==="x"){ apaga&&apaga(); apaga=null; } });
  // el botón Empezar se cierra solo con el modal; si no hay jugadores suficientes se reabre
  J.$("#on-copia").onclick=()=>{ (navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(()=>J.aviso("Link copied")).catch(()=>J.aviso(url,6000)); };
  let empezo=false, ctx=null, ultimaV=0;
  var apaga=be.escuchar(c,s=>{ if(!s) return;
    const js=lista(s); const ul=J.$("#on-lista");
    if(ul&&!empezo) ul.innerHTML=js.map((j,k)=>`<li>${["🔴","🔵","🟢","🟡","🟣","🟠"][k]} <b>${esc(j.n)}</b>${j.id===s.anfitrion?" 👑":""}${j.id===miId?" (you)":""}${j.on===false?'<span class="off">disconnected</span>':""}</li>`).join("");
    const msg=J.$("#on-msg"); if(msg&&!empezo) msg.textContent= anfitrion? (js.length<op.min?`Waiting for players… (minimum ${op.min})`:"When everyone is here, press Start game.") : "Waiting for the host to start the game…";
    if(s.empezada&&s.estado){
      if(!empezo){ empezo=true; J.cerrar(); history.replaceState(null,"",location.pathname+location.search);
        const yo=js.findIndex(j=>j.id===miId);
        ctx={ codigo:c, yo, jugadores:js.map(j=>j.n), online:true,
          enviar(estado){ return be.transaccion(c,x=>{ if(!x) return undefined; x.estado=JSON.stringify(typeof estado==="function"?estado(JSON.parse(x.estado)):estado); x.v=(x.v||0)+1; x.autor=miId; ultimaV=x.v; return x; }).then(r=>r&&r.v&&r.v.estado?JSON.parse(r.v.estado):null); },
          salir(){ apaga&&apaga(); apaga=null; location.href=location.pathname; } };
        barra(ctx); op.alEmpezar(ctx, JSON.parse(s.estado)); ultimaV=s.v; return; }
      if(s.v>ultimaV&&s.autor!==miId){ ultimaV=s.v; op.alCambiar(JSON.parse(s.estado), ctx); } else if(s.v>ultimaV) ultimaV=s.v;
      // desconexiones
      ctx.conectados=js.map(j=>j.on!==false);
    } });
}
function barra(ctx){ const b=J.el("div",{class:"on-barra"}); b.innerHTML=`🌐 Online game · Room <b>${ctx.codigo}</b> · ${ctx.jugadores.map((n,i)=>`<span class="${i===ctx.yo?"yo":""}">${esc(n)}</span>`).join(" ")} <button class="btn sec peq" id="on-salir">Leave</button>`;
  const j=J.$("#juego"); j.parentNode.insertBefore(b,j); const bo=J.$("#b-online"); if(bo) bo.style.display="none"; J.$("#on-salir").onclick=()=>{ J.modal("<h2>Leave the online game?</h2><p>The others won’t be able to keep playing with you.</p>",[{txt:"Leave",valor:1},{txt:"Keep playing",cls:"sec",valor:0}]).then(v=>{ if(v) ctx.salir(); }); }; }

J.online={activar, disponible, miId};
})();
