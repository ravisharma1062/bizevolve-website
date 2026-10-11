/* hero-canvas.js - flowing aurora + soft particles behind the hero (Full tier only).
   Draws at half resolution (it is blurry by design). Pauses when off-screen or the tab is hidden. */
(function () {
  'use strict';
  var Biz = window.Biz = window.Biz || {};

  Biz.startHeroCanvas = function () {
    var c = document.getElementById('heroCanvas');
    var hero = document.getElementById('top');
    if (!c || !hero || !c.getContext) return;
    var ctx;
    try { ctx = c.getContext('2d'); } catch (e) { return; }
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2) * .5;   // pixel ratio capped at 2, then halved
    var w = 0, h = 0, running = false, visible = true, raf = 0, t = 0;
    var blobs = [
      { c: '124,58,237', x: .2, y: .3, r: .55, sx: .00021, sy: .00017, p: 0 },
      { c: '255,77,141', x: .78, y: .22, r: .42, sx: .00018, sy: .00023, p: 2 },
      { c: '6,182,212', x: .7, y: .8, r: .5, sx: .00024, sy: .00015, p: 4 },
      { c: '255,176,32', x: .22, y: .85, r: .32, sx: .00016, sy: .00021, p: 1 }
    ];
    var dots = [], N = 46;
    for (var i = 0; i < N; i++) dots.push({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.8, s: .00002 + Math.random() * .00006, ph: Math.random() * 6.28 });

    function resize() {
      var r = hero.getBoundingClientRect();
      w = c.width = Math.max(2, Math.round(r.width * dpr));
      h = c.height = Math.max(2, Math.round(r.height * dpr));
    }
    function draw() {
      raf = 0;
      if (!running || !visible || document.hidden) return;
      t += 16;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#0B1020'; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var x = (b.x + Math.sin(t * b.sx + b.p) * .16) * w, y = (b.y + Math.cos(t * b.sy + b.p) * .14) * h;
        var rad = b.r * Math.max(w, h) * (.9 + Math.sin(t * .0004 + b.p) * .1);
        var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, 'rgba(' + b.c + ',.5)'); g.addColorStop(.5, 'rgba(' + b.c + ',.14)'); g.addColorStop(1, 'rgba(' + b.c + ',0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
      ctx.globalCompositeOperation = 'source-over';
      for (var j = 0; j < dots.length; j++) {
        var d = dots[j];
        d.y -= d.s * 16; if (d.y < -.02) d.y = 1.02;
        var a = .25 + .5 * (Math.sin(t * .002 + d.ph) * .5 + .5);
        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(d.x * w, d.y * h, d.r * dpr * 1.4, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    function kick() { if (!raf && running && visible && !document.hidden) raf = requestAnimationFrame(draw); }

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', kick);
    if (window.IntersectionObserver) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; kick(); }).observe(hero);
    running = true;
    c.classList.add('is-on'); hero.classList.add('canvas-on');
    kick();
  };
})();
