/* Sopa de letras */
(function(){
J.paginaJuego({titulo:"Word Search", emoji:"🔍", ficha:"sopa-de-letras", ins:{
  titulo:"Word Search",
  intro:"The words in the list are hidden in the grid: horizontally, vertically or diagonally, and also backwards.",
  pasos:["Choose a topic and a size.","Tap the <b>first letter</b> of a word and then the <b>last letter</b>. (On a computer you can also drag.)","If the word is correct, it is highlighted in colour and crossed off the list.","You win when you find all the words."],
  consejos:["Look for uncommon letters such as Z, J or X.","Scan the grid row by row looking for the first letter."]
}});
document.head.append(J.el("style",{},`.sl-z{display:grid;grid-template-columns:minmax(0,560px) 1fr;gap:20px;align-items:start}@media(max-width:860px){.sl-z{grid-template-columns:1fr}}
.sl{display:grid;gap:2px;background:#fff;padding:8px;border-radius:14px;user-select:none;touch-action:none}
.sl div{aspect-ratio:1;display:grid;place-items:center;font-family:var(--titulos);font-weight:600;color:#1b2556;font-size:clamp(11px,3vw,22px);border-radius:50%;cursor:pointer}
.sl div.ini{background:#ffd60a}.sl div.tmp{background:#bde0fe}
.sl-l{display:flex;flex-wrap:wrap;gap:8px}.sl-l span{padding:6px 12px;border-radius:999px;background:var(--panel);font-weight:800}.sl-l span.ok{text-decoration:line-through;opacity:.5;background:#16a65a}`));
const COLS=["#ffadad","#ffd6a5","#fdffb6","#caffbf","#9bf6ff","#a0c4ff","#bdb2ff","#ffc6ff","#f4a261","#90be6d","#e9c46a","#84a59d"];
let N=12, tema="animales", g, pals, ok, marcas, ini=null;
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="centro-txt" style="margin-bottom:10px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><select id="sl-t">${Object.entries(TEMAS_PALABRAS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select><select id="sl-n"><option value="10">10 × 10</option><option value="12" selected>12 × 12</option><option value="15">15 × 15</option></select><button class="btn peq" id="sl-nueva">🔄 New</button></div>
<div class="sl-z"><div class="sl" id="sl"></div><div><h3>Words to find</h3><div class="sl-l" id="sl-l"></div><div class="estado" id="sl-e"></div></div></div>`;
J.$("#sl-t").value=tema;
J.$("#sl-t").onchange=e=>{ tema=e.target.value; nueva(); }; J.$("#sl-n").onchange=e=>{ N=+e.target.value; nueva(); }; J.$("#sl-nueva").onclick=nueva;
const DIRS=[[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
function nueva(){
  g=Array.from({length:N},()=>Array(N).fill("")); pals=[]; ok=new Set(); marcas=[]; ini=null;
  const cand=J.baraja(PALABRAS.filter(p=>p[2]===tema&&p[0].length<=N).map(p=>p[0]));
  for(const w of cand){ if(pals.length>=Math.min(12,N)) break;
    for(let t=0;t<120;t++){ const [a,b]=J.elige(N<12?DIRS.slice(0,4):DIRS); const f=J.azar(N), c=J.azar(N); const ff=f+a*(w.length-1), fc=c+b*(w.length-1); if(ff<0||ff>=N||fc<0||fc>=N) continue;
      let cabe=true; for(let k=0;k<w.length;k++){ const x=g[f+a*k][c+b*k]; if(x&&x!==w[k]){cabe=false;break;} } if(!cabe) continue;
      for(let k=0;k<w.length;k++) g[f+a*k][c+b*k]=w[k]; pals.push({w,f,c,a,b}); break; } }
  const abc="AAAEEEEIIOOUBCDFGHKLMNPRSTWY"; for(let f=0;f<N;f++) for(let c=0;c<N;c++) if(!g[f][c]) g[f][c]=J.elige([...abc]);
  pinta();
}
function celdas(a,b){ const df=Math.sign(b[0]-a[0]), dc=Math.sign(b[1]-a[1]); const n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));
  if(!(a[0]===b[0]||a[1]===b[1]||Math.abs(b[0]-a[0])===Math.abs(b[1]-a[1]))) return null; return Array.from({length:n+1},(_,k)=>[a[0]+df*k,a[1]+dc*k]); }
function intenta(a,b){ const cs=celdas(a,b); if(!cs) return false; const txt=cs.map(([f,c])=>g[f][c]).join(""), inv=[...txt].reverse().join("");
  const p=pals.find(p=>!ok.has(p.w)&&(p.w===txt||p.w===inv)&&((p.f===a[0]&&p.c===a[1])||(p.f===b[0]&&p.c===b[1])));
  if(!p) return false; ok.add(p.w); marcas.push({cs,col:COLS[marcas.length%COLS.length]}); return true; }
function pinta(tmp){
  const s=J.$("#sl"); s.style.gridTemplateColumns=`repeat(${N},1fr)`;
  const color={}; marcas.forEach(m=>m.cs.forEach(([f,c])=>color[f+","+c]=m.col));
  const t=new Set((tmp||[]).map(([f,c])=>f+","+c));
  s.innerHTML=g.map((r,f)=>r.map((l,c)=>`<div data-f="${f}" data-c="${c}" class="${ini&&ini[0]===f&&ini[1]===c?"ini":""} ${t.has(f+","+c)?"tmp":""}" style="${color[f+","+c]?`background:${color[f+","+c]}`:""}">${l}</div>`).join("")).join("");
  J.$("#sl-l").innerHTML=pals.map(p=>`<span class="${ok.has(p.w)?"ok":""}">${p.w}</span>`).join("");
  J.$("#sl-e").textContent=`${ok.size} of ${pals.length} found`;
}
let arr=null;
J.$("#sl").addEventListener("pointerdown",e=>{ const d=e.target.closest("[data-f]"); if(!d) return; const p=[+d.dataset.f,+d.dataset.c];
  if(ini){ const r=intenta(ini,p); ini=null; arr=null; pinta(); if(r) fin(); else J.aviso("That’s not one of the words in the list"); return; }
  arr=p; ini=p; pinta(); });
J.$("#sl").addEventListener("pointermove",e=>{ if(!arr||e.pointerType!=="mouse"||!e.buttons) return; const d=document.elementFromPoint(e.clientX,e.clientY)?.closest("[data-f]"); if(!d) return; pinta(celdas(arr,[+d.dataset.f,+d.dataset.c])); });
J.$("#sl").addEventListener("pointerup",e=>{ if(!arr||e.pointerType!=="mouse") return; const d=document.elementFromPoint(e.clientX,e.clientY)?.closest("[data-f]"); if(!d) return; const p=[+d.dataset.f,+d.dataset.c]; if(p[0]===arr[0]&&p[1]===arr[1]) return; const r=intenta(arr,p); ini=null; arr=null; pinta(); if(r) fin(); });
function fin(){ if(ok.size===pals.length){ J.confeti(); J.modal("<h2>🏆 Puzzle solved!</h2><p>You found all the words.</p>",[{txt:"Another puzzle"}]).then(nueva); } }
nueva();
})();
