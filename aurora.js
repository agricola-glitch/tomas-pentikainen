/* Colour fields, modelled on how wearebou.com does it (inspected 2026-11-18):
   - the page is plain white; colour appears in at most two considered places per page
   - each field is one continuous area behind several sections, not a box per section
   - very long fades into white (Bou uses 1000-2400 px), so no edge is ever visible
   - rendered at ~1/10 resolution and stretched, which is what makes it smooth
   Wolt sky blue (#00c2e8) leads every palette; secondary tints change per page.
   Pauses off-screen; one still frame for prefers-reduced-motion. Without JS the
   page keeps its CSS backgrounds. */
(function () {
  var SKY = [0, 194, 232];
  var PALETTES = {
    home:    [SKY, [125, 211, 252], [187, 247, 208]],  // sky, light sky, mint
    landing: [SKY, [165, 243, 252], [199, 210, 254]],  // sky, aqua, periwinkle
    guide:   [SKY, [186, 230, 253], [217, 249, 157]],  // sky, ice, lime
    plain:   [SKY, [186, 230, 253], [204, 251, 241]]   // sky, ice, mint-teal
  };
  // Where colour lives on each page: from the top of `from` to the bottom of `to`
  // (+ `extend` px), with fades given as a share of the field height.
  var LAYOUT = {
    // home (Tomas 2026-11-18): hero tinted; the "Experience at" strip and the work grid pure white;
    // "What I do" through "Results from client work" in one field; contact at the end
    home:    [{ from: '.hero', to: '.hero', fadeTop: 0, fadeBottom: 0.35, strength: 0.75 },
              { from: '#do', to: '#results', fadeTop: 0.22, fadeBottom: 0.22, strength: 0.8 },
              { from: '#contact', to: 'footer', fadeTop: 0.55, fadeBottom: 0, strength: 0.8 }],
    landing: [{ from: '.lp-hero', to: '#why', fadeTop: 0, fadeBottom: 0.45, strength: 0.75 },
              { from: '#contact', to: 'footer', fadeTop: 0.55, fadeBottom: 0, strength: 0.8 }],
    guide:   [{ from: '.art-hero', to: '.art-hero', extend: 420, fadeTop: 0, fadeBottom: 0.55, strength: 0.7 },
              { from: '#contact', to: 'footer', fadeTop: 0.55, fadeBottom: 0, strength: 0.8 }],
    plain:   [{ from: '.nf', to: '.nf', fadeTop: 0, fadeBottom: 0.3, strength: 0.7 }]
  };
  var path = location.pathname;
  var name = path === '/' || path === '/index.html' ? 'home'
    : /^\/finnish-seo\/?$/.test(path) ? 'landing'
    : /^\/finnish-seo\/.+/.test(path) ? 'guide' : 'plain';
  var pal = PALETTES[name], layout = LAYOUT[name];
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = document.createElement('style');
  css.textContent =
    // the fields replace the section washes, so those sections go transparent
    '.js-aurora .hero,.js-aurora .lp-hero,.js-aurora .art-hero,.js-aurora .nf,.js-aurora .wash{background:transparent!important}' +
    // the hero photo dissolves into whatever is behind it instead of into a grey overlay
    '.js-aurora .hero .photo::before{display:none}' +
    '.js-aurora .hero .photo img{-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 32%);mask-image:linear-gradient(90deg,transparent 0%,#000 32%)}' +
    '@media (max-width:900px){.js-aurora .hero .photo img{-webkit-mask-image:linear-gradient(0deg,transparent 0%,#000 40%);mask-image:linear-gradient(0deg,transparent 0%,#000 40%)}}' +
    '.aurora-field{position:absolute;left:0;width:100%;z-index:-1;pointer-events:none;overflow:hidden}' +
    '.aurora-field canvas{display:block;width:100%;height:100%;filter:blur(24px)}';
  document.head.appendChild(css);

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function pct(v) { return (v * 100).toFixed(1) + '%'; }

  function Field(spec, index) {
    var a = document.querySelector(spec.from), b = document.querySelector(spec.to);
    if (!a || !b) return null;
    var box = document.createElement('div');
    box.className = 'aurora-field';
    box.setAttribute('aria-hidden', 'true');
    var m = 'linear-gradient(180deg,transparent 0%,#000 ' + pct(spec.fadeTop) + ',#000 ' + pct(1 - spec.fadeBottom) + ',transparent 100%)';
    box.style.webkitMaskImage = m; box.style.maskImage = m;
    var cv = document.createElement('canvas');
    box.appendChild(cv);
    document.body.appendChild(box);
    var ctx = cv.getContext('2d'), W = 0, H = 0, blobs = [];

    function place() {
      var top = a.getBoundingClientRect().top + scrollY;
      var bottom = b.getBoundingClientRect().bottom + scrollY + (spec.extend || 0);
      var h = Math.max(200, bottom - top);
      box.style.top = top + 'px';
      box.style.height = h + 'px';
      // ~1/10 resolution, like Bou: the browser's upscale does the smoothing
      var nw = Math.max(48, Math.round(box.clientWidth / 10)), nh = Math.max(24, Math.round(h / 10));
      if (nw !== W || nh !== H) {
        W = cv.width = nw; H = cv.height = nh;
        // enough blobs to cover tall fields; sky blue gets every other blob
        var n = 2 + Math.round(H / W * 1.4);
        blobs = [];
        for (var i = 0; i < n; i++) {
          var s = index * 3.1 + i * 1.9;
          // alternate sides so the middle, where the text sits, stays close to white
          var side = (i + index) % 2 === 0 ? 0.08 : 0.92;
          blobs.push({ c: i % 2 === 0 ? pal[0] : pal[1 + ((i >> 1) % (pal.length - 1))],
            x: side + (side < 0.5 ? 1 : -1) * 0.1 * ((Math.sin(s * 2.3) + 1) / 2), y: (i + 0.5) / n,
            r: 0.5 + 0.1 * ((Math.cos(s) + 1) / 2), a: (i % 2 === 0 ? 0.42 : 0.6) * spec.strength,
            sx: 0.035 + (i % 3) * 0.012, sy: 0.03 + ((i + 1) % 3) * 0.01, ph: s });
        }
      }
    }
    var t0 = performance.now();
    function draw(now) {
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < blobs.length; i++) {
        var q = blobs[i];
        var x = (q.x + Math.sin(t * q.sx + q.ph) * 0.1) * W;
        var y = (q.y + Math.cos(t * q.sy + q.ph * 0.7) * (0.6 / blobs.length)) * H;
        var r = q.r * W * (1 + Math.sin(t * 0.04 + q.ph) * 0.1);
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(q.c, q.a));
        g.addColorStop(0.55, rgba(q.c, q.a * 0.45));
        g.addColorStop(1, rgba(q.c, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    }
    place(); draw(t0 + index * 9000);
    var visible = false, raf = 0;
    function loop(now) { draw(now); if (visible && !still) raf = requestAnimationFrame(loop); }
    if (!still && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting; cancelAnimationFrame(raf);
        if (visible) raf = requestAnimationFrame(loop);
      }, { rootMargin: '200px' }).observe(box);
    }
    return { place: function () { place(); draw(performance.now()); } };
  }

  function init() {
    document.documentElement.classList.add('js-aurora');
    if (getComputedStyle(document.body).position === 'static') document.body.style.position = 'relative';
    var fields = [];
    for (var i = 0; i < layout.length; i++) { var f = Field(layout[i], i); if (f) fields.push(f); }
    var again = function () { for (var j = 0; j < fields.length; j++) fields[j].place(); };
    // layout shifts (fonts, images, resize) move the anchors: re-place the fields
    if ('ResizeObserver' in window) new ResizeObserver(again).observe(document.body);
    addEventListener('load', again);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
