/* Torres de Hanói */
(function(){
J.paginaJuego({titulo:"Tower of Hanoi", emoji:"🗼", ficha:"torres-de-hanoi", ins:{
  titulo:"Tower of Hanoi",
  intro:"The puzzle invented by the French mathematician Édouard Lucas in 1883. There are three pegs and a tower of discs of different sizes. You have to move <b>the whole tower</b> from the left peg to the <b>right</b>.",
  pasos:[
    "Tap a peg to pick up its top disc and tap another to put it down. You can also drag it.",
    "You can only move <b>one disc at a time</b>, and always the top one.",
    "<b>Never</b> put a disc on top of a smaller one.",
    "With <i>n</i> discs, the minimum number of moves is 2<sup>n</sup> − 1: 7 with three discs, 15 with four, 255 with eight.",
    "If you get stuck, press <b>Show solution</b> and watch how it’s solved."
  ],
  consejos:["The smallest disc moves every other turn, always in the same direction.","With an odd number of discs, the small one goes first to the target peg; with an even number, to the middle one.","Think about how to move the tower of n − 1 discs: it’s the same problem, only smaller."]
}});
document.head.append(J.el("style",{},`
.ha{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:720px;margin:0 auto;padding:16px 12px 0;border-radius:18px;background:var(--panel);border:1px solid var(--borde);user-select:none;touch-action:none}
.ha .v{position:relative;height:clamp(200px,48vw,300px);display:flex;flex-direction:column-reverse;align-items:center;cursor:pointer;padding-bottom:14px;border-radius:12px}
.ha .v::before{content:"";position:absolute;bottom:14px;top:6px;left:50%;width:10px;transform:translateX(-50%);border-radius:6px;background:linear-gradient(90deg,#8b5a2b,#c48a4a,#8b5a2b)}
.ha .v::after{content:"";position:absolute;bottom:0;left:2%;right:2%;height:14px;border-radius:7px;background:linear-gradient(#a06a34,#6b4420)}
.ha .v.dest{background:rgba(255,201,74,.12)}
.ha .d{position:relative;z-index:1;height:clamp(16px,4.2vw,26px);border-radius:12px;margin-top:3px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.25),inset 0 3px 0 rgba(255,255,255,.35),0 2px 4px rgba(0,0,0,.3);transition:transform .15s}
.ha .d.up{transform:translateY(-24px);box-shadow:0 0 0 3px var(--oro),inset 0 -4px 0 rgba(0,0,0,.25)}
.ha-ctl{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
`));
const COL=["#ff4d6d","#ff9f1c","#ffc94a","#2ed47a","#4cc9f0","#4361ee","#9b5de5","#f15bb5"];
const raiz=J.$("#juego");
let n=J.lee("hanoi-n",4), T, sel=-1, movs=0, fin=false, auto=0, mejor=J.lee("hanoi-mejor",{});
raiz.innerHTML=`<div class="ha-ctl"><label>Discs <select id="ha-n">${[3,4,5,6,7,8].map(k=>`<option ${k===n?"selected":""}>${k}</option>`).join("")}</select></label>
<button class="btn sec peq" id="ha-nueva">🔄 Start</button><button class="btn sec peq" id="ha-sol">▶️ Show solution</button></div>
<div class="marcador" style="justify-content:center"><div class="caja"><small>Moves</small><b id="ha-m">0</b></div><div class="caja"><small>Minimum</small><b id="ha-min"></b></div><div class="caja"><small>Your best</small><b id="ha-mej"></b></div></div>
<div class="estado" id="ha-est"></div><div class="ha" id="ha"></div>`;
J.$("#ha-n").onchange=e=>{ n=+e.target.value; J.guarda("hanoi-n",n); nueva(); };
J.$("#ha-nueva").onclick=nueva; J.$("#ha-sol").onclick=solucion;
function nueva(){ auto++; T=[[],[],[]]; for(let k=n;k>=1;k--) T[0].push(k); sel=-1; movs=0; fin=false; pinta(); }
function pinta(){ const h=J.$("#ha"); h.innerHTML="";
  T.forEach((v,i)=>{ const d=J.el("div",{class:"v"+(sel>=0&&sel!==i&&puede(sel,i)?" dest":"")}); d.dataset.i=i;
    v.forEach((k,j)=>{ const x=J.el("div",{class:"d"+(sel===i&&j===v.length-1?" up":"")}); x.style.width=(26+k*(70/n))+"%"; x.style.background=COL[(k-1)%8]; d.append(x); });
    h.append(d); });
  J.$("#ha-m").textContent=movs; J.$("#ha-min").textContent=2**n-1; J.$("#ha-mej").textContent=mejor[n]||"—";
  J.$("#ha-est").textContent= fin?(movs===2**n-1?"🏆 Perfect! In the minimum number of moves":`Done in ${movs} moves!`): sel>=0?"Now tap the target peg":"Tap a peg to pick up its disc"; }
const puede=(a,b)=>T[a].length&&(!T[b].length||T[b][T[b].length-1]>T[a][T[a].length-1]);
function mueve(a,b){ if(!puede(a,b)) return false; T[b].push(T[a].pop()); movs++; return true; }
function comprueba(){ if(T[2].length===n){ fin=true; if(!mejor[n]||movs<mejor[n]){ mejor[n]=movs; J.guarda("hanoi-mejor",mejor); } J.confeti(movs===2**n-1?120:60); } }
function toca(i){ if(fin||resolviendo) return; if(sel<0){ if(T[i].length){ sel=i; } }
  else if(sel===i) sel=-1;
  else { if(mueve(sel,i)){ sel=-1; comprueba(); } else { J.aviso("You can’t put a disc on top of a smaller one"); sel=-1; } }
  pinta(); }
// toque y arrastre
let arr=null;
J.$("#ha").addEventListener("pointerdown",e=>{ const v=e.target.closest(".v"); if(!v||resolviendo) return; arr={de:+v.dataset.i,x:e.clientX,y:e.clientY,mov:false}; });
window.addEventListener("pointermove",e=>{ if(!arr) return; if(Math.hypot(e.clientX-arr.x,e.clientY-arr.y)>12&&!arr.mov){ arr.mov=true; if(sel!==arr.de&&T[arr.de].length){ sel=arr.de; pinta(); } } });
window.addEventListener("pointerup",e=>{ if(!arr) return; const a=arr; arr=null; const el=document.elementFromPoint(e.clientX,e.clientY); const v=el&&el.closest&&el.closest("#ha .v");
  if(!a.mov){ if(v) toca(+v.dataset.i); return; }
  if(v&&+v.dataset.i!==a.de){ toca(+v.dataset.i); } else { sel=-1; pinta(); } });
let resolviendo=false;
async function solucion(){ nueva(); const id=auto; resolviendo=true; J.$("#ha-est").textContent="Watch the solution…";
  const pasos=[]; const h=(k,a,b,c)=>{ if(!k) return; h(k-1,a,c,b); pasos.push([a,c]); h(k-1,b,a,c); }; h(n,0,1,2);
  const ms=Math.max(60,Math.min(500,9000/pasos.length));
  for(const [a,b] of pasos){ await J.espera(ms); if(id!==auto){ resolviendo=false; return; } mueve(a,b); pinta(); J.$("#ha-est").textContent="Watch the solution…"; }
  resolviendo=false; J.$("#ha-est").textContent=`Solved in ${pasos.length} moves, the minimum. Now it’s your turn!`; fin=true; }
nueva();
})();
