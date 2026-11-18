/* Tres en raya */
(function(){
J.paginaJuego({titulo:"Tic-Tac-Toe", emoji:"❌", ficha:"tres-en-raya", ins:{
  titulo:"Tic-Tac-Toe",
  intro:"Two players, one with ❌ and the other with ⭕, take turns marking squares on a 3 × 3 board.",
  pasos:["You play with ❌ and go first. Tap an empty square to mark it.","Then the computer (or your friend, if you choose 2-player mode) plays with ⭕.","The winner is whoever gets <b>three symbols in a row</b>: horizontally, vertically or diagonally.","If all nine squares fill up and nobody makes a line, it’s a draw."],
  consejos:["Starting in the centre or a corner is strongest.","On hard level the computer never loses: try to get a draw."]
}});
document.head.append(J.el("style",{},`.ter{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:360px;margin:0 auto}
.ter button{aspect-ratio:1;border-radius:18px;border:0;background:var(--panel2);font-size:3.4rem;cursor:pointer;box-shadow:var(--sombra)}
.ter button:hover:not(:disabled){background:#2c3a80}.ter button.gana{background:#16a65a}`));
const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
let t, turno, modo="cpu2", marc=J.lee("ter-marc",{tu:0,cpu:0,emp:0}), fin;
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="marcador" style="justify-content:center"><div class="caja"><small>You ❌</small><b id="m-tu"></b></div><div class="caja"><small>Draws</small><b id="m-emp"></b></div><div class="caja"><small>Rival ⭕</small><b id="m-cpu"></b></div></div>
<div class="centro-txt" style="margin-bottom:12px"><select id="modo"><option value="cpu1">Against the computer: easy</option><option value="cpu2" selected>Against the computer: hard</option><option value="2j">Two players</option></select> <button class="btn peq" id="nueva">🔄 New game</button></div>
<div class="estado" id="est"></div><div class="ter" id="ter"></div>`;
J.$("#modo").onchange=e=>{ modo=e.target.value; nueva(); }; J.$("#nueva").onclick=()=>{ if(ON){ nueva(); ON.enviar({t,turno}); } else nueva(); };
let ON=null; const mio=()=>ON.yo===0?"X":"O";
const gan=b=>{ for(const l of L) if(b[l[0]]&&b[l[0]]===b[l[1]]&&b[l[0]]===b[l[2]]) return l; return null; };
function minimax(b,p){ const g=gan(b); if(g) return b[g[0]]==="O"?10:-10; if(b.every(Boolean)) return 0;
  let best=p==="O"?-99:99; for(let i=0;i<9;i++) if(!b[i]){ b[i]=p; const v=minimax(b,p==="O"?"X":"O"); b[i]=null; best=p==="O"?Math.max(best,v):Math.min(best,v);} return best; }
function cpu(){ const libres=t.map((v,i)=>v?-1:i).filter(i=>i>=0); if(modo==="cpu1"&&Math.random()<.6) return J.elige(libres);
  let best=-99, mv=libres[0]; for(const i of J.baraja(libres)){ t[i]="O"; const v=minimax(t,"X"); t[i]=null; if(v>best){best=v;mv=i;} } return mv; }
function nueva(){ t=Array(9).fill(null); turno="X"; fin=false; pinta(); }
function pinta(){
  J.$("#m-tu").textContent=marc.tu; J.$("#m-cpu").textContent=marc.cpu; J.$("#m-emp").textContent=marc.emp;
  const g=gan(t);
  J.$("#ter").innerHTML=t.map((v,i)=>`<button data-i="${i}" class="${g&&g.includes(i)?"gana":""}" ${v||fin?"disabled":""}>${v==="X"?"❌":v==="O"?"⭕":""}</button>`).join("");
  J.$$("#ter button").forEach(b=>b.onclick=()=>juega(+b.dataset.i));
  J.$("#est").textContent = fin||(ON?(turno===mio()?"Your turn":ON.jugadores[turno==="X"?0:1]+"’s turn")+" ("+(turno==="X"?"❌":"⭕")+")":(turno==="X"?"❌":"⭕")+"’s turn");
}
function juega(i){
  if(ON){ if(t[i]||fin||turno!==mio()) return; t[i]=turno; turno=turno==="X"?"O":"X"; ON.enviar({t,turno}); carga({t,turno}); return; }
  if(t[i]||fin||(modo!=="2j"&&turno==="O")) return; t[i]=turno;
  if(comprueba()) return;
  turno=turno==="X"?"O":"X"; pinta();
  if(turno==="O"&&modo!=="2j") setTimeout(()=>{ t[cpu()]="O"; if(comprueba()) return; turno="X"; pinta(); },400);
}
function comprueba(){
  const g=gan(t);
  if(g){ const x=t[g[0]]==="X"; fin= x?"❌ wins!":"⭕ wins!"; if(x){marc.tu++; J.confeti(60);} else marc.cpu++; J.guarda("ter-marc",marc); pinta(); return true; }
  if(t.every(Boolean)){ fin="Draw"; marc.emp++; J.guarda("ter-marc",marc); pinta(); return true; }
  return false;
}
function carga(e){ t=e.t.map(v=>v||null); turno=e.turno; fin=false; const g=gan(t);
  if(g){ const w=t[g[0]]; fin= w===mio()?"You won! 🎉":ON.jugadores[w==="X"?0:1]+" wins"; if(w===mio()) J.confeti(60); }
  else if(t.every(Boolean)) fin="Draw"; pinta(); }
J.online&&J.online.activar({juego:"tres-en-raya", titulo:"Tic-Tac-Toe", min:2, max:2,
  inicio(){ return {t:Array(9).fill(0),turno:"X"}; },
  alEmpezar(ctx,e){ ON=ctx; J.$("#modo").style.display="none"; J.$(".marcador").style.display="none"; carga(e); J.aviso(ctx.yo===0?"You play with ❌ and go first":"You play with ⭕",3000); },
  alCambiar(e){ carga(e); } });
nueva();
})();
