/* Living background for .wash sections, in the spirit of wearebou.com:
   soft, blurred colour fields that drift slowly and fade into white at the edges.
   Each page has its own palette; Wolt sky blue (#00c2e8) leads every palette.
   Canvas 2D at low resolution + CSS blur, so it stays cheap. Pauses off-screen,
   draws one still frame for prefers-reduced-motion. Without JS the CSS .wash
   gradient remains as the fallback. */
(function () {
  var SKY = [0, 194, 232];
  var PALETTES = {
    home:    [SKY, [125, 211, 252], [187, 247, 208], SKY],          // sky, light sky, mint
    landing: [SKY, [165, 243, 252], [199, 210, 254], SKY],          // sky, aqua, periwinkle
    guide:   [SKY, [186, 230, 253], [217, 249, 157], [125, 211, 252]], // sky, ice, lime
    plain:   [SKY, [186, 230, 253], [204, 251, 241], SKY]           // sky, ice, mint-teal
  };
  var path = location.pathname;
  var name = document.body.getAttribute('data-aurora') ||
    (path === '/' || path === '/index.html' ? 'home'
      : /^\/finnish-seo\/?$/.test(path) ? 'landing'
      : /^\/finnish-seo\/.+/.test(path) ? 'guide' : 'plain');
  var pal = PALETTES[name] || PALETTES.plain;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = document.createElement('style');
  css.textContent =
    '.wash.aurora{position:relative;isolation:isolate;background:#fff}' +
    '.wash.aurora>canvas.aurora-c{position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;' +
    'filter:blur(48px) saturate(1.15);opacity:.9;' +
    '-webkit-mask-image:linear-gradient(180deg,transparent 0%,#000 18%,#000 82%,transparent 100%);' +
    'mask-image:linear-gradient(180deg,transparent 0%,#000 18%,#000 82%,transparent 100%)}' +
    /* hero: the first thing people see; a subtle tint (Tomas 2026-11-18: keep it subtle); fades out towards the photo and the logo strip */
    '.hero.aurora{isolation:isolate}.hero.aurora .photo{z-index:1}' +
    '.hero.aurora>canvas.aurora-c{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;filter:blur(64px);' +
    '-webkit-mask-image:linear-gradient(90deg,#000 0%,#000 55%,transparent 88%),linear-gradient(180deg,#000 70%,transparent 100%);-webkit-mask-composite:source-in;' +
    'mask-image:linear-gradient(90deg,#000 0%,#000 55%,transparent 88%),linear-gradient(180deg,#000 70%,transparent 100%);mask-composite:intersect}' +
    /* other page heroes (landing, guides, 404): full-width field, fades out at the bottom */
    '.aurora-full{position:relative;isolation:isolate}' +
    '.aurora-full>canvas.aurora-c{position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;filter:blur(64px);' +
    '-webkit-mask-image:linear-gradient(180deg,#000 72%,transparent 100%);mask-image:linear-gradient(180deg,#000 72%,transparent 100%)}';
  document.head.appendChild(css);

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  function Field(section, index, opt) {
    opt = opt || {};
    var cv = document.createElement('canvas');
    cv.className = 'aurora-c';
    cv.setAttribute('aria-hidden', 'true');
    section.classList.add(opt.full ? 'aurora-full' : 'aurora');
    section.insertBefore(cv, section.firstChild);
    var ctx = cv.getContext('2d');
    var W = 96, H = 64; // tiny buffer; CSS scales and blurs it
    cv.width = W; cv.height = H;
    // Four blobs per section, seeded by section index so sections differ.
    var blobs = pal.map(function (c, i) {
      var s = index * 1.7 + i * 2.3;
      return { c: c, x: (Math.sin(s) + 1) / 2, y: (Math.cos(s * 1.3) + 1) / 2,
        r: i === 0 ? 0.62 : 0.48, a: (i === 0 ? 0.55 : 0.42) * (opt.hero ? 0.7 : 1),
        sx: 0.06 + (i % 3) * 0.025, sy: 0.05 + ((i + 1) % 3) * 0.02, ph: s };
    });
    var visible = false, raf = 0, t0 = performance.now();
    function draw(now) {
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = opt.base || '#fff';
      ctx.fillRect(0, 0, W, H);
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var x = (b.x + Math.sin(t * b.sx + b.ph) * 0.28) * W;
        var y = (b.y + Math.cos(t * b.sy + b.ph * 0.7) * 0.32) * H;
        var r = b.r * W * (1 + Math.sin(t * 0.05 + b.ph) * 0.12);
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(b.c, b.a));
        g.addColorStop(1, rgba(b.c, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    }
    function loop(now) { draw(now); if (visible && !still) raf = requestAnimationFrame(loop); }
    draw(performance.now() + index * 7000);
    if (still || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    }, { rootMargin: '100px' }).observe(section);
  }

  function init() {
    var hero = document.querySelector('.hero');
    if (hero) Field(hero, 9, { hero: true, base: '#f5f5f7' });
    var heads = document.querySelectorAll('.lp-hero, .art-hero, .nf');
    for (var j = 0; j < heads.length; j++) Field(heads[j], 11 + j, { hero: true, full: true, base: '#f5f5f7' });
    var list = document.querySelectorAll('.wash');
    for (var i = 0; i < list.length; i++) Field(list[i], i);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
