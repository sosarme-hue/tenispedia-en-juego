/* Damas españolas */
(function(){
J.paginaJuego({titulo:"Checkers", emoji:"⛀", ficha:"damas", ins:{
  titulo:"Spanish checkers",
  intro:"You play the white pieces against the computer. Each player has 12 pieces. You win by capturing all your rival’s pieces or leaving them with no moves.",
  pasos:["Tap one of your pieces: the squares it can move to are highlighted. Tap the destination square.","<b>Men</b> move one square diagonally forwards.","To <b>capture</b>, jump diagonally over a rival piece that has an empty square behind it. You can chain several jumps in a row.","<b>Capturing is compulsory</b> and you must choose the move that captures the most pieces.","Men can only capture forwards.","If a man reaches the last row it becomes a <b>king</b> 👑. The king moves diagonally as many squares as it likes, forwards and backwards, and also captures from a distance.","The winner is whoever leaves the rival with no pieces or no moves."],
  consejos:["Keep your pieces together: lone pieces are easy to capture.","Getting a king gives you a big advantage."]
}});
document.head.append(J.el("style",{},`.da{display:grid;grid-template-columns:repeat(8,1fr);max-width:560px;margin:0 auto;border:10px solid #5a3a1a;border-radius:10px;box-shadow:var(--sombra)}
.da div{aspect-ratio:1;display:grid;place-items:center;position:relative}
.da .cl{background:#f0d9b5}.da .os{background:#8b5a2b;cursor:pointer}
.da .p{width:78%;height:78%;border-radius:50%;display:grid;place-items:center;font-size:clamp(12px,3vw,24px);box-shadow:0 4px 6px rgba(0,0,0,.5),inset 0 -4px 0 rgba(0,0,0,.2)}
.da .b{background:radial-gradient(circle at 35% 30%,#fff,#ddd)}.da .n{background:radial-gradient(circle at 35% 30%,#666,#111)}
.da .sel{box-shadow:inset 0 0 0 100px rgba(76,201,240,.5)}.da .dest::after{content:"";width:30%;height:30%;border-radius:50%;background:rgba(255,214,10,.85);position:absolute}
.da .ult{box-shadow:inset 0 0 0 100px rgba(255,214,10,.25)}`));
let t, turno, sel=null, opciones=[], fin=false, nivel=2, ult=[];
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="marcador" style="justify-content:center"><div class="caja"><small>Your pieces ⚪</small><b id="da-b"></b></div><div class="caja"><small>Computer ⚫</small><b id="da-n"></b></div></div>
<div class="centro-txt" style="margin-bottom:10px"><select id="da-niv"><option value="1">Easy</option><option value="2" selected>Normal</option><option value="3">Hard</option></select> <button class="btn peq" id="da-nueva">🔄 New</button></div><div class="estado" id="da-e"></div><div class="da" id="da"></div>`;
J.$("#da-niv").onchange=e=>{ nivel=+e.target.value; }; J.$("#da-nueva").onclick=()=>{ if(ON){ nueva(); ON.enviar({t,turno,ult}); } else nueva(); };
let ON=null, mc="b";
const os=(f,c)=>(f+c)%2===1, den=(f,c)=>f>=0&&f<8&&c>=0&&c<8;
function nueva(){ t=Array.from({length:8},(_,f)=>Array.from({length:8},(_,c)=>os(f,c)&&f<3?{c:"n",d:false}:os(f,c)&&f>4?{c:"b",d:false}:null)); turno="b"; sel=null; opciones=[]; fin=false; ult=[]; pinta(); }
// movimientos: {de:[f,c], camino:[[f,c]...], comidas:[[f,c]...]}
function capturas(b,f,c,p,comidas,camino,res){
  const dirs=p.d?[[1,1],[1,-1],[-1,1],[-1,-1]]:(p.c==="b"?[[-1,1],[-1,-1]]:[[1,1],[1,-1]]);
  let algo=false;
  for(const [a,e] of dirs){
    let y=f+a,x=c+e;
    if(p.d) while(den(y,x)&&!b[y][x]){ y+=a; x+=e; }
    if(!den(y,x)||!b[y][x]||b[y][x].c===p.c||comidas.some(([q,r])=>q===y&&r===x)) continue;
    let y2=y+a,x2=x+e;
    while(den(y2,x2)&&!b[y2][x2]){
      algo=true;
      const ant=b[f][c]; b[f][c]=null; b[y2][x2]=p;
      capturas(b,y2,x2,p,[...comidas,[y,x]],[...camino,[y2,x2]],res);
      b[y2][x2]=null; b[f][c]=ant;
      if(!p.d) break; y2+=a; x2+=e;
    }
  }
  if(!algo&&comidas.length) res.push({camino,comidas});
}
function movs(b,col){
  const caps=[], simples=[];
  for(let f=0;f<8;f++) for(let c=0;c<8;c++){ const p=b[f][c]; if(!p||p.c!==col) continue;
    const r=[]; capturas(b,f,c,p,[],[],r); r.forEach(m=>caps.push({de:[f,c],...m}));
    const dirs=p.d?[[1,1],[1,-1],[-1,1],[-1,-1]]:(col==="b"?[[-1,1],[-1,-1]]:[[1,1],[1,-1]]);
    for(const [a,e] of dirs){ let y=f+a,x=c+e; while(den(y,x)&&!b[y][x]){ simples.push({de:[f,c],camino:[[y,x]],comidas:[]}); if(!p.d) break; y+=a; x+=e; } } }
  if(caps.length){ const mx=Math.max(...caps.map(m=>m.comidas.length)); return caps.filter(m=>m.comidas.length===mx); }
  return simples;
}
function aplica(b,m){ const [f,c]=m.de, p=b[f][c]; b[f][c]=null; m.comidas.forEach(([y,x])=>b[y][x]=null); const [y,x]=m.camino[m.camino.length-1]; const np={...p}; if((p.c==="b"&&y===0)||(p.c==="n"&&y===7)) np.d=true; b[y][x]=np; }
const copia=b=>b.map(r=>r.map(p=>p&&{...p}));
function valor(b){ let s=0; for(let f=0;f<8;f++) for(let c=0;c<8;c++){ const p=b[f][c]; if(!p) continue; let v=p.d?3.2:1+(p.c==="n"?f:7-f)*.04; if(c===0||c===7) v+=.05; s+=p.c==="n"?v:-v; } return s; }
function ab(b,prof,a,be,col){ const ms=movs(b,col); if(!ms.length) return col==="n"?-100:100; if(!prof) return valor(b);
  for(const m of ms){ const b2=copia(b); aplica(b2,m); const v=ab(b2,prof-1,a,be,col==="n"?"b":"n"); if(col==="n"){ if(v>a)a=v; } else { if(v<be)be=v; } if(a>=be) break; } return col==="n"?a:be; }
function cpu(){ const ms=J.baraja(movs(t,"n")); if(nivel===1&&Math.random()<.4) return ms[0]; const prof={1:2,2:4,3:6}[nivel]; let best=-1e9,mv=ms[0];
  for(const m of ms){ const b2=copia(t); aplica(b2,m); const v=ab(b2,prof-1,-1e9,1e9,"b"); if(v>best){best=v;mv=m;} } return mv; }
function pinta(){
  const cuenta=c=>t.flat().filter(p=>p&&p.c===c).length;
  J.$("#da-b").textContent=cuenta("b"); J.$("#da-n").textContent=cuenta("n");
  const ds=new Set(opciones.map(m=>m.camino[m.camino.length-1].join(",")));
  const celdas=t.map((r,f)=>r.map((p,c)=>`<div data-f="${f}" data-c="${c}" class="${os(f,c)?"os":"cl"} ${sel&&sel[0]===f&&sel[1]===c?"sel":""} ${ds.has(f+","+c)?"dest":""} ${ult.some(([y,x])=>y===f&&x===c)?"ult":""}">${p?`<span class="p ${p.c}">${p.d?"👑":""}</span>`:""}</div>`)).flat(); if(mc==="n") celdas.reverse(); J.$("#da").innerHTML=celdas.join("");
  J.$$("#da .os").forEach(d=>d.onclick=()=>toca(+d.dataset.f,+d.dataset.c));
  if(!fin&&ON) J.$("#da-e").textContent = turno===mc ? (movs(t,mc).some(m=>m.comidas.length)?"Your turn: you must capture!":"Your turn") : "Turn: "+ON.jugadores[turno==="b"?0:1];
  else if(!fin) J.$("#da-e").textContent = turno==="b" ? (movs(t,"b").some(m=>m.comidas.length)?"Your turn: you must capture!":"Your turn") : "🤔 The computer is thinking…";
}
function toca(f,c){
  if(fin||turno!==mc) return;
  const m=opciones.find(m=>{ const [y,x]=m.camino[m.camino.length-1]; return y===f&&x===c; });
  if(m&&ON){ aplica(t,m); ult=[m.de,...m.camino]; sel=null; opciones=[]; turno=mc==="b"?"n":"b"; const e={t,turno,ult}; ON.enviar(e); carga(e); return; }
  if(m){ aplica(t,m); ult=[m.de,...m.camino]; sel=null; opciones=[]; turno="n"; pinta(); if(!compr()) setTimeout(juegaCPU,350); return; }
  const p=t[f][c]; if(p&&p.c===mc){ sel=[f,c]; opciones=movs(t,mc).filter(m=>m.de[0]===f&&m.de[1]===c); if(!opciones.length) J.aviso(movs(t,mc).some(m=>m.comidas.length)?"You have to capture with another piece":"That piece can’t move"); }
  else { sel=null; opciones=[]; }
  pinta();
}
function juegaCPU(){ const m=cpu(); if(m){ aplica(t,m); ult=[m.de,...m.camino]; } turno="b"; pinta(); compr(); }
function compr(){
  const mb=movs(t,"b").length, mn=movs(t,"n").length;
  if(turno==="n"&&!mn){ fin=true; J.$("#da-e").textContent="🏆 You won!"; J.confeti(); return true; }
  if(turno==="b"&&!mb){ fin=true; J.$("#da-e").textContent="😔 The computer wins"; return true; }
  return false;
}
function carga(e){ t=e.t.map(r=>Array.from({length:8},(_,c)=>r[c]||null)); turno=e.turno; ult=e.ult||[]; sel=null; opciones=[]; fin=false; pinta();
  if(!movs(t,turno).length){ fin=true; const gana=turno==="b"?"n":"b"; J.$("#da-e").textContent= gana===mc?"🏆 You won!":"Winner: "+ON.jugadores[gana==="b"?0:1]; if(gana===mc) J.confeti(); } }
J.online&&J.online.activar({juego:"damas", titulo:"Checkers", min:2, max:2,
  inicio(){ nueva(); return {t,turno:"b",ult:[]}; },
  alEmpezar(ctx,e){ ON=ctx; mc=ctx.yo===0?"b":"n"; J.$("#da-niv").style.display="none";
    J.$("#da-b").previousElementSibling.textContent=ctx.jugadores[0]+" ⚪"; J.$("#da-n").previousElementSibling.textContent=ctx.jugadores[1]+" ⚫";
    carga(e); J.aviso(mc==="b"?"You play white and go first":"You play black",3000); },
  alCambiar(e){ carga(e); } });
nueva();
})();
