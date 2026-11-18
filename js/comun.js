/* Spanish encyclopedia slug -> English slug */
window.FICHA_EN={"senet":"senet","juego-real-de-ur":"royal-game-of-ur","go":"go","backgammon":"backgammon","ajedrez":"chess","xiangqi":"xiangqi-chinese-chess","shogi":"shogi-japanese-chess","damas":"checkers-draughts","mancala":"mancala","parchis":"parcheesi-ludo","oca":"game-of-the-goose","tres-en-raya":"tic-tac-toe","cuatro-en-raya":"connect-four","reversi":"reversi-othello","juegos-de-propiedades":"property-trading-games","juegos-de-palabras-con-fichas":"word-tile-games","juegos-de-preguntas":"trivia-games","cluedo":"mystery-deduction-games","estrategia-de-conquista":"world-conquest-games","catan":"settling-and-trading-games","juegos-de-rol":"role-playing-games","baraja-espanola":"spanish-deck","baraja-francesa":"french-deck","mus":"mus","brisca":"brisca","tute":"tute","chinchon":"chinchon","remigio":"remigio","cinquillo":"cinquillo","poker":"poker","blackjack":"blackjack","bridge":"bridge","solitario":"solitaire","canasta":"canasta","tarot":"tarot-card-games","domino":"dominoes","mahjong":"mahjong","crucigrama":"crossword","sopa-de-letras":"word-search","ahorcado":"hangman","hundir-la-flota":"battleship","sudoku":"sudoku","buscaminas":"minesweeper","memoria":"memory-pairs","cubo-de-rubik":"rubiks-cube","tangram":"tangram","puzle":"jigsaw-puzzle","mastermind":"code-breaking-games","ruleta":"roulette","dados":"dice","generala":"generala-poker-dice","bingo":"bingo-and-lotto","futbolin":"table-football","canicas":"marbles","peonza":"spinning-top","rayuela":"hopscotch","escondite":"hide-and-seek","billar":"billiards","pong":"pong-first-video-games","tetris":"tetris","pac-man":"pac-man-arcade-golden-age","ocho-locos":"crazy-eights","tragaperras":"slot-machines","mehen":"mehen-snake-game","patolli":"patolli","alquerque":"alquerque","molino":"nine-mens-morris","hnefatafl":"hnefatafl","ludus-latrunculorum":"ludus-latrunculorum","serpientes-y-escaleras":"snakes-and-ladders","damas-chinas":"chinese-checkers","escoba":"escoba","siete-y-medio":"seven-and-a-half","truco":"truco","hanafuda":"hanafuda","loteria":"mexican-loteria","taba":"knucklebones","mikado":"mikado-pick-up-sticks","carrom":"carrom","comba":"jump-rope","bolos":"bowling","petanca":"petanque","rana":"toad-in-the-hole","yoyo":"yo-yo","cometa":"kite","chapas":"bottle-caps","spacewar":"spacewar","space-invaders":"space-invaders","serpiente":"snake-game","2048":"2048","super-mario-bros":"super-mario-bros","torres-de-hanoi":"tower-of-hanoi","stop":"stop-scattergories","carcassonne":"carcassonne","guinote":"guinote","julepe":"julepe","cuatrola":"cuatrola","la-mona":"old-maid-la-mona","el-burro":"el-burro-card-game","la-goma":"chinese-jump-rope","el-panuelo":"steal-the-bacon-el-panuelo","churro-media-manga":"churro-media-manga","pidola":"leapfrog","gallina-ciega":"blind-mans-buff","quiniela":"football-pools-quiniela","donkey-kong":"donkey-kong","street-fighter-ii":"street-fighter-ii","minecraft":"minecraft","dibujar-y-adivinar":"drawing-and-guessing-games","palabras-prohibidas":"taboo-word-games","stratego":"stratego","index":"index","cronologia":"timeline","mapa":"map","creditos":"photo-credits","articulo-antigua-roma":"games-of-ancient-rome","articulo-espana-anos-60":"games-in-1960s-spain","articulo-juegos-navidad":"christmas-games","articulo-juegos-y-maquinas":"games-and-machines"};
/* false until the English encyclopedia is published: encyclopedia links go to the Spanish version */
window.ENCI_EN=false;
window.JUEGO_EN={"sabelotodo":"trivia","rascacielos":"skyscrapers","atril":"word-rack","ajedrez":"chess","parchis":"parcheesi","poker":"texas-holdem-poker","domino":"dominoes","solitario":"solitaire","remigio":"remigio","colorines":"colors-card-game","backgammon":"backgammon","reversi":"reversi","mancala":"mancala","hundir-la-flota":"battleship","chinchon":"chinchon","brisca":"brisca","cinquillo":"cinquillo","generala":"generala-dice","bingo":"bingo","juego-real-de-ur":"royal-game-of-ur","senet":"senet","molino":"nine-mens-morris","escoba":"escoba","siete-y-medio":"seven-and-a-half","torres-de-hanoi":"tower-of-hanoi","tangram":"tangram","descifra":"code-breaker","puzle-deslizante":"sliding-puzzle","2048":"2048","bloques":"blocks","serpiente":"snake","tenis-de-mesa":"table-tennis","tragaperras":"slot-machine","ruleta":"roulette","blackjack":"blackjack","crucigrama":"crossword","damas":"checkers","oca":"game-of-the-goose","cuatro-en-raya":"connect-four","tres-en-raya":"tic-tac-toe","buscaminas":"minesweeper","sudoku":"sudoku","memoria":"memory","ahorcado":"hangman","sopa-de-letras":"word-search"};
/* Ludicopedia (English) — common utilities. Shared images, CSS and fonts are loaded from the site root. */
(function(){
  const raiz = document.body.dataset.raiz || "";
  const actual = document.body.dataset.seccion || "";
  // Same page in Spanish (from <link rel="alternate" hreflang="es">)
  const esLink = document.querySelector('link[rel="alternate"][hreflang="es"]');
  const esUrl = esLink ? esLink.getAttribute("href") : "";
  // Tema claro u oscuro (se recuerda en este navegador)
  const temaGuardado = (()=>{ try{ return localStorage.getItem("tema"); }catch(e){ return null; } })();
  if (temaGuardado === "claro") document.documentElement.dataset.tema = "claro";
  // Cabecera
  const cab = document.createElement("header");
  cab.className = "cab";
  cab.innerHTML = `<div class="contenedor">
    <a class="logo" href="${raiz}index.html" aria-label="Ludicopedia, home">
      <span class="dado"><i></i><i style="visibility:hidden"></i><i></i><i style="visibility:hidden"></i><i></i><i style="visibility:hidden"></i><i></i><i style="visibility:hidden"></i><i></i></span>
      <span>Ludico<b>pedia</b></span></a>
    <div class="busq"><svg class="lupa" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg><input type="search" id="busq-in" placeholder="Search for a game…" aria-label="Search games and history" autocomplete="off"><div class="busq-res" id="busq-res" hidden></div></div>
    <button class="tema" aria-label="Switch between light and dark theme" title="Light / dark theme"></button>
    <button class="burger" aria-label="Menu">☰</button>
    <nav class="nav">
      <a href="${raiz}index.html#play" class="${actual==='jugar'?'activo':''}">🎮 Play</a>
      <a href="${ENCI_EN?raiz+"encyclopedia/index.html":"/enciclopedia/index.html"}" class="${actual==='enciclopedia'?'activo':''}"${ENCI_EN?"":' hreflang="es" title="In Spanish for now"'}>📚 Encyclopedia</a>
      <a href="${ENCI_EN?raiz+"encyclopedia/timeline.html":"/enciclopedia/cronologia.html"}"${ENCI_EN?"":' hreflang="es" title="In Spanish for now"'} class="${actual==='cronologia'?'activo':''}">⏳ History</a>
      ${esUrl?`<a href="${esUrl}" hreflang="es" lang="es" class="nav-idioma" title="Ver esta página en español">🌐 Español</a>`:""}
    </nav></div>`;
  document.body.prepend(cab);
  // Buscador de la cabecera: busca en los juegos y en la enciclopedia
  (function(){
    const inp = cab.querySelector("#busq-in"), res = cab.querySelector("#busq-res");
    const norm = t => (t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const esc = t => String(t).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
    let listo = null;
    const carga = src => new Promise(ok => { const sc = document.createElement("script"); sc.src = raiz + src; sc.onload = sc.onerror = ok; document.head.append(sc); });
    const prepara = () => listo || (listo = Promise.all([window.CATALOGO ? 0 : carga("js/catalogo.js"), (window.FICHAS || !ENCI_EN) ? 0 : carga("encyclopedia/data.js")]));
    let sel = 0, items = [];
    function pinta(){
      const q = norm(inp.value.trim());
      if (!q) { res.hidden = true; return; }
      const jg = (window.CATALOGO||[]).filter(j => norm(j.nombre+" "+j.desc+" "+j.cat).includes(q))
        .map(j => ({url: raiz+"games/"+j.slug+".html", ico: j.emoji, nom: j.nombre, tipo: "🎮 Play"}));
      const fam = window.FAMILIAS || {};
      const fi = (window.FICHAS||[]).filter(f => norm(f.nombre+" "+(fam[f.familia]?fam[f.familia].nombre:"")).includes(q))
        .map(f => ({url: raiz+"encyclopedia/"+f.slug+".html", ico: fam[f.familia]?fam[f.familia].emoji:"📚", nom: f.nombre, tipo: "📚 History"}));
      items = jg.slice(0,6).concat(fi.slice(0,6)); sel = 0;
      res.innerHTML = items.length ? items.map((r,i) => `<a href="${r.url}" class="${i===0?"sel":""}"><span class="ico">${r.ico}</span><span class="nom">${esc(r.nom)}</span><small>${r.tipo}</small></a>`).join("")
        : `<div class="nada">No games match “${esc(inp.value.trim())}”.</div>`;
      res.hidden = false;
    }
    inp.addEventListener("focus", prepara);
    inp.addEventListener("input", () => prepara().then(pinta));
    inp.addEventListener("keydown", e => {
      if (res.hidden || !items.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sel = (sel + (e.key==="ArrowDown"?1:-1) + items.length) % items.length; res.querySelectorAll("a").forEach((a,i)=>a.classList.toggle("sel", i===sel)); }
      else if (e.key === "Enter") { e.preventDefault(); location.href = items[sel].url; }
      else if (e.key === "Escape") { res.hidden = true; inp.blur(); }
    });
    document.addEventListener("click", e => { if (!cab.querySelector(".busq").contains(e.target)) res.hidden = true; });
  })();
  const bTema = cab.querySelector(".tema");
  const pintaTema = () => { bTema.textContent = document.documentElement.dataset.tema === "claro" ? "🌙" : "☀️"; };
  bTema.onclick = () => {
    const claro = document.documentElement.dataset.tema !== "claro";
    if (claro) document.documentElement.dataset.tema = "claro"; else delete document.documentElement.dataset.tema;
    try{ localStorage.setItem("tema", claro ? "claro" : "oscuro"); }catch(e){}
    pintaTema();
  };
  pintaTema();
  cab.querySelector(".burger").onclick = () => cab.querySelector(".nav").classList.toggle("abierto");
  // Pie
  const pie = document.createElement("footer");
  pie.className = "pie";
  pie.innerHTML = `<div class="contenedor">
    <div><b>Ludicopedia</b> · The great encyclopedia of games: history, rules and free games to play in your browser.</div>
    <div>All games are free and use no real money. Chips and bets are pretend.</div>
    <nav class="legal" aria-label="Legal information"><a href="${raiz}legal/legal-notice.html">Legal notice</a><a href="${raiz}legal/privacy.html">Privacy</a><a href="${raiz}legal/cookies.html">Cookies</a><a href="${raiz}legal/contact.html">Contact</a><a href="${ENCI_EN?raiz+"encyclopedia/photo-credits.html":"/enciclopedia/creditos.html"}">Photo credits</a></nav><div style="margin-top:.6em">© 2026 Alejandro Rosàs · Content licensed under <a href="https://creativecommons.org/licenses/by-nc/4.0/deed.en" rel="license noopener" style="display:inline">CC BY-NC 4.0</a> unless otherwise stated</div></div>`;
  document.body.append(pie);
  // Velo para modales y aviso
  const velo = document.createElement("div");
  velo.className = "velo";
  velo.innerHTML = `<div class="modal" role="dialog" aria-modal="true"></div>`;
  document.body.append(velo);
  velo.addEventListener("click", e => { if (e.target === velo && !velo.dataset.fijo) J.cerrar(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && velo.classList.contains("ver") && !velo.dataset.fijo) J.cerrar(); });
  const toast = document.createElement("div");
  toast.className = "toast";
  document.body.append(toast);
  let tt;

  const J = window.J = {
    raiz,
    $: (s, el=document) => el.querySelector(s),
    $$: (s, el=document) => [...el.querySelectorAll(s)],
    el(tag, attrs={}, html=""){ const e=document.createElement(tag); for(const k in attrs){ if(k==="class") e.className=attrs[k]; else if(k.startsWith("on")) e[k]=attrs[k]; else e.setAttribute(k,attrs[k]); } if(html) e.innerHTML=html; return e; },
    azar: n => Math.floor(Math.random()*n),
    elige: a => a[Math.floor(Math.random()*a.length)],
    baraja(a){ a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; },
    espera: ms => new Promise(r=>setTimeout(r,ms)),
    modal(html, botones=[{txt:"Got it",cls:""}], fijo=false){
      return new Promise(res=>{
        const m = velo.querySelector(".modal");
        m.innerHTML = html + `<div class="pie-modal"></div>`;
        const p = m.querySelector(".pie-modal");
        botones.forEach((b,i)=>{ const x=J.el("button",{class:"btn "+(b.cls||"")},b.txt); x.onclick=()=>{J.cerrar();res(b.valor!==undefined?b.valor:i);}; p.append(x); });
        if(fijo) velo.dataset.fijo="1"; else delete velo.dataset.fijo;
        velo.classList.add("ver");
        m.scrollTop = 0;
      });
    },
    cerrar(){ velo.classList.remove("ver"); delete velo.dataset.fijo; },
    aviso(txt, ms=2200){ toast.textContent=txt; toast.classList.add("ver"); clearTimeout(tt); tt=setTimeout(()=>toast.classList.remove("ver"),ms); },
    confeti(n=90){ const cs=["#ffc94a","#ff4d6d","#4cc9f0","#2ed47a","#9b5de5","#f15bb5"]; for(let i=0;i<n;i++){const c=J.el("div",{class:"confeti"}); c.style.left=Math.random()*100+"vw"; c.style.background=J.elige(cs); c.style.animationDuration=(1.8+Math.random()*2)+"s"; c.style.animationDelay=Math.random()*.6+"s"; document.body.append(c); setTimeout(()=>c.remove(),4500);} },
    /* Instrucciones: titulo, intro, pasos[], consejos[] */
    instrucciones(ins){
      const pasos = ins.pasos.map((p,i)=>`<div class="paso"><span class="n">${i+1}</span><div>${p}</div></div>`).join("");
      const cons = ins.consejos ? `<h3>💡 Tips</h3><ul>${ins.consejos.map(c=>`<li>${c}</li>`).join("")}</ul>` : "";
      return J.modal(`<h2>📖 How to play: ${ins.titulo}</h2>${ins.intro?`<p>${ins.intro}</p>`:""}<h3>Step by step</h3>${pasos}${cons}`, [{txt:"Let’s play!"}]);
    },
    /* Prepara la cabecera de una página de juego */
    paginaJuego({titulo, emoji, ins, ficha}){
      const fichaEs = ficha; ficha = ficha && (window.FICHA_EN||{})[ficha] || ficha;
      const c = J.$(".juego-cab");
      if(!c) return;
      c.innerHTML = `<span style="font-size:2.6rem">${emoji}</span><h1>${titulo}</h1>
        <div class="acciones"><button class="btn sec peq" id="b-ins">📖 How to play</button>
        ${ficha?(ENCI_EN?`<a class="btn sec peq" href="${raiz}encyclopedia/${ficha}.html">📚 History</a>`:`<a class="btn sec peq" href="/enciclopedia/${fichaEs}.html" hreflang="es" title="In Spanish for now">📚 History (Spanish)</a>`):""}
        <a class="btn sec peq" href="${raiz}index.html#play">🎮 More games</a></div>`;
      J.$("#b-ins").onclick = () => J.instrucciones(ins);
      const clave = "jp-visto-"+titulo;
      let visto = false; try{ visto = localStorage.getItem(clave); localStorage.setItem(clave,"1"); }catch(e){}
      if(!visto) setTimeout(()=>J.instrucciones(ins), 300);
      if(ficha && ENCI_EN) J.historiaJuego(ficha);
    },
    /* Bloque «La historia de…» debajo del tablero, con datos de la enciclopedia */
    historiaJuego(slug){
      const pon = () => {
        const f = (window.FICHAS||[]).find(x => x.slug === slug);
        if (!f || document.querySelector(".historia-juego")) return;
        const esc = t => String(t).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
        const a = J.el("a", {class: "historia-juego", href: raiz + "encyclopedia/" + slug + ".html"});
        a.innerHTML = (f.foto ? `<img src="/enciclopedia/img/mini/${f.foto}" alt="${esc(f.pie || f.nombre)}" loading="lazy">` : `<span class="em">${f.emoji}</span>`)
          + `<div><h2>📜 ${esc(f.nombre)}: history and fun facts</h2><p>${esc(f.resumen)} Origin: ${esc(f.epoca)}.</p><p>💡 ${esc(f.curiosidad)}</p><b>Read the full history, anecdotes and fun facts →</b></div>`;
        const main = document.querySelector("main") || document.body;
        main.append(a);
      };
      if (window.FICHAS) return pon();
      const sc = document.createElement("script");
      sc.src = raiz + "encyclopedia/data.js?v=" + (document.querySelector('script[src*="comun.js"]')?.src.split("v=")[1] || "1");
      sc.onload = pon; document.head.append(sc);
    },
    /* Baraja española de 40 cartas: v = 1..7, 10 (sota), 11 (caballo), 12 (rey) */
    PALOS_ESP: ["oros","copas","espadas","bastos"],
    SIMB_ESP: {oros:"🪙", copas:"🏆", espadas:"🗡️", bastos:"🪵"},
    COLOR_ESP: {oros:"#b8860b", copas:"#c1121f", espadas:"#1d4ed8", bastos:"#2d6a4f"},
    mazoEsp(){ const m=[]; for(const p of J.PALOS_ESP) for(const v of [1,2,3,4,5,6,7,10,11,12]) m.push({p,v}); return m; },
    PALO_EN: {oros:"coins", copas:"cups", espadas:"swords", bastos:"clubs"},
    nombreEsp: c => ({1:"Ace",10:"Jack",11:"Knight",12:"King"}[c.v]||String(c.v))+" of "+J.PALO_EN[c.p],
    naipeEsp(c, ancho, bocaAbajo=false){
      const d = J.el("div",{class:"naipe esp"+(bocaAbajo?" dorso":"")});
      if(ancho) d.style.setProperty("--nw", ancho+"px");
      if(!bocaAbajo){
        const col = J.COLOR_ESP[c.p], s = J.SIMB_ESP[c.p];
        const fig = {10:"S",11:"C",12:"R"}[c.v];
        d.style.color = col; d.style.borderColor = col;
        d.title = J.nombreEsp(c);
        d.innerHTML = `<div class="esq">${c.v}</div><div class="centro">${s}</div>${fig?`<div class="figesp">${{S:"Jack",C:"Knight",R:"King"}[fig]}</div>`:""}<div class="esq b">${c.v}</div>`;
      }
      return d;
    },
    dado(n){ const P={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}; const d=J.el("div",{class:"dado3d"}); d.innerHTML=[...Array(9)].map((_,i)=>`<i style="${(P[n]||[]).includes(i)?"visibility:visible":""}"></i>`).join(""); return d; },
    guarda(k,v){ try{localStorage.setItem("jp-"+k,JSON.stringify(v));}catch(e){} },
    lee(k,def){ try{const v=localStorage.getItem("jp-"+k); return v===null?def:JSON.parse(v);}catch(e){return def;} },
    /* Naipes franceses */
    PALOS: ["♠","♥","♦","♣"],
    VALORES: ["A","2","3","4","5","6","7","8","9","10","J","Q","K"],
    mazo(){ const m=[]; for(const p of J.PALOS) for(let v=1;v<=13;v++) m.push({p,v}); return m; },
    nombreValor: v => J.VALORES[v-1],
    esRojo: c => c.p==="♥"||c.p==="♦",
    naipe(c, ancho, bocaAbajo=false){
      const d = J.el("div",{class:"naipe"+(bocaAbajo?" dorso":(J.esRojo(c)?" rojo":""))});
      if(ancho) d.style.setProperty("--nw", ancho+"px");
      if(!bocaAbajo){
        const v = J.nombreValor(c.v);
        const fig = c.v>10 ? `<div class="centro fig">${v}${c.p}</div>` : `<div class="centro">${c.p}</div>`;
        d.innerHTML = `<div class="esq">${v}<br>${c.p}</div>${fig}<div class="esq b">${v}<br>${c.p}</div>`;
      }
      return d;
    }
  };
})();

/* Sister sites in the footer (same block as the Spanish site; lang="en" links to the /en/ versions) */
(function () {
  function poner() {
    try {
      var f = document.querySelector('footer.pie'); if (!f) return;
      var webs = ['classicapedia.com', 'pinacopedia.com', 'filopedia.com', 'cinematopedia.com', 'medicapedia.org', 'tenispedia.com', 'newtonpedia.com', 'culinapedia.com', 'mythicapedia.com', 'zodiacopedia.com', 'ludicopedia.com', 'catdogpedia.com'];
      var conEn = ['classicapedia.com', 'pinacopedia.com', 'filopedia.com', 'cinematopedia.com', 'medicapedia.org', 'tenispedia.com', 'newtonpedia.com', 'culinapedia.com', 'mythicapedia.com', 'zodiacopedia.com', 'catdogpedia.com', 'ludicopedia.com'];
      var host = location.hostname.replace(/^www\./, '');
      var html = webs.map(function (d) {
        if (d === host) return '<strong>' + d + '</strong>';
        return '<a href="https://' + d + '/' + (conEn.indexOf(d) >= 0 ? 'en/' : '') + '">' + d + '</a>';
      }).join(' · ');
      var p = document.createElement('p'); p.className = 'webs-hermanas'; p.style.margin = '.8em 0 0';
      (f.querySelector('.contenedor') || f).appendChild(p);
      p.innerHTML = 'Sister sites: ' + html;
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poner); else poner();
})();

/* Google Analytics G-GE3T2RZVV2: only loaded if statistics are accepted in the cookie notice (consent mode v2, everything denied by default) */
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
(function(){
  var ID='G-GE3T2RZVV2';
  function cargar(){if(window.gaCargado)return;window.gaCargado=true;gtag('consent','update',{analytics_storage:'granted'});
    var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+ID;document.head.appendChild(s);gtag('js',new Date());gtag('config',ID);}
  function borrar(){document.cookie.split(';').forEach(function(c){var n=c.split('=')[0].trim();if(/^_ga/.test(n))['','.ludicopedia.com','ludicopedia.com'].forEach(function(d){document.cookie=n+'=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'+(d?';domain='+d:'');});});}
  try{var v=JSON.parse(localStorage.getItem('aviso-cookies'));if(v&&v.v===2&&v.estadisticas&&Date.now()-v.d<365*864e5)cargar();}catch(e){}
  document.addEventListener('avisocookies',function(e){if(e.detail&&e.detail.estadisticas)cargar();else{if(window.gaCargado)gtag('consent','update',{analytics_storage:'denied'});borrar();}});
})();
/* Cookie notice settings (version 2, shared with the Spanish site: a choice made in one language counts for both) */
window.AVISO_COOKIES={politica:{en:"/en/legal/cookies.html",es:"/legal/cookies.html"},color:"#5b3cc4",version:2,textos:{
  en:{p:'We use what is needed for the site to work and, if you agree, Google Analytics to learn which pages and games are visited and improve the site. We do not use advertising cookies. You can change your mind at any time in “Cookie settings” at the bottom of the page.',estD:'Google Analytics: which pages and games are visited and where visitors come from, in aggregate. Only if you agree.'}}};
/* Cookie notice (GDPR / LSSI) · same code as the Spanish site
   Categories: necessary (always), estadisticas, publicidad. Stored in localStorage 'aviso-cookies' for 12 months.
   API: window.avisoCookies.abrir(), .permiso('estadisticas'), 'avisocookies' event on document. */
(function () {
  var C = window.AVISO_COOKIES || {}, d = document, CLAVE = 'aviso-cookies', VERSION = C.version || 1, DOCE_MESES = 365 * 864e5;
  var L = (d.documentElement.lang || 'en').slice(0, 2);
  var TX = {
    es: { t: 'Cookies', p: 'Usamos solo lo necesario para que la web funcione. Con tu permiso podríamos usar también cookies de estadísticas y de publicidad. Puedes cambiar de opinión cuando quieras en «Configurar cookies», al pie de la página.', mas: 'Política de cookies', ok: 'Aceptar', no: 'Rechazar', conf: 'Configurar', guardar: 'Guardar mi elección', todo: 'Aceptar todas', nec: 'Necesarias', necD: 'Hacen que la web funcione y recuerdan tus preferencias (idioma, esta elección). Siempre activas.', est: 'Estadísticas', estD: 'Nos dirían qué páginas se visitan, de forma agregada. Ahora no se usan.', pub: 'Publicidad', pubD: 'Anuncios y medición de anuncios. Ahora no se usan.', siempre: 'Siempre activas', pie: 'Configurar cookies', cerrar: 'Cerrar' },
    en: { t: 'Cookies', p: 'We only use what is needed for the site to work. With your permission we could also use statistics and advertising cookies. You can change your mind at any time in “Cookie settings” at the bottom of the page.', mas: 'Cookie policy', ok: 'Accept', no: 'Reject', conf: 'Settings', guardar: 'Save my choice', todo: 'Accept all', nec: 'Necessary', necD: 'They make the site work and remember your preferences (language, this choice). Always on.', est: 'Statistics', estD: 'They would tell us which pages are visited, in aggregate. Not used at the moment.', pub: 'Advertising', pubD: 'Ads and ad measurement. Not used at the moment.', siempre: 'Always on', pie: 'Cookie settings', cerrar: 'Close' }
  };
  var t = TX[L] || TX.en; if (C.textos && C.textos[L]) for (var k in C.textos[L]) t[k] = C.textos[L][k];
  var POL = (C.politica || {})[L] || (C.politica || {}).en || '#';

  function leer() { try { var v = JSON.parse(localStorage.getItem(CLAVE)); if (v && v.v === VERSION && Date.now() - v.d < DOCE_MESES) return v; } catch (e) {} return null; }
  function guardar(est, pub) {
    var v = { v: VERSION, d: Date.now(), estadisticas: !!est, publicidad: !!pub };
    try { localStorage.setItem(CLAVE, JSON.stringify(v)); } catch (e) {}
    activar(v); cerrar();
    try { d.dispatchEvent(new CustomEvent('avisocookies', { detail: v })); } catch (e) {}
  }
  function activar(v) {
    d.querySelectorAll('script[type="text/plain"][data-cookies]').forEach(function (s) {
      if (!v[s.dataset.cookies] || s.dataset.hecho) return; s.dataset.hecho = 1;
      var n = d.createElement('script'); if (s.src) n.src = s.src; else n.text = s.text; d.head.appendChild(n);
    });
  }

  var css = '#avc{position:fixed;left:16px;right:16px;bottom:16px;z-index:900;max-width:560px;margin:0 auto 0 0;background:#fff;color:#1d2327;border:1px solid rgba(0,0,0,.12);border-radius:14px;box-shadow:0 10px 36px rgba(0,0,0,.18);padding:18px 18px 16px;font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '#avc[hidden]{display:none}#avc h2{font-size:16px;margin:0 0 6px;font-weight:700;color:inherit;font-family:inherit}#avc p{margin:0 0 12px}#avc a{color:' + (C.color || '#155e63') + ';text-decoration:underline}' +
    '#avc .avb{display:flex;flex-wrap:wrap;gap:8px}#avc button{flex:1 1 auto;min-width:110px;font-family:inherit;font-weight:600;font-size:14px;line-height:1.15;padding:11px 14px;border-radius:9px;cursor:pointer;border:1.5px solid ' + (C.color || '#155e63') + ';background:' + (C.color || '#155e63') + ';color:' + (C.texto || '#fff') + '}' +
    '#avc button.sec{background:transparent;color:' + (C.color || '#155e63') + '}#avc button:focus-visible{outline:3px solid #f0b400;outline-offset:2px}' +
    '#avc .avcat{border-top:1px solid #e6e8ea;padding:10px 0;display:flex;gap:12px;align-items:flex-start;justify-content:space-between}#avc .avcat b{display:block}#avc .avcat small{color:#5b6670;display:block;font-size:12.5px}' +
    '#avc input{width:20px;height:20px;margin-top:2px;accent-color:' + (C.color || '#155e63') + ';flex:none}#avc .fijo{font-size:12px;color:#5b6670;white-space:nowrap}' +
    '@media(max-width:600px){#avc{left:8px;right:8px;bottom:8px;padding:14px;font-size:13.5px}#avc button{min-width:0;padding:11px 10px}}' +
    '.avc-pie{background:none;border:0;padding:0;font:inherit;color:inherit;text-decoration:underline;cursor:pointer;opacity:.9}';
  var caja;
  function montar() {
    if (caja) return caja;
    var st = d.createElement('style'); st.textContent = css; d.head.appendChild(st);
    caja = d.createElement('div'); caja.id = 'avc'; caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-labelledby', 'avc-t'); caja.hidden = true;
    d.body.appendChild(caja); return caja;
  }
  function vistaInicial() {
    montar().innerHTML = '<h2 id="avc-t">🍪 ' + t.t + '</h2><p>' + t.p + ' <a href="' + POL + '">' + t.mas + '</a></p>' +
      '<div class="avb"><button type="button" data-a="no">' + t.no + '</button><button type="button" class="sec" data-a="conf">' + t.conf + '</button><button type="button" data-a="ok">' + t.ok + '</button></div>';
    eventos();
  }
  function vistaConfig() {
    var v = leer() || {};
    var fila = function (k, nom, des) { return '<label class="avcat"><span><b>' + nom + '</b><small>' + des + '</small></span><input type="checkbox" data-k="' + k + '"' + (v[k] ? ' checked' : '') + '></label>'; };
    montar().innerHTML = '<h2 id="avc-t">🍪 ' + t.t + '</h2><p><a href="' + POL + '">' + t.mas + '</a></p>' +
      '<div class="avcat"><span><b>' + t.nec + '</b><small>' + t.necD + '</small></span><span class="fijo">' + t.siempre + '</span></div>' +
      fila('estadisticas', t.est, t.estD) + fila('publicidad', t.pub, t.pubD) +
      '<div class="avb" style="margin-top:6px"><button type="button" data-a="no">' + t.no + '</button><button type="button" class="sec" data-a="guardar">' + t.guardar + '</button><button type="button" data-a="ok">' + t.todo + '</button></div>';
    eventos();
  }
  function eventos() {
    caja.querySelectorAll('button[data-a]').forEach(function (b) {
      b.onclick = function () {
        var a = b.dataset.a;
        if (a === 'ok') guardar(1, 1);
        else if (a === 'no') guardar(0, 0);
        else if (a === 'conf') { vistaConfig(); var i = caja.querySelector('input'); if (i) i.focus(); }
        else if (a === 'guardar') guardar(caja.querySelector('[data-k=estadisticas]').checked, caja.querySelector('[data-k=publicidad]').checked);
      };
    });
  }
  function abrir(config) { if (config) vistaConfig(); else vistaInicial(); caja.hidden = false; }
  function cerrar() { if (caja) caja.hidden = true; }
  function enlacePie() {
    var f = d.querySelector('footer'); if (!f || f.querySelector('.avc-pie')) return;
    var b = d.createElement('button'); b.type = 'button'; b.className = 'avc-pie'; b.textContent = t.pie; b.onclick = function () { abrir(true); var i = caja.querySelector('input'); if (i) i.focus(); };
    var ref = null; f.querySelectorAll('a').forEach(function (a) { if (!ref && POL !== '#' && (a.getAttribute('href') === POL || a.pathname === POL)) ref = a; });
    if (ref) {
      var li = ref.closest('li');
      if (li) { var nli = d.createElement('li'); nli.appendChild(b); li.parentNode.insertBefore(nli, li.nextSibling); }
      else { var cs = getComputedStyle(ref); b.style.fontSize = cs.fontSize; b.style.color = cs.color; ref.parentNode.insertBefore(b, ref.nextSibling); if (cs.display === 'block') { b.style.display = 'block'; b.style.margin = cs.marginTop + ' 0 ' + cs.marginBottom; b.style.textAlign = 'left'; } else ref.parentNode.insertBefore(d.createTextNode(' · '), b); }
    } else {
      var p = d.createElement('p'); p.style.cssText = 'text-align:center;font-size:13px;margin:10px 0 0'; p.appendChild(b); f.appendChild(p);
    }
  }
  function inicio() {
    var v = leer();
    enlacePie();
    if (v) activar(v); else abrir(false);
  }
  window.avisoCookies = { abrir: function () { abrir(true); }, permiso: function (k) { var v = leer(); return !!(v && v[k]); } };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', inicio); else inicio();
})();

/* keep the notice's own colours even in dark mode */
(function(){var s=document.createElement('style');s.textContent='#avc,#avc h2,#avc p,#avc b{color:#1d2327}#avc small{color:#5b6670!important}';document.head.appendChild(s);})();
