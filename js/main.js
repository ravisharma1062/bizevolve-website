/* main.js - boot: choose the tier, run the preloader, start the effects. */
(function () {
  'use strict';
  var Biz = window.Biz = window.Biz || {};
  var root = document.documentElement;

  function removePreloader() {
    var p = document.getElementById('preloader');
    if (p && p.parentNode) { p.parentNode.removeChild(p); Biz.preloaderEnd = Math.round(performance.now()); }
  }

  /* short frame-rate check; below ~30 fps => Lite tier */
  function fpsCheck(cb) {
    var n = 0, t0 = 0, done = false;
    function finish(fps) { if (!done) { done = true; cb(fps); } }
    setTimeout(function () { finish(60); }, 500);          // never wait long; assume fine
    requestAnimationFrame(function tick(t) {
      if (done) return;
      if (!t0) t0 = t;
      n++;
      if (t - t0 >= 300) finish(n / ((t - t0) / 1000)); else requestAnimationFrame(tick);
    });
  }

  function startEffects(tier) {
    try {
      Biz.anim.init(tier);
    } catch (e) { Biz.anim.fail(e); return false; }
    return true;
  }

  function runPreloader(done) {
    var p = document.getElementById('preloader');
    if (!p) return done();
    var finished = false;
    function end() { if (finished) return; finished = true; removePreloader(); done(); }
    setTimeout(end, Math.max(200, 2200 - (window.performance ? performance.now() : 0)));   // hard limit: never longer than 2.5 s from page start
    var g = window.gsap, wipe = p.querySelector('.preloader__wipe'), inner = p.querySelector('.preloader__inner');
    if (g && wipe) {
      g.timeline({ delay: .85, onComplete: end })
        .to(inner, { scale: .8, opacity: 0, duration: .35, ease: 'power2.in' })
        .to(wipe, { y: '0%', duration: .45, ease: 'power3.inOut' }, '<')
        .to(p, { yPercent: -100, duration: .5, ease: 'power3.inOut' });
    } else {
      setTimeout(end, 1300);
    }
  }

  function boot() {
    var tier = root.getAttribute('data-tier');
    if (tier === 'minimal') { removePreloader(); return; }

    function go(t) {
      root.setAttribute('data-tier', t);
      if (!startEffects(t)) return;
      if (t === 'full') {
        runPreloader(function () {
          Biz.anim.playHero();
          Biz.ric(function () {
            try { Biz.startHeroCanvas(); } catch (e) {}
            try { Biz.initPointer(); } catch (e) {}
          });
        });
      } else {
        removePreloader();
        Biz.anim.playHero();
      }
    }

    if (tier === 'full' && !/[?&]tier=/.test(location.search)) {
      fpsCheck(function (fps) { go(fps < 30 ? 'lite' : 'full'); });
    } else go(tier);
  }

  function start() {
    try { boot(); } catch (e) { if (Biz.anim && Biz.anim.fail) Biz.anim.fail(e); else removePreloader(); }
  }
  // last-resort safety: if anything still covers the page after 2.4 s, remove it
  setTimeout(removePreloader, 2200);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
