/* Tenis de mesa */
(function(){
J.paginaJuego({titulo:"Table Tennis", emoji:"🏓", ficha:"pong", ins:{
  titulo:"Table Tennis",
  intro:"A tribute to the first video games: two paddles and a ball. You control the paddle on the <b>izquierda</b> and the computer controls the one on the right.",
  pasos:[
    "Move your paddle up and down with the <b>mouse</b>, your <b>finger</b> on the table or with the arrow keys <b>↑ ↓</b>.",
    "Return the ball. If you hit it with the edge of the paddle, it bounces off at a sharper angle.",
    "Every time your rival misses the ball, you score a point.",
    "The first to reach <b>7 points</b> wins.",
    "The ball gets faster and faster during a rally."
  ],
  consejos:["Hitting with the end of the paddle sends the ball across and makes it harder to return."]
}});
document.head.append(J.el("style",{},`.tm-c{display:block;margin:0 auto;background:#0b4f3a;border-radius:14px;border:5px solid #f1f1f1;box-shadow:var(--sombra);width:100%;max-width:760px;touch-action:none;cursor:none}`));
const W=760,H=440, PH=80, PW=12;
let yo, cpu, b, pts, fin, jugando=false, raf, nivel=2, teclas={};
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="centro-txt" style="margin-bottom:8px"><select id="tm-n"><option value="1">Easy</option><option value="2" selected>Normal</option><option value="3">Hard</option></select> <button class="btn peq" id="tm-go">▶️ Start</button></div>
<div class="estado" id="tm-est">Press Start</div><canvas class="tm-c" id="tm" width="${W}" height="${H}"></canvas>`;
const cx=J.$("#tm").getContext("2d");
J.$("#tm-n").onchange=e=>nivel=+e.target.value;
function saque(hacia){ b={x:W/2,y:H/2,vx:hacia*5,vy:(Math.random()*2-1)*3,r:8}; }
function empieza(){ yo=H/2-PH/2; cpu=H/2-PH/2; pts=[0,0]; fin=null; jugando=true; saque(J.elige([-1,1])); cancelAnimationFrame(raf); raf=requestAnimationFrame(bucle); J.$("#tm-go").textContent="🔄 Restart"; J.$("#tm-est").textContent=""; }
function bucle(){ if(!jugando) return;
  if(teclas.ArrowUp) yo-=8; if(teclas.ArrowDown) yo+=8; yo=Math.max(0,Math.min(H-PH,yo));
  const vel={1:3.2,2:4.8,3:6.6}[nivel], obj=b.vx>0?b.y-PH/2:H/2-PH/2; const err={1:30,2:14,3:4}[nivel];
  if(Math.abs(cpu-obj)>err) cpu+=Math.sign(obj-cpu)*Math.min(vel,Math.abs(cpu-obj)); cpu=Math.max(0,Math.min(H-PH,cpu));
  b.x+=b.vx; b.y+=b.vy; if(b.y<b.r||b.y>H-b.r){ b.vy*=-1; b.y=Math.max(b.r,Math.min(H-b.r,b.y)); }
  const golpe=(px,py)=>{ const rel=(b.y-(py+PH/2))/(PH/2); const v=Math.min(16,Math.hypot(b.vx,b.vy)*1.05); const ang=rel*1.0; const sgn=b.vx<0?1:-1; b.vx=sgn*v*Math.cos(ang); b.vy=v*Math.sin(ang); };
  if(b.vx<0&&b.x-b.r<=24+PW&&b.x-b.r>=24-6&&b.y>yo-4&&b.y<yo+PH+4){ golpe(24,yo); b.x=24+PW+b.r; }
  if(b.vx>0&&b.x+b.r>=W-24-PW&&b.x+b.r<=W-24+6&&b.y>cpu-4&&b.y<cpu+PH+4){ golpe(W-24,cpu); b.x=W-24-PW-b.r; }
  if(b.x<-20){ pts[1]++; saque(1); } if(b.x>W+20){ pts[0]++; saque(-1); }
  if(pts[0]===7||pts[1]===7){ jugando=false; fin=pts[0]===7?"You won! 🎉":"The computer wins"; if(pts[0]===7) J.confeti(); J.$("#tm-est").textContent=fin; }
  pinta(); if(jugando) raf=requestAnimationFrame(bucle); }
function pinta(){ cx.clearRect(0,0,W,H); cx.strokeStyle="rgba(255,255,255,.6)"; cx.lineWidth=3; cx.setLineDash([12,12]); cx.beginPath(); cx.moveTo(W/2,0); cx.lineTo(W/2,H); cx.stroke(); cx.setLineDash([]);
  cx.fillStyle="rgba(255,255,255,.85)"; cx.font="bold 54px Fredoka, sans-serif"; cx.textAlign="center"; cx.fillText(pts?pts[0]:0,W/2-70,64); cx.fillText(pts?pts[1]:0,W/2+70,64);
  cx.fillStyle="#ffc94a"; cx.fillRect(24,yo??H/2-PH/2,PW,PH); cx.fillStyle="#4cc9f0"; cx.fillRect(W-24-PW,cpu??H/2-PH/2,PW,PH);
  if(b){ cx.fillStyle="#fff"; cx.beginPath(); cx.arc(b.x,b.y,b.r,0,7); cx.fill(); } }
const c=J.$("#tm");
const pos=y=>{ const r=c.getBoundingClientRect(); yo=Math.max(0,Math.min(H-PH,(y-r.top)/r.height*H-PH/2)); };
c.addEventListener("pointermove",e=>pos(e.clientY)); c.addEventListener("touchmove",e=>{ e.preventDefault(); pos(e.touches[0].clientY); },{passive:false});
document.addEventListener("keydown",e=>{ if(e.key==="ArrowUp"||e.key==="ArrowDown"){ if(jugando) e.preventDefault(); teclas[e.key]=true; } });
document.addEventListener("keyup",e=>{ teclas[e.key]=false; });
J.$("#tm-go").onclick=empieza;
pinta();
})();
