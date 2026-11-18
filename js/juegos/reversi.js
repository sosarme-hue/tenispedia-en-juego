/* Reversi */
(function(){
J.paginaJuego({titulo:"Reversi", emoji:"⚪", ficha:"reversi", ins:{
  titulo:"Reversi",
  intro:"An 8×8 board and discs that are white on one side and black on the other. The player with the most discs of their colour at the end wins.",
  pasos:[
    "You play <b>black ⚫</b> and go first. The computer has white ⚪.",
    "You can only place a disc on a square that <b>traps</b> rival discs in a straight line (horizontal, vertical or diagonal) between the new disc and another of yours.",
    "All the trapped discs <b>are flipped over</b> and become yours.",
    "The squares where you can play are marked with a dot. Tap one to place your disc.",
    "If you have no possible move, you pass your turn automatically.",
    "The game ends when neither player can move. The player with the most discs wins."
  ],
  consejos:["The <b>corners</b> are the best squares: they can never be flipped.","Avoid the squares next to an empty corner: they hand the corner to your rival.","Having few discs at the start isn’t bad: what matters is having moves available."]
}});
document.head.append(J.el("style",{},`
.rv{display:grid;grid-template-columns:repeat(8,1fr);gap:3px;background:#0b3d23;padding:8px;border-radius:16px;max-width:560px;margin:0 auto;box-shadow:var(--sombra);border:6px solid #5a3a1a}
.rv div{aspect-ratio:1;background:radial-gradient(circle at 50% 40%,#1f8a52,#147041);border-radius:6px;display:grid;place-items:center;cursor:pointer;min-width:0}
.rv span{width:82%;height:82%;border-radius:50%;transition:transform .3s}
.rv .n span{background:radial-gradient(circle at 35% 30%,#555,#0a0a0a);box-shadow:0 3px 5px rgba(0,0,0,.5)}
.rv .b span{background:radial-gradient(circle at 35% 30%,#fff,#cfcfcf);box-shadow:0 3px 5px rgba(0,0,0,.5)}
.rv .pos::after{content:"";width:26%;height:26%;border-radius:50%;background:rgba(255,255,255,.35)}
.rv .ult span{outline:3px solid var(--oro);outline-offset:1px}
`));
const raiz=J.$("#juego"); let t, turno, nivel=2, fin=false, ult=-1;
raiz.innerHTML=`<div class="centro-txt" style="margin-bottom:10px"><select id="rv-n"><option value="1">Easy</option><option value="2" selected>Normal</option><option value="3">Hard</option></select> <button class="btn peq" id="rv-nueva">🔄 New game</button></div>
<div class="marcador" style="justify-content:center"><div class="caja"><small>⚫ You</small><b id="rv-n1">2</b></div><div class="caja"><small>⚪ Computer</small><b id="rv-n2">2</b></div></div>
<div class="estado" id="rv-est"></div><div class="rv" id="rv"></div>`;
J.$("#rv-n").onchange=e=>{nivel=+e.target.value;nueva();}; J.$("#rv-nueva").onclick=()=>{ if(ON){ nueva(); ON.enviar({t,turno,ult}); } else nueva(); };
let ON=null, mc=1;
const D=[-9,-8,-7,-1,1,7,8,9];
function volteos(b,i,c){ if(b[i]) return []; const r=[];
  for(const d of D){ let k=i, linea=[];
    while(true){ const f=k>>3, cc=k&7; const nk=k+d; const nf=nk>>3, nc=nk&7; if(nk<0||nk>63||Math.abs(nc-cc)>1) break; k=nk;
      if(b[k]===3-c) linea.push(k); else { if(b[k]===c&&linea.length) r.push(...linea); break; } } }
  return r; }
function jugadas(b,c){ const r=[]; for(let i=0;i<64;i++) if(!b[i]&&volteos(b,i,c).length) r.push(i); return r; }
function aplica(b,i,c){ const v=volteos(b,i,c); const n=b.slice(); n[i]=c; v.forEach(k=>n[k]=c); return n; }
const PES=[100,-20,10,5,5,10,-20,100,-20,-50,-2,-2,-2,-2,-50,-20,10,-2,1,1,1,1,-2,10,5,-2,1,0,0,1,-2,5,5,-2,1,0,0,1,-2,5,10,-2,1,1,1,1,-2,10,-20,-50,-2,-2,-2,-2,-50,-20,100,-20,10,5,5,10,-20,100];
function eval_(b){ let s=0; for(let i=0;i<64;i++){ if(b[i]===2) s+=PES[i]; else if(b[i]===1) s-=PES[i]; } s+=5*(jugadas(b,2).length-jugadas(b,1).length); return s; }
function ab(b,p,a,be,c){ const js=jugadas(b,c);
  if(p===0) return eval_(b);
  if(!js.length){ if(!jugadas(b,3-c).length){ const d=b.filter(x=>x===2).length-b.filter(x=>x===1).length; return d*1000; } return ab(b,p-1,a,be,3-c); }
  for(const i of js){ const v=ab(aplica(b,i,c),p-1,a,be,3-c); if(c===2){ if(v>a)a=v; } else { if(v<be)be=v; } if(a>=be) break; }
  return c===2?a:be; }
function cpu(){ const js=jugadas(t,2); if(nivel===1&&Math.random()<.5) return J.elige(js);
  const p={1:1,2:3,3:5}[nivel]; let best=-1e9,mv=js[0]; for(const i of js){ const v=ab(aplica(t,i,2),p-1,-1e9,1e9,1)+Math.random(); if(v>best){best=v;mv=i;} } return mv; }
function nueva(){ t=Array(64).fill(0); t[27]=t[36]=2; t[28]=t[35]=1; turno=1; fin=false; ult=-1; pinta(); }
function pinta(){ const pos=turno===mc&&!fin?jugadas(t,mc):[];
  J.$("#rv").innerHTML=t.map((v,i)=>`<div data-i="${i}" class="${v===1?"n":v===2?"b":""} ${pos.includes(i)?"pos":""} ${i===ult?"ult":""}">${v?"<span></span>":""}</div>`).join("");
  J.$$("#rv div").forEach(d=>d.onclick=()=>juega(+d.dataset.i));
  const n1=t.filter(x=>x===1).length,n2=t.filter(x=>x===2).length; J.$("#rv-n1").textContent=n1; J.$("#rv-n2").textContent=n2;
  J.$("#rv-est").textContent= fin || (ON?(turno===mc?"Your turn: choose a square with a dot":"Turn: "+ON.jugadores[turno-1]): turno===1?"Your turn: choose a square with a dot":"The computer is thinking…"); }
function juega(i){ if(fin||turno!==mc||!volteos(t,i,mc).length) return; t=aplica(t,i,mc); ult=i;
  if(ON){ const n=proximo(3-mc); const e={t,turno:n,ult}; ON.enviar(e); carga(e); return; } siguiente(2); }
function proximo(c){ if(!jugadas(t,1).length&&!jugadas(t,2).length) return 0; return jugadas(t,c).length?c:3-c; }
function carga(e){ const pas=turno; t=e.t; turno=e.turno; ult=e.ult; fin=false; if(!turno) return termina(); if(turno===mc&&pas===mc&&e.ult>=0&&t[e.ult]===mc) J.aviso("Your rival has no move: they pass"); pinta(); }
function siguiente(c){
  if(!jugadas(t,1).length&&!jugadas(t,2).length) return termina();
  if(!jugadas(t,c).length){ J.aviso(c===1?"You have no move: you pass":"The computer can’t move and passes"); c=3-c; }
  turno=c; pinta();
  if(c===2) setTimeout(()=>{ const i=cpu(); t=aplica(t,i,2); ult=i; siguiente(1); },450);
}
function termina(){ const n1=t.filter(x=>x===1).length,n2=t.filter(x=>x===2).length;
  if(ON){ const yo=mc===1?n1:n2, el=mc===1?n2:n1; fin= yo>el?"You won "+yo+" to "+el+"! 🎉": el>yo?ON.jugadores[2-mc]+" wins "+el+" to "+yo:"It’s a draw!"; if(yo>el) J.confeti(); pinta(); return; }
  fin= n1>n2?`You won ${n1} to ${n2}! 🎉`: n2>n1?`The computer wins ${n2} to ${n1}`:"It’s a draw!"; if(n1>n2) J.confeti(); pinta(); }
J.online&&J.online.activar({juego:"reversi", titulo:"Reversi", min:2, max:2,
  inicio(){ nueva(); return {t,turno:1,ult:-1}; },
  alEmpezar(ctx,e){ ON=ctx; mc=ctx.yo+1; J.$("#rv-n").parentNode.style.display="none";
    J.$("#rv-n1").previousElementSibling.textContent="⚫ "+ctx.jugadores[0]; J.$("#rv-n2").previousElementSibling.textContent="⚪ "+ctx.jugadores[1];
    carga(e); J.aviso(mc===1?"You play black and go first":"You play white",3000); },
  alCambiar(e){ carga(e); } });
nueva();
})();
