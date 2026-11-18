/* Ajedrez contra el ordenador */
(function(){
J.paginaJuego({titulo:"Chess", emoji:"♟️", ficha:"ajedrez", ins:{
  titulo:"Chess",
  intro:"You play the white pieces (or black, if you choose) against the computer. The goal is to give <b>checkmate</b>: attack the opposing king so that it can’t escape.",
  pasos:[
    "Tap one of your pieces. The squares it can move to are marked with dots. Tap one of them to move.",
    "<b>Pawn ♙</b>: moves one square forwards (two on its first move) and captures diagonally. If it reaches the end of the board it becomes a queen.",
    "<b>Rook ♖</b>: moves in a straight line, horizontally or vertically, as many squares as it likes.",
    "<b>Knight ♘</b>: jumps in an L shape (two squares in one direction and one at a right angle). It’s the only piece that can jump over others.",
    "<b>Bishop ♗</b>: moves diagonally as many squares as it likes.",
    "<b>Queen ♕</b>: combines rook and bishop; it’s the most powerful piece.",
    "<b>King ♔</b>: moves one square in any direction. It can never be left under attack.",
    "<b>Castling</b>: if neither the king nor the rook has moved and there are no pieces between them, tap the king and move it two squares towards the rook.",
    "If your king is attacked you are in <b>check</b> and must get out of it. If you can’t, it’s <b>checkmate</b> and you lose. If you have no legal moves and aren’t in check, it’s a <b>draw (stalemate)</b>."
  ],
  consejos:["Control the centre of the board in the opening.","Develop knights and bishops before the queen.","Castle early to protect your king.","You can undo your last move with the ↩️ button."]
}});

const css=`
.aj-zona{display:grid;grid-template-columns:minmax(0,600px) 1fr;gap:20px;align-items:start}
@media(max-width:900px){.aj-zona{grid-template-columns:1fr}}
.aj-tab{display:grid;grid-template-columns:repeat(8,1fr);aspect-ratio:1;width:100%;border:10px solid #5a3a1a;border-radius:10px;box-shadow:var(--sombra);overflow:hidden}
.aj-c{position:relative;aspect-ratio:1;min-width:0;display:grid;place-items:center;font-size:clamp(26px,6.5vw,56px);line-height:1;cursor:pointer;user-select:none}
.aj-c.cl{background:#f0d9b5}.aj-c.os{background:#b58863}
.aj-c.ult{box-shadow:inset 0 0 0 100px rgba(255,214,10,.38)}
.aj-c.sel{box-shadow:inset 0 0 0 100px rgba(76,201,240,.55)}
.aj-c.jaque{box-shadow:inset 0 0 0 100px rgba(255,77,109,.7)}
.aj-c .pt{position:absolute;width:30%;height:30%;border-radius:50%;background:rgba(0,0,0,.25)}
.aj-c .pt.cap{width:90%;height:90%;background:none;border:5px solid rgba(0,0,0,.28)}
.aj-c .coord{position:absolute;font-size:10px;font-family:var(--cuerpo);font-weight:800;opacity:.6;left:3px;top:2px;color:#5a3a1a}
.pz{transition:transform .15s}
.pz{display:inline-flex;width:86%;height:86%;align-items:center;justify-content:center}.pz svg{width:100%;height:100%;filter:drop-shadow(0 2px 2px rgba(0,0,0,.45))}
.pzs.b{fill:#fbf7ee;stroke:#1b1b1b;stroke-width:1.4;stroke-linejoin:round}.pzs.b .d{stroke:#1b1b1b;fill:#1b1b1b}
.pzs.n{fill:#222;stroke:#000;stroke-width:1.2;stroke-linejoin:round}.pzs.n .d{stroke:#eee;fill:#eee}
#cap-arriba .pz,#cap-abajo .pz{width:26px;height:26px}
.aj-hist{background:var(--panel);border-radius:14px;padding:10px;max-height:300px;overflow:auto;font-family:monospace;font-size:.95rem;columns:2}
.capt{font-size:1.5rem;min-height:2rem;letter-spacing:-2px}
`;
document.head.append(J.el("style",{},css));

const SIM={K:"♚",Q:"♛",R:"♜",B:"♝",N:"♞",P:"♟"};
// Piezas dibujadas en SVG para que se vean igual en todos los móviles (los símbolos de texto a veces salen como emoji)
const BASE='<path d="M9 35h22v3H9z"/><path d="M11 32h18l1 3H10z"/>';
const FORMA={
 P:'<circle cx="20" cy="12" r="5"/><path d="M15 20c0-3 2-4 5-4s5 1 5 4l-1 3 3 9H13l3-9z"/>',
 R:'<path d="M11 8h4v3h3V8h4v3h3V8h4v6l-3 2v12l2 4H12l2-4V16l-3-2z"/>',
 B:'<circle cx="20" cy="6" r="2.5"/><path d="M20 8c5 4 8 9 6 14l-2 3 2 7H14l2-7-2-3c-2-5 1-10 6-14z"/><path class="d" d="M20 14v7M17 17.5h6" fill="none" stroke-width="1.6"/>',
 N:'<path d="M13 32c0-6 3-9 6-12l-6 2-3-3 8-10 1-4 3 4c6 2 9 8 9 15v8z"/><circle class="d" cx="17" cy="14" r="1.3"/>',
 Q:'<circle cx="8" cy="10" r="2.2"/><circle cx="14" cy="7" r="2.2"/><circle cx="20" cy="6" r="2.2"/><circle cx="26" cy="7" r="2.2"/><circle cx="32" cy="10" r="2.2"/><path d="M8 12l5 14 2-15 5 14 5-14 2 15 5-14-3 20H11z"/>',
 K:'<path d="M18.5 3h3v3h3v3h-3v4h-3V9h-3V6h3z"/><path d="M20 13c-4 0-11 1-11 8 0 4 3 6 4 11h14c1-5 4-7 4-11 0-7-7-8-11-8z"/><path class="d" d="M13 27h14" fill="none" stroke-width="1.6"/>'};
const pieza=(t,c)=>`<svg viewBox="0 0 40 40" class="pzs ${c}" aria-label="${c==="b"?"blanca":"negra"}">${FORMA[t]}${BASE}</svg>`;
const VAL={P:100,N:320,B:330,R:500,Q:900,K:20000};
// Tablas de posición (para blancas, fila 0 = octava)
const PST={
P:[0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
N:[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
B:[-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
R:[0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
Q:[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
K:[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20]
};

let ON=null; const rival=()=>ON?ON.jugadores[1-ON.yo]:"the computer";
let T, turno, enroque, alPaso, historial=[], sel=null, legales=[], ultima=null, nivel=2, humano="b", pensando=false, capturas={b:[],n:[]}, jugadas=[];

function inicial(){
  const f="rnbqkbnr";
  T=[]; for(let i=0;i<64;i++) T.push(null);
  for(let c=0;c<8;c++){ T[c]={t:f[c].toUpperCase(),c:"n"}; T[8+c]={t:"P",c:"n"}; T[48+c]={t:"P",c:"b"}; T[56+c]={t:f[c].toUpperCase(),c:"b"}; }
  turno="b"; enroque={bK:true,bQ:true,nK:true,nQ:true}; alPaso=-1; historial=[]; ultima=null; capturas={b:[],n:[]}; jugadas=[];
}
const fil=i=>i>>3, col=i=>i&7, den=(f,c)=>f>=0&&f<8&&c>=0&&c<8;
const otro=c=>c==="b"?"n":"b";

function pseudo(color){
  const m=[];
  for(let i=0;i<64;i++){
    const p=T[i]; if(!p||p.c!==color) continue;
    const f=fil(i), c=col(i);
    const add=(t,extra={})=>m.push(Object.assign({de:i,a:t},extra));
    if(p.t==="P"){
      const d=color==="b"?-1:1, ini=color==="b"?6:1, prom=color==="b"?0:7;
      if(den(f+d,c)&&!T[(f+d)*8+c]){ add((f+d)*8+c,{prom:f+d===prom}); if(f===ini&&!T[(f+2*d)*8+c]) add((f+2*d)*8+c,{doble:true}); }
      for(const dc of [-1,1]){ if(!den(f+d,c+dc)) continue; const t=(f+d)*8+c+dc; if(T[t]&&T[t].c!==color) add(t,{prom:f+d===prom}); else if(t===alPaso) add(t,{ep:true}); }
    } else if(p.t==="N"){
      for(const [a,b] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]){ if(den(f+a,c+b)){ const t=(f+a)*8+c+b; if(!T[t]||T[t].c!==color) add(t);} }
    } else if(p.t==="K"){
      for(let a=-1;a<=1;a++) for(let b=-1;b<=1;b++){ if((a||b)&&den(f+a,c+b)){ const t=(f+a)*8+c+b; if(!T[t]||T[t].c!==color) add(t);} }
      const fila=color==="b"?7:0;
      if(i===fila*8+4 && !atacada(i,otro(color))){
        if(enroque[color+"K"]&&!T[i+1]&&!T[i+2]&&T[i+3]&&T[i+3].t==="R"&&!atacada(i+1,otro(color))&&!atacada(i+2,otro(color))) add(i+2,{enr:"K"});
        if(enroque[color+"Q"]&&!T[i-1]&&!T[i-2]&&!T[i-3]&&T[i-4]&&T[i-4].t==="R"&&!atacada(i-1,otro(color))&&!atacada(i-2,otro(color))) add(i-2,{enr:"Q"});
      }
    } else {
      const dirs = p.t==="R"?[[1,0],[-1,0],[0,1],[0,-1]]:p.t==="B"?[[1,1],[1,-1],[-1,1],[-1,-1]]:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
      for(const [a,b] of dirs){ let ff=f+a, cc=c+b; while(den(ff,cc)){ const t=ff*8+cc; if(T[t]){ if(T[t].c!==color) add(t); break; } add(t); ff+=a; cc+=b; } }
    }
  }
  return m;
}
function atacada(i,por){
  const f=fil(i), c=col(i);
  const d=por==="b"?1:-1; // peones atacantes vienen de abajo si son blancos
  for(const dc of [-1,1]){ if(den(f+d,c+dc)){ const p=T[(f+d)*8+c+dc]; if(p&&p.c===por&&p.t==="P") return true; } }
  for(const [a,b] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]){ if(den(f+a,c+b)){ const p=T[(f+a)*8+c+b]; if(p&&p.c===por&&p.t==="N") return true; } }
  for(let a=-1;a<=1;a++) for(let b=-1;b<=1;b++){ if((a||b)&&den(f+a,c+b)){ const p=T[(f+a)*8+c+b]; if(p&&p.c===por&&p.t==="K") return true; } }
  for(const [a,b,tipos] of [[1,0,"RQ"],[-1,0,"RQ"],[0,1,"RQ"],[0,-1,"RQ"],[1,1,"BQ"],[1,-1,"BQ"],[-1,1,"BQ"],[-1,-1,"BQ"]]){
    let ff=f+a, cc=c+b; while(den(ff,cc)){ const p=T[ff*8+cc]; if(p){ if(p.c===por&&tipos.includes(p.t)) return true; break; } ff+=a; cc+=b; }
  }
  return false;
}
function hacer(m){
  const p=T[m.de], cap=m.ep?T[m.a+(p.c==="b"?8:-8)]:T[m.a];
  const u={m,p,cap,enroque:{...enroque},alPaso,turno};
  historial.push(u);
  T[m.a]=m.prom?{t:"Q",c:p.c}:p; T[m.de]=null;
  if(m.ep) T[m.a+(p.c==="b"?8:-8)]=null;
  if(m.enr==="K"){ T[m.a-1]=T[m.a+1]; T[m.a+1]=null; }
  if(m.enr==="Q"){ T[m.a+1]=T[m.a-2]; T[m.a-2]=null; }
  if(p.t==="K"){ enroque[p.c+"K"]=false; enroque[p.c+"Q"]=false; }
  for(const [sq,k] of [[63,"bK"],[56,"bQ"],[7,"nK"],[0,"nQ"]]) if(m.de===sq||m.a===sq) enroque[k]=false;
  alPaso = m.doble ? (m.de+m.a)/2 : -1;
  turno=otro(turno);
  return u;
}
function deshacer(){
  const u=historial.pop(), m=u.m;
  T[m.de]=u.p; T[m.a]=null;
  if(m.ep) T[m.a+(u.p.c==="b"?8:-8)]=u.cap; else T[m.a]=u.cap;
  if(m.enr==="K"){ T[m.a+1]=T[m.a-1]; T[m.a-1]=null; }
  if(m.enr==="Q"){ T[m.a-2]=T[m.a+1]; T[m.a+1]=null; }
  enroque=u.enroque; alPaso=u.alPaso; turno=u.turno;
  return u;
}
const reyDe=c=>T.findIndex(p=>p&&p.t==="K"&&p.c===c);
function legalesDe(color){ return pseudo(color).filter(m=>{ hacer(m); const ok=!atacada(reyDe(color),otro(color)); deshacer(); return ok; }); }
const enJaque=c=>atacada(reyDe(c),otro(c));

function evalua(){
  let s=0;
  for(let i=0;i<64;i++){ const p=T[i]; if(!p) continue; const idx=p.c==="b"?i:(7-fil(i))*8+col(i); const v=VAL[p.t]+PST[p.t][idx]; s+= p.c==="n"?v:-v; }
  return s; // positivo = bueno para negras
}
function ordena(ms){ return ms.sort((a,b)=>((T[b.a]?VAL[T[b.a].t]:0)+(b.prom?800:0))-((T[a.a]?VAL[T[a.a].t]:0)+(a.prom?800:0))); }
let nodos=0;
function alfabeta(prof,a,b,color){
  nodos++;
  const ms=ordena(legalesDe(color));
  if(!ms.length) return enJaque(color) ? -100000-prof : 0;
  if(prof===0) return quies(a,b,color,3);
  for(const m of ms){ hacer(m); const v=-alfabeta(prof-1,-b,-a,otro(color)); deshacer(); if(v>=b) return b; if(v>a) a=v; if(nodos>60000) break; }
  return a;
}
function quies(a,b,color,lim){
  const est=(color==="n"?1:-1)*evalua();
  if(lim===0) return est;
  if(est>=b) return b; if(est>a) a=est;
  const caps=ordena(pseudo(color).filter(m=>T[m.a]||m.prom));
  for(const m of caps){ hacer(m); if(atacada(reyDe(color),otro(color))){ deshacer(); continue; } const v=-quies(-b,-a,otro(color),lim-1); deshacer(); if(v>=b) return b; if(v>a) a=v; }
  return a;
}
function mejor(color){
  const ms=J.baraja(legalesDe(color)); ordena(ms);
  if(nivel===1){ // fácil: a menudo jugada aleatoria razonable
    if(Math.random()<.35) return J.elige(ms);
  }
  const prof={1:1,2:2,3:3}[nivel]; nodos=0;
  let best=ms[0], bv=-Infinity;
  for(const m of ms){ hacer(m); const v=-alfabeta(prof-1,-Infinity,-bv,otro(color)); deshacer(); if(v>bv){ bv=v; best=m; } }
  return best;
}

const raiz=J.$("#juego");
function config(){
  raiz.innerHTML=`<div class="panel" style="max-width:520px;margin:0 auto"><h2>♟️ New game</h2>
  <p>You play<br><select id="c-col"><option value="b">White (you go first)</option><option value="n">Black</option></select></p>
  <p>Computer level<br><select id="c-niv"><option value="1">Easy</option><option value="2" selected>Normal</option><option value="3">Hard</option></select></p>
  <button class="btn" id="c-ok">Start!</button></div>`;
  J.$("#c-ok").onclick=()=>{ humano=J.$("#c-col").value; nivel=+J.$("#c-niv").value; inicial(); montar(); pinta(); if(turno!==humano) juegaCPU(); };
}
function montar(){
  raiz.innerHTML=`<div class="aj-zona"><div><div class="capt" id="cap-arriba"></div><div class="aj-tab" id="tab"></div><div class="capt" id="cap-abajo"></div></div>
  <div><div class="estado" id="est"></div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:12px">
  <button class="btn sec peq" id="b-des">↩️ Undo</button><button class="btn sec peq" id="b-pista">💡 Hint</button><button class="btn sec peq" id="b-nueva">🔄 New game</button></div>
  <h3>Moves</h3><div class="aj-hist" id="hist"></div></div></div>`;
  J.$("#b-nueva").onclick=nuevaPartida;
  J.$("#b-des").onclick=()=>{ if(pensando) return; let n=0; while(historial.length&&n<2){ const u=deshacer(); jugadas.pop(); if(u.cap) capturas[u.p.c].pop(); n++; if(turno===humano) break; } ultima=null; sel=null; legales=[]; pinta(); };
  J.$("#b-pista").onclick=()=>{ if(pensando||turno!==humano) return; const m=mejor(humano); sel=m.de; legales=legalesDe(humano).filter(x=>x.de===m.de); pinta(); J.$$(".aj-c").forEach(c=>{ if(+c.dataset.i===m.a) c.classList.add("sel"); }); };
}
const nombreCasilla=i=>"abcdefgh"[col(i)]+(8-fil(i));
function notacion(m,p,cap){
  if(m.enr) return m.enr==="K"?"O-O":"O-O-O";
  const L={K:"R",Q:"D",R:"T",B:"A",N:"C",P:""}[p.t];
  return (L||(cap?"abcdefgh"[col(m.de)]:""))+(cap?"x":"")+nombreCasilla(m.a)+(m.prom?"=D":"");
}
function pinta(){
  const tab=J.$("#tab"); tab.innerHTML="";
  const orden=[...Array(64).keys()]; if(humano==="n") orden.reverse();
  const jq = enJaque(turno)?reyDe(turno):-1;
  for(const i of orden){
    const p=T[i], d=J.el("div",{class:"aj-c "+((fil(i)+col(i))%2?"os":"cl")});
    d.dataset.i=i;
    if(ultima&&(ultima.de===i||ultima.a===i)) d.classList.add("ult");
    if(sel===i) d.classList.add("sel");
    if(i===jq) d.classList.add("jaque");
    if(p) d.append(J.el("span",{class:"pz "+p.c},pieza(p.t,p.c)));
    const lg=legales.find(m=>m.a===i); if(lg) d.append(J.el("span",{class:"pt"+(p||lg.ep?" cap":"")}));
    if((humano==="b"&&col(i)===0)||(humano==="n"&&col(i)===7)) d.append(J.el("span",{class:"coord"},8-fil(i)));
    d.onclick=()=>toca(i);
    tab.append(d);
  }
  J.$("#cap-arriba").innerHTML=capturas[otro(humano)].map(t=>`<span class="pz ${humano}">${pieza(t,humano)}</span>`).join("");
  J.$("#cap-abajo").innerHTML=capturas[humano].map(t=>`<span class="pz ${otro(humano)}">${pieza(t,otro(humano))}</span>`).join("");
  let h=""; for(let k=0;k<jugadas.length;k+=2) h+=`<div>${k/2+1}. ${jugadas[k]} ${jugadas[k+1]||""}</div>`;
  J.$("#hist").innerHTML=h;
  const ms=legalesDe(turno);
  if(!ms.length){
    const mate=enJaque(turno);
    J.$("#est").textContent = mate ? (turno===humano?`Checkmate. ${rival()} wins.`:"Checkmate! You won!") : "Draw by stalemate.";
    if(mate&&turno!==humano) J.confeti();
    setTimeout(()=>J.modal(`<h2>${mate?(turno===humano?"😔 Checkmate":"🏆 Checkmate, you won!"):"🤝 Draw"}</h2><p>${mate?(turno===humano?`${rival()} won this time. Try another game!`:`Congratulations, you beat ${rival()}.`):"There are no legal moves left and the king isn’t in check."}</p>`,[{txt:"Keep looking",cls:"sec"},{txt:"New game",valor:"n"}]).then(r=>{ if(r==="n") nuevaPartida(); }),600);
    return false;
  }
  const soloReyes = T.filter(Boolean).length===2;
  if(soloReyes){ J.$("#est").textContent="Tablas: solo quedan los reyes."; return false; }
  J.$("#est").textContent = pensando ? "🤔 The computer is thinking…" : (turno===humano ? (enJaque(turno)?"⚠️ You’re in check! Your turn":"Your move") : `${rival()}’s turn`);
  return true;
}
function toca(i){
  if(pensando||turno!==humano) return;
  const lg=legales.find(m=>m.a===i);
  if(lg){ juega(lg); sel=null; legales=[]; if(ON){ ON.enviar(paquete()); pinta(); return; } if(pinta()) juegaCPU(); return; }
  if(T[i]&&T[i].c===humano){ sel=i; legales=legalesDe(humano).filter(m=>m.de===i); }
  else { sel=null; legales=[]; }
  pinta();
}
function juega(m){
  const p=T[m.de], cap=m.ep?T[m.a+(p.c==="b"?8:-8)]:T[m.a];
  jugadas.push(notacion(m,p,cap));
  if(cap) capturas[p.c].push(cap.t);
  hacer(m); ultima=m;
  if(enJaque(turno)) jugadas[jugadas.length-1]+="+";
}
function juegaCPU(){
  pensando=true; pinta();
  setTimeout(()=>{ const m=mejor(turno); juega(m); pensando=false; pinta(); }, 350);
}
function nuevaPartida(){ if(ON){ inicial(); ON.enviar(paquete()); sel=null; legales=[]; pinta(); } else config(); }
function paquete(){ return {T,turno,enroque,alPaso,ultima,capturas,jugadas}; }
function carga(e){ T=e.T; turno=e.turno; enroque=e.enroque; alPaso=e.alPaso; ultima=e.ultima; capturas=e.capturas; jugadas=e.jugadas||[]; historial=[]; sel=null; legales=[]; pinta(); }
config();
J.online&&J.online.activar({juego:"ajedrez", titulo:"Chess", min:2, max:2,
  inicio:()=>{ inicial(); return paquete(); },
  alEmpezar(ctx,e){ ON=ctx; humano=ctx.yo===0?"b":"n"; montar(); J.$("#b-des").style.display="none"; J.$("#b-pista").style.display="none"; carga(e); if(ctx.yo===0) J.aviso("You play white: you go first"); else J.aviso("You play black"); },
  alCambiar(e){ carga(e); }});
})();
