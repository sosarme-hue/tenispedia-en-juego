/* Hundir la flota */
(function(){
J.paginaJuego({titulo:"Battleship", emoji:"🚢", ficha:"hundir-la-flota", ins:{
  titulo:"Battleship",
  intro:"Each player has a 10×10 sea with their fleet hidden in it. The first to sink all the other player’s ships wins.",
  pasos:[
    "Your fleet: 1 aircraft carrier (5 squares), 1 battleship (4), 2 cruisers (3), 1 destroyer (2).",
    "First <b>place your ships</b>: tap a square in your sea to place the ship shown. Use the <b>↻ Rotate</b> button to switch between horizontal and vertical. You can also press <b>🎲 Place randomly</b>.",
    "Ships can’t touch each other or go off the sea.",
    "Then tap a square in the <b>enemy sea</b> to fire.",
    "💧 <b>Miss</b>: there was nothing there. 💥 <b>Hit</b>: you hit a ship and <b>fire again</b>. 🔥 <b>Sunk</b>: you have hit every one of its squares.",
    "Then the computer fires at your sea. The first to sink the whole enemy fleet wins."
  ],
  consejos:["When you hit a ship, try the squares around it to find out which way it runs.","Since ships don’t touch, there is always water around a sunk ship."]
}});
document.head.append(J.el("style",{},`
.hf{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:900px;margin:0 auto}
.hf h3{text-align:center;margin:.2em 0}
.mar{display:grid;grid-template-columns:repeat(10,1fr);gap:2px;background:#0a2a5c;padding:6px;border-radius:12px;box-shadow:var(--sombra)}
.mar div{aspect-ratio:1;background:linear-gradient(135deg,#1e6fd9,#1557b0);border-radius:3px;display:grid;place-items:center;font-size:clamp(.7rem,2.4vw,1.1rem);min-width:0;cursor:pointer;user-select:none}
.mar .barco{background:linear-gradient(135deg,#9aa5b1,#6b7785)}
.mar .agua{background:#0d3f86}.mar .agua::after{content:"•";color:#7fb3ff}
.mar .toc{background:#f4a261}.mar .hun{background:#c1121f}
.mar .prev{background:rgba(46,212,122,.7)}.mar .mal{background:rgba(230,57,70,.7)}
.mar.inactivo div{cursor:default}
`));
const raiz=J.$("#juego"), FLOTA=[5,4,3,3,2], NOMB={5:"aircraft carrier",4:"battleship",3:"cruiser",2:"destroyer"};
let ON=null, me=0, ultE=null;
let yo, el, fase, horiz=true, colocar=0, turno, cpuPend=[], fin;
function marVacio(){ return {c:Array(100).fill(0), barcos:[], tiros:Array(100).fill(0)}; } // c: id barco+1
function cabe(m,i,l,h){ const f=Math.floor(i/10),c=i%10; if(h?c+l>10:f+l>10) return null; const cs=[];
  for(let k=0;k<l;k++) cs.push(h?i+k:i+10*k);
  for(const x of cs){ const xf=Math.floor(x/10),xc=x%10; for(let df=-1;df<=1;df++) for(let dc=-1;dc<=1;dc++){ const y=xf+df,z=xc+dc; if(y>=0&&y<10&&z>=0&&z<10&&m.c[y*10+z]) return null; } }
  return cs; }
function pon(m,cs){ m.barcos.push({cs,toc:0}); cs.forEach(x=>m.c[x]=m.barcos.length); }
function azar(m){ for(const l of FLOTA){ let cs; do{ cs=cabe(m,J.azar(100),l,Math.random()<.5); }while(!cs); pon(m,cs); } }
function nueva(){ yo=marVacio(); el=marVacio(); azar(el); fase="colocar"; colocar=0; turno=0; cpuPend=[]; fin=null; pinta(); }
function pinta(){
  raiz.innerHTML=`<div class="centro-txt" style="margin-bottom:8px">${fase==="colocar"?`<button class="btn sec peq" id="hf-gira">↻ Rotate (${horiz?"horizontal":"vertical"})</button> <button class="btn sec peq" id="hf-az">🎲 Place randomly</button> `:""}${ON?"":`<button class="btn peq" id="hf-nueva">🔄 New game</button>`}</div>
  <div class="estado" id="hf-est"></div>
  <div class="hf"><div><h3>🛡️ Your sea</h3><div class="mar ${fase==="colocar"?"":"inactivo"}" id="m-yo"></div></div><div><h3>🎯 Enemy sea</h3><div class="mar ${fase==="jugar"&&turno===me&&!fin?"":"inactivo"}" id="m-el"></div></div></div>`;
  if(!ON) J.$("#hf-nueva").onclick=nueva;
  if(fase==="colocar"){ J.$("#hf-gira").onclick=()=>{horiz=!horiz;pinta();}; J.$("#hf-az").onclick=()=>{ yo=marVacio(); azar(yo); if(ON) return listo(); fase="jugar"; pinta(); }; }
  const my=J.$("#m-yo");
  yo.c.forEach((v,i)=>{ const d=J.el("div"); const t=yo.tiros[i];
    if(t) d.className = !v?"agua": yo.barcos[v-1].toc===yo.barcos[v-1].cs.length?"hun":"toc"; else if(v) d.className="barco";
    if(t&&v) d.textContent = yo.barcos[v-1].toc===yo.barcos[v-1].cs.length?"🔥":"💥";
    if(fase==="colocar"){ d.onmouseenter=()=>previa(i); d.onclick=()=>coloca(i); }
    my.append(d); });
  const mEl=J.$("#m-el");
  el.c.forEach((v,i)=>{ const d=J.el("div"); const t=el.tiros[i];
    if(t){ if(!v) d.className="agua"; else { const b=el.barcos[v-1]; const h=b.toc===b.cs.length; d.className=h?"hun":"toc"; d.textContent=h?"🔥":"💥"; } }
    else if(fin&&v) d.className="barco";
    d.onclick=()=>dispara(i); mEl.append(d); });
  const quedan=m=>m.barcos.filter(b=>b.toc<b.cs.length).length;
  J.$("#hf-est").textContent = fin || (fase==="colocar"?`Place your ${NOMB[FLOTA[colocar]]} (${FLOTA[colocar]} squares)`: fase==="esperar"?`Waiting for ${ON.jugadores[1-me]} to place their fleet…`: turno===me?`Your turn to fire · Enemy ships afloat: ${quedan(el)}`: ON?`${ON.jugadores[1-me]} is firing…`:"The computer is firing…");
}
function previa(i){ const cs=cabe(yo,i,FLOTA[colocar],horiz); const ds=J.$$("#m-yo div"); ds.forEach(d=>d.classList.remove("prev","mal"));
  if(cs) cs.forEach(x=>ds[x].classList.add("prev")); else ds[i].classList.add("mal"); }
function coloca(i){ const cs=cabe(yo,i,FLOTA[colocar],horiz); if(!cs){ J.aviso("It doesn’t fit there: it can’t touch another ship or go off the sea"); return; }
  pon(yo,cs); colocar++; if(colocar===FLOTA.length&&ON) return listo(); if(colocar===FLOTA.length){ fase="jugar"; J.aviso("Fleet ready! Fire at the enemy sea"); } pinta(); }
function tiro(m,i){ m.tiros[i]=1; const v=m.c[i]; if(!v) return "agua"; const b=m.barcos[v-1]; b.toc++; return b.toc===b.cs.length?"hundido":"tocado"; }
function dispara(i){ if(fase!=="jugar"||turno!==me||fin||el.tiros[i]) return;
  if(ON){ const r=tiro(el,i); J.aviso(r==="agua"?"💧 Miss":r==="tocado"?"💥 Hit! Fire again":"🔥 Sunk! Fire again");
    if(r==="hundido") rodea(el, el.barcos[el.c[i]-1]);
    const gana=el.barcos.every(b=>b.toc===b.cs.length); if(r==="agua") turno=1-me;
    const e={mares:me?[el,yo]:[yo,el],listos:[true,true],turno,ganador:gana?me:-1}; ON.enviar(e); carga(e); return; }
  const r=tiro(el,i); J.aviso(r==="agua"?"💧 Miss":r==="tocado"?"💥 Hit! Fire again":"🔥 Sunk! Fire again");
  if(r==="hundido") rodea(el, el.barcos[el.c[i]-1]);
  if(el.barcos.every(b=>b.toc===b.cs.length)){ fin="You sank the whole enemy fleet! 🎉"; J.confeti(); pinta(); return; }
  if(r==="agua"){ turno=1; pinta(); setTimeout(cpu,700); } else pinta(); }
function rodea(m,b){ b.cs.forEach(x=>{ const f=Math.floor(x/10),c=x%10; for(let df=-1;df<=1;df++) for(let dc=-1;dc<=1;dc++){ const y=f+df,z=c+dc; if(y>=0&&y<10&&z>=0&&z<10&&!m.c[y*10+z]) m.tiros[y*10+z]=1; } }); }
function cpu(){ if(fin) return;
  let i; cpuPend=cpuPend.filter(x=>!yo.tiros[x]);
  if(cpuPend.length) i=cpuPend.shift();
  else { const libres=[...Array(100).keys()].filter(x=>!yo.tiros[x]&&(Math.floor(x/10)+x%10)%2===0); const todas=[...Array(100).keys()].filter(x=>!yo.tiros[x]); i=J.elige(libres.length?libres:todas); }
  const r=tiro(yo,i);
  if(r==="tocado"){ const b=yo.barcos[yo.c[i]-1]; const tocadas=b.cs.filter(x=>yo.tiros[x]);
    const veci=x=>[x-10,x+10,(x%10)?x-1:-1,(x%10<9)?x+1:-1].filter(y=>y>=0&&y<100&&!yo.tiros[y]);
    let cand=[]; if(tocadas.length>1){ const h=Math.floor(tocadas[0]/10)===Math.floor(tocadas[1]/10); tocadas.forEach(x=>veci(x).forEach(y=>{ if(h?Math.floor(y/10)===Math.floor(x/10):y%10===x%10) cand.push(y); })); }
    else cand=veci(i);
    cpuPend=[...new Set(cand)]; }
  if(r==="hundido"){ rodea(yo, yo.barcos[yo.c[i]-1]); cpuPend=[]; }
  if(yo.barcos.every(b=>b.toc===b.cs.length)){ fin="The computer sank your fleet. Better luck next time!"; pinta(); return; }
  if(r==="agua"){ turno=0; pinta(); } else { pinta(); setTimeout(cpu,700); } }
function listo(){ fase= ultE&&ultE.listos[1-me] ? "jugar" : "esperar"; const m=JSON.parse(JSON.stringify(yo)); ON.enviar(prev=>{ prev.mares[me]=m; prev.listos[me]=true; return prev; });
  J.aviso("Fleet ready!"); pinta(); }
function carga(e){ ultE=e; if(e.listos[me]&&e.mares[me]) yo=e.mares[me]; el=e.mares[1-me]||marVacio(); turno=e.turno; fin=null;
  fase= !e.listos[me]&&fase!=="esperar" ? "colocar" : (e.listos[0]&&e.listos[1]) ? "jugar" : "esperar";
  if(e.ganador>=0){ fin= e.ganador===me?"You sank the whole enemy fleet! 🎉":`${ON.jugadores[e.ganador]} sank your fleet. Better luck next time!`; if(e.ganador===me) J.confeti(); }
  pinta(); }
J.online&&J.online.activar({juego:"hundir-la-flota", titulo:"Battleship", min:2, max:2,
  inicio(){ return {mares:[null,null],listos:[false,false],turno:0,ganador:-1}; },
  alEmpezar(ctx,e){ ON=ctx; me=ctx.yo; yo=marVacio(); colocar=0; fase="colocar"; carga(e); J.aviso("Place your fleet. When you’re both ready, the first to fire is "+ctx.jugadores[0],3500); },
  alCambiar(e){ carga(e); } });
nueva();
})();
