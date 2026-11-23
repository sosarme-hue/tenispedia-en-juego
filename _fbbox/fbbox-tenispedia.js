/*fbbox 2026-11-23: recuadro Síguenos en Facebook*/
window.__FBBOX={url:'https://www.facebook.com/profile.php?id=61596818732618',def:'es',bg:'#0b4d2c',fg:'#fff',btn:'#d8e84a',btnfg:'#0b4d2c',
t:{es:['Síguenos en Facebook','Cada día, un tenista, un partido de leyenda y un reto para poner a prueba lo que sabes de tenis.','Seguir en Facebook'],
en:['Follow us on Facebook','Every day: a player, a legendary match and a quiz to test what you know about tennis.','Follow on Facebook']}};
/* Recuadro «Síguenos en Facebook» (se añade al final del JS común de cada web) */
(function () {
  var C = window.__FBBOX; if (!C || document.getElementById('fbbox')) return;
  var lang = (document.documentElement.lang || 'es').slice(0, 2);
  var T = C.t[lang] || C.t[C.def];
  var css = '#fbbox{max-width:' + (C.max || 1100) + 'px;margin:32px auto 24px;padding:0 16px;box-sizing:border-box;font-family:inherit}' +
    '#fbbox .fbb{display:flex;align-items:center;gap:18px;flex-wrap:wrap;background:' + C.bg + ';color:' + C.fg + ';border-radius:16px;padding:20px 22px;box-shadow:0 4px 18px rgba(0,0,0,.08)}' +
    '#fbbox .fbi{flex:none;width:52px;height:52px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center}' +
    '#fbbox .fbt{flex:1 1 260px;min-width:0}#fbbox .fbt b{display:block;font-size:1.15em;margin-bottom:4px;color:' + C.fg + '}' +
    '#fbbox .fbt span{opacity:.9;font-size:.97em;line-height:1.45}' +
    '#fbbox a.fbbtn{box-sizing:border-box;flex:none;display:inline-flex;align-items:center;gap:8px;background:' + C.btn + ';color:' + C.btnfg + ';text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;font-size:1em;white-space:nowrap}' +
    '#fbbox a.fbbtn:hover{filter:brightness(1.08)}@media(max-width:560px){#fbbox a.fbbtn{width:100%;justify-content:center}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var ico = '<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/></svg>';
  var d = document.createElement('section'); d.id = 'fbbox'; d.setAttribute('aria-label', 'Facebook');
  d.innerHTML = '<div class="fbb"><div class="fbi">' + ico + '</div><div class="fbt"><b>' + T[0] + '</b><span>' + T[1] + '</span></div>' +
    '<a class="fbbtn" href="' + C.url + '" target="_blank" rel="noopener">' + T[2] + ' →</a></div>';
  function put() { var f = document.querySelector('footer'); if (f && f.parentNode) f.parentNode.insertBefore(d, f); else document.body.appendChild(d); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', put); else put();
})();
