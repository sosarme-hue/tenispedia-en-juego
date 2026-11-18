/* Buscaminas */
(function(){
J.paginaJuego({titulo:"Minesweeper", emoji:"💣", ficha:"buscaminas", ins:{
  titulo:"Minesweeper",
  intro:"There are mines hidden in the field. You have to uncover every square that doesn’t have a mine.",
  pasos:["Tap a square to uncover it. The first one never has a mine.","If a number appears, it tells you how many mines are in the 8 squares around it.","If you uncover a square with no mines around it, the neighbouring squares open by themselves.","If you think a square has a mine, mark it with a flag 🚩: turn on <b>🚩 Flag</b> mode and tap it (or right-click, or long-press on a phone).","If you uncover a mine, you lose.","You win when every square without a mine is uncovered."],
  consejos:["Start from the corners of the open areas.","If a 1 touches only one covered square, there’s a mine there."]
}});
document.head.append(J.el("style",{},`.bm{display:grid;gap:2px;background:#26315f;padding:6px;border-radius:12px;margin:0 auto;user-select:none;touch-action:manipulation}
.bm div{aspect-ratio:1;display:grid;place-items:center;border-radius:4px;background:linear-gradient(145deg,#5468c4,#3a4a9a);font-family:var(--titulos);font-weight:700;cursor:pointer;font-size:clamp(10px,2.4vw,20px)}
.bm div.ab{background:#e8ecff;cursor:default}.bm div.mina{background:#ff4d6d}
.n1{color:#1d4ed8}.n2{color:#15803d}.n3{color:#dc2626}.n4{color:#7c3aed}.n5{color:#b45309}.n6{color:#0891b2}.n7{color:#111}.n8{color:#666}`));
const NIV={facil:[9,9,10],medio:[12,12,24],dificil:[16,16,45]};
let F,C,M,t,primero,fin,bandera=false,t0,reloj,nivel="facil";
const raiz=J.$("#juego");
raiz.innerHTML=`<div class="marcador" style="justify-content:center"><div class="caja"><small>Mines</small><b id="bm-m"></b></div><div class="caja"><small>Time</small><b id="bm-t">0</b></div></div>
<div class="centro-txt" style="margin-bottom:10px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><select id="niv"><option value="facil">Easy (9×9, 10 mines)</option><option value="medio">Medium (12×12, 24 mines)</option><option value="dificil">Hard (16×16, 45 mines)</option></select><button class="btn sec peq" id="band">🚩 Flag: OFF</button><button class="btn peq" id="nueva">🔄 New</button></div>
<div class="estado" id="est"></div><div class="bm" id="bm"></div>`;
J.$("#niv").onchange=e=>{ nivel=e.target.value; nueva(); }; J.$("#nueva").onclick=nueva;
J.$("#band").onclick=()=>{ bandera=!bandera; J.$("#band").textContent="🚩 Flag: "+(bandera?"ON":"OFF"); J.$("#band").classList.toggle("sec",!bandera); };
function nueva(){ [F,C,M]=NIV[nivel]; t=Array.from({length:F*C},()=>({m:false,ab:false,b:false,n:0})); primero=true; fin=false; clearInterval(reloj); J.$("#bm-t").textContent=0; pinta(); }
const vec=i=>{ const f=Math.floor(i/C),c=i%C,r=[]; for(let a=-1;a<=1;a++) for(let b=-1;b<=1;b++){ if(!a&&!b) continue; const y=f+a,x=c+b; if(y>=0&&y<F&&x>=0&&x<C) r.push(y*C+x);} return r; };
function siembra(ev){ const prohib=new Set([ev,...vec(ev)]); let k=0; while(k<M){ const i=J.azar(F*C); if(!t[i].m&&!prohib.has(i)){ t[i].m=true; k++; } } t.forEach((x,i)=>x.n=vec(i).filter(j=>t[j].m).length); t0=Date.now(); reloj=setInterval(()=>J.$("#bm-t").textContent=Math.floor((Date.now()-t0)/1000),1000); }
function abre(i){ const x=t[i]; if(x.ab||x.b) return; x.ab=true; if(!x.n&&!x.m) vec(i).forEach(abre); }
function toca(i,marca){
  if(fin) return; const x=t[i];
  if(marca||bandera){ if(!x.ab){ x.b=!x.b; pinta(); } return; }
  if(x.b||x.ab) return;
  if(primero){ siembra(i); primero=false; }
  if(x.m){ fin=true; clearInterval(reloj); t.forEach(y=>{ if(y.m) y.ab=true; }); pinta(); J.$("#est").textContent="💥 Boom! You stepped on a mine."; return; }
  abre(i); pinta();
  if(t.every(y=>y.m||y.ab)){ fin=true; clearInterval(reloj); J.confeti(); J.$("#est").textContent=`🏆 Field cleared in ${Math.floor((Date.now()-t0)/1000)} seconds!`; }
}
function pinta(){
  const bm=J.$("#bm"); bm.style.gridTemplateColumns=`repeat(${C},1fr)`; bm.style.maxWidth=Math.min(C*44,900)+"px";
  bm.innerHTML=t.map((x,i)=>`<div data-i="${i}" class="${x.ab?"ab":""} ${x.ab&&x.m?"mina":""} ${x.ab&&x.n?"n"+x.n:""}">${x.ab?(x.m?"💣":x.n||""):x.b?"🚩":""}</div>`).join("");
  J.$$("#bm div").forEach(d=>{ const i=+d.dataset.i; d.onclick=()=>toca(i,false); d.oncontextmenu=e=>{ e.preventDefault(); toca(i,true); };
    let lp; d.ontouchstart=()=>{ lp=setTimeout(()=>{ lp="hecho"; toca(i,true); },450); }; d.ontouchend=e=>{ if(lp==="hecho"){ e.preventDefault(); } clearTimeout(lp); }; });
  J.$("#bm-m").textContent=M-t.filter(x=>x.b).length;
  if(!fin) J.$("#est").textContent=primero?"Tap any square to start":"";
}
nueva();
})();
