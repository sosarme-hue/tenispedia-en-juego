/* Memoria (parejas) */
(function(){
J.paginaJuego({titulo:"Memory", emoji:"🧩", ficha:"memoria", ins:{
  titulo:"Memory",
  intro:"All the cards are face down and each picture appears twice. Find all the pairs.",
  pasos:["Tap a card to turn it over.","Tap another card. If both have the same picture, they stay face up.","If they’re different, they turn back over: try to remember where they were!","You win when you find all the pairs. The fewer tries, the better.","In 2-player mode, if you find a pair you keep playing; if you miss, it’s the other player’s turn. Whoever makes the most pairs wins."],
  consejos:["Start by turning over cards from different areas to memorise the board."]
}});
document.head.append(J.el("style",{},`.me{display:grid;gap:10px;max-width:620px;margin:0 auto;perspective:800px}
.me .c{aspect-ratio:3/4;position:relative;cursor:pointer;transform-style:preserve-3d;transition:transform .45s}
.me .c.v{transform:rotateY(180deg)}.me .c>div{position:absolute;inset:0;border-radius:14px;display:grid;place-items:center;backface-visibility:hidden;box-shadow:var(--sombra)}
.me .dor{background:linear-gradient(135deg,#9b5de5,#f15bb5);font-size:2rem}
.me .fr{background:#fff;transform:rotateY(180deg);font-size:clamp(1.8rem,7vw,3.2rem)}
.me .c.ok .fr{background:#d4f8e0}`));
const TEMAS={animales:"🐶🐱🦊🐻🐼🐨🐯🦁🐸🐵🐧🦉🐙🦋🐢🦄🐳🐝",frutas:"🍎🍌🍇🍓🍉🍒🍑🍍🥝🍋🥥🍐🥕🌽🍄🥑🍅🫐",juegos:"♟️🎲🃏🧩🎯🎳🎮🪀🪁🎱🧸🛹⚽🏀🎾🏓🎨🎹"};
let ON=null, me=0;
const escH=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let cartas, abiertas, intentos, pares, n=8, tema="animales", jug2=false, turno=0, pts=[0,0], bloq=false;
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="marcador" style="justify-content:center" id="me-m"></div>
<div class="centro-txt" style="margin-bottom:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><select id="me-n"><option value="6">12 cards</option><option value="8" selected>16 cards</option><option value="10">20 cards</option><option value="12">24 cards</option><option value="18">36 cards</option></select>
<select id="me-t"><option value="animales">🐶 Animals</option><option value="frutas">🍎 Fruit</option><option value="juegos">🎲 Games</option></select><select id="me-j"><option value="1">1 player</option><option value="2">2 players</option></select><button class="btn peq" id="me-nueva">🔄 New</button></div><div class="me" id="me"></div>`;
J.$("#me-n").onchange=e=>{ n=+e.target.value; nueva(); }; J.$("#me-t").onchange=e=>{ tema=e.target.value; nueva(); }; J.$("#me-j").onchange=e=>{ jug2=e.target.value==="2"; nueva(); }; J.$("#me-nueva").onclick=nueva;
function nueva(){ const em=[...new Intl.Segmenter().segment(TEMAS[tema])].map(s=>s.segment); const sel=J.baraja(em).slice(0,n); cartas=J.baraja([...sel,...sel]).map(e=>({e,v:false,ok:false})); abiertas=[]; intentos=0; pares=0; turno=0; pts=[0,0]; pinta(); }
function pinta(){
  const cols = cartas.length<=16?4:cartas.length<=24?6:6;
  const m=J.$("#me"); m.style.gridTemplateColumns=`repeat(${cols},1fr)`;
  m.innerHTML=cartas.map((c,i)=>`<div class="c ${c.v||c.ok?"v":""} ${c.ok?"ok":""}" data-i="${i}"><div class="dor">🎴</div><div class="fr">${c.e}</div></div>`).join("");
  J.$$("#me .c").forEach(d=>d.onclick=()=>toca(+d.dataset.i));
  J.$("#me-m").innerHTML= ON ? pts.map((p,j)=>`<div class="caja" style="${turno===j&&pares<n?"outline:2px solid var(--oro)":""}"><small>${j===me?"You":escH(ON.jugadores[j])}</small><b>${p}</b></div>`).join("")+`<div class="caja"><small>${turno===me?"Your turn!":"Turn: "+escH(ON.jugadores[turno])}</small><b>${pares} / ${n}</b></div>` : jug2 ? `<div class="caja" style="${turno===0?"outline:2px solid var(--oro)":""}"><small>Player 1</small><b>${pts[0]}</b></div><div class="caja" style="${turno===1?"outline:2px solid var(--oro)":""}"><small>Player 2</small><b>${pts[1]}</b></div>` : `<div class="caja"><small>Tries</small><b>${intentos}</b></div><div class="caja"><small>Pairs</small><b>${pares} / ${n}</b></div>`;
}
async function toca(i){
  const c=cartas[i]; if(bloq||c.v||c.ok) return; if(ON&&turno!==me) return;
  c.v=true; abiertas.push(i); pinta(); envia();
  if(abiertas.length<2) return;
  intentos++; bloq=true;
  const [a,b]=abiertas;
  if(cartas[a].e===cartas[b].e){ cartas[a].ok=cartas[b].ok=true; pares++; if(jug2||ON) pts[turno]++; }
  else { await J.espera(1100); cartas[a].v=cartas[b].v=false; if(ON) turno=(turno+1)%pts.length; else if(jug2) turno=1-turno; }
  abiertas=[]; bloq=false; pinta(); envia();
  if(ON&&pares===n) return finOn();
  if(pares===n){ J.confeti(); J.modal(jug2?`<h2>🏆 ${pts[0]===pts[1]?"It’s a draw!":`Player ${pts[0]>pts[1]?1:2} wins!`}</h2><p>${pts[0]} pairs to ${pts[1]}.</p>`:`<h2>🏆 All pairs found!</h2><p>You did it in ${intentos} tries.</p>`,[{txt:"Play again"}]).then(nueva); }
}
function envia(){ if(ON) ON.enviar({cartas,abiertas,turno,pts,pares,n}); }
function finOn(){ const mx=Math.max(...pts), g=pts.map((p,j)=>p===mx?j:-1).filter(j=>j>=0);
  if(g.includes(me)) J.confeti(); J.modal(`<h2>🏆 ${g.length>1?"It’s a draw!":g[0]===me?"You won!":"Winner: "+escH(ON.jugadores[g[0]])}</h2><p>${pts.map((p,j)=>`${j===me?"You":escH(ON.jugadores[j])}: ${p} pairs`).join(" · ")}</p>`,[{txt:"OK"}]); }
function carga(e){ cartas=e.cartas; abiertas=e.abiertas||[]; turno=e.turno; pts=e.pts; const antes=pares; pares=e.pares; n=e.n; bloq=false; pinta(); if(pares===n&&antes!==n) finOn(); }
J.online&&J.online.activar({juego:"memoria", titulo:"Memory", min:2, max:4,
  inicio(nombres){ nueva(); pts=nombres.map(()=>0); return {cartas,abiertas:[],turno:0,pts,pares:0,n}; },
  alEmpezar(ctx,e){ ON=ctx; me=ctx.yo; J.$$("#me-n,#me-t,#me-j,#me-nueva").forEach(x=>x.style.display="none"); carga(e); },
  alCambiar(e){ carga(e); } });
nueva();
})();
