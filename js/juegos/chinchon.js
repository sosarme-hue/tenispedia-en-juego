/* Chinchón */
(function(){
J.paginaJuego({titulo:"Chinchón", emoji:"🃏", ficha:"chinchon", ins:{
  titulo:"Chinchón",
  intro:"Played with the <b>40-card Spanish deck</b>. Each player has 7 cards and the aim is to <b>meld</b> them all into combinations and knock before the others.",
  pasos:[
    "Combinations: <b>set</b> (3 or 4 cards of the same rank, like three kings) or <b>run</b> (3 or more consecutive cards of the same suit, like the 5, 6 and 7 of cups). After the 7 come the jack (10), the knight (11) and the king (12).",
    "On your turn you first <b>draw</b>: tap the deck or the top card of the discard pile.",
    "Then you <b>discard</b>: tap one of your cards to throw it away. You always keep 7.",
    "Cards already melded have a green border, and below you can see how many loose points you have left.",
    "You can <b>knock</b> when, after discarding, your loose cards add up to <b>3 points or fewer</b>. Press <b>✂️ Knock</b> and tap the card you are throwing away.",
    "When someone knocks, each player adds up the points of their loose cards: each card is worth its number and the jack, knight and king are worth 10. If you knock with everything melded, you take 10 points off.",
    "If you make a 7-card run of the same suit, you’ve made <b>chinchón!</b> and you win the game outright.",
    "Whoever reaches <b>100 points</b> is eliminated. The last player left wins."
  ],
  consejos:["Get rid of loose face cards early: they’re worth 10 points each.","Watch what your rivals discard to work out what they’re after."]
}});
document.head.append(J.el("style",{},`
.ch-mesa{display:flex;flex-direction:column;gap:12px;color:#fff}
.ch-rivales{display:flex;justify-content:space-around;gap:8px;flex-wrap:wrap}
.ch-r{text-align:center;background:rgba(0,0,0,.25);border-radius:14px;padding:8px 12px;min-width:110px;border:2px solid transparent;--nw:24px}
.ch-r.turno{border-color:var(--oro)}.ch-r.elim{opacity:.35}
.ch-r .cs{display:flex;justify-content:center;margin-top:4px}.ch-r .cs .naipe{margin-left:-12px}
.ch-centro{display:flex;gap:26px;justify-content:center;align-items:center;--nw:clamp(60px,12vw,84px)}
.ch-centro .zona{text-align:center;font-size:.85rem}.ch-centro .naipe{cursor:pointer}
.ch-puede{box-shadow:0 0 0 3px var(--oro),0 0 14px var(--oro)!important}
.ch-mano{display:flex;justify-content:center;flex-wrap:wrap;gap:6px;--nw:clamp(54px,11vw,80px)}
.ch-mano .naipe{cursor:pointer;transition:transform .15s}.ch-mano .naipe:hover{transform:translateY(-8px)}
.ch-mano .naipe.comb{box-shadow:0 0 0 3px #2ed47a,0 3px 8px rgba(0,0,0,.4)}
.ch-mano .naipe.nueva{transform:translateY(-12px)}
.ch-mano .naipe.corta{box-shadow:0 0 0 4px #ff4d6d,0 0 14px #ff4d6d}
`));
const NOM=["You","Rosa","Paco","Elena"], AV=["🙂","👵","👨‍🦰","👩‍🦱"];
const ORD=v=>v<=7?v:v-2, PTS=v=>v>=10?10:v, PAL=["oros","copas","espadas","bastos"];
let me=0;
let jug=[], mazo=[], desc=[], turno=0, fase="robar", nueva=null, modoCorte=false, finM=false, nR=3, finP=null;
const raiz=J.$("#juego");
function esMeld(cs){ if(cs.length<3) return false;
  if(cs.every(c=>c.v===cs[0].v)) return cs.length<=4;
  if(!cs.every(c=>c.p===cs[0].p)) return false;
  const o=cs.map(c=>ORD(c.v)).sort((a,b)=>a-b); for(let i=1;i<o.length;i++) if(o[i]!==o[i-1]+1) return false; return true; }
function analiza(cs){ const n=cs.length, melds=[];
  for(let m=1;m<(1<<n);m++){ let c=0; for(let i=0;i<n;i++) if(m>>i&1) c++; if(c>=3&&esMeld(cs.filter((_,i)=>m>>i&1))) melds.push(m); }
  const memo=new Map();
  const dp=mask=>{ if(!mask) return [0,0]; if(memo.has(mask)) return memo.get(mask);
    let i=0; while(!(mask>>i&1)) i++;
    const r0=dp(mask&~(1<<i)); let best=[PTS(cs[i].v)+r0[0], r0[1]];
    for(const m of melds){ if((m>>i&1)&&(m&mask)===m){ const r=dp(mask&~m); if(r[0]<best[0]) best=[r[0], r[1]|m]; } }
    memo.set(mask,best); return best; };
  const [s,used]=dp((1<<n)-1);
  return {suelto:s, en:new Set([...Array(n).keys()].filter(i=>used>>i&1))}; }
const esChinchon=cs=>cs.length===7&&esMeld(cs);
const puedeCortarTirando=(m,i)=>analiza(m.filter((_,k)=>k!==i)).suelto<=3;
function config(){
  raiz.innerHTML=`<div class="panel" style="max-width:520px;margin:0 auto"><h2>🃏 New game of chinchón</h2>
  <p>Rivals<br><select id="c-n"><option value="1">1 rival</option><option value="2">2 rivals</option><option value="3" selected>3 rivals</option></select></p>
  <button class="btn" id="c-ok">Deal!</button></div>`;
  J.$("#c-ok").onclick=()=>{ nR=+J.$("#c-n").value; jug=NOM.slice(0,nR+1).map((n,i)=>({n,av:AV[i],mano:[],pts:0,elim:false})); turno=0; finP=null; mano(); }; }
function mano(){ mazo=J.baraja(J.mazoEsp()); jug.forEach(j=>{ j.mano=j.elim?[]:mazo.splice(0,7); }); desc=[mazo.pop()]; fase="robar"; nueva=null; finM=false; modoCorte=false;
  while(jug[turno].elim) turno=(turno+1)%jug.length; pinta(); siguiente(); }
function ordena(m){ return [...m].sort((a,b)=>(PAL.indexOf(a.p)-PAL.indexOf(b.p))||(a.v-b.v)); }
function pinta(){
  const yo=jug[me]; yo.mano=ordena(yo.mano); const an=analiza(yo.mano);
  const mio=turno===me&&!finM&&!finP;
  const cortables = mio&&fase==="descartar" ? yo.mano.map((_,i)=>puedeCortarTirando(yo.mano,i)) : [];
  raiz.innerHTML=`<div class="marcador">${jug.map(j=>`<div class="caja"><small>${j.av} ${j.n}</small><b>${j.elim?"Out":j.pts+" pts"}</b></div>`).join("")}</div>
  <div class="mesa ch-mesa"><div class="ch-rivales">${jug.map((_,k)=>(me+k)%jug.length).slice(1).map(k=>{ const j=jug[k]; return `<div class="ch-r ${turno===k?"turno":""} ${j.elim?"elim":""}"><div style="font-size:1.5rem">${j.av}</div><b>${j.n}</b><div class="cs" data-k="${k}"></div></div>`; }).join("")}</div>
  <div class="ch-centro"><div class="zona"><div id="ch-mazo"></div>Deck (${mazo.length})</div><div class="zona"><div id="ch-desc"></div>Discard pile</div></div>
  <div class="estado" id="ch-est" style="margin:0"></div><div class="ch-mano" id="ch-mano"></div>
  <div class="centro-txt">Loose points: <b style="color:${an.suelto?"var(--oro)":"#2ed47a"}">${an.suelto}</b> &nbsp; <button class="btn peq" id="ch-corta" ${cortables.some(Boolean)?"":"disabled"}>✂️ ${modoCorte?"Cancel knock":"Knock"}</button> ${ON?"":`<button class="btn sec peq" id="ch-nueva">🔄 New game</button>`}</div></div>`;
  J.$$(".ch-r .cs").forEach(d=>{ jug[+d.dataset.k].mano.forEach(()=>d.append(J.naipeEsp({p:"oros",v:1},null,true))); });
  const tm=J.naipeEsp({p:"oros",v:1},null,true); if(mio&&fase==="robar") tm.classList.add("ch-puede"); tm.onclick=()=>roba("mazo"); J.$("#ch-mazo").append(tm);
  if(desc.length){ const td=J.naipeEsp(desc[desc.length-1]); if(mio&&fase==="robar") td.classList.add("ch-puede"); td.onclick=()=>roba("desc"); J.$("#ch-desc").append(td); }
  yo.mano.forEach((c,i)=>{ const n=J.naipeEsp(c); if(an.en.has(i)) n.classList.add("comb"); if(c===nueva) n.classList.add("nueva"); if(modoCorte&&cortables[i]) n.classList.add("corta"); n.onclick=()=>descarta(i); J.$("#ch-mano").append(n); });
  J.$("#ch-corta").onclick=()=>{ modoCorte=!modoCorte; pinta(); };
  if(!ON) J.$("#ch-nueva").onclick=config;
  J.$("#ch-est").textContent = finP || (mio ? (fase==="robar"?"Your turn: draw from the deck or the discard pile": modoCorte?"Tap the card you’re throwing away to knock (marked in red)":"Tap a card to discard it") : finM?"End of the hand":`${jug[turno].n} is playing…`);
}
function saca(){ if(!mazo.length){ const top=desc.pop(); mazo=J.baraja(desc); desc=[top]; } return mazo.pop(); }
function roba(de){ if(turno!==me||fase!=="robar"||finM) return; const c= de==="desc"?desc.pop():saca(); jug[me].mano.push(c); nueva=c; fase="descartar";
  if(esChinchon(jug[me].mano.slice(0,7))||jug[me].mano.some((_,i)=>esChinchon(jug[me].mano.filter((_,k)=>k!==i)))) J.aviso("You have chinchón! Throw away the spare card and knock",3000);
  pinta(); }
function descarta(i){ if(turno!==me||fase!=="descartar"||finM) return;
  const m=jug[me].mano;
  if(modoCorte){ if(!puedeCortarTirando(m,i)){ J.aviso("You can’t knock with that card"); return; } desc.push(m.splice(i,1)[0]); nueva=null; return cierra(me); }
  desc.push(m.splice(i,1)[0]); nueva=null; avanza(); }
function avanza(){ fase="robar"; modoCorte=false; do{ turno=(turno+1)%jug.length; }while(jug[turno].elim); pinta(); if(ON) return envia(); siguiente(); }
async function siguiente(){ if(ON||finM||finP||turno===me) return;
  const j=jug[turno]; await J.espera(800);
  const top=desc[desc.length-1];
  const mejor=cs=>Math.min(...cs.map((_,i)=>analiza(cs.filter((_,k)=>k!==i)).suelto));
  const ahora=analiza(j.mano).suelto;
  if(top&&mejor(j.mano.concat([top]))<ahora-1){ j.mano.push(desc.pop()); } else j.mano.push(saca());
  pinta(); await J.espera(600);
  let bi=0,bs=1e9; j.mano.forEach((c,i)=>{ const s=analiza(j.mano.filter((_,k)=>k!==i)).suelto*100-PTS(c.v); if(s<bs){bs=s;bi=i;} });
  desc.push(j.mano.splice(bi,1)[0]);
  const s=analiza(j.mano).suelto;
  if(esChinchon(j.mano)||s===0||(s<=3&&(s<=1||Math.random()<.6))) return cierra(turno);
  avanza(); }
function cierra(q){ finM=true; const res=[]; let chin=-1; const filas=[];
  jug.forEach((j,i)=>{ if(j.elim) return; let p;
    if(i===q){ if(esChinchon(j.mano)){ chin=q; finP=`${i===0?"You made":j.n+" makes"} chinchón! ${i===0?"You win":"Wins"} the game`; p=0; } else { const s=analiza(j.mano).suelto; p=s===0?-10:s; } }
    else p=analiza(j.mano).suelto;
    j.pts+=p; filas.push([i,p]); res.push(`<tr><td>${j.av} ${j.n}${i===q?" ✂️":""}</td><td style="text-align:right">${p>0?"+":""}${p}</td><td style="text-align:right"><b>${j.pts}</b></td></tr>`); });
  jug.forEach(j=>{ if(!j.elim&&j.pts>=100) j.elim=true; });
  const vivos=jug.filter(j=>!j.elim);
  if(!finP){ if(jug[me].elim) finP="You’ve reached 100 points and you’re eliminated"; else if(vivos.length===1) finP="You won the game! 🎉"; }
  if(ON){ pinta(); ultCierre={q,filas,chin,n:Date.now()}; envia(); return muestraCierre(ultCierre); }
  if(finP&&finP.includes("You won")||finP&&finP.includes("You made")) J.confeti();
  pinta();
  J.modal(`<h2>${q===0?"✂️ You knocked":"✂️ Knock by "+jug[q].n}</h2><table style="width:100%">${res.join("")}</table>${finP?`<p><b>${finP}</b></p>`:"<p>Whoever reaches 100 is eliminated.</p>"}`,[{txt:finP?"New game":"Next hand"}]).then(()=>{ if(finP) config(); else { turno=(q+1)%jug.length; mano(); } }); }
let ON=null, ultCierre=null, cierreVisto=0;
const escH=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function envia(){ if(ON) ON.enviar({jug:jug.map(j=>({n:j.nreal||j.n,av:j.av,mano:j.mano,pts:j.pts,elim:j.elim})),mazo,desc,turno,fase,finM,cierre:finM?ultCierre:null}); }
function muestraCierre(c){ cierreVisto=c.n; const vivos=jug.filter(j=>!j.elim);
  let fp=null; if(c.chin>=0) fp= c.chin===me?"You made chinchón! You win the game 🎉":`${jug[c.chin].n} makes chinchón and wins the game!`;
  else if(vivos.length<=1) fp= vivos[0]===jug[me]?"You won the game! 🎉": vivos[0]?`${vivos[0].n} wins the game`:"Game over";
  else if(jug[me].elim) fp="You’ve reached 100 points and you’re eliminated";
  finP= (c.chin>=0||vivos.length<=1)?fp:null; if(fp&&fp.includes("🎉")) J.confeti(); pinta();
  const manda=ON.yo===0;
  J.modal(`<h2>${c.q===me?"✂️ You knocked":"✂️ Knock by "+jug[c.q].n}</h2><table style="width:100%">${c.filas.map(([i,p])=>`<tr><td>${jug[i].av} ${jug[i].n}${i===c.q?" ✂️":""}</td><td style="text-align:right">${p>0?"+":""}${p}</td><td style="text-align:right"><b>${jug[i].pts}</b></td></tr>`).join("")}</table>${fp?`<p><b>${fp}</b></p>`:"<p>Whoever reaches 100 is eliminated.</p>"}${manda?"":`<p style="color:var(--suave)">${escH(ON.jugadores[0])} deals the next hand.</p>`}`,
    [{txt:manda?(finP?"New game":"Next hand"):"OK"}],manda).then(()=>{ if(!manda) return;
      if(finP){ jug.forEach(j=>{ j.pts=0; j.elim=false; }); finP=null; turno=0; } else turno=(c.q+1)%jug.length;
      finM=false; ultCierre=null; mano(); envia(); }); }
function carga(e){ jug=e.jug.map((j,i)=>({...j,n:i===me?"You":escH(j.n),mano:j.mano||[]})); jug.forEach((j,i)=>j.nreal=e.jug[i].n); mazo=e.mazo||[]; desc=e.desc||[]; turno=e.turno; fase=e.fase; finM=e.finM; modoCorte=false; nueva=null;
  if(!e.cierre) finP=null; pinta(); if(e.cierre&&e.cierre.n!==cierreVisto) muestraCierre(e.cierre); else if(!e.cierre) J.cerrar&&J.cerrar(); }
J.online&&J.online.activar({juego:"chinchon", titulo:"Chinchón", min:2, max:4,
  inicio(nombres){ jug=nombres.map((n,i)=>({n,av:AV[i],mano:[],pts:0,elim:false})); turno=0; finP=null; mazo=J.baraja(J.mazoEsp()); jug.forEach(j=>{ j.mano=mazo.splice(0,7); }); desc=[mazo.pop()]; fase="robar"; finM=false;
    return {jug:jug.map(j=>({...j})),mazo,desc,turno:0,fase:"robar",finM:false,cierre:null}; },
  alEmpezar(ctx,e){ ON=ctx; me=ctx.yo; carga(e); },
  alCambiar(e){ carga(e); } });
config();
})();
