/* Descifra el código */
(function(){
J.paginaJuego({titulo:"Code Breaker", emoji:"🔐", ficha:"mastermind", ins:{
  titulo:"Code Breaker",
  intro:"The computer has hidden a <b>secret combination of 4 colours</b>. You have <b>10 tries</b> to guess it.",
  pasos:[
    "Tap the colours below to fill the 4 slots of your guess. If you make a mistake, tap a slot to empty it.",
    "Press <b>✔️ Check</b>.",
    "Next to your guess the clues appear: a <b>⚫ black</b> dot for each colour in its <b>exact place</b>.",
    "A <b>⚪ white</b> dot for each colour that is in the code but <b>in a different place</b>.",
    "The clues don’t say which colour each one refers to: you have to work it out!",
    "On normal and hard levels, colours <b>can repeat</b> in the code."
  ],
  consejos:["Start by trying two repeated colours, such as 🔴🔴🔵🔵, to rule things out quickly.","Keep a mental note of which colours you know aren’t there."]
}});
document.head.append(J.el("style",{},`
.de{max-width:440px;margin:0 auto}
.de-fila{display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:12px;background:var(--panel);margin-bottom:5px}
.de-fila.act{outline:2px solid var(--oro)}
.de-h{width:40px;height:40px;border-radius:50%;background:#0b1028;box-shadow:inset 0 3px 6px rgba(0,0,0,.6);cursor:pointer;flex:0 0 auto}
.de-p{display:grid;grid-template-columns:repeat(2,12px);gap:3px;margin-left:auto}
.de-p i{width:12px;height:12px;border-radius:50%;background:#2a3166}.de-p i.n{background:#111;box-shadow:0 0 0 1px #888}.de-p i.b{background:#fff}
.de-pal{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0}
.de-pal button{width:46px;height:46px;border-radius:50%;border:3px solid #fff;cursor:pointer}
.de-sec{display:flex;gap:10px;justify-content:center;margin:10px 0}
`));
const COLS=["#e63946","#1d4ed8","#16a34a","#f4c20d","#9b5de5","#f97316","#f1f1f1","#ec4899"];
let n=6, rep=true, secreto, intentos, actual, fin;
const raiz=J.$("#juego");
const bola=c=>`background:radial-gradient(circle at 35% 30%,#fff8,${COLS[c]} 45%)`;
function nueva(){ const nv=J.$("#de-n")?J.$("#de-n").value:"2"; n={1:6,2:6,3:8}[nv]; rep=nv!=="1";
  secreto=[]; while(secreto.length<4){ const c=J.azar(n); if(rep||!secreto.includes(c)) secreto.push(c); } intentos=[]; actual=[]; fin=null; pinta(nv); }
function pistas(g){ let ne=0,bl=0; const s=[],h=[]; for(let i=0;i<4;i++){ if(g[i]===secreto[i]) ne++; else { s.push(secreto[i]); h.push(g[i]); } }
  h.forEach(c=>{ const k=s.indexOf(c); if(k>=0){ bl++; s.splice(k,1); } }); return [ne,bl]; }
function pinta(nv){
  raiz.innerHTML=`<div class="de"><div class="centro-txt" style="margin-bottom:8px"><select id="de-n"><option value="1">Easy (6 colours, no repeats)</option><option value="2">Normal (6 colours)</option><option value="3">Hard (8 colours)</option></select> <button class="btn peq" id="de-nueva">🔄 New code</button></div>
  <div class="estado" id="de-est"></div>
  <div class="de-sec">${secreto.map(c=>`<div class="de-h" style="${fin?bola(c):""}">${fin?"":"<span style='display:grid;place-items:center;height:100%'>❓</span>"}</div>`).join("")}</div>
  <div id="de-filas"></div>
  <div class="de-pal" id="de-pal">${[...Array(n)].map((_,c)=>`<button data-c="${c}" style="${bola(c)}"></button>`).join("")}</div>
  <div class="centro-txt"><button class="btn" id="de-ok">✔️ Check</button></div></div>`;
  J.$("#de-n").value=nv||(n===8?"3":rep?"2":"1"); J.$("#de-n").onchange=()=>nueva(); J.$("#de-nueva").onclick=()=>nueva();
  for(let k=0;k<10;k++){ const g=intentos[k]; const fila=J.el("div",{class:"de-fila"+(!fin&&k===intentos.length?" act":"")});
    fila.innerHTML=`<b style="width:22px;color:var(--suave)">${k+1}</b>`;
    for(let i=0;i<4;i++){ const c=g?g.c[i]:(k===intentos.length?actual[i]:undefined); const h=J.el("div",{class:"de-h"}); if(c!==undefined) h.style.cssText=bola(c);
      if(!g&&k===intentos.length) h.onclick=()=>{ actual[i]=undefined; pinta(); }; fila.append(h); }
    const p=J.el("div",{class:"de-p"}); if(g){ for(let q=0;q<4;q++) p.append(J.el("i",{class:q<g.p[0]?"n":q<g.p[0]+g.p[1]?"b":""})); } fila.append(p);
    J.$("#de-filas").append(fila); }
  J.$$("#de-pal button").forEach(b=>b.onclick=()=>{ if(fin) return; const i=[0,1,2,3].find(i=>actual[i]===undefined); if(i!==undefined){ actual[i]=+b.dataset.c; pinta(); } });
  J.$("#de-ok").onclick=comprueba;
  J.$("#de-est").textContent=fin||`Try ${intentos.length+1} of 10`; }
function comprueba(){ if(fin) return; if([0,1,2,3].some(i=>actual[i]===undefined)){ J.aviso("Fill the 4 slots"); return; }
  if(!rep&&new Set(actual).size<4){ J.aviso("On easy, colours don’t repeat"); }
  const p=pistas(actual); intentos.push({c:actual.slice(),p}); actual=[];
  if(p[0]===4){ fin=`Cracked in ${intentos.length} ${intentos.length===1?"try":"tries"}! 🎉`; J.confeti(); }
  else if(intentos.length===10) fin="Out of tries. The secret code is shown above";
  pinta(); }
nueva();
})();
