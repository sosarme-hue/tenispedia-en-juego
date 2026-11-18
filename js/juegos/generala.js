/* Generala */
(function(){
J.paginaJuego({titulo:"Generala", emoji:"🎯", ficha:"generala", ins:{
  titulo:"Generala",
  intro:"A game with <b>five dice</b>, you against the computer. The game has 11 rounds: in each one you score a combination on your sheet. The highest total wins.",
  pasos:[
    "Press <b>🎲 Roll</b>. You have up to <b>3 rolls</b> per turn.",
    "Between rolls, tap the dice you want to <b>keep</b> (they turn gold). Only the others are rolled again.",
    "Whenever you like, tap a free box in your column to <b>score</b> the combination. The sheet shows how many points you would get in each one.",
    "<b>1 to 6</b>: add up the dice showing that number (for example, three fives in “5” make 15).",
    "<b>Straight</b> (1-2-3-4-5 or 2-3-4-5-6): 20 points. <b>Full house</b> (three of a kind and a pair): 30. <b>Four of a kind</b> (four the same): 40. <b>Generala</b> (five the same): 50. <b>Double generala</b> (another one): 100.",
    "If a combination comes up on the <b>first roll</b> it’s called “served” and is worth 5 more points. A served generala <b>wins the game instantly</b>.",
    "If nothing suits you, you can score a 0 in the box of your choice (“scratch”)."
  ],
  consejos:["Try to fill the high numbers (4, 5 and 6) early.","Save generala and double generala for the end if your score is good: they’re worth a lot."]
}});
document.head.append(J.el("style",{},`
.ge{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;max-width:900px;margin:0 auto}
@media(max-width:700px){.ge{grid-template-columns:1fr}}
.ge-dados{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;--dw:clamp(48px,11vw,64px);margin:14px 0}
.ge-t{width:100%;border-collapse:collapse;background:var(--panel);border-radius:14px;overflow:hidden}
.ge-t td,.ge-t th{padding:7px 10px;border-bottom:1px solid var(--borde);text-align:center}
.ge-t td:first-child,.ge-t th:first-child{text-align:left}
.ge-t td.libre{cursor:pointer;color:var(--oro)}.ge-t td.libre:hover{background:var(--panel2)}
.ge-t td.libre.cero{color:var(--suave)}
.ge-t tr.tot td{font-family:var(--titulos);font-size:1.15rem}
`));
const CAT=[["1","Ones"],["2","Twos"],["3","Threes"],["4","Fours"],["5","Fives"],["6","Sixes"],["E","Straight"],["F","Full house"],["P","Four of a kind"],["G","Generala"],["D","Double generala"]];
let ON=null, me=0, NJ=2, ganador=-1;
const escH=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nom=j=>ON?(j===me?"🙂 You":"🎲 "+escH(ON.jugadores[j])):(j===0?"🙂 You":"🤖 Computer");
let dados, guard, tiradas, hoja, turno, fin;
const raiz=J.$("#juego");
function puntos(cat,d,servida){ const c=[0,0,0,0,0,0,0]; d.forEach(x=>c[x]++); const v=Object.values(c).slice(1).sort((a,b)=>b-a);
  if(/^[1-6]$/.test(cat)) return c[+cat]*(+cat);
  const s=[...d].sort().join("");
  if(cat==="E") return (s==="12345"||s==="23456")?20+(servida?5:0):0;
  if(cat==="F") return v[0]===3&&v[1]===2?30+(servida?5:0):0;
  if(cat==="P") return v[0]>=4?40+(servida?5:0):0;
  if(cat==="G") return v[0]===5?50:0;
  if(cat==="D") return v[0]===5?100:0; return 0; }
function nueva(){ hoja=[{},{}]; turno=0; fin=null; empieza(); }
function empieza(){ dados=[1,2,3,4,5]; guard=[false,false,false,false,false]; tiradas=0; pinta(); if(ON) return envia(); if(turno===1) setTimeout(cpu,700); }
function envia(){ if(ON) ON.enviar({dados,guard,tiradas,hoja,turno,ganador}); }
const total=h=>Object.values(h).reduce((a,b)=>a+b,0);
function pinta(){
  const libre=c=>hoja[me][c]===undefined, ver=turno===me&&tiradas>0&&!fin;
  raiz.innerHTML=`<div class="ge"><div class="panel"><div class="estado" id="ge-est"></div><div class="ge-dados" id="ge-d"></div>
    <div class="centro-txt"><button class="btn" id="ge-tira" ${turno!==me||tiradas>=3||fin?"disabled":""}>🎲 Roll (${3-tiradas} left)</button></div>
    <p class="centro-txt" style="color:var(--suave);font-size:.9rem">Tap a die to keep it. Tap a box in your column to score.</p>
    ${ON?"":`<div class="centro-txt"><button class="btn sec peq" id="ge-nueva">🔄 New game</button></div>`}</div>
  <table class="ge-t"><tr><th>Combination</th>${hoja.map((_,j)=>`<th style="${j===turno&&!fin?"color:var(--oro)":""}">${nom(j)}</th>`).join("")}</tr>
  ${CAT.map(([c,n])=>{ const p=ver&&libre(c)?puntos(c,dados,tiradas===1):null; return `<tr><td>${n}</td>${hoja.map((h,j)=> j===me ? `<td data-c="${c}" class="${ver&&libre(c)?"libre"+(p===0?" cero":""):""}">${h[c]!==undefined?h[c]:(p!==null?(p||"✖ 0"):"")}</td>` : `<td>${h[c]!==undefined?h[c]:""}</td>`).join("")}</tr>`; }).join("")}
  <tr class="tot"><td>Total</td>${hoja.map(h=>`<td>${total(h)}</td>`).join("")}</tr></table></div>`;
  dados.forEach((v,i)=>{ const d=J.dado(tiradas?v:0); if(guard[i]) d.classList.add("guardado"); if(tiradas&&!guard[i]) d.classList.add("rueda"); d.onclick=()=>{ if(turno===me&&tiradas>0&&tiradas<3&&!fin){ guard[i]=!guard[i]; pinta(); envia(); } }; J.$("#ge-d").append(d); });
  if(tiradas) J.$$("#ge-d .dado3d").forEach(d=>d.classList.remove("rueda"));
  J.$("#ge-tira").onclick=tira; if(!ON) J.$("#ge-nueva").onclick=nueva;
  J.$$(".ge-t td.libre").forEach(td=>td.onclick=()=>apunta(me,td.dataset.c));
  J.$("#ge-est").textContent=fin||(turno===me?(tiradas?"Keep dice, roll again or score":"Your turn: press Roll"):ON?`${escH(ON.jugadores[turno])} is playing…`:"The computer is playing…"); }
function tira(){ if(turno!==me||tiradas>=3||fin) return; dados=dados.map((v,i)=>guard[i]?v:1+J.azar(6)); tiradas++; pinta(); envia(); J.$$("#ge-d .dado3d").forEach((d,i)=>{ if(!guard[i]) d.classList.add("rueda"); });
  if(tiradas===1&&puntos("G",dados)) { J.aviso("Served generala!! 🎉",3000); } }
function apunta(j,c){ if(fin) return; const servida=tiradas===1;
  if(ON){ if(c==="G"&&servida&&puntos("G",dados)){ ganador=j; return finOn(); }
    if(c==="D"&&hoja[j].G===undefined&&puntos("D",dados)) hoja[j][c]=0; else hoja[j][c]=puntos(c,dados,servida);
    if(hoja.every(h=>Object.keys(h).length===11)){ const t=hoja.map(total), mx=Math.max(...t); ganador=t.filter(x=>x===mx).length>1?99:t.indexOf(mx); return finOn(); }
    turno=(turno+1)%NJ; return empieza(); }
  if(c==="G"&&servida&&puntos("G",dados)){ fin= j===0?"Served generala! You win the game 🎉":"The computer rolls a served generala and wins"; if(j===0) J.confeti(); pinta(); return; }
  if(c==="D"&&hoja[j].G===undefined&&puntos("D",dados)) hoja[j][c]=0; else hoja[j][c]=puntos(c,dados,servida);
  if(Object.keys(hoja[0]).length===11&&Object.keys(hoja[1]).length===11){ const a=total(hoja[0]),b=total(hoja[1]); fin=a>b?`You won ${a} to ${b}! 🎉`:b>a?`The computer wins ${b} to ${a}`:"It’s a draw!"; if(a>b) J.confeti(); pinta(); return; }
  turno=1-turno; empieza(); }
async function cpu(){ if(fin) return; const h=hoja[1]; const libres=CAT.map(x=>x[0]).filter(c=>h[c]===undefined);
  for(let t=0;t<3;t++){ dados=dados.map((v,i)=>guard[i]?v:1+J.azar(6)); tiradas++; pinta(); await J.espera(800);
    const mejor=libres.map(c=>[c,puntos(c,dados,tiradas===1)]).sort((a,b)=>b[1]-a[1])[0];
    if((tiradas===1&&puntos("G",dados)&&libres.includes("G"))||mejor[1]>=30&&!/^[1-6]$/.test(mejor[0])) break;
    if(t===2) break;
    // guarda los dados del número más repetido (o la escalera si casi está)
    const c=[0,0,0,0,0,0,0]; dados.forEach(x=>c[x]++); let obj=1; for(let n=1;n<=6;n++) if(c[n]*10+n>c[obj]*10+obj) obj=n;
    const unicos=new Set(dados); const esc=libres.includes("E")&&unicos.size>=4&&!(unicos.has(1)&&unicos.has(6));
    if(esc){ const vistos=new Set(); guard=dados.map(v=>{ if(vistos.has(v)) return false; vistos.add(v); return true; }); }
    else guard=dados.map(v=>v===obj);
    pinta(); await J.espera(600); }
  const op=libres.map(c=>{ let p=puntos(c,dados,tiradas===1); let s=p; if(/^[1-6]$/.test(c)) s=p-(+c)*2.5; if(p===0) s=-({G:30,D:20,P:15,F:10,E:10}[c]||+c*2); return [c,s]; }).sort((a,b)=>b[1]-a[1]);
  apunta(1,op[0][0]); }
function finOn(){ envia(); carga({dados,guard,tiradas,hoja,turno,ganador}); }
function carga(e){ dados=e.dados; guard=e.guard; tiradas=e.tiradas; hoja=e.hoja.map(h=>h||{}); turno=e.turno; ganador=e.ganador; fin=null;
  if(ganador>=0){ const t=hoja.map(total);
    fin= ganador===99?"It’s a draw!": (Object.keys(hoja[ganador]).length<11?(ganador===me?"Served generala! You win the game 🎉":`${escH(ON.jugadores[ganador])} rolls a served generala and wins`) : ganador===me?`You won with ${t[me]} points! 🎉`:`${escH(ON.jugadores[ganador])} wins with ${t[ganador]} points`);
    if(ganador===me) J.confeti(); }
  pinta(); }
J.online&&J.online.activar({juego:"generala", titulo:"Generala", min:2, max:6,
  inicio(nombres){ return {dados:[1,2,3,4,5],guard:[false,false,false,false,false],tiradas:0,hoja:nombres.map(()=>({})),turno:0,ganador:-1}; },
  alEmpezar(ctx,e){ ON=ctx; me=ctx.yo; NJ=ctx.jugadores.length; carga(e); },
  alCambiar(e){ carga(e); } });
nueva();
})();
