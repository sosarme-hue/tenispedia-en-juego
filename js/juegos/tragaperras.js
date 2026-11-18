/* Tragaperras con fichas de mentira */
(function(){
J.paginaJuego({titulo:"Slot Machine", emoji:"🎰", ficha:"tragaperras", ins:{
  titulo:"Slot Machine",
  intro:"A machine with <b>3 reels</b> of fruit, bells, stars and sevens. You play with <b>pretend chips</b>: you start with 500 and real money is never used.",
  pasos:[
    "Choose your <b>bet per line</b> (1, 2, 5 or 10 chips) and how many <b>lines</b> you play: 1 (the middle one), 3 (the three horizontal ones) or 5 (the two diagonals as well).",
    "Press <b>🎰 Spin</b>. Your bet times the number of lines is taken off and the reels spin.",
    "If <b>three matching symbols</b> land on a line you are playing, you win what the paytable shows multiplied by your bet.",
    "<b>Cherries</b> also pay if one or two land, starting from the left.",
    "The <b>⭐ star</b> is wild: it replaces any symbol (except the 7).",
    "If you run out of chips, press <b>Reload</b> to get back to 500."
  ],
  consejos:["It’s a game of pure chance: in the long run, the machine always wins.","Recuerda: esto es solo un juego, sin dinero real."]
}});
document.head.append(J.el("style",{},`
.tg{max-width:560px;margin:0 auto}
.tg-maq{background:linear-gradient(180deg,#c1121f,#7a0a12);border-radius:30px 30px 20px 20px;padding:18px;box-shadow:var(--sombra),inset 0 2px 0 rgba(255,255,255,.3);border:4px solid #ffc94a}
.tg-titulo{text-align:center;font-family:var(--titulos);font-size:1.8rem;color:#ffc94a;text-shadow:0 2px 0 #7a0a12,0 0 14px #ff9f1c;margin-bottom:10px;letter-spacing:.08em}
.tg-ventana{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:#1b0a0a;padding:10px;border-radius:16px;position:relative;box-shadow:inset 0 6px 16px rgba(0,0,0,.8)}
.tg-rod{height:calc(3 * var(--sh));overflow:hidden;border-radius:10px;background:linear-gradient(180deg,#ccc,#fff 25%,#fff 75%,#ccc);position:relative;--sh:clamp(64px,17vw,96px)}
.tg-cinta{position:absolute;left:0;right:0;top:0}
.tg-cinta div{height:var(--sh);display:grid;place-items:center;font-size:calc(var(--sh)*.6)}
.tg-lin{position:absolute;left:4px;right:4px;height:3px;background:rgba(255,201,74,.0);pointer-events:none;border-radius:2px}
.tg-lin.on{background:rgba(255,201,74,.55)}
.tg-lin.gana{background:#2ed47a;box-shadow:0 0 10px #2ed47a;height:5px}
.tg-svg{position:absolute;inset:10px;pointer-events:none}
.tg-mandos{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px;color:#fff}
.tg-mandos select{background:#3d0a0f;color:#fff;border-color:#ffc94a}
.tg-premios{width:100%;border-collapse:collapse;margin-top:14px;background:var(--panel);border-radius:14px;overflow:hidden;font-size:.95rem}
.tg-premios td{padding:5px 10px;border-bottom:1px solid var(--borde)}.tg-premios td:last-child{text-align:right;font-weight:800;color:var(--oro)}
`));
const SIM=["🍒","🍋","🍊","🍇","🍉","🔔","⭐","7️⃣"];
const PESO={"🍒":8,"🍋":7,"🍊":6,"🍇":5,"🍉":4,"🔔":3,"⭐":2,"7️⃣":1};
const PAGA={"🍒":10,"🍋":15,"🍊":20,"🍇":30,"🍉":40,"🔔":75,"⭐":150,"7️⃣":300};
const LINEAS=[[1,1,1],[0,0,0],[2,2,2],[0,1,2],[2,1,0]]; // fila de cada rodillo
let saldo=J.lee("tragaperras-saldo",500), apuesta=1, nlin=1, gira=false;
const tira=[]; for(const s of SIM) for(let k=0;k<PESO[s];k++) tira.push(s);
let vista=[[0,1,2],[3,4,5],[6,7,0]].map(r=>r.map(i=>SIM[i]));
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="tg"><div class="marcador" style="justify-content:center"><div class="caja"><small>Chips</small><b id="tg-s">${saldo}</b></div><div class="caja"><small>Last win</small><b id="tg-u">0</b></div></div>
<div class="tg-maq"><div class="tg-titulo">★ LUDICO SLOT ★</div>
<div class="tg-ventana" id="tg-v">${[0,1,2].map(r=>`<div class="tg-rod"><div class="tg-cinta" id="tg-r${r}"></div></div>`).join("")}<svg class="tg-svg" id="tg-svg"></svg></div>
<div class="tg-mandos"><label>Bet per line <select id="tg-a"><option>1</option><option>2</option><option>5</option><option>10</option></select></label>
<label>Lines <select id="tg-l"><option value="1">1</option><option value="3">3</option><option value="5">5</option></select></label></div>
<div class="centro-txt" style="margin-top:12px"><button class="btn" id="tg-go" style="font-size:1.3rem;padding:14px 34px">🎰 Spin (<span id="tg-c">1</span>)</button> <button class="btn sec peq" id="tg-rec">Reload</button></div></div>
<div class="estado" id="tg-est"></div>
<table class="tg-premios"><tr><td colspan="2"><b>Paytable</b> (per chip bet on the line)</td></tr>
${SIM.slice().reverse().map(s=>`<tr><td>${s} ${s} ${s}</td><td>× ${PAGA[s]}</td></tr>`).join("")}<tr><td>🍒 🍒 (first two)</td><td>× 5</td></tr><tr><td>🍒 (first)</td><td>× 2</td></tr>
<tr><td colspan="2" style="color:var(--suave);font-size:.85rem">⭐ is wild (except for the 7). Pretend chips: there is no real money.</td></tr></table></div>`;
function pintaRod(r, lista, despl=0){ const c=J.$("#tg-r"+r); c.innerHTML=lista.map(s=>`<div>${s}</div>`).join(""); c.style.transition="none"; c.style.transform=`translateY(${-despl}px)`; }
function dibujaLineas(ganadoras=[]){ const svg=J.$("#tg-svg"); const w=svg.clientWidth, h=svg.clientHeight; const x=[w/6,w/2,5*w/6], y=f=>h*(f+.5)/3;
  svg.setAttribute("viewBox",`0 0 ${w} ${h}`);
  svg.innerHTML=LINEAS.slice(0,nlin).map((L,i)=>`<polyline points="${L.map((f,r)=>`${x[r]},${y(f)}`).join(" ")}" fill="none" stroke="${ganadoras.includes(i)?"#2ed47a":"rgba(255,201,74,.45)"}" stroke-width="${ganadoras.includes(i)?6:3}" stroke-linecap="round"/>`).join(""); }
[0,1,2].forEach(r=>pintaRod(r,vista[r]));
const act=()=>{ J.$("#tg-s").textContent=saldo; J.$("#tg-c").textContent=apuesta*nlin; J.guarda("tragaperras-saldo",saldo); dibujaLineas(); };
J.$("#tg-a").onchange=e=>{ apuesta=+e.target.value; act(); }; J.$("#tg-l").onchange=e=>{ nlin=+e.target.value; act(); };
J.$("#tg-rec").onclick=()=>{ if(saldo>=50){ J.aviso("You can only reload when you have fewer than 50 chips left"); return; } saldo=500; act(); J.aviso("You have 500 pretend chips again"); };
function premio(l){ let [a,b,c]=l;
  const igual=(x,s)=>x===s||(x==="⭐"&&s!=="7️⃣");
  for(const s of SIM.slice().reverse()){ if(igual(a,s)&&igual(b,s)&&igual(c,s)) return PAGA[s]; }
  if(a==="🍒"&&b==="🍒") return 5; if(a==="🍒") return 2; return 0; }
J.$("#tg-go").onclick=async()=>{ if(gira) return; const coste=apuesta*nlin; if(coste>saldo){ J.aviso("You don’t have enough chips. Lower your bet or press Reload"); return; }
  gira=true; saldo-=coste; act(); J.$("#tg-est").textContent=""; J.$("#tg-u").textContent=0;
  const fin=[0,1,2].map(()=>[J.elige(tira),J.elige(tira),J.elige(tira)]);
  const sh=J.$(".tg-rod").clientHeight/3;
  await Promise.all([0,1,2].map(r=>new Promise(ok=>{ const n=18+r*8; const lista=vista[r].concat([...Array(n)].map(()=>J.elige(tira)), fin[r]);
    pintaRod(r,lista,0); const c=J.$("#tg-r"+r); c.offsetHeight;
    c.style.transition=`transform ${1.1+r*.45}s cubic-bezier(.2,.7,.25,1.04)`; c.style.transform=`translateY(${-(lista.length-3)*sh}px)`;
    setTimeout(()=>{ pintaRod(r,fin[r]); ok(); },(1.1+r*.45)*1000+60); })));
  vista=fin; let tot=0; const gan=[];
  LINEAS.slice(0,nlin).forEach((L,i)=>{ const p=premio(L.map((f,r)=>fin[r][f])); if(p){ tot+=p*apuesta; gan.push(i); } });
  saldo+=tot; act(); dibujaLineas(gan); J.$("#tg-u").textContent=tot;
  J.$("#tg-est").textContent= tot? `You win ${tot} chips!`:"No win this time";
  if(tot>=apuesta*75) J.confeti(); gira=false; };
act();
})();
