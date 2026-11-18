/* Backgammon */
(function(){
J.paginaJuego({titulo:"Backgammon", emoji:"🎲", ficha:"backgammon", ins:{
  titulo:"Backgammon",
  intro:"Each player has 15 checkers. You play <b>white</b> and move anticlockwise towards your home (bottom right). The first to bear off all their checkers wins.",
  pasos:[
    "Press <b>🎲 Roll dice</b>. Each die is one move: you can move one checker with each die or the same checker twice.",
    "If you roll <b>doubles</b> (for example 4 and 4), you move that number four times.",
    "To move, tap one of your checkers and then one of the points highlighted in gold.",
    "You can’t land on a point where your rival has <b>2 or more checkers</b>.",
    "If you land on a point where your rival has <b>a single checker</b>, you hit it: it goes to the <b>bar</b> in the middle and has to come back in from the start.",
    "If you have checkers on the bar, you must bring them in before moving any other. They enter through your rival’s home (top right).",
    "When all 15 checkers are in your home (the 6 points at the bottom right), you can start <b>bearing them off</b>: tap the checker and then the “Off” area.",
    "You must use both dice if you can. If there are no possible moves, the turn passes automatically."
  ],
  consejos:["Don’t leave checkers alone where your rival can hit them.","Putting two checkers on a point makes it safe and blocks your rival."]
}});
document.head.append(J.el("style",{},`
.bg-tab{display:grid;grid-template-columns:repeat(6,1fr) .7fr repeat(6,1fr) .9fr;grid-template-rows:1fr 34px 1fr;background:#3e2410;border:8px solid #5a3a1a;border-radius:16px;max-width:820px;margin:0 auto;aspect-ratio:1.35;box-shadow:var(--sombra);position:relative;user-select:none}
.bg-p{position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;min-width:0;padding:2px 0}
.bg-p::before{content:"";position:absolute;inset:0 6%;clip-path:polygon(0 0,100% 0,50% 92%);background:var(--tri)}
.bg-p.ab{flex-direction:column-reverse}.bg-p.ab::before{clip-path:polygon(50% 8%,100% 100%,0 100%)}
.bg-p:nth-child(odd){--tri:#e9c46a}.bg-p:nth-child(even){--tri:#9d0208}
.bg-f{width:84%;aspect-ratio:1;border-radius:50%;position:relative;z-index:1;margin-bottom:-14%;box-shadow:0 2px 3px rgba(0,0,0,.6);display:grid;place-items:center;font-family:var(--titulos);font-size:.8rem}
.bg-p.ab .bg-f{margin-bottom:0;margin-top:-14%}
.bg-f.h{background:radial-gradient(circle at 35% 30%,#fff,#d9d9d9);color:#333}
.bg-f.c{background:radial-gradient(circle at 35% 30%,#555,#111);color:#eee}
.bg-bar{grid-row:1 / span 3;background:#2a1606;display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:6px 0;cursor:pointer}
.bg-bar .bg-f{width:80%;margin:2px 0}
.bg-off{grid-row:1 / span 3;background:#24140a;border-left:4px solid #5a3a1a;display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:6px 2px;color:#ffe8c2;font-size:.7rem;text-align:center;cursor:pointer}
.bg-mid{grid-column:1 / span 6;display:flex;align-items:center;justify-content:center;gap:8px;--dw:30px}
.bg-mid2{grid-column:8 / span 6;display:flex;align-items:center;justify-content:center;gap:8px;--dw:30px}
.bg-sel{outline:3px solid #4cc9f0;outline-offset:-3px}
.bg-dest::after{content:"";position:absolute;inset:0 6%;background:rgba(255,201,74,.45);clip-path:inherit;z-index:2;pointer-events:none}
.bg-off.bg-dest{box-shadow:inset 0 0 0 3px var(--oro)}
.bg-usado{opacity:.3}
`));
const raiz=J.$("#juego");
// b[i]>0 fichas blancas (tú), b[i]<0 negras (ordenador). Tú vas de 23 a 0; el ordenador de 0 a 23.
let ON=null, me=0, ganador=-1;
let S, dados=[], turno, fase, sel=null, fin;
function inicio(){ const b=Array(24).fill(0); b[23]=2;b[12]=5;b[7]=3;b[5]=5; b[0]=-2;b[11]=-5;b[16]=-3;b[18]=-5; return {b,bar:[0,0],off:[0,0]}; } // índice 0 tú, 1 ordenador
const cp=s=>({b:s.b.slice(),bar:s.bar.slice(),off:s.off.slice()});
const sg=p=>p===0?1:-1;
function enCasa(s,p){ if(s.bar[p]) return false; for(let i=0;i<24;i++){ if(s.b[i]*sg(p)>0){ if(p===0&&i>5) return false; if(p===1&&i<18) return false; } } return true; }
function movsDado(s,p,d){ // movimientos simples con un dado
  const r=[], g=sg(p);
  const destino=to=>{ if(to<0||to>23) return false; return s.b[to]*g>=-1; };
  if(s.bar[p]){ const to=p===0?24-d:d-1; if(destino(to)) r.push({from:"bar",to,d}); return r; }
  const casa=enCasa(s,p);
  for(let i=0;i<24;i++){ if(s.b[i]*g<=0) continue; const to=p===0?i-d:i+d;
    if(to>=0&&to<=23){ if(destino(to)) r.push({from:i,to,d}); }
    else if(casa){ const exacto = p===0?to===-1:to===24;
      if(exacto) r.push({from:i,to:"off",d});
      else { const mas = p===0 ? s.b.slice(i+1,6).some(v=>v>0) : s.b.slice(18,i).some(v=>v<0); if(!mas) r.push({from:i,to:"off",d}); } } }
  return r; }
function aplica(s,p,m){ s=cp(s); const g=sg(p);
  if(m.from==="bar") s.bar[p]--; else s.b[m.from]-=g;
  if(m.to==="off") s.off[p]++;
  else { if(s.b[m.to]*g===-1){ s.b[m.to]=0; s.bar[1-p]++; } s.b[m.to]+=g; }
  return s; }
function secuencias(s,p,ds){ // todas las secuencias que usan el máximo de dados
  const res=[]; const vistos=new Set();
  function rec(s,ds,camino){ let algo=false; const probados=new Set();
    for(let k=0;k<ds.length;k++){ const d=ds[k]; if(probados.has(d)) continue; probados.add(d);
      for(const m of movsDado(s,p,d)){ algo=true; const resto=ds.slice(0,k).concat(ds.slice(k+1)); rec(aplica(s,p,m),resto,camino.concat([m])); } }
    if(!algo){ const key=JSON.stringify(s)+"|"+camino.length; if(!vistos.has(key)){ vistos.add(key); res.push({movs:camino,s}); } } }
  rec(s,ds,[]);
  const max=Math.max(0,...res.map(r=>r.movs.length)); let ok=res.filter(r=>r.movs.length===max);
  if(max===1&&ds.length===2&&ds[0]!==ds[1]){ const alto=Math.max(...ds); if(ok.some(r=>r.movs[0].d===alto)) ok=ok.filter(r=>r.movs[0].d===alto); }
  return ok; }
function tira(){ const a=1+J.azar(6), b=1+J.azar(6); return a===b?[a,a,a,a]:[a,b]; }
function nueva(){ S=inicio(); fin=null; sel=null; let a,b; do{ a=1+J.azar(6); b=1+J.azar(6); }while(a===b);
  turno = a>b?0:1; dados=[a,b]; J.aviso(turno===0?`You go first (${a} against ${b})`:`The computer goes first (${b} against ${a})`);
  fase="mover"; if(turno===1){ pinta(); setTimeout(cpu,1000); } else prepara(); }
let legales=[];
function prepara(){ legales=secuencias(S,me,dados); if(!legales.length||!legales[0].movs.length){ J.aviso("You have no possible moves: you pass");
    if(ON){ turno=1-me; dados=tira(); legales=[]; envia(); pinta(); return; } pinta(); setTimeout(()=>{ turno=1; dados=tira(); fase="mover"; pinta(); setTimeout(cpu,900); },1200); return; } pinta(); }
function primeros(){ return legales.filter(r=>r.movs.length).map(r=>r.movs[0]); }
function pinta(){
  const g=S.b; let html="";
  const pico=(i,abajo)=>{ const v=g[i], n=Math.abs(v), cl=v>0?"h":"c"; let f="";
    for(let k=0;k<Math.min(n,5);k++) f+=`<div class="bg-f ${cl}">${k===4&&n>5?n:""}</div>`;
    return `<div class="bg-p ${abajo?"ab":""}" data-i="${i}" style="grid-row:${abajo?3:1}">${f}</div>`; };
  for(let i=12;i<=17;i++) html+=pico(i,false);
  html+=`<div class="bg-bar" data-i="bar" style="grid-column:7">${'<div class="bg-f c"></div>'.repeat(Math.min(S.bar[1],4))}${S.bar[1]>4?S.bar[1]:""}<span></span>${'<div class="bg-f h"></div>'.repeat(Math.min(S.bar[0],4))}${S.bar[0]>4?S.bar[0]:""}</div>`;
  for(let i=18;i<=23;i++) html+=pico(i,false);
  html+=`<div class="bg-off" data-i="off" style="grid-column:14"><div>⚫ ${S.off[1]}/15</div><div>Off<br>⬇️</div><div>⚪ ${S.off[0]}/15</div></div>`;
  html+=`<div class="bg-mid" style="grid-row:2" id="bg-d1"></div><div class="bg-mid2" style="grid-row:2" id="bg-d2"></div>`;
  for(let i=11;i>=6;i--) html+=pico(i,true);
  for(let i=5;i>=0;i--) html+=pico(i,true);
  raiz.innerHTML=`${ON?"":`<div class="centro-txt" style="margin-bottom:8px"><button class="btn peq" id="bg-nueva">🔄 New game</button></div>`}
  <div class="estado" id="bg-est"></div><div class="bg-tab" id="bg">${html}</div>
  <div class="centro-txt" style="margin-top:10px;color:var(--suave)">${ON?(me===0?"⚪ You play white: your home is at the bottom right · ⚫ "+ON.jugadores[1]:"⚫ You play black: your home is at the top right · ⚪ "+ON.jugadores[0]):"⚪ You: your home is at the bottom right · ⚫ Computer"}</div>`;
  // columnas: picos de abajo 11..6 en columnas 1-6, 5..0 en 8-13; arriba 12..17 en 1-6, 18..23 en 8-13
  J.$$("#bg .bg-p").forEach(d=>{ const i=+d.dataset.i; let col; if(i>=12&&i<=17) col=i-11; else if(i>=18) col=i-10; else if(i>=6) col=12-i; else col=13-i; d.style.gridColumn=col; });
  const zona=J.$(turno===me?"#bg-d2":"#bg-d1");
  dados.forEach(d=>zona.append(J.dado(d)));
  if(!ON) J.$("#bg-nueva").onclick=nueva;
  const mio=turno===me&&!fin&&legales.length;
  if(mio){ const pr=primeros();
    if(sel!==null){ const src=sel==="bar"?J.$('#bg .bg-bar'):J.$(`#bg .bg-p[data-i="${sel}"]`); src&&src.classList.add("bg-sel");
      pr.filter(m=>m.from===sel).forEach(m=>{ const t=m.to==="off"?J.$("#bg .bg-off"):J.$(`#bg .bg-p[data-i="${m.to}"]`); t&&t.classList.add("bg-dest"); }); }
    J.$$("#bg .bg-p, #bg .bg-bar, #bg .bg-off").forEach(d=>d.onclick=()=>toca(d.dataset.i)); }
  J.$("#bg-est").textContent = fin || (turno===me?(sel===null?`Your turn: tap one of your ${me?"black":"white"} checkers`:"Now tap a gold point"):ON?`${ON.jugadores[turno]} is playing…`:"The computer is playing…");
}
function toca(x){ const pr=primeros(); const v=x==="bar"?"bar":x==="off"?"off":+x;
  if(sel!==null){ const m=pr.find(m=>m.from===sel&&m.to===v); if(m){ return mueve(m); } }
  if(pr.some(m=>m.from===v)){ sel=v; pinta(); return; }
  sel=null; pinta(); }
function mueve(m){ S=aplica(S,me,m); dados.splice(dados.indexOf(m.d),1); sel=null;
  if(ON){ if(S.off[me]===15){ ganador=me; envia(); return carga(paq()); }
    if(dados.length){ legales=secuencias(S,me,dados); if(legales.length&&legales[0].movs.length){ envia(); pinta(); return; } }
    turno=1-me; dados=tira(); legales=[]; envia(); return carga(paq()); }
  if(S.off[0]===15){ fin="You won! You bore off all your checkers 🎉"; J.confeti(); pinta(); return; }
  if(dados.length){ legales=secuencias(S,0,dados); if(legales.length&&legales[0].movs.length){ pinta(); return; } }
  turno=1; dados=tira(); legales=[]; pinta(); setTimeout(cpu,900); }
function valora(s){ let v=0; const b=s.b;
  let pipC=0,pipH=0; for(let i=0;i<24;i++){ if(b[i]<0) pipC+=-b[i]*(24-i); if(b[i]>0) pipH+=b[i]*(i+1); }
  pipC+=s.bar[1]*25; pipH+=s.bar[0]*25;
  v+= (pipH-pipC)*1.2 + s.off[1]*12 + s.bar[0]*18;
  for(let i=0;i<24;i++){ if(b[i]===-1){ // ficha sola: peligro si hay blancas por delante
      const amenaza = b.slice(i+1).some(x=>x>0)||s.bar[0]; if(amenaza) v-= 10 + (i>=12?6:0); }
    if(b[i]<=-2) v+= i>=18?7:i>=12?4:2; }
  return v; }
async function cpu(){ if(fin) return;
  const sec=secuencias(S,1,dados);
  if(!sec.length||!sec[0].movs.length){ J.aviso("The computer can’t move"); }
  else { let best=sec[0],bv=-1e9; for(const r of sec){ const v=valora(r.s)+Math.random(); if(v>bv){bv=v;best=r;} }
    for(const m of best.movs){ S=aplica(S,1,m); dados.splice(dados.indexOf(m.d),1); pinta(); await J.espera(550); } }
  if(S.off[1]===15){ fin="The computer wins. Try again!"; pinta(); return; }
  turno=0; dados=tira(); sel=null; prepara(); }
const paq=()=>({S,dados,turno,ganador});
function envia(){ if(ON) ON.enviar(paq()); }
function carga(e){ S=e.S; dados=e.dados||[]; turno=e.turno; ganador=e.ganador; sel=null; legales=[]; fin=null;
  if(ganador>=0){ fin= ganador===me?"You won! You bore off all your checkers 🎉":`${ON.jugadores[ganador]} wins. Try again!`; if(ganador===me) J.confeti(); return pinta(); }
  if(turno===me) prepara(); else pinta(); }
J.online&&J.online.activar({juego:"backgammon", titulo:"Backgammon", min:2, max:2,
  inicio(){ let a,b; do{ a=1+J.azar(6); b=1+J.azar(6); }while(a===b); return {S:inicio(),dados:[a,b],turno:a>b?0:1,ganador:-1}; },
  alEmpezar(ctx,e){ ON=ctx; me=ctx.yo; carga(e); J.aviso((e.turno===me?"You go first":"First to play: "+ctx.jugadores[e.turno])+(me?" · You play black ⚫":" · You play white ⚪"),3500); },
  alCambiar(e){ carga(e); } });
nueva();
})();
