/* Tangram */
(function(){
J.paginaJuego({titulo:"Tangram", emoji:"🔷", ficha:"tangram", ins:{
  titulo:"Tangram",
  intro:"The Chinese puzzle of the <b>seven pieces</b>: two large triangles, one medium, two small ones, a square and a parallelogram. You have to cover the silhouette exactly, using all of them without overlapping.",
  pasos:[
    "<b>Drag</b> each piece from below onto the grey silhouette.",
    "<b>Tap</b> a piece (without dragging it) to rotate it an eighth of a turn.",
    "The parallelogram isn’t symmetrical: if it doesn’t fit, select it and press <b>Flip</b>.",
    "Pieces snap to nearby corners so they fit easily.",
    "When the silhouette is completely covered, the puzzle is solved. There are figures of different difficulty: move between them with the arrows."
  ],
  consejos:["Start with the two large triangles: they only fit in a few places.","Look at the right-angled corners of the silhouette: that’s usually where the triangles or the square go.","If you get stuck, press Hint to place a piece."]
}});
document.head.append(J.el("style",{},`
.tg-caja{max-width:620px;margin:0 auto;background:var(--panel);border:1px solid var(--borde);border-radius:18px;padding:6px;touch-action:none;user-select:none}
.tg-caja svg{width:100%;height:auto;display:block}
.tg-p{cursor:grab}.tg-p.act polygon{stroke:#fff;stroke-width:.05}
.tg-ctl{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
`));
const FORMAS=[
  [[0,0],[2,0],[0,2]],[[0,0],[2,0],[0,2]],[[0,0],[2,0],[1,1]],[[0,0],[1,0],[0,1]],[[0,0],[1,0],[0,1]],[[0,0],[1,0],[1,1],[0,1]],[[0,0],[1,0],[2,1],[1,1]]];
const COLOR=["#ff4d6d","#4cc9f0","#ffc94a","#2ed47a","#9b5de5","#ff9f1c","#f15bb5"];
const TIPO=["L","L","M","S","S","Q","P"];
// Figuras: listas de polígonos (cuadrícula en la que el cateto del triángulo pequeño mide 1)
const FIG=[
 {n:"Rectangle",p:[["L",[[0,0],[2,0],[0,2]]],["L",[[2,0],[2,2],[0,2]]],["Q",[[3,1],[4,1],[4,2],[3,2]]],["M",[[2,0],[2,2],[3,1]]],["P",[[2,0],[3,0],[4,1],[3,1]]],["S",[[3,0],[4,0],[4,1]]],["S",[[2,2],[3,1],[3,2]]]]},
 {n:"Triangle",p:[["L",[[0,2],[0,4],[2,2]]],["L",[[2,0],[4,0],[2,2]]],["Q",[[1,1],[2,1],[2,2],[1,2]]],["M",[[0,0],[0,2],[1,1]]],["P",[[0,0],[1,0],[2,1],[1,1]]],["S",[[1,0],[2,0],[2,1]]],["S",[[0,2],[1,1],[1,2]]]]},
 {n:"House",p:[["L",[[0,0],[2,0],[0,2]]],["L",[[2,0],[2,2],[0,2]]],["P",[[-1,0],[0,0],[1,-1],[0,-1]]],["Q",[[1,0],[2,0],[2,-1],[1,-1]]],["S",[[0,0],[1,0],[1,-1]]],["S",[[2,0],[3,0],[2,-1]]],["M",[[0,-1],[2,-1],[1,-2]]]]},
 {n:"Square",p:[["L",[[0,2],[2,0],[2,2]]],["L",[[2,0],[4,2],[2,2]]],["P",[[0,2],[1,2],[2,3],[1,3]]],["Q",[[2,2],[3,2],[3,3],[2,3]]],["S",[[1,2],[2,2],[2,3]]],["S",[[3,2],[4,2],[3,3]]],["M",[[1,3],[3,3],[2,4]]]]},
 {n:"Boat",p:[["L",[[0,0],[0,2],[2,2]]],["L",[[0,2],[0,4],[2,2]]],["S",[[-1,4],[0,4],[0,5]]],["Q",[[0,4],[1,4],[1,5],[0,5]]],["M",[[1,4],[3,4],[2,5]]],["S",[[1,4],[2,5],[1,5]]],["P",[[3,4],[4,4],[3,5],[2,5]]]]},
 {n:"Arrow",p:[["S",[[0,0],[0,1],[1,1]]],["M",[[0,0],[2,0],[1,1]]],["P",[[2,0],[3,0],[2,1],[1,1]]],["S",[[2,1],[3,0],[3,1]]],["Q",[[3,0],[4,0],[4,1],[3,1]]],["L",[[4,-1.5],[4,.5],[6,.5]]],["L",[[4,.5],[4,2.5],[6,.5]]]]},
 {n:"Rocket",p:[["M",[[0,1],[2,1],[1,0]]],["L",[[0,1],[2,1],[0,3]]],["L",[[2,1],[2,3],[0,3]]],["S",[[-1,3],[0,3],[0,2]]],["S",[[2,2],[2,3],[3,3]]],["Q",[[.5,3],[1.5,3],[1.5,4],[.5,4]]],["P",[[1.5,4],[.5,4],[-.5,5],[.5,5]]]]},
 {n:"Fish",p:[["L",[[2,0],[2,2],[0,2]]],["L",[[2,2],[2,4],[0,2]]],["S",[[3,1],[3,2],[2,2]]],["S",[[2,2],[3,2],[3,3]]],["P",[[3,1],[3,2],[4,1],[4,0]]],["Q",[[3,2],[4,2],[4,3],[3,3]]],["M",[[0,0],[2,0],[1,1]]]]}
];
const raiz=J.$("#juego");
const centro=f=>{ let x=0,y=0; f.forEach(p=>{x+=p[0];y+=p[1];}); return [x/f.length,y/f.length]; };
const C=FORMAS.map(centro);
let fi=J.lee("tg-fig",0), pz, act=-1, hecho=false, resueltos=J.lee("tg-ok",[]);
const W=8, H=10.7, ZONA={x0:.4,y0:.3,w:7.2,h:5.6};
function verts(p){ const f=FORMAS[p.k], c=C[p.k], a=p.r*Math.PI/4, co=Math.cos(a), si=Math.sin(a);
  return f.map(([x,y])=>{ let dx=x-c[0], dy=y-c[1]; if(p.f) dx=-dx; return [co*dx-si*dy+c[0]+p.x, si*dx+co*dy+c[1]+p.y]; }); }
let silu=[], offX=0, offY=0;
function preparaFig(){ const F=FIG[fi]; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; F.p.forEach(([,ps])=>ps.forEach(([x,y])=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}));
  offX=ZONA.x0+(ZONA.w-(x1-x0))/2-x0; offY=ZONA.y0+(ZONA.h-(y1-y0))/2-y0; silu=F.p.map(([,ps])=>ps.map(([x,y])=>[x+offX,y+offY])); }
function nueva(){ preparaFig(); hecho=false; act=-1;
  pz=FORMAS.map((f,k)=>({k,x:0,y:0,r:0,f:false}));
  const sitio=[[.3,6.6],[2.9,6.6],[5.6,6.6],[.6,9.2],[2.1,9.2],[3.6,9.2],[5.2,9.2]];
  pz.forEach((p,k)=>{ p.r=J.azar(4)*2; const v=verts(p); const mx=Math.min(...v.map(q=>q[0])), my=Math.min(...v.map(q=>q[1])); p.x+=sitio[k][0]-mx; p.y+=sitio[k][1]-my; });
  pinta(); }
const pt=v=>v.map(q=>q[0].toFixed(3)+","+q[1].toFixed(3)).join(" ");
function pinta(){ const z=J.$("#tg");
  z.innerHTML=`<svg viewBox="0 0 ${W} ${H}" id="tg-svg"><rect x="0" y="0" width="${W}" height="6.2" fill="rgba(127,127,127,.08)" rx=".3"/>
  <g>${silu.map(s=>`<polygon points="${pt(s)}" fill="${hecho?"#2ed47a":"#5b6478"}" stroke="${hecho?"#2ed47a":"#5b6478"}" stroke-width=".03" stroke-linejoin="round"/>`).join("")}</g>
  ${pz.map((p,i)=>`<g class="tg-p ${p.k===act?"act":""}" data-i="${i}"><polygon points="${pt(verts(p))}" fill="${COLOR[p.k]}" stroke="rgba(0,0,0,.35)" stroke-width=".04" stroke-linejoin="round"/></g>`).join("")}</svg>`;
  J.$("#tg-nom").textContent=`${fi+1}/${FIG.length} · ${FIG[fi].n}${resueltos.includes(fi)?" ✅":""}`;
  J.$("#tg-vol").disabled=act!==6;
  J.$("#tg-est").textContent= hecho?"🏆 Figure completed!":"Cover the grey silhouette with the seven pieces"; }
function snap(i){ const v=verts(pz[i]); let best=.32, d=null; const obj=[]; silu.forEach(s=>s.forEach(q=>obj.push(q))); pz.forEach((p,k)=>{ if(k!==i) verts(p).forEach(q=>obj.push(q)); });
  v.forEach(a=>obj.forEach(b=>{ const dd=Math.hypot(a[0]-b[0],a[1]-b[1]); if(dd<best){ best=dd; d=[b[0]-a[0],b[1]-a[1]]; } }));
  if(d){ pz[i].x+=d[0]; pz[i].y+=d[1]; } }
function dentro(q,poly){ let c=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const [xi,yi]=poly[i],[xj,yj]=poly[j]; if(((yi>q[1])!==(yj>q[1]))&&(q[0]<(xj-xi)*(q[1]-yi)/(yj-yi)+xi)) c=!c; } return c; }
function comprueba(){ const vs=pz.map(verts); let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; silu.forEach(s=>s.forEach(([x,y])=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}));
  let tot=0, mal=0; const st=.07;
  for(let x=x0+st/2;x<x1;x+=st) for(let y=y0+st/2;y<y1;y+=st){ const q=[x,y]; const enS=silu.some(s=>dentro(q,s)); const n=vs.filter(v=>dentro(q,v)).length; if(enS){ tot++; if(n!==1) mal++; } else if(n) mal++; }
  // ninguna pieza fuera de la zona de la silueta
  const fuera=vs.some(v=>v.some(([x,y])=>x<x0-.05||x>x1+.05||y<y0-.05||y>y1+.05));
  if(!fuera&&mal/tot<.02){ hecho=true; if(!resueltos.includes(fi)){ resueltos.push(fi); J.guarda("tg-ok",resueltos); } J.confeti(); } }
raiz.innerHTML=`<div class="tg-ctl"><button class="btn sec peq" id="tg-ant">◀</button><b id="tg-nom" style="min-width:150px;text-align:center"></b><button class="btn sec peq" id="tg-sig">▶</button></div>
<div class="tg-ctl"><button class="btn sec peq" id="tg-vol" disabled>↔️ Flip</button><button class="btn sec peq" id="tg-pista">💡 Hint</button><button class="btn sec peq" id="tg-rei">🔄 Restart</button></div>
<div class="estado" id="tg-est"></div><div class="tg-caja" id="tg"></div>`;
J.$("#tg-ant").onclick=()=>{ fi=(fi+FIG.length-1)%FIG.length; J.guarda("tg-fig",fi); nueva(); };
J.$("#tg-sig").onclick=()=>{ fi=(fi+1)%FIG.length; J.guarda("tg-fig",fi); nueva(); };
J.$("#tg-rei").onclick=nueva;
J.$("#tg-vol").onclick=()=>{ if(act!==6||hecho) return; const i=pz.findIndex(q=>q.k===6); const p=pz[i]; p.f=!p.f; snap(i); comprueba(); pinta(); };
J.$("#tg-pista").onclick=()=>{ if(hecho) return; // coloca una pieza que aún no esté en su sitio
  const F=FIG[fi]; const usados=new Set();
  for(let t=0;t<F.p.length;t++){ const [tipo,ps]=F.p[t]; const obj=ps.map(([x,y])=>[x+offX,y+offY]);
    const cand=pz.map((p,k)=>k).filter(k=>TIPO[pz[k].k]===tipo&&!usados.has(k));
    const ya=cand.find(k=>coincide(verts(pz[k]),obj)); if(ya!==undefined){ usados.add(ya); continue; }
    const k=cand[0]; if(k===undefined) continue; const p=pz[k];
    for(let f=0;f<2;f++) for(let r=0;r<8;r++){ p.f=!!f; p.r=r; p.x=0; p.y=0; const v=verts(p); const cv=centro(v), co=centro(obj); p.x=co[0]-cv[0]; p.y=co[1]-cv[1]; if(coincide(verts(p),obj)){ act=p.k; comprueba(); pinta(); J.aviso("Piece placed"); return; } }
  } };
function coincide(a,b){ return a.length===b.length&&a.every(q=>b.some(w=>Math.hypot(q[0]-w[0],q[1]-w[1])<.05)); }
// arrastre
let arr=null;
const aSVG=e=>{ const s=J.$("#tg-svg"); const m=s.getScreenCTM().inverse(); const p=s.createSVGPoint(); p.x=e.clientX; p.y=e.clientY; const r=p.matrixTransform(m); return [r.x,r.y]; };
J.$("#tg").addEventListener("pointerdown",e=>{ const g=e.target.closest(".tg-p"); if(!g||hecho) return; e.preventDefault(); const i=+g.dataset.i;
  pz.push(pz.splice(i,1)[0]); // la pieza tocada queda encima
  const k=pz.length-1; act=pz[k].k; const [x,y]=aSVG(e); arr={k,x,y,ox:pz[k].x,oy:pz[k].y,mov:false}; pinta(); });
window.addEventListener("pointermove",e=>{ if(!arr) return; const [x,y]=aSVG(e); const dx=x-arr.x, dy=y-arr.y; if(!arr.mov&&Math.hypot(dx,dy)<.15) return; arr.mov=true;
  const p=pz[arr.k]; p.x=Math.max(-1,Math.min(W-1,arr.ox+dx)); p.y=Math.max(-1,Math.min(H-1,arr.oy+dy)); pinta(); });
window.addEventListener("pointerup",()=>{ if(!arr) return; const a=arr; arr=null; const p=pz[a.k];
  if(!a.mov){ p.r=(p.r+1)%8; }
  snap(a.k); comprueba(); pinta(); });
nueva();
})();
