/* Ahorcado */
(function(){
J.paginaJuego({titulo:"Hangman", emoji:"🪢", ficha:"ahorcado", ins:{
  titulo:"Hangman",
  intro:"Guess the secret word before the drawing is complete. You get a clue and 7 wrong guesses.",
  pasos:["Choose a topic (or all of them) and read the clue.","Tap a letter on the on-screen keyboard (or type it on your keyboard).","If the letter is in the word, it appears in every space where it goes.","If it isn’t, another part of the figure is drawn.","You win if you complete the word. You lose if the drawing is completed (7 wrong guesses)."],
  consejos:["Start with the vowels and the most common consonants: S, T, R, N.","Words have no spaces or hyphens."]
}});
document.head.append(J.el("style",{},`.ah{display:grid;grid-template-columns:260px 1fr;gap:20px;align-items:center}
@media(max-width:700px){.ah{grid-template-columns:1fr}}
.ah svg{width:100%;max-width:260px;margin:0 auto;display:block}
.ah svg .p{stroke:#fff;stroke-width:6;stroke-linecap:round;fill:none;opacity:0;transition:opacity .3s}.ah svg .p.ver{opacity:1}
.hue{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:18px 0}
.hue span{width:clamp(28px,7vw,44px);border-bottom:4px solid var(--oro);text-align:center;font-family:var(--titulos);font-size:clamp(1.4rem,5vw,2.2rem);min-height:1.4em}
.tec{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.tec button{width:clamp(32px,8vw,44px);height:clamp(36px,9vw,48px);border-radius:10px;border:0;background:var(--panel2);color:var(--texto);font-family:var(--titulos);font-size:1.1rem;cursor:pointer}
.tec button.si{background:#16a65a}.tec button.no{background:#c9184a;opacity:.6}`));
let pal, pista, acert, fall, fin, tema="todos", racha=J.lee("ah-racha",0);
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="centro-txt" style="margin-bottom:10px"><select id="ah-t"><option value="todos">🎲 All topics</option>${Object.entries(TEMAS_PALABRAS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select> <button class="btn peq" id="ah-n">🔄 Another word</button></div>
<div class="ah"><svg viewBox="0 0 200 240"><path d="M20 230 H140 M50 230 V20 H130 V45" stroke="#8d5524" stroke-width="8" fill="none" stroke-linecap="round"/>
<circle class="p" cx="130" cy="65" r="20"/><path class="p" d="M130 85 V150"/><path class="p" d="M130 100 L100 125"/><path class="p" d="M130 100 L160 125"/><path class="p" d="M130 150 L105 190"/><path class="p" d="M130 150 L155 190"/><path class="p" d="M120 60 l4 4 m0 -4 l-4 4 M136 60 l4 4 m0 -4 l-4 4" style="stroke-width:3"/></svg>
<div><div class="panel" id="ah-pista"></div><div class="hue" id="ah-h"></div><div class="estado" id="ah-e"></div><div class="tec" id="ah-tec"></div><p class="centro-txt" style="color:var(--suave)">Winning streak: <b id="ah-r"></b></p></div></div>`;
J.$("#ah-t").onchange=e=>{ tema=e.target.value; nueva(); }; J.$("#ah-n").onclick=nueva;
document.addEventListener("keydown",e=>{ const l=e.key.toUpperCase(); if(/^[A-Z]$/.test(l)) prueba(l); });
function nueva(){ const p=J.elige(PALABRAS.filter(x=>tema==="todos"||x[2]===tema)); pal=p[0]; pista=p[1]; acert=new Set(); fall=new Set(); fin=false; pinta(); }
function prueba(l){ if(fin||acert.has(l)||fall.has(l)) return; (pal.includes(l)?acert:fall).add(l);
  if([...pal].every(c=>acert.has(c))){ fin="You got it! 🎉"; racha++; J.confeti(70); }
  else if(fall.size>=7){ fin=`Hanged! The word was ${pal}.`; racha=0; }
  J.guarda("ah-racha",racha); pinta(); }
function pinta(){
  J.$("#ah-pista").innerHTML=`💡 <b>Clue:</b> ${pista}`;
  J.$("#ah-h").innerHTML=[...pal].map(c=>`<span>${acert.has(c)||(fin&&fall.size>=7)?c:""}</span>`).join("");
  J.$$(".ah svg .p").forEach((p,i)=>p.classList.toggle("ver",i<fall.size));
  J.$("#ah-e").textContent=fin||`Wrong guesses: ${fall.size} of 7`;
  J.$("#ah-tec").innerHTML="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l=>`<button class="${acert.has(l)?"si":fall.has(l)?"no":""}" ${acert.has(l)||fall.has(l)||fin?"disabled":""}>${l}</button>`).join("");
  J.$$("#ah-tec button").forEach(b=>b.onclick=()=>prueba(b.textContent));
  J.$("#ah-r").textContent=racha;
}
nueva();
})();
