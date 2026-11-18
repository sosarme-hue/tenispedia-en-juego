/* Puzle deslizante */
(function(){
J.paginaJuego({titulo:"Sliding Puzzle", emoji:"🧩", ficha:"puzle", ins:{
  titulo:"Sliding Puzzle",
  intro:"The numbered tiles are jumbled up in a box with <b>one gap</b>. The goal is to put them in order from lowest to highest, leaving the gap at the end.",
  pasos:[
    "Tap a tile that is <b>next to the gap</b> to slide it into it. You can also use the arrow keys.",
    "Put the numbers in order: 1 at the top left, then 2, 3… and the gap at the bottom right.",
    "Choose the size: 3×3 is easy, 4×4 is the classic and 5×5 is for experts.",
    "Try to solve it in as few moves as possible."
  ],
  consejos:["First complete the whole top row, then the left column, and that way you shrink the puzzle.","The last two rows are solved by rotating the tiles in a circle."]
}});
document.head.append(J.el("style",{},`
.pz{display:grid;gap:6px;background:#2a1606;padding:8px;border-radius:16px;max-width:440px;margin:0 auto;box-shadow:var(--sombra);border:6px solid #5a3a1a}
.pz div{aspect-ratio:1;border-radius:10px;display:grid;place-items:center;font-family:var(--titulos);font-size:clamp(1.2rem,5vw,2rem);color:#fff;cursor:pointer;background:linear-gradient(145deg,#ff9f1c,#f15bb5);box-shadow:0 4px 0 rgba(0,0,0,.35);transition:transform .1s;user-select:none;min-width:0}
.pz div.bien{background:linear-gradient(145deg,#2ed47a,#0f9d58)}
.pz div.hueco{background:transparent;box-shadow:none;cursor:default}
.pz div:active{transform:scale(.95)}
`));
let N=4, t, movs, fin, t0, reloj;
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="centro-txt" style="margin-bottom:8px"><select id="pz-n"><option value="3">3×3 (easy)</option><option value="4" selected>4×4 (classic)</option><option value="5">5×5 (hard)</option></select> <button class="btn peq" id="pz-nueva">🔀 Shuffle</button></div>
<div class="marcador" style="justify-content:center"><div class="caja"><small>Moves</small><b id="pz-m">0</b></div><div class="caja"><small>Time</small><b id="pz-t">0:00</b></div></div>
<div class="estado" id="pz-est"></div><div class="pz" id="pz"></div>`;
J.$("#pz-n").onchange=e=>{ N=+e.target.value; nueva(); }; J.$("#pz-nueva").onclick=nueva;
function vecinos(h){ const f=Math.floor(h/N),c=h%N, r=[]; if(f) r.push(h-N); if(f<N-1) r.push(h+N); if(c) r.push(h-1); if(c<N-1) r.push(h+1); return r; }
function nueva(){ t=[...Array(N*N)].map((_,i)=>(i+1)%(N*N)); let h=N*N-1, prev=-1;
  for(let k=0;k<N*N*40;k++){ const v=vecinos(h).filter(x=>x!==prev); const x=J.elige(v); [t[h],t[x]]=[t[x],t[h]]; prev=h; h=x; } // desordenar con movimientos válidos: siempre tiene solución
  movs=0; fin=false; t0=null; clearInterval(reloj); J.$("#pz-t").textContent="0:00"; pinta(); }
function pinta(){ const z=J.$("#pz"); z.style.gridTemplateColumns=`repeat(${N},1fr)`;
  z.innerHTML=t.map((v,i)=>`<div class="${v?(v===i+1?"bien":""):"hueco"}" data-i="${i}">${v||""}</div>`).join("");
  J.$$("#pz div").forEach(d=>d.onclick=()=>mueve(+d.dataset.i));
  J.$("#pz-m").textContent=movs; J.$("#pz-est").textContent=fin?`Solved in ${movs} moves! 🎉`:"Tap a tile next to the gap"; }
function mueve(i){ if(fin) return; const h=t.indexOf(0); if(!vecinos(h).includes(i)) return;
  if(!t0){ t0=Date.now(); reloj=setInterval(()=>{ const s=Math.floor((Date.now()-t0)/1000); J.$("#pz-t").textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; },1000); }
  [t[h],t[i]]=[t[i],t[h]]; movs++;
  if(t.every((v,k)=>v===(k+1)%(N*N))){ fin=true; clearInterval(reloj); J.confeti(); }
  pinta(); }
document.addEventListener("keydown",e=>{ const h=t.indexOf(0); const m={ArrowUp:h+N,ArrowDown:h-N,ArrowLeft:h+1,ArrowRight:h-1}[e.key];
  if(m===undefined) return; if((e.key==="ArrowLeft"&&h%N===N-1)||(e.key==="ArrowRight"&&h%N===0)) return; if(m>=0&&m<N*N){ e.preventDefault(); mueve(m); } });
nueva();
})();
