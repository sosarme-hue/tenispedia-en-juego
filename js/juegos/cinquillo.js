/* Cinquillo */
(function(){
J.paginaJuego({titulo:"Cinquillo", emoji:"5️⃣", ficha:"cinquillo", ins:{
  titulo:"Cinquillo",
  intro:"It’s played with the <b>40-card Spanish deck</b> between 4 players: you and three rivals. Each player has 10 cards. The winner is the first to <b>run out of cards</b>.",
  pasos:[
    "The player with the <b>5 of coins</b>, who plays it in the centre, starts.",
    "On your turn you can play a <b>5 of any suit</b> to open its row, or a card that goes <b>right next to</b> the ones already in its suit: the 4 or the 6, then the 3 or the 7, and so on.",
    "The order is: 1, 2, 3, 4, <b>5</b>, 6, 7, jack, knight and king.",
    "The cards you can play light up. Tap one to play it.",
    "If you don’t have any card you can play, press <b>Pass</b>.",
    "The first player to run out of cards wins the round."
  ],
  consejos:["If you have cards at the ends of a suit (aces and kings), it’s a good idea to open that suit early.","Holding back a 5 or a key card blocks your rivals."]
}});
document.head.append(J.el("style",{},`
.ci-mesa{display:flex;flex-direction:column;gap:12px;color:#fff}
.ci-rivales{display:flex;justify-content:space-around;flex-wrap:wrap;gap:8px}
.ci-r{text-align:center;background:rgba(0,0,0,.25);border-radius:14px;padding:6px 12px;min-width:100px;border:2px solid transparent}.ci-r.turno{border-color:var(--oro)}
.ci-filas{display:flex;flex-direction:column;gap:6px;align-items:center;--nw:clamp(30px,6.4vw,50px)}
.ci-fila{display:grid;grid-template-columns:repeat(10,var(--nw));gap:3px;align-items:center}
.ci-hueco{width:var(--nw);height:calc(var(--nw)*1.4);border-radius:6px;border:1px dashed rgba(255,255,255,.25)}
.ci-mano{display:flex;justify-content:center;flex-wrap:wrap;gap:5px;--nw:clamp(50px,9.5vw,74px)}
.ci-mano .naipe{opacity:.5;transition:transform .15s}.ci-mano .naipe.ok{opacity:1;cursor:pointer;box-shadow:0 0 0 3px var(--oro)}.ci-mano .naipe.ok:hover{transform:translateY(-8px)}
`));
const NOM=["You","Nuria","Javi","Pilar"], AV=["🙂","👩‍🦰","👨","👵"], PAL=["oros","copas","espadas","bastos"], VAL=[1,2,3,4,5,6,7,10,11,12];
const ORD=v=>VAL.indexOf(v);
let ON=null, yo=0, humanos=[0], gen=0;
const anfitrion=()=>!ON||ON.yo===0, esCPU=j=>!humanos.includes(j), esMio=j=>j===yo||(esCPU(j)&&anfitrion());
const escH=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function nom(j){ if(!ON) return NOM[j]; if(j===yo) return "You"; return j<ON.jugadores.length? escH(ON.jugadores[j]) : "🤖 "+NOM[j]; }
let manos, mesa, turno, fin, gana=[0,0,0,0];
const raiz=J.$("#juego");
function nueva(){ const m=J.baraja(J.mazoEsp()); manos=[0,1,2,3].map(k=>m.slice(k*10,k*10+10)); mesa={}; PAL.forEach(p=>mesa[p]=null); fin=null;
  turno=manos.findIndex(h=>h.some(c=>c.p==="oros"&&c.v===5)); gen++; pinta(); if(ON){ envia(); return lanzaCPU(); } if(turno!==yo) setTimeout(cpu,900); }
function vale(c){ const f=mesa[c.p]; if(!mesa.oros) return c.p==="oros"&&c.v===5; if(!f) return c.v===5; return ORD(c.v)===f[0]-1||ORD(c.v)===f[1]+1; }
function pon(j,c){ const f=mesa[c.p], o=ORD(c.v); if(!f) mesa[c.p]=[o,o]; else { f[0]=Math.min(f[0],o); f[1]=Math.max(f[1],o); } manos[j].splice(manos[j].indexOf(c),1); }
function pinta(){
  raiz.innerHTML=`<div class="marcador">${[0,1,2,3].map(i=>`<div class="caja"><small>${AV[i]} ${nom(i)}</small><b>${gana[i]} 🏆</b></div>`).join("")}</div>
  <div class="mesa ci-mesa"><div class="ci-rivales">${[1,2,3].map(k=>(yo+k)%4).map(j=>`<div class="ci-r ${turno===j&&!fin?"turno":""}"><div style="font-size:1.4rem">${AV[j]}</div><b>${nom(j)}</b><div>🂠 ${manos[j].length}</div></div>`).join("")}</div>
  <div class="ci-filas" id="ci-filas"></div><div class="estado" id="ci-est" style="margin:0"></div><div class="ci-mano" id="ci-mano"></div>
  <div class="centro-txt"><button class="btn peq" id="ci-paso">✋ Pass</button> <button class="btn sec peq" id="ci-nueva">🔄 New round</button></div></div>`;
  PAL.forEach(p=>{ const fila=J.el("div",{class:"ci-fila"}); const f=mesa[p];
    VAL.forEach((v,o)=>{ if(f&&o>=f[0]&&o<=f[1]) fila.append(J.naipeEsp({p,v})); else fila.append(J.el("div",{class:"ci-hueco"})); }); J.$("#ci-filas").append(fila); });
  const mio=turno===yo&&!fin;
  manos[yo].sort((a,b)=>(PAL.indexOf(a.p)-PAL.indexOf(b.p))||(a.v-b.v)).forEach(c=>{ const n=J.naipeEsp(c); if(mio&&vale(c)) n.classList.add("ok"); n.onclick=()=>juega(c); J.$("#ci-mano").append(n); });
  const puede=manos[yo].some(vale);
  J.$("#ci-paso").disabled=!mio||puede; J.$("#ci-paso").onclick=()=>{ if(mio&&!puede){ J.aviso("You pass"); pasa(); } };
  J.$("#ci-nueva").onclick=()=>{ if(ON&&!anfitrion()) return J.aviso("The new round is started by whoever created the room"); nueva(); };
  J.$("#ci-est").textContent=fin||(mio?(puede?"Your turn: play a highlighted card":"You can’t play any card: press Pass"):`${nom(turno)} is playing…`); }
function juega(c){ if(fin||turno!==yo||!vale(c)) return; pon(yo,c); tras(yo); }
function tras(j){ if(!manos[j].length){ fin= j===yo?"You’ve run out of cards! You win the round 🎉":`${nom(j)} runs out of cards and wins the round`; gana[j]++; if(j===yo) J.confeti(); pinta(); if(esMio(j)) envia(); return; } pasa(); }
function pasa(){ const actor=esMio(turno); turno=(turno+1)%4; pinta(); if(ON){ if(actor) envia(); return lanzaCPU(); } if(turno!==yo&&!fin) setTimeout(cpu,800); }
function lanzaCPU(){ if(fin||turno===yo||!esCPU(turno)||!anfitrion()) return; const g=gen; setTimeout(()=>{ if(g===gen) cpu(); },800); }
function envia(){ gen++; if(ON) ON.enviar({manos,mesa,turno,gana}); }
function carga(e){ manos=e.manos.map(m=>m||[]); mesa={}; PAL.forEach(p=>mesa[p]=(e.mesa||{})[p]||null); turno=e.turno; gana=e.gana; fin=null; gen++;
  const j=manos.findIndex(m=>!m.length); if(j>=0){ fin= j===yo?"You’ve run out of cards! You win the round 🎉":`${nom(j)} runs out of cards and wins the round`; if(j===yo) J.confeti(); }
  pinta(); lanzaCPU(); }
J.online&&J.online.activar({juego:"cinquillo", titulo:"Cinquillo", min:2, max:4,
  inicio(){ const m=J.baraja(J.mazoEsp()); const ma=[0,1,2,3].map(k=>m.slice(k*10,k*10+10)); const me={}; PAL.forEach(p=>me[p]=null); return {manos:ma,mesa:me,turno:ma.findIndex(h=>h.some(c=>c.p==="oros"&&c.v===5)),gana:[0,0,0,0]}; },
  alEmpezar(ctx,e){ ON=ctx; yo=ctx.yo; humanos=ctx.jugadores.map((_,i)=>i); carga(e); if(ctx.jugadores.length<4) J.aviso("The computer plays the empty seats",3000); },
  alCambiar(e){ carga(e); } });
function cpu(){ if(fin) return; const m=manos[turno]; const ops=m.filter(vale);
  if(!ops.length){ J.aviso(`${nom(turno)} passes`); return pasa(); }
  // prefiere cartas que abren camino a otras suyas del mismo palo
  const valor=c=>{ const o=ORD(c.v); return m.filter(x=>x.p===c.p&&x!==c).reduce((s,x)=>s+(Math.abs(ORD(x.v)-o)<=2?3:1),0) + Math.abs(o-4)*.3; };
  ops.sort((a,b)=>valor(b)-valor(a)); pon(turno,ops[0]); tras(turno); }
nueva();
})();
