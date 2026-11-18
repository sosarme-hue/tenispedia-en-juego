/* Texas Hold’em poker with pretend chips */
(function(){
J.paginaJuego({titulo:"Texas Hold’em Poker", emoji:"🃏", ficha:"poker", ins:{
  titulo:"Texas Hold’em Poker",
  intro:"You play against three computer rivals with <b>pretend chips</b>. You all start with 1,000. The winner is whoever ends up with all the chips (or whoever has the most when you decide to stop).",
  pasos:[
    "Each player gets <b>2 hole cards</b> face down. Two players post compulsory bets (blinds) of 10 and 20 so there’s something at stake.",
    "First betting round. On your turn you can: <b>Fold</b> (you drop out of the hand), <b>Check / Call</b> (you put in the same as the highest bet) or <b>Raise</b> (you increase the bet).",
    "<b>3 community cards</b> are dealt in the middle (the flop). Another betting round.",
    "A <b>fourth</b> community card is dealt (the turn) and another round, and then the <b>fifth</b> (the river) and the last round.",
    "If several players are left, the cards are shown. Each one makes the <b>best 5-card hand</b> from their 2 cards and the 5 community cards.",
    "The best hand wins the pot. From highest to lowest: royal flush, straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, pair and high card.",
    "If everyone else folds, you win the pot without showing your cards."
  ],
  consejos:["Don’t play every hand: fold with low, unconnected cards.","High pairs and Ace-King are good starting hands.","The computer sometimes bluffs 😉"]
}});
const css=`
.pk-mesa{position:relative;border-radius:200px;padding:20px 16px;min-height:480px;display:grid;grid-template-rows:auto 1fr auto;gap:10px}
@media(max-width:700px){.pk-mesa{border-radius:40px}}
.pk-rivales{display:flex;justify-content:space-around;gap:6px;flex-wrap:wrap}
.pk-j{text-align:center;color:#fff;padding:8px 10px;border-radius:14px;background:rgba(0,0,0,.25);min-width:120px;border:2px solid transparent;--nw:44px}
.pk-j.turno{border-color:var(--oro)}
.pk-j.fuera{opacity:.4}
.pk-j .cs{display:flex;gap:4px;justify-content:center;margin:6px 0}
.pk-j .acc{font-size:.8rem;color:var(--oro);min-height:1.1em;font-weight:800}
.pk-centro{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
.pk-com{display:flex;gap:6px;--nw:clamp(46px,9vw,70px);min-height:calc(var(--nw)*1.4)}
.pk-bote{background:rgba(0,0,0,.35);color:var(--oro);padding:6px 16px;border-radius:999px;font-family:var(--titulos);font-size:1.2rem}
.pk-yo{display:flex;flex-direction:column;align-items:center;gap:6px;color:#fff}
.pk-yo .cs{display:flex;gap:6px;--nw:clamp(60px,12vw,84px)}
.pk-acc{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px;align-items:center}
.naipe.gana{box-shadow:0 0 0 3px var(--oro),0 0 18px var(--oro)}
`;
document.head.append(J.el("style",{},css));
const NOMBRES=["You","Lola","Paco","Rita"], AV=["🙂","👩‍🦰","🧔","👵"];
const NJ=["High card","Pair","Two pair","Three of a kind","Straight","Flush","Full house","Four of a kind","Straight flush","Royal flush"];
let ON=null, esperaRemoto=null, esperando=-1, resActual=null, ultimo=null, resVisto=0, gen=0;
const escH=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let J4=[], mazo=[], com=[], bote=0, dealer=0, fase=0, apuestaMax=0, turno=0, ciega=20, esperaHumano=null, manoN=0;
const raiz=J.$("#juego");

// ---- Evaluador ----
function eval5(cs){
  const v=cs.map(c=>c.v===1?14:c.v).sort((a,b)=>b-a);
  const color=cs.every(c=>c.p===cs[0].p);
  let esc=0; const u=[...new Set(v)];
  if(u.length===5){ if(u[0]-u[4]===4) esc=u[0]; else if(u.join()==="14,5,4,3,2") esc=5; }
  const cnt={}; v.forEach(x=>cnt[x]=(cnt[x]||0)+1);
  const g=Object.entries(cnt).map(([k,n])=>[n,+k]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
  const kick=g.map(x=>x[1]);
  if(esc&&color) return [esc===14?9:8,esc];
  if(g[0][0]===4) return [7,...kick];
  if(g[0][0]===3&&g[1][0]===2) return [6,...kick];
  if(color) return [5,...v];
  if(esc) return [4,esc];
  if(g[0][0]===3) return [3,...kick];
  if(g[0][0]===2&&g[1][0]===2) return [2,...kick];
  if(g[0][0]===2) return [1,...kick];
  return [0,...v];
}
const cmp=(a,b)=>{ for(let i=0;i<Math.max(a.length,b.length);i++){ const d=(a[i]||0)-(b[i]||0); if(d) return d; } return 0; };
function mejor7(cs){
  let best=null, bestC=null; const n=cs.length;
  const rec=(ini,sel)=>{ if(sel.length===5){ const c=sel.map(i=>cs[i]); const r=eval5(c); if(!best||cmp(r,best)>0){ best=r; bestC=c; } return; } for(let i=ini;i<n;i++) rec(i+1,[...sel,i]); };
  rec(0,[]);
  return {r:best,c:bestC};
}
// fuerza aproximada 0..1
function fuerza(j){
  const [a,b]=j.cartas, va=a.v===1?14:a.v, vb=b.v===1?14:b.v;
  if(!com.length){
    let s=(va+vb)/28; if(va===vb) s+=.35+va/40; if(a.p===b.p) s+=.08; if(Math.abs(va-vb)===1) s+=.05; return Math.min(1,s);
  }
  const r=mejor7([...j.cartas,...com]).r; const base=[.15,.4,.6,.72,.8,.85,.92,.97,.99,1][r[0]];
  return Math.min(1, base + (r[0]===1? (r[1]-2)/60 : 0));
}

function config(){
  raiz.innerHTML=`<div class="panel" style="max-width:520px;margin:0 auto"><h2>🃏 New game</h2>
  <p>Starting chips: 1,000 for each player. Blinds of 10 and 20.</p><button class="btn" id="c-ok">Deal!</button></div>`;
  J.$("#c-ok").onclick=()=>{ J4=NOMBRES.map((n,i)=>({n,av:AV[i],hum:i===0,fichas:1000,cartas:[],apuesta:0,total:0,fuera:false,allin:false,elim:false,acc:""})); dealer=J.azar(4); manoN=0; nuevaMano(); };
}
const activos=()=>J4.filter(j=>!j.elim);
function nuevaMano(){
  manoN++; if(manoN%10===0){ ciega*=2; J.aviso(`The blinds go up to ${ciega/2} and ${ciega}`); }
  J4.forEach(j=>{ j.cartas=[]; j.apuesta=0; j.total=0; j.fuera=j.elim; j.allin=false; j.acc=""; j.mostrar=false; });
  mazo=J.baraja(J.mazo()); com=[]; bote=0; fase=0;
  do{ dealer=(dealer+1)%4; } while(J4[dealer].elim);
  J4.forEach(j=>{ if(!j.elim) j.cartas=[mazo.pop(),mazo.pop()]; });
  const sb=sig(dealer), bb=sig(sb);
  pone(J4[sb],ciega/2); J4[sb].acc=`Blind ${ciega/2}`; pone(J4[bb],ciega); J4[bb].acc=`Ciega ${ciega}`;
  apuestaMax=ciega; turno=sig(bb);
  ronda();
}
function sig(i){ let k=i; do{ k=(k+1)%4; } while(J4[k].elim); return k; }
function pone(j,n){ n=Math.min(n,j.fichas); j.fichas-=n; j.apuesta+=n; j.total+=n; bote+=n; if(j.fichas===0) j.allin=true; }
const enJuego=()=>J4.filter(j=>!j.fuera);
async function ronda(){
  const g=gen;
  const pend=new Set(enJuego().filter(j=>!j.allin));
  while(true){
    if(enJuego().length===1) return finMano();
    if(!pend.size) break;
    const j=J4[turno];
    if(j.fuera||j.allin||!pend.has(j)){ turno=sig(turno); continue; }
    pinta();
    const acc = j.hum ? await humano(j) : j.rem ? await remoto(J4.indexOf(j)) : await cpu(j);
    if(g!==gen) return;
    pend.delete(j);
    if(acc==="sube") enJuego().forEach(o=>{ if(o!==j&&!o.allin) pend.add(o); });
    pinta();
    turno=sig(turno);
  }
  J4.forEach(j=>{ j.apuesta=0; }); apuestaMax=0;
  if(enJuego().filter(j=>!j.allin).length<=1){ // todos all-in: repartir el resto
    while(com.length<5){ com.push(mazo.pop()); pinta(); await J.espera(500); }
    return finMano();
  }
  fase++;
  if(fase===1){ com.push(mazo.pop(),mazo.pop(),mazo.pop()); }
  else if(fase<=3) com.push(mazo.pop());
  else return finMano();
  J4.forEach(j=>{ if(!j.fuera&&!j.allin) j.acc=""; });
  turno=sig(dealer); pinta(); await J.espera(500); if(g!==gen) return;
  ronda();
}
function remoto(k){ return new Promise(res=>{ esperaRemoto={k,res}; pinta(); }); }
function humano(j){
  return new Promise(res=>{ esperaHumano=res; pinta(); });
}
function actua(j,tipo,cant){
  const falta=apuestaMax-j.apuesta;
  if(tipo==="no"){ j.fuera=true; j.acc="Fold"; return "no"; }
  if(tipo==="igual"){ pone(j,falta); j.acc= falta? (j.allin?"All-in":`Calls ${falta}`) : "Check"; return "igual"; }
  if(tipo==="sube"){ const nueva=apuestaMax+cant; const poner=nueva-j.apuesta; pone(j,poner); if(j.apuesta>apuestaMax){ apuestaMax=j.apuesta; j.acc=j.allin?"All-in":`Raises to ${apuestaMax}`; return "sube"; } j.acc=j.allin?"All-in":"Call"; return "igual"; }
}
async function cpu(j){
  await J.espera(700);
  const f=fuerza(j), falta=apuestaMax-j.apuesta, pot=bote+1, coste=falta/(pot+falta);
  const farol=Math.random()<.08;
  let r;
  if(falta===0){ r = (f>.7||farol)&&Math.random()<.7 ? actua(j,"sube",Math.max(ciega,Math.round(bote*.5/10)*10)) : actua(j,"igual"); }
  else if(f<coste*0.9 && !farol && f<.55) r=actua(j,"no");
  else if((f>.82||farol) && Math.random()<.6) r=actua(j,"sube",Math.max(ciega,Math.round(bote*.6/10)*10));
  else r=actua(j,"igual");
  return r;
}
function pinta(){
  const yi=ON?ON.yo:0, yo=J4[yi], falta=apuestaMax-yo.apuesta, vista=ON&&ON.yo!==0;
  const mio = vista ? (esperando===yi && !yo.fuera && !yo.elim) : (esperaHumano && !yo.fuera);
  const mejorYo = yo.cartas.length&&com.length>=3 ? NJ[mejor7([...yo.cartas,...com]).r[0]] : "";
  raiz.innerHTML=`<div class="mesa pk-mesa">
   <div class="pk-rivales">${[1,2,3].map(q=>{ const k=(yi+q)%4, j=J4[k]; return `<div class="pk-j ${turno===k&&!mio?"turno":""} ${j.fuera?"fuera":""}"><div style="font-size:1.6rem">${j.av}</div><b>${j.n}</b><div>${j.elim?"Out":j.fichas+" 🪙"}</div><div class="cs" data-k="${k}"></div><div class="acc">${j.acc}</div></div>`; }).join("")}</div>
   <div class="pk-centro"><div class="pk-com" id="pk-com"></div><div class="pk-bote">Pot: ${bote} 🪙</div><div class="estado" style="color:#fff;margin:0" id="pk-est"></div></div>
   <div class="pk-yo"><div class="cs" id="pk-yo"></div><div><b>${yo.av} You</b> · ${yo.fichas} 🪙 ${yo.apuesta?`· apostado ${yo.apuesta}`:""} ${mejorYo?`· <span style="color:var(--oro)">${mejorYo}</span>`:""}</div><div class="acc" style="color:var(--oro);font-weight:800">${yo.acc}</div></div>
  </div>
  <div class="pk-acc">${mio?`<button class="btn rojo" id="a-no">✋ Fold</button><button class="btn verde" id="a-igual">${falta?`Call ${Math.min(falta,yo.fichas)}`:"Check"}</button>
   <select id="a-cant">${[1,2,3,5,10].map(m=>ciega*m).filter(v=>v<yo.fichas).map(v=>`<option value="${v}">+${v}</option>`).join("")}<option value="${yo.fichas}">All-in (${yo.fichas})</option></select><button class="btn" id="a-sube">⬆️ Raise</button>`:""}</div>`;
  J.$$(".pk-j .cs").forEach(d=>{ const j=J4[+d.dataset.k]; j.cartas.forEach(c=>d.append(J.naipe(c,null,!j.mostrar))); });
  com.forEach(c=>J.$("#pk-com").append(J.naipe(c)));
  yo.cartas.forEach(c=>J.$("#pk-yo").append(J.naipe(c,null,false)));
  J.$("#pk-est").textContent = mio ? "Your turn" : (turno!==yi&&J4[turno]?`${J4[turno].n}’s turn…`:"");
  if(mio){
    const fin=(t,c)=>{ if(vista){ esperando=-1; ON.enviar({...ultimo, accion:{k:yi,tipo:t,cant:c}}); pinta(); return; } const r=esperaHumano; esperaHumano=null; r(actua(yo,t,c)); };
    J.$("#a-no").onclick=()=>fin("no");
    J.$("#a-igual").onclick=()=>fin("igual");
    J.$("#a-sube").onclick=()=>{ const c=+J.$("#a-cant").value; fin("sube", c>=yo.fichas? yo.fichas-(apuestaMax-yo.apuesta) : c); };
  }
  if(ON&&ON.yo===0){ ultimo={J4,com,bote,turno,apuestaMax,ciega,esperando:esperaRemoto?esperaRemoto.k:(esperaHumano?0:-1),res:resActual}; ON.enviar(ultimo); }
}
async function finMano(){
  esperaHumano=null;
  const vivos=enJuego();
  let txt="";
  if(vivos.length===1){ vivos[0].fichas+=bote; txt=`${vivos[0].n} wins ${bote} chips because everyone else folded.`; }
  else {
    while(com.length<5) com.push(mazo.pop());
    vivos.forEach(j=>{ j.mostrar=true; j.mano=mejor7([...j.cartas,...com]); });
    // botes laterales
    const niveles=[...new Set(J4.filter(j=>j.total>0).map(j=>j.total))].sort((a,b)=>a-b);
    let prev=0; const res=[];
    for(const n of niveles){
      const aporte=J4.reduce((s,j)=>s+Math.max(0,Math.min(j.total,n)-prev),0);
      const opt=vivos.filter(j=>j.total>=n);
      if(opt.length){ let best=[opt[0]]; for(const j of opt.slice(1)){ const c=cmp(j.mano.r,best[0].mano.r); if(c>0) best=[j]; else if(c===0) best.push(j); }
        best.forEach(j=>j.fichas+=Math.floor(aporte/best.length)); res.push(...best); }
      prev=n;
    }
    const g=[...new Set(res)];
    txt=g.map(j=>`${j.n} wins with ${NJ[j.mano.r[0]].toLowerCase()}`).join(" · ");
  }
  bote=0; pinta();
  // resaltar cartas ganadoras
  J4.forEach(j=>{ if(j.fichas===0&&!j.elim){ j.elim=true; } });
  const yo=J4[0];
  if(ON){ const tabla=vivos.length>1?`<table class="t">${vivos.map(j=>`<tr><td>${j.av} ${j.n}</td><td>${j.cartas.map(c=>J.nombreValor(c.v)+c.p).join(" ")}</td><td>${NJ[j.mano.r[0]]}</td></tr>`).join("")}</table>`:"";
    const final=activos().length===1;
    resActual={n:manoN, html: final?`<h2>🏆 ${activos()[0].n} wins the game</h2><p>${txt}</p>`:`<h2>End of the hand</h2><p>${txt}</p>${tabla}`}; pinta();
    if(final){ if(!yo.elim) J.confeti(160); await J.modal(resActual.html,[{txt:"New game"}],true); resActual=null; return arrancaOn(); }
    await J.modal(resActual.html+`<p>Your chips: <b>${yo.fichas}</b></p>`,[{txt:"Next hand"}],true); resActual=null; return nuevaMano(); }
  if(yo.elim){ await J.modal(`<h2>😔 You’ve run out of chips</h2><p>${txt}</p>`,[{txt:"New game"}],true); return config(); }
  if(activos().length===1){ J.confeti(160); await J.modal(`<h2>🏆 You won the game!</h2><p>You ended up with all the chips.</p>`,[{txt:"New game"}],true); return config(); }
  const r=await J.modal(`<h2>${txt.startsWith("You")?"🎉 ":""}End of the hand</h2><p>${txt}</p>${vivos.length>1?`<table class="t">${vivos.map(j=>`<tr><td>${j.av} ${j.n}</td><td>${j.cartas.map(c=>J.nombreValor(c.v)+c.p).join(" ")}</td><td>${NJ[j.mano.r[0]]}</td></tr>`).join("")}</table>`:""}<p>Your chips: <b>${yo.fichas}</b></p>`,[{txt:"Stop here",cls:"sec",valor:"p"},{txt:"Next hand",valor:"s"}],true);
  if(r==="p"){ const orden=[...J4].sort((a,b)=>b.fichas-a.fichas); await J.modal(`<h2>🏁 Standings</h2><table class="t">${orden.map((j,i)=>`<tr><td>${i+1}.</td><td>${j.av} ${j.n}</td><td>${j.fichas} 🪙</td></tr>`).join("")}</table>`,[{txt:"New game"}],true); return config(); }
  nuevaMano();
}
function arrancaOn(){ gen++; esperaHumano=null; esperaRemoto=null; resActual=null; ciega=20; manoN=0;
  J4=NOMBRES.map((n,i)=>{ const h=i<ON.jugadores.length; return {n:h?(i===0?escH(ON.jugadores[0]):escH(ON.jugadores[i])):"🤖 "+n, av:AV[i], hum:i===0, rem:h&&i>0, fichas:1000,cartas:[],apuesta:0,total:0,fuera:false,allin:false,elim:false,acc:""}; });
  dealer=J.azar(4); nuevaMano(); }
function carga(e){ if(!e.J4) return; ultimo=e; J4=e.J4; com=e.com; bote=e.bote; turno=e.turno; apuestaMax=e.apuestaMax; ciega=e.ciega; esperando=e.esperando;
  J4.forEach((j,i)=>{ if(i===ON.yo) j.n="You"; }); pinta();
  if(e.res&&e.res.n!==resVisto){ resVisto=e.res.n; J.modal(e.res.html+`<p>Your chips: <b>${J4[ON.yo].fichas}</b></p>`,[{txt:"OK"}]); } }
J.online&&J.online.activar({juego:"poker", titulo:"Four of a kind", min:2, max:4,
  inicio(){ return {inicio:true}; },
  alEmpezar(ctx,e){ ON=ctx; if(ctx.yo===0){ J.aviso("The computer plays the empty seats",3000); arrancaOn(); } else { raiz.innerHTML=`<div class="panel centro-txt">Dealing cards…</div>`; carga(e); } },
  alCambiar(e){ if(ON.yo===0){ if(e.accion&&esperaRemoto&&e.accion.k===esperaRemoto.k){ const {k,res}=esperaRemoto; esperaRemoto=null; res(actua(J4[k],e.accion.tipo,e.accion.cant)); } return; } carga(e); } });
config();
})();
