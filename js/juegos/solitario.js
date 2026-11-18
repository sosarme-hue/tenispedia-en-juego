/* Solitario Klondike */
(function(){
J.paginaJuego({titulo:"Solitaire", emoji:"🂡", ficha:"solitario", ins:{
  titulo:"Solitaire (Klondike)",
  intro:"The goal is to place all 52 cards on the four piles at the top right, one per suit (♠ ♥ ♦ ♣), in order from Ace to King.",
  pasos:[
    "Below there are 7 columns. Only the top cards are visible; the rest are face down.",
    "In the columns you can put a card on another if it is <b>one lower and of the opposite colour</b>: for example, a red 6 on a black 7.",
    "To move, <b>tap a card</b> (it lights up) and then <b>tap the place</b> where you want to move it. You can move a group of ordered cards by tapping the first card of the group.",
    "If you <b>double-tap</b> a card, it goes to its suit pile by itself if it can.",
    "When a face-down card is uncovered, it turns over by itself.",
    "On an empty column you can only put a <b>King</b> (or a group starting with a King).",
    "If you run out of moves, tap the <b>stock</b> (top left) to draw new cards. When it runs out, tap it again to turn it over.",
    "You win when all four suit piles are complete."
  ],
  consejos:["Uncover the columns with the most face-down cards first.","Don’t empty a column unless you have a King to put there.","Draw-three mode is harder."]
}});
const css=`
.so-mesa{--nw:clamp(36px,10.6vw,92px)}
@media(max-width:600px){.so-mesa{padding:8px;border-width:4px}}
.so-fila{display:grid;grid-template-columns:repeat(7,var(--nw));justify-content:space-between;gap:4px}
.so-fila+.so-fila{margin-top:16px}
.so-col{position:relative;min-height:calc(var(--nw)*1.4)}
.so-col .naipe{position:absolute;left:0;cursor:pointer;transition:top .15s}
.so-pila{position:relative;width:var(--nw);height:calc(var(--nw)*1.4);cursor:pointer}
.so-pila .naipe{position:absolute;inset:0}
.so-pila .hueco{position:absolute;inset:0;display:grid;place-items:center;color:rgba(255,255,255,.4);font-size:calc(var(--nw)*.45)}
.naipe.sel{box-shadow:0 0 0 3px var(--oro),0 4px 12px rgba(0,0,0,.4)}
`;
document.head.append(J.el("style",{},css));
const raiz=J.$("#juego");
let mazo, descarte, pilas, cols, sel=null, roba=1, movs=0, hist=[], t0, reloj;

function nueva(){
  const m=J.baraja(J.mazo()).map(c=>({...c,up:false}));
  cols=[]; for(let i=0;i<7;i++){ cols.push(m.splice(0,i+1)); cols[i][i].up=true; }
  mazo=m; descarte=[]; pilas=[[],[],[],[]]; sel=null; movs=0; hist=[]; t0=Date.now();
  clearInterval(reloj); reloj=setInterval(()=>{ const e=J.$("#so-t"); if(e) e.textContent=tiempo(); },1000);
  pinta();
}
const tiempo=()=>{ const s=Math.floor((Date.now()-t0)/1000); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); };
function guarda(){ hist.push(JSON.stringify({mazo,descarte,pilas,cols})); if(hist.length>200) hist.shift(); }
function deshaz(){ if(!hist.length) return; Object.assign(window._so={},JSON.parse(hist.pop())); ({mazo,descarte,pilas,cols}=window._so); sel=null; pinta(); }

function montar(){
  raiz.innerHTML=`<div class="marcador"><div class="caja"><small>Moves</small><b id="so-m">0</b></div><div class="caja"><small>Time</small><b id="so-t">0:00</b></div>
  <div style="margin-left:auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><select id="so-roba"><option value="1">Draw 1 card</option><option value="3">Draw 3 cards</option></select>
  <button class="btn sec peq" id="so-des">↩️ Undo</button><button class="btn sec peq" id="so-auto">⚡ Auto</button><button class="btn peq" id="so-nueva">🔄 New</button></div></div>
  <div class="mesa so-mesa"><div class="so-fila" id="arriba"></div><div class="so-fila" id="abajo"></div></div>`;
  J.$("#so-nueva").onclick=nueva; J.$("#so-des").onclick=deshaz;
  J.$("#so-roba").onchange=e=>{ roba=+e.target.value; nueva(); };
  J.$("#so-auto").onclick=auto;
}
const ancho=()=>J.$(".so-mesa").querySelector(".so-pila")?.offsetWidth||72;
function pinta(){
  J.$("#so-m").textContent=movs;
  const A=J.$("#arriba"), B=J.$("#abajo"); A.innerHTML=""; B.innerHTML="";
  // mazo
  const pm=J.el("div",{class:"so-pila"}); pm.innerHTML=`<div class="naipe hueco"></div><div class="hueco">↻</div>`;
  if(mazo.length) pm.append(J.naipe(mazo[0],null,true));
  pm.onclick=robar; A.append(pm);
  // descarte (muestra hasta 3 en abanico)
  const pd=J.el("div",{class:"so-pila"}); pd.style.gridColumn="span 2";
  const vis=descarte.slice(-3);
  vis.forEach((c,k)=>{ const n=J.naipe(c); n.style.left=(k*28)+"%"; n.style.right="auto"; n.style.width="var(--nw)"; if(k===vis.length-1){ n.onclick=e=>{e.stopPropagation(); toca("d",null);}; if(sel&&sel.de==="d") n.classList.add("sel"); } pd.append(n); });
  A.append(pd);
  pilas.forEach((p,k)=>{ const d=J.el("div",{class:"so-pila"}); d.innerHTML=`<div class="naipe hueco"></div><div class="hueco">${J.PALOS[k]}</div>`; if(p.length){ const n=J.naipe(p[p.length-1]); if(sel&&sel.de==="p"&&sel.i===k) n.classList.add("sel"); d.append(n);} d.onclick=()=>toca("p",k); A.append(d); });
  // columnas
  const w=ancho();
  cols.forEach((col,k)=>{
    const d=J.el("div",{class:"so-col"}); let top=0;
    if(!col.length){ d.innerHTML=`<div class="naipe hueco" style="position:absolute"></div>`; }
    col.forEach((c,n)=>{ const e=J.naipe(c,null,!c.up); e.style.top=top+"px"; top+= c.up? w*.32 : w*.14;
      if(sel&&sel.de==="c"&&sel.i===k&&n>=sel.n) e.classList.add("sel");
      e.onclick=ev=>{ ev.stopPropagation(); if(c.up) toca("c",k,n); }; d.append(e); });
    d.style.height=(top+w*1.4)+"px";
    d.onclick=()=>toca("c",k,col.length);
    B.append(d);
  });
}
function robar(){
  guarda(); sel=null;
  if(!mazo.length){ mazo=descarte.reverse(); descarte=[]; }
  else for(let k=0;k<roba&&mazo.length;k++) descarte.push(mazo.shift());
  movs++; pinta();
}
function cartasSel(s){ if(s.de==="d") return [descarte[descarte.length-1]]; if(s.de==="p") return [pilas[s.i][pilas[s.i].length-1]]; return cols[s.i].slice(s.n); }
function quita(s){ if(s.de==="d") descarte.pop(); else if(s.de==="p") pilas[s.i].pop(); else { cols[s.i].splice(s.n); const c=cols[s.i]; if(c.length&&!c[c.length-1].up) c[c.length-1].up=true; } }
const alPalo=c=>J.PALOS.indexOf(c.p);
function puedePila(c,k){ const p=pilas[k]; if(alPalo(c)!==k) return false; return p.length? p[p.length-1].v===c.v-1 : c.v===1; }
function puedeCol(cs,k){ const col=cols[k]; const c=cs[0]; if(!col.length) return c.v===13; const t=col[col.length-1]; return t.up && t.v===c.v+1 && J.esRojo(t)!==J.esRojo(c); }
function toca(de,i,n){
  if(sel){
    const s=sel; sel=null;
    const cs=cartasSel(s);
    if(s.de===de && s.i===i && (de!=="c"||s.n===n)){ // doble toque: a la pila
      if(cs.length===1 && puedePila(cs[0],alPalo(cs[0]))){ guarda(); quita(s); pilas[alPalo(cs[0])].push(cs[0]); movs++; }
      return finJ();
    }
    if(de==="p" && cs.length===1 && puedePila(cs[0],i)){ guarda(); quita(s); pilas[i].push(cs[0]); movs++; return finJ(); }
    if(de==="c" && s.de!=="c"||de==="c" && s.i!==i){ if(puedeCol(cs,i)){ guarda(); quita(s); cols[i].push(...cs); movs++; return finJ(); } }
    if(de==="c" && n!==undefined && cols[i][n]&&cols[i][n].up && !(s.de==="c"&&s.i===i)){ sel=null; pinta(); return toca(de,i,n); }
    pinta(); return;
  }
  if(de==="d"&&descarte.length) sel={de,i:null};
  else if(de==="p"&&pilas[i].length) sel={de,i};
  else if(de==="c"&&cols[i][n]&&cols[i][n].up){ // grupo ordenado?
    const g=cols[i].slice(n); const ok=g.every((c,k)=>k===0||(g[k-1].v===c.v+1&&J.esRojo(g[k-1])!==J.esRojo(c)));
    if(ok) sel={de,i,n};
  }
  pinta();
}
function finJ(){ pinta(); if(pilas.every(p=>p.length===13)){ clearInterval(reloj); J.confeti(160); J.modal(`<h2>🏆 Solitaire completed!</h2><p>You solved it in ${movs} moves and ${tiempo()}.</p>`,[{txt:"Another game"}]).then(nueva); } }
async function auto(){
  let algo=true;
  while(algo){ algo=false;
    for(const s of [{de:"d"},...cols.map((c,k)=>({de:"c",i:k,n:c.length-1}))]){
      const cs = s.de==="d" ? (descarte.length?[descarte[descarte.length-1]]:[]) : (cols[s.i].length?[cols[s.i][s.n]]:[]);
      if(cs.length && puedePila(cs[0],alPalo(cs[0]))){ guarda(); quita(s); pilas[alPalo(cs[0])].push(cs[0]); movs++; algo=true; pinta(); await J.espera(120); break; }
    }
  }
  finJ();
}
montar(); nueva();
window.addEventListener("resize",()=>pinta());
})();
