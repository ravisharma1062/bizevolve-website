/* ui.js - nav, mobile menu, FAQ, sample modal, toast, back-to-top, config-driven links.
   ES2017 only (no ?. and no ??) so older phones can run it. */
(function () {
  'use strict';
  var Biz = window.Biz = window.Biz || {};
  var B = window.BIZ || {};
  var root = document.documentElement;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function tier() { return root.getAttribute('data-tier') || 'minimal'; }
  function animOk() { return tier() !== 'minimal'; }
  function ric(fn) { if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 1500 }); else setTimeout(fn, 200); }

  Biz.$ = $; Biz.$$ = $$; Biz.tier = tier; Biz.animOk = animOk; Biz.ric = ric;
  Biz.waUrl = function (msg) { return 'https://wa.me/' + B.whatsappNumber + '?text=' + encodeURIComponent(msg || B.defaultMessage); };

  /* ---------- config -> page ---------- */
  function applyConfig() {
    $$('[data-wa]').forEach(function (a) { a.href = Biz.waUrl(B.defaultMessage); });
    $$('[data-wa-plan]').forEach(function (a) {
      var name = a.getAttribute('data-wa-plan');
      var p = (B.packages || []).filter(function (x) { return x.name === name; })[0];
      var msg = 'Hi BizEvolve! I am interested in the ' + name + ' plan' + (p ? ' (' + p.price + ')' : '') + '. Can you help me?';
      a.href = Biz.waUrl(msg);
    });
    (B.packages || []).forEach(function (p) {
      var el = $('[data-price="' + p.id + '"]'); if (el) el.textContent = p.price;
    });
    $$('[data-phone]').forEach(function (a) {
      a.href = B.phoneLink;
      if (a.classList.contains('fab')) return;
      var s = $('span', a); if (s) s.textContent = 'Call ' + B.phoneDisplay; else a.textContent = B.phoneDisplay;
    });
    $$('[data-email]').forEach(function (a) {
      if (!B.email) { a.parentNode.removeChild(a); return; }
      a.href = 'mailto:' + B.email;
      if (a.closest('.footer')) a.textContent = B.email;
    });
    if (!B.email) {
      // hide any leftover email UI
      $$('a[href^="mailto:"]').forEach(function (a) { a.parentNode.removeChild(a); });
    }
    renderReviews();
  }

  function renderReviews() {
    var mount = $('#reviewsMount');
    var list = B.reviews || [];
    if (!mount || !list.length) return;
    var html = '<h2 class="visually-hidden">Customer reviews</h2><div class="review-slider">';
    list.forEach(function (r, i) {
      var q = document.createElement('div');
      q.textContent = r.text || '';
      var who = document.createElement('div');
      who.textContent = (r.name || '') + (r.business ? ', ' + r.business : '');
      html += '<figure class="review" data-i="' + i + '"' + (i ? ' hidden' : '') + '><blockquote>' + q.innerHTML + '</blockquote><cite>' + who.innerHTML + '</cite></figure>';
    });
    mount.innerHTML = html + '</div>';
    var idx = 0, items = $$('.review', mount);
    if (items.length > 1) setInterval(function () {
      items[idx].hidden = true; idx = (idx + 1) % items.length; items[idx].hidden = false;
    }, 6000);
  }

  /* ---------- focus trap ---------- */
  function trapFocus(container, e) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container).filter(function (x) { return x.offsetParent !== null || x === document.activeElement; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function lockScroll(on) {
    root.classList.toggle('no-scroll', on);
    if (Biz.lenis) { try { on ? Biz.lenis.stop() : Biz.lenis.start(); } catch (e) {} }
  }

  /* ---------- nav ---------- */
  function initNav() {
    var nav = $('#nav');
    function onScroll() { nav.classList.toggle('is-scrolled', (window.pageYOffset || root.scrollTop) > 24); }
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

    // scroll-spy
    var links = $$('.nav__links a');
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var id = en.target.id;
          links.forEach(function (a) { var on = a.getAttribute('href') === '#' + id; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) io.observe(t); });
      var hero = $('#top');
      if (hero) new IntersectionObserver(function (en) { if (en[0].isIntersecting) links.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); }); }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
    }

    // anchor links (account for sticky nav; use Lenis when running)
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) { return; }
      var t = $(id); if (!t) return;
      e.preventDefault();
      closeMenu(true);
      var off = id === '#top' ? 0 : -(nav.offsetHeight - 4);
      if (Biz.lenis) Biz.lenis.scrollTo(t, { offset: off, duration: 1.4 });
      else {
        var y = t.getBoundingClientRect().top + (window.pageYOffset || root.scrollTop) + off;
        try { window.scrollTo({ top: y, behavior: animOk() ? 'smooth' : 'auto' }); } catch (err) { window.scrollTo(0, y); }
      }
      if (history.replaceState) history.replaceState(null, '', id);
      if (id !== '#top') { t.setAttribute('tabindex', '-1'); setTimeout(function () { try { t.focus({ preventScroll: true }); } catch (err) {} }, 600); }
    });
  }

  /* ---------- mobile menu ---------- */
  var menu, burger, menuTimer;
  function openMenu() {
    menu.hidden = false; void menu.offsetWidth;
    menu.classList.add('is-open'); burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Close menu');
    lockScroll(true);
    var f = $('a', menu); if (f) setTimeout(function () { f.focus(); }, 60);
  }
  function closeMenu(silent) {
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu');
    lockScroll(false);
    clearTimeout(menuTimer); menuTimer = setTimeout(function () { menu.hidden = true; }, animOk() ? 750 : 0);
    if (!silent) burger.focus();
  }
  function initMenu() {
    menu = $('#mobileMenu'); burger = $('#burger');
    if (!menu || !burger) return;
    burger.addEventListener('click', function () { if (menu.classList.contains('is-open')) closeMenu(); else openMenu(); });
    document.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') closeMenu(); else trapFocus(menu, e);
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { if (!a.getAttribute('href') || a.getAttribute('href').charAt(0) !== '#') closeMenu(true); }); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1100) closeMenu(true); });
  }

  /* ---------- FAQ (native <details>, with a smooth height animation on top) ---------- */
  function initFaq() {
    $$('.faq__item').forEach(function (d) {
      var sum = $('summary', d), body = $('.faq__body', d);
      if (!sum || !body || !d.animate) return;
      sum.addEventListener('click', function (e) {
        if (!animOk()) return;           // Minimal tier: plain <details>
        e.preventDefault();
        if (d._anim) d._anim.cancel();
        var opening = !d.open;
        if (opening) {
          d.open = true;
          var h = body.offsetHeight;
          d._anim = body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.16,1,.3,1)' });
          d._anim.onfinish = function () { d._anim = null; };
        } else {
          var h2 = body.offsetHeight;
          d._anim = body.animate([{ height: h2 + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'ease-in-out' });
          d._anim.onfinish = function () { d.open = false; d._anim = null; };
        }
      });
    });
  }

  /* ---------- toast ---------- */
  var toastTimer;
  Biz.toast = function (msg, ms) {
    var t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('is-show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, ms || 4500);
  };

  /* ---------- sample modal ---------- */
  var modal, lastTrigger, modalTimer;
  function setScrollDist(mock) {
    var sc = $('.mock__scroll', mock); if (!sc) return;
    mock.style.setProperty('--scroll-dist', Math.max(0, sc.scrollHeight - mock.clientHeight) + 'px');
  }
  function openSample(id, trigger) {
    var s = (B.samples || []).filter(function (x) { return x.id === id; })[0] || { id: id, title: 'Sample concept', blurb: '' };
    var src = $('[data-mock="' + id + '"]'); if (!src) return;
    lastTrigger = trigger || document.activeElement;
    var screen = $('#modalScreen'); screen.innerHTML = '';
    var clone = src.cloneNode(true); clone.removeAttribute('data-mock'); clone.classList.add('is-auto');
    screen.appendChild(clone);
    $('#modalTitle').textContent = s.title; $('#modalBlurb').textContent = s.blurb;
    $('#modalWa').href = Biz.waUrl('Hi BizEvolve! I saw the ' + s.title + ' on your website. I want a website like this for my business.');
    var live = $('#modalLive'); if (s.liveUrl) { live.href = s.liveUrl; live.hidden = false; } else live.hidden = true;
    clearTimeout(modalTimer);
    modal.hidden = false; void modal.offsetWidth;
    modal.classList.add('is-open'); lockScroll(true);
    setScrollDist(clone);
    setTimeout(function () { var c = $('.modal__close', modal); if (c) c.focus(); }, 50);
  }
  function closeSample() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open'); lockScroll(false);
    modalTimer = setTimeout(function () { modal.hidden = true; $('#modalScreen').innerHTML = ''; }, animOk() ? 450 : 0);
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }
  function initSamples() {
    modal = $('#sampleModal'); if (!modal) return;
    $$('[data-open-sample]').forEach(function (b) { b.addEventListener('click', function () { openSample(b.getAttribute('data-open-sample'), b); }); });
    $$('[data-close-modal]', modal).forEach(function (b) { b.addEventListener('click', closeSample); });
    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return;
      if (e.key === 'Escape') closeSample(); else trapFocus($('.modal__panel', modal), e);
    });
    // distance each phone mock should auto-scroll
    function measure() { $$('.sample .mock').forEach(setScrollDist); }
    measure(); window.addEventListener('resize', measure); window.addEventListener('load', measure);
    // touch screens: gentle auto-scroll while a card is on screen
    var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    if (!canHover && window.IntersectionObserver) {
      var io = new IntersectionObserver(function (en) { en.forEach(function (x) { $('.mock', x.target).classList.toggle('is-auto', x.isIntersecting); }); }, { threshold: .6 });
      $$('.sample__open').forEach(function (n) { io.observe(n); });
    }
    // sample names/blurbs from config
    (B.samples || []).forEach(function (s) {
      var card = $('.sample[data-sample="' + s.id + '"]'); if (!card) return;
      var h = $('h3', card), p = $('.sample__info p', card);
      if (h) h.textContent = s.title; if (p) p.textContent = s.blurb;
    });
  }

  /* ---------- to-top rocket, ripple, motion toggle, marquee ---------- */
  function initMisc() {
    var top = $('#toTop');
    if (top) top.addEventListener('click', function () {
      if (animOk()) { top.classList.add('is-launching'); setTimeout(function () { top.classList.remove('is-launching'); }, 1000); }
      if (Biz.lenis) Biz.lenis.scrollTo(0, { duration: 1.6 });
      else { try { window.scrollTo({ top: 0, behavior: animOk() ? 'smooth' : 'auto' }); } catch (e) { window.scrollTo(0, 0); } }
    });

    // click ripple on buttons
    document.addEventListener('pointerdown', function (e) {
      if (!animOk()) return;
      var b = e.target.closest ? e.target.closest('.btn') : null; if (!b) return;
      var r = b.getBoundingClientRect(), size = Math.max(r.width, r.height);
      var s = document.createElement('span'); s.className = 'ripple';
      s.style.width = s.style.height = size + 'px';
      s.style.left = (e.clientX - r.left - size / 2) + 'px'; s.style.top = (e.clientY - r.top - size / 2) + 'px';
      b.appendChild(s); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 800);
    });

    // reduce-motion toggle
    var mt = $('#motionToggle');
    if (mt) {
      var on = tier() === 'minimal';
      var saved = null; try { saved = localStorage.getItem('biz-reduce-motion'); } catch (e) {}
      mt.setAttribute('aria-pressed', saved === '1' ? 'true' : 'false');
      mt.addEventListener('click', function () {
        var next = mt.getAttribute('aria-pressed') !== 'true';
        try { localStorage.setItem('biz-reduce-motion', next ? '1' : '0'); } catch (e) {}
        mt.setAttribute('aria-pressed', next ? 'true' : 'false');
        location.reload();
      });
    }
  }

  function initMarquee() {
    if (!animOk()) return;
    $$('.marquee__track').forEach(function (t) {
      var unit = t.innerHTML;
      t.innerHTML = unit + unit + unit + unit;  // 4 copies: -50% loops perfectly and fills wide screens
    });
  }

  Biz.initUI = function () {
    applyConfig(); initNav(); initMenu(); initFaq(); initSamples(); initMisc(); initMarquee();
  };
  Biz.closeMenu = closeMenu;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', Biz.initUI);
  else Biz.initUI();
})();
