/* Sabelotodo — juego de preguntas con ruleta de temas */
(function(){
const TEMAS = [
  {id:"geo", nombre:"Geography", color:"#3a86ff", emoji:"🌍"},
  {id:"art", nombre:"Art and Literature", color:"#a0522d", emoji:"🎨"},
  {id:"his", nombre:"History", color:"#ffbe0b", emoji:"🏛️"},
  {id:"esp", nombre:"Film and Music", color:"#ff006e", emoji:"🎬"},
  {id:"cie", nombre:"Science and Nature", color:"#38b000", emoji:"🔬"},
  {id:"dep", nombre:"Sport and Leisure", color:"#fb5607", emoji:"⚽"}
];
// 12 sectores: cada tema dos veces, uno con corona (da estrella)
const SECTORES = [];
TEMAS.forEach(t=>SECTORES.push({t,corona:true}));
TEMAS.forEach(t=>SECTORES.push({t,corona:false}));
const ORDEN = [0,7,2,9,4,11,1,8,3,10,5,6].map(i=>SECTORES[i]);

J.paginaJuego({titulo:"Know-It-All Trivia", emoji:"🧠", ficha:"juegos-de-preguntas", ins:{
  titulo:"Know-It-All Trivia",
  intro:"A quiz game for 1 to 4 people on the same device. The first to collect the 6 coloured stars, one for each topic, wins.",
  pasos:[
    "Choose how many players there are and type your names. If you play alone, try to get the 6 stars with as few mistakes as possible.",
    "On your turn press <b>Spin the wheel</b>. The arrow stops on a topic: Geography 🌍, Art and Literature 🎨, History 🏛️, Film and Music 🎬, Science and Nature 🔬 or Sport and Leisure ⚽.",
    "A question on that topic appears with 4 answers. You have <b>30 seconds</b> to press the right one.",
    "If the wheel landed on a space with a <b>crown 👑</b> and you answer correctly, you win that colour’s star.",
    "If you get it right, <b>you spin again</b>. If you get it wrong or time runs out, it’s the next player’s turn.",
    "If you land on a crown for a topic whose star you already have, you can choose any topic you’re missing.",
    "The first to collect the <b>6 stars</b> wins the game."
  ],
  consejos:["Questions aren’t repeated during a game.","You can play quick mode: 12 random questions, and count how many you get right."]
}});

const css = `
.sb-zona{display:grid;grid-template-columns:minmax(280px,420px) 1fr;gap:24px;align-items:start}
@media(max-width:820px){.sb-zona{grid-template-columns:1fr}}
.rueda-cont{position:relative;width:100%;max-width:400px;margin:0 auto;aspect-ratio:1}
.rueda-cont svg{width:100%;height:100%;transition:transform 4s cubic-bezier(.17,.67,.12,.99);filter:drop-shadow(0 10px 25px rgba(0,0,0,.5))}
.flecha{position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:18px solid transparent;border-right:18px solid transparent;border-top:34px solid #fff;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5));z-index:2}
.jugadores{display:flex;flex-direction:column;gap:10px}
.jug{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;background:var(--panel);border:2px solid transparent}
.jug.turno{border-color:var(--oro);box-shadow:0 0 0 4px rgba(255,201,74,.2)}
.jug .nom{font-weight:800;flex:1}
.estrellas{display:flex;gap:4px}
.estrellas i{width:22px;height:22px;clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);background:rgba(255,255,255,.15)}
.pregunta{padding:22px;border-radius:20px;background:var(--fondo2);border:3px solid}
.pregunta .tema{font-family:var(--titulos);font-size:1rem;display:flex;align-items:center;gap:8px}
.pregunta h2{font-size:1.45rem;margin:.4em 0 .8em}
.ops{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:560px){.ops{grid-template-columns:1fr}}
.op{padding:14px;border-radius:14px;border:2px solid var(--borde);background:var(--panel);color:var(--texto);font-size:1.05rem;font-weight:700;cursor:pointer;text-align:left;font-family:var(--cuerpo)}
.op:hover:not(:disabled){background:var(--panel2);border-color:var(--azul)}
.op.bien{background:#16a65a;border-color:#3ee68c}
.op.mal{background:#c9184a;border-color:#ff4d6d}
.reloj{height:8px;border-radius:9px;background:var(--panel2);overflow:hidden;margin-top:14px}
.reloj div{height:100%;background:linear-gradient(90deg,var(--verde),var(--oro),var(--rojo));transition:width 1s linear}
.config label{display:block;margin:8px 0}
.config input[type=text]{width:100%;max-width:260px}
`;
document.head.append(J.el("style",{},css));

const raiz = J.$("#juego");
let ON=null, yo=0, qAct=null, finGiro=0;
const escH=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let jugadores=[], turno=0, usadas=new Set(), girando=false, rot=0, reloj=null, modo="estrellas", rapida={n:0,ok:0};

function config(){
  raiz.innerHTML = `<div class="panel config" style="max-width:640px;margin:0 auto">
    <h2>🧠 New game</h2>
    <label><b>Game mode</b><br>
      <select id="c-modo"><option value="estrellas">Full game: collect the 6 stars</option><option value="rapida">Quick game: 12 questions</option></select></label>
    <label><b>Number of players</b><br><select id="c-n"><option>1</option><option selected>2</option><option>3</option><option>4</option></select></label>
    <div id="c-noms"></div>
    <p style="color:var(--suave)">There are ${PREGUNTAS.length} questions in total, about ${Math.round(PREGUNTAS.length/6)} per topic.</p>
    <button class="btn" id="c-ok">Start!</button></div>`;
  const noms = () => { const n=+J.$("#c-n").value; J.$("#c-noms").innerHTML = Array.from({length:n},(_,i)=>`<label>Player ${i+1}<br><input type="text" value="${["Anna","Paul","Lucy","Mark"][i]}" maxlength="14"></label>`).join(""); };
  J.$("#c-n").onchange = noms; noms();
  J.$("#c-modo").onchange = () => J.$("#c-n").parentElement.style.display = J.$("#c-modo").value==="rapida"?"none":"";
  J.$("#c-ok").onclick = () => {
    modo = J.$("#c-modo").value;
    const nombres = J.$$("#c-noms input").map(i=>i.value.trim()||"Player");
    jugadores = (modo==="rapida"?[nombres[0]]:nombres).map(n=>({n, est:new Set(), ok:0, mal:0}));
    turno=0; usadas=new Set(); rapida={n:0,ok:0};
    tablero();
  };
}

function svgRueda(){
  const n=ORDEN.length, r=190, c=200; let s=`<svg viewBox="0 0 400 400" id="rueda"><circle cx="200" cy="200" r="198" fill="#1b2556" stroke="#fff" stroke-width="4"/>`;
  ORDEN.forEach((sec,i)=>{
    const a0=(i/n)*2*Math.PI-Math.PI/2, a1=((i+1)/n)*2*Math.PI-Math.PI/2;
    const x0=c+r*Math.cos(a0), y0=c+r*Math.sin(a0), x1=c+r*Math.cos(a1), y1=c+r*Math.sin(a1);
    s+=`<path d="M${c},${c} L${x0},${y0} A${r},${r} 0 0,1 ${x1},${y1} Z" fill="${sec.t.color}" stroke="#fff" stroke-width="2" opacity="${sec.corona?1:.78}"/>`;
    const am=(a0+a1)/2, tx=c+r*.68*Math.cos(am), ty=c+r*.68*Math.sin(am);
    s+=`<text x="${tx}" y="${ty}" font-size="30" text-anchor="middle" dominant-baseline="central">${sec.corona?"👑":sec.t.emoji}</text>`;
  });
  s+=`<circle cx="200" cy="200" r="34" fill="#fff"/><text x="200" y="202" font-size="34" text-anchor="middle" dominant-baseline="central">🧠</text></svg>`;
  return s;
}

function tablero(){
  raiz.innerHTML = `<div class="sb-zona">
    <div><div class="rueda-cont"><div class="flecha"></div>${svgRueda()}</div>
      <div class="centro-txt" style="margin-top:14px"><button class="btn" id="girar">🎡 Spin the wheel</button></div></div>
    <div><div class="jugadores" id="jugs"></div><div class="estado" id="estado"></div><div id="zonaP"></div>
    <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:8px">${TEMAS.map(t=>`<span class="etq" style="background:${t.color}">${t.emoji} ${t.nombre}</span>`).join("")}</div></div></div>`;
  J.$("#rueda").style.transform = `rotate(${rot}deg)`;
  J.$("#girar").onclick = girar;
  pintaJug();
}

function pintaJug(){
  J.$("#jugs").innerHTML = jugadores.map((j,i)=>`<div class="jug ${i===turno?"turno":""}"><span style="font-size:1.4rem">${i===turno?"👉":"🙂"}</span><span class="nom">${j.n}</span>
    ${modo==="estrellas"?`<span class="estrellas">${TEMAS.map(t=>`<i style="${j.est.has(t.id)?`background:${t.color}`:""}" title="${t.nombre}"></i>`).join("")}</span>`:`<b>${rapida.ok} / ${rapida.n}</b>`}</div>`).join("");
  J.$("#estado").textContent = modo==="estrellas" ? (ON&&turno===yo?"Your turn! Spin the wheel":`${jugadores[turno].n}’s turn`) : `Question ${Math.min(rapida.n+1,12)} of 12`;
}

async function girar(){
  if(girando) return; if(ON&&turno!==yo) return; girando=true; J.$("#girar").disabled=true; J.$("#zonaP").innerHTML="";
  const idx = J.azar(ORDEN.length), n=ORDEN.length, paso=360/n;
  // el sector idx debe quedar arriba (bajo la flecha)
  const objetivo = 360 - (idx*paso + paso/2) + (Math.random()-.5)*paso*.6;
  rot = rot - (rot%360) + 360*5 + objetivo;
  J.$("#rueda").style.transform = `rotate(${rot}deg)`;
  envia({q:null,resp:null});
  await J.espera(4100);
  girando=false;
  let sec = ORDEN[idx], tema = sec.t;
  const j = jugadores[turno];
  if(modo==="estrellas" && sec.corona && j.est.has(tema.id)){
    const faltan = TEMAS.filter(t=>!j.est.has(t.id));
    const k = await J.modal(`<h2>👑 Crown!</h2><p>You already have the ${tema.nombre} star. Choose another topic you’re missing:</p>`, faltan.map((t,i)=>({txt:`${t.emoji} ${t.nombre}`, valor:i})), true);
    tema = faltan[k];
  }
  preguntar(tema, sec.corona);
}

function sacaPregunta(tema){
  let lista = PREGUNTAS.map((p,i)=>[p,i]).filter(([p,i])=>p[0]===tema.id && !usadas.has(i));
  if(!lista.length){ PREGUNTAS.forEach((p,i)=>{ if(p[0]===tema.id) usadas.delete(i); }); return sacaPregunta(tema); }
  const [p,i] = J.elige(lista); usadas.add(i); return p;
}

function preguntar(tema, corona){
  const p = sacaPregunta(tema);
  const ops = J.baraja([p[2],p[3],p[4],p[5]]);
  qAct={tema:tema.id,corona,pi:PREGUNTAS.indexOf(p),ops}; envia({q:qAct,resp:null});
  const z = J.$("#zonaP");
  z.innerHTML = `<div class="pregunta" style="border-color:${tema.color}">
    <div class="tema" style="color:${tema.color}">${tema.emoji} ${tema.nombre} ${corona&&modo==="estrellas"?"· 👑 wins a star":""}</div>
    <h2>${p[1]}</h2><div class="ops">${ops.map(o=>`<button class="op">${o}</button>`).join("")}</div>
    <div class="reloj"><div style="width:100%"></div></div><div id="seg" style="text-align:right;color:var(--suave);font-size:.9rem">30 s</div></div>`;
  z.scrollIntoView({behavior:"smooth",block:"nearest"});
  let t=30; clearInterval(reloj);
  setTimeout(()=>{ const b=J.$(".reloj div"); if(b) b.style.width="96.6%"; },30);
  reloj = setInterval(()=>{ t--; const b=J.$(".reloj div"); if(b) b.style.width=(t/30*100)+"%"; const s=J.$("#seg"); if(s) s.textContent=t+" s"; if(t<=0){ clearInterval(reloj); responde(null); } },1000);
  J.$$(".op",z).forEach(b=>b.onclick=()=>responde(b));
  function responde(b){
    clearInterval(reloj);
    const botones = J.$$(".op",z); botones.forEach(x=>x.disabled=true);
    const correcta = botones.find(x=>x.textContent===p[2]); correcta.classList.add("bien");
    const ok = b && b.textContent===p[2];
    if(b && !ok) b.classList.add("mal");
    envia({q:qAct,resp:{t:b?b.textContent:null}});
    const j = jugadores[turno];
    setTimeout(()=>resultado(ok, j, tema, corona), 1300);
  }
}

function resultado(ok, j, tema, corona){
  if(modo==="rapida"){
    rapida.n++; if(ok) rapida.ok++;
    J.aviso(ok?"✅ Correct!":"❌ Wrong");
    pintaJug();
    if(rapida.n>=12){
      const r = rapida.ok; if(r>=9) J.confeti();
      const mejor = J.lee("sb-record",0); if(r>mejor) J.guarda("sb-record",r);
      J.modal(`<h2>${r>=9?"🏆":"🎯"} You got ${r} of 12 right</h2><p>${r>=11?"You’re a true know-it-all!":r>=8?"Very good!":r>=5?"Not bad, go for more!":"Not your day. Rematch!"}</p><p>Your best score: ${Math.max(r,mejor)} of 12.</p>`,[{txt:"Play again"}]).then(config);
      return;
    }
    J.$("#girar").disabled=false; return;
  }
  if(ok){
    j.ok++;
    if(corona && !j.est.has(tema.id)){ j.est.add(tema.id); J.aviso(`⭐ ${j.n} wins the ${tema.nombre} star!`,2600); }
    else J.aviso(`✅ Correct! ${j.n} spins again`);
    if(j.est.size===6){
      pintaJug(); J.confeti(150);
      envia({q:null,resp:null,fin:true});
      J.modal(`<h2>🏆 ${j.n} is the Know-It-All!</h2><p>Collected all 6 stars with ${j.ok} right answers and ${j.mal} wrong.</p>`,[{txt:"New game"}]).then(config);
      return;
    }
  } else {
    j.mal++;
    if(jugadores.length>1){ turno=(turno+1)%jugadores.length; J.aviso(`❌ Wrong. ${jugadores[turno].n}’s turn`); }
    else J.aviso("❌ Wrong. Keep trying!");
  }
  pintaJug(); J.$("#girar").disabled=ON?turno!==yo:false; envia({q:null,resp:null});
}

function envia(x){ if(!ON) return;
  ON.enviar({jug:jugadores.map((j,i)=>({n:ON.jugadores[i],est:[...j.est],ok:j.ok,mal:j.mal})),turno,rot,usadas:[...usadas],ev:Date.now(),...x}); }
function muestraPregunta(q){
  const tema=TEMAS.find(t=>t.id===q.tema), p=PREGUNTAS[q.pi], z=J.$("#zonaP");
  z.innerHTML = `<div class="pregunta" style="border-color:${tema.color}">
    <div class="tema" style="color:${tema.color}">${tema.emoji} ${tema.nombre} ${q.corona?"· 👑 wins a star":""}</div>
    <h2>${p[1]}</h2><div class="ops">${q.ops.map(o=>`<button class="op" disabled>${o}</button>`).join("")}</div>
    <p style="color:var(--suave)">${jugadores[turno].n} answers…</p></div>`; }
async function carga(e){
  const giro=e.rot!==rot; jugadores=e.jug.map((j,i)=>({...j,n:i===yo?"You":escH(j.n),est:new Set(j.est)})); turno=e.turno; usadas=new Set(e.usadas);
  if(giro){ rot=e.rot; J.$("#rueda").style.transform=`rotate(${rot}deg)`; J.$("#zonaP").innerHTML=""; finGiro=Date.now()+4100; }
  pintaJug(); J.$("#girar").disabled=turno!==yo;
  if(e.q){ const w=finGiro-Date.now(); if(w>0) await J.espera(w); muestraPregunta(e.q);
    if(e.resp){ const p=PREGUNTAS[e.q.pi]; J.$$("#zonaP .op").forEach(b=>{ if(b.textContent===p[2]) b.classList.add("bien"); else if(b.textContent===e.resp.t) b.classList.add("mal"); }); } }
  if(e.fin){ const g=jugadores.find(j=>j.est.size===6); if(g){ if(jugadores.indexOf(g)===yo) J.confeti(150); J.modal(`<h2>🏆 ${jugadores.indexOf(g)===yo?"You’re the Know-It-All!":g.n+" is the Know-It-All"}</h2><p>Has collected all 6 stars.</p>`,[{txt:"OK"}]); } } }
J.online&&J.online.activar({juego:"sabelotodo", titulo:"Know-It-All Trivia", min:2, max:6,
  inicio(nombres){ return {jug:nombres.map(n=>({n,est:[],ok:0,mal:0})),turno:0,rot:0,usadas:[],q:null,resp:null}; },
  alEmpezar(ctx,e){ ON=ctx; yo=ctx.yo; modo="estrellas"; jugadores=e.jug.map(j=>({...j,est:new Set()})); tablero(); carga(e); },
  alCambiar(e){ carga(e); } });
config();
})();
