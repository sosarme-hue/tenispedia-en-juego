/* Juego Real de Ur */
(function(){
J.paginaJuego({titulo:"Royal Game of Ur", emoji:"🏺", ficha:"juego-real-de-ur", ins:{
  titulo:"Royal Game of Ur",
  intro:"A race game from about 4,500 years ago, found in the royal tombs of Ur (Mesopotamia). The rules are the ones reconstructed by the researcher Irving Finkel from a Babylonian clay tablet. Each player has <b>7 pieces</b> and the first to bear them all off wins.",
  pasos:[
    "Your pieces are the <b>light</b> ones and enter along <b>your bottom row</b>. Your rival’s are the <b>dark</b> ones and go along the top row.",
    "The route: you move 4 squares to the left along your row, go up to the <b>middle row</b> (which is shared) and travel along it to the right, then go down to your last 2 squares to exit.",
    "Press <b>Roll dice</b>. There are 4 four-sided dice with two marked tips: each marked tip counts 1, so you roll from 0 to 4.",
    "Tap the piece you want to move (or the stack of pieces not yet in play) and move as many squares as you rolled. The possible squares are highlighted in gold.",
    "You can’t land on a square with one of your own pieces. If you land on a rival piece in the middle row, <b>you capture it</b> and it goes back to the start.",
    "The <b>rosettes</b> 🌸 give you another roll. The middle rosette is also a <b>safe haven</b>: you can’t be captured there.",
    "To bear off a piece you need the exact number to leave the board. If you roll 0 or can’t move, you lose your turn."
  ],
  consejos:["Staying on the middle rosette blocks your rival’s way.","A lone piece in the middle row is in danger: try to get through quickly.","Bringing new pieces onto rosettes gives you extra rolls."]
}});
document.head.append(J.el("style",{},`
.ur{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;max-width:620px;margin:0 auto;padding:12px;border-radius:16px;background:linear-gradient(135deg,#3b2a1a,#22160c);box-shadow:var(--sombra)}
.ur .c{aspect-ratio:1;border-radius:8px;background:linear-gradient(135deg,#e9d8b4,#c9ad78);position:relative;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 2px rgba(60,40,20,.35)}
.ur .c::before{content:"";position:absolute;inset:18%;border-radius:4px;background:repeating-linear-gradient(45deg,rgba(30,60,120,.28) 0 3px,transparent 3px 7px);pointer-events:none}
.ur .c.ros{background:radial-gradient(circle,#f7e7c4 0 20%,#b8402f 21% 30%,#f7e7c4 31% 40%,#2a5c9a 41% 50%,#e9d8b4 51%)}
.ur .c.ros::before{display:none}
.ur .c.hueco{background:none;box-shadow:none}.ur .c.hueco::before{display:none}
.ur .c.pos{box-shadow:inset 0 0 0 4px var(--oro);cursor:pointer}
.ur .f{width:72%;height:72%;border-radius:50%;position:relative;z-index:1;box-shadow:0 3px 5px rgba(0,0,0,.5)}
.ur .f.a{background:radial-gradient(circle at 35% 30%,#fff,#ece3cf 45%,#a8987a);border:2px solid #6b5a3a}
.ur .f.b{background:radial-gradient(circle at 35% 30%,#7a7a7a,#2a2a2a 50%,#000);border:2px solid #000}
.ur .f.a::after,.ur .f.b::after{content:"";position:absolute;inset:28%;border-radius:50%;border:2px dotted currentColor;opacity:.55}
.ur .f.a{color:#6b5a3a}.ur .f.b{color:#ccc}
.ur .f.mov{cursor:pointer;outline:3px solid var(--oro);outline-offset:2px}
.ur-res{display:flex;justify-content:space-between;gap:10px;max-width:620px;margin:10px auto;flex-wrap:wrap}
.ur-mont{display:flex;align-items:center;gap:4px;padding:6px 10px;border-radius:12px;background:var(--panel);border:1px solid var(--borde);min-height:44px}
.ur-mont.mov{outline:3px solid var(--oro);cursor:pointer}
.ur-mont .f{width:22px;height:22px}
.ur-dados{display:flex;gap:8px;justify-content:center;align-items:center;margin:10px 0;flex-wrap:wrap}
.ur-d{width:40px;height:36px}
`));
const raiz=J.$("#juego");
// Posiciones del camino: 0 = sin entrar, 1..14 en el tablero, 15 = fuera (ganada)
const ROS=[4,8,14];
const celda=(s,p)=>{ const r=s===0?2:0; if(p<=4) return [r,4-p]; if(p<=12) return [1,p-5]; return [r,20-p]; };
const compartida=p=>p>=5&&p<=12;
let S, ON=null, me=0, nivel=2, ocupado=false, gen=0;
const nm=j=>j===me?"You":ON?esc(ON.jugadores[j]):"The computer";
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function nuevoEstado(){ return {f:[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]], turno:0, dados:null, fin:-1, msg:""}; }
function tirar(){ return [0,1,2,3].map(()=>J.azar(2)); }
const suma=d=>d.reduce((a,b)=>a+b,0);
function movimientos(st,s,n){ if(!n) return []; const res=[]; const vistos=new Set();
  st.f[s].forEach((p,i)=>{ if(p===15) return; const t=p+n; if(t>15) return; if(vistos.has(p)) return;
    if(t<15&&st.f[s].includes(t)) return;
    if(t===8&&st.f[1-s].includes(8)) return;
    vistos.add(p); res.push({i,de:p,a:t}); });
  return res; }
function aplica(st,s,m){ const n=JSON.parse(JSON.stringify(st)); n.f[s][m.i]=m.a; let cap=false;
  if(compartida(m.a)){ const k=n.f[1-s].indexOf(m.a); if(k>=0){ n.f[1-s][k]=0; cap=true; } }
  const otra=ROS.includes(m.a); n.dados=null;
  if(n.f[s].every(p=>p===15)){ n.fin=s; n.msg=""; return {n,cap}; }
  if(!otra) n.turno=1-s; n.msg=(cap?"captura":"")+(otra?" roseta":""); return {n,cap,otra}; }
function puntua(st,s,m){ let v=m.a-m.de; const r=aplica(st,s,m);
  if(r.cap) v+=12+m.a; if(ROS.includes(m.a)) v+=9; if(m.a===8) v+=4; if(m.a===15) v+=7; if(m.de===8) v-=5;
  // peligro: fichas rivales detrás a 1..4 casillas en la zona compartida
  const peligro=p=>{ if(!compartida(p)||p===8) return 0; let x=0; r.n.f[1-s].forEach(q=>{ const d=p-q; if(q<15&&d>=1&&d<=4&&(q>=5||p-d<=4||true)) x+=[0,4,6,4,1][d]/16; }); return x; };
  v-=peligro(m.a)*14; if(compartida(m.de)&&m.de!==8) v+=peligro(m.de)*6;
  return v; }
function eligeCPU(st,s){ const ms=movimientos(st,s,suma(st.dados)); if(!ms.length) return null;
  if(nivel===1&&Math.random()<.55) return J.elige(ms);
  let best=-1e9, mv=ms[0]; for(const m of ms){ const v=puntua(st,s,m)+Math.random()*(nivel===3?.2:2); if(v>best){ best=v; mv=m; } } return mv; }

raiz.innerHTML=`<div class="centro-txt" style="margin-bottom:8px" id="ur-ctl"><select id="ur-n"><option value="1">Easy</option><option value="2" selected>Normal</option><option value="3">Hard</option></select> <button class="btn sec peq" id="ur-nueva">🔄 New game</button></div>
<div class="estado" id="ur-est"></div>
<div class="ur-res"><div class="ur-mont" id="ur-m1"></div><div class="ur-mont" id="ur-o1" title="Pieces already borne off"></div></div>
<div class="ur" id="ur"></div>
<div class="ur-res"><div class="ur-mont" id="ur-m0"></div><div class="ur-mont" id="ur-o0" title="Pieces already borne off"></div></div>
<div class="ur-dados" id="ur-dados"></div>`;
J.$("#ur-n").onchange=e=>{ nivel=+e.target.value; };
J.$("#ur-nueva").onclick=()=>{ if(ON&&ON.yo!==0) return J.aviso("The new game is started by whoever created the room"); nueva(); };
const dadoSVG=v=>`<svg class="ur-d" viewBox="0 0 40 36"><polygon points="20,2 38,34 2,34" fill="#d9c49a" stroke="#4a3520" stroke-width="2"/><line x1="20" y1="2" x2="20" y2="34" stroke="#4a3520" stroke-width="1.2" opacity=".5"/>${v?'<circle cx="20" cy="6" r="3.2" fill="#fff" stroke="#4a3520"/>':''}</svg>`;
function nueva(){ S=nuevoEstado(); S.turno=ON?J.azar(2):0; gen++; ocupado=false; pinta(); envia(); siguiente(); }
function envia(){ if(ON) ON.enviar(S); }
function lado(s){ return s===me?"a":"b"; }
function pinta(){
  const n=S.dados?suma(S.dados):null; const mios=S.turno===me&&S.dados&&S.fin<0&&!ocupado?movimientos(S,me,n):[];
  const b=J.$("#ur"); b.innerHTML="";
  for(let r=0;r<3;r++) for(let c=0;c<8;c++){ const d=J.el("div",{class:"c"}); if(r!==1&&(c===4||c===5)) d.classList.add("hueco");
    const esRos=(r!==1&&(c===0||c===6))||(r===1&&c===3); if(esRos) d.classList.add("ros"); d.dataset.k=r+"-"+c; b.append(d); }
  // las fichas: mi lado siempre abajo
  [0,1].forEach(s=>{ const vis= s===me?0:1; S.f[s].forEach((p,i)=>{ if(p<1||p>14) return; const [r,c]=celda(vis,p); const d=b.children[r*8+c];
    const f=J.el("div",{class:"f "+lado(s)}); const m=mios.find(x=>x.de===p&&s===me); if(m){ f.classList.add("mov"); f.onclick=()=>mueve(m); } d.append(f); }); });
  mios.forEach(m=>{ if(m.a<15){ const [r,c]=celda(0,m.a); const d=b.children[r*8+c]; d.classList.add("pos"); d.onclick=()=>mueve(m); } });
  [0,1].forEach(v=>{ const s=v===0?me:1-me; const fuera=S.f[s].filter(p=>p===0).length, hecho=S.f[s].filter(p=>p===15).length;
    const mt=J.$("#ur-m"+v), ot=J.$("#ur-o"+v); mt.className="ur-mont"; mt.onclick=null;
    mt.innerHTML=`<small style="margin-right:4px">${v===0?"Your pieces":(ON?esc(ON.jugadores[s]):"Computer")}:</small>`+Array(fuera).fill(`<div class="f ${lado(s)}"></div>`).join("");
    ot.innerHTML=`<small style="margin-right:4px">Off ${hecho}/7</small>`+Array(hecho).fill(`<div class="f ${lado(s)}" style="opacity:.6"></div>`).join("");
    if(v===0){ const m=mios.find(x=>x.de===0); if(m){ mt.classList.add("mov"); mt.onclick=()=>mueve(m); } } });
  const dz=J.$("#ur-dados"); dz.innerHTML=""; if(S.dados){ dz.innerHTML=S.dados.map(dadoSVG).join("")+`<b style="font-size:1.4rem;margin-left:6px">= ${n}</b>`; }
  if(S.turno===me&&!S.dados&&S.fin<0&&!ocupado){ const bt=J.el("button",{class:"btn"},"🎲 Roll dice"); bt.onclick=tiraYo; dz.append(bt); }
  let est; if(S.fin>=0) est= S.fin===me?"🏆 You bore off all 7 pieces! You won":`${nm(S.fin)} wins the game`;
  else if(S.turno===me) est= !S.dados?"Your turn: roll the dice":mios.length?"Choose which piece to move":"You can’t move";
  else est= ON?`${nm(S.turno)}’s turn…`:"The computer is playing…";
  J.$("#ur-est").textContent=est;
}
async function tiraYo(){ if(S.turno!==me||S.dados||S.fin>=0) return; S.dados=tirar(); const n=suma(S.dados);
  const ms=movimientos(S,me,n); pinta();
  if(!ms.length){ ocupado=true; J.aviso(n?"You have no moves: you pass":"You rolled 0: you pass"); envia(); await J.espera(1300); ocupado=false; S.dados=null; S.turno=1-me; pinta(); envia(); siguiente(); }
  else envia(); }
function mueve(m){ if(S.turno!==me||ocupado) return; const r=aplica(S,me,m); S=r.n; if(r.cap) J.aviso("Capture! The rival piece goes back to the start"); else if(r.otra&&S.fin<0) J.aviso("🌸 Rosette: you roll again");
  if(S.fin===me) J.confeti(); pinta(); envia(); siguiente(); }
async function siguiente(){ if(ON||S.fin>=0||S.turno===me) return; const g=gen; ocupado=true; pinta();
  await J.espera(700); if(g!==gen) return; S.dados=tirar(); pinta(); await J.espera(900); if(g!==gen) return;
  const m=eligeCPU(S,1); if(!m){ J.aviso(suma(S.dados)?"The computer can’t move":"The computer rolls 0"); await J.espera(900); if(g!==gen) return; S.dados=null; S.turno=0; ocupado=false; return pinta(); }
  const r=aplica(S,1,m); S=r.n; if(r.cap) J.aviso("The computer captures one of your pieces"); ocupado=false; pinta();
  if(S.turno===1&&S.fin<0) siguiente(); }
function carga(e){ S={f:[e.f[0].slice(),e.f[1].slice()],turno:e.turno,dados:e.dados||null,fin:e.fin,msg:e.msg||""}; ocupado=false; gen++;
  if(S.fin===me) J.confeti(); pinta(); }
J.online&&J.online.activar({juego:"juego-real-de-ur", titulo:"Royal Game of Ur", min:2, max:2,
  inicio(){ const e=nuevoEstado(); e.turno=J.azar(2); return e; },
  alEmpezar(ctx,e){ ON=ctx; me=ctx.yo; J.$("#ur-n").style.display="none"; carga(e); J.aviso(e.turno===me?"You go first: roll the dice":"First to play: "+ctx.jugadores[e.turno],3000); },
  alCambiar(e){ carga(e); } });
nueva();
})();
