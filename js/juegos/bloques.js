/* Bloques — piezas que caen */
(function(){
J.paginaJuego({titulo:"Blocks", emoji:"🧱", ficha:"tetris", ins:{
  titulo:"Blocks",
  intro:"Pieces made of 4 squares fall down. Place them to complete <b>whole rows</b>: each complete row disappears and gives you points.",
  pasos:[
    "<b>← →</b> move the piece sideways. <b>↑</b> rotates it. <b>↓</b> drops it faster. The <b>space bar</b> drops it all the way down at once.",
    "On a phone, use the buttons below the board.",
    "When you complete a row from side to side, it disappears and everything above drops down.",
    "Completing several rows at once gives many more points: 1 row 100, 2 rows 300, 3 rows 500 and 4 rows 800.",
    "Every 10 rows you go up a level and pieces fall faster.",
    "The game ends when the pieces reach the very top."
  ],
  consejos:["Leave a gap on one side for the long piece and clear 4 rows at once.","Look at the next piece (on the right) to plan ahead."]
}});
document.head.append(J.el("style",{},`
.bl{display:flex;gap:16px;justify-content:center;align-items:flex-start;flex-wrap:wrap}
.bl canvas{background:#0b1028;border-radius:12px;border:4px solid #2a3166;box-shadow:var(--sombra);max-width:100%;touch-action:none}
.bl-lado{display:flex;flex-direction:column;gap:10px;min-width:130px}
.bl-ctrl{display:grid;grid-template-columns:repeat(4,64px);gap:8px;justify-content:center;margin-top:12px}
.bl-ctrl button{height:56px;font-size:1.5rem;border-radius:14px;border:0;background:var(--panel2);color:var(--texto);touch-action:manipulation}
`));
const W=10,H=20,T=28;
const PIEZAS={I:[[1,1,1,1]],O:[[1,1],[1,1]],T:[[0,1,0],[1,1,1]],S:[[0,1,1],[1,1,0]],Z:[[1,1,0],[0,1,1]],J:[[1,0,0],[1,1,1]],L:[[0,0,1],[1,1,1]]};
const COL={I:"#22d3ee",O:"#facc15",T:"#c084fc",S:"#4ade80",Z:"#fb7185",J:"#60a5fa",L:"#fb923c"};
let tab, pz, sig, pts, lineas, nivel, fin, pausa, ultimo, acum, raf, mejor=J.lee("bloques-mejor",0);
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="bl"><canvas id="bl-c" width="${W*T}" height="${H*T}"></canvas>
<div class="bl-lado"><div class="panel"><small style="color:var(--suave)">NEXT</small><canvas id="bl-s" width="112" height="70" style="border:0;box-shadow:none"></canvas></div>
<div class="marcador" style="flex-direction:column;margin:0"><div class="caja"><small>Points</small><b id="bl-p">0</b></div><div class="caja"><small>Rows</small><b id="bl-l">0</b></div><div class="caja"><small>Level</small><b id="bl-n">1</b></div><div class="caja"><small>Best</small><b id="bl-m">${mejor}</b></div></div>
<button class="btn" id="bl-go">▶️ Start</button><button class="btn sec peq" id="bl-pausa">⏸️ Pause</button></div></div>
<div class="estado" id="bl-est"></div>
<div class="bl-ctrl"><button data-k="izq">◀️</button><button data-k="gira">🔄</button><button data-k="der">▶️</button><button data-k="baja">⏬</button></div>`;
const cx=J.$("#bl-c").getContext("2d"), sx=J.$("#bl-s").getContext("2d");
const gira=m=>m[0].map((_,c)=>m.map(f=>f[c]).reverse());
const nuevaPieza=()=>{ const k=J.elige(Object.keys(PIEZAS)); return {k,m:PIEZAS[k],x:0,y:0}; };
function choca(p,dx=0,dy=0,m=p.m){ for(let f=0;f<m.length;f++) for(let c=0;c<m[f].length;c++){ if(!m[f][c]) continue; const x=p.x+c+dx,y=p.y+f+dy; if(x<0||x>=W||y>=H||(y>=0&&tab[y][x])) return true; } return false; }
function sale(){ pz=sig||nuevaPieza(); sig=nuevaPieza(); pz.x=Math.floor((W-pz.m[0].length)/2); pz.y=-1; if(choca(pz)){ fin=true; pinta(); } }
function empieza(){ tab=[...Array(H)].map(()=>Array(W).fill(null)); pts=0; lineas=0; nivel=1; fin=false; pausa=false; sig=null; sale(); acum=0; ultimo=performance.now(); cancelAnimationFrame(raf); raf=requestAnimationFrame(bucle); J.$("#bl-go").textContent="🔄 Restart"; }
function fija(){ pz.m.forEach((f,fi)=>f.forEach((v,c)=>{ if(v&&pz.y+fi>=0) tab[pz.y+fi][pz.x+c]=COL[pz.k]; }));
  if(pz.y<0){ fin=true; }
  let n=0; for(let y=H-1;y>=0;y--){ if(tab[y].every(Boolean)){ tab.splice(y,1); tab.unshift(Array(W).fill(null)); n++; y++; } }
  if(n){ pts+=[0,100,300,500,800][n]*nivel; lineas+=n; nivel=1+Math.floor(lineas/10); if(n===4) J.aviso("Four rows at once! 🎉"); }
  if(pts>mejor){ mejor=pts; J.guarda("bloques-mejor",mejor); }
  if(!fin) sale(); }
function accion(k){ if(fin||pausa||!pz) return;
  if(k==="izq"&&!choca(pz,-1)) pz.x--; if(k==="der"&&!choca(pz,1)) pz.x++;
  if(k==="abajo"){ if(!choca(pz,0,1)){ pz.y++; pts++; } else fija(); }
  if(k==="gira"){ const m=gira(pz.m); for(const dx of [0,-1,1,-2,2]){ if(!choca(pz,dx,0,m)){ pz.m=m; pz.x+=dx; break; } } }
  if(k==="baja"){ while(!choca(pz,0,1)){ pz.y++; pts+=2; } fija(); }
  pinta(); }
function bucle(t){ if(!fin&&!pausa){ acum+=t-ultimo; const v=Math.max(80,800-(nivel-1)*70); if(acum>v){ acum=0; if(!choca(pz,0,1)) pz.y++; else fija(); pinta(); } }
  ultimo=t; if(!fin) raf=requestAnimationFrame(bucle); }
function cuadro(c,x,y,col,t=T){ c.fillStyle=col; c.fillRect(x*t+1,y*t+1,t-2,t-2); c.fillStyle="rgba(255,255,255,.28)"; c.fillRect(x*t+1,y*t+1,t-2,5); c.fillStyle="rgba(0,0,0,.2)"; c.fillRect(x*t+1,y*t+t-6,t-2,5); }
function pinta(){ cx.clearRect(0,0,W*T,H*T);
  cx.strokeStyle="rgba(255,255,255,.04)"; for(let x=0;x<=W;x++){ cx.beginPath(); cx.moveTo(x*T,0); cx.lineTo(x*T,H*T); cx.stroke(); }
  if(tab) tab.forEach((f,y)=>f.forEach((v,x)=>{ if(v) cuadro(cx,x,y,v); }));
  if(pz&&!fin){ let g=0; while(!choca(pz,0,g+1)) g++; pz.m.forEach((f,fi)=>f.forEach((v,c)=>{ if(v&&pz.y+fi+g>=0){ cx.strokeStyle=COL[pz.k]; cx.strokeRect((pz.x+c)*T+3,(pz.y+fi+g)*T+3,T-6,T-6); } }));
    pz.m.forEach((f,fi)=>f.forEach((v,c)=>{ if(v&&pz.y+fi>=0) cuadro(cx,pz.x+c,pz.y+fi,COL[pz.k]); })); }
  sx.clearRect(0,0,112,70); if(sig) sig.m.forEach((f,fi)=>f.forEach((v,c)=>{ if(v) cuadro(sx,c+(4-sig.m[0].length)/2,fi+.4,COL[sig.k],24); }));
  J.$("#bl-p").textContent=pts||0; J.$("#bl-l").textContent=lineas||0; J.$("#bl-n").textContent=nivel||1; J.$("#bl-m").textContent=mejor;
  J.$("#bl-est").textContent= fin?`Game over! ${pts} points`: pausa?"Paused": pz?"":"Press Start"; }
J.$("#bl-go").onclick=empieza;
J.$("#bl-pausa").onclick=()=>{ if(fin||!pz) return; pausa=!pausa; ultimo=performance.now(); pinta(); };
J.$$(".bl-ctrl button").forEach(b=>{ let rep; const k=b.dataset.k; b.onpointerdown=e=>{ e.preventDefault(); accion(k); if(k==="izq"||k==="der") rep=setInterval(()=>accion(k),120); }; b.onpointerup=b.onpointerleave=()=>clearInterval(rep); });
document.addEventListener("keydown",e=>{ const k={ArrowLeft:"izq",ArrowRight:"der",ArrowUp:"gira",ArrowDown:"abajo"," ":"baja"}[e.key]; if(k&&pz&&!fin){ e.preventDefault(); accion(k); } });
pinta();
})();
