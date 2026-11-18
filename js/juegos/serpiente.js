/* Serpiente */
(function(){
J.paginaJuego({titulo:"Snake", emoji:"🐍", ficha:"pong", ins:{
  titulo:"Snake",
  intro:"Guide the snake so it eats apples. Each apple makes it <b>longer</b> and gives you points.",
  pasos:[
    "Move it with the <b>arrow keys</b>, <b>swiping</b> on the board or with the buttons below.",
    "The snake moves on its own: you only change its direction.",
    "Each 🍎 apple is worth 10 points and the snake grows. The longer it gets, the faster it goes.",
    "You lose if you crash into the wall or into your own tail."
  ],
  consejos:["Don’t box yourself in: always leave a way out.","Follow the edges when the snake is very long."]
}});
document.head.append(J.el("style",{},`
.sp-c{display:block;margin:0 auto;background:#0f3b23;border-radius:14px;border:5px solid #1f6b3e;box-shadow:var(--sombra);max-width:100%;touch-action:none}
.sp-ctrl{display:grid;grid-template-columns:repeat(3,64px);grid-template-rows:repeat(2,56px);gap:8px;justify-content:center;margin-top:12px}
.sp-ctrl button{border:0;border-radius:14px;background:var(--panel2);color:var(--texto);font-size:1.5rem;touch-action:manipulation}
`));
const N=20, T=22;
let s, dir, prox, man, pts, fin, vivo=false, timer, mejor=J.lee("serpiente-mejor",0);
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="marcador" style="justify-content:center"><div class="caja"><small>Points</small><b id="sp-p">0</b></div><div class="caja"><small>Best</small><b id="sp-m">${mejor}</b></div><button class="btn peq" id="sp-go" style="align-self:center">▶️ Start</button></div>
<div class="estado" id="sp-est">Press Start</div><canvas class="sp-c" id="sp" width="${N*T}" height="${N*T}"></canvas>
<div class="sp-ctrl"><span></span><button data-d="0,-1">⬆️</button><span></span><button data-d="-1,0">⬅️</button><button data-d="0,1">⬇️</button><button data-d="1,0">➡️</button></div>`;
const cx=J.$("#sp").getContext("2d");
function manzana(){ let p; do{ p=[J.azar(N),J.azar(N)]; }while(s.some(q=>q[0]===p[0]&&q[1]===p[1])); return p; }
function empieza(){ s=[[10,10],[9,10],[8,10]]; dir=[1,0]; prox=[1,0]; pts=0; fin=false; man=manzana(); vivo=true; clearTimeout(timer); paso(); J.$("#sp-go").textContent="🔄 Reiniciar"; }
function paso(){ if(!vivo) return; dir=prox; const c=[s[0][0]+dir[0], s[0][1]+dir[1]];
  if(c[0]<0||c[1]<0||c[0]>=N||c[1]>=N||s.slice(0,-1).some(q=>q[0]===c[0]&&q[1]===c[1])){ vivo=false; fin=true; if(pts>mejor){ mejor=pts; J.guarda("serpiente-mejor",mejor); } pinta(); return; }
  s.unshift(c); if(c[0]===man[0]&&c[1]===man[1]){ pts+=10; man=manzana(); } else s.pop();
  pinta(); timer=setTimeout(paso, Math.max(60,150-s.length*2)); }
function pinta(){ cx.clearRect(0,0,N*T,N*T);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) if((x+y)%2){ cx.fillStyle="rgba(255,255,255,.03)"; cx.fillRect(x*T,y*T,T,T); }
  if(man){ cx.font=`${T-2}px serif`; cx.textAlign="center"; cx.textBaseline="middle"; cx.fillText("🍎",man[0]*T+T/2,man[1]*T+T/2+1); }
  if(s) s.forEach((q,i)=>{ const l=50+Math.max(0,25-i); cx.fillStyle=i?`hsl(140,70%,${l}%)`:"#a3e635"; const r=i?4:7; cx.beginPath(); cx.roundRect(q[0]*T+1,q[1]*T+1,T-2,T-2,r); cx.fill();
    if(!i){ cx.fillStyle="#111"; cx.beginPath(); cx.arc(q[0]*T+T/2+dir[0]*4-dir[1]*4,q[1]*T+T/2+dir[1]*4-dir[0]*4,2.4,0,7); cx.arc(q[0]*T+T/2+dir[0]*4+dir[1]*4,q[1]*T+T/2+dir[1]*4+dir[0]*4,2.4,0,7); cx.fill(); } });
  J.$("#sp-p").textContent=pts||0; J.$("#sp-m").textContent=mejor;
  J.$("#sp-est").textContent=fin?`Crash! You scored ${pts} points`:vivo?"":"Press Start"; }
function gira(d){ if(!vivo) return; if(d[0]===-dir[0]&&d[1]===-dir[1]) return; prox=d; }
J.$("#sp-go").onclick=empieza;
J.$$(".sp-ctrl button").forEach(b=>b.onpointerdown=e=>{ e.preventDefault(); gira(b.dataset.d.split(",").map(Number)); });
document.addEventListener("keydown",e=>{ const d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key]; if(d&&vivo){ e.preventDefault(); gira(d); } });
let x0,y0; const z=J.$("#sp");
z.addEventListener("touchstart",e=>{ x0=e.touches[0].clientX; y0=e.touches[0].clientY; },{passive:true});
z.addEventListener("touchend",e=>{ const dx=e.changedTouches[0].clientX-x0, dy=e.changedTouches[0].clientY-y0; if(Math.max(Math.abs(dx),Math.abs(dy))<20) return; gira(Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)]); });
pinta();
})();
