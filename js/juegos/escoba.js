/* Escoba del 15 */
(function(){
J.paginaJuego({titulo:"Escoba", emoji:"🧹", ficha:"escoba", ins:{
  titulo:"Escoba",
  intro:"Spain’s most popular adding card game, played with the <b>40-card Spanish deck</b>. The aim is to take cards from the table by making <b>15</b>. The first to reach <b>15 points</b> wins.",
  pasos:[
    "Values: Ace to 7 are worth their number, the <b>Jack 8</b>, the <b>Knight 9</b> and the <b>King 10</b>.",
    "Each player is dealt 3 cards and 4 are placed face up on the table. When you both run out of cards, another 3 are dealt, until the deck is finished.",
    "On your turn you play a card. If that card plus one or more cards on the table add up to <b>exactly 15</b>, you take them: first tap the cards on the table and then the card in your hand.",
    "If you don’t want to or can’t take anything, just tap the card in your hand and it stays on the table.",
    "If taking cards leaves the table empty, you score an <b>escoba</b> (a sweep): it’s worth one point.",
    "At the end of the round, any cards left on the table go to the last player who took something. Points are counted: 1 for each escoba, 1 for having most cards, 1 for most coins, 1 for the <b>seven of coins</b> (the “velo”) and 1 for having most sevens."
  ],
  consejos:["Don’t leave a total between 5 and 14 on the table: your rival can make 15 and score an escoba.","Sevens are worth a lot: try to take them.","Count the cards that have been played to work out what your rival might have left."]
}});
document.head.append(J.el("style",{},`
.es-mesa{display:flex;flex-direction:column;gap:12px;color:#fff;--nw:clamp(58px,11vw,84px)}
.es-fila{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;align-items:center;min-height:calc(var(--nw)*1.45)}
.es-fila .naipe{transition:transform .15s}
.es-centro .naipe{cursor:pointer}.es-centro .naipe.sel{transform:translateY(-10px);box-shadow:0 0 0 4px var(--oro),0 6px 14px rgba(0,0,0,.4)}
.es-mano .naipe{cursor:pointer}.es-mano .naipe:hover{transform:translateY(-8px)}
.es-pista{box-shadow:0 0 0 4px #4cc9f0!important}
.es-info{display:flex;justify-content:space-between;gap:8px;font-size:.85rem;flex-wrap:wrap}
`));
const VAL=c=>c.v<=7?c.v:c.v-2; // sota 8, caballo 9, rey 10
const raiz=J.$("#juego");
let S, ON=null, me=0, sel=new Set(), gen=0, ocupado=false, resVisto=0, pista=null;
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nm=j=>j===me?"You":ON?esc(ON.jugadores[j]):"The computer";
const OBJ=15;
function reparteRonda(st){ st.mazo=J.baraja(J.mazoEsp()); st.manos=[st.mazo.splice(0,3),st.mazo.splice(0,3)]; st.mesa=st.mazo.splice(0,4);
  st.bazas=[[],[]]; st.escobas=[0,0]; st.ult=st.reparte; st.turno=1-st.reparte; st.res=null; st.aviso="";
  const s=st.mesa.reduce((a,c)=>a+VAL(c),0); if(s===15||s===30){ st.bazas[st.reparte].push(...st.mesa); st.escobas[st.reparte]+=s/15; st.mesa=[]; st.aviso=`${s===30?"Two escobas":"Escoba"} on the deal for ${"@"+st.reparte}`; }
  return st; }
function nuevo(rep){ return reparteRonda({puntos:[0,0],reparte:rep,fin:-1}); }
function combos(mesa,v){ const r=[]; const n=mesa.length; for(let m=1;m<(1<<n);m++){ let s=v; const idx=[]; for(let i=0;i<n;i++) if(m>>i&1){ s+=VAL(mesa[i]); idx.push(i); } if(s===OBJ) r.push(idx); } return r; }
function juega(st,s,h,idx){ // idx: índices de la mesa que se lleva (puede ser vacío)
  const c=st.manos[s].splice(h,1)[0]; let ev="";
  if(idx.length){ const lleva=st.mesa.filter((_,i)=>idx.includes(i)); st.mesa=st.mesa.filter((_,i)=>!idx.includes(i)); st.bazas[s].push(c,...lleva); st.ult=s;
    if(!st.mesa.length){ st.escobas[s]++; ev="escoba"; } else ev="lleva"; }
  else st.mesa.push(c);
  st.turno=1-s;
  if(!st.manos[0].length&&!st.manos[1].length){
    if(st.mazo.length){ st.manos=[st.mazo.splice(0,3),st.mazo.splice(0,3)]; }
    else { if(st.mesa.length){ st.bazas[st.ult].push(...st.mesa); st.mesa=[]; } puntua(st); } }
  return ev; }
function puntua(st){ const f=[[],[]]; const b=st.bazas; const pts=[0,0];
  const da=(k,txt,a,bb)=>{ if(a>bb){ pts[0]++; f[0].push(txt); } else if(bb>a){ pts[1]++; f[1].push(txt); } };
  [0,1].forEach(s=>{ if(st.escobas[s]){ pts[s]+=st.escobas[s]; f[s].push(st.escobas[s]+(st.escobas[s]>1?" escobas":" escoba")); } });
  da(0,"most cards",b[0].length,b[1].length);
  da(0,"most coins",b[0].filter(c=>c.p==="oros").length,b[1].filter(c=>c.p==="oros").length);
  [0,1].forEach(s=>{ if(b[s].some(c=>c.p==="oros"&&c.v===7)){ pts[s]++; f[s].push("seven of coins"); } });
  da(0,"most sevens",b[0].filter(c=>c.v===7).length,b[1].filter(c=>c.v===7).length);
  st.puntos=[st.puntos[0]+pts[0],st.puntos[1]+pts[1]];
  if(Math.max(...st.puntos)>=OBJ&&st.puntos[0]!==st.puntos[1]) st.fin=st.puntos[0]>st.puntos[1]?0:1;
  st.res={pts,f,cartas:[b[0].length,b[1].length],n:Date.now()+Math.random()}; }
function eligeCPU(st,s){ const mano=st.manos[s]; let best=-1e9, mv=null;
  const oponeEsc=mesa=>{ const t=mesa.reduce((a,c)=>a+VAL(c),0); return t>=5&&t<=14; };
  mano.forEach((c,h)=>{ combos(st.mesa,VAL(c)).forEach(idx=>{ const lleva=[c,...idx.map(i=>st.mesa[i])]; const resto=st.mesa.filter((_,i)=>!idx.includes(i));
      let v=10+lleva.length*2+lleva.filter(x=>x.p==="oros").length*3+lleva.filter(x=>x.v===7).length*6+(lleva.some(x=>x.p==="oros"&&x.v===7)?25:0);
      if(!resto.length) v+=100; else if(oponeEsc(resto)) v-=30;
      if(v>best){ best=v; mv={h,idx}; } });
    const resto=[...st.mesa,c]; let v=-(c.v===7?14:0)-(c.p==="oros"?4:0)-VAL(c)*.3; if(oponeEsc(resto)) v-=40;
    if(v>best){ best=v; mv={h,idx:[]}; } });
  return mv; }

raiz.innerHTML=`<div id="es"></div>`;
function nueva(){ S=nuevo(ON?J.azar(2):1); gen++; ocupado=false; sel.clear(); pista=null; resVisto=0; pinta(); if(S.aviso) J.aviso(txtAviso(S.aviso),3000); envia(); siguiente(); }
function envia(){ if(ON) ON.enviar(S); }
function txtAviso(t){ return t.replace(/@(\d)/,(_,k)=>+k===me?"ti":nm(+k)); }
function pinta(){
  const z=J.$("#es"); const mio=S.turno===me&&S.fin<0&&!S.res&&!ocupado;
  z.innerHTML=`<div class="marcador" style="justify-content:center"><div class="caja"><small>🙂 Your points</small><b>${S.puntos[me]}</b></div><div class="caja"><small>${ON?"🎴 "+nm(1-me):"🤖 Computer"}</small><b>${S.puntos[1-me]}</b></div><div class="caja"><small>Playing to</small><b>${OBJ}</b></div></div>
  <div class="mesa es-mesa"><div class="es-info"><span>${nm(1-me)}: ${S.bazas[1-me].length} cards · 🧹 ${S.escobas[1-me]}</span><span>Deck: ${S.mazo.length}</span></div>
  <div class="es-fila" id="es-riv"></div><div class="es-fila es-centro" id="es-mesa"></div>
  <div class="estado" id="es-est" style="margin:0"></div><div class="es-fila es-mano" id="es-mano"></div>
  <div class="es-info"><span>You: ${S.bazas[me].length} cards · 🧹 ${S.escobas[me]}</span><span><button class="btn sec peq" id="es-pista">💡 Hint</button> ${ON?"":`<button class="btn sec peq" id="es-nueva">🔄 New</button>`}</span></div></div>`;
  S.manos[1-me].forEach(()=>J.$("#es-riv").append(J.naipeEsp(null,null,true)));
  S.mesa.forEach((c,i)=>{ const n=J.naipeEsp(c); if(sel.has(i)) n.classList.add("sel"); if(pista&&pista.idx.includes(i)) n.classList.add("es-pista"); n.onclick=()=>{ if(!mio) return; sel.has(i)?sel.delete(i):sel.add(i); pista=null; pinta(); }; J.$("#es-mesa").append(n); });
  if(!S.mesa.length) J.$("#es-mesa").innerHTML=`<span style="opacity:.7">Empty table</span>`;
  S.manos[me].forEach((c,h)=>{ const n=J.naipeEsp(c); if(pista&&pista.h===h) n.classList.add("es-pista"); n.onclick=()=>tiro(h); J.$("#es-mano").append(n); });
  J.$("#es-pista").onclick=()=>{ if(!mio) return; const m=eligeCPU(S,me); pista=m; sel.clear(); pinta(); J.aviso(m&&m.idx.length?"You can take the highlighted cards":"There’s nothing good to take: play the highlighted card"); };
  if(!ON) J.$("#es-nueva").onclick=nueva;
  const sumaSel=[...sel].reduce((a,i)=>a+VAL(S.mesa[i]),0);
  let e; if(S.fin>=0) e= S.fin===me?"🏆 You won the game!":`${nm(S.fin)} wins the game`;
  else if(S.res) e="End of the round";
  else if(S.turno===me) e= sel.size?`Selected: ${sumaSel}. You need a card worth ${OBJ-sumaSel}`:"Your turn: choose cards from the table and then your card";
  else e= ON?`${nm(S.turno)} is playing…`:"The computer is playing…";
  J.$("#es-est").textContent=e;
}
function tiro(h){ if(S.turno!==me||S.fin>=0||S.res||ocupado) return; const c=S.manos[me][h]; const idx=[...sel];
  if(idx.length){ const s=idx.reduce((a,i)=>a+VAL(S.mesa[i]),0)+VAL(c); if(s!==OBJ) return J.aviso(`That adds up to ${s}, not 15`); }
  const ev=juega(S,me,h,idx); sel.clear(); pista=null; if(ev==="escoba"){ J.aviso("🧹 Escoba!"); J.confeti(40); } tras(); }
function tras(){ pinta(); envia(); if(S.res) return muestraRes(S.res); siguiente(); }
async function siguiente(){ if(ON||S.fin>=0||S.res||S.turno===me) return; const g=gen; ocupado=true; pinta(); await J.espera(900); if(g!==gen) return;
  const m=eligeCPU(S,1); const c=S.manos[1][m.h];
  if(m.idx.length){ sel=new Set(m.idx); ocupado=true; pinta(); await J.espera(700); if(g!==gen) return; sel.clear(); }
  const ev=juega(S,1,m.h,m.idx); ocupado=false; J.aviso(ev==="escoba"?"🧹 Escoba by the computer!":ev?`The computer takes cards with the ${J.nombreEsp(c)}`:`The computer plays the ${J.nombreEsp(c)}`); tras(); }
function muestraRes(r){ if(r.n===resVisto) return; resVisto=r.n;
  const manda=!ON||ON.yo===0; const fila=s=>`<tr><td>${s===me?"You":nm(s)}</td><td>${((r.f&&r.f[s])||[]).join(", ")||"—"}</td><td>+${r.pts[s]}</td><td><b>${S.puntos[s]}</b></td></tr>`;
  let fp=""; if(S.fin>=0){ fp= S.fin===me?"🏆 You won the game!":`${nm(S.fin)} wins the game`; if(S.fin===me) J.confeti(); }
  J.modal(`<h2>🧹 End of the round</h2><p>Cards: you ${r.cartas[me]}, ${nm(1-me)} ${r.cartas[1-me]}.</p><table class="t" style="width:100%"><tr><th></th><th>Round points</th><th></th><th>Total</th></tr>${fila(me)}${fila(1-me)}</table>${fp?`<p><b>${fp}</b></p>`:""}${manda?"":`<p style="color:var(--suave)">${esc(ON.jugadores[0])} deals the next round.</p>`}`,
    [{txt:manda?(S.fin>=0?"New game":"Next round"):"OK"}],manda).then(()=>{ if(!manda) return;
      if(S.fin>=0){ S=nuevo(ON?J.azar(2):1); } else { S.reparte=1-S.reparte; reparteRonda(S); }
      gen++; sel.clear(); pista=null; pinta(); if(S.aviso) J.aviso(txtAviso(S.aviso),3000); envia(); siguiente(); }); }
function carga(e){ S={...e, mazo:e.mazo||[], mesa:e.mesa||[], manos:[(e.manos&&e.manos[0])||[],(e.manos&&e.manos[1])||[]], bazas:[(e.bazas&&e.bazas[0])||[],(e.bazas&&e.bazas[1])||[]], res:e.res||null};
  gen++; ocupado=false; sel.clear(); pista=null; pinta(); if(S.res) muestraRes(S.res); else if(S.aviso&&!S.mesa.length&&S.mazo.length===30) J.aviso(txtAviso(S.aviso),3000); }
J.online&&J.online.activar({juego:"escoba", titulo:"Escoba", min:2, max:2,
  inicio(){ return nuevo(J.azar(2)); },
  alEmpezar(ctx,e){ ON=ctx; me=ctx.yo; carga(e); J.aviso(e.turno===me?"You go first":"First to play: "+ctx.jugadores[e.turno],2500); },
  alCambiar(e){ carga(e); } });
nueva();
})();
