/* Senet (reglas reconstruidas) */
(function(){
J.paginaJuego({titulo:"Senet", emoji:"☥", ficha:"senet", ins:{
  titulo:"Senet",
  intro:"The board game of the pharaohs, more than 5,000 years old. No Egyptian rulebook survives, so we play a <b>modern reconstruction</b> based on the proposals of Timothy Kendall and R. C. Bell. Each player has <b>5 pieces</b> and the first to bear them all off the board wins.",
  pasos:[
    "The board has 30 squares in three rows that you travel in an S shape: the top one to the right, the middle one to the left and the bottom one to the right.",
    "At the start the pieces alternate on the first 10 squares: yours are the <b>light cones</b> and your rival’s are the <b>dark spools</b>.",
    "Press <b>Throw sticks</b>. The sticks that land light side up are counted: from 1 to 4. If none lands light side up, it counts as <b>5</b>. With 1, 4 or 5 you throw again.",
    "Move a piece forward. You can’t land on one of your own. If you land on a <b>lone</b> rival piece, you <b>swap</b> squares. Two rival pieces in a row protect each other, and three in a row can’t be jumped.",
    "Every piece must stop on the <b>House of Beauty</b> ✨ (square 26) before going on. There and on the following squares nobody can be attacked.",
    "From 26: with 5 you leave the board; with 1 you fall into the <b>Water</b> 🌊 and go back to the <b>House of Rebirth</b> ☥ (square 15); with 2, 3 or 4 you go to squares 28, 29 or 30.",
    "From 28 you exit with a 3, from 29 with a 2 and from 30 with a 1. If you can’t move any piece, you lose your turn."
  ],
  consejos:["Keep pieces in pairs: that way your rival can’t swap with them.","Three pieces in a row form a wall your rival can’t jump.","Reach the House of Beauty early, but watch out for the 1 that throws you into the Water."]
}});
document.head.append(J.el("style",{},`
.sn{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;max-width:720px;margin:0 auto;padding:10px;border-radius:12px;background:linear-gradient(135deg,#6b3f1d,#3d2410);box-shadow:var(--sombra)}
.sn .c{aspect-ratio:1;border-radius:5px;background:linear-gradient(160deg,#f1dfb5,#d2b47c);position:relative;display:flex;align-items:center;justify-content:center;min-width:0}
.sn .c .n{position:absolute;top:1px;left:3px;font-size:.55rem;color:#7a5a30;opacity:.8}
.sn .c .ic{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:clamp(.8rem,3vw,1.5rem);color:#8b3a1a;opacity:.55;font-family:var(--titulos);pointer-events:none}
.sn .c.pos{box-shadow:inset 0 0 0 3px var(--oro);cursor:pointer}
.sn .f{width:70%;height:78%;position:relative;z-index:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.5))}
.sn .f.mov{cursor:pointer;outline:3px solid var(--oro);outline-offset:1px;border-radius:6px}
.sn-pal{display:flex;gap:6px;justify-content:center;align-items:center;margin:12px 0;flex-wrap:wrap;min-height:54px}
.sn-pal i{display:block;width:12px;height:50px;border-radius:6px;border:2px solid #3d2410}
.sn-res{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:6px 0}
`));
const raiz=J.$("#juego");
const FUERA=31, ICON={15:"☥",26:"✨",27:"🌊",28:"III",29:"II",30:"☀"};
let S, ON=null, me=0, nivel=2, ocupado=false, gen=0;
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nm=j=>j===me?"You":ON?esc(ON.jugadores[j]):"The computer";
const nuevo=()=>({f:[[1,3,5,7,9],[2,4,6,8,10]],turno:0,pal:null,fin:-1});
const lanza=()=>[0,1,2,3].map(()=>J.azar(2));
const valor=p=>{ const c=p.reduce((a,b)=>a+b,0); return c||5; };
const otraVez=n=>n===1||n===4||n===5;
const quien=(st,c)=>st.f[0].includes(c)?0:st.f[1].includes(c)?1:-1;
function destino(st,s,p,n){
  if(p===FUERA) return null;
  if(p<26){ const t=p+n; if(t>26) return null;
    // bloqueo: tres rivales seguidos en el camino
    let fila=0; for(let c=p+1;c<t;c++){ if(quien(st,c)===1-s){ fila++; if(fila>=3) return null; } else fila=0; }
    const q=quien(st,t); if(q===s) return null;
    if(q===1-s){ if(t>=26) return null; if(quien(st,t-1)===1-s||quien(st,t+1)===1-s) return null; }
    return t; }
  if(p===26){ if(n===5) return FUERA; const t=26+n; if(n===1) return 27; const q=quien(st,t); if(q>=0) return null; return t; }
  return n===31-p?FUERA:null; }
function movimientos(st,s,n){ const r=[]; st.f[s].forEach((p,i)=>{ const t=destino(st,s,p,n); if(t!==null) r.push({i,de:p,a:t}); }); return r; }
function aplica(st,s,m){ const n=JSON.parse(JSON.stringify(st)); let ev="";
  if(m.a===27){ let c=15; while(c>0&&quien(n,c)>=0) c--; if(c===0){ c=16; while(quien(n,c)>=0) c++; } n.f[s][m.i]=c; ev="agua"; }
  else { const q=m.a<=30?quien(n,m.a):-1; if(q===1-s){ const k=n.f[q].indexOf(m.a); n.f[q][k]=m.de; ev="cambio"; } n.f[s][m.i]=m.a; }
  const v=valor(n.pal); n.pal=null;
  if(n.f[s].every(p=>p===FUERA)){ n.fin=s; return {n,ev}; }
  if(!otraVez(v)) n.turno=1-s; return {n,ev}; }
function puntua(st,s,m,v){ const r=aplica(st,s,m); let x=(m.a===FUERA?12:m.a===27?-14:m.a-m.de);
  if(r.ev==="cambio") x+=8+m.a/4; if(m.a===26) x+=6; if(m.a===FUERA) x+=10;
  const mia=r.n.f[s]; const solo=c=>c<26&&!mia.includes(c-1)&&!mia.includes(c+1);
  if(m.a<26&&solo(m.a)) x-=4; if(m.a<26&&!solo(m.a)) x+=2;
  // dejar sola a una compañera
  [m.de-1,m.de+1].forEach(c=>{ if(c>0&&c<26&&mia.includes(c)&&solo(c)) x-=2; });
  return x; }
function eligeCPU(st,s){ const n=valor(st.pal); const ms=movimientos(st,s,n); if(!ms.length) return null;
  if(nivel===1&&Math.random()<.5) return J.elige(ms);
  let best=-1e9,mv=ms[0]; ms.forEach(m=>{ const v=puntua(st,s,m)+Math.random()*(nivel===3?.3:3); if(v>best){ best=v; mv=m; } }); return mv; }

raiz.innerHTML=`<div class="centro-txt" style="margin-bottom:8px"><select id="sn-n"><option value="1">Easy</option><option value="2" selected>Normal</option><option value="3">Hard</option></select> <button class="btn sec peq" id="sn-nueva">🔄 New game</button></div>
<div class="sn-res" id="sn-res"></div><div class="estado" id="sn-est"></div><div class="sn" id="sn"></div><div class="sn-pal" id="sn-pal"></div>`;
J.$("#sn-n").onchange=e=>{ nivel=+e.target.value; };
J.$("#sn-nueva").onclick=()=>{ if(ON&&ON.yo!==0) return J.aviso("The new game is started by whoever created the room"); nueva(); };
const cono=`<svg class="f" viewBox="0 0 30 34"><path d="M15 2 L26 30 Q15 34 4 30 Z" fill="#f4ecd8" stroke="#6b5a3a" stroke-width="2"/><ellipse cx="15" cy="8" rx="3" ry="2" fill="#b9a37b"/></svg>`;
const carrete=`<svg class="f" viewBox="0 0 30 34"><path d="M5 3 H25 L19 17 L25 31 H5 L11 17 Z" fill="#2a1a10" stroke="#000" stroke-width="2"/><rect x="5" y="2" width="20" height="4" rx="1" fill="#5a3a20"/><rect x="5" y="28" width="20" height="4" rx="1" fill="#5a3a20"/></svg>`;
const figura=s=>s===me?cono:carrete;
const pos=c=>{ const r=Math.floor((c-1)/10), k=(c-1)%10; return r===1?[1,9-k]:[r,k]; };
function nueva(){ S=nuevo(); S.turno=ON?J.azar(2):0; gen++; ocupado=false; pinta(); envia(); siguiente(); }
function envia(){ if(ON) ON.enviar(S); }
function pinta(){
  const n=S.pal?valor(S.pal):null; const ms=S.turno===me&&S.pal&&S.fin<0&&!ocupado?movimientos(S,me,n):[];
  const b=J.$("#sn"); b.innerHTML=""; const celdas=[];
  for(let i=0;i<30;i++){ const d=J.el("div",{class:"c"}); b.append(d); }
  for(let c=1;c<=30;c++){ const [r,k]=pos(c); const d=b.children[r*10+k]; celdas[c]=d; d.innerHTML=`<span class="n">${c}</span>${ICON[c]?`<span class="ic">${ICON[c]}</span>`:""}`; }
  [0,1].forEach(s=>S.f[s].forEach(p=>{ if(p<1||p>30) return; const w=J.el("div",{style:"display:contents"}); w.innerHTML=figura(s); const f=w.firstChild; celdas[p].append(f);
    if(s===me){ const m=ms.find(x=>x.de===p); if(m){ f.classList.add("mov"); f.onclick=()=>mueve(m); } } }));
  ms.forEach(m=>{ if(m.a<=30){ const d=celdas[m.a]; d.classList.add("pos"); d.onclick=()=>mueve(m); } });
  const caja=s=>{ const fuera=S.f[s].filter(p=>p===FUERA).length; const m=ms.filter(x=>x.a===FUERA);
    return `<div class="marcador" style="margin:0"><div class="caja ${s===me&&m.length?"sn-sal":""}"><small>${s===me?"You (cones)":(ON?esc(ON.jugadores[s]):"Computer")+" (spools)"}</small><b>${fuera}/5 off</b></div></div>`; };
  J.$("#sn-res").innerHTML=caja(me)+caja(1-me);
  const salidas=ms.filter(x=>x.a===FUERA); if(salidas.length){ const bt=J.el("button",{class:"btn peq",style:"margin-left:6px"},"⬆️ Bear off piece from "+salidas[0].de); bt.onclick=()=>mueve(salidas[0]); J.$("#sn-res").append(bt); }
  const pz=J.$("#sn-pal"); pz.innerHTML="";
  if(S.pal){ pz.innerHTML=S.pal.map(v=>`<i style="background:${v?"#f4ecd8":"#5a3a20"}"></i>`).join("")+`<b style="font-size:1.4rem;margin-left:8px">= ${n}${otraVez(n)?" 🔁":""}</b>`; }
  else if(S.turno===me&&S.fin<0&&!ocupado){ const bt=J.el("button",{class:"btn"},"🥢 Throw sticks"); bt.onclick=lanzaYo; pz.append(bt); }
  let e; if(S.fin>=0) e= S.fin===me?"🏆 You bore off all 5 pieces! You won":`${nm(S.fin)} wins the game`;
  else if(S.turno===me) e= !S.pal?"Your turn: throw the sticks":ms.length?"Choose which piece to move":"You can’t move";
  else e= ON?`${nm(S.turno)}’s turn…`:"The computer is playing…";
  J.$("#sn-est").textContent=e; }
async function lanzaYo(){ if(S.turno!==me||S.pal||S.fin>=0) return; S.pal=lanza(); const n=valor(S.pal); const ms=movimientos(S,me,n); pinta();
  if(!ms.length){ ocupado=true; J.aviso("You can’t move: you lose your turn"); envia(); await J.espera(1300); ocupado=false; S.pal=null; S.turno=1-me; pinta(); envia(); siguiente(); }
  else envia(); }
function mueve(m){ if(S.turno!==me||ocupado||!S.pal) return; const n=valor(S.pal); const r=aplica(S,me,m); S=r.n;
  if(r.ev==="agua") J.aviso("🌊 Into the Water! Your piece goes back to the House of Rebirth"); else if(r.ev==="cambio") J.aviso("You swap places with the rival piece"); else if(otraVez(n)&&S.fin<0) J.aviso("You threw "+n+": throw again");
  if(S.fin===me) J.confeti(); pinta(); envia(); siguiente(); }
async function siguiente(){ if(ON||S.fin>=0||S.turno===me) return; const g=gen; ocupado=true; pinta();
  await J.espera(650); if(g!==gen) return; S.pal=lanza(); pinta(); await J.espera(900); if(g!==gen) return;
  const m=eligeCPU(S,1); if(!m){ J.aviso("The computer can’t move"); await J.espera(800); if(g!==gen) return; S.pal=null; S.turno=0; ocupado=false; return pinta(); }
  const r=aplica(S,1,m); S=r.n; if(r.ev==="cambio") J.aviso("The computer swaps places with your piece"); else if(r.ev==="agua") J.aviso("🌊 The computer’s piece falls into the Water");
  ocupado=false; pinta(); if(S.turno===1&&S.fin<0) siguiente(); }
function carga(e){ S={f:[e.f[0].slice(),e.f[1].slice()],turno:e.turno,pal:e.pal||null,fin:e.fin}; ocupado=false; gen++; if(S.fin===me) J.confeti(); pinta(); }
J.online&&J.online.activar({juego:"senet", titulo:"Senet", min:2, max:2,
  inicio(){ const e=nuevo(); e.turno=J.azar(2); return e; },
  alEmpezar(ctx,e){ ON=ctx; me=ctx.yo; J.$("#sn-n").style.display="none"; carga(e); J.aviso((e.turno===me?"You go first":"First to play: "+ctx.jugadores[e.turno])+" · Your pieces are the light cones",3000); },
  alCambiar(e){ carga(e); } });
nueva();
})();
