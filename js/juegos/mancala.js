/* Mancala (variante kalah) */
(function(){
J.paginaJuego({titulo:"Mancala", emoji:"🥚", ficha:"mancala", ins:{
  titulo:"Mancala",
  intro:"One of the oldest games in the world. There are 12 small pits (6 of yours at the bottom, 6 of your rival’s at the top) and two large stores. Each pit starts with 4 seeds.",
  pasos:[
    "Your pits are the ones at the <b>bottom</b> and your store is the one on the <b>right</b>.",
    "On your turn, tap one of your pits: you pick up all its seeds and drop them <b>one by one</b> into the following pits, anticlockwise.",
    "When you pass your store you also drop a seed in it. You skip your rival’s store.",
    "If the <b>last seed lands in your store</b>, vuelves a jugar.",
    "If the last seed lands in an <b>empty pit of yours</b> and the pit opposite has seeds, <b>you capture</b> those seeds and yours, and they go to your store.",
    "When a player runs out of seeds in their pits, the game ends and the other player keeps the ones they have left.",
    "The winner is whoever has <b>the most seeds in their store</b>."
  ],
  consejos:["Look for moves that end in your store so you can chain turns.","Leave one of your pits empty opposite a full one of your rival’s so you can capture."]
}});
document.head.append(J.el("style",{},`
.mc{display:grid;grid-template-columns:1fr repeat(6,1fr) 1fr;grid-template-rows:1fr 1fr;gap:8px;background:linear-gradient(135deg,#8b5a2b,#5e3a17);padding:14px;border-radius:40px;max-width:760px;margin:0 auto;box-shadow:var(--sombra),inset 0 2px 8px rgba(255,255,255,.2)}
.mc .h{aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 50% 35%,#3d240c,#5e3a17);box-shadow:inset 0 6px 10px rgba(0,0,0,.6);display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:2px;padding:12%;position:relative;min-width:0}
.mc .g{grid-row:span 2;border-radius:40px;background:radial-gradient(circle at 50% 35%,#3d240c,#5e3a17);box-shadow:inset 0 6px 12px rgba(0,0,0,.6);display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:2px;padding:8px;position:relative;min-width:0}
.mc i{width:clamp(5px,1.4vw,10px);height:clamp(5px,1.4vw,10px);border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#9be7ff 40%,#2a9d8f);display:block}
.mc i:nth-child(3n){background:radial-gradient(circle at 35% 30%,#fff,#ffd6a5 40%,#e76f51)}
.mc i:nth-child(4n){background:radial-gradient(circle at 35% 30%,#fff,#caffbf 40%,#52b788)}
.mc b{position:absolute;bottom:-2px;right:2px;font-family:var(--titulos);color:#ffe8c2;font-size:.85rem;text-shadow:0 1px 2px #000}
.mc .mio{cursor:pointer}.mc .mio:hover,.mc .pos{box-shadow:inset 0 6px 10px rgba(0,0,0,.6),0 0 0 3px var(--oro)}
.mc .ult{box-shadow:inset 0 6px 10px rgba(0,0,0,.6),0 0 0 3px #4cc9f0}
`));
// índices: 0-5 tus hoyos (izq→dcha), 6 tu granero, 7-12 hoyos rival (dcha→izq), 13 granero rival
const raiz=J.$("#juego"); let b, turno, fin, nivel=2, ult=-1;
raiz.innerHTML=`<div class="centro-txt" style="margin-bottom:10px"><select id="mc-n"><option value="1">Easy</option><option value="2" selected>Normal</option><option value="3">Hard</option></select> <button class="btn peq" id="mc-nueva">🔄 New game</button></div>
<div class="estado" id="mc-est"></div><div class="mc" id="mc"></div>
<div class="centro-txt" style="color:var(--suave);margin-top:8px">⬆️ Computer · You ⬇️ (your store is the one on the right)</div>`;
J.$("#mc-n").onchange=e=>{nivel=+e.target.value;nueva();}; J.$("#mc-nueva").onclick=()=>{ nueva(); if(ON) envia(false); };
let ON=null, me=0;
function siembra(b,i,j){ // j = jugador 0 (yo) o 1 (cpu). Devuelve {b, otra}
  b=b.slice(); let s=b[i]; b[i]=0; let k=i; const evita=j===0?13:6, mia=j===0?6:13;
  while(s){ k=(k+1)%14; if(k===evita) continue; b[k]++; s--; }
  const propio = j===0 ? (k>=0&&k<=5) : (k>=7&&k<=12);
  if(propio&&b[k]===1&&b[12-k]>0){ b[mia]+=b[12-k]+1; b[k]=0; b[12-k]=0; }
  return {b, otra:k===mia, fin:k};
}
const lado=(b,j)=>j===0?[0,1,2,3,4,5]:[7,8,9,10,11,12];
function cierra(b){ if(lado(b,0).every(i=>!b[i])||lado(b,1).every(i=>!b[i])){ b=b.slice(); lado(b,0).forEach(i=>{b[6]+=b[i];b[i]=0;}); lado(b,1).forEach(i=>{b[13]+=b[i];b[i]=0;}); return {b,acabada:true}; } return {b,acabada:false}; }
function mm(b,p,j,a,be){ const c=cierra(b); if(c.acabada||p===0) return c.b[13]-c.b[6];
  const js=lado(b,j).filter(i=>b[i]); let best=j===1?-1e9:1e9;
  for(const i of js){ const r=siembra(b,i,j); const v=mm(r.b,p-1,r.otra?j:1-j,a,be);
    if(j===1){ best=Math.max(best,v); a=Math.max(a,v); } else { best=Math.min(best,v); be=Math.min(be,v); } if(a>=be) break; }
  return best; }
function cpu(){ const js=lado(b,1).filter(i=>b[i]); if(nivel===1&&Math.random()<.5) return J.elige(js);
  const p={1:2,2:5,3:8}[nivel]; let best=-1e9,mv=js[0]; for(const i of js){ const r=siembra(b,i,1); const v=mm(r.b,p-1,r.otra?1:0,-1e9,1e9)+Math.random()*.3; if(v>best){best=v;mv=i;} } return mv; }
function nueva(){ b=[4,4,4,4,4,4,0,4,4,4,4,4,4,0]; turno=0; fin=null; ult=-1; pinta(); }
const semillas=n=>"<i></i>".repeat(Math.min(n,30));
function pinta(){
  const h=(i,cls="")=>`<div class="h ${cls} ${i===ult?"ult":""}" data-i="${i}">${semillas(b[i])}<b>${b[i]}</b></div>`;
  const gm=me?13:6, gr=me?6:13;
  let html=`<div class="g">${semillas(b[gr])}<b>${b[gr]}</b></div>`;
  lado(b,1-me).slice().reverse().forEach(i=>html+=h(i));
  html+=`<div class="g">${semillas(b[gm])}<b>${b[gm]}</b></div>`;
  lado(b,me).forEach(i=>html+=h(i, !fin&&turno===me&&b[i]?"mio":""));
  J.$("#mc").innerHTML=html;
  // colocar: granero rival en col 1, mi granero en col 8
  const gs=J.$$("#mc .g"); gs[0].style.gridColumn="1"; gs[0].style.gridRow="1 / span 2"; gs[1].style.gridColumn="8"; gs[1].style.gridRow="1 / span 2";
  J.$$("#mc .mio").forEach(d=>d.onclick=()=>juega(+d.dataset.i));
  J.$("#mc-est").textContent=fin||(turno===me?"Your turn: choose one of your pits (bottom)":ON?`${ON.jugadores[turno]}’s turn`:"The computer is playing…");
}
function juega(i){ if(fin||turno!==me||!b[i]) return;
  if(ON){ const r=siembra(b,i,me); b=r.b; ult=r.fin; const c=cierra(b); b=c.b; turno=r.otra?me:1-me; if(r.otra&&!c.acabada) J.aviso("Last seed in your store: you go again!"); envia(c.acabada); carga({b,turno,ult,acabada:c.acabada}); return; }
  mueve(i,0); }
function envia(ac){ ON.enviar({b,turno,ult,acabada:ac}); }
function carga(e){ b=e.b; turno=e.turno; ult=e.ult; fin=null;
  if(e.acabada){ const yo=b[me?13:6], el=b[me?6:13]; fin= yo>el?`You won ${yo} to ${el}! 🎉`: el>yo?`${ON.jugadores[1-me]} wins ${el} to ${yo}`:"It’s a draw!"; if(yo>el) J.confeti(); }
  pinta(); }
J.online&&J.online.activar({juego:"mancala", titulo:"Mancala", min:2, max:2,
  inicio(){ return {b:[4,4,4,4,4,4,0,4,4,4,4,4,4,0],turno:0,ult:-1,acabada:false}; },
  alEmpezar(ctx,e){ ON=ctx; me=ctx.yo; J.$("#mc-n").style.display="none"; const t=J.$$("#juego .centro-txt"); t[t.length-1].textContent="⬆️ Your rival · You ⬇️ (your store is the one on the right)"; carga(e); J.aviso(me===0?"You go first":"Your rival goes first",2500); },
  alCambiar(e){ carga(e); } });
function mueve(i,j){ const r=siembra(b,i,j); b=r.b; ult=r.fin; const c=cierra(b); b=c.b;
  if(c.acabada){ fin= b[6]>b[13]?`You won ${b[6]} to ${b[13]}! 🎉`: b[13]>b[6]?`The computer wins ${b[13]} to ${b[6]}`:"It’s a draw!"; if(b[6]>b[13]) J.confeti(); pinta(); return; }
  if(r.otra) J.aviso(j===0?"Last seed in your store: you go again!":"The computer goes again");
  turno = r.otra?j:1-j; pinta();
  if(turno===1) setTimeout(()=>mueve(cpu(),1),700);
}
nueva();
})();
