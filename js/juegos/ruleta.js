/* Ruleta europea con fichas de mentira */
(function(){
J.paginaJuego({titulo:"Roulette", emoji:"🎡", ficha:"ruleta", ins:{
  titulo:"European roulette",
  intro:"You play with <b>pretend chips</b>: you start with 1,000 and no real money is ever used. The wheel has 37 numbers: 1 to 36 (red and black) and 0 (green).",
  pasos:[
    "Choose the value of the chip you want to bet (1, 5, 25 or 100).",
    "Tap the table where you want to bet. You can put several chips in several places.",
    "<b>A single number</b> (straight up): if it comes up, you’re paid 35 times your bet.",
    "<b>Dozen</b> (1-12, 13-24, 25-36) or <b>column</b> (2 to 1): you’re paid twice your bet.",
    "<b>Red/Black, Even/Odd, 1-18/19-36</b>: you’re paid the same as you bet.",
    "Press <b>🎡 Spin</b>. The ball stops on a number and winning bets are paid. Losing bets are taken away.",
    "If 0 comes up, all bets lose except the one on 0.",
    "If you run out of chips, press <b>Reload</b> to start again with 1,000."
  ],
  consejos:["It’s a game of pure chance: no strategy can win in the long run.","Recuerda: esto es solo un juego, sin dinero real."]
}});
const css=`
.ru-zona{display:grid;grid-template-columns:340px 1fr;gap:20px;align-items:start}
@media(max-width:900px){.ru-zona{grid-template-columns:1fr}}
.ru-rueda{position:relative;width:100%;max-width:340px;aspect-ratio:1;margin:0 auto}
.ru-rueda svg{width:100%;height:100%}
#ru-giro{transition:transform 6s cubic-bezier(.12,.7,.15,1);transform-origin:200px 200px}
#ru-bola{transition:transform 6s cubic-bezier(.1,.6,.1,1);transform-origin:200px 200px}
.tapete{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:3px;background:#0a4f33;padding:8px;border-radius:12px;border:4px solid #5a3a1a;user-select:none}
.ap{position:relative;display:grid;place-items:center;min-height:44px;border:1px solid rgba(255,255,255,.5);border-radius:6px;font-family:var(--titulos);font-weight:600;cursor:pointer;color:#fff;font-size:clamp(.7rem,1.6vw,1rem)}
.ap:hover{outline:2px solid var(--oro)}
.ap.r{background:#c9184a}.ap.n{background:#1a1a1a}.ap.v{background:#0f8a4f}.ap.o{background:transparent}
.ap.gana{animation:brilla .5s 4}
@keyframes brilla{50%{box-shadow:0 0 0 4px var(--oro),0 0 20px var(--oro)}}
.ficha{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);min-width:26px;height:26px;padding:0 4px;border-radius:13px;background:var(--oro);color:#241500;border:2px dashed #fff;font-size:.7rem;display:grid;place-items:center;font-family:var(--cuerpo);font-weight:800;box-shadow:0 2px 4px rgba(0,0,0,.5)}
.fichas-sel{display:flex;gap:10px;justify-content:center;margin:14px 0;flex-wrap:wrap}
.fs{width:54px;height:54px;border-radius:50%;border:4px dashed #fff;font-family:var(--titulos);font-size:1.1rem;font-weight:700;cursor:pointer;color:#fff;box-shadow:0 3px 8px rgba(0,0,0,.4)}
.fs.act{outline:4px solid var(--oro);transform:scale(1.1)}
.ult{display:flex;gap:6px;flex-wrap:wrap}
.ult span{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:.85rem}
`;
document.head.append(J.el("style",{},css));
const ORDEN=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const ROJOS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const color=n=>n===0?"v":ROJOS.has(n)?"r":"n";
let bolaRot=0, saldo=J.lee("ruleta-saldo",1000), apuestas={}, ficha=5, rot=0, girando=false, ultimos=[];
const raiz=J.$("#juego");

function rueda(){
  const c=200, R=190, r2=120; let s=`<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="198" fill="#5a3a1a"/><circle cx="200" cy="200" r="186" fill="#3b2410"/><g id="ru-giro">`;
  const n=37, p=2*Math.PI/n;
  ORDEN.forEach((num,i)=>{
    const a0=i*p-Math.PI/2-p/2, a1=a0+p;
    const pt=(r,a)=>`${c+r*Math.cos(a)},${c+r*Math.sin(a)}`;
    const col={r:"#c9184a",n:"#1a1a1a",v:"#0f8a4f"}[color(num)];
    s+=`<path d="M${pt(r2,a0)} L${pt(175,a0)} A175,175 0 0,1 ${pt(175,a1)} L${pt(r2,a1)} A${r2},${r2} 0 0,0 ${pt(r2,a0)}Z" fill="${col}" stroke="#d4af37" stroke-width="1"/>`;
    const am=a0+p/2, tx=c+155*Math.cos(am), ty=c+155*Math.sin(am);
    s+=`<text x="${tx}" y="${ty}" fill="#fff" font-size="13" font-weight="700" text-anchor="middle" dominant-baseline="central" transform="rotate(${am*180/Math.PI+90} ${tx} ${ty})">${num}</text>`;
  });
  s+=`<circle cx="200" cy="200" r="${r2}" fill="#7a4a1f" stroke="#d4af37" stroke-width="3"/><circle cx="200" cy="200" r="70" fill="#5a3a1a"/>`;
  for(let k=0;k<8;k++){ const a=k*Math.PI/4; s+=`<line x1="200" y1="200" x2="${200+68*Math.cos(a)}" y2="${200+68*Math.sin(a)}" stroke="#d4af37" stroke-width="6" stroke-linecap="round"/>`; }
  s+=`<circle cx="200" cy="200" r="18" fill="#d4af37"/></g><g id="ru-bola"><circle cx="200" cy="${200-112}" r="8" fill="#fff" stroke="#bbb"/></g></svg>`;
  return s;
}
function montar(){
  let t=`<div class="ap v" data-k="n0" style="grid-row:1/4;grid-column:1">0</div>`;
  for(let n=1;n<=36;n++){ const fila=3-((n-1)%3), col=2+Math.floor((n-1)/3); t+=`<div class="ap ${color(n)}" data-k="n${n}" style="grid-row:${fila};grid-column:${col}">${n}</div>`; }
  for(let f=1;f<=3;f++) t+=`<div class="ap o" data-k="c${4-f}" style="grid-row:${f};grid-column:14">2:1</div>`;
  ["1st 12","2nd 12","3rd 12"].forEach((x,k)=>t+=`<div class="ap o" data-k="d${k+1}" style="grid-row:4;grid-column:${2+k*4}/span 4">${x}</div>`);
  [["1-18","bajo"],["Even","par"],["Red","rojo"],["Black","negro"],["Odd","impar"],["19-36","alto"]].forEach(([x,k],i)=>t+=`<div class="ap ${k==="rojo"?"r":k==="negro"?"n":"o"}" data-k="${k}" style="grid-row:5;grid-column:${2+i*2}/span 2">${x}</div>`);
  raiz.innerHTML=`<div class="ru-zona"><div><div class="ru-rueda">${rueda()}</div><div class="estado" id="ru-est">Place your bets</div>
  <h3>Last numbers</h3><div class="ult" id="ru-ult"></div></div>
  <div><div class="marcador"><div class="caja"><small>Your chips</small><b id="ru-saldo"></b></div><div class="caja"><small>Bet</small><b id="ru-ap">0</b></div></div>
  <div class="tapete" id="tapete">${t}</div>
  <div class="fichas-sel">${[[1,"#6c757d"],[5,"#c9184a"],[25,"#2a9d8f"],[100,"#1d1d1d"]].map(([v,c])=>`<button class="fs ${v===ficha?"act":""}" data-v="${v}" style="background:${c}">${v}</button>`).join("")}</div>
  <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn" id="ru-girar">🎡 Spin</button><button class="btn sec" id="ru-borrar">🧹 Clear bets</button><button class="btn sec" id="ru-rec">💰 Reload</button></div>
  <p style="color:var(--suave);font-size:.85rem;text-align:center">Pretend chips. A game with no real money, just for fun.</p></div></div>`;
  J.$$(".ap").forEach(a=>a.onclick=()=>apostar(a.dataset.k));
  J.$$(".fs").forEach(b=>b.onclick=()=>{ ficha=+b.dataset.v; J.$$(".fs").forEach(x=>x.classList.toggle("act",x===b)); });
  J.$("#ru-girar").onclick=girar;
  J.$("#ru-borrar").onclick=()=>{ if(girando) return; for(const k in apuestas) saldo+=apuestas[k]; apuestas={}; pinta(); };
  J.$("#ru-rec").onclick=()=>{ if(girando) return; saldo=1000; apuestas={}; pinta(); J.aviso("💰 You have 1,000 chips again"); };
  pinta();
}
function apostar(k){
  if(girando) return;
  if(saldo<ficha) return J.aviso("You don’t have enough chips left");
  saldo-=ficha; apuestas[k]=(apuestas[k]||0)+ficha; pinta();
}
function pinta(){
  J.guarda("ruleta-saldo",saldo);
  J.$("#ru-saldo").textContent=saldo.toLocaleString("es");
  J.$("#ru-ap").textContent=Object.values(apuestas).reduce((a,b)=>a+b,0);
  J.$$(".ap").forEach(a=>{ const f=a.querySelector(".ficha"); if(f) f.remove(); if(apuestas[a.dataset.k]) a.append(J.el("span",{class:"ficha"},apuestas[a.dataset.k])); });
  J.$("#ru-ult").innerHTML=ultimos.map(n=>`<span style="background:${{r:"#c9184a",n:"#1a1a1a",v:"#0f8a4f"}[color(n)]}">${n}</span>`).join("");
}
function gana(k,n){
  if(k[0]==="n"&&!isNaN(k.slice(1))) return +k.slice(1)===n ? 36 : 0;
  if(n===0) return 0;
  if(k[0]==="c") return (n-1)%3===(+k[1]-1) ? 3 : 0;
  if(k[0]==="d") return Math.ceil(n/12)===+k[1] ? 3 : 0;
  return ({rojo:ROJOS.has(n),negro:!ROJOS.has(n),par:n%2===0,impar:n%2===1,bajo:n<=18,alto:n>=19}[k]) ? 2 : 0;
}
async function girar(){
  if(girando) return;
  if(!Object.keys(apuestas).length) return J.aviso("Put some chips on the table first");
  girando=true; J.$("#ru-girar").disabled=true; J.$("#ru-est").textContent="No more bets…";
  const i=J.azar(37), n=ORDEN[i], paso=360/37;
  rot+=360*4+J.azar(360);
  let B=rot+i*paso; while(B>bolaRot-360*3) B-=360; bolaRot=B;
  J.$("#ru-giro").style.transform=`rotate(${rot}deg)`;
  J.$("#ru-bola").style.transform=`rotate(${B}deg)`;
  await J.espera(6200);
  let premio=0, apostado=0;
  for(const k in apuestas){ apostado+=apuestas[k]; premio+=apuestas[k]*gana(k,n); }
  saldo+=premio; apuestas={}; ultimos.unshift(n); ultimos=ultimos.slice(0,12);
  J.$$(`.ap[data-k="n${n}"]`).forEach(a=>a.classList.add("gana")); setTimeout(()=>J.$$(".ap.gana").forEach(a=>a.classList.remove("gana")),2200);
  const nom={r:"red",n:"black",v:"green"}[color(n)];
  J.$("#ru-est").textContent = `It’s ${n} ${nom}. ${premio?`You win ${premio} chips!`:"No win this time."}`;
  if(premio>apostado) { J.aviso(`🎉 You win ${premio} chips!`); if(premio>=apostado*10) J.confeti(); }
  girando=false; J.$("#ru-girar").disabled=false; pinta();
}
montar();
})();
