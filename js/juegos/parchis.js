/* Parchís contra el ordenador */
(function(){
J.paginaJuego({titulo:"Parcheesi (Parchís)", emoji:"🎲", ficha:"parchis", ins:{
  titulo:"Parcheesi (Parchís)",
  intro:"You play the <b>yellow</b> pieces against the computer (1 to 3 rivals). The first to get all 4 pieces to the finish, in the centre of the board, wins.",
  pasos:[
    "Press <b>🎲 Roll</b>. To bring a piece out of home you need a <b>5</b>. If you roll a 5 and have pieces at home, one comes out automatically.",
    "Tap the piece you want to move (the ones that can move flash). It moves as many squares as the die shows, anticlockwise.",
    "If you roll a <b>6</b> you roll again. If all your pieces are already out of home, a 6 counts as 7. With three sixes in a row, the last piece you moved goes back home.",
    "If you land on a square with a rival piece, you <b>capture</b> it: it goes back home and you move 20 squares with the piece of your choice.",
    "The squares with a circle ⭕ are <b>safe squares</b>: no captures there.",
    "Two pieces of the same colour on one square form a <b>blockade</b> that nobody can get past.",
    "When you reach your colour lane, move on to the finish. You need the exact number to get in. Each piece that reaches the finish gives you a 10-square bonus.",
    "The first to get all 4 pieces to the finish wins."
  ],
  consejos:["Try to leave your pieces on safe squares when rivals are nearby.","A blockade in the right place holds up all your rivals."]
}});
const css=`
.pa-zona{display:grid;grid-template-columns:minmax(0,640px) 1fr;gap:20px;align-items:start}
@media(max-width:900px){.pa-zona{grid-template-columns:1fr}}
.pa-svg{width:100%;height:auto;border-radius:16px;box-shadow:var(--sombra);background:#fffdf5}
.pa-ficha{cursor:pointer;transition:transform .2s}
.pa-ficha.puede{animation:late .8s infinite}
@keyframes late{50%{opacity:.45}}
.dadoG{width:84px;height:84px;background:#fff;border-radius:16px;box-shadow:0 6px 14px rgba(0,0,0,.4);display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:14px;margin:0 auto}
.dadoG i{width:16px;height:16px;border-radius:50%;background:#222;place-self:center}
.dadoG.rueda{animation:rueda .5s}
@keyframes rueda{to{transform:rotate(360deg)}}
.pa-j{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:12px;background:var(--panel);margin-bottom:6px;border:2px solid transparent}
.pa-j.turno{border-color:var(--oro)}
.pa-j .bola{width:22px;height:22px;border-radius:50%;border:3px solid #fff}
`;
document.head.append(J.el("style",{},css));

const COL=[{n:"Yellow",c:"#ffd60a",o:"#c9a200"},{n:"Blue",c:"#3a86ff",o:"#1f5fc2"},{n:"Red",c:"#ef233c",o:"#a3121f"},{n:"Green",c:"#2bb24c",o:"#167a30"}];
const U=40; // tamaño de celda
// Anillo de 68 casillas (cuatro brazos de 17)
const ANILLO=[];
(function(){
  const b=[]; // brazo inferior (0)
  for(let r=11;r<=18;r++) b.push([8,r]); b.push([9,18]); for(let r=18;r>=11;r--) b.push([10,r]);
  const d=[]; for(let c=11;c<=18;c++) d.push([c,10]); d.push([18,9]); for(let c=18;c>=11;c--) d.push([c,8]);
  const a=[]; for(let r=7;r>=0;r--) a.push([10,r]); a.push([9,0]); for(let r=0;r<=7;r++) a.push([8,r]);
  const i=[]; for(let c=7;c>=0;c--) i.push([c,8]); i.push([0,9]); for(let c=0;c<=7;c++) i.push([c,10]);
  ANILLO.push(...b,...d,...a,...i);
})();
const SALIDA=k=>k*17+13, ENTRADA=k=>k*17+8;
const SEGUROS=new Set(); for(let k=0;k<4;k++){ SEGUROS.add(k*17+4); SEGUROS.add(k*17+8); SEGUROS.add(k*17+13); }
// pasillo de llegada: 7 casillas
function pasillo(k,n){ // n=1..7
  if(k===0) return [9,18-n]; if(k===1) return [18-n,9]; if(k===2) return [9,n]; return [n,9];
}
const META=[[9,10.3],[10.3,9],[9,7.7],[7.7,9]];
const CASA=[[[13,13],[15,13],[13,15],[15,15]],[[13,3],[15,3],[13,5],[15,5]],[[3,3],[5,3],[3,5],[5,5]],[[3,13],[5,13],[3,15],[5,15]]];
const CASA_ESQ=[[11,11],[11,0],[0,0],[0,11]];

let ON=null;
let tiradaReal=0, J4=[], turno=0, dado=0, seises=0, ultimaFicha=null, esperando=false, premio=0, nJug=4, fin=false;
const raiz=J.$("#juego");

function config(){
  raiz.innerHTML=`<div class="panel" style="max-width:520px;margin:0 auto"><h2>🎲 New game</h2>
  <p>Computer rivals<br><select id="c-n"><option value="1">1 rival</option><option value="2">2 rivals</option><option value="3" selected>3 rivals</option></select></p>
  <button class="btn" id="c-ok">Start!</button></div>`;
  J.$("#c-ok").onclick=()=>{
    nJug=1+(+J.$("#c-n").value);
    const colores = nJug===2?[0,2]:nJug===3?[0,1,2]:[0,1,2,3];
    J4=colores.map((k,i)=>({k, hum:i===0, f:[-1,-1,-1,-1], n:i===0?"You":COL[k].n}));
    turno=0; seises=0; fin=false; montar(); pinta(); empieza();
  };
}
function montar(){
  raiz.innerHTML=`<div class="pa-zona"><svg class="pa-svg" id="svg" viewBox="0 0 ${19*U} ${19*U}"></svg>
  <div><div id="jugs"></div><div class="estado" id="est"></div><div class="dadoG" id="dado"></div>
  <div class="centro-txt" style="margin-top:14px"><button class="btn" id="b-tirar">🎲 Roll</button></div>
  <p class="centro-txt"><button class="btn sec peq" id="b-nueva">🔄 New game</button></p></div></div>`;
  J.$("#b-tirar").onclick=()=>{ if(J4[turno].hum&&!esperando) tirar(); };
  J.$("#b-nueva").onclick=()=>{ if(ON){ const e=inicioOn(ON.jugadores); ON.enviar(e); carga(e); } else config(); };
  pintaDado(5);
}
function pintaDado(v){ const P={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}; J.$("#dado").innerHTML=Array.from({length:9},(_,k)=>`<i style="visibility:${P[v].includes(k)?"visible":"hidden"}"></i>`).join(""); }

function xy(j,i){ // coordenadas de la ficha i del jugador j
  const p=J4[j].f[i], k=J4[j].k;
  if(p<0) return CASA[k][i].map(v=>v*U);
  if(p>=71) return META[k].map(v=>v*U+U/2+(i-1.5)*7);
  if(p>63) return pasillo(k,p-63).map(v=>v*U+U/2);
  const [c,r]=ANILLO[(SALIDA(k)+p)%68]; return [c*U+U/2,r*U+U/2];
}
const anilloDe=(k,p)=>p>=0&&p<=63?(SALIDA(k)+p)%68:-1;

function pinta(){
  let s="";
  // casas
  CASA_ESQ.forEach(([c,r],k)=>{ s+=`<rect x="${c*U+4}" y="${r*U+4}" width="${8*U-8}" height="${8*U-8}" rx="26" fill="${COL[k].c}" stroke="${COL[k].o}" stroke-width="4"/><circle cx="${(c+4)*U}" cy="${(r+4)*U}" r="${2.6*U}" fill="#fff" opacity=".85"/>`; });
  // anillo
  ANILLO.forEach(([c,r],i)=>{
    const sal=[0,1,2,3].find(k=>SALIDA(k)===i);
    const fill = sal!==undefined?COL[sal].c:"#fff";
    s+=`<rect x="${c*U}" y="${r*U}" width="${U}" height="${U}" fill="${fill}" stroke="#555" stroke-width="1"/>`;
    if(SEGUROS.has(i)) s+=`<circle cx="${c*U+U/2}" cy="${r*U+U/2}" r="${U*.36}" fill="none" stroke="#888" stroke-width="2"/>`;
  });
  for(let k=0;k<4;k++) for(let n=1;n<=7;n++){ const [c,r]=pasillo(k,n); s+=`<rect x="${c*U}" y="${r*U}" width="${U}" height="${U}" fill="${COL[k].c}" stroke="#555" opacity=".85"/>`; }
  // centro
  const c0=8*U, c1=11*U, m=9.5*U;
  s+=`<polygon points="${c0},${c1} ${c1},${c1} ${m},${m}" fill="${COL[0].c}"/><polygon points="${c1},${c0} ${c1},${c1} ${m},${m}" fill="${COL[1].c}"/><polygon points="${c0},${c0} ${c1},${c0} ${m},${m}" fill="${COL[2].c}"/><polygon points="${c0},${c0} ${c0},${c1} ${m},${m}" fill="${COL[3].c}"/><rect x="${c0}" y="${c0}" width="${3*U}" height="${3*U}" fill="none" stroke="#555"/>`;
  s+=`<text x="${m}" y="${m+6}" text-anchor="middle" font-size="18" font-family="Fredoka" fill="#222">FINISH</text>`;
  // fichas (agrupar por posición)
  const grupos={};
  J4.forEach((jg,j)=>jg.f.forEach((p,i)=>{ const [x,y]=xy(j,i); const key=p<0||p>=71?`u${j}${i}`:`${x},${y}`; (grupos[key]=grupos[key]||[]).push([j,i,x,y]); }));
  const mov = (J4[turno]&&J4[turno].hum&&esperando) ? movibles(turno,dado) : [];
  Object.values(grupos).forEach(g=>g.forEach(([j,i,x,y],n)=>{
    const off = g.length>1 ? (n===0?-8:8) : 0;
    const k=J4[j].k, puede=j===turno&&mov.includes(i);
    s+=`<g class="pa-ficha ${puede?"puede":""}" data-j="${j}" data-i="${i}"><circle cx="${x+off}" cy="${y+off}" r="${U*.36}" fill="${COL[k].c}" stroke="#fff" stroke-width="3"/><circle cx="${x+off}" cy="${y+off}" r="${U*.36}" fill="none" stroke="${COL[k].o}" stroke-width="1.5"/><circle cx="${x+off-4}" cy="${y+off-4}" r="4" fill="#fff" opacity=".6"/></g>`;
  }));
  J.$("#svg").innerHTML=s;
  J.$$(".pa-ficha.puede").forEach(g=>g.onclick=()=>elige(+g.dataset.i));
  J.$("#jugs").innerHTML=J4.map((jg,j)=>`<div class="pa-j ${j===turno?"turno":""}"><span class="bola" style="background:${COL[jg.k].c}"></span><b style="flex:1">${jg.n}</b><span>🏁 ${jg.f.filter(p=>p>=71).length}/4</span></div>`).join("");
}

function barreraEn(r){ // devuelve true si hay barrera en casilla de anillo r
  const cuenta={}; J4.forEach(jg=>jg.f.forEach(p=>{ const a=anilloDe(jg.k,p); if(a===r) cuenta[jg.k]=(cuenta[jg.k]||0)+1; }));
  return Object.values(cuenta).some(v=>v>=2);
}
const ocupantes=r=>{ const o=[]; J4.forEach((jg,j)=>jg.f.forEach((p,i)=>{ if(anilloDe(jg.k,p)===r) o.push([j,i]); })); return o; };
function destinoValido(j,i,n){
  const jg=J4[j], p=jg.f[i];
  if(p<0) return n===5 && ocupantes(SALIDA(jg.k)).filter(([x])=>x===j).length<2;
  if(p>=71) return false;
  const d=p+n; if(d>71) return false;
  for(let q=p+1;q<=Math.min(d,63);q++){ const r=anilloDe(jg.k,q); if(barreraEn(r)) return false; }
  if(d<=63 && ocupantes(anilloDe(jg.k,d)).length>=2) return false;
  return true;
}
function movibles(j,n){
  const jg=J4[j];
  const casa=jg.f.map((p,i)=>i).filter(i=>jg.f[i]<0);
  if(n===5 && casa.length && destinoValido(j,casa[0],5)) return [casa[0]]; // obligatorio salir
  return jg.f.map((p,i)=>i).filter(i=>jg.f[i]>=0 && destinoValido(j,i,n));
}

async function tirar(){
  esperando=false; J.$("#b-tirar").disabled=true;
  const el=J.$("#dado"); el.classList.remove("rueda"); void el.offsetWidth; el.classList.add("rueda");
  for(let k=0;k<6;k++){ pintaDado(1+J.azar(6)); await J.espera(70); }
  let v=1+J.azar(6); pintaDado(v); dado=v; tiradaReal=v;
  const jg=J4[turno];
  if(v===6){ seises++; if(jg.f.every(p=>p>=0)) dado=7; }
  sync(v);
  if(seises===3){
    est(`Three sixes! ${jg.n}: the last piece moved goes back home.`);
    if(ultimaFicha!==null && jg.f[ultimaFicha]<=63) jg.f[ultimaFicha]=-1;
    pinta(); await J.espera(1300); return pasa();
  }
  return mover(dado);
}
async function mover(n){
  const jg=J4[turno], mov=movibles(turno,n);
  if(!mov.length){ est(`${jg.n}: ${n===7?"6 (counts 7)":n} — can’t move.`); await J.espera(900); return trasMover(); }
  if(jg.hum && (mov.length>1 || premio)){ esperando=true; est(premio?`Bonus: choose a piece to move ${n}`:`You rolled ${n===7?"6 (counts as 7)":n}. Tap a flashing piece.`); pinta(); return; }
  const i = jg.hum ? mov[0] : eligeCPU(turno,mov,n);
  if(!jg.hum) await J.espera(450);
  return aplica(i,n);
}
function elige(i){ if(!esperando) return; esperando=false; aplica(i, dado); }

async function aplica(i,n){
  const jg=J4[turno], p=jg.f[i];
  let comio=false;
  if(p<0){ jg.f[i]=0; const r=SALIDA(jg.k); const riv=ocupantes(r).filter(([x])=>x!==turno); if(riv.length){ const [x,y]=riv[riv.length-1]; J4[x].f[y]=-1; comio=true; } }
  else {
    for(let q=1;q<=n;q++){ jg.f[i]=p+q; pinta(); await J.espera(jg.hum?110:70); }
    const d=jg.f[i];
    if(d<=63){ const r=anilloDe(jg.k,d); if(!SEGUROS.has(r)){ const riv=ocupantes(r).filter(([x])=>x!==turno); if(riv.length===1){ const [x,y]=riv[0]; J4[x].f[y]=-1; comio=true; } } }
  }
  ultimaFicha=i; premio=0; pinta(); sync(tiradaReal);
  if(comio){ J.aviso(`🍽️ ${jg.n} captures a piece! +20`); await J.espera(500); if(movibles(turno,20).length){ premio=20; dado=20; return mover(20); } }
  if(jg.f[i]>=71){
    if(jg.f.every(p=>p>=71)) return gana(jg);
    J.aviso(`🏁 ${jg.n} gets a piece home! +10`); await J.espera(500); if(movibles(turno,10).length){ premio=10; dado=10; return mover(10); }
  }
  return trasMover();
}
async function trasMover(){
  premio=0;
  if(tiradaReal===6 && seises>0 && seises<3 && !fin){ est(`${J4[turno].n} rolls again (rolled a 6)`); return J4[turno].hum ? listo() : (await J.espera(600), tirar()); }
  return pasa();
}
function pasa(){ seises=0; ultimaFicha=null; turno=(turno+1)%J4.length; pinta(); if(ON) ON.enviar(paquete(0)); empieza(); }
function listo(){ J.$("#b-tirar").disabled=false; pinta(); }
function est(t){ J.$("#est").textContent=t; }
async function empieza(){
  if(fin) return;
  const jg=J4[turno]; est(`${jg.n}’s turn`);
  if(ON&&turno!==ON.yo){ J.$("#b-tirar").disabled=true; return; }
  if(jg.hum){ listo(); est("Your turn: press Roll"); }
  else { J.$("#b-tirar").disabled=true; await J.espera(600); tirar(); }
}
function eligeCPU(j,mov,n){
  const jg=J4[j]; let mejor=mov[0], mv=-1e9;
  for(const i of mov){
    const p=jg.f[i]; let v=0;
    if(p<0){ v=50; } else {
      const d=p+n;
      if(d>=71) v+=80;
      else if(d>63) v+=40;
      else { const r=anilloDe(jg.k,d); const riv=ocupantes(r).filter(([x])=>x!==j); if(riv.length===1&&!SEGUROS.has(r)) v+=100; if(SEGUROS.has(r)) v+=25; v+=p*0.3; }
      const ra=anilloDe(jg.k,p); if(ra>=0&&!SEGUROS.has(ra)) v+=10; // sacar del peligro
    }
    v+=Math.random()*5; if(v>mv){ mv=v; mejor=i; }
  }
  return mejor;
}
function gana(jg){
  fin=true; pinta(); if(ON) ON.enviar(paquete(0)); finOn(jg);
}
function finOn(jg){
  if(jg.hum) J.confeti(150);
  if(ON){ J.modal(`<h2>${jg.hum?"🏆 You won!":"🏁 Winner: "+jg.n}</h2><p>${jg.hum?"You got your 4 pieces to the finish before anyone else.":jg.n+" has got all 4 pieces to the finish."}</p>`,[{txt:"OK"}]); return; }
  J.modal(`<h2>${jg.hum?"🏆 You won!":"😮 Winner: "+jg.n}</h2><p>${jg.hum?"You got your 4 pieces to the finish before anyone else.":"This time the computer was faster. Rematch!"}</p>`,[{txt:"New game"}],true).then(config);
}
function paquete(d){ return {J4:J4.map(j=>({k:j.k,f:j.f.slice(),n:j.n})), turno, dado:d, fin}; }
function sync(d){ if(ON&&J4[turno]&&J4[turno].hum) ON.enviar(paquete(d)); }
function inicioOn(nombres){ const n=nombres.length; const colores=n===2?[0,2]:n===3?[0,1,2]:[0,1,2,3];
  return {J4:colores.map((k,i)=>({k,f:[-1,-1,-1,-1],n:nombres[i]})), turno:0, dado:0, fin:false}; }
function carga(e){ const antes=turno, eraFin=fin;
  J4=e.J4.map((j,i)=>({...j, hum:i===ON.yo})); turno=e.turno; fin=e.fin; seises=0; esperando=false; premio=0;
  if(!J.$("#svg")) montar();
  if(e.dado) pintaDado(Math.min(6,e.dado)); pinta();
  if(fin){ if(!eraFin){ const g=J4.find(j=>j.f.every(p=>p>=71)); if(g) finOn(g); } est("Game over"); return; }
  if(turno===ON.yo){ listo(); est("Your turn: press Roll"); }
  else { J.$("#b-tirar").disabled=true; est(`${J4[turno].n}’s turn`+(e.dado?` · rolled a ${e.dado}`:"")); } }
config();
J.online&&J.online.activar({juego:"parchis", titulo:"Parcheesi (Parchís)", min:2, max:4,
  inicio:inicioOn,
  alEmpezar(ctx,e){ ON=ctx; montar(); carga(e); J.aviso(`You play ${COL[J4[ctx.yo].k].n.toLowerCase()}`,3000); },
  alCambiar(e){ carga(e); }});
})();
