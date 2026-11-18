/* Word Rack — word-building game with letter tiles on a board */
(function(){
J.paginaJuego({titulo:"Atril: palabras cruzadas", emoji:"🔤", ficha:"juegos-de-palabras-con-fichas", ins:{
  titulo:"Word Rack",
  intro:"You play against the computer making English words on a 15 × 15 board, like a crossword. Each letter is worth a number of points. The highest score when the tiles run out wins.",
  pasos:[
    "You have <b>7 tiles</b> on your rack (below). Tap a tile and then tap the square on the board where you want to put it. To remove it, tap it again on the board.",
    "The <b>first word</b> must cover the centre square ⭐.",
    "All the tiles in one turn go in <b>a single row or a single column</b>, with no gaps, and the word must <b>touch the tiles already</b> on the board.",
    "Every word formed (including crossing words) must be in the dictionary.",
    "Press <b>✅ Play</b> to confirm. You score the value of the letters of each word formed.",
    "Special squares: <b>DL</b> double letter, <b>TL</b> triple letter, <b>DW</b> double word and <b>TW</b> triple word. They only count the first time they are covered.",
    "If you use all 7 tiles in one move, you get <b>50 bonus points</b>.",
    "The blank tile ⬜ is a wild card: it’s worth 0 points but can be any letter.",
    "If you don’t like your letters, press <b>🔄 Swap</b> (you lose your turn). You can also <b>Pass</b>.",
    "The game ends when there are no tiles left in the bag and a player runs out of tiles, or if you both pass twice in a row."
  ],
  consejos:["High-value letters (Z, Q, J, X, K) on a TL square give lots of points.","Short words crossing others also score.","Press 🔀 to shuffle your rack and spot new words."]
}});
const css=`
.at-zona{display:grid;grid-template-columns:minmax(0,640px) 1fr;gap:20px;align-items:start}
@media(max-width:960px){.at-zona{grid-template-columns:1fr}}
.at-tab{display:grid;grid-template-columns:repeat(15,1fr);gap:2px;background:#123;padding:5px;border-radius:12px;width:100%;box-shadow:var(--sombra)}
.at-c{aspect-ratio:1;border-radius:3px;background:#d9e8d0;position:relative;display:grid;place-items:center;font-size:clamp(5px,1.1vw,9px);font-weight:800;color:rgba(0,0,0,.55);cursor:pointer;user-select:none}
.at-c.TW{background:#e63946;color:#fff}.at-c.DW{background:#f4a3b5}.at-c.TL{background:#277da1;color:#fff}.at-c.DL{background:#9bd1e5}.at-c.CEN{background:#f4a3b5;font-size:clamp(10px,2.2vw,18px)}
.letra{width:100%;height:100%;border-radius:4px;background:linear-gradient(160deg,#ffe8a8,#f5c86a);box-shadow:inset 0 -2px 0 rgba(0,0,0,.2);display:grid;place-items:center;font-family:var(--titulos);font-weight:700;color:#3b2a00;font-size:clamp(11px,2.6vw,22px);position:relative}
.letra small{position:absolute;right:2px;bottom:0;font-size:.42em;font-family:var(--cuerpo)}
.letra.nueva{background:linear-gradient(160deg,#c8f7c5,#7ddc86)}
.letra.blanco{color:#a33}
.at-atril{display:flex;gap:6px;justify-content:center;background:#5a3a1a;padding:10px;border-radius:12px;margin-top:12px;min-height:66px}
.at-atril .letra{width:clamp(36px,9vw,56px);height:clamp(36px,9vw,56px);cursor:pointer;font-size:clamp(18px,4vw,28px);flex:0 0 auto}
.at-atril .letra.sel{outline:3px solid #fff;transform:translateY(-6px)}
.at-atril .letra.marca{outline:3px dashed #e63946}
.at-acc{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px}
.at-log{background:var(--panel);border-radius:14px;padding:10px;max-height:260px;overflow:auto;font-size:.92rem}
.at-log div{padding:3px 0;border-bottom:1px solid var(--borde)}
`;
document.head.append(J.el("style",{},css));
const N=15, C=7;
const VAL={a:1,e:1,i:1,o:1,u:1,l:1,n:1,s:1,t:1,r:1,d:2,g:2,b:3,c:3,m:3,p:3,f:4,h:4,v:4,w:4,y:4,k:5,j:8,x:8,q:10,z:10,"?":0};
const CANT={a:9,b:2,c:2,d:4,e:12,f:2,g:3,h:2,i:9,j:1,k:1,l:4,m:2,n:6,o:8,p:2,q:1,r:6,s:4,t:6,u:4,v:2,w:2,x:1,y:2,z:1,"?":2};
// casillas especiales (diseño propio, simétrico)
const ESP=Array.from({length:N},()=>Array(N).fill(""));
(function(){
  const pon=(t,lista)=>lista.forEach(([f,c])=>{ for(const [a,b] of [[f,c],[c,f],[N-1-f,c],[f,N-1-c],[N-1-f,N-1-c],[c,N-1-f],[N-1-c,f],[N-1-c,N-1-f]]) ESP[a][b]=t; });
  pon("TW",[[0,3],[3,0]]);
  pon("DW",[[1,1],[2,2],[3,3],[4,4],[6,1]]);
  pon("TL",[[1,6],[5,5],[0,7]]);
  pon("DL",[[0,0],[2,5],[3,7],[6,6],[4,1],[7,4]]);
  ESP[7][7]="CEN";
})();
let ON=null, yo=0, NJ=2;
const escH=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nom=j=>ON?(j===yo?"You":escH(ON.jugadores[j])):(j===0?"You":"Computer");
let tab, bolsa, atril=[[],[]], puntos=[0,0], turno=0, puestas=[], selA=null, pases=0, primera=true, marcados=new Set(), log=[], fin=false;
const raiz=J.$("#juego");

function nueva(){
  tab=Array.from({length:N},()=>Array(N).fill(null));
  bolsa=[]; for(const l in CANT) for(let k=0;k<CANT[l];k++) bolsa.push(l); bolsa=J.baraja(bolsa);
  atril=[[],[]]; puntos=[0,0]; turno=0; puestas=[]; selA=null; pases=0; primera=true; log=[]; fin=false;
  rellena(0); rellena(1); pinta();
}
function rellena(j){ while(atril[j].length<C&&bolsa.length) atril[j].push(bolsa.pop()); }
function pinta(){
  if(!J.$(".at-tab")){
    raiz.innerHTML=`<div class="at-zona"><div><div class="at-tab" id="tab"></div><div class="at-atril" id="atril"></div>
    <div class="at-acc"><button class="btn verde" id="b-jugar">✅ Play</button><button class="btn sec" id="b-rec">↩️ Recall</button><button class="btn sec" id="b-mez">🔀 Shuffle</button><button class="btn sec" id="b-cam">🔄 Swap</button><button class="btn sec" id="b-pasar">⏭️ Pass</button></div></div>
    <div><div class="marcador" id="marc"></div>
    <div class="estado" id="at-est"></div><h3>📜 Moves</h3><div class="at-log" id="at-log"></div>
    <p style="color:var(--suave);font-size:.85rem">English dictionary with over 270,000 words, including plurals and verb forms.</p></div></div>`;
    J.$("#b-jugar").onclick=jugarHumano; J.$("#b-rec").onclick=recoger; J.$("#b-mez").onclick=()=>{ recoger(); atril[yo]=J.baraja(atril[yo]); pinta(); };
    J.$("#b-cam").onclick=cambiar; J.$("#b-pasar").onclick=()=>{ if(turno!==yo||fin) return; recoger(); pases++; anota(ON?`${escH(ON.jugadores[yo])} passes.`:"You pass."); sigue(); };
  }
  const t=J.$("#tab"); t.innerHTML="";
  for(let f=0;f<N;f++) for(let c=0;c<N;c++){
    const e=ESP[f][c], d=J.el("div",{class:"at-c "+e});
    const ft=tab[f][c], pu=puestas.find(p=>p.f===f&&p.c===c);
    if(ft) d.innerHTML=letraHTML(ft.l,ft.blanco);
    else if(pu){ d.innerHTML=letraHTML(pu.l,pu.blanco,"nueva"); }
    else d.textContent= e==="CEN"?"⭐":e;
    d.onclick=()=>tocaTab(f,c);
    t.append(d);
  }
  const a=J.$("#atril"); a.innerHTML="";
  atril[yo].forEach((l,i)=>{ if(puestas.some(p=>p.i===i)) return; const d=J.el("div",{class:"letra"+(selA===i?" sel":"")+(marcados.has(i)?" marca":"")},`${l==="?"?"":l.toUpperCase()}<small>${VAL[l]||""}</small>`); d.onclick=()=>{ selA= selA===i?null:i; pinta(); }; a.append(d); });
  J.$("#marc").innerHTML=puntos.map((p,j)=>`<div class="caja" style="${ON&&j===turno&&!fin?"outline:2px solid var(--oro)":""}"><small>${nom(j)}</small><b>${p}</b></div>`).join("")+`<div class="caja"><small>Tiles in the bag</small><b>${bolsa.length}</b></div>`;
  J.$("#at-log").innerHTML=log.map(x=>`<div>${x}</div>`).join("");
  J.$("#at-est").textContent= fin? "Game over" : turno===yo? (puestas.length?`Points for this move: ${previa()}`:"Your turn: place tiles on the board") : ON?`${nom(turno)}’s turn…`:"🤔 The computer is thinking…";
}
const letraHTML=(l,bl,cls="")=>`<div class="letra ${cls} ${bl?"blanco":""}">${l.toUpperCase()}<small>${bl?0:VAL[l]}</small></div>`;
function previa(){ const r=valida(puestas); return r.ok? r.puntos : "—"; }
async function tocaTab(f,c){
  if(turno!==yo||fin) return;
  const k=puestas.findIndex(p=>p.f===f&&p.c===c);
  if(k>=0){ puestas.splice(k,1); return pinta(); }
  if(tab[f][c]||selA===null) return;
  let l=atril[yo][selA], blanco=false;
  if(l==="?"){ blanco=true; const abc="abcdefghijklmnopqrstuvwxyz".split(""); l=await J.modal(`<h2>⬜ Blank tile</h2><p>Which letter do you want it to be?</p>`,abc.map(x=>({txt:x.toUpperCase(),valor:x,cls:"sec peq"}))); }
  puestas.push({f,c,l,blanco,i:selA}); selA=null; pinta();
}
function recoger(){ puestas=[]; selA=null; pinta(); }
const libre=(f,c)=>f>=0&&c>=0&&f<N&&c<N;
function valida(ps, esCPU){
  if(!ps.length) return {ok:false,msg:"You haven’t placed any tiles."};
  const fs=new Set(ps.map(p=>p.f)), cs=new Set(ps.map(p=>p.c));
  if(fs.size>1&&cs.size>1) return {ok:false,msg:"The tiles must go in the same row or column."};
  const g=(f,c)=>{ const p=ps.find(x=>x.f===f&&x.c===c); if(p) return {l:p.l,bl:p.blanco,nueva:true}; const t=tab[f][c]; return t?{l:t.l,bl:t.blanco,nueva:false}:null; };
  let dir = fs.size===1&&cs.size>1 ? "h" : cs.size===1&&fs.size>1 ? "v" : null;
  if(!dir){ const p=ps[0]; dir = (libre(p.f,p.c-1)&&tab[p.f][p.c-1])||(libre(p.f,p.c+1)&&tab[p.f][p.c+1]) ? "h" : "v"; }
  const df=dir==="v"?1:0, dc=dir==="h"?1:0;
  // continuidad
  const orden=[...ps].sort((a,b)=>a.f-b.f||a.c-b.c), a=orden[0], z=orden[orden.length-1];
  for(let f=a.f,c=a.c; f<=z.f&&c<=z.c; f+=df,c+=dc) if(!g(f,c)) return {ok:false,msg:"There can’t be gaps between the tiles."};
  // palabra principal
  const palabra=(f0,c0,ddf,ddc)=>{ let f=f0,c=c0; while(libre(f-ddf,c-ddc)&&g(f-ddf,c-ddc)){f-=ddf;c-=ddc;} const cel=[]; while(libre(f,c)&&g(f,c)){ cel.push({...g(f,c),f,c}); f+=ddf;c+=ddc; } return cel; };
  const palabras=[]; const princ=palabra(a.f,a.c,df,dc); if(princ.length>1) palabras.push(princ);
  for(const p of ps){ const x=palabra(p.f,p.c,dc,df); if(x.length>1) palabras.push(x); }
  if(!palabras.length) return {ok:false,msg:"Words must have at least 2 letters."};
  if(primera){ if(!ps.some(p=>p.f===7&&p.c===7)) return {ok:false,msg:"The first word must cover the centre square ⭐."}; }
  else if(!palabras.some(w=>w.some(x=>!x.nueva))) return {ok:false,msg:"The word must touch a tile that’s already on the board."};
  let total=0; const textos=[];
  for(const w of palabras){
    const txt=w.map(x=>x.l).join(""); textos.push(txt.toUpperCase());
    if(!DICC.has(txt)) return {ok:false,msg:`“${txt.toUpperCase()}” isn’t in the dictionary.`};
    let s=0, mult=1;
    for(const x of w){ let v=x.bl?0:VAL[x.l]; if(x.nueva){ const e=ESP[x.f][x.c]; if(e==="DL") v*=2; if(e==="TL") v*=3; if(e==="DW"||e==="CEN") mult*=2; if(e==="TW") mult*=3; } s+=v; }
    total+=s*mult;
  }
  if(ps.length===7) total+=50;
  return {ok:true,puntos:total,palabras:textos};
}
function coloca(j,ps,r){
  ps.forEach(p=>{ tab[p.f][p.c]={l:p.l,blanco:p.blanco}; });
  const usados=ps.map(p=>p.i).sort((a,b)=>b-a); usados.forEach(i=>atril[j].splice(i,1));
  puntos[j]+=r.puntos; primera=false; pases=0; rellena(j);
  anota(`${ON?"🙂 "+escH(ON.jugadores[j]):j===0?"🙂 You":"🤖 Computer"}: ${r.palabras.join(", ")} (+${r.puntos})${ps.length===7?" All 7 tiles!":""}`);
}
function anota(t){ log.unshift(t); }
function jugarHumano(){
  if(turno!==yo||fin) return;
  const r=valida(puestas); if(!r.ok) return J.aviso("❌ "+r.msg,3000);
  const ps=puestas; puestas=[]; coloca(yo,ps,r);
  if(r.puntos>=30) J.aviso(`🎉 ${r.puntos} points!`);
  if(!atril[yo].length&&!bolsa.length) return termina();
  sigue();
}
async function cambiar(){
  if(turno!==yo||fin) return;
  recoger();
  if(bolsa.length<7) return J.aviso("There are fewer than 7 tiles in the bag: you can’t swap");
  const r=await J.modal(`<h2>🔄 Swap tiles</h2><p>All your tiles will go back into the bag and you’ll take 7 new ones. You lose your turn.</p>`,[{txt:"Cancel",cls:"sec",valor:0},{txt:"Swap all",valor:1}]);
  if(!r) return;
  bolsa.push(...atril[yo]); atril[yo]=[]; bolsa=J.baraja(bolsa); rellena(yo); anota(ON?`${escH(ON.jugadores[yo])} swaps their tiles.`:"You swap your tiles."); pases++; sigue();
}
async function turnoCPU(){
  turno=1; pinta(); await J.espera(400);
  if(pases>=4) return termina();
  const mejor=buscaCPU();
  if(mejor){ coloca(1,mejor.ps,mejor.r); }
  else { if(bolsa.length>=7){ bolsa.push(...atril[1]); atril[1]=[]; bolsa=J.baraja(bolsa); rellena(1); anota("🤖 The computer swaps its tiles."); } else anota("🤖 The computer passes."); pases++; }
  turno=0; pinta();
  if(!atril[1].length&&!bolsa.length) return termina();
  if(pases>=4) return termina();
}
function buscaCPU(){
  const ra=atril[1]; const cuenta={}; ra.forEach(l=>cuenta[l]=(cuenta[l]||0)+1);
  const blancos=cuenta["?"]||0;
  let mejor=null; const t0=performance.now();
  const anclas=[]; for(let f=0;f<N;f++) for(let c=0;c<N;c++) if(tab[f][c]) anclas.push([f,c]);
  if(!anclas.length) anclas.push([7,7,true]);
  const formable=(w,extra)=>{ const cc={...cuenta}; let bl=blancos; if(extra) cc[extra]=(cc[extra]||0)+1; for(const ch of w){ if(cc[ch]) cc[ch]--; else if(bl) bl--; else return false; } return true; };
  // candidatos por letra ancla
  const cache={};
  const cand=letra=>{ if(cache[letra]) return cache[letra]; const r=[]; for(const w of DICC){ if(w.length>9) continue; if(letra&&!w.includes(letra)) continue; if(formable(w,letra)) r.push(w); } r.sort((a,b)=>b.length-a.length); return cache[letra]=r.slice(0,600); };
  for(const [f,c,vacio] of J.baraja(anclas).slice(0,40)){
    const letra=vacio?null:tab[f][c].l;
    for(const w of cand(letra)){
      for(const dir of ["h","v"]){
        const df=dir==="v"?1:0, dc=dir==="h"?1:0;
        const posiciones = letra? [...w].map((ch,k)=>ch===letra?k:-1).filter(k=>k>=0) : [...Array(w.length).keys()];
        for(const k of posiciones){
          const f0=f-df*k, c0=c-dc*k; if(!libre(f0,c0)||!libre(f0+df*(w.length-1),c0+dc*(w.length-1))) continue;
          // fichas antes y después deben estar vacías
          if(libre(f0-df,c0-dc)&&tab[f0-df][c0-dc]) continue;
          const ff=f0+df*w.length, fc=c0+dc*w.length; if(libre(ff,fc)&&tab[ff][fc]) continue;
          const ps=[]; const usados={}; let ok=true;
          for(let q=0;q<w.length;q++){
            const rf=f0+df*q, rc=c0+dc*q, t=tab[rf][rc];
            if(t){ if(t.l!==w[q]){ ok=false; break; } continue; }
            let idx=ra.findIndex((l,i)=>l===w[q]&&!usados[i]); let bl=false;
            if(idx<0){ idx=ra.findIndex((l,i)=>l==="?"&&!usados[i]); bl=true; }
            if(idx<0){ ok=false; break; }
            usados[idx]=1; ps.push({f:rf,c:rc,l:w[q],blanco:bl,i:idx});
          }
          if(!ok||!ps.length) continue;
          const r=valida(ps,true);
          if(r.ok&&(!mejor||r.puntos>mejor.r.puntos)) mejor={ps,r};
        }
      }
      if(performance.now()-t0>2500) return mejor;
    }
  }
  return mejor;
}
function sigue(){ if(!ON) return turnoCPU(); turno=(turno+1)%NJ; if(pases>=NJ*2) return termina(); envia(); pinta(); }
function envia(){ if(ON) ON.enviar({tab,bolsa,atril,puntos,turno,pases,primera,log,fin}); }
function carga(e){ tab=e.tab.map(r=>Array.from({length:N},(_,c)=>r[c]||null)); bolsa=e.bolsa||[]; atril=e.atril.map(a=>a||[]); puntos=e.puntos; turno=e.turno; pases=e.pases; primera=e.primera; log=e.log||[]; fin=e.fin; puestas=[]; selA=null; marcados=new Set();
  pinta(); if(fin) muestraFin(); }
function muestraFin(){ const max=Math.max(...puntos), gan=puntos.map((p,j)=>p===max?j:-1).filter(j=>j>=0);
  const g= gan.length>1?"🤝 Draw": gan[0]===yo?"🏆 You won!":`🏁 ${nom(gan[0])} wins`; if(gan.includes(yo)&&gan.length===1) J.confeti(150);
  J.modal(`<h2>${g}</h2><p>${puntos.map((p,j)=>`${nom(j)}: <b>${p}</b>`).join(" · ")}</p><p>Each player loses the points of the tiles they have left.</p>`,[{txt:"OK"}]); }
function termina(){
  fin=true;
  const resta=j=>atril[j].reduce((s,l)=>s+VAL[l],0);
  if(ON){ const rs=atril.map((_,j)=>resta(j)), tot=rs.reduce((a,b)=>a+b,0); atril.forEach((a,j)=>{ puntos[j]-=rs[j]; if(!a.length) puntos[j]+=tot; }); pinta(); envia(); return muestraFin(); }
  const r0=resta(0), r1=resta(1); puntos[0]-=r0; puntos[1]-=r1;
  if(!atril[0].length) puntos[0]+=r1; if(!atril[1].length) puntos[1]+=r0;
  pinta();
  const g=puntos[0]>puntos[1]?"🏆 You won!":puntos[0]<puntos[1]?"😔 The computer wins":"🤝 Draw";
  if(puntos[0]>puntos[1]) J.confeti(150);
  J.modal(`<h2>${g}</h2><p>You: <b>${puntos[0]}</b> points · Computer: <b>${puntos[1]}</b> points.</p><p>Each player loses the points of the tiles they have left.</p>`,[{txt:"New game"}],true).then(()=>{ J.$(".at-tab")&&(raiz.innerHTML=""); nueva(); });
}
J.online&&J.online.activar({juego:"atril", titulo:"Word Rack", min:2, max:4,
  inicio(nombres){ NJ=nombres.length; nueva(); atril=nombres.map(()=>[]); nombres.forEach((_,j)=>rellena(j)); puntos=nombres.map(()=>0); return {tab,bolsa,atril,puntos,turno:0,pases:0,primera:true,log:[],fin:false}; },
  alEmpezar(ctx,e){ ON=ctx; yo=ctx.yo; NJ=ctx.jugadores.length; carga(e); J.aviso(yo===0?"You go first":`${escH(ctx.jugadores[0])} goes first`,3000); },
  alCambiar(e){ carga(e); } });
nueva();
})();
