/* Siete y medio */
(function(){
J.paginaJuego({titulo:"Seven and a Half", emoji:"🎴", ficha:"siete-y-medio", ins:{
  titulo:"Seven and a Half",
  intro:"The Spanish classic of after-dinner chats and Christmas Eve, played with the <b>40-card Spanish deck</b>. You play against the bank with pretend chips: the aim is to get close to <b>seven and a half</b> without going over.",
  pasos:[
    "Cards from Ace to 7 are worth their number. The <b>Jack, Knight and King are worth half a point</b>.",
    "Choose your bet and press <b>Deal</b>. You get one card.",
    "Press <b>Hit me</b> as many times as you like. If you go over seven and a half, you’re bust and lose your bet.",
    "When you’re happy, press <b>Stand</b>. Then the bank plays: it draws cards until it matches or beats you, or goes bust.",
    "Whoever gets closest to seven and a half wins. <b>The bank wins ties.</b>",
    "If you make <b>exactly seven and a half with two cards</b> (a 7 and a face card), you’re paid double."
  ],
  consejos:["With 5 or more, drawing is risky: more than half the deck would make you bust.","With half a point or 1, it’s always worth drawing.","Face cards are your friends: there are 12 in the deck."]
}});
document.head.append(J.el("style",{},`
.sm-mesa{display:flex;flex-direction:column;gap:12px;color:#fff;--nw:clamp(60px,12vw,88px)}
.sm-fila{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;min-height:calc(var(--nw)*1.45);align-items:center}
.sm-fila .naipe{animation:smEntra .3s ease-out}
@keyframes smEntra{from{transform:translateY(-30px) rotate(-8deg);opacity:0}to{transform:none;opacity:1}}
.sm-tot{text-align:center;font-family:var(--titulos);font-size:1.15rem}
.sm-bot{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}
.sm-ap{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;align-items:center}
.sm-ap button.on{outline:3px solid var(--oro)}
`));
const VAL=c=>c.v<=7?c.v:.5;
const fmt=x=>{ const e=Math.floor(x), m=x%1?"½":""; return e?(e+(m?" and a half":"")):(m?"a half":"0"); };
const raiz=J.$("#juego");
let fichas=J.lee("sm-fichas",100), apuesta=10, mazo=[], yo=[], banca=[], fase="apuesta", msg="", racha=J.lee("sm-record",100);
const suma=m=>m.reduce((a,c)=>a+VAL(c),0);
function pinta(){
  raiz.innerHTML=`<div class="marcador" style="justify-content:center"><div class="caja"><small>🪙 Your chips</small><b>${fichas}</b></div><div class="caja"><small>Bet</small><b>${apuesta}</b></div><div class="caja"><small>🏆 Best</small><b>${racha}</b></div></div>
  <div class="mesa sm-mesa"><div class="sm-tot">🏦 Bank${banca.length?": "+fmt(suma(banca)):""}</div><div class="sm-fila" id="sm-b"></div>
  <div class="estado" style="margin:0" id="sm-est">${msg}</div>
  <div class="sm-fila" id="sm-y"></div><div class="sm-tot">🙂 You${yo.length?": "+fmt(suma(yo)):""}</div>
  <div id="sm-ctl"></div></div>`;
  banca.forEach(c=>J.$("#sm-b").append(J.naipeEsp(c))); yo.forEach(c=>J.$("#sm-y").append(J.naipeEsp(c)));
  const ctl=J.$("#sm-ctl");
  if(fase==="apuesta"){
    if(fichas<=0){ ctl.innerHTML=`<div class="sm-bot"><button class="btn" id="sm-rec">🪙 Start again with 100 chips</button></div>`; J.$("#sm-rec").onclick=()=>{ fichas=100; J.guarda("sm-fichas",fichas); msg=""; pinta(); }; return; }
    apuesta=Math.min(apuesta,fichas);
    ctl.innerHTML=`<div class="sm-ap">${[5,10,25,50].filter(v=>v<=fichas).map(v=>`<button class="btn sec peq ${v===apuesta?"on":""}" data-v="${v}">${v}</button>`).join("")}<button class="btn sec peq ${apuesta===fichas?"on":""}" data-v="${fichas}">All in (${fichas})</button></div><div class="sm-bot" style="margin-top:10px"><button class="btn" id="sm-rep">🎴 Deal</button></div>`;
    J.$$("#sm-ctl [data-v]").forEach(b=>b.onclick=()=>{ apuesta=+b.dataset.v; pinta(); });
    J.$("#sm-rep").onclick=reparte;
  } else if(fase==="juego"){
    ctl.innerHTML=`<div class="sm-bot"><button class="btn" id="sm-pide">➕ Hit me</button><button class="btn sec" id="sm-pl">✋ Stand</button></div>`;
    J.$("#sm-pide").onclick=pide; J.$("#sm-pl").onclick=planta;
  }
}
function roba(){ if(!mazo.length) mazo=J.baraja(J.mazoEsp()); return mazo.pop(); }
function reparte(){ if(mazo.length<12) mazo=J.baraja(J.mazoEsp()); yo=[roba()]; banca=[]; fase="juego"; msg="Another card or stand?"; pinta(); }
function pide(){ yo.push(roba()); const s=suma(yo);
  if(s>7.5){ fin(-1,`Bust with ${fmt(s)}`); return; }
  if(s===7.5){ msg="Seven and a half!"; planta(); return; }
  msg=`You have ${fmt(s)}`; pinta(); }
async function planta(){ fase="banca"; const s=suma(yo); msg="The bank is playing…"; pinta();
  while(true){ await J.espera(750); const b=suma(banca); if(banca.length&&(b>=s||b>7.5)) break; banca.push(roba()); pinta(); }
  const b=suma(banca);
  if(b>7.5) return fin(1,`The bank goes bust with ${fmt(b)}. You win!`);
  if(b>=s) return fin(-1,`The bank has ${fmt(b)} and you have ${fmt(s)}. The bank wins`);
  fin(1,`You win with ${fmt(s)} to ${fmt(b)}!`); }
function fin(r,t){ let gan=r>0?apuesta:-apuesta; const doble=r>0&&yo.length===2&&suma(yo)===7.5; if(doble){ gan*=2; t+=" Seven and a half with two cards: you’re paid double."; }
  fichas+=gan; if(fichas>racha){ racha=fichas; J.guarda("sm-record",racha); } J.guarda("sm-fichas",fichas);
  msg=t+(gan>0?` (+${gan})`:` (${gan})`); if(gan>0) J.confeti(doble?90:40); fase="apuesta"; pinta(); }
pinta();
})();
