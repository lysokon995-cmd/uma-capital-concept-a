(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('site-data').textContent);
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let lang = 0, activeProperty = 0, dialogProperty = 0, photoIndex = 0, returnFocus = null;
  const dialog = $('.property-dialog'), menu = $('#mobile-menu'), menuButton = $('.menu-toggle');
  const choose = pair => pair[lang];
  const strings = {play:['Воспроизвести видео','Play video'],pause:['Приостановить видео','Pause video'],close:['Закрыть','Close'],openMenu:['Открыть меню','Open menu'],closeMenu:['Закрыть меню','Close menu']};
  function syncLock(){document.body.classList.toggle('locked',dialog.open || !menu.hidden)}
  function closeMenu(focus=false){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label',choose(strings.openMenu));syncLock();if(focus)menuButton.focus()}
  menuButton.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',choose(open?strings.closeMenu:strings.openMenu));syncLock();if(open) $('a',menu).focus()});
  $$('a',menu).forEach(a=>a.addEventListener('click',()=>closeMenu()));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!menu.hidden){closeMenu(true);return}
    if(e.key==='Tab'&&!menu.hidden){const els=[menuButton,...$$('a,button',menu)];const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
  });
  matchMedia('(min-width:901px)').addEventListener('change',e=>{if(e.matches)closeMenu()});
  new IntersectionObserver(([entry])=>$('.site-header').classList.toggle('scrolled',!entry.isIntersecting)).observe($('.header-sentinel'));
  // Content is visible without JavaScript; reveal is enabled only after observation is ready.
  if(!reduced.matches){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});$$('.reveal').forEach(el=>{el.classList.add('ready');observer.observe(el)})}
  reduced.addEventListener('change',()=>{if(reduced.matches){$$('.reveal').forEach(el=>el.classList.add('visible'));video.pause();userPaused=true}});
  const video=$('.hero-video'),videoButton=$('.video-control');let userPaused=reduced.matches, videoVisible=true;
  video.muted=true;video.defaultMuted=true;video.autoplay=!reduced.matches;
  const mobileVideo=matchMedia('(max-width:767px)').matches;
  video.poster=mobileVideo?'assets/hero-poster-mobile.jpg':'assets/hero-poster.jpg';
  video.src=mobileVideo?'assets/hero-mobile.mp4':'assets/hero-desktop.mp4';
  function videoUI(){videoButton.setAttribute('aria-label',choose(video.paused?strings.play:strings.pause));$('.video-symbol').textContent=video.paused?'▶':'Ⅱ';videoButton.setAttribute('aria-pressed',String(!video.paused))}
  function tryPlay(){if(!userPaused&&!document.hidden&&videoVisible&&!dialog.open&&menu.hidden)video.play().catch(()=>videoUI())}
  // The poster remains visible when autoplay is blocked or reduced motion is requested.
  if(!reduced.matches)video.play().catch(()=>videoUI());
  $('.hero-visual').addEventListener('animationend',()=>tryPlay(),{once:true});
  video.addEventListener('play',videoUI);video.addEventListener('pause',videoUI);video.addEventListener('error',()=>{videoUI();videoButton.hidden=true});
  videoButton.addEventListener('click',()=>{if(video.paused){userPaused=false;video.play().catch(()=>videoUI())}else{userPaused=true;video.pause()}});
  new IntersectionObserver(([e])=>{videoVisible=e.isIntersecting;if(!videoVisible)video.pause();else tryPlay()},{threshold:.1}).observe(video);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else tryPlay()});
  function renderFeature(){const panel=$('#property-panel');if(!panel)return;const p=data.properties[activeProperty];const photo=$('.feature-image img',panel);photo.src=`assets/${p.image}.jpg`;if(p.image==='central')photo.srcset='assets/central-small.jpg 640w, assets/central.jpg 1600w';else photo.removeAttribute('srcset');photo.alt=choose(p.name);$('.property-tag',panel).textContent=choose(p.tag);$('h3',panel).textContent=choose(p.name);$('.feature-description',panel).textContent=choose(p.desc);$('.feature-stat strong',panel).textContent=p.area;$('[data-property]',panel).dataset.property=activeProperty;panel.setAttribute('aria-labelledby',`tab-${activeProperty}`);$$('[data-tab]').forEach(b=>{let on=Number(b.dataset.tab)===activeProperty;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1})}
  $$('[data-tab]').forEach(b=>{b.addEventListener('click',()=>{activeProperty=Number(b.dataset.tab);renderFeature()});b.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(activeProperty+1)%3;if(e.key==='ArrowLeft')next=(activeProperty+2)%3;if(e.key==='Home')next=0;if(e.key==='End')next=2;if(next!==undefined){e.preventDefault();activeProperty=next;renderFeature();$(`[data-tab="${next}"]`).focus()}})});
  function renderPhoto(){const p=data.properties[dialogProperty],photos=[p.image,p.other,p.inside];$('.dialog-image').src=`assets/${photos[photoIndex]}.jpg`;$('.dialog-image').alt=choose(p.name)+(lang?' • Photo ':' • Фото ')+(photoIndex+1);$('.gallery-count').textContent=`${photoIndex+1} / ${photos.length}`}
  function renderDialog(){const p=data.properties[dialogProperty];$('#dialog-title').textContent=choose(p.name);$('.property-tag',dialog).textContent=choose(p.tag);$('.dialog-description').textContent=choose(p.desc);$('.dialog-address').textContent=choose(p.address);$('.dialog-area').textContent=p.area;$('.dialog-parking').textContent=p.parking;renderPhoto()}
  $$('[data-property]').forEach(b=>b.addEventListener('click',()=>{returnFocus=b;dialogProperty=Number(b.dataset.property);photoIndex=0;renderDialog();dialog.showModal();dialog.scrollTop=0;syncLock();video.pause();$('.dialog-close').focus()}));
  $('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
  dialog.addEventListener('close',()=>{syncLock();returnFocus?.focus({preventScroll:true});tryPlay()});
  function nextPhoto(dir){photoIndex=(photoIndex+dir+3)%3;renderPhoto()}
  $('.gallery-prev').addEventListener('click',()=>nextPhoto(-1));$('.gallery-next').addEventListener('click',()=>nextPhoto(1));
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();nextPhoto(1)}if(e.key==='ArrowLeft'){e.preventDefault();nextPhoto(-1)}});
  // Native vertical scrolling is preserved; a horizontal swipe advances the gallery.
  let start=null;$('.dialog-gallery').addEventListener('touchstart',e=>{start={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY}},{passive:true});$('.dialog-gallery').addEventListener('touchend',e=>{if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)nextPhoto(dx<0?1:-1);start=null},{passive:true});
  function translate(){document.documentElement.lang=lang?'en':'ru';$$('[data-i18n]').forEach(el=>el.innerHTML=data.translations[el.dataset.i18n][lang]);$('.language').textContent=lang?'RU':'EN';$('.language').setAttribute('aria-label',lang?'Переключить на русский':'Switch to English');document.title=lang?'UMA Capital | Space for business':'UMA Capital | Пространство для бизнеса';$('.dialog-close').setAttribute('aria-label',choose(strings.close));menuButton.setAttribute('aria-label',choose(menu.hidden?strings.openMenu:strings.closeMenu));$('.gallery-prev').setAttribute('aria-label',lang?'Previous photo':'Предыдущее фото');$('.gallery-next').setAttribute('aria-label',lang?'Next photo':'Следующее фото');renderFeature();if(dialog.open)renderDialog();videoUI()}
  $('.language').addEventListener('click',()=>{lang=1-lang;translate()});
  renderFeature();videoUI();
})();
