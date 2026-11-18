/* Colorines — juego de cartas de colores */
(function(){
J.paginaJuego({titulo:"Colors", emoji:"🌈", ficha:"ocho-locos", ins:{
  titulo:"Colors",
  intro:"A colour card game for 4 players: you and three rivals. The winner is the first to <b>run out of cards</b>.",
  pasos:[
    "Each player starts with <b>7 cards</b>. In the middle is the <b>pile</b> with one card face up.",
    "On your turn, play a card that matches the top card of the pile in <b>colour</b> or in <b>number/symbol</b>. The cards you can play light up.",
    "If you don’t have any, tap the <b>deck</b> to draw a card. If the card you draw fits, you can play it; if not, press <b>Pass</b>.",
    "<b>+2</b>: the next player draws 2 cards and loses their turn.",
    "<b>⛔ Skip</b>: the next player loses their turn.",
    "<b>🔄 Reverse</b>: changes the direction of play.",
    "<b>🌈 Wild</b>: can always be played and you choose the next colour. <b>🌈 +4</b>: on top of that, the next player draws 4 cards and loses their turn.",
    "When you are about to be left with <b>just one card</b>, press <b>🔔 Last card!</b> first. If you forget, you draw 2 penalty cards."
  ],
  consejos:["Save your wild cards for when you have no other way out.","If a rival has few cards, hit them with a +2 or a Skip.","Switch to the colour you have most cards of."]
}});
document.head.append(J.el("style",{},`
.co-mesa{display:flex;flex-direction:column;gap:12px;color:#fff}
.co-rivales{display:flex;justify-content:space-around;flex-wrap:wrap;gap:8px}
.co-r{text-align:center;background:rgba(0,0,0,.25);border-radius:14px;padding:8px 12px;min-width:110px;border:2px solid transparent}
.co-r.turno{border-color:var(--oro);box-shadow:0 0 12px var(--oro)}
.co-r .n{font-family:var(--titulos);font-size:1.3rem}
.co-centro{display:flex;justify-content:center;align-items:center;gap:26px}
.co-c{--cw:clamp(56px,11vw,80px);width:var(--cw);height:calc(var(--cw)*1.45);border-radius:calc(var(--cw)*.14);border:4px solid #fff;display:grid;place-items:center;position:relative;font-family:var(--titulos);font-weight:700;color:#fff;box-shadow:0 3px 8px rgba(0,0,0,.4);flex:0 0 auto;user-select:none;text-shadow:0 2px 3px rgba(0,0,0,.35)}
.co-c::before{content:"";position:absolute;width:74%;aspect-ratio:1;left:13%;top:calc(50% - var(--cw)*.37);border-radius:30%;background:rgba(255,255,255,.9);box-shadow:inset 0 0 0 3px rgba(0,0,0,.08)}
.co-c span{position:relative;font-size:calc(var(--cw)*.42);color:var(--col)}
.co-c small{position:absolute;top:4%;left:9%;font-size:calc(var(--cw)*.2)}
.co-c.r{--col:#e63946;background:#e63946}.co-c.a{--col:#1d4ed8;background:#1d4ed8}.co-c.v{--col:#16a34a;background:#16a34a}.co-c.m{--col:#d4a00b;background:#f4c20d}
.co-c.w{--col:#111;background:conic-gradient(#e63946 0 25%,#1d4ed8 0 50%,#16a34a 0 75%,#f4c20d 0)}
.co-c.dorso{background:repeating-linear-gradient(45deg,#2b2d42 0 8px,#1b1c2e 8px 16px)}.co-c.dorso::before{background:conic-gradient(#e63946 0 25%,#1d4ed8 0 50%,#16a34a 0 75%,#f4c20d 0)}
.co-mano{display:flex;justify-content:center;flex-wrap:wrap;gap:6px}
.co-mano .co-c{cursor:pointer;transition:transform .15s;opacity:.55}
.co-mano .co-c.ok{opacity:1}.co-mano .co-c.ok:hover{transform:translateY(-10px)}
.co-puede{box-shadow:0 0 0 3px var(--oro),0 0 16px var(--oro);cursor:pointer}
.co-color{display:inline-block;width:14px;height:14px;border-radius:50%;vertical-align:middle;margin-left:6px;border:2px solid #fff}
.co-elige{display:flex;gap:10px;justify-content:center;margin-top:10px}.co-elige button{width:64px;height:64px;border-radius:50%;border:4px solid #fff;cursor:pointer}
`));
const COL=["r","a","v","m"], NCOL={r:"red",a:"blue",v:"green",m:"yellow"}, HEX={r:"#e63946",a:"#1d4ed8",v:"#16a34a",m:"#f4c20d"};
const NOM=["You","Lucía","Mateo","Sara"], AV=["🙂","👩","🧔","👧"];
let ON=null, yo=0, humanos=[0], gen=0;
const anfitrion=()=>!ON||ON.yo===0, esCPU=j=>!humanos.includes(j), esMio=j=>j===yo||(esCPU(j)&&anfitrion());
const escH=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function nom(j){ if(!ON) return NOM[j]; if(j===yo) return "You"; return j<ON.jugadores.length? escH(ON.jugadores[j]) : ["","🤖 Robi","🤖 Lola","🤖 Tito"][j]; }
let mazo, pila, manos, turno, sentido, color, robada, ultima, fin, gana=[0,0,0,0];
const raiz=J.$("#juego");
function crea(){ const m=[]; for(const c of COL){ m.push({c,v:"0"}); for(let k=0;k<2;k++){ for(let n=1;n<=9;n++) m.push({c,v:String(n)}); m.push({c,v:"+2"},{c,v:"salta"},{c,v:"cambio"}); } }
  for(let k=0;k<4;k++) m.push({c:"w",v:"comodin"},{c:"w",v:"+4"}); return J.baraja(m); }
const SIM={salta:"⛔",cambio:"🔄",comodin:"🌈","+4":"+4","+2":"+2"};
function carta(c,abajo){ const d=J.el("div",{class:"co-c "+(abajo?"dorso":c.c)}); if(!abajo) d.innerHTML=`<small>${SIM[c.v]||c.v}</small><span>${SIM[c.v]||c.v}</span>`; return d; }
const vale=c=> c.c==="w" || c.c===color || c.v===pila[pila.length-1].v;
function roba(j,n){ for(let k=0;k<n;k++){ if(!mazo.length){ const top=pila.pop(); mazo=J.baraja(pila.map(x=>x.c==="w"||x.wild?{c:"w",v:x.v}:x)); pila=[top]; if(!mazo.length) return; } manos[j].push(mazo.pop()); } }
function nueva(){ mazo=crea(); manos=[[],[],[],[]]; for(let j=0;j<4;j++) roba(j,7);
  let p; do{ p=mazo.pop(); if(p.c==="w"||isNaN(+p.v)){ mazo.unshift(p); p=null; } }while(!p);
  pila=[p]; color=p.c; turno=0; sentido=1; robada=null; ultima=false; fin=null; gen++; pinta(); envia(); }
const sig=(j,k=1)=>((j+sentido*k)%4+4)%4;
function pinta(){
  raiz.innerHTML=`<div class="marcador">${[0,1,2,3].map(i=>`<div class="caja"><small>${AV[i]} ${nom(i)}</small><b>${gana[i]} 🏆</b></div>`).join("")}</div>
  <div class="mesa co-mesa"><div class="co-rivales">${[1,2,3].map(k=>(yo+k)%4).map(j=>`<div class="co-r ${turno===j&&!fin?"turno":""}"><div style="font-size:1.6rem">${AV[j]}</div><b>${nom(j)}</b><div class="n">🂠 ${manos[j].length}</div></div>`).join("")}</div>
  <div class="co-centro"><div style="text-align:center"><div id="co-mazo"></div>Deck</div><div style="text-align:center"><div id="co-pila"></div>Colour: <b>${NCOL[color]}</b><span class="co-color" style="background:${HEX[color]}"></span></div><div style="text-align:center;font-size:2rem">${sentido===1?"↻":"↺"}</div></div>
  <div class="estado" id="co-est" style="margin:0"></div><div class="co-mano" id="co-mano"></div>
  <div class="centro-txt"><button class="btn peq" id="co-ult">🔔 Last card!</button> <button class="btn sec peq" id="co-pasa" ${robada?"":"disabled"}>⏭️ Pass</button> <button class="btn sec peq" id="co-nueva">🔄 New round</button></div></div>`;
  const mio=turno===yo&&!fin;
  const dm=carta(null,true); if(mio&&!robada) dm.classList.add("co-puede"); dm.onclick=robar; J.$("#co-mazo").append(dm);
  J.$("#co-pila").append(carta(pila[pila.length-1]));
  manos[yo].sort((a,b)=>(COL.concat("w").indexOf(a.c)-COL.concat("w").indexOf(b.c))||String(a.v).localeCompare(String(b.v)));
  manos[yo].forEach((c,i)=>{ const d=carta(c); const ok=mio&&vale(c)&&(!robada||c===robada); if(ok) d.classList.add("ok"); d.onclick=()=>tirar(i); J.$("#co-mano").append(d); });
  J.$("#co-ult").onclick=()=>{ if(turno===yo&&manos[yo].length===2){ ultima=true; J.aviso("🔔 Last card! You’ve already called it"); } else J.aviso("You can only call it when you have 2 cards left and are about to play one"); };
  J.$("#co-pasa").onclick=()=>{ if(robada&&turno===yo){ robada=null; pasa(1); } };
  J.$("#co-nueva").onclick=()=>{ if(ON&&!anfitrion()) return J.aviso("The new round is started by whoever created the room"); nueva(); };
  J.$("#co-est").textContent = fin || (mio?(robada?"You can play the card you drew or pass":"Your turn: play a highlighted card or draw from the deck"):`${nom(turno)} is playing…`);
}
function robar(){ if(turno!==yo||fin||robada) return; roba(yo,1); const c=manos[yo][manos[yo].length-1];
  if(vale(c)){ robada=c; J.aviso("You drew a card you can play"); pinta(); } else { J.aviso("You drew and can’t play: you pass"); pinta(); setTimeout(()=>pasa(1),700); } }
async function tirar(i){ if(turno!==yo||fin) return; const c=manos[yo][i]; if(!vale(c)||(robada&&c!==robada)) return;
  let col=null; if(c.c==="w"){ col=await eligeColor(); }
  const olvido = manos[yo].length===2&&!ultima;
  manos[yo].splice(i,1); pila.push(c); ultima=false; robada=null;
  if(olvido){ roba(yo,2); J.aviso("You didn’t call your last card! You draw 2 as a penalty",3000); }
  efecto(yo,c,col); }
function eligeColor(){ return new Promise(ok=>{ J.modal(`<h2>🌈 Choose the colour</h2><div class="co-elige">${COL.map(c=>`<button data-c="${c}" style="background:${HEX[c]}" aria-label="${NCOL[c]}"></button>`).join("")}</div>`,[],true);
  J.$$(".co-elige button").forEach(b=>b.onclick=()=>{ J.cerrar(); ok(b.dataset.c); }); }); }
function efecto(j,c,col){ robada=null; color = c.c==="w" ? col : c.c;
  if(!manos[j].length){ fin = j===yo?"You won the round! 🎉":`${nom(j)} has run out of cards and wins the round`; gana[j]++; if(j===yo) J.confeti(); pinta(); if(esMio(j)) envia(); return; }
  if(c.c==="w") J.aviso(`${nom(j)} switches to ${NCOL[col]}`);
  if(c.v==="cambio"){ sentido*=-1; return pasa(1); }
  if(c.v==="salta"){ J.aviso(`${nom(sig(turno))} loses their turn`); return pasa(2); }
  if(c.v==="+2"){ roba(sig(turno),2); J.aviso(`${nom(sig(turno))} draws 2 and loses their turn`); return pasa(2); }
  if(c.v==="+4"){ roba(sig(turno),4); J.aviso(`${nom(sig(turno))} draws 4 and loses their turn`); return pasa(2); }
  pasa(1); }
function pasa(k){ const actor=esMio(turno); turno=sig(turno,k); robada=null; pinta(); if(actor) envia(); lanzaCPU(); }
function lanzaCPU(){ if(fin||turno===yo||!esCPU(turno)||!anfitrion()) return; const g=gen; setTimeout(()=>{ if(g===gen) cpu(); },900); }
function envia(){ gen++; if(ON) ON.enviar({mazo,pila,manos,turno,sentido,color,fin:!!fin,gana}); }
function carga(e){ mazo=e.mazo; pila=e.pila; manos=e.manos; turno=e.turno; sentido=e.sentido; color=e.color; gana=e.gana; robada=null; ultima=false; gen++;
  fin=null; if(e.fin){ const j=manos.findIndex(m=>!m.length); fin= j===yo?"You won the round! 🎉":`${nom(j)} has run out of cards and wins the round`; if(j===yo) J.confeti(); }
  pinta(); lanzaCPU(); }
J.online&&J.online.activar({juego:"colorines", titulo:"Colors", min:2, max:4,
  inicio(){ gana=[0,0,0,0]; nueva(); return {mazo,pila,manos,turno,sentido,color,fin:false,gana}; },
  alEmpezar(ctx,e){ ON=ctx; yo=ctx.yo; humanos=ctx.jugadores.map((_,i)=>i); carga(e); if(ctx.jugadores.length<4) J.aviso("The computer plays the empty seats",3000); },
  alCambiar(e){ carga(e); } });
function cpu(){ if(fin) return; const j=turno, m=manos[j];
  let ops=m.filter(vale);
  if(!ops.length){ roba(j,1); const c=m[m.length-1]; if(!vale(c)){ pinta(); return setTimeout(()=>pasa(1),500); } ops=[c]; }
  const peligro = manos[sig(j)].length<=2;
  const pun=c=> c.c==="w" ? (peligro&&c.v==="+4"?50:-30) : (["+2","salta"].includes(c.v)? (peligro?40:5) : 10) + m.filter(x=>x.c===c.c).length;
  ops.sort((a,b)=>pun(b)-pun(a)); const c=ops[0]; m.splice(m.indexOf(c),1); pila.push(c);
  let col=null; if(c.c==="w"){ const cuenta={}; m.forEach(x=>{ if(x.c!=="w") cuenta[x.c]=(cuenta[x.c]||0)+1; }); col=Object.keys(cuenta).sort((a,b)=>cuenta[b]-cuenta[a])[0]||J.elige(COL); }
  if(m.length===1){ if(Math.random()<.12){ roba(j,2); J.aviso(`${nom(j)} didn’t call their last card! Draws 2`); } else J.aviso(`🔔 ${nom(j)}: Last card!`); }
  efecto(j,c,col); }
nueva();
})();
