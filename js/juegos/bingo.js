/* Bingo de 90 bolas */
(function(){
J.paginaJuego({titulo:"Bingo", emoji:"🎱", ficha:"bingo", ins:{
  titulo:"Bingo",
  intro:"Spanish-style bingo with <b>90 balls</b>. You play with your card against three computer players. It’s just a game: there’s no money and no betting.",
  pasos:[
    "Your card has <b>3 rows of 5 numbers</b> each (15 in total).",
    "Press <b>▶️ Start</b>. The drum will draw balls by itself, one every few seconds. You can change the speed.",
    "When a number on your card comes up, <b>tap it</b> to mark it off. If you turn on “Auto-mark”, they are marked automatically.",
    "When you have a whole row marked off, press <b>📣 Line!</b>. Only the first line of the game counts.",
    "When your whole card is marked off, press <b>📣 Bingo!</b> and you win.",
    "If you call without having it, we’ll tell you and nothing happens. But be careful! Your rivals call too."
  ],
  consejos:["Below you can see all the numbers that have come up.","With “Auto-mark” turned off, the game is more exciting: you have to pay attention."]
}});
document.head.append(J.el("style",{},`
.bi{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:18px;max-width:980px;margin:0 auto}
@media(max-width:760px){.bi{grid-template-columns:1fr}}
.bi-carton{display:grid;grid-template-columns:repeat(9,1fr);gap:4px;background:#fff7e6;padding:10px;border-radius:14px;border:4px solid var(--oro);box-shadow:var(--sombra)}
.bi-carton div{aspect-ratio:1;display:grid;place-items:center;border-radius:6px;font-family:var(--titulos);font-size:clamp(.9rem,2.6vw,1.4rem);color:#1b1b2f;min-width:0}
.bi-carton .n{background:#fff;border:1px solid #e8d7b0;cursor:pointer}
.bi-carton .v{background:#f2e3c1}
.bi-carton .t{background:radial-gradient(circle,#e63946 55%,#fff 57%);color:#fff}
.bi-bola{width:110px;height:110px;border-radius:50%;margin:0 auto;display:grid;place-items:center;font-family:var(--titulos);font-size:2.8rem;color:#1b1b2f;background:radial-gradient(circle at 35% 30%,#fff,#ffd166 45%,#f4a261);box-shadow:0 8px 20px rgba(0,0,0,.4)}
.bi-bola.sale{animation:rueda .5s}
.bi-hist{display:grid;grid-template-columns:repeat(10,1fr);gap:2px;margin-top:12px}
.bi-hist span{font-size:.7rem;text-align:center;border-radius:4px;padding:2px 0;background:var(--panel2);color:var(--suave)}
.bi-hist span.s{background:var(--oro);color:#2a1600;font-weight:800}
.bi-r{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.bi-r div{flex:1;min-width:90px;background:var(--panel2);border-radius:10px;padding:6px;text-align:center;font-size:.85rem}
`));
const NOM=["Carlos","Inés","Toni"], AV=["👴","👩‍🦳","🧑"];
let ON=null, me=0, ultLinea=-1;
const escH=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const rn=i=>ON?escH(rivales[i].n):NOM[i], ra=i=>ON?"🙂":AV[i];
let mio, rivales, bolas, salidas, marcados, linea, fin, timer=null, vel=3000, auto=false;
const raiz=J.$("#juego");
function carton(){ // 3 filas × 9 columnas, 5 números por fila, columna k: k*10+1..k*10+10 (1-9 la primera, 80-90 la última)
  while(true){ const filas=[0,1,2].map(()=>J.baraja([0,1,2,3,4,5,6,7,8]).slice(0,5).sort((a,b)=>a-b));
    const porCol=Array(9).fill(0).map((_,k)=>filas.filter(f=>f.includes(k)).length); if(porCol.some(x=>!x)) continue;
    const t=[[],[],[]];
    for(let k=0;k<9;k++){ const lo=k===0?1:k*10, hi=k===8?90:k*10+9; const nums=J.baraja([...Array(hi-lo+1)].map((_,i)=>lo+i)).slice(0,porCol[k]).sort((a,b)=>a-b); let q=0;
      for(let f=0;f<3;f++) t[f][k]= filas[f].includes(k)? nums[q++] : 0; }
    return t; } }
function nueva(){ clearInterval(timer); timer=null; mio=carton(); rivales=NOM.map(()=>({c:carton(),linea:false})); bolas=J.baraja([...Array(90)].map((_,i)=>i+1)); salidas=[]; marcados=new Set(); linea=null; fin=null; pinta(); }
function pinta(){
  raiz.innerHTML=`<div class="bi"><div><div class="bi-carton" id="bi-c"></div>
   <div class="centro-txt" style="margin-top:12px"><button class="btn" id="bi-lin" ${linea?"disabled":""}>📣 Line!</button> <button class="btn" id="bi-bin">📣 Bingo!</button></div></div>
   <div class="panel"><div class="estado" id="bi-est"></div><div class="bi-bola" id="bi-bola">${salidas.length?salidas[salidas.length-1]:"?"}</div>
   <div class="centro-txt" style="margin-top:12px">${ON&&ON.yo!==0?"":`<button class="btn peq" id="bi-go">${timer?"⏸️ Pause":"▶️ "+(salidas.length?"Resume":"Start")}</button>`} ${ON?"":`<button class="btn sec peq" id="bi-nueva">🔄 New</button>`}</div>
   <div class="centro-txt" style="margin-top:8px">${ON&&ON.yo!==0?"":`<select id="bi-vel">`}<option value="4500">Slow</option><option value="3000">Normal</option><option value="1800">Fast</option>${ON&&ON.yo!==0?"":"</select>"} <label><input type="checkbox" id="bi-auto" ${auto?"checked":""}> Auto-mark</label></div>
   <div class="bi-r">${rivales.map((r,i)=>`<div>${ra(i)} ${rn(i)}<br><b>${faltan(r.c)}</b> left to mark</div>`).join("")}</div>
   <div class="bi-hist">${[...Array(90)].map((_,i)=>`<span class="${salidas.includes(i+1)?"s":""}">${i+1}</span>`).join("")}</div></div></div>`;
  mio.forEach((f,fi)=>f.forEach((n,k)=>{ const d=J.el("div",{class:n?(marcados.has(n)?"t":"n"):"v"},n?String(n):""); if(n) d.onclick=()=>marca(n); J.$("#bi-c").append(d); }));
  if(J.$("#bi-vel")){ J.$("#bi-vel").value=vel; J.$("#bi-vel").onchange=e=>{ vel=+e.target.value; if(timer){ clearInterval(timer); timer=setInterval(saca,vel); } }; }
  J.$("#bi-auto").onchange=e=>{ auto=e.target.checked; if(auto) salidas.forEach(n=>{ if(mio.flat().includes(n)) marcados.add(n); }); pinta(); };
  if(J.$("#bi-go")) J.$("#bi-go").onclick=()=>{ if(fin) return; if(timer){ clearInterval(timer); timer=null; } else { timer=setInterval(saca,vel); saca(); } pinta(); };
  if(J.$("#bi-nueva")) J.$("#bi-nueva").onclick=nueva; J.$("#bi-lin").onclick=()=>canta("linea"); J.$("#bi-bin").onclick=()=>canta("bingo");
  J.$("#bi-est").textContent=fin||(linea?`Line for ${linea}. Now go for bingo!`:salidas.length?`Ball ${salidas.length} of 90`:ON&&ON.yo!==0?`Waiting for ${escH(ON.jugadores[0])} to start`:"Press Start"); }
const faltan=c=>c.flat().filter(n=>n&&!salidas.includes(n)).length;
function marca(n){ if(!salidas.includes(n)){ J.aviso(`${n} hasn’t come up yet`); return; } marcados.has(n)?marcados.delete(n):marcados.add(n); pinta(); }
function saca(){ if(fin||!bolas.length){ clearInterval(timer); timer=null; return; }
  if(ON){ ON.enviar(e=>{ if(e.ganador<0&&e.bolas.length) e.salidas.push(e.bolas.pop()); return e; }).then(e=>{ if(e){ carga(e); J.$("#bi-bola").classList.add("sale"); } }); return; } const n=bolas.pop(); salidas.push(n);
  if(auto&&mio.flat().includes(n)) marcados.add(n);
  pinta(); J.$("#bi-bola").classList.add("sale");
  // los rivales cantan con un pequeño retraso
  setTimeout(()=>{ if(fin) return;
    for(let i=0;i<3;i++){ const r=rivales[i];
      if(!linea&&r.c.some(f=>f.filter(Boolean).every(x=>salidas.includes(x)))){ linea=NOM[i]; J.aviso(`${AV[i]} ${NOM[i]}: Line!`,2500); pinta(); }
      if(!faltan(r.c)){ fin=`${AV[i]} ${NOM[i]} calls Bingo! No luck this time`; clearInterval(timer); timer=null; pinta(); return; } } }, Math.min(1400,vel*.6)); }
function canta(t){ if(fin) return; const ok=f=>f.filter(Boolean).every(x=>marcados.has(x)&&salidas.includes(x));
  if(ON){ if(t==="linea"){ if(linea) return; if(!mio.some(ok)) return J.aviso("You don’t have a whole row marked off yet"); ON.enviar(e=>{ if(e.linea<0) e.linea=me; return e; }).then(e=>e&&carga(e)); }
    else { if(!mio.every(ok)) return J.aviso("You still have numbers to mark off"); ON.enviar(e=>{ if(e.ganador<0) e.ganador=me; return e; }).then(e=>e&&carga(e)); } return; }
  if(t==="linea"){ if(linea) return; if(mio.some(ok)){ linea="you"; J.aviso("Correct line! 🎉",2500); J.confeti(40); } else J.aviso("You don’t have a whole row marked off yet"); }
  else { if(mio.every(ok)){ fin="BINGO!! You win 🎉"; clearInterval(timer); timer=null; J.confeti(150); } else J.aviso("You still have numbers to mark off"); }
  pinta(); }
function carga(e){ mio=e.cartones[me]; bolas=e.bolas; salidas=e.salidas; rivales=e.cartones.map((c,i)=>({c,n:ON.jugadores[i],i})).filter(r=>r.i!==me);
  if(auto) salidas.forEach(n=>{ if(mio.flat().includes(n)) marcados.add(n); });
  if(e.linea>=0){ linea= e.linea===me?"you":escH(ON.jugadores[e.linea]); if(ultLinea!==e.linea){ ultLinea=e.linea; J.aviso(e.linea===me?"Correct line! 🎉":`${linea}: Line!`,2500); if(e.linea===me) J.confeti(40); } }
  if(e.ganador>=0&&!fin){ fin= e.ganador===me?"BINGO!! You win 🎉":`${escH(ON.jugadores[e.ganador])} calls Bingo!`; clearInterval(timer); timer=null; if(e.ganador===me) J.confeti(150); }
  const bola=J.$("#bi-bola"), ant=bola&&bola.textContent; pinta(); if(ant&&salidas.length&&ant!==String(salidas[salidas.length-1])) J.$("#bi-bola").classList.add("sale"); }
J.online&&J.online.activar({juego:"bingo", titulo:"Bingo", min:2, max:8,
  inicio(nombres){ return {cartones:nombres.map(()=>carton()),bolas:J.baraja([...Array(90)].map((_,i)=>i+1)),salidas:[],linea:-1,ganador:-1}; },
  alEmpezar(ctx,e){ ON=ctx; me=ctx.yo; clearInterval(timer); timer=null; marcados=new Set(); fin=null; linea=null; carga(e); J.aviso(me===0?"You draw the balls: press Start":"The balls are drawn by "+ctx.jugadores[0],3000); },
  alCambiar(e){ carga(e); } });
nueva();
})();
