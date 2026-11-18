/* Crucigrama generado al azar */
(function(){
J.paginaJuego({titulo:"Crossword", emoji:"✏️", ficha:"crucigrama", ins:{
  titulo:"Crossword",
  intro:"Every time you press <b>New</b> a different crossword is created. Fill the white squares with the words that match each clue.",
  pasos:[
    "Tap a white square to start typing. The active word is highlighted in blue and its clue appears above.",
    "Type with your keyboard: the cursor moves on to the next square by itself.",
    "Tap the same square again to switch between <b>across</b> y <b>down</b>.",
    "You can also tap a clue in the list to jump to its word.",
    "Press <b>✔️ Check</b> to see the wrong letters in red.",
    "If you get stuck, <b>💡 Letter</b> reveals the letter in the selected square.",
    "When all the letters are correct, you’ve completed the crossword!"
  ],
  consejos:["Start with the easiest clues: the letters you fill in will help with the crossing words.","You can choose a particular topic or mix them all."]
}});
const css=`
.cr-zona{display:grid;grid-template-columns:minmax(0,560px) 1fr;gap:20px;align-items:start}
@media(max-width:900px){.cr-zona{grid-template-columns:1fr}}
.cr-grid{display:grid;gap:2px;background:#0b1030;padding:6px;border-radius:12px;width:100%}
.cr-c{aspect-ratio:1;position:relative;background:transparent}
.cr-c.b{background:#fff;border-radius:3px}
.cr-c input{position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent;text-align:center;font-family:var(--titulos);font-weight:600;font-size:clamp(12px,3.4vw,24px);text-transform:uppercase;color:#111;caret-color:transparent;padding:0;border-radius:3px}
.cr-c input:focus{outline:none}
.cr-c.palabra{background:#cdeffd}.cr-c.act{background:#ffd60a}
.cr-c.mal input{color:#d00}
.cr-c.ok input{color:#0a7a3d}
.cr-c .num{position:absolute;top:1px;left:2px;font-size:clamp(6px,1.3vw,10px);color:#333;font-weight:800;z-index:1;pointer-events:none}
.cr-pista{background:var(--panel2);border-radius:12px;padding:10px 14px;font-weight:700;margin-bottom:10px;min-height:48px}
.cr-lista h3{margin:.6em 0 .3em}
.cr-lista div{padding:4px 8px;border-radius:8px;cursor:pointer;color:var(--suave)}
.cr-lista div:hover,.cr-lista div.act{background:var(--panel2);color:var(--texto)}
.cr-lista div.hecha{text-decoration:line-through;opacity:.6}
`;
document.head.append(J.el("style",{},css));
const N=13;
let G, palabras, sel={f:0,c:0,dir:"h"}, tema="todos";
const raiz=J.$("#juego");

function genera(){
  let mejor=null;
  for(let intento=0;intento<25;intento++){
    const lista=J.baraja(PALABRAS.filter(p=>(tema==="todos"||p[2]===tema)&&p[0].length<=N));
    const g=Array.from({length:N},()=>Array(N).fill(null)), puestas=[];
    const cabe=(w,f,c,d)=>{
      const df=d==="v"?1:0, dc=d==="h"?1:0; let cruces=0;
      const ef=f-df, ec=c-dc, ff=f+df*w.length, fc=c+dc*w.length;
      if(ef>=0&&ec>=0&&g[ef][ec]) return -1;
      if(ff<N&&fc<N&&g[ff]&&g[ff][fc]) return -1;
      for(let k=0;k<w.length;k++){
        const r=f+df*k, s=c+dc*k; if(r<0||s<0||r>=N||s>=N) return -1;
        const x=g[r][s];
        if(x){ if(x!==w[k]) return -1; cruces++; }
        else { // vecinos laterales vacíos
          const a1=[r+dc,s+df], a2=[r-dc,s-df];
          for(const [y,z] of [a1,a2]) if(y>=0&&z>=0&&y<N&&z<N&&g[y][z]) return -1;
        }
      }
      return cruces;
    };
    const pon=(p,f,c,d)=>{ const w=p[0]; for(let k=0;k<w.length;k++) g[f+(d==="v"?k:0)][c+(d==="h"?k:0)]=w[k]; puestas.push({w,pista:p[1],f,c,d}); };
    const p0=lista.shift(); pon(p0,Math.floor(N/2),Math.floor((N-p0[0].length)/2),"h");
    for(const p of lista){
      if(puestas.length>=16) break;
      if(puestas.some(x=>x.w===p[0])) continue;
      let op=[];
      for(const q of puestas) for(let i=0;i<q.w.length;i++) for(let j=0;j<p[0].length;j++){
        if(q.w[i]!==p[0][j]) continue;
        const d=q.d==="h"?"v":"h";
        const f=q.d==="h"? q.f-j : q.f+i, c=q.d==="h"? q.c+i : q.c-j;
        const r=cabe(p[0],f,c,d); if(r>0) op.push([r,f,c,d]);
      }
      if(op.length){ op.sort((a,b)=>b[0]-a[0]); const [,f,c,d]=op[0]; pon(p,f,c,d); }
    }
    if(!mejor||puestas.length>mejor.p.length) mejor={g,p:puestas};
    if(puestas.length>=13) break;
  }
  // numeración
  const nums={}; let n=1; const lista=mejor.p.sort((a,b)=>a.f-b.f||a.c-b.c);
  for(const p of lista){ const k=p.f+","+p.c; if(!nums[k]) nums[k]=n++; p.n=nums[k]; }
  G={sol:mejor.g, nums, val:Array.from({length:N},()=>Array(N).fill(""))};
  palabras=lista;
  sel={f:palabras[0].f,c:palabras[0].c,dir:palabras[0].d};
  pinta();
}
function montar(){
  raiz.innerHTML=`<div class="cr-zona"><div><div class="cr-pista" id="cr-p"></div><div class="cr-grid" id="cr-g" style="grid-template-columns:repeat(${N},1fr)"></div></div>
  <div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
  <select id="cr-tema"><option value="todos">🎲 All topics</option>${Object.entries(TEMAS_PALABRAS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select>
  <button class="btn peq" id="cr-nuevo">🔄 New</button><button class="btn sec peq" id="cr-comp">✔️ Check</button><button class="btn sec peq" id="cr-letra">💡 Letter</button><button class="btn sec peq" id="cr-sol">👀 Solve</button></div>
  <div class="cr-lista" id="cr-l"></div></div></div>`;
  J.$("#cr-nuevo").onclick=genera;
  J.$("#cr-tema").onchange=e=>{ tema=e.target.value; genera(); };
  J.$("#cr-comp").onclick=()=>{ J.$$(".cr-c.b").forEach(d=>{ const f=+d.dataset.f,c=+d.dataset.c, v=G.val[f][c]; d.classList.toggle("mal", !!v && v!==G.sol[f][c]); }); J.aviso("The letters in red are wrong"); };
  J.$("#cr-letra").onclick=()=>{ G.val[sel.f][sel.c]=G.sol[sel.f][sel.c]; pinta(); revisa(); };
  J.$("#cr-sol").onclick=()=>{ for(let f=0;f<N;f++) for(let c=0;c<N;c++) if(G.sol[f][c]) G.val[f][c]=G.sol[f][c]; pinta(); };
}
function palabraEn(f,c,dir){ return palabras.find(p=>p.d===dir&&(dir==="h"? p.f===f&&c>=p.c&&c<p.c+p.w.length : p.c===c&&f>=p.f&&f<p.f+p.w.length)); }
function actual(){ return palabraEn(sel.f,sel.c,sel.dir)||palabraEn(sel.f,sel.c,sel.dir==="h"?"v":"h"); }
function pinta(){
  const g=J.$("#cr-g"); g.innerHTML="";
  const pa=actual(); if(pa) sel.dir=pa.d;
  for(let f=0;f<N;f++) for(let c=0;c<N;c++){
    const d=J.el("div",{class:"cr-c"});
    if(G.sol[f][c]){
      d.classList.add("b"); d.dataset.f=f; d.dataset.c=c;
      if(G.nums[f+","+c]) d.append(J.el("span",{class:"num"},G.nums[f+","+c]));
      const inp=J.el("input",{maxlength:"1",autocomplete:"off",autocapitalize:"characters","aria-label":`Row ${f+1} column ${c+1}`});
      inp.value=G.val[f][c];
      if(pa && (pa.d==="h"? f===pa.f&&c>=pa.c&&c<pa.c+pa.w.length : c===pa.c&&f>=pa.f&&f<pa.f+pa.w.length)) d.classList.add("palabra");
      if(f===sel.f&&c===sel.c) d.classList.add("act");
      inp.onclick=()=>{ if(sel.f===f&&sel.c===c) sel.dir=sel.dir==="h"?"v":"h"; sel.f=f; sel.c=c; if(!palabraEn(f,c,sel.dir)) sel.dir=sel.dir==="h"?"v":"h"; pinta(); };
      inp.oninput=e=>{ const v=(inp.value||"").toUpperCase().replace(/[^A-ZÑ]/g,"").slice(-1); G.val[f][c]=v; if(v) mueve(1); else pinta(); revisa(); };
      inp.onkeydown=e=>{
        if(e.key==="Backspace"&&!inp.value){ mueve(-1); G.val[sel.f][sel.c]=""; pinta(); e.preventDefault(); }
        const fl={ArrowRight:[0,1,"h"],ArrowLeft:[0,-1,"h"],ArrowDown:[1,0,"v"],ArrowUp:[-1,0,"v"]}[e.key];
        if(fl){ e.preventDefault(); const nf=sel.f+fl[0], nc=sel.c+fl[1]; if(nf>=0&&nc>=0&&nf<N&&nc<N&&G.sol[nf][nc]){ sel.f=nf; sel.c=nc; sel.dir=fl[2]; pinta(); } }
      };
      d.append(inp);
    }
    g.append(d);
  }
  const foco=J.$(`.cr-c[data-f="${sel.f}"][data-c="${sel.c}"] input`); if(foco) foco.focus({preventScroll:true});
  J.$("#cr-p").innerHTML = pa ? `${pa.n}. ${pa.d==="h"?"Across":"Down"}: ${pa.pista} <span style="color:var(--suave)">(${pa.w.length} letters)</span>` : "";
  const hecha=p=>[...p.w].every((ch,k)=>G.val[p.f+(p.d==="v"?k:0)][p.c+(p.d==="h"?k:0)]===ch);
  const sec=d=>palabras.filter(p=>p.d===d).sort((a,b)=>a.n-b.n).map(p=>`<div data-n="${p.n}" data-d="${d}" class="${p===pa?"act":""} ${hecha(p)?"hecha":""}"><b>${p.n}.</b> ${p.pista}</div>`).join("");
  J.$("#cr-l").innerHTML=`<h3>➡️ Across</h3>${sec("h")}<h3>⬇️ Down</h3>${sec("v")}`;
  J.$$("#cr-l div").forEach(x=>x.onclick=()=>{ const p=palabras.find(q=>q.n===+x.dataset.n&&q.d===x.dataset.d); sel={f:p.f,c:p.c,dir:p.d}; pinta(); });
}
function mueve(k){
  const p=actual(); if(!p) return pinta();
  const nf=sel.f+(p.d==="v"?k:0), nc=sel.c+(p.d==="h"?k:0);
  if(nf>=p.f&&nc>=p.c&&nf<p.f+(p.d==="v"?p.w.length:1)&&nc<p.c+(p.d==="h"?p.w.length:1)){ sel.f=nf; sel.c=nc; }
  pinta();
}
function revisa(){
  for(let f=0;f<N;f++) for(let c=0;c<N;c++) if(G.sol[f][c]&&G.val[f][c]!==G.sol[f][c]) return;
  J.confeti(140); J.modal("<h2>🏆 Crossword completed!</h2><p>All the words are correct.</p>",[{txt:"Another crossword"}]).then(genera);
}
montar(); genera();
})();
