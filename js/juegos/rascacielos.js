/* Rascacielos — juego original de comprar ciudades y construir */
(function(){
J.paginaJuego({titulo:"Skyscrapers", emoji:"🏙️", ficha:"juegos-de-propiedades", ins:{
  titulo:"Skyscrapers",
  intro:"A board game about buying cities, putting up buildings and collecting rent. You play against 1, 2 or 3 computer rivals. You all start with 1,500 pretend coins.",
  pasos:[
    "Press <b>🎲 Roll dice</b>. Your token moves forward as many squares as the dice add up to, clockwise.",
    "If you land on a <b>city, airport or company</b> with no owner, you can <b>buy it</b> by paying its price. If you’re not interested, you leave it.",
    "If you land on a square that belongs to another player, you <b>pay them rent</b>. If it’s yours, you pay nothing.",
    "When you own <b>all the cities of one colour</b>, the rent doubles and you can <b>build</b>: up to 4 blocks 🏢 and then a skyscraper 🏙️. Each building multiplies the rent.",
    "Every time you pass <b>Go</b> you collect 200 coins.",
    "The <b>❓ Chance</b> y <b>🎁 Surprise</b> squares give you a card with a prize, a fine or a trip.",
    "If you roll <b>doubles</b> (both dice the same), you roll again. Three doubles in a row send you to <b>jail</b>.",
    "In jail you can pay 50 coins to get out or try to roll doubles for three turns.",
    "If you can’t pay, your buildings are sold at half price and your cities are mortgaged. If that still isn’t enough, you’re eliminated.",
    "The last player left wins. You can also press <b>End game</b> and whoever has the highest net worth (money + properties + buildings) wins."
  ],
  consejos:["Airports pay more rent the more of them you own.","Completing a colour is the key: you can’t build without a complete colour.","Tap any square on the board to see its prices and rents."]
}});

const css=`
.rc-zona{display:grid;grid-template-columns:minmax(0,760px) 1fr;gap:18px;align-items:start}
@media(max-width:1000px){.rc-zona{grid-template-columns:1fr}}
.rc-tab{display:grid;grid-template-columns:1.45fr repeat(9,1fr) 1.45fr;grid-template-rows:1.45fr repeat(9,1fr) 1.45fr;aspect-ratio:1;width:100%;background:#d7f0dc;border:4px solid #12305a;border-radius:12px;gap:1px;padding:0;overflow:hidden;color:#111}
.cas{background:#f6fbf5;position:relative;display:flex;flex-direction:column;font-size:clamp(5.5px,1.05vw,10px);line-height:1.1;text-align:center;cursor:pointer;overflow:hidden;font-weight:700;padding:1px}
.cas:hover{filter:brightness(.95)}
.cas .banda{height:22%;flex:0 0 auto;border-bottom:1px solid rgba(0,0,0,.25)}
.cas .nom{flex:1;display:flex;align-items:center;justify-content:center;padding:1px}
.cas .pre{font-size:.9em;color:#333;font-weight:400}
.cas .ico{font-size:1.9em;line-height:1}
.cas.esq{font-size:clamp(6px,1.15vw,11px);justify-content:center;align-items:center;background:#fff7d6}
.cas.esq .ico{font-size:2.6em}
.cas .dueno{position:absolute;bottom:1px;right:1px;width:28%;aspect-ratio:1;border-radius:50%;border:1px solid #fff}
.cas .edif{position:absolute;top:1px;left:0;right:0;font-size:.95em;letter-spacing:-1px}
.cas.hipo{opacity:.45}
.fichas{position:absolute;inset:auto 0 22% 0;display:flex;justify-content:center;flex-wrap:wrap;gap:0;pointer-events:none}
.fichas span{font-size:clamp(11px,2.2vw,20px);filter:drop-shadow(0 1px 1px rgba(0,0,0,.6));animation:salta .3s}
@keyframes salta{50%{transform:translateY(-6px)}}
.rc-centro{grid-column:2/11;grid-row:2/11;background:radial-gradient(circle,#e9fbe9,#c7ebcf);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:8px}
.rc-logo{font-family:var(--titulos);font-size:clamp(1.2rem,4.5vw,2.8rem);color:#12305a;transform:rotate(-12deg);letter-spacing:1px;text-shadow:2px 2px 0 #ffc94a}
.dados{display:flex;gap:10px}
.dado{width:clamp(34px,7vw,56px);aspect-ratio:1;background:#fff;border-radius:10px;box-shadow:0 3px 8px rgba(0,0,0,.3);display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:16%}
.dado i{width:85%;aspect-ratio:1;border-radius:50%;background:#12305a;place-self:center}
.dado.rueda{animation:rueda .5s}
@keyframes rueda{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
.rc-botones{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.rc-botones .btn{padding:7px 13px;font-size:clamp(.75rem,1.6vw,.95rem)}
.rc-jug{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:var(--panel);margin-bottom:8px;border:2px solid transparent}
.rc-jug.turno{border-color:var(--oro)}
.rc-jug.fuera{opacity:.4}
.rc-jug .em{font-size:1.6rem}
.rc-jug .props{display:flex;flex-wrap:wrap;gap:2px;margin-top:4px}
.rc-jug .props i{width:10px;height:14px;border-radius:2px}
.rc-log{background:var(--panel);border-radius:14px;padding:10px 12px;height:260px;overflow:auto;font-size:.9rem;color:var(--suave)}
.rc-log div{padding:3px 0;border-bottom:1px solid var(--borde)}
.tarjeta-prop{border:2px solid #333;border-radius:10px;background:#fff;color:#111;max-width:300px;margin:0 auto;overflow:hidden}
.tarjeta-prop .tit{padding:12px;text-align:center;font-family:var(--titulos);font-size:1.3rem}
.tarjeta-prop table{width:100%;border-collapse:collapse;font-size:.95rem}
.tarjeta-prop td{padding:4px 12px}
.tarjeta-prop td:last-child{text-align:right;font-weight:700}
`;
document.head.append(J.el("style",{},css));

const GRUPOS = {
  mar:{c:"#8d5524",n:"Brown",casa:50}, cel:{c:"#7fd3f7",n:"Light blue",casa:50},
  ros:{c:"#e65fb3",n:"Pink",casa:100}, nar:{c:"#ff9f1c",n:"Orange",casa:100},
  roj:{c:"#e63946",n:"Red",casa:150}, ama:{c:"#ffd60a",n:"Yellow",casa:150},
  ver:{c:"#2a9d8f",n:"Green",casa:200}, azu:{c:"#1d3fa0",n:"Blue",casa:200}
};
// t: tipo; p: precio; g: grupo; r: alquiler base
const C = (n,g,p,r) => ({t:"ciu",n,g,p,r});
const CASILLAS = [
  {t:"salida",n:"Go",ico:"➡️"},
  C("Cuenca","mar",60,4), {t:"sorpresa",n:"Surprise",ico:"🎁"}, C("Teruel","mar",60,6), {t:"imp",n:"Income tax",ico:"🧾",cant:200},
  {t:"aer",n:"Barajas Airport",p:200,ico:"✈️"}, C("Badajoz","cel",100,8), {t:"suerte",n:"Chance",ico:"❓"}, C("Cáceres","cel",100,8), C("Mérida","cel",120,10),
  {t:"carcel",n:"Jail",ico:"🚔"},
  C("Valladolid","ros",140,12), {t:"com",n:"Electric Company",p:150,ico:"💡"}, C("Burgos","ros",140,12), C("León","ros",160,14),
  {t:"aer",n:"El Prat Airport",p:200,ico:"✈️"}, C("Logroño","nar",180,16), {t:"sorpresa",n:"Surprise",ico:"🎁"}, C("Pamplona","nar",180,16), C("Zaragoza","nar",200,18),
  {t:"parking",n:"Free Parking",ico:"🌳"},
  C("Córdoba","roj",220,20), {t:"suerte",n:"Chance",ico:"❓"}, C("Granada","roj",220,20), C("Sevilla","roj",240,22),
  {t:"aer",n:"Palma Airport",p:200,ico:"✈️"}, C("Alicante","ama",260,24), C("Palma","ama",260,24), {t:"com",n:"Water Works",p:150,ico:"🚰"}, C("Valencia","ama",280,26),
  {t:"alacarcel",n:"Go to jail!",ico:"👮"},
  C("Santander","ver",300,28), C("San Sebastián","ver",300,28), {t:"sorpresa",n:"Surprise",ico:"🎁"}, C("Bilbao","ver",320,30),
  {t:"aer",n:"Málaga Airport",p:200,ico:"✈️"}, {t:"suerte",n:"Chance",ico:"❓"}, C("Barcelona","azu",350,35), {t:"imp",n:"Luxury tax",ico:"💎",cant:100}, C("Madrid","azu",400,50)
];
const MULT = [1,5,14,38,52,66]; // alquiler según edificios (0..5)
const SUERTE = [
  {txt:"Advance to Go and collect 200.", f:j=>mueveA(j,0,true)},
  {txt:"Direct flight to Madrid.", f:j=>mueveA(j,39,true)},
  {txt:"Visit Seville. If you pass Go, collect 200.", f:j=>mueveA(j,24,true)},
  {txt:"Fly to Barajas Airport.", f:j=>mueveA(j,5,true)},
  {txt:"Go back three squares.", f:j=>mueveA(j,(j.pos+37)%40,false)},
  {txt:"Go straight to jail!", f:j=>alCalabozo(j)},
  {txt:"You win a Spanish omelette contest: collect 150.", f:j=>cobra(j,150)},
  {txt:"Speeding fine: pay 15.", f:j=>paga(j,15)},
  {txt:"Your shares go up: collect 50.", f:j=>cobra(j,50)},
  {txt:"Repairs to your buildings: pay 25 per block and 100 per skyscraper.", f:j=>paga(j, edificiosDe(j).reduce((s,n)=>s+(n===5?100:25*n),0))},
  {txt:"You’re elected mayor: pay 50 to each player.", f:j=>{ vivos().filter(x=>x!==j).forEach(x=>transfiere(j,x,50)); }},
  {txt:"Get out of jail free (keep this card).", f:j=>{ j.libre=(j.libre||0)+1; }},
  {txt:"Visit Bilbao.", f:j=>mueveA(j,34,true)},
  {txt:"Tax refund: collect 100.", f:j=>cobra(j,100)}
];
const SORPRESA = [
  {txt:"Bank error in your favour: collect 200.", f:j=>cobra(j,200)},
  {txt:"Dentist’s bill: pay 50.", f:j=>paga(j,50)},
  {txt:"You sell your sticker collection: collect 50.", f:j=>cobra(j,50)},
  {txt:"It’s your birthday: each player gives you 10.", f:j=>{ vivos().filter(x=>x!==j).forEach(x=>transfiere(x,j,10)); }},
  {txt:"Inheritance from a distant aunt: collect 100.", f:j=>cobra(j,100)},
  {txt:"Car insurance: pay 100.", f:j=>paga(j,100)},
  {txt:"Cookery course fees: pay 50.", f:j=>paga(j,50)},
  {txt:"Second prize in a beauty contest: collect 10.", f:j=>cobra(j,10)},
  {txt:"You win the neighbourhood lottery: collect 100.", f:j=>cobra(j,100)},
  {txt:"Advance to Go and collect 200.", f:j=>mueveA(j,0,true)},
  {txt:"Go straight to jail!", f:j=>alCalabozo(j)},
  {txt:"Get out of jail free (keep this card).", f:j=>{ j.libre=(j.libre||0)+1; }},
  {txt:"Street repairs: pay 40 per block and 115 per skyscraper.", f:j=>paga(j, edificiosDe(j).reduce((s,n)=>s+(n===5?115:40*n),0))},
  {txt:"Interest on your savings: collect 25.", f:j=>cobra(j,25)}
];
const FIGURAS = ["🦊","🐼","🐸","🦁"], COLORES=["#ff4d6d","#4cc9f0","#2ed47a","#ffc94a"];

let ON=null, cargando=false, yo=0, tn=0, tnVisto=-1, logs=[], dados=[5,2];
const escH=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const esMio=t=>!ON||t===yo||(jug[t]&&jug[t].cpu&&ON.yo===0);
let jug=[], turno=0, estado={}, dueno={}, edif={}, hipo={}, mazoS=[], mazoP=[], ocupado=false, fin=false;
const raiz = J.$("#juego");

function config(){
  raiz.innerHTML = `<div class="panel" style="max-width:600px;margin:0 auto"><h2>🏙️ New game</h2>
  <p>Your name<br><input type="text" id="c-nom" value="You" maxlength="12"></p>
  <p>Computer rivals<br><select id="c-n"><option value="1">1 rival</option><option value="2">2 rivals</option><option value="3" selected>3 rivals</option></select></p>
  <p>Difficulty<br><select id="c-d"><option value="0">Easy</option><option value="1" selected>Normal</option><option value="2">Hard</option></select></p>
  <button class="btn" id="c-ok">Start!</button></div>`;
  J.$("#c-ok").onclick = ()=>{
    const n=+J.$("#c-n").value, nombres=["Fox","Panda","Frog","León"];
    jug = [{n:J.$("#c-nom").value||"You", hum:true}];
    for(let i=1;i<=n;i++) jug.push({n:nombres[i], hum:false});
    jug.forEach((j,i)=>Object.assign(j,{i, f:FIGURAS[i], col:COLORES[i], din:1500, pos:0, carcel:0, fuera:false, libre:0}));
    jug[0].f = "🦊"; jug.slice(1).forEach((j,k)=>j.f=FIGURAS[k+1]);
    estado.dif = +J.$("#c-d").value;
    dueno={}; edif={}; hipo={}; turno=0; fin=false;
    mazoS=J.baraja(SUERTE); mazoP=J.baraja(SORPRESA);
    pinta(); log("The game begins! Each player has 1,500 coins.");
    siguiente();
  };
}

function coord(i){
  if(i<=10) return [11, 11-i];
  if(i<=20) return [11-(i-10), 1];
  if(i<=30) return [1, 1+(i-20)];
  return [1+(i-30), 11];
}

function pinta(){
  if(!J.$(".rc-tab")){
    raiz.innerHTML = `<div class="rc-zona"><div class="rc-tab" id="tab"></div>
      <div><div id="jugs"></div><h3>📜 What has happened</h3><div class="rc-log" id="log"></div>
      <p><button class="btn sec peq" id="b-fin">🏁 End game</button></p></div></div>`;
    const tab=J.$("#tab");
    CASILLAS.forEach((c,i)=>{
      const [r,col]=coord(i), d=J.el("div",{class:"cas"+([0,10,20,30].includes(i)?" esq":"")});
      d.style.gridRow=r; d.style.gridColumn=col; d.dataset.i=i;
      d.onclick=()=>verCasilla(i);
      tab.append(d);
    });
    const centro=J.el("div",{class:"rc-centro"},`<div class="rc-logo">SKYSCRAPERS</div><div class="dados"><div class="dado" id="d1"></div><div class="dado" id="d2"></div></div><div class="estado" id="rc-est" style="color:#12305a;margin:0"></div><div class="rc-botones" id="rc-bot"></div>`);
    tab.append(centro);
    pintaDado(J.$("#d1"),5); pintaDado(J.$("#d2"),2);
    J.$("#b-fin").onclick = async ()=>{ const r=await J.modal("<h2>🏁 End the game?</h2><p>Whoever has the highest net worth will win.</p>",[{txt:"Keep playing",cls:"sec",valor:0},{txt:"End",valor:1}]); if(r) termina(); };
  }
  J.$$(".cas").forEach(d=>{
    const i=+d.dataset.i, c=CASILLAS[i];
    let h="";
    if(c.t==="ciu") h=`<div class="banda" style="background:${GRUPOS[c.g].c}"></div><div class="nom">${c.n}</div><div class="pre">${c.p}</div>`;
    else if(c.p) h=`<div class="nom"><span><span class="ico">${c.ico}</span><br>${c.n.replace(" Airport"," Apt.").replace("Electric Company","Electric Co.")}</span></div><div class="pre">${c.p}</div>`;
    else h=`<div class="nom"><span><span class="ico">${c.ico}</span><br>${c.n}</span></div>`;
    if(dueno[i]!==undefined) h+=`<span class="dueno" style="background:${jug[dueno[i]].col}"></span>`;
    if(edif[i]) h+=`<div class="edif">${edif[i]===5?"🏙️":"🏢".repeat(edif[i])}</div>`;
    const aqui=jug.filter(j=>!j.fuera&&j.pos===i);
    if(aqui.length) h+=`<div class="fichas">${aqui.map(j=>`<span>${j.f}</span>`).join("")}</div>`;
    d.innerHTML=h; d.classList.toggle("hipo",!!hipo[i]);
  });
  J.$("#jugs").innerHTML = jug.map((j,k)=>`<div class="rc-jug ${k===turno?"turno":""} ${j.fuera?"fuera":""}"><span class="em">${j.f}</span><div style="flex:1"><b>${j.n}</b>${j.carcel?" 🚔":""}${j.libre?" 🎫":""}<div class="props">${Object.keys(dueno).filter(i=>dueno[i]===k).map(i=>`<i style="background:${CASILLAS[i].g?GRUPOS[CASILLAS[i].g].c:"#999"}" title="${CASILLAS[i].n}"></i>`).join("")}</div></div><b style="font-family:var(--titulos);font-size:1.2rem">${j.fuera?"Eliminated":j.din+" 💰"}</b></div>`).join("");
  if(ON&&!cargando&&esMio(turno)) envia();
}

function pintaDado(el,v){ const P={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}; el.innerHTML=Array.from({length:9},(_,k)=>`<i style="visibility:${P[v].includes(k)?"visible":"hidden"}"></i>`).join(""); }
function log(t){ logs.unshift(t); if(logs.length>40) logs.pop(); const l=J.$("#log"); if(!l) return; l.prepend(J.el("div",{},t)); }
function est(t){ J.$("#rc-est").textContent=t; }
function botones(lista){ const b=J.$("#rc-bot"); b.innerHTML=""; lista.forEach(([txt,f,cls])=>{ const x=J.el("button",{class:"btn "+(cls||"")},txt); x.onclick=f; b.append(x); }); }
const vivos = ()=>jug.filter(j=>!j.fuera);

function alquiler(i, tirada){
  const c=CASILLAS[i], d=dueno[i]; if(d===undefined||hipo[i]) return 0;
  if(c.t==="aer"){ const n=[5,15,25,35].filter(k=>dueno[k]===d).length; return 25*Math.pow(2,n-1); }
  if(c.t==="com"){ const n=[12,28].filter(k=>dueno[k]===d).length; return tirada*(n===2?10:4); }
  const n=edif[i]||0; if(n) return c.r*MULT[n];
  return tieneGrupo(d,c.g)? c.r*2 : c.r;
}
const grupo = g => CASILLAS.map((c,i)=>c.g===g?i:-1).filter(i=>i>=0);
const tieneGrupo = (k,g) => grupo(g).every(i=>dueno[i]===k);
const edificiosDe = j => Object.keys(edif).filter(i=>dueno[i]===j.i).map(i=>edif[i]);
function patrimonio(j){ let s=j.din; for(const i in dueno) if(dueno[i]===j.i){ const c=CASILLAS[i]; s+= hipo[i]? c.p/2 : c.p; if(edif[i]) s+=edif[i]*GRUPOS[c.g].casa; } return s; }

function cobra(j,n){ j.din+=n; log(`${j.f} ${j.n} collects ${n}.`); }
function paga(j,n,a){ if(n<=0) return; j.din-=n; log(`${j.f} ${j.n} pays ${n}${a?" to "+a.n:""}.`); if(a) a.din+=n; if(j.din<0) liquida(j,a); }
function transfiere(de,a,n){ paga(de,n,a); }

function liquida(j,acreedor){
  // vende edificios y luego hipoteca
  for(const i of Object.keys(edif).filter(i=>dueno[i]===j.i).sort((a,b)=>edif[b]-edif[a])){
    while(edif[i]>0 && j.din<0){ edif[i]--; j.din+=GRUPOS[CASILLAS[i].g].casa/2; log(`${j.n} sells a building on ${CASILLAS[i].n}.`); }
    if(!edif[i]) delete edif[i];
  }
  for(const i of Object.keys(dueno).filter(i=>dueno[i]===j.i&&!hipo[i]&&!edif[i])){
    if(j.din>=0) break; hipo[i]=true; j.din+=CASILLAS[i].p/2; log(`${j.n} mortgages ${CASILLAS[i].n}.`);
  }
  if(j.din<0){
    j.fuera=true; log(`💥 ${j.f} ${j.n} goes bankrupt and is eliminated.`);
    for(const i of Object.keys(dueno)) if(dueno[i]===j.i){ if(acreedor&&!acreedor.fuera){ dueno[i]=acreedor.i; } else { delete dueno[i]; delete hipo[i]; } delete edif[i]; }
    if(acreedor && j.din<0) acreedor.din += j.din; // el acreedor pierde la parte que no se pudo pagar
    j.din=0;
    J.aviso(`💥 ${j.n} has gone bankrupt`);
  }
}

function mueveA(j,dest,cobrarSalida){ if(cobrarSalida && dest<j.pos){ cobra(j,200); } j.pos=dest; estado.recaer=true; }
function alCalabozo(j){ j.pos=10; j.carcel=1; estado.dobles=0; estado.alCalabozo=true; log(`🚔 ${j.n} goes to jail.`); }

async function animaMover(j,pasos){
  for(let k=0;k<pasos;k++){ j.pos=(j.pos+1)%40; if(j.pos===0){ cobra(j,200); J.aviso(`➡️ ${j.n} passes Go: +200`); } pinta(); await J.espera(j.hum?140:90); }
}

async function tirar(){
  const j=jug[turno]; botones([]);
  const a=1+J.azar(6), b=1+J.azar(6);
  J.$$(".dado").forEach(d=>{d.classList.remove("rueda"); void d.offsetWidth; d.classList.add("rueda");});
  for(let k=0;k<5;k++){ pintaDado(J.$("#d1"),1+J.azar(6)); pintaDado(J.$("#d2"),1+J.azar(6)); await J.espera(80); }
  pintaDado(J.$("#d1"),a); pintaDado(J.$("#d2"),b); dados=[a,b];
  let dobles=a===b; log(`${j.f} ${j.n} rolls ${a} and ${b}${dobles?" (doubles!)":""}.`);
  if(j.carcel){
    if(dobles){ j.carcel=0; dobles=false; log(`${j.n} gets out of jail with doubles.`); }
    else if(j.carcel>=3){ j.carcel=0; paga(j,50); log(`${j.n} pays 50 and gets out of jail.`); if(j.fuera) return finTurno(); }
    else { j.carcel++; pinta(); return finTurno(); }
    estado.dobles=0;
  } else if(dobles){ estado.dobles=(estado.dobles||0)+1; if(estado.dobles===3){ alCalabozo(j); pinta(); return finTurno(); } } else estado.dobles=0;
  await animaMover(j,a+b);
  await caer(j,a+b);
  pinta();
  if(j.fuera||fin) return finTurno();
  if(dobles && !j.carcel && !estado.alCalabozo){ estado.otra=true; }
  return despuesTirar();
}

async function caer(j,tirada){
  estado.alCalabozo=false;
  for(let vueltas=0;vueltas<3;vueltas++){
    estado.recaer=false;
    const i=j.pos, c=CASILLAS[i];
    if(["ciu","aer","com"].includes(c.t)){
      if(dueno[i]===undefined){
        if(j.din>=c.p){
          let compra;
          if(j.hum) compra = await J.modal(`<h2>${c.ico||"🏙️"} ${c.n}</h2>${fichaHTML(i)}<p class="centro-txt">You have ${j.din} coins. Do you want to buy it for <b>${c.p}</b>?</p>`,[{txt:"No, thanks",cls:"sec",valor:false},{txt:`Buy for ${c.p}`,valor:true}],true);
          else compra = decideCompra(j,i);
          if(compra){ j.din-=c.p; dueno[i]=j.i; log(`🏷️ ${j.f} ${j.n} buys ${c.n} for ${c.p}.`); if(!j.hum) J.aviso(`${j.f} ${j.n} buys ${c.n}`); }
        }
      } else if(dueno[i]!==j.i){
        const r=alquiler(i,tirada), d=jug[dueno[i]];
        if(r>0){ if(j.hum) J.aviso(`You pay ${r} rent to ${d.n}`,2600); paga(j,r,d); }
      }
    } else if(c.t==="imp"){ paga(j,c.cant); if(j.hum) J.aviso(`${c.ico} You pay ${c.cant} in tax`); }
    else if(c.t==="alacarcel"){ alCalabozo(j); if(j.hum) J.aviso("👮 Go to jail!"); }
    else if(c.t==="suerte"||c.t==="sorpresa"){
      const mazo = c.t==="suerte"?mazoS:mazoP; const t=mazo.shift(); mazo.push(t);
      log(`${c.ico} ${j.n}: «${t.txt}»`);
      if(j.hum) await J.modal(`<div class="centro-txt"><div style="font-size:4rem">${c.ico}</div><h2>${c.n}</h2><p style="font-size:1.2rem">${t.txt}</p></div>`,[{txt:"OK"}],true);
      else { J.aviso(`${c.ico} ${j.n}: ${t.txt}`,2600); await J.espera(700); }
      t.f(j); pinta();
    }
    if(!estado.recaer || j.fuera || estado.alCalabozo) break;
  }
  compruebaFin();
}

function decideCompra(j,i){
  const c=CASILLAS[i], reserva=[300,150,80][estado.dif];
  if(j.din-c.p < reserva) return estado.dif>0 && c.g && grupo(c.g).some(k=>dueno[k]===j.i) && j.din-c.p>40;
  return estado.dif===0 ? Math.random()<.7 : true;
}

function construibles(j){
  return CASILLAS.map((c,i)=>i).filter(i=>{ const c=CASILLAS[i]; if(c.t!=="ciu"||dueno[i]!==j.i||!tieneGrupo(j.i,c.g)) return false; if(grupo(c.g).some(k=>hipo[k])) return false; const n=edif[i]||0; if(n>=5) return false; const min=Math.min(...grupo(c.g).map(k=>edif[k]||0)); return n===min; });
}
function construye(j,i){ const c=CASILLAS[i], cost=GRUPOS[c.g].casa; j.din-=cost; edif[i]=(edif[i]||0)+1; log(`🏗️ ${j.f} ${j.n} builds ${edif[i]===5?"a skyscraper":"a block"} on ${c.n} (${cost}).`); }

async function menuConstruir(){
  const j=jug[turno];
  const lista=construibles(j);
  const hip=Object.keys(hipo).filter(i=>dueno[i]===j.i);
  if(!lista.length && !hip.length){ return J.modal("<h2>🏗️ Build</h2><p>You can’t build yet. You need to own <b>all the cities of one colour</b> (with none of them mortgaged).</p>"); }
  const ops = lista.map(i=>({txt:`🏢 ${CASILLAS[i].n} (${GRUPOS[CASILLAS[i].g].casa})`, valor:"c"+i, cls: j.din<GRUPOS[CASILLAS[i].g].casa?"sec":""}))
    .concat(hip.map(i=>({txt:`🔓 Unmortgage ${CASILLAS[i].n} (${Math.ceil(CASILLAS[i].p*.55)})`,valor:"h"+i,cls:"verde"})))
    .concat([{txt:"Close",cls:"sec",valor:"x"}]);
  const r = await J.modal(`<h2>🏗️ Build and unmortgage</h2><p>You have <b>${j.din}</b> coins. Buildings are spread evenly across the cities of a colour. Choose:</p>`, ops);
  if(r==="x") return;
  const i=+r.slice(1);
  if(r[0]==="c"){ if(j.din<GRUPOS[CASILLAS[i].g].casa) return J.aviso("You don’t have enough money"); construye(j,i); }
  else { const cst=Math.ceil(CASILLAS[i].p*.55); if(j.din<cst) return J.aviso("You don’t have enough money"); j.din-=cst; delete hipo[i]; log(`${j.n} unmortgages ${CASILLAS[i].n}.`); }
  pinta(); menuConstruir();
}

function despuesTirar(){
  const j=jug[turno];
  if(!j.hum) return cpuFinal();
  const otra=estado.otra;
  est(otra?"Doubles! Roll again":"What do you want to do?");
  botones([["🏗️ Build",menuConstruir,"sec"], otra?["🎲 Roll again",()=>{estado.otra=false;tirar();}]:["✅ End turn",()=>finTurno()]]);
}

async function cpuFinal(){
  const j=jug[turno];
  // construir si le sobra dinero
  const reserva=[400,250,150][estado.dif];
  let lista;
  while((lista=construibles(j)).length && j.din-GRUPOS[CASILLAS[lista[0]].g].casa>reserva){ construye(j,J.elige(lista)); pinta(); await J.espera(300); }
  for(const i of Object.keys(hipo).filter(i=>dueno[i]===j.i)){ const cst=Math.ceil(CASILLAS[i].p*.55); if(j.din-cst>reserva+100){ j.din-=cst; delete hipo[i]; log(`${j.n} unmortgages ${CASILLAS[i].n}.`);} }
  pinta();
  if(estado.otra){ estado.otra=false; await J.espera(600); return tirar(); }
  await J.espera(500); finTurno();
}

function compruebaFin(){ if(vivos().length===1 && !fin){ fin=true; termina(); } }
function termina(){
  fin=true;
  const orden=[...jug].sort((a,b)=>(a.fuera-b.fuera)||patrimonio(b)-patrimonio(a));
  const g=orden[0]; if(g.hum) J.confeti(150);
  envia();
  J.modal(`<h2>🏆 ${g.f} ${g.n} wins!</h2><table class="t"><tr><th>Player</th><th>Net worth</th></tr>${orden.map(j=>`<tr><td>${j.f} ${j.n}</td><td>${j.fuera?"Eliminated":patrimonio(j)+" 💰"}</td></tr>`).join("")}</table>`,[{txt:ON?"OK":"New game"}],!ON).then(()=>{ if(!ON) config(); });
}

async function finTurno(){
  if(fin) return;
  estado.otra=false; estado.dobles=0;
  const antes=esMio(turno);
  do{ turno=(turno+1)%jug.length; } while(jug[turno].fuera);
  tn++; tnVisto=tn; pinta(); if(ON&&antes) envia(); if(esMio(turno)) empiezaTurno(); else est(`${jug[turno].f} ${jug[turno].n}’s turn`);
}
function siguiente(){ empiezaTurno(); }

async function empiezaTurno(){
  const j=jug[turno];
  est(`${j.f} ${j.n}’s turn`);
  if(j.hum){
    if(j.carcel){
      const ops=[["🎲 Try for doubles",tirar]];
      if(j.din>=50) ops.unshift(["💸 Pay 50 and get out",()=>{ paga(j,50); j.carcel=0; pinta(); tirar(); }]);
      if(j.libre) ops.unshift(["🎫 Use card",()=>{ j.libre--; j.carcel=0; pinta(); tirar(); }]);
      est("You’re in jail"); botones(ops.concat([["🏗️ Build",menuConstruir,"sec"]]));
    } else botones([["🎲 Roll dice",tirar],["🏗️ Build",menuConstruir,"sec"]]);
  } else {
    botones([]);
    await J.espera(700);
    if(j.carcel){
      if(j.libre){ j.libre--; j.carcel=0; log(`${j.n} uses their card to get out.`); }
      else if(j.din>200 && Object.keys(dueno).length<20){ paga(j,50); j.carcel=0; log(`${j.n} pays 50 to get out.`); }
    }
    tirar();
  }
}

function fichaHTML(i){
  const c=CASILLAS[i];
  if(c.t==="ciu"){ const g=GRUPOS[c.g]; return `<div class="tarjeta-prop"><div class="tit" style="background:${g.c};color:${["ama","cel","nar"].includes(c.g)?"#111":"#fff"}">${c.n}</div><table>
    <tr><td>Rent</td><td>${c.r}</td></tr><tr><td>With the whole colour</td><td>${c.r*2}</td></tr>
    ${[1,2,3,4].map(n=>`<tr><td>With ${n} 🏢</td><td>${c.r*MULT[n]}</td></tr>`).join("")}<tr><td>With skyscraper 🏙️</td><td>${c.r*MULT[5]}</td></tr>
    <tr><td>Each building costs</td><td>${g.casa}</td></tr><tr><td>Mortgage</td><td>${c.p/2}</td></tr></table></div>`; }
  if(c.t==="aer") return `<div class="tarjeta-prop"><div class="tit" style="background:#eee">✈️ ${c.n}</div><table><tr><td>With 1 airport</td><td>25</td></tr><tr><td>With 2</td><td>50</td></tr><tr><td>With 3</td><td>100</td></tr><tr><td>With 4</td><td>200</td></tr></table></div>`;
  if(c.t==="com") return `<div class="tarjeta-prop"><div class="tit" style="background:#eee">${c.ico} ${c.n}</div><table><tr><td>With 1 company</td><td>4 × dice</td></tr><tr><td>With both</td><td>10 × dice</td></tr></table></div>`;
  return "";
}
function verCasilla(i){
  const c=CASILLAS[i]; const d=dueno[i]!==undefined?jug[dueno[i]]:null;
  const txt={salida:"Collect 200 every time you pass here.",carcel:"If you’re just visiting, nothing happens.",parking:"Descansa: aquí no ocurre nada.",alacarcel:"If you land here, you go straight to jail without passing Go.",suerte:"Take a Chance card.",sorpresa:"Take a Surprise card.",imp:`You pay ${c.cant} coins.`}[c.t]||"";
  J.modal(`<h2>${c.ico||"🏙️"} ${c.n}</h2>${fichaHTML(i)}<p class="centro-txt">${c.p?`Price: <b>${c.p}</b>. `:""}${d?`Owner: ${d.f} ${d.n}${hipo[i]?" (mortgaged)":""}.`:c.p?"No owner.":""} ${txt}</p>`);
}

function envia(){ if(!ON) return; ON.enviar({jug:jug.map(j=>({...j,hum:false})),turno,tn,estado,dueno,edif,hipo,mazoS:mazoS.map(t=>SUERTE.indexOf(t)),mazoP:mazoP.map(t=>SORPRESA.indexOf(t)),fin,logs,dados}); }
function carga(e){ cargando=true; try{ cargaX(e); } finally { cargando=false; } if(e.fin){ if(!fin) termina(); return; }
  if(tn!==tnVisto){ tnVisto=tn; if(esMio(turno)) empiezaTurno(); else { botones([]); est(`${jug[turno].f} ${jug[turno].n}’s turn`); } } }
function cargaX(e){ jug=e.jug.map((j,i)=>({...j,hum:i===yo})); turno=e.turno; tn=e.tn; estado=e.estado; dueno=e.dueno||{}; edif=e.edif||{}; hipo=e.hipo||{};
  mazoS=e.mazoS.map(k=>SUERTE[k]); mazoP=e.mazoP.map(k=>SORPRESA[k]); logs=e.logs||[]; dados=e.dados||dados;
  pinta(); J.$("#log").innerHTML=""; logs.slice().reverse().forEach(t=>J.$("#log").prepend(J.el("div",{},t)));
  pintaDado(J.$("#d1"),dados[0]); pintaDado(J.$("#d2"),dados[1]); const bf=J.$("#b-fin"); if(bf) bf.style.display="none";
}
J.online&&J.online.activar({juego:"rascacielos", titulo:"Skyscrapers", min:2, max:4,
  inicio(nombres){ const js=nombres.map((n,i)=>({n:escH(n),hum:false,cpu:false,i,f:FIGURAS[i],col:COLORES[i],din:1500,pos:0,carcel:0,fuera:false,libre:0}));
    return {jug:js,turno:0,tn:1,estado:{dif:1},dueno:{},edif:{},hipo:{},mazoS:J.baraja(SUERTE.map((_,k)=>k)),mazoP:J.baraja(SORPRESA.map((_,k)=>k)),fin:false,logs:["The online game begins! Each player has 1,500 coins."],dados:[5,2]}; },
  alEmpezar(ctx,e){ ON=ctx; yo=ctx.yo; fin=false; raiz.innerHTML=""; carga(e); J.aviso(`Your token is ${FIGURAS[yo]}`,3000); },
  alCambiar(e){ carga(e); } });
config();
})();
