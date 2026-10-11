/* animations.js - GSAP + ScrollTrigger timelines.
   Content is hidden ONLY from here (never from plain CSS), and only after GSAP is confirmed loaded.
   If anything throws, Biz.anim.fail() puts the page back to "everything visible". */
(function () {
  'use strict';
  var Biz = window.Biz = window.Biz || {};
  var root = document.documentElement;
  var A = Biz.anim = {};
  var gsap, ST;

  var ACCENTS = {
    violet: ['rgb(124,58,237)', 'rgb(79,70,229)'], cyan: ['rgb(6,182,212)', 'rgb(79,70,229)'],
    pink: ['rgb(255,77,141)', 'rgb(255,176,32)'], amber: ['rgb(255,176,32)', 'rgb(255,77,141)'],
    emerald: ['rgb(16,185,129)', 'rgb(6,182,212)']
  };

  /* wrap each word in a masked span so it can slide up (keeps gradient <span> children intact) */
  function splitWords(el) {
    if (el._split) return el._split;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = p;
            w.appendChild(wi); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
      });
    }
    walk(el);
    el._split = Array.prototype.slice.call(el.querySelectorAll('.wi'));
    return el._split;
  }

  A.fail = function (err) {
    if (window.console && err) console.warn('Animation turned off:', err && err.message ? err.message : err);
    try { if (ST) ST.getAll().forEach(function (s) { s.kill(); }); } catch (e) {}
    try { if (gsap) gsap.killTweensOf('*'); } catch (e) {}
    root.classList.remove('js-anim');
    root.setAttribute('data-tier', 'minimal');
    var all = document.querySelectorAll('[data-reveal],[data-hero-in],.wi,.hero__title *,.w');
    Array.prototype.forEach.call(all, function (n) { n.style.opacity = ''; n.style.transform = ''; n.style.visibility = ''; });
    var p = document.getElementById('preloader'); if (p && p.parentNode) p.parentNode.removeChild(p);
  };

  A.init = function (tier) {
    gsap = window.gsap; ST = window.ScrollTrigger;
    if (!gsap || !ST) throw new Error('GSAP did not load');
    gsap.registerPlugin(ST);
    root.classList.add('js-anim');
    var $ = Biz.$, $$ = Biz.$$;
    var full = tier === 'full';

    /* ----- smooth scroll (Full only) ----- */
    if (full && window.Lenis) {
      try {
        var lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 1 });
        Biz.lenis = lenis;
        lenis.on('scroll', ST.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
        $$('.menu, .modal__panel').forEach(function (n) { n.setAttribute('data-lenis-prevent', ''); });
      } catch (e) { Biz.lenis = null; }
    }

    /* ----- scroll progress bar ----- */
    var bar = $('#scrollProgress span');
    if (bar) ST.create({ start: 0, end: 'max', onUpdate: function (s) { bar.style.transform = 'scaleX(' + s.progress.toFixed(4) + ')'; } });

    /* ----- hero: prepare (played after the preloader) ----- */
    var heroIn = $$('[data-hero-in]');
    var line1 = $('.hero__line1');
    var line1Words = line1 ? splitWords(line1) : [];
    gsap.set(heroIn, { opacity: 0, y: 36 });
    gsap.set(line1Words, { yPercent: 115, rotate: 7 });

    /* ----- headlines: masked word reveal (Lite = simple fade-up) ----- */
    $$('[data-split]').forEach(function (h) {
      if (h === line1) return;
      if (full) {
        var words = splitWords(h);
        gsap.set(words, { yPercent: 115, rotate: 6 });
        ST.create({ trigger: h, start: 'top 88%', once: true, onEnter: function () {
          gsap.to(words, { yPercent: 0, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: .055 });
        } });
      } else {
        gsap.set(h, { opacity: 0, y: 24 });
        ST.create({ trigger: h, start: 'top 90%', once: true, onEnter: function () { gsap.to(h, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', clearProps: 'transform,opacity' }); } });
      }
    });

    /* ----- cards / lists: staggered rise ----- */
    var reveals = $$('[data-reveal]');
    reveals.forEach(function (el) {
      var o = { opacity: 0, y: 44 };
      if (full && el.classList.contains('card--why')) { o.rotationX = -18; o.transformPerspective = 900; o.y = 60; }
      if (el.classList.contains('plan')) { o.y = 70; }
      gsap.set(el, o);
    });
    ST.batch(reveals, {
      start: 'top 90%', once: true,
      onEnter: function (els) {
        gsap.to(els, { opacity: 1, y: 0, rotationX: 0, duration: .95, ease: 'power3.out', stagger: .13, overwrite: 'auto', clearProps: 'transform,opacity' });
      }
    });

    /* ----- pricing: ticks tick on one by one ----- */
    $$('.plan').forEach(function (plan) {
      var lis = $$('.ticks li', plan);
      gsap.set(lis, { '--t': 0, opacity: .35 });
      ST.create({ trigger: plan, start: 'top 80%', once: true, onEnter: function () {
        gsap.to(lis, { '--t': 1, opacity: 1, duration: .5, ease: 'back.out(2.5)', stagger: .12, delay: .5 });
      } });
    });

    /* ----- icons draw on ----- */
    $$('.card .ico').forEach(function (svg) {
      var paths = $$('path, circle, rect', svg);
      gsap.set(paths, { strokeDashoffset: 100 });
      ST.create({ trigger: svg, start: 'top 90%', once: true, onEnter: function () {
        gsap.to(paths, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: .18, delay: .25 });
      } });
    });

    /* ----- counters ----- */
    $$('.count').forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-to')) || 0, o = { v: 0 };
      el.textContent = '0';
      ST.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () {
        gsap.to(o, { v: to, duration: 1.8, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v); }, onComplete: function () { el.textContent = to; } });
      } });
    });
    var pItems = $$('.promise__item');
    gsap.set(pItems, { opacity: 0, y: 30, scale: .9 });
    ST.create({ trigger: '.promise', start: 'top 85%', once: true, onEnter: function () { gsap.to(pItems, { opacity: 1, y: 0, scale: 1, duration: .9, stagger: .15, ease: 'back.out(1.6)' }); } });

    /* ----- about: chips pop in ----- */
    var chips = $$('.values .chip');
    gsap.set(chips, { scale: 0, opacity: 0 });
    ST.create({ trigger: '.values', start: 'top 92%', once: true, onEnter: function () { gsap.to(chips, { scale: 1, opacity: 1, duration: .8, stagger: .12, ease: 'back.out(2.2)' }); } });

    /* ----- how it works: the line draws as you scroll, steps light up ----- */
    var wrap = $('#stepsWrap'), steps = $$('.step');
    if (wrap) {
      wrap.style.setProperty('--p', 0);
      var lit = [];
      ST.create({ trigger: wrap, start: 'top 72%', end: 'bottom 62%', scrub: .6, onUpdate: function (s) {
        var p = s.progress; wrap.style.setProperty('--p', p.toFixed(4));
        steps.forEach(function (st, i) {
          var on = p >= (i / steps.length) * .92 + .02;
          if (on && !lit[i]) { lit[i] = true; st.classList.add('is-lit'); gsap.fromTo($('.step__dot', st), { scale: .55 }, { scale: 1, duration: .7, ease: 'back.out(3)' }); }
          else if (!on && lit[i]) { lit[i] = false; st.classList.remove('is-lit'); }
        });
      } });
    }

    if (!full) return;   // everything below is Full-tier only

    /* ----- section colour shift ----- */
    var glow = $('#bgGlow');
    $$('[data-accent]').forEach(function (sec) {
      var c = ACCENTS[sec.getAttribute('data-accent')]; if (!c || !glow) return;
      ST.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: function (s) {
        if (s.isActive) gsap.to(glow, { '--glow-a': c[0], '--glow-b': c[1], duration: 1.4, ease: 'power2.out', overwrite: 'auto' });
      } });
    });

    /* ----- floating shapes: scroll parallax (uses --py so it does not fight the CSS drift animation) ----- */
    $$('.shape').forEach(function (s) {
      var d = parseFloat(s.getAttribute('data-depth')) || 1;
      gsap.fromTo(s, { '--py': '0px' }, { '--py': (-140 * d) + 'px', ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true } });
    });
    gsap.to('.hero__visual', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true } });

    /* ----- samples: pinned sideways showcase on desktop; swipe carousel elsewhere ----- */
    if (gsap.matchMedia) {
      var mm = gsap.matchMedia();
      mm.add('(min-width: 1025px) and (hover: hover)', function () {
        var sec = $('.samples'), pin = $('.samples__pin'), track = $('#samplesTrack');
        if (!sec || !pin || !track) return;
        sec.classList.add('is-pinned');
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 40); };
        gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1 } });
        return function () { sec.classList.remove('is-pinned'); };
      });
    }

    window.addEventListener('load', function () { setTimeout(function () { ST.refresh(); }, 400); });
  };

  /* ----- hero intro, played once the preloader is gone ----- */
  A.playHero = function () {
    if (!gsap) return;
    var $ = Biz.$, $$ = Biz.$$;
    var words = ($('.hero__line1') || {})._split || [];
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to($$('[data-hero-in]')[0], { opacity: 1, y: 0, duration: .8 }, 0)
      .to(words, { yPercent: 0, rotate: 0, duration: 1.2, ease: 'expo.out', stagger: .09 }, .1)
      .to($$('[data-hero-in]').slice(1), { opacity: 1, y: 0, duration: 1, stagger: .14, clearProps: 'transform,opacity' }, .45);
    return tl;
  };
})();
