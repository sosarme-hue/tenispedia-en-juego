/* Brisca */
(function(){
J.paginaJuego({titulo:"Brisca", emoji:"🎴", ficha:"brisca", ins:{
  titulo:"Brisca",
  intro:"A trick-taking game with the <b>40-card Spanish deck</b>, you against the computer. The winner is whoever scores <b>more than 60 points</b> out of the 120 in the deck.",
  pasos:[
    "Each player has <b>3 cards</b>. The card left face up under the stock sets the <b>trump</b>: the suit that beats all the others.",
    "The leader plays a card. The other plays whichever they like: you <b>don’t have to</b> follow suit or win.",
    "The trick is won by the highest card of the suit led, <b>unless a trump is played</b>: then the highest trump wins.",
    "Card order, from highest to lowest: <b>Ace, 3, King, Knight, Jack, 7, 6, 5, 4, 2</b>.",
    "Puntos: As 11, Tres 10, Rey 4, Caballo 3, Sota 2. Las demás no valen puntos.",
    "Whoever wins the trick takes the cards, draws first from the stock and leads the next one.",
    "When the cards run out, the points in the tricks are counted. With 61 or more, you win."
  ],
  consejos:["Don’t waste trumps on tricks with no points.","If your rival leads an Ace or a Three of a suit that isn’t trumps, take it with a small trump.","Count the trumps that have been played."]
}});
document.head.append(J.el("style",{},`
.br-mesa{display:flex;flex-direction:column;gap:14px;color:#fff;--nw:clamp(62px,12vw,88px)}
.br-fila{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;align-items:center}
.br-baza{min-height:calc(var(--nw)*1.45);display:flex;gap:18px;justify-content:center;align-items:center}
.br-mano .naipe{cursor:pointer;transition:transform .15s}.br-mano .naipe:hover{transform:translateY(-10px)}
.br-triunfo{position:relative;width:calc(var(--nw)*1.9);height:calc(var(--nw)*1.45)}
.br-triunfo .naipe{position:absolute}.br-triunfo .naipe:first-child{transform:rotate(90deg);left:calc(var(--nw)*.6);top:0}
.br-triunfo .naipe:last-child{left:0;top:0}
`));
const RANGO={1:10,3:9,12:8,11:7,10:6,7:5,6:4,5:3,4:2,2:1}, PTS={1:11,3:10,12:4,11:3,10:2};
let ON=null, me=0;
const escH=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nm=j=>j===me?"You":ON?escH(ON.jugadores[j]):"Computer";
let mazo, triunfo, manos, baza, sale, turno, pts, fin, bloq;
const raiz=J.$("#juego");
const pt=c=>PTS[c.v]||0;
function gana(a,b){ // a la jugó quien salió
  if(b.p===a.p) return RANGO[b.v]>RANGO[a.v]?1:0;
  if(b.p===triunfo.p) return 1; return 0; }
function nueva(){ mazo=J.baraja(J.mazoEsp()); manos=[mazo.splice(0,3),mazo.splice(0,3)]; triunfo=mazo[0]; // la de abajo del mazo
  baza=[]; sale=J.azar(2); turno=sale; pts=[0,0]; fin=null; bloq=false; pinta(); if(turno===1) setTimeout(cpu,800); }
function pinta(){
  raiz.innerHTML=`<div class="marcador" style="justify-content:center"><div class="caja"><small>🙂 Your points</small><b>${pts[me]}</b></div><div class="caja"><small>${ON?"🎴 "+nm(1-me):"🤖 Computer"}</small><b>${pts[1-me]}</b></div><div class="caja"><small>Trump</small><b>${J.SIMB_ESP[triunfo.p]} ${J.PALO_EN[triunfo.p]}</b></div></div>
  <div class="mesa br-mesa"><div class="br-fila" id="br-cpu"></div>
  <div class="br-fila"><div class="br-triunfo" id="br-tri"></div><div class="br-baza" id="br-baza"></div><div style="text-align:center;font-size:.85rem">Stock<br><b>${mazo.length}</b></div></div>
  <div class="estado" id="br-est" style="margin:0"></div><div class="br-fila br-mano" id="br-mano"></div>
  ${ON?"":`<div class="centro-txt"><button class="btn sec peq" id="br-nueva">🔄 New game</button></div>`}</div>`;
  manos[1-me].forEach(()=>J.$("#br-cpu").append(J.naipeEsp(null,null,true)));
  if(mazo.length){ J.$("#br-tri").append(J.naipeEsp(triunfo)); if(mazo.length>1) J.$("#br-tri").append(J.naipeEsp(null,null,true)); }
  baza.forEach(b=>{ const w=J.el("div",{style:"text-align:center;font-size:.8rem"}); w.append(J.naipeEsp(b.c)); w.append(document.createTextNode(nm(b.j))); J.$("#br-baza").append(w); });
  manos[me].forEach((c,i)=>{ const n=J.naipeEsp(c); n.onclick=()=>juega(i); J.$("#br-mano").append(n); });
  if(!ON) J.$("#br-nueva").onclick=nueva;
  J.$("#br-est").textContent=fin||(turno===me&&!bloq?(baza.length?"Your turn to reply: choose a card":"Your turn to lead: choose a card"):bloq?"":ON?`${nm(turno)} is playing…`:"The computer is playing…"); }
function juega(i){ if(fin||bloq||turno!==me) return; baza.push({j:me,c:manos[me].splice(i,1)[0]}); siguiente(); }
function siguiente(){ if(baza.length===2){ envia(); return resuelve(); }
  if(ON){ turno=1-turno; envia(); return pinta(); } turno=1-turno; pinta(); if(turno===1) setTimeout(cpu,700); }
function cpu(){ if(fin) return; const m=manos[1]; let i;
  if(!baza.length){ // sale: la carta más pobre que no sea triunfo
    const orden=m.map((c,k)=>({k,s:pt(c)*3+(c.p===triunfo.p?25:0)+RANGO[c.v]*.1})).sort((a,b)=>a.s-b.s); i=orden[0].k; }
  else { const a=baza[0].c; const ganan=m.map((c,k)=>({c,k})).filter(x=>gana(a,x.c));
    const valor=pt(a);
    if(ganan.length&&(valor>=2||ganan.some(x=>x.c.p!==triunfo.p&&pt(x.c)>0)||mazo.length<=2)){
      ganan.sort((x,y)=>(x.c.p===triunfo.p)-(y.c.p===triunfo.p)||(valor>=10?0:pt(y.c)-pt(x.c))||RANGO[x.c.v]-RANGO[y.c.v]); i=ganan[0].k; }
    else { const orden=m.map((c,k)=>({k,s:pt(c)*3+(c.p===triunfo.p?25:0)+RANGO[c.v]*.1})).sort((a,b)=>a.s-b.s); i=orden[0].k; } }
  baza.push({j:1,c:m.splice(i,1)[0]}); siguiente(); }
async function resuelve(){ bloq=true; pinta(); await J.espera(1100);
  const g = gana(baza[0].c,baza[1].c) ? baza[1].j : baza[0].j;
  pts[g]+=pt(baza[0].c)+pt(baza[1].c); J.aviso(g===me?"You win the trick":`${nm(g)} wins the trick`);
  baza=[]; bloq=false;
  if(mazo.length){ manos[g].push(mazo.pop()); manos[1-g].push(mazo.pop()); }
  if(ON){ turno=g; envia(); return carga(paq()); }
  if(!manos[0].length&&!manos[1].length){ fin = pts[0]>60?`You won with ${pts[0]} points! 🎉`: pts[0]===60?"It’s a draw at 60 points":`The computer wins with ${pts[1]} points`; if(pts[0]>60) J.confeti(); pinta(); return; }
  turno=g; pinta(); if(g===1) setTimeout(cpu,800); }
const paq=()=>({mazo,triunfo,manos,baza,turno,pts});
function envia(){ if(ON) ON.enviar(paq()); }
function carga(e){ mazo=e.mazo||[]; triunfo=e.triunfo; manos=e.manos.map(m=>m||[]); baza=e.baza||[]; turno=e.turno; pts=e.pts; bloq=baza.length===2; fin=null;
  if(!manos[0].length&&!manos[1].length&&!baza.length){ const a=pts[me], b=pts[1-me]; fin= a>60?`You won with ${a} points! 🎉`: a===60?"It’s a draw at 60 points":`${nm(1-me)} wins with ${b} points`; if(a>60) J.confeti(); }
  pinta(); }
J.online&&J.online.activar({juego:"brisca", titulo:"Brisca", min:2, max:2,
  inicio(){ const m=J.baraja(J.mazoEsp()); const ma=[m.splice(0,3),m.splice(0,3)]; return {mazo:m,triunfo:m[0],manos:ma,baza:[],turno:J.azar(2),pts:[0,0]}; },
  alEmpezar(ctx,e){ ON=ctx; me=ctx.yo; carga(e); J.aviso(e.turno===me?"You lead":"Leading: "+ctx.jugadores[e.turno],2500); },
  alCambiar(e){ carga(e); } });
nueva();
})();
