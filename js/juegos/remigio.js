/* Remigio — combinaciones de escaleras y grupos */
(function(){
J.paginaJuego({titulo:"Remigio", emoji:"🎴", ficha:"remigio", ins:{
  titulo:"Remigio",
  intro:"Played with two French decks and four jokers. Each player has 7 cards. The aim is to <b>go out</b>: have all 7 cards forming combinations.",
  pasos:[
    "Valid combinations: <b>run</b> (3 or more consecutive cards of the same suit, like 5♥ 6♥ 7♥) or <b>set</b> (3 or more cards of the same rank, like 9♠ 9♦ 9♣).",
    "The <b>joker 🃏</b> stands in for any card. The Ace can go before the 2 or after the K.",
    "On your turn you first <b>draw</b>: tap the deck (face-down card) or the top card of the discard pile.",
    "Then you <b>discard</b>: tap one of your cards to throw it on the discard pile. You always keep 7.",
    "Cards that already form a combination have a green border, and below you can see how many loose points you have left.",
    "If, after discarding, your 7 cards form combinations, <b>you go out and win the hand!</b> It happens automatically.",
    "The others add up the points of their loose cards: 2 to 10 their value, J, Q and K 10, Ace 11 and joker 25.",
    "Whoever reaches <b>100 points</b> is eliminated. The last one left wins (or you, if you eliminate all your rivals)."
  ],
  consejos:["Jokers cost a lot if you’re caught with them: use them early.","Get rid of loose high cards first.","Watch what your rivals discard."]
}});
const css=`
.re-mesa{display:flex;flex-direction:column;gap:14px}
.re-rivales{display:flex;justify-content:space-around;gap:8px;flex-wrap:wrap;color:#fff}
.re-r{text-align:center;background:rgba(0,0,0,.25);border-radius:14px;padding:8px 12px;min-width:110px;border:2px solid transparent;--nw:26px}
.re-r.turno{border-color:var(--oro)} .re-r.elim{opacity:.35}
.re-r .cs{display:flex;justify-content:center;margin-top:4px}.re-r .cs .naipe{margin-left:-14px}
.re-centro{display:flex;gap:26px;justify-content:center;align-items:center;--nw:clamp(62px,12vw,86px)}
.re-centro .zona{text-align:center;color:#fff;font-size:.85rem}
.re-centro .naipe{cursor:pointer}
.re-centro .puede{box-shadow:0 0 0 3px var(--oro),0 0 14px var(--oro)}
.re-mano{display:flex;justify-content:center;flex-wrap:wrap;gap:6px;--nw:clamp(54px,11vw,82px)}
.re-mano .naipe{cursor:pointer;transition:transform .15s}
.re-mano .naipe:hover{transform:translateY(-8px)}
.re-mano .naipe.comb{box-shadow:0 0 0 3px #2ed47a,0 3px 8px rgba(0,0,0,.4)}
.re-mano .naipe.nueva{transform:translateY(-12px)}
.naipe.joker .centro{font-size:calc(var(--nw,72px)*.55)}
`;
document.head.append(J.el("style",{},css));
const NOM=["You","Carmen","Andrés","Julia"], AV=["🙂","👩","👨‍🦳","👧"];
let me=0;
let jug=[], mazo=[], desc=[], turno=0, fase="robar", nueva=null, ordenPalo=false, nR=3, finM=false;
const raiz=J.$("#juego");

const valorP=c=>c.v===0?25:c.v===1?11:Math.min(10,c.v);
function esMeld(cs){
  if(cs.length<3) return false;
  const nat=cs.filter(c=>c.v), k=cs.length-nat.length;
  if(!nat.length) return true;
  if(nat.every(c=>c.v===nat[0].v)) return true;
  if(!nat.every(c=>c.p===nat[0].p)) return false;
  for(const asAlto of [false,true]){
    const vs=nat.map(c=>c.v===1&&asAlto?14:c.v).sort((a,b)=>a-b);
    if(new Set(vs).size!==vs.length) continue;
    const span=vs[vs.length-1]-vs[0]+1;
    if(span<=cs.length && span-nat.length<=k) return true;
  }
  return false;
}
function analiza(cs){ // devuelve {suelto, enMeld:Set de índices}
  const n=cs.length, melds=[];
  for(let m=1;m<(1<<n);m++){ let c=0; for(let i=0;i<n;i++) if(m>>i&1) c++; if(c>=3&&esMeld(cs.filter((_,i)=>m>>i&1))) melds.push(m); }
  const memo=new Map();
  const dp=mask=>{ // mask = cartas disponibles
    if(!mask) return [0,0];
    if(memo.has(mask)) return memo.get(mask);
    let i=0; while(!(mask>>i&1)) i++;
    let best=[valorP(cs[i])+dp(mask&~(1<<i))[0], dp(mask&~(1<<i))[1]];
    for(const m of melds){ if((m>>i&1)&&(m&mask)===m){ const r=dp(mask&~m); if(r[0]<best[0]) best=[r[0], r[1]|m]; } }
    memo.set(mask,best); return best;
  };
  const [s,used]=dp((1<<n)-1);
  return {suelto:s, en:new Set([...Array(n).keys()].filter(i=>used>>i&1))};
}
function naipeR(c,abajo){ if(!abajo&&c.v===0){ const d=J.el("div",{class:"naipe joker"}); d.innerHTML=`<div class="esq" style="color:#7209b7">★</div><div class="centro">🃏</div>`; return d; } return J.naipe(c,null,abajo); }

function config(){
  raiz.innerHTML=`<div class="panel" style="max-width:520px;margin:0 auto"><h2>🎴 New game</h2>
  <p>Rivals<br><select id="c-n"><option value="1">1 rival</option><option value="2">2 rivals</option><option value="3" selected>3 rivals</option></select></p>
  <button class="btn" id="c-ok">Deal!</button></div>`;
  J.$("#c-ok").onclick=()=>{ nR=+J.$("#c-n").value; jug=NOM.slice(0,nR+1).map((n,i)=>({n,av:AV[i],hum:i===0,mano:[],pts:0,elim:false})); turno=0; mano(); };
}
function mano(){
  mazo=J.baraja([...J.mazo(),...J.mazo(),{p:"★",v:0},{p:"★",v:0},{p:"★",v:0},{p:"★",v:0}]);
  jug.forEach(j=>{ j.mano= j.elim?[]:mazo.splice(0,7); });
  desc=[mazo.pop()]; fase="robar"; nueva=null; finM=false;
  while(jug[turno].elim) turno=(turno+1)%jug.length;
  pinta(); siguiente();
}
function ordena(m){ const pal=["♠","♥","♣","♦","★"]; return [...m].sort((a,b)=>ordenPalo? (pal.indexOf(a.p)-pal.indexOf(b.p))||(a.v-b.v) : (a.v-b.v)||(pal.indexOf(a.p)-pal.indexOf(b.p))); }
function pinta(){
  const yo=jug[me]; yo.mano=ordena(yo.mano);
  const an=analiza(yo.mano);
  raiz.innerHTML=`<div class="marcador">${jug.map(j=>`<div class="caja"><small>${j.av} ${j.n}</small><b>${j.elim?"Out":j.pts+" pts"}</b></div>`).join("")}</div>
  <div class="mesa re-mesa"><div class="re-rivales">${jug.map((_,k)=>(me+k)%jug.length).slice(1).map(k=>{ const j=jug[k]; return `<div class="re-r ${turno===k?"turno":""} ${j.elim?"elim":""}"><div style="font-size:1.5rem">${j.av}</div><b>${j.n}</b><div class="cs" data-k="${k}"></div></div>`; }).join("")}</div>
  <div class="re-centro"><div class="zona"><div id="re-mazo"></div>Deck (${mazo.length})</div><div class="zona"><div id="re-desc"></div>Discard pile</div></div>
  <div class="estado" id="re-est" style="color:#fff;margin:0"></div>
  <div class="re-mano" id="re-mano"></div>
  <div class="centro-txt" style="color:#fff">Loose points: <b style="color:${an.suelto?"var(--oro)":"#2ed47a"}">${an.suelto}</b> &nbsp; <button class="btn sec peq" id="re-ord">🔀 Sort by ${ordenPalo?"rank":"suit"}</button></div></div>`;
  J.$$(".re-r .cs").forEach(d=>{ const j=jug[+d.dataset.k]; j.mano.forEach(()=>d.append(J.naipe({p:"♠",v:1},null,true))); });
  const mio=turno===me&&!finM;
  const m=J.el("div",{}); const tm=naipeR({p:"♠",v:1},true); if(mio&&fase==="robar") tm.classList.add("puede"); tm.onclick=()=>roba("mazo"); m.append(tm); J.$("#re-mazo").append(m);
  if(desc.length){ const td=naipeR(desc[desc.length-1]); if(mio&&fase==="robar") td.classList.add("puede"); td.onclick=()=>roba("desc"); J.$("#re-desc").append(td); }
  yo.mano.forEach((c,i)=>{ const n=naipeR(c); if(an.en.has(i)) n.classList.add("comb"); if(c===nueva) n.classList.add("nueva"); n.onclick=()=>descarta(i); J.$("#re-mano").append(n); });
  J.$("#re-ord").onclick=()=>{ ordenPalo=!ordenPalo; pinta(); };
  J.$("#re-est").textContent = mio ? (fase==="robar"?"Your turn: draw from the deck or the discard pile":"Now tap a card to discard it") : `${jug[turno].n} is playing…`;
}
function roba(de){
  if(turno!==me||fase!=="robar"||finM) return;
  const c = de==="desc" ? desc.pop() : saca();
  jug[me].mano.push(c); nueva=c; fase="descartar"; pinta();
}
function saca(){ if(!mazo.length){ const top=desc.pop(); mazo=J.baraja(desc); desc=[top]; } return mazo.pop(); }
function descarta(i){
  if(turno!==me||fase!=="descartar"||finM) return;
  const c=jug[me].mano.splice(i,1)[0]; desc.push(c); nueva=null;
  if(analiza(jug[me].mano).suelto===0) return cierra(me);
  avanza();
}
function avanza(){ fase="robar"; do{ turno=(turno+1)%jug.length; } while(jug[turno].elim); pinta(); if(ON) return envia(); siguiente(); }
async function siguiente(){
  if(ON||finM||turno===me) return;
  const j=jug[turno]; await J.espera(800);
  const top=desc[desc.length-1];
  const mejorTrasCoger = cs => Math.min(...cs.map((_,i)=>analiza(cs.filter((_,k)=>k!==i)).suelto));
  const actual=analiza(j.mano).suelto;
  const conDesc=mejorTrasCoger([...j.mano,top]);
  let c; if(conDesc<actual-3 || conDesc===0){ c=desc.pop(); J.aviso(`${j.n} takes from the discard pile`); } else c=saca();
  j.mano.push(c); pinta(); await J.espera(500);
  let best=0, bv=1e9;
  j.mano.forEach((x,i)=>{ const r=analiza(j.mano.filter((_,k)=>k!==i)).suelto - valorP(x)*0.01; if(r<bv){ bv=r; best=i; } });
  desc.push(j.mano.splice(best,1)[0]);
  if(analiza(j.mano).suelto===0) return cierra(turno);
  avanza();
}
async function cierra(g){
  if(ON) return cierraOn(g);
  finM=true; pinta();
  const filas=jug.map((j,k)=>{ if(j.elim) return ""; const s=k===g?0:analiza(j.mano).suelto; j.pts+=s; return `<tr><td>${j.av} ${j.n}</td><td>${j.mano.map(c=>c.v?J.nombreValor(c.v)+c.p:"🃏").join(" ")}</td><td>+${s}</td><td><b>${j.pts}</b></td></tr>`; }).join("");
  jug.forEach(j=>{ if(!j.elim&&j.pts>=100) j.elim=true; });
  if(g===0) J.confeti();
  await J.modal(`<h2>${g===0?"🎉 You’ve gone out! Remigio!":`🎴 ${jug[g].n} goes out`}</h2><table class="t"><tr><th>Player</th><th>Cards</th><th>Sum</th><th>Total</th></tr>${filas}</table>`,[{txt:"Continue"}],true);
  const vivos=jug.filter(j=>!j.elim);
  if(jug[0].elim){ await J.modal("<h2>😔 You’ve reached 100 points</h2><p>You’re eliminated. Try again!</p>",[{txt:"New game"}],true); return config(); }
  if(vivos.length===1){ J.confeti(160); await J.modal("<h2>🏆 You won the game!</h2><p>All your rivals have reached 100 points.</p>",[{txt:"New game"}],true); return config(); }
  turno=(g+1)%jug.length; mano();
}
let ON=null, ultCierre=null, cierreVisto=0;
const escH=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function envia(){ if(ON) ON.enviar({jug:jug.map(j=>({n:j.nreal||j.n,av:j.av,mano:j.mano,pts:j.pts,elim:j.elim})),mazo,desc,turno,fase,finM,cierre:finM?ultCierre:null}); }
function cierraOn(g){ finM=true; const filas=[];
  jug.forEach((j,k)=>{ if(j.elim) return; const s=k===g?0:analiza(j.mano).suelto; j.pts+=s; filas.push([k,s,j.mano.map(c=>c.v?J.nombreValor(c.v)+c.p:"🃏").join(" ")]); });
  jug.forEach(j=>{ if(!j.elim&&j.pts>=100) j.elim=true; });
  ultCierre={g,filas,n:Date.now()}; pinta(); envia(); muestraCierre(ultCierre); }
function muestraCierre(c){ cierreVisto=c.n; const vivos=jug.filter(j=>!j.elim); if(c.g===me) J.confeti();
  const final=vivos.length<=1; let fp=""; if(final) fp= vivos[0]===jug[me]?"🏆 You won the game!":vivos[0]?`🏁 ${vivos[0].n} wins the game`:"Game over"; else if(jug[me].elim) fp="You’ve reached 100 points and you’re eliminated.";
  const manda=ON.yo===0; pinta();
  J.modal(`<h2>${c.g===me?"🎉 You’ve gone out! Remigio!":`🎴 ${jug[c.g].n} goes out`}</h2><table class="t"><tr><th>Player</th><th>Cards</th><th>Sum</th><th>Total</th></tr>${c.filas.map(([k,s,t])=>`<tr><td>${jug[k].av} ${jug[k].n}</td><td>${t}</td><td>+${s}</td><td><b>${jug[k].pts}</b></td></tr>`).join("")}</table>${fp?`<p><b>${fp}</b></p>`:""}${manda?"":`<p style="color:var(--suave)">${escH(ON.jugadores[0])} deals the next hand.</p>`}`,
    [{txt:manda?(final?"New game":"Next hand"):"OK"}],manda).then(()=>{ if(!manda) return;
      if(final){ jug.forEach(j=>{ j.pts=0; j.elim=false; }); turno=0; } else turno=(c.g+1)%jug.length;
      finM=false; ultCierre=null; mano(); envia(); }); }
function carga(e){ jug=e.jug.map((j,i)=>({...j,nreal:j.n,n:i===me?"You":escH(j.n),hum:i===me,mano:j.mano||[]})); mazo=e.mazo||[]; desc=e.desc||[]; turno=e.turno; fase=e.fase; finM=e.finM; nueva=null;
  pinta(); if(e.cierre&&e.cierre.n!==cierreVisto) muestraCierre(e.cierre); else if(!e.cierre) J.cerrar&&J.cerrar(); }
J.online&&J.online.activar({juego:"remigio", titulo:"Remigio", min:2, max:4,
  inicio(nombres){ const mz=J.baraja([...J.mazo(),...J.mazo(),{p:"★",v:0},{p:"★",v:0},{p:"★",v:0},{p:"★",v:0}]);
    const js=nombres.map((n,i)=>({n,av:AV[i],mano:mz.splice(0,7),pts:0,elim:false})); const d=[mz.pop()]; return {jug:js,mazo:mz,desc:d,turno:0,fase:"robar",finM:false,cierre:null}; },
  alEmpezar(ctx,e){ ON=ctx; me=ctx.yo; carga(e); },
  alCambiar(e){ carga(e); } });
config();
})();
