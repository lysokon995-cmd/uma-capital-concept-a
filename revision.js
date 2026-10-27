(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const script = document.currentScript || $$('script[src]').find(s => new URL(s.src).pathname.endsWith('/revision.js'));
  const root = new URL('.', script.src);
  const url = s => new URL(s, root).href;
  let lang = 'ru';
  try { if (sessionStorage.getItem('uma-lang') === 'en') lang = 'en'; } catch {}
  const menu = $('#mobile-menu'), toggle = $('.menu-toggle');
  const gallery = $('.gallery-dialog'), cookieDialog = $('.cookie-dialog');
  const banner = $('.cookie-banner'), mapSwitch = $('#cookie-maps');
  const storageKey = 'uma-privacy-v3';
  let preferences = { essential: true, maps: false }, hasChoice = false;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && saved.version === 3 && typeof saved.maps === 'boolean') {
      preferences.maps = saved.maps;
      hasChoice = true;
    }
  } catch {}
  let cookieReturnFocus = null, pendingMap = null;
  const mapControllers = [];
  const lock = () => document.body.classList.toggle('locked', !menu.hidden || gallery.open || cookieDialog.open);

  function closeMenu(focus = false) {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', lang === 'ru' ? 'Открыть меню' : 'Open menu');
    lock();
    if (focus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    toggle.setAttribute('aria-expanded', String(!menu.hidden));
    toggle.setAttribute('aria-label', lang === 'ru' ? (menu.hidden ? 'Открыть меню' : 'Закрыть меню') : (menu.hidden ? 'Open menu' : 'Close menu'));
    lock();
    if (!menu.hidden) $('a', menu).focus();
  });
  $$('a', menu).forEach(a => a.addEventListener('click', () => closeMenu()));
  matchMedia('(min-width:901px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) closeMenu(true);
    if (e.key === 'Tab' && !menu.hidden) {
      const items = [toggle, ...$$('a,button', menu)], first = items[0], last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  new IntersectionObserver(([e]) => $('.site-header').classList.toggle('scrolled', !e.isIntersecting)).observe($('.header-sentinel'));
  if (!reduced.matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    }), { threshold: .05 });
    $$('.reveal').forEach(e => { e.classList.add('ready'); observer.observe(e); });
  }
  reduced.addEventListener('change', () => { if (reduced.matches) $$('.reveal').forEach(e => e.classList.add('visible')); });

  const titles = { 'Главная': 'Home', 'О компании': 'About', 'Объекты': 'Properties', 'Эксплуатация': 'Operations', 'Команда': 'Team', 'Контакты': 'Contacts', 'Документы': 'Documents', 'Политика конфиденциальности': 'Privacy policy', 'Политика cookie': 'Cookie policy', 'Вознесенский': 'Voznesensky', 'Литис': 'Litis' };
  const originalTitle = document.title;
  let properties = [], active = 0;
  function translate() {
    document.documentElement.lang = lang;
    const title = originalTitle.replace(/ — UMA Capital$/, '');
    document.title = (lang === 'en' ? titles[title] || title : title) + ' — UMA Capital';
    $$('[data-ru][data-en]').forEach(e => { e.innerHTML = e.dataset[lang]; });
    $('.language').textContent = lang === 'ru' ? 'EN' : 'RU';
    $('.language').setAttribute('aria-label', lang === 'ru' ? 'Switch to English' : 'Переключить на русский');
    const labels = {
      '.desktop-nav': 'Main navigation', '#mobile-menu': 'Mobile navigation', '.breadcrumbs': 'Breadcrumbs',
      '.skip': 'Skip to content', '.gallery-dialog': 'Property gallery', '.gallery-close': 'Close gallery',
      '[data-gallery-prev]': 'Previous photo', '[data-gallery-next]': 'Next photo',
      '.property-tabs': 'Business centres', '.cookie-banner': 'Cookie preferences',
      '[data-cookie-close]': 'Close preferences', '.table-wrap': 'Compare business centres', '.back-to-top': 'Back to top'
    };
    Object.entries(labels).forEach(([selector, en]) => $$(selector).forEach(e => {
      if (!e.dataset.ariaRu) e.dataset.ariaRu = e.getAttribute('aria-label') || e.textContent.trim();
      e.setAttribute('aria-label', lang === 'en' ? en : e.dataset.ariaRu);
    }));
    toggle.setAttribute('aria-label', lang === 'en' ? (menu.hidden ? 'Open menu' : 'Close menu') : (menu.hidden ? 'Открыть меню' : 'Закрыть меню'));
    $$('.brand').forEach(e => e.setAttribute('aria-label', lang === 'en' ? 'UMA Capital home' : 'UMA Capital — главная'));
    $$('[data-gallery]').forEach((e, i) => {
      if (!e.dataset.ariaRu) e.dataset.ariaRu = e.getAttribute('aria-label');
      e.setAttribute('aria-label', lang === 'en' ? 'Open property photo ' + (i + 1) : e.dataset.ariaRu);
    });
    mapControllers.forEach(m => m.updateLanguage());
    if (properties.length) renderProperty();
  }
  $('.language').addEventListener('click', () => {
    lang = lang === 'ru' ? 'en' : 'ru';
    try { sessionStorage.setItem('uma-lang', lang); } catch {}
    translate();
  });

  // The hero loops continuously while it is on screen; no pause control is shown.
  const video = $('video');
  let videoVisible = true;
  function playVideo() { if (video && videoVisible && !document.hidden) video.play().catch(() => {}); }
  if (video) {
    const mobile = matchMedia('(max-width:767px)').matches;
    video.poster = url(mobile ? 'assets/hero-poster-mobile.jpg' : 'assets/hero-poster.jpg');
    video.src = url(mobile ? video.dataset.mobile : video.dataset.desktop);
    video.muted = true; video.defaultMuted = true; video.autoplay = true; video.loop = true;
    new IntersectionObserver(([e]) => { videoVisible = e.isIntersecting; if (videoVisible) playVideo(); else video.pause(); }, { threshold: .01 }).observe(video);
    document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); else playVideo(); });
    playVideo();
  }

  function renderProperty() {
    const p = properties[active], panel = $('#property-panel');
    if (!p || !panel) return;
    const en = lang === 'en', im = $('.feature-image img', panel);
    im.src = url('assets/' + p.img + '.jpg');
    if (p.image) {
      im.src = url(p.image.src);
      im.srcset = p.image.variants.map(v => url(v.src) + ' ' + v.width + 'w').join(', ');
      im.width = p.image.width; im.height = p.image.height;
    } else im.removeAttribute('srcset');
    im.alt = en ? p.en : p.name;
    $('.feature-image', panel).href = $('.feature-link', panel).href = url('properties/' + p.slug + '/');
    const enquiry = $('.feature-enquiry', panel);
    if (enquiry) enquiry.href = 'mailto:arenda@umacapital.ru?subject=' + encodeURIComponent('Аренда — ' + p.name);
    $('.property-tag', panel).textContent = en ? p.etag : p.tag;
    $('h3', panel).textContent = en ? p.en : p.name;
    $('.feature-description', panel).textContent = en ? p.euse : p.use;
    $('.feature-stat strong', panel).textContent = p.area;
    panel.setAttribute('aria-labelledby', 'tab-' + active);
    $$('[data-tab]').forEach(b => { const on = +b.dataset.tab === active; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  }
  if ($('#property-panel')) fetch(url('properties.json?v=20261027-polish')).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { properties = data; renderProperty(); }).catch(() => {});
  $$('[data-tab]').forEach(b => {
    b.addEventListener('click', () => { active = +b.dataset.tab; renderProperty(); });
    b.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') active = (active + 1) % 3;
      else if (e.key === 'ArrowLeft') active = (active + 2) % 3;
      else if (e.key === 'Home') active = 0;
      else if (e.key === 'End') active = 2;
      else return;
      e.preventDefault(); renderProperty(); $('[data-tab="' + active + '"]').focus();
    });
  });

  const thumbs = $$('[data-gallery]');
  let photo = 0, galleryReturnFocus = null;
  function renderPhoto() {
    const b = thumbs[photo], im = $('img', gallery);
    im.src = b.dataset.gallery;
    im.alt = lang === 'en' ? 'Property photo ' + (photo + 1) : b.dataset.galleryLabel;
    $('.gallery-count', gallery).textContent = `${photo + 1} / ${thumbs.length}`;
  }
  thumbs.forEach((b, i) => b.addEventListener('click', () => {
    photo = i; galleryReturnFocus = b; renderPhoto(); gallery.showModal(); lock(); $('.gallery-close', gallery).focus();
  }));
  function move(d) { if (thumbs.length) { photo = (photo + d + thumbs.length) % thumbs.length; renderPhoto(); } }
  $('.gallery-close', gallery).addEventListener('click', () => gallery.close());
  $('[data-gallery-prev]', gallery).addEventListener('click', () => move(-1));
  $('[data-gallery-next]', gallery).addEventListener('click', () => move(1));
  gallery.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); move(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); } });
  gallery.addEventListener('close', () => { lock(); galleryReturnFocus?.focus({ preventScroll: true }); });
  gallery.addEventListener('click', e => { if (e.target === gallery) gallery.close(); });
  let start;
  gallery.addEventListener('touchstart', e => { start = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }; }, { passive: true });
  gallery.addEventListener('touchend', e => {
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x, dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
    start = null;
  }, { passive: true });

  function openPreferences(trigger, map = null) {
    cookieReturnFocus = trigger || document.activeElement;
    pendingMap = map;
    mapSwitch.checked = preferences.maps;
    $('.cookie-map-reason').hidden = !map;
    banner.hidden = true;
    cookieDialog.showModal(); lock();
    (map ? mapSwitch : $('[data-cookie-close]')).focus();
  }
  $$('[data-cookie-settings]').forEach(b => b.addEventListener('click', () => openPreferences(b)));
  $('[data-cookie-close]').addEventListener('click', () => cookieDialog.close());
  cookieDialog.addEventListener('close', () => {
    lock(); banner.hidden = hasChoice;
    cookieReturnFocus?.focus({ preventScroll: true }); pendingMap = null;
  });
  cookieDialog.addEventListener('click', e => { if (e.target === cookieDialog) cookieDialog.close(); });
  function savePreferences(maps) {
    preferences = { essential: true, maps }; hasChoice = true;
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 3, ...preferences })); } catch {}
    if (!maps) mapControllers.forEach(m => m.unload());
    const target = pendingMap;
    if (cookieDialog.open) cookieDialog.close();
    banner.hidden = true;
    if (maps && target) target.load();
  }
  $$('[data-cookie-action]').forEach(b => b.addEventListener('click', () => {
    const action = b.dataset.cookieAction;
    savePreferences(action === 'accept' ? true : action === 'save' ? mapSwitch.checked : false);
  }));

  $$('.map-block').forEach(block => {
    let address = block.dataset.address, enAddress = block.dataset.addressEn || address;
    let overview = block.dataset.overview === 'true';
    const points = '37.6349829,55.7439693,pm2blm1~37.6052961,55.7615204,pm2blm2~37.5520925,55.8044433,pm2blm3';
    const overviewURL = 'https://yandex.ru/map-widget/v1/?ll=37.5935%2C55.774&z=11&pt=' + encodeURIComponent(points);
    const canvas = $('.map-canvas', block), initial = canvas.innerHTML;
    const controller = {
      load() {
        if (!preferences.maps) { openPreferences($('[data-load-map]', block), controller); return; }
        const iframe = document.createElement('iframe');
        iframe.title = (lang === 'en' ? 'Yandex Maps — ' + enAddress : 'Яндекс.Карта — ' + address);
        iframe.src = overview ? overviewURL : 'https://yandex.ru/map-widget/v1/?text=' + encodeURIComponent('Москва, ' + address) + '&z=16';
        iframe.loading = 'lazy'; iframe.referrerPolicy = 'no-referrer';
        canvas.replaceChildren(iframe);
      },
      unload() { canvas.innerHTML = initial; bindMap(); },
      updateLanguage() {
        const label = $('.map-current', block), iframe = $('iframe', block);
        if (label) { label.dataset.ru = address; label.dataset.en = enAddress; label.textContent = lang === 'en' ? enAddress : address; }
        if (iframe) iframe.title = (lang === 'en' ? 'Yandex Maps — ' + enAddress : 'Яндекс.Карта — ' + address);
      }
    };
    function bindMap() {
      controller.updateLanguage();
      $$('[data-ru][data-en]', canvas).forEach(e => { e.innerHTML = e.dataset[lang]; });
      $('.map-external', block).href = overview ? 'https://yandex.ru/maps/?ll=37.5935%2C55.774&z=11&pt=' + encodeURIComponent(points) : 'https://yandex.ru/maps/?text=' + encodeURIComponent('Москва, ' + address);
      $('[data-load-map]', block)?.addEventListener('click', () => controller.load());
    }
    $$('[data-map-address]', block).forEach(b => b.addEventListener('click', () => {
      overview = false;
      address = b.dataset.mapAddress; enAddress = b.dataset.mapEn || address;
      $$('[data-map-address]', block).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $('[data-map-all]', block)?.setAttribute('aria-pressed', 'false');
      controller.unload();
    }));
    $('[data-map-all]', block)?.addEventListener('click', () => {
      overview = true; address = block.dataset.address; enAddress = block.dataset.addressEn;
      $$('[data-map-address]', block).forEach(x => x.setAttribute('aria-pressed', 'false'));
      $('[data-map-all]', block).setAttribute('aria-pressed', 'true');
      controller.unload();
    });
    mapControllers.push(controller); bindMap();
  });

  const top = $('.back-to-top');
  let scrollFrame = false;
  function showTop() { top.hidden = scrollY < Math.max(450, innerHeight * .65); scrollFrame = false; }
  addEventListener('scroll', () => { if (!scrollFrame) { scrollFrame = true; requestAnimationFrame(showTop); } }, { passive: true });
  top.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduced.matches ? 'instant' : 'smooth' }); });
  showTop(); banner.hidden = hasChoice; translate();
})();
