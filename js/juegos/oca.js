/* Juego de la Oca */
(function(){
J.paginaJuego({titulo:"Game of the Goose", emoji:"🪿", ficha:"oca", ins:{
  titulo:"Game of the Goose",
  intro:"A spiral track of 63 squares. 2 to 4 players (people or computer). The first to land exactly on square 63, the goose’s garden, wins.",
  pasos:["Press <b>🎲 Roll</b> and your piece moves forward the number on the die.","<b>Goose 🪿</b> (5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59): “From goose to goose, I roll again because it’s my turn”: you jump to the next goose and roll again.","<b>Bridge 🌉</b> (6 and 12): “From bridge to bridge, I roll again because the current carries me”: you go to the other bridge and roll again.","<b>Inn 🏨</b> (19): you miss a turn.","<b>Well 🕳️</b> (31): you stay there until another player lands on it and rescues you.","<b>Maze 🌀</b> (42): you go back to square 30.","<b>Prison 🔒</b> (52): you miss two turns.","<b>Dice 🎲</b> (26 and 53): “From dice to dice”: you go to the other one and roll again.","<b>Skull 💀</b> (58): you go back to square 1.","To get into 63 you need the exact number. If you overshoot, you go back by the extra amount."],
  consejos:["It’s a game of pure luck: ideal for playing with the family!"]
}});
document.head.append(J.el("style",{},`.oc{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;max-width:640px;margin:0 auto;background:#5a3a1a;padding:8px;border-radius:16px}
.oc div{aspect-ratio:1;border-radius:8px;background:#fff6dc;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:clamp(7px,1.6vw,12px);font-weight:800;color:#5a3a1a}
.oc div.vacia{background:transparent}.oc div .ic{font-size:clamp(12px,3vw,24px);line-height:1}
.oc div.oca{background:#c7f0d8}.oc div.esp{background:#ffd6d6}.oc div.meta{background:#ffd60a}
.oc .fs{position:absolute;bottom:1px;display:flex;flex-wrap:wrap;justify-content:center}.oc .fs span{width:clamp(8px,1.7vw,14px);height:clamp(8px,1.7vw,14px);border-radius:50%;border:2px solid #fff;margin:-1px}
.oc-j{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:10px 0}.oc-j span{padding:6px 12px;border-radius:999px;background:var(--panel);font-weight:800;border:2px solid transparent}.oc-j span.act{border-color:var(--oro)}`));
const OCAS=[5,9,14,18,23,27,32,36,41,45,50,54,59];
const ESP={6:["🌉","Bridge"],12:["🌉","Bridge"],19:["🏨","Inn"],26:["🎲","Dice"],31:["🕳️","Well"],42:["🌀","Maze"],52:["🔒","Prison"],53:["🎲","Dice"],58:["💀","Skull"],63:["🏆","Garden"]};
const COL=["#e63946","#3a86ff","#2bb24c","#ffbe0b"];
let J4=[], turno=0, fin=false, ocupado=false, ON=null, ultD=0;
const raiz=J.$("#juego");
function config(){
  raiz.innerHTML=`<div class="panel" style="max-width:520px;margin:0 auto"><h2>🪿 New game</h2>${[0,1,2,3].map(i=>`<p><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${COL[i]}"></span> Player ${i+1}: <select id="t${i}"><option value="h" ${i===0?"selected":""}>Person</option><option value="c" ${i===1?"selected":""}>Computer</option><option value="x" ${i>1?"selected":""}>Not playing</option></select> <input type="text" id="n${i}" value="${["You","Crazy Goose","Duck","Swan"][i]}" maxlength="12" style="width:120px"></p>`).join("")}<button class="btn" id="c-ok">Start!</button></div>`;
  J.$("#c-ok").onclick=()=>{ J4=[0,1,2,3].map(i=>({t:J.$("#t"+i).value,n:J.$("#n"+i).value,col:COL[i],pos:0,pierde:0,pozo:false})).filter(j=>j.t!=="x"); if(J4.length<2) return J.aviso("You need at least 2 players"); turno=0; fin=false; montar(); pinta(); empieza(); };
}
// espiral 9x9 → 81 casillas; usamos las 63 primeras desde fuera hacia dentro
const ESPIRAL=(function(){ const r=[]; let t=0,b=8,l=0,d=8; while(t<=b&&l<=d){ for(let c=l;c<=d;c++) r.push([b,c]); b--; for(let f=b;f>=t;f--) r.push([f,d]); d--; if(t<=b){ for(let c=d;c>=l;c--) r.push([t,c]); t++; } if(l<=d){ for(let f=t;f<=b;f++) r.push([f,l]); l++; } } return r; })();
function montar(){ raiz.innerHTML=`<div class="oc-j" id="oc-j"></div><div class="estado" id="oc-e"></div><div class="centro-txt" style="margin-bottom:10px"><button class="btn" id="oc-t">🎲 Roll</button> <span id="oc-d" style="font-size:2rem;vertical-align:middle"></span></div><div class="oc" id="oc"></div><p class="centro-txt"><button class="btn sec peq" id="oc-n">🔄 New game</button></p>`;
  J.$("#oc-t").onclick=()=>{ if(J4[turno].t==="h"&&!ocupado) tira(); }; J.$("#oc-n").onclick=()=>{ if(ON){ const e=inicioOn(ON.jugadores); ON.enviar(e); carga(e); } else config(); }; }
function pinta(){
  const mapa={}; ESPIRAL.slice(0,63).forEach(([f,c],i)=>mapa[f+","+c]=i+1);
  let h=""; for(let f=0;f<9;f++) for(let c=0;c<9;c++){ const n=mapa[f+","+c]; if(!n){ h+=`<div class="vacia"></div>`; continue; }
    const e=ESP[n], oca=OCAS.includes(n); const aqui=J4.filter(j=>j.pos===n||(n===1&&j.pos===0));
    h+=`<div class="${oca?"oca":e?(n===63?"meta":"esp"):""}"><span>${n}</span>${oca?`<span class="ic">🪿</span>`:e?`<span class="ic">${e[0]}</span>`:""}<span class="fs">${aqui.map(j=>`<span style="background:${j.col}"></span>`).join("")}</span></div>`; }
  J.$("#oc").innerHTML=h;
  J.$("#oc-j").innerHTML=J4.map((j,i)=>`<span class="${i===turno?"act":""}" style="color:${j.col}">● ${j.n} (${j.pos||1})${j.pozo?" 🕳️":j.pierde?" ⏸️"+j.pierde:""}</span>`).join("");
  J.$("#oc-t").disabled=fin||J4[turno].t!=="h"||ocupado;
}
const est=t=>J.$("#oc-e").textContent=t;
async function empieza(){
  if(fin) return; const j=J4[turno];
  if(ON&&j.t!=="h"){ est(`${j.n}’s turn`); pinta(); return; }
  if(j.pozo){ est(`${j.n} is still in the well…`); await J.espera(900); return pasa(); }
  if(j.pierde){ j.pierde--; est(`${j.n} misses this turn.`); pinta(); await J.espera(900); return pasa(); }
  est(`${j.n}’s turn`); pinta();
  if(j.t==="c"){ await J.espera(700); tira(); }
}
async function tira(){
  ocupado=true; pinta(); const j=J4[turno];
  for(let k=0;k<6;k++){ J.$("#oc-d").textContent=["⚀","⚁","⚂","⚃","⚄","⚅"][J.azar(6)]; await J.espera(70); }
  const d=1+J.azar(6); ultD=d; J.$("#oc-d").textContent=["⚀","⚁","⚂","⚃","⚄","⚅"][d-1];
  let dest=(j.pos||1)+d; if(dest>63) dest=63-(dest-63);
  for(let p=(j.pos||1)+1; p<=Math.min(dest,63); p++){ j.pos=p; pinta(); await J.espera(110); }
  j.pos=dest; pinta();
  const otra=await casilla(j);
  ocupado=false;
  if(fin) return pinta();
  if(otra){ est(`${j.n} rolls again`); pinta(); envia(); if(j.t==="c"){ await J.espera(700); tira(); } return; }
  pasa();
}
async function casilla(j){
  const n=j.pos; await J.espera(300);
  if(n===63){ fin=true; pinta(); if(j.t==="h") J.confeti(150); envia(); finOn(j); if(ON) return false; J.modal(`<h2>🏆 ${j.n} reaches the goose’s garden!</h2><p>Has won the game.</p>`,[{txt:"New game"}]).then(config); return false; }
  if(OCAS.includes(n)){ const sig=OCAS.find(o=>o>n)||63; J.aviso("🪿 From goose to goose, I roll again because it’s my turn!"); j.pos=sig; pinta(); if(sig===63) return casilla(j); return true; }
  if(n===6||n===12){ J.aviso("🌉 From bridge to bridge, I roll again because the current carries me!"); j.pos=n===6?12:6; pinta(); return true; }
  if(n===26||n===53){ J.aviso("🎲 From dice to dice, I roll again because it’s my turn!"); j.pos=n===26?53:26; pinta(); return true; }
  if(n===19){ J.aviso("🏨 Inn: you miss a turn"); j.pierde=1; }
  if(n===52){ J.aviso("🔒 Prison: you miss two turns"); j.pierde=2; }
  if(n===31){ J4.forEach(o=>{ if(o!==j&&o.pozo){ o.pozo=false; J.aviso(`🕳️ ${j.n} rescues ${o.n} from the well`); } }); j.pozo=true; J.aviso("🕳️ Into the well!"); }
  if(n===42){ J.aviso("🌀 Maze: back to 30"); j.pos=30; }
  if(n===58){ J.aviso("💀 The skull! Back to the start"); j.pos=1; }
  pinta(); return false;
}
function pasa(){ if(fin) return; const mio=J4[turno].t==="h"; turno=(turno+1)%J4.length; pinta(); if(mio) envia(); empieza(); }
function envia(){ if(ON) ON.enviar({J4:J4.map(j=>({n:j.n,col:j.col,pos:j.pos,pierde:j.pierde,pozo:j.pozo})),turno,fin,d:ultD}); }
function finOn(j){ if(!ON) return; J.modal(`<h2>${j.t==="h"?"🏆 You won!":"🏁 Winner: "+j.n}</h2><p>${j.t==="h"?"You reached":j.n+" reached"} the goose’s garden.</p>`,[{txt:"OK"}]); }
function inicioOn(nombres){ return {J4:nombres.map((n,i)=>({n,col:COL[i],pos:0,pierde:0,pozo:false})),turno:0,fin:false,d:0}; }
function carga(e){ J4=e.J4.map((j,i)=>({...j,t:i===ON.yo?"h":"r"})); turno=e.turno; fin=e.fin; ocupado=false;
  if(!J.$("#oc")) montar(); if(e.d) J.$("#oc-d").textContent=["⚀","⚁","⚂","⚃","⚄","⚅"][e.d-1]; pinta();
  if(fin){ const g=J4.find(j=>j.pos===63); if(g) finOn(g); return; } empieza(); }
J.online&&J.online.activar({juego:"oca", titulo:"The Goose", min:2, max:4, inicio:inicioOn,
  alEmpezar(ctx,e){ ON=ctx; montar(); carga(e); J.aviso("Your piece is the colour "+["roja","azul","verde","amarilla"][ctx.yo],3000); },
  alCambiar(e){ carga(e); } });
config();
})();
