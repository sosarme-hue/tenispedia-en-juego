/* Blackjack con fichas de mentira */
(function(){
J.paginaJuego({titulo:"Blackjack", emoji:"🂮", ficha:"blackjack", ins:{
  titulo:"Blackjack (twenty-one)",
  intro:"You play against the dealer with <b>pretend chips</b> (you start with 1,000). The goal is to beat the dealer’s total without going over 21.",
  pasos:[
    "Choose your bet with the chips and press <b>Deal</b>. You get two cards face up; the dealer gets one face up and one face down.",
    "Cards from 2 to 10 are worth their number. J, Q and K are worth 10. The <b>Ace is worth 11 or 1</b>, whichever suits you best.",
    "<b>Hit</b>: you get another card. You can hit as many times as you like, but if you go over 21 you lose.",
    "<b>Stand</b>: you keep what you have and the dealer plays.",
    "<b>Double</b>: with your first two cards, you double your bet and get just one more card.",
    "The dealer must hit until reaching 17 or more.",
    "If you have more than the dealer (or the dealer busts), you win the same amount you bet. If it’s a tie, you get your bet back.",
    "<b>Blackjack</b> (Ace + a 10-value card with your first two cards) pays 3 to 2."
  ],
  consejos:["With 17 or more, it’s usually best to stand.","With 11, doubling is usually a good idea.","It’s only a game: no real money."]
}});
const css=`.bj-mano{display:flex;gap:8px;justify-content:center;min-height:120px;flex-wrap:wrap;--nw:clamp(56px,13vw,86px)}
.bj-mano .naipe{animation:reparte .3s ease-out}
@keyframes reparte{from{transform:translateY(-40px) rotate(-10deg);opacity:0}}
.bj-tit{color:#fff;text-align:center;font-family:var(--titulos);font-size:1.2rem;margin:8px 0}
.bj-tit b{background:rgba(0,0,0,.3);padding:2px 12px;border-radius:999px;margin-left:6px}`;
document.head.append(J.el("style",{},css));
let saldo=J.lee("bj-saldo",1000), apuesta=0, mazo=[], jug=[], banca=[], jugando=false;
const raiz=J.$("#juego");
const valor=m=>{ let s=0,a=0; m.forEach(c=>{ if(c.v===1){a++;s+=11;} else s+=Math.min(10,c.v); }); while(s>21&&a){s-=10;a--;} return s; };
function carta(){ if(mazo.length<15) mazo=J.baraja([...J.mazo(),...J.mazo(),...J.mazo(),...J.mazo()]); return mazo.pop(); }
function montar(){
  raiz.innerHTML=`<div class="marcador"><div class="caja"><small>Your chips</small><b id="bj-s"></b></div><div class="caja"><small>Bet</small><b id="bj-a">0</b></div></div>
  <div class="mesa"><div class="bj-tit">🏦 Dealer <b id="bj-vb">0</b></div><div class="bj-mano" id="bj-b"></div>
  <div class="estado" id="bj-e" style="color:#fff">Choose your bet</div>
  <div class="bj-mano" id="bj-j"></div><div class="bj-tit">🙋 You <b id="bj-vj">0</b></div></div>
  <div class="fichas-sel" style="display:flex;gap:10px;justify-content:center;margin:14px 0;flex-wrap:wrap" id="bj-f">${[10,25,50,100].map(v=>`<button class="btn sec" data-v="${v}">+${v}</button>`).join("")}<button class="btn sec" id="bj-borra">🧹 Clear</button></div>
  <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn" id="bj-rep">🃏 Deal</button><button class="btn verde" id="bj-pide">➕ Hit</button><button class="btn rojo" id="bj-pla">✋ Stand</button><button class="btn sec" id="bj-dob">✖️2 Double</button><button class="btn sec" id="bj-rec">💰 Reload</button></div>`;
  J.$$("#bj-f [data-v]").forEach(b=>b.onclick=()=>{ if(jugando) return; const v=+b.dataset.v; if(saldo<v) return J.aviso("You don’t have enough chips"); saldo-=v; apuesta+=v; pinta(); });
  J.$("#bj-borra").onclick=()=>{ if(jugando) return; saldo+=apuesta; apuesta=0; pinta(); };
  J.$("#bj-rec").onclick=()=>{ if(jugando) return; saldo=1000; apuesta=0; pinta(); };
  J.$("#bj-rep").onclick=reparte; J.$("#bj-pide").onclick=pide; J.$("#bj-pla").onclick=planta; J.$("#bj-dob").onclick=dobla;
  pinta();
}
function pinta(oculta=jugando){
  J.guarda("bj-saldo",saldo);
  J.$("#bj-s").textContent=saldo; J.$("#bj-a").textContent=apuesta;
  J.$("#bj-j").innerHTML=""; jug.forEach(c=>J.$("#bj-j").append(J.naipe(c)));
  J.$("#bj-b").innerHTML=""; banca.forEach((c,k)=>J.$("#bj-b").append(J.naipe(c,null,oculta&&k===1)));
  J.$("#bj-vj").textContent=jug.length?valor(jug):0;
  J.$("#bj-vb").textContent=banca.length?(oculta?valor([banca[0]]):valor(banca)):0;
  J.$("#bj-rep").disabled=jugando; J.$("#bj-pide").disabled=!jugando; J.$("#bj-pla").disabled=!jugando; J.$("#bj-dob").disabled=!jugando||jug.length!==2||saldo<apuesta;
}
function est(t){ J.$("#bj-e").textContent=t; }
function reparte(){
  if(!apuesta) return J.aviso("Choose a bet first");
  jug=[carta(),carta()]; banca=[carta(),carta()]; jugando=true; pinta(); est("Hit or stand?");
  if(valor(jug)===21) planta();
}
function pide(){ jug.push(carta()); pinta(); if(valor(jug)>21) termina(); else if(valor(jug)===21) planta(); }
function dobla(){ saldo-=apuesta; apuesta*=2; jug.push(carta()); pinta(); planta(); }
async function planta(){
  jugando=false; pinta(false);
  if(valor(jug)<=21 && !(jug.length===2&&valor(jug)===21)){
    while(valor(banca)<17){ await J.espera(600); banca.push(carta()); pinta(false); }
  }
  termina();
}
function termina(){
  jugando=false; pinta(false);
  const j=valor(jug), b=valor(banca), bj=jug.length===2&&j===21, bb=banca.length===2&&b===21;
  let r, gan=0;
  if(j>21){ r="You went over 21. The dealer wins."; }
  else if(bj&&!bb){ gan=apuesta*2.5; r="BLACKJACK! You’re paid 3 to 2."; J.confeti(); }
  else if(bb&&!bj){ r="The dealer has blackjack."; }
  else if(b>21){ gan=apuesta*2; r="The dealer busts. You win!"; }
  else if(j>b){ gan=apuesta*2; r=`You win! ${j} to ${b}.`; }
  else if(j===b){ gan=apuesta; r=`Push at ${j}. You get your bet back.`; }
  else r=`The dealer wins: ${b} to ${j}.`;
  saldo+=Math.floor(gan); const ap=apuesta; apuesta=0; pinta(false);
  est(r+" Choose another bet.");
  if(gan>ap) J.aviso(`🎉 +${Math.floor(gan-ap)} chips`);
}
montar();
})();
