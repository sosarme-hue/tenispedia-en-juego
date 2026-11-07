(function(){var I=[].slice.call(document.querySelectorAll('img.zoom'));if(!I.length)return;var es=document.documentElement.lang!=='en',i=0;
var o=document.createElement('div');o.className='lb';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
o.innerHTML='<button class="lb-x" aria-label="'+(es?'Cerrar':'Close')+'">×</button><button class="lb-a lb-p" aria-label="'+(es?'Anterior':'Previous')+'">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-a lb-n" aria-label="'+(es?'Siguiente':'Next')+'">›</button>';
document.body.appendChild(o);var im=o.querySelector('img'),fc=o.querySelector('figcaption');
im.addEventListener('click',function(ev){ev.stopPropagation();im.classList.toggle('z2')});
function ver(k){i=(k+I.length)%I.length;var x=I[i];im.classList.remove('z2');im.src=x.getAttribute('data-g')||x.src;im.alt=x.alt;var c=x.getAttribute('data-cr')||'',u=x.getAttribute('data-url'),t=x.getAttribute('data-t')||x.alt;
fc.innerHTML='<b>'+t+'</b>'+(c?' · '+c:'')+(I.length>1?' · '+(i+1)+' / '+I.length:'')+(u?' · <a href="'+u+'" target="_blank" rel="nofollow noopener">'+(es?'Original en alta resolución y licencia':'Full-resolution original and licence')+'</a>':'');
o.querySelector('.lb-p').style.display=o.querySelector('.lb-n').style.display=I.length>1?'':'none';o.classList.add('on');document.body.style.overflow='hidden'}
function cierra(){o.classList.remove('on');document.body.style.overflow=''}
I.forEach(function(x,k){x.style.cursor='zoom-in';x.setAttribute('tabindex','0');x.addEventListener('click',function(ev){ev.preventDefault();ver(k)});x.addEventListener('keydown',function(ev){if(ev.key==='Enter')ver(k)})});
o.addEventListener('click',function(ev){if(ev.target===o||ev.target.classList.contains('lb-x'))cierra()});
o.querySelector('.lb-p').addEventListener('click',function(ev){ev.stopPropagation();ver(i-1)});o.querySelector('.lb-n').addEventListener('click',function(ev){ev.stopPropagation();ver(i+1)});
document.addEventListener('keydown',function(ev){if(!o.classList.contains('on'))return;if(ev.key==='Escape')cierra();if(ev.key==='ArrowLeft')ver(i-1);if(ev.key==='ArrowRight')ver(i+1)})})();