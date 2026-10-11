/* form.js - contact form: validate, then open WhatsApp with the details. No backend needed. */
(function () {
  'use strict';
  var Biz = window.Biz = window.Biz || {};
  var B = window.BIZ || {};

  function confetti() {
    var c = document.getElementById('confetti');
    if (!c || !c.getContext || !Biz.animOk()) return;
    var ctx = c.getContext('2d'); if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = window.innerWidth * dpr; c.height = window.innerHeight * dpr;
    var colors = ['#7C3AED', '#FF4D8D', '#06B6D4', '#FFB020', '#10B981'];
    var btn = document.getElementById('formSubmit').getBoundingClientRect();
    var ox = (btn.left + btn.width / 2) * dpr, oy = (btn.top + btn.height / 2) * dpr;
    var P = [];
    for (var i = 0; i < 140; i++) {
      var a = Math.random() * Math.PI * 2, s = (4 + Math.random() * 9) * dpr;
      P.push({ x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6 * dpr, w: (6 + Math.random() * 6) * dpr, h: (4 + Math.random() * 5) * dpr,
        r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colors[i % colors.length] });
    }
    var t0 = null;
    (function frame(t) {
      if (!t0) t0 = t;
      var life = (t - t0) / 2600;
      ctx.clearRect(0, 0, c.width, c.height);
      P.forEach(function (p) {
        p.vy += .28 * dpr; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - life);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (life < 1) requestAnimationFrame(frame); else ctx.clearRect(0, 0, c.width, c.height);
    })(performance.now());
  }
  Biz.confetti = confetti;

  function init() {
    var form = document.getElementById('contactForm'); if (!form) return;
    var btn = document.getElementById('formSubmit');

    function setErr(id, msg) {
      var f = form.querySelector('#' + id).closest('.field');
      var e = document.getElementById('e-' + id.replace('f-', ''));
      var input = form.querySelector('#' + id);
      if (msg) { f.classList.add('has-error'); input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', e.id); e.textContent = msg; }
      else { f.classList.remove('has-error'); input.removeAttribute('aria-invalid'); e.textContent = ''; }
      return !msg;
    }
    function validate() {
      var name = form.name.value.replace(/^\s+|\s+$/g, '');
      var digits = form.phone.value.replace(/[\s\-().+]/g, '');
      var ok = [
        setErr('f-name', name.length < 2 ? 'Please enter your name.' : ''),
        setErr('f-type', !form.type.value ? 'Please choose your business type.' : ''),
        setErr('f-phone', !/^\d{10,13}$/.test(digits) ? 'Please enter a valid phone number (10 digits).' : '')
      ];
      var first = ['f-name', 'f-type', 'f-phone'][ok.indexOf(false)];
      if (first) form.querySelector('#' + first).focus();
      return ok.indexOf(false) === -1;
    }
    ['f-name', 'f-type', 'f-phone'].forEach(function (id) {
      var el = form.querySelector('#' + id);
      el.addEventListener('input', function () { if (el.closest('.field').classList.contains('has-error')) validate(); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      var lines = ['Hi BizEvolve! I want a website for my business.', '',
        'Name: ' + form.name.value.replace(/^\s+|\s+$/g, ''),
        'Business type: ' + form.type.value,
        'Phone: ' + form.phone.value.replace(/^\s+|\s+$/g, '')];
      if (form.plan.value) lines.push('Package: ' + form.plan.value);
      if (form.message.value.replace(/\s+/g, '')) lines.push('Message: ' + form.message.value.replace(/^\s+|\s+$/g, ''));
      var url = Biz.waUrl(lines.join('\n'));

      // Optional: also send to a form service
      if (B.FORM_ENDPOINT && window.fetch) {
        try {
          fetch(B.FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ name: form.name.value, businessType: form.type.value, phone: form.phone.value, package: form.plan.value, message: form.message.value }) }).catch(function () {});
        } catch (err) {}
      }

      // A real link click (not window.open) works inside WhatsApp / Instagram in-app browsers
      var a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.style.display = 'none';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);

      var fb = document.getElementById('formFallback');
      if (fb) { fb.hidden = false; fb.querySelector('a').href = url; }
      btn.classList.add('is-done');
      confetti();
      Biz.toast('Opening WhatsApp... we are excited to hear from you!');
      setTimeout(function () { btn.classList.remove('is-done'); }, 4500);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
