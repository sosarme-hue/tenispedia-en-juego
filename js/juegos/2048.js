/* 2048 */
(function(){
J.paginaJuego({titulo:"2048", emoji:"🔢", ficha:"2048", ins:{
  titulo:"2048",
  intro:"A 4×4 board with numbered tiles. Join matching tiles to add them up and try to reach the <b>2048</b>.",
  pasos:[
    "Move <b>all the tiles</b> at once up, down, left or right with the <b>arrow keys</b> o <b>swiping</b> on the board.",
    "When two tiles with the <b>same number</b> collide, they merge into one with the sum: 2+2=4, 4+4=8…",
    "After each move a new tile (a 2 or a 4) appears in an empty space.",
    "Every time you merge tiles, their value is added to your score.",
    "You win when you make the <b>2048</b> tile, and you can keep playing to beat your best score.",
    "The game ends when the board is full and no tiles can be merged."
  ],
  consejos:["Pick a corner and always keep the biggest tile there.","Avoid moving towards the side opposite your corner."]
}});
document.head.append(J.el("style",{},`
.d48{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:#3d3a5c;padding:10px;border-radius:16px;max-width:420px;margin:0 auto;touch-action:none;box-shadow:var(--sombra)}
.d48 div{aspect-ratio:1;border-radius:10px;display:grid;place-items:center;font-family:var(--titulos);font-weight:700;background:#2a2846;color:#fff;min-width:0;font-size:clamp(1rem,6vw,2rem);transition:background .15s}
.d48 .nuevo{animation:rueda .25s}
`));
const COL={2:"#fde68a",4:"#fcd34d",8:"#fb923c",16:"#f97316",32:"#ef4444",64:"#dc2626",128:"#a78bfa",256:"#8b5cf6",512:"#6d28d9",1024:"#22c55e",2048:"#facc15"};
let t, pts, mejor=J.lee("2048-mejor",0), ganado, fin, nuevo=-1;
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="marcador" style="justify-content:center"><div class="caja"><small>Points</small><b id="d-p">0</b></div><div class="caja"><small>Best</small><b id="d-m">${mejor}</b></div><button class="btn peq" id="d-nueva" style="align-self:center">🔄 New game</button></div>
<div class="estado" id="d-est"></div><div class="d48" id="d48"></div>
<div class="centro-txt" style="margin-top:10px;color:var(--suave)">Arrow keys or swipe</div>`;
J.$("#d-nueva").onclick=nueva;
function hueco(){ const l=t.map((v,i)=>v?-1:i).filter(i=>i>=0); if(!l.length) return; const i=J.elige(l); t[i]=Math.random()<.9?2:4; nuevo=i; }
function nueva(){ t=Array(16).fill(0); pts=0; ganado=false; fin=false; hueco(); hueco(); pinta(); }
function pinta(){ J.$("#d48").innerHTML=t.map((v,i)=>`<div class="${i===nuevo?"nuevo":""}" style="${v?`background:${COL[v]||"#111"};color:${v<=4?"#3d2c00":"#fff"};font-size:${v>=1024?"clamp(.8rem,4.6vw,1.6rem)":""}`:""}">${v||""}</div>`).join("");
  J.$("#d-p").textContent=pts; J.$("#d-m").textContent=mejor;
  J.$("#d-est").textContent=fin?"No moves left. Game over!":ganado?"You reached 2048! Keep going if you like 🎉":"Join matching numbers"; }
function linea(a){ const v=a.filter(x=>x), r=[]; let s=0; for(let i=0;i<v.length;i++){ if(v[i]===v[i+1]){ r.push(v[i]*2); s+=v[i]*2; i++; } else r.push(v[i]); } while(r.length<4) r.push(0); return [r,s]; }
function mueve(dir){ if(fin) return; let cambio=false; const idx=(f,c)=>f*4+c;
  for(let k=0;k<4;k++){ let pos=[0,1,2,3].map(q=> dir==="izq"?idx(k,q): dir==="der"?idx(k,3-q): dir==="arr"?idx(q,k): idx(3-q,k));
    const [r,s]=linea(pos.map(p=>t[p])); pos.forEach((p,q)=>{ if(t[p]!==r[q]) cambio=true; t[p]=r[q]; }); pts+=s; }
  if(!cambio) return; hueco();
  if(pts>mejor){ mejor=pts; J.guarda("2048-mejor",mejor); }
  if(!ganado&&t.includes(2048)){ ganado=true; J.confeti(); }
  const puede=t.includes(0)||t.some((v,i)=>(i%4<3&&v===t[i+1])||(i<12&&v===t[i+4]));
  if(!puede) fin=true; pinta(); }
document.addEventListener("keydown",e=>{ const d={ArrowLeft:"izq",ArrowRight:"der",ArrowUp:"arr",ArrowDown:"aba"}[e.key]; if(d){ e.preventDefault(); mueve(d); } });
let x0,y0; const z=J.$("#d48");
z.addEventListener("touchstart",e=>{ x0=e.touches[0].clientX; y0=e.touches[0].clientY; },{passive:true});
z.addEventListener("touchend",e=>{ const dx=e.changedTouches[0].clientX-x0, dy=e.changedTouches[0].clientY-y0; if(Math.max(Math.abs(dx),Math.abs(dy))<25) return; mueve(Math.abs(dx)>Math.abs(dy)?(dx>0?"der":"izq"):(dy>0?"aba":"arr")); });
z.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse"){ x0=e.clientX; y0=e.clientY; } });
z.addEventListener("pointerup",e=>{ if(e.pointerType!=="mouse") return; const dx=e.clientX-x0, dy=e.clientY-y0; if(Math.max(Math.abs(dx),Math.abs(dy))<25) return; mueve(Math.abs(dx)>Math.abs(dy)?(dx>0?"der":"izq"):(dy>0?"aba":"arr")); });
nueva();
})();
