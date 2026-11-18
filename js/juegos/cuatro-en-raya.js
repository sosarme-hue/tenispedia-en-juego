/* Cuatro en raya */
(function(){
J.paginaJuego({titulo:"Connect Four", emoji:"🔴", ficha:"cuatro-en-raya", ins:{
  titulo:"Connect Four",
  intro:"An upright board with 7 columns and 6 rows. Discs drop to the lowest free space in the column.",
  pasos:["You play with the 🔴 discs and go first.","Tap a column to drop your disc into it.","Then the computer plays with 🟡 (or your friend, in 2-player mode).","The winner is whoever gets <b>four discs in a row</b> horizontally, vertically or diagonally.","If the board fills up without four in a row, it’s a draw."],
  consejos:["The middle columns give you more chances.","Always check whether your rival is about to make four and block it."]
}});
document.head.append(J.el("style",{},`.c4{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;background:#1d4ed8;padding:10px;border-radius:18px;max-width:560px;margin:0 auto;box-shadow:var(--sombra)}
.c4 div{aspect-ratio:1;border-radius:50%;background:#0e1430;box-shadow:inset 0 4px 8px rgba(0,0,0,.6);cursor:pointer;transition:background .2s}
.c4 div.r{background:radial-gradient(circle at 35% 30%,#ff8fa3,#e63946)}.c4 div.a{background:radial-gradient(circle at 35% 30%,#fff3a3,#ffc300)}
.c4 div.gana{box-shadow:0 0 0 4px #fff,0 0 18px #fff}`));
const F=6,C=7; let t, turno, fin, modo="cpu2";
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="centro-txt" style="margin-bottom:12px"><select id="modo"><option value="cpu1">Against the computer: easy</option><option value="cpu2" selected>Against the computer: normal</option><option value="cpu3">Against the computer: hard</option><option value="2j">Two players</option></select> <button class="btn peq" id="nueva">🔄 New game</button></div><div class="estado" id="est"></div><div class="c4" id="c4"></div>`;
J.$("#modo").onchange=e=>{ modo=e.target.value; nueva(); }; J.$("#nueva").onclick=()=>{ if(ON){ const e={t:Array.from({length:F},()=>Array(C).fill(0)),turno:1,fin:null}; ON.enviar(e); carga(e); } else nueva(); };
function nueva(){ t=Array.from({length:F},()=>Array(C).fill(0)); turno=1; fin=null; pinta(); }
function linea(b){ const d=[[0,1],[1,0],[1,1],[1,-1]];
  for(let f=0;f<F;f++) for(let c=0;c<C;c++){ const v=b[f][c]; if(!v) continue; for(const [a,e] of d){ const cs=[[f,c]]; for(let k=1;k<4;k++){ const y=f+a*k,x=c+e*k; if(y<0||y>=F||x<0||x>=C||b[y][x]!==v) break; cs.push([y,x]); } if(cs.length===4) return {v,cs}; } } return null; }
const fila=(b,c)=>{ for(let f=F-1;f>=0;f--) if(!b[f][c]) return f; return -1; };
function evalua(b){ let s=0; for(let f=0;f<F;f++){ if(b[f][3]===2) s+=3; if(b[f][3]===1) s-=3; }
  const w=[[0,1],[1,0],[1,1],[1,-1]];
  for(let f=0;f<F;f++) for(let c=0;c<C;c++) for(const [a,e] of w){ let p2=0,p1=0,ok=true; for(let k=0;k<4;k++){ const y=f+a*k,x=c+e*k; if(y<0||y>=F||x<0||x>=C){ok=false;break;} if(b[y][x]===2)p2++; else if(b[y][x]===1)p1++; } if(!ok) continue;
    if(p2&&!p1) s+= p2===3?5:p2===2?2:0; if(p1&&!p2) s-= p1===3?6:p1===2?2:0; }
  return s; }
function ab(b,prof,a,be,max){ const l=linea(b); if(l) return l.v===2?1000+prof:-1000-prof; if(prof===0) return evalua(b);
  const cols=[3,2,4,1,5,0,6].filter(c=>fila(b,c)>=0); if(!cols.length) return 0;
  for(const c of cols){ const f=fila(b,c); b[f][c]=max?2:1; const v=ab(b,prof-1,a,be,!max); b[f][c]=0; if(max){ if(v>a)a=v; } else { if(v<be)be=v; } if(a>=be) break; }
  return max?a:be; }
function cpu(){ const prof={cpu1:1,cpu2:4,cpu3:6}[modo]; const cols=[3,2,4,1,5,0,6].filter(c=>fila(t,c)>=0);
  if(modo==="cpu1"&&Math.random()<.4) return J.elige(cols);
  let best=-1e9, mv=cols[0]; for(const c of cols){ const f=fila(t,c); t[f][c]=2; const v=ab(t,prof-1,-1e9,1e9,false)+Math.random()*.5; t[f][c]=0; if(v>best){best=v;mv=c;} } return mv; }
function pinta(){ const l=linea(t);
  J.$("#c4").innerHTML=t.map((r,f)=>r.map((v,c)=>`<div data-c="${c}" class="${v===1?"r":v===2?"a":""} ${l&&l.cs.some(([y,x])=>y===f&&x===c)?"gana":""}"></div>`).join("")).join("");
  J.$$("#c4 div").forEach(d=>d.onclick=()=>juega(+d.dataset.c));
  J.$("#est").textContent=fin||(ON?(turno===ON.yo+1?"Your turn":`${ON.jugadores[turno-1]}’s turn`)+(turno===1?" (🔴)":" (🟡)"):(turno===1?"🔴’s turn":"🟡’s turn")); }
let ON=null;
function juega(c){ if(fin) return; if(ON){ if(turno!==ON.yo+1) return; const f=fila(t,c); if(f<0) return; t[f][c]=turno; if(!comprueba()){ turno=3-turno; } const e={t,turno,fin}; ON.enviar(e); carga(e); return; }
  if(modo!=="2j"&&turno!==1) return; const f=fila(t,c); if(f<0) return; t[f][c]=turno; if(comprueba()) return; turno=3-turno; pinta();
  if(turno===2&&modo!=="2j") setTimeout(()=>{ const c2=cpu(); t[fila(t,c2)][c2]=2; if(comprueba()) return; turno=1; pinta(); },300); }
function comprueba(){ const l=linea(t); if(l){ fin=l.v===1?"🔴 wins!":"🟡 wins!"; if(l.v===1) J.confeti(80); pinta(); return true; } if(t[0].every(Boolean)){ fin="Draw"; pinta(); return true; } return false; }
nueva();
J.online&&J.online.activar({juego:"cuatro-en-raya", titulo:"Connect Four", min:2, max:2,
  inicio:()=>({t:Array.from({length:F},()=>Array(C).fill(0)),turno:1,fin:null}),
  alEmpezar(ctx,e){ ON=ctx; J.$("#modo").parentNode.style.display="none"; carga(e); },
  alCambiar(e){ carga(e); }});
function carga(e){ t=e.t; turno=e.turno; fin=e.fin; if(fin&&ON){ const g=fin.includes("🔴")?1:fin.includes("🟡")?2:0; fin = g? (g===ON.yo+1?"You won! 🎉":`${ON.jugadores[g-1]} wins`) : fin; } pinta(); }
})();
