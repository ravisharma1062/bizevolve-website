/* cursor.js - custom cursor, magnetic buttons, card tilt, hero 3D tilt and mouse parallax.
   Desktop with a fine pointer only (Full tier). Touch screens never run this. */
(function () {
  'use strict';
  var Biz = window.Biz = window.Biz || {};

  Biz.initPointer = function () {
    var mm = window.matchMedia;
    if (!mm || !mm('(hover: hover) and (pointer: fine)').matches) return;
    var root = document.documentElement, $ = Biz.$, $$ = Biz.$$;
    var g = window.gsap;

    /* ----- cursor dot + trailing ring ----- */
    var dot = $('#cursorDot'), ring = $('#cursorRing'), label = ring ? ring.firstElementChild : null;
    var mx = -100, my = -100, rx = -100, ry = -100, raf = 0, started = false;
    function loop() {
      rx += (mx - rx) * .18; ry += (my - ry) * .18;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      if (Math.abs(mx - rx) > .1 || Math.abs(my - ry) > .1) raf = requestAnimationFrame(loop); else raf = 0;
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!started) { started = true; root.classList.add('has-cursor'); }
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var t = e.target; if (!t.closest) return;
      var view = t.closest('.sample__open');
      var link = t.closest('a, button, summary, .tilt, input, select, textarea');
      ring.classList.toggle('is-view', !!view);
      ring.classList.toggle('is-link', !!link && !view);
      if (label) label.textContent = view ? 'View' : '';
    });
    document.addEventListener('mouseleave', function () { ring.style.opacity = 0; dot.style.opacity = 0; });
    document.addEventListener('mouseenter', function () { ring.style.opacity = 1; dot.style.opacity = 1; });

    /* ----- magnetic buttons ----- */
    $$('.magnetic').forEach(function (b) {
      var inner = b.querySelector('span');
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * .28, dy = (e.clientY - (r.top + r.height / 2)) * .35;
        if (g) { g.to(b, { x: dx, y: dy, duration: .35, ease: 'power3.out', overwrite: 'auto' }); if (inner) g.to(inner, { x: dx * .35, y: dy * .35, duration: .35, overwrite: 'auto' }); }
        else b.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
      b.addEventListener('pointerleave', function () {
        if (g) { g.to(b, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.4)', overwrite: 'auto' }); if (inner) g.to(inner, { x: 0, y: 0, duration: .6, overwrite: 'auto' }); }
        else b.style.transform = '';
      });
    });

    /* ----- 3D tilt + glare on cards ----- */
    $$('.tilt').forEach(function (card) {
      var glare = document.createElement('span'); glare.className = 'glare'; glare.setAttribute('aria-hidden', 'true'); card.appendChild(glare);
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.classList.add('is-tilting');
        card.style.transition = 'box-shadow .4s, border-color .4s';
        card.style.transform = 'perspective(800px) rotateX(' + ((.5 - py) * 12).toFixed(2) + 'deg) rotateY(' + ((px - .5) * 12).toFixed(2) + 'deg) translateZ(0)';
        card.style.setProperty('--gx', (px * 100) + '%'); card.style.setProperty('--gy', (py * 100) + '%');
      });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('is-tilting');
        card.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1), box-shadow .4s, border-color .4s';
        card.style.transform = '';
      });
    });

    /* ----- hero: frame tilts with the mouse, shapes drift with it ----- */
    var hero = $('#top'), tilt = $('.scene__tilt'), shapes = $$('.shape');
    if (hero) hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      if (tilt) { tilt.style.setProperty('--ry', (nx * 14).toFixed(2) + 'deg'); tilt.style.setProperty('--rx', (-ny * 10).toFixed(2) + 'deg'); }
      shapes.forEach(function (s) { var d = parseFloat(s.getAttribute('data-depth')) || 1; s.style.setProperty('--mx', (nx * 40 * d).toFixed(1) + 'px'); s.style.setProperty('--my', (ny * 40 * d).toFixed(1) + 'px'); });
    });
    if (hero) hero.addEventListener('pointerleave', function () { if (tilt) { tilt.style.setProperty('--ry', '0deg'); tilt.style.setProperty('--rx', '0deg'); } });
  };
})();
