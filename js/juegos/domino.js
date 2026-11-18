/* Dominó por parejas (doble seis) */
(function(){
J.paginaJuego({titulo:"Dominoes", emoji:"🁫", ficha:"domino", ins:{
  titulo:"Partnership dominoes",
  intro:"Played with the 28 tiles of a double-six set and four players in two teams. Your partner is the player at the top (North); your rivals are East and West. The first team to reach 100 points wins.",
  pasos:[
    "Each player gets 7 tiles. In the first hand, the player with the <b>double six</b> goes first; in the following ones, whoever won the previous hand.",
    "On your turn, play a tile that has the <b>same number</b> as one of the two ends of the line on the table.",
    "Tap the tile you want to play. If it fits on both ends, you’ll be asked which side to put it on.",
    "The tiles you can play are highlighted. If you don’t have any, press <b>Pass</b>.",
    "The hand ends when someone runs out of tiles (<b>domino</b>) or when nobody can play (<b>block</b>).",
    "The winning team adds up the points of all the tiles left in the four players’ hands. In a block, the team with fewer points in hand wins.",
    "The first team to reach <b>100 points</b> wins the game."
  ],
  consejos:["Play your highest tiles first so you don’t get stuck with them.","Watch which numbers your rival passes on: they don’t have them.","Try not to break the numbers that favour your partner."]
}});
const css=`
.do-mesa{min-height:420px;display:flex;flex-direction:column;gap:12px}
.do-fila{display:flex;flex-wrap:wrap;gap:3px;justify-content:center;align-items:center;min-height:110px;padding:10px;background:rgba(0,0,0,.12);border-radius:14px}
.ficha-d{display:inline-flex;background:#fffdf3;border-radius:7px;box-shadow:0 2px 4px rgba(0,0,0,.45);border:1px solid #bbb;flex:0 0 auto}
.ficha-d.h{flex-direction:row;width:64px;height:32px}
.ficha-d.v{flex-direction:column;width:32px;height:64px}
.ficha-d .mi{flex:1;display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:3px}
.ficha-d.h .mi+.mi{border-left:1.5px solid #888}
.ficha-d.v .mi+.mi{border-top:1.5px solid #888}
.ficha-d i{width:5px;height:5px;border-radius:50%;background:#222;place-self:center}
.ficha-d.grande.v{width:46px;height:92px}.ficha-d.grande i{width:8px;height:8px}
.ficha-d.dorso{background:linear-gradient(135deg,#7209b7,#3a0ca3);border-color:#fff}
.ficha-d.dorso .mi{visibility:hidden}
.ficha-d.juega{cursor:pointer;box-shadow:0 0 0 3px var(--oro),0 6px 12px rgba(0,0,0,.5);transform:translateY(-6px)}
.ficha-d.no{opacity:.55}
.do-mano{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;min-height:100px;align-items:flex-end}
.do-rivales{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#fff;font-weight:800}
.do-rivales .r{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.do-rivales .r.act,.do-n.act{color:var(--oro)}
.do-n{text-align:center;color:#fff;font-weight:800}
`;
document.head.append(J.el("style",{},css));
const PIPS={0:[],1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
const mitad=n=>`<div class="mi">${Array.from({length:9},(_,k)=>`<i style="visibility:${PIPS[n].includes(k)?"visible":"hidden"}"></i>`).join("")}</div>`;
const NOM=["You","East","North","West"];
let manos, fila, turno, pases, puntos=[0,0], primera=true, ganadorMano=0, fin=false;
let ON=null, yo=0, humanos=[0], gen=0;
const raiz=J.$("#juego");
const anfitrion=()=>!ON||ON.yo===0;
const esCPU=p=>!humanos.includes(p);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function nombre(p){ if(p===yo) return "You"; if(!ON) return NOM[p]; return esCPU(p)?`🤖 Partner of ${esc(ON.jugadores[(p+2)%4]||"?")}`:esc(ON.jugadores[p]); }
const rel=k=>(yo+k)%4; // 1 derecha, 2 enfrente, 3 izquierda

function fichaHTML(f,orient,extra=""){ return `<div class="ficha-d ${orient} ${extra}">${mitad(f[0])}${mitad(f[1])}</div>`; }
function reparteManos(){
  const todas=[]; for(let a=0;a<=6;a++) for(let b=a;b<=6;b++) todas.push([a,b]);
  const m=J.baraja(todas); manos=[0,1,2,3].map(k=>m.slice(k*7,k*7+7).sort((x,y)=>(x[0]+x[1])-(y[0]+y[1])));
  fila=[]; pases=0;
  if(primera){ turno=manos.findIndex(h=>h.some(f=>f[0]===6&&f[1]===6)); primera=false; } else turno=ganadorMano;
}
function reparte(){ reparteManos(); gen++; pinta(); envia(); siguiente(); }
const paquete=(res=null)=>({manos,fila,turno,pases,puntos,primera,ganadorMano,fin,res});
function envia(res=null){ if(ON) ON.enviar(paquete(res)); }
const extremos=()=>fila.length?[fila[0][0],fila[fila.length-1][1]]:null;
function opciones(f){
  const e=extremos(); if(!e) return ["d"];
  const o=[]; if(f[0]===e[0]||f[1]===e[0]) o.push("i"); if(f[0]===e[1]||f[1]===e[1]) o.push("d"); return o;
}
function coloca(j,k,lado){
  const f=manos[j].splice(k,1)[0]; const e=extremos();
  if(!e) fila.push([f[0],f[1]]);
  else if(lado==="i") fila.unshift(f[1]===e[0]?[f[0],f[1]]:[f[1],f[0]]);
  else fila.push(f[0]===e[1]?[f[0],f[1]]:[f[1],f[0]]);
  pases=0;
}
function pinta(){
  const nos=yo%2, pa=rel(2), de=rel(1), iz=rel(3);
  raiz.innerHTML=`<div class="marcador"><div class="caja"><small>Us (${ON?"you + "+nombre(pa):"You + North"})</small><b>${puntos[nos]}</b></div><div class="caja"><small>Them (${ON?nombre(de)+" + "+nombre(iz):"East + West"})</small><b>${puntos[1-nos]}</b></div><div class="caja"><small>Game to</small><b>100</b></div></div>
  <div class="mesa do-mesa">
    <div class="do-n ${turno===pa?"act":""}">🤝 ${nombre(pa)} (your partner) · ${manos[pa].length} tiles<div style="display:flex;gap:3px;justify-content:center;margin-top:6px">${manos[pa].map(()=>fichaHTML([0,0],"v","dorso")).join("")}</div></div>
    <div class="do-rivales"><div class="r ${turno===iz?"act":""}">⬅️ ${nombre(iz)} · ${manos[iz].length}</div><div class="r ${turno===de?"act":""}">${nombre(de)} · ${manos[de].length} ➡️</div></div>
    <div class="do-fila" id="fila">${fila.length?fila.map(f=>f[0]===f[1]?fichaHTML(f,"v"):fichaHTML(f,"h")).join(""):`<span style="color:rgba(255,255,255,.6)">The table is empty</span>`}</div>
    <div class="estado" id="do-est" style="color:#fff"></div>
    <div class="do-mano" id="mano"></div>
    <div class="centro-txt"><button class="btn sec peq" id="b-paso">✋ Pass</button></div>
  </div>`;
  const mano=J.$("#mano"), mio=turno===yo&&!fin;
  manos[yo].forEach((f,k)=>{
    const ok=mio&&opciones(f).length;
    const d=J.el("div",{},fichaHTML(f,"v","grande "+(mio?(ok?"juega":"no"):""))).firstChild;
    if(ok) d.onclick=()=>humano(k);
    mano.append(d);
  });
  const b=J.$("#b-paso"); const puede=manos[yo].some(f=>opciones(f).length);
  b.disabled = !(mio && !puede); b.onclick=()=>{ if(turno!==yo) return; pases++; J.aviso("You pass"); avanza(); };
}
function est(t){ const e=J.$("#do-est"); if(e) e.textContent=t; }
async function humano(k){
  if(turno!==yo) return;
  const o=opciones(manos[yo][k]); let lado=o[0];
  if(o.length===2 && extremos()[0]!==extremos()[1]){ lado=await J.modal(`<h2>Which side?</h2><p>Your tile fits on both ends of the line.</p>`,[{txt:`⬅️ Left (${extremos()[0]})`,valor:"i"},{txt:`Right (${extremos()[1]}) ➡️`,valor:"d"}]); }
  if(turno!==yo) return;
  coloca(yo,k,lado); if(compruebaFin(yo)) return; avanza();
}
function avanza(){ if(pases>=4) return cierre(); turno=(turno+1)%4; gen++; pinta(); envia(); siguiente(); }
async function siguiente(){
  if(fin) return;
  if(turno===yo){ const puede=manos[yo].some(f=>opciones(f).length); est(puede?"Your turn: tap a highlighted tile":"You have no tile: press Pass"); return; }
  if(!esCPU(turno)||!anfitrion()){ est(`${nombre(turno)}’s turn…`); return; }
  est(`${nombre(turno)} is playing…`);
  const g=gen; await J.espera(900); if(g!==gen||fin) return;
  const h=manos[turno]; const jug=h.map((f,k)=>[f,k,opciones(f)]).filter(x=>x[2].length);
  if(!jug.length){ pases++; J.aviso(`${nombre(turno)} passes`); return avanza(); }
  // estrategia: preferir dobles y fichas de más puntos
  jug.sort((a,b)=>((b[0][0]===b[0][1])*6+b[0][0]+b[0][1])-((a[0][0]===a[0][1])*6+a[0][0]+a[0][1]));
  const [f,k,o]=jug[0]; coloca(turno,k,J.elige(o));
  if(compruebaFin(turno)) return; avanza();
}
const sumaMano=j=>manos[j].reduce((s,f)=>s+f[0]+f[1],0);
function compruebaFin(j){
  if(manos[j].length) return false;
  const p=[0,1,2,3].reduce((s,k)=>s+sumaMano(k),0);
  finMano({eq:j%2, tipo:"d", j, p}); return true;
}
function cierre(){
  const a=sumaMano(0)+sumaMano(2), b=sumaMano(1)+sumaMano(3);
  finMano({eq:a<=b?0:1, tipo:"c", a, b, p:a+b});
}
function finMano(r){
  puntos[r.eq]+=r.p; ganadorMano=r.eq; r.finP=puntos[r.eq]>=100;
  if(r.finP) fin=true;
  gen++; pinta(); envia(r); resultado(r);
}
function resultado(r){
  const nos=yo%2, gana=r.eq===nos;
  const txt= r.tipo==="d" ? `${nombre(r.j)} ${r.j===yo?"have":"has"} gone out.` : `Blocked! Nobody can play. Us ${nos?r.b:r.a} points in hand, them ${nos?r.a:r.b}.`;
  if(r.finP&&gana) J.confeti(150);
  const manda=anfitrion();
  const quien=ON&&!manda?`<p style="color:var(--suave)">${esc(ON.jugadores[0])} deals the next hand.</p>`:"";
  J.modal(`<h2>${gana?"🎉 Your team wins the hand!":"😬 The rivals win the hand"}</h2><p>${txt} <b>${r.p}</b> points are added.</p><p>Score: Us ${puntos[nos]} · Them ${puntos[1-nos]}</p>${r.finP?`<h3>${gana?"🏆 Your team has won the game!":"The rivals win the game."}</h3>`:""}${quien}`,
    [{txt:manda?(r.finP?"New game":"Next hand"):"OK"}],manda).then(()=>{ if(!manda) return; if(r.finP){ puntos=[0,0]; primera=true; fin=false; } reparte(); });
}
function carga(e){ manos=e.manos; fila=e.fila; turno=e.turno; pases=e.pases; puntos=e.puntos; primera=e.primera; ganadorMano=e.ganadorMano; fin=e.fin; gen++;
  pinta(); if(e.res) resultado(e.res); else { J.cerrar&&J.cerrar(); siguiente(); } }
J.online&&J.online.activar({juego:"domino", titulo:"Dominoes", min:2, max:4,
  inicio(nombres){ puntos=[0,0]; primera=true; fin=false; reparteManos(); return paquete(); },
  alEmpezar(ctx,e){ ON=ctx; yo=ctx.yo; humanos=ctx.jugadores.map((_,i)=>i); carga(e);
    J.aviso(ctx.jugadores.length===2?"You play against each other, each with a computer partner":`Your partner is ${nombre(rel(2))}`,3500); },
  alCambiar(e){ carga(e); }
});
reparte();
})();
