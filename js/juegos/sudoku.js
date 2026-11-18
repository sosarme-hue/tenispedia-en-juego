/* Sudoku */
(function(){
J.paginaJuego({titulo:"Sudoku", emoji:"🔢", ficha:"sudoku", ins:{
  titulo:"Sudoku",
  intro:"A 9 × 9 board divided into 9 boxes of 3 × 3. Some numbers are already filled in.",
  pasos:["Tap an empty square to select it.","Press a number from 1 to 9 on the keypad below (or on your keyboard) to write it. Use ⌫ to delete it.","Each <b>row</b>, each <b>column</b> and each <b>3 × 3 box</b> must contain the numbers 1 to 9 with no repeats.","Repeated numbers are marked in red so you can see the mistake.","Turn on <b>✏️ Notes</b> to jot down small numbers you’re not sure about.","When the board is complete with no mistakes, you’ve won!"],
  consejos:["Look for rows, columns or boxes that are only missing a few numbers.","If a number only fits in one square of a box, put it there."]
}});
document.head.append(J.el("style",{},`.su{display:grid;grid-template-columns:repeat(9,1fr);max-width:480px;margin:0 auto;border:3px solid #fff;border-radius:8px;overflow:hidden;background:#fff}
.su div{aspect-ratio:1;display:grid;place-items:center;background:#f4f6ff;color:#1d4ed8;font-family:var(--titulos);font-size:clamp(16px,4.5vw,28px);cursor:pointer;border-right:1px solid #c5cbe8;border-bottom:1px solid #c5cbe8;position:relative}
.su div.fijo{color:#111;font-weight:700}.su div.c3{border-right:3px solid #1b2556}.su div.f3{border-bottom:3px solid #1b2556}
.su div.rel{background:#e1e7ff}.su div.mismo{background:#c9d4ff}.su div.sel{background:#ffd60a}.su div.err{color:#e63946}
.su .notas{display:grid;grid-template-columns:repeat(3,1fr);width:100%;height:100%;font-size:clamp(7px,1.6vw,11px);color:#555;font-family:var(--cuerpo)}
.su .notas span{display:grid;place-items:center}
.teclado{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;max-width:480px;margin:12px auto 0}
.teclado button{padding:12px 0;border-radius:12px;border:0;background:var(--panel2);color:var(--texto);font-family:var(--titulos);font-size:1.4rem;cursor:pointer}
.teclado button.act{background:var(--oro);color:#241500}`));
let sol, ini, val, notas, sel=-1, modoNotas=false, nivel=40, errores=0, t0, reloj;
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="marcador" style="justify-content:center"><div class="caja"><small>Time</small><b id="su-t">0:00</b></div><div class="caja"><small>Mistakes</small><b id="su-e">0</b></div></div>
<div class="centro-txt" style="margin-bottom:10px"><select id="niv"><option value="34">Easy</option><option value="44" selected>Medium</option><option value="52">Hard</option><option value="58">Expert</option></select> <button class="btn peq" id="nueva">🔄 New</button> <button class="btn sec peq" id="pista">💡 Hint</button></div>
<div class="su" id="su"></div><div class="teclado" id="tec"></div>`;
J.$("#tec").innerHTML=[1,2,3,4,5,6,7,8,9].map(n=>`<button data-n="${n}">${n}</button>`).join("")+`<button data-n="0">⌫</button><button id="b-notas" style="grid-column:span 5;font-size:1rem">✏️ Notes: OFF</button>`;
J.$$("#tec [data-n]").forEach(b=>b.onclick=()=>pon(+b.dataset.n));
J.$("#b-notas").onclick=()=>{ modoNotas=!modoNotas; J.$("#b-notas").textContent="✏️ Notes: "+(modoNotas?"ON":"OFF"); J.$("#b-notas").classList.toggle("act",modoNotas); };
J.$("#niv").onchange=e=>{ nivel=+e.target.value; nueva(); }; J.$("#nueva").onclick=nueva;
J.$("#pista").onclick=()=>{ const vac=val.map((v,i)=>v!==sol[i]?i:-1).filter(i=>i>=0); if(!vac.length) return; const i=sel>=0&&val[sel]!==sol[sel]?sel:J.elige(vac); val[i]=sol[i]; ini[i]=true; sel=i; pinta(); compr(); };
document.addEventListener("keydown",e=>{ if(e.key>="1"&&e.key<="9") pon(+e.key); if(e.key==="Backspace"||e.key==="Delete") pon(0);
  const mv={ArrowRight:1,ArrowLeft:-1,ArrowDown:9,ArrowUp:-9}[e.key]; if(mv&&sel>=0){ e.preventDefault(); sel=Math.max(0,Math.min(80,sel+mv)); pinta(); } });
const fila=i=>Math.floor(i/9), col=i=>i%9, caja=i=>Math.floor(fila(i)/3)*3+Math.floor(col(i)/3);
const rel=(a,b)=>a!==b&&(fila(a)===fila(b)||col(a)===col(b)||caja(a)===caja(b));
function llena(g){ const i=g.indexOf(0); if(i<0) return true; for(const n of J.baraja([1,2,3,4,5,6,7,8,9])){ if(g.every((v,j)=>!(v===n&&rel(i,j)))){ g[i]=n; if(llena(g)) return true; g[i]=0; } } return false; }
function cuenta(g,lim=2){ const i=g.indexOf(0); if(i<0) return 1; let c=0; for(let n=1;n<=9;n++){ if(g.every((v,j)=>!(v===n&&rel(i,j)))){ g[i]=n; c+=cuenta(g,lim); g[i]=0; if(c>=lim) break; } } return c; }
function nueva(){
  const g=Array(81).fill(0); llena(g); sol=[...g];
  const p=[...g]; let quit=0;
  for(const i of J.baraja([...Array(81).keys()])){ if(quit>=nivel) break; const v=p[i]; p[i]=0; if(cuenta([...p])!==1) p[i]=v; else quit++; }
  val=[...p]; ini=p.map(Boolean); notas=Array.from({length:81},()=>new Set()); sel=-1; errores=0;
  t0=Date.now(); clearInterval(reloj); reloj=setInterval(()=>{ const s=Math.floor((Date.now()-t0)/1000); J.$("#su-t").textContent=Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); },1000);
  pinta();
}
function pon(n){ if(sel<0||ini[sel]) return;
  if(modoNotas&&n){ notas[sel].has(n)?notas[sel].delete(n):notas[sel].add(n); return pinta(); }
  val[sel]=n; notas[sel].clear(); if(n&&n!==sol[sel]){ errores++; }
  if(n) val.forEach((v,j)=>{ if(rel(sel,j)) notas[j].delete(n); });
  pinta(); compr(); }
function compr(){ if(val.every((v,i)=>v===sol[i])){ clearInterval(reloj); J.confeti(150); J.modal(`<h2>🏆 Sudoku solved!</h2><p>Time: ${J.$("#su-t").textContent} · Mistakes: ${errores}</p>`,[{txt:"Another sudoku"}]).then(nueva); } }
function pinta(){
  J.$("#su-e").textContent=errores;
  J.$("#su").innerHTML=val.map((v,i)=>{ const err=v&&val.some((w,j)=>w===v&&rel(i,j));
    const cls=[ini[i]?"fijo":"", col(i)%3===2&&col(i)<8?"c3":"", fila(i)%3===2&&fila(i)<8?"f3":"", sel===i?"sel":sel>=0&&rel(sel,i)?"rel":"", sel>=0&&v&&val[sel]===v&&sel!==i?"mismo":"", err&&!ini[i]?"err":""].join(" ");
    const cont= v?v: notas[i].size?`<div class="notas">${[1,2,3,4,5,6,7,8,9].map(n=>`<span>${notas[i].has(n)?n:""}</span>`).join("")}</div>`:"";
    return `<div data-i="${i}" class="${cls}">${cont}</div>`; }).join("");
  J.$$("#su div[data-i]").forEach(d=>d.onclick=()=>{ sel=+d.dataset.i; pinta(); });
}
nueva();
})();
