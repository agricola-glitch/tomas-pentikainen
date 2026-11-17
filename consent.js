/* Cookie consent + Google Analytics 4 (loaded only after the visitor accepts). */
(function () {
  var GA_ID = 'G-QZLBPJGNEZ', KEY = 'tp_consent';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var loaded = false;
  function loadGA() {
    if (loaded) return; loaded = true;
    gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function banner() {
    if (document.getElementById('tp-consent')) return;
    var css = document.createElement('style');
    css.textContent =
      '#tp-consent{position:fixed;left:16px;bottom:16px;z-index:999;max-width:380px;background:#fff;color:#0a0a0a;border-radius:16px;' +
      'box-shadow:0 20px 50px rgba(10,10,10,.16),0 0 0 1px rgba(10,10,10,.08);padding:20px;font:400 15px/1.45 "Inter Tight",helvetica,arial,sans-serif}' +
      '#tp-consent p{margin:0 0 14px}#tp-consent a{color:inherit;text-decoration:underline;text-underline-offset:3px}' +
      '#tp-consent .b{display:flex;gap:8px}#tp-consent button{flex:1;border:0;border-radius:999px;padding:11px 14px;font:500 15px "Inter Tight",helvetica,arial,sans-serif;cursor:pointer}' +
      '#tp-consent .no{background:#f5f5f7;color:#0a0a0a}#tp-consent .yes{background:#0a0a0a;color:#fff}' +
      '@media (max-width:480px){#tp-consent{left:12px;right:12px;bottom:12px;max-width:none}}';
    document.head.appendChild(css);
    var d = document.createElement('div');
    d.id = 'tp-consent'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cookie consent');
    d.innerHTML = '<p>I use Google Analytics cookies to see which pages are useful. Nothing is tracked unless you accept. <a href="/privacy/">Privacy</a></p>' +
      '<div class="b"><button type="button" class="no">Decline</button><button type="button" class="yes">Accept</button></div>';
    document.body.appendChild(d);
    d.querySelector('.no').onclick = function () { set('denied'); d.remove(); };
    d.querySelector('.yes').onclick = function () { set('granted'); d.remove(); loadGA(); };
  }

  window.tpCookieSettings = function () { banner(); };

  var c = get();
  if (c === 'granted') loadGA();
  else if (c !== 'denied') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', banner); else banner();
  }
})();
