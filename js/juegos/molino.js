/* Molino (nueve fichas) */
(function(){
J.paginaJuego({titulo:"Nine Men’s Morris", emoji:"⚪", ficha:"molino", ins:{
  titulo:"Nine Men’s Morris",
  intro:"A strategy game for two players with <b>nine pieces</b> each, known since Roman times and very popular in medieval Europe. The board has three squares joined by lines and 24 points where pieces can be placed.",
  pasos:[
    "<b>Phase 1, placing.</b> Taking turns, each player puts a piece on a free point until all nine are placed.",
    "If you get <b>three pieces in a row</b> on the same line, you’ve made a <b>mill</b>: remove one of your rival’s pieces from the board. You can’t remove one that is in a mill, unless they all are.",
    "<b>Phase 2, moving.</b> With all the pieces placed, on your turn you move a piece to a free neighbouring point, following the lines. Tap the piece and then the destination.",
    "You can open a mill and close it again later: every time you form it, you capture.",
    "<b>Phase 3, flying.</b> When a player has only three pieces left, they can move them to <b>any</b> free point.",
    "You lose if you are left with <b>two pieces</b> or can’t move any."
  ],
  consejos:["The corners only have two neighbours: the points in the middle of each side are more valuable.","Try to set up two mills at once: your rival can only block one.","A “running mill”, which opens and closes every turn, is almost impossible to stop."]
}});
document.head.append(J.el("style",{},`
.mo{max-width:520px;margin:0 auto;background:linear-gradient(135deg,#d9b98a,#b88d58);border-radius:18px;padding:14px;box-shadow:var(--sombra)}
.mo svg{width:100%;height:auto;display:block}
.mo .p{cursor:default}.mo .p.ok{cursor:pointer}
.mo-res{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:8px 0}
`));
const P=[[0,0],[3,0],[6,0],[6,3],[6,6],[3,6],[0,6],[0,3],[1,1],[3,1],[5,1],[5,3],[5,5],[3,5],[1,5],[1,3],[2,2],[3,2],[4,2],[4,3],[4,4],[3,4],[2,4],[2,3]];
const ADJ=P.map(()=>[]); const une=(a,b)=>{ ADJ[a].push(b); ADJ[b].push(a); };
for(let r=0;r<3;r++) for(let k=0;k<8;k++) une(r*8+k,r*8+(k+1)%8);
[1,3,5,7].forEach(k=>{ une(k,k+8); une(k+8,k+16); });
const MOL=[]; for(let r=0;r<3;r++) [0,2,4,6].forEach(k=>MOL.push([r*8+k,r*8+k+1,r*8+(k+2)%8])); [1,3,5,7].forEach(k=>MOL.push([k,k+8,k+16]));
const raiz=J.$("#juego");
let S, ON=null, me=0, nivel=2, sel=-1, gen=0, piensa=false;
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nm=j=>j===me?"You":ON?esc(ON.jugadores[j]):"The computer";
// S: t[24] con -1 libre, 0 o 1; mano[2] fichas por poner; turno; quita (bool: tiene que comer); fin (-1, 0, 1, 2=tablas); sin (jugadas sin comer)
const nuevo=()=>({t:Array(24).fill(-1),mano:[9,9],turno:0,quita:false,fin:-1,sin:0,ult:[]});
const enMolino=(t,i)=>t[i]>=0&&MOL.some(m=>m.includes(i)&&m.every(x=>t[x]===t[i]));
const cuenta=(t,s)=>t.filter(x=>x===s).length;
function quitables(t,s){ const r=[]; for(let i=0;i<24;i++) if(t[i]===1-s&&!enMolino(t,i)) r.push(i); if(r.length) return r; return t.map((x,i)=>x===1-s?i:-1).filter(i=>i>=0); }
function pasos(st,s){ // movimientos simples {de,a}
  const res=[]; if(st.mano[s]>0){ for(let i=0;i<24;i++) if(st.t[i]<0) res.push({de:-1,a:i}); return res; }
  const vuela=cuenta(st.t,s)===3;
  for(let i=0;i<24;i++) if(st.t[i]===s){ const ds=vuela?st.t.map((x,k)=>x<0?k:-1).filter(k=>k>=0):ADJ[i].filter(k=>st.t[k]<0); ds.forEach(a=>res.push({de:i,a})); }
  return res; }
function haceMolino(t,s,m){ const t2=t.slice(); if(m.de>=0) t2[m.de]=-1; t2[m.a]=s; return enMolino(t2,m.a); }
function jugadas(st,s){ const r=[]; for(const m of pasos(st,s)){ if(haceMolino(st.t,s,m)){ const t2=st.t.slice(); if(m.de>=0) t2[m.de]=-1; t2[m.a]=s; quitables(t2,s).forEach(q=>r.push({...m,q})); } else r.push({...m,q:-1}); } return r; }
function aplica(st,s,m){ const n={t:st.t.slice(),mano:st.mano.slice(),turno:1-s,quita:false,fin:-1,sin:st.sin+1,ult:[m.de,m.a]};
  if(m.de>=0) n.t[m.de]=-1; else n.mano[s]--; n.t[m.a]=s; if(m.q>=0){ n.t[m.q]=-1; n.sin=0; }
  return n; }
function cierra(n){ for(const s of [0,1]){ if(n.mano[s]===0&&cuenta(n.t,s)<3){ n.fin=1-s; return n; } }
  if(!pasos(n,n.turno).length){ n.fin=1-n.turno; return n; } if(n.sin>=120){ n.fin=2; } return n; }
function valora(st){ if(st.fin===1) return 1e5; if(st.fin===0) return -1e5; if(st.fin===2) return 0;
  const a=cuenta(st.t,1)+st.mano[1], b=cuenta(st.t,0)+st.mano[0]; let v=(a-b)*100;
  let ma=0,mb=0; MOL.forEach(m=>{ const xs=m.map(i=>st.t[i]); const c1=xs.filter(x=>x===1).length, c0=xs.filter(x=>x===0).length, l=xs.filter(x=>x<0).length;
    if(c1===3) ma+=1; if(c0===3) mb+=1; if(c1===2&&l===1) v+=18; if(c0===2&&l===1) v-=22; });
  v+=(ma-mb)*25;
  if(!st.mano[0]&&!st.mano[1]){ const pa=pasos({...st},1).length, pb=pasos({...st},0).length; v+=(pa-pb)*4; }
  [1,3,5,7,9,11,13,15,17,19,21,23].forEach(i=>{ if(st.t[i]===1) v+=2; else if(st.t[i]===0) v-=2; }); [9,11,13,15].forEach(i=>{ if(st.t[i]===1) v+=3; else if(st.t[i]===0) v-=3; });
  return v; }
function mm(st,p,a,b){ if(st.fin>=0||p===0) return valora(st); const s=st.turno; const js=jugadas(st,s);
  if(!js.length) return s===1?-1e5:1e5;
  if(s===1){ let best=-1e9; for(const m of js){ const v=mm(cierra(aplica(st,s,m)),p-1,a,b); if(v>best) best=v; if(v>a) a=v; if(a>=b) break; } return best; }
  let best=1e9; for(const m of js){ const v=mm(cierra(aplica(st,s,m)),p-1,a,b); if(v<best) best=v; if(v<b) b=v; if(a>=b) break; } return best; }
function eligeCPU(st){ const js=J.baraja(jugadas(st,1)); if(nivel===1&&Math.random()<.4) return js[0];
  const fase=st.mano[1]>0; const p=nivel===1?1:nivel===2?2:(fase?3:4);
  let best=-1e9, mv=js[0]; for(const m of js){ const v=mm(cierra(aplica(st,1,m)),p-1,-1e9,1e9); if(v>best){ best=v; mv=m; } } return mv; }

raiz.innerHTML=`<div class="centro-txt" style="margin-bottom:8px"><select id="mo-n"><option value="1">Easy</option><option value="2" selected>Normal</option><option value="3">Hard</option></select> <button class="btn sec peq" id="mo-nueva">🔄 New game</button></div>
<div class="mo-res" id="mo-res"></div><div class="estado" id="mo-est"></div><div class="mo" id="mo"></div>`;
J.$("#mo-n").onchange=e=>{ nivel=+e.target.value; };
J.$("#mo-nueva").onclick=()=>{ if(ON&&ON.yo!==0) return J.aviso("The new game is started by whoever created the room"); nueva(); };
function nueva(){ S=nuevo(); S.turno=ON?J.azar(2):0; sel=-1; gen++; piensa=false; pinta(); envia(); siguiente(); }
function envia(){ if(ON) ON.enviar(S); }
const color=s=>s===me?"a":"b";
function pinta(){
  const k=56, o=26, X=i=>o+P[i][0]*k, Y=i=>o+P[i][1]*k;
  const mio=S.turno===me&&S.fin<0&&!piensa; let ok=new Set(), destino=new Set();
  if(mio){ if(S.quita) quitables(S.t,me).forEach(i=>ok.add(i));
    else if(S.mano[me]>0) S.t.forEach((x,i)=>{ if(x<0) destino.add(i); });
    else { const ps=pasos(S,me); ps.forEach(m=>ok.add(m.de)); if(sel>=0) ps.filter(m=>m.de===sel).forEach(m=>destino.add(m.a)); } }
  let l=""; for(let r=0;r<3;r++){ const a=r*8; l+=`<rect x="${X(a)}" y="${Y(a)}" width="${X(a+4)-X(a)}" height="${Y(a+4)-Y(a)}" fill="none"/>`; }
  [1,3,5,7].forEach(q=>{ l+=`<line x1="${X(q)}" y1="${Y(q)}" x2="${X(q+16)}" y2="${Y(q+16)}"/>`; });
  let pts=""; for(let i=0;i<24;i++){ const x=S.t[i], c=`${X(i)},${Y(i)}`;
    const marca=destino.has(i)?`<circle cx="${X(i)}" cy="${Y(i)}" r="13" fill="none" stroke="#ffc94a" stroke-width="4"/>`:"";
    const ult=S.ult&&S.ult.includes(i)&&x>=0?`<circle cx="${X(i)}" cy="${Y(i)}" r="23" fill="none" stroke="#4cc9f0" stroke-width="3" opacity=".8"/>`:"";
    const pieza= x<0?`<circle cx="${X(i)}" cy="${Y(i)}" r="7" fill="#3b2410"/>` :
      `<circle cx="${X(i)}" cy="${Y(i)}" r="19" fill="url(#g${color(x)})" stroke="${color(x)==="a"?"#6b5a3a":"#000"}" stroke-width="2"/><circle cx="${X(i)}" cy="${Y(i)}" r="10" fill="none" stroke="${color(x)==="a"?"#b9a37b":"#555"}" stroke-width="2"/>`;
    const sl=sel===i?`<circle cx="${X(i)}" cy="${Y(i)}" r="24" fill="none" stroke="#ffc94a" stroke-width="4"/>`:"";
    const qt=S.quita&&ok.has(i)?`<circle cx="${X(i)}" cy="${Y(i)}" r="24" fill="none" stroke="#ff4d6d" stroke-width="4" stroke-dasharray="6 4"/>`:"";
    pts+=`<g class="p ${ok.has(i)||destino.has(i)?"ok":""}" data-i="${i}">${ult}${pieza}${marca}${sl}${qt}<circle cx="${X(i)}" cy="${Y(i)}" r="26" fill="transparent"/></g>`; }
  J.$("#mo").innerHTML=`<svg viewBox="0 0 ${2*o+6*k} ${2*o+6*k}"><defs><radialGradient id="ga" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#efe6d2"/><stop offset="1" stop-color="#a8987a"/></radialGradient><radialGradient id="gb" cx=".35" cy=".3"><stop offset="0" stop-color="#777"/><stop offset=".5" stop-color="#2a2a2a"/><stop offset="1" stop-color="#000"/></radialGradient></defs><g stroke="#3b2410" stroke-width="4">${l}</g>${pts}</svg>`;
  J.$$("#mo .p").forEach(g=>g.onclick=()=>toca(+g.dataset.i));
  const caja=s=>`<div class="marcador" style="margin:0"><div class="caja"><small>${s===me?"⚪ You":(ON?"⚫ "+nm(s):"⚫ Computer")}</small><b>${cuenta(S.t,s)}${S.mano[s]?` <span style="font-size:.8rem;opacity:.8">+${S.mano[s]} to place</span>`:""}</b></div></div>`;
  J.$("#mo-res").innerHTML=caja(me)+caja(1-me);
  let e; if(S.fin===2) e="Tablas: demasiadas jugadas sin comer"; else if(S.fin>=0) e= S.fin===me?"🏆 You won!":`${nm(S.fin)} wins the game`;
  else if(S.turno!==me) e= ON?`${nm(S.turno)}’s turn…`:"The computer is thinking…";
  else if(S.quita) e="Mill! Tap one of your rival’s pieces to remove it";
  else if(S.mano[me]>0) e=`Place a piece (${S.mano[me]} left)`;
  else e= cuenta(S.t,me)===3?"You only have three left: you can fly to any point":sel<0?"Tap one of your pieces to move it":"Now tap the destination point";
  J.$("#mo-est").textContent=e;
}
function toca(i){ if(S.turno!==me||S.fin>=0||piensa) return;
  if(S.quita){ if(!quitables(S.t,me).includes(i)) return; S.t[i]=-1; S.quita=false; S.sin=0; S.turno=1-me; fin(); return; }
  if(S.mano[me]>0){ if(S.t[i]>=0) return; juegaPaso({de:-1,a:i}); return; }
  if(S.t[i]===me){ sel= sel===i?-1:i; return pinta(); }
  if(sel>=0&&pasos(S,me).some(m=>m.de===sel&&m.a===i)){ juegaPaso({de:sel,a:i}); } }
function juegaPaso(m){ const mol=haceMolino(S.t,me,m); if(m.de>=0) S.t[m.de]=-1; else S.mano[me]--; S.t[m.a]=me; S.ult=[m.de,m.a]; sel=-1; S.sin++;
  if(mol){ S.quita=true; J.aviso("Mill! Remove one of your rival’s pieces"); pinta(); envia(); return; }
  S.turno=1-me; fin(); }
function fin(){ cierra(S); if(S.fin===me) J.confeti(); pinta(); envia(); siguiente(); }
async function siguiente(){ if(ON||S.fin>=0||S.turno===me) return; const g=gen; piensa=true; pinta(); await J.espera(450); if(g!==gen) return;
  const m=eligeCPU(S); if(g!==gen) return; piensa=false; S=cierra(aplica(S,1,m)); if(m.q>=0) J.aviso("The computer makes a mill and removes one of your pieces"); pinta(); }
function carga(e){ S={t:e.t.slice(),mano:e.mano.slice(),turno:e.turno,quita:!!e.quita,fin:e.fin,sin:e.sin||0,ult:e.ult||[]}; sel=-1; gen++; piensa=false; if(S.fin===me) J.confeti(); pinta(); }
J.online&&J.online.activar({juego:"molino", titulo:"Nine Men’s Morris", min:2, max:2,
  inicio(){ const e=nuevo(); e.turno=J.azar(2); return e; },
  alEmpezar(ctx,e){ ON=ctx; me=ctx.yo; J.$("#mo-n").style.display="none"; carga(e); J.aviso((e.turno===me?"You go first":"First to play: "+ctx.jugadores[e.turno])+" · Your pieces are the light ones",3000); },
  alCambiar(e){ carga(e); } });
nueva();
})();
