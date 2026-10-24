/* Wieża: autodopasowanie ramek. Wczytaj po wygenerowaniu portretów albo
   zostaw skrypt aktywny: obserwuje nowe elementy tworzone przez UI. */
(() => {
  'use strict';
  const SELECTOR = '.hero-portrait-frame-wrap';
  const STAR7_SELECTOR = '.hero-v2-portrait[src*="_7star_"]';
  const MAX_SIDE = 88;
  const MAX_SIDE_MOBILE = 78;
  const STAR7_SIDE = 112;
  const STAR7_SIDE_MOBILE = 98;
  const alphaBoundsCache = new WeakMap();

  function isMobile() {
    return window.matchMedia('(max-width: 700px)').matches;
  }

  function frameAlphaBounds(img) {
    if (alphaBoundsCache.has(img)) return alphaBoundsCache.get(img);
    try {
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) return null;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, w, h).data;
      let minX = w, minY = h, maxX = -1, maxY = -1;
      // Próg alpha eliminuje niemal niewidoczne antyaliasy przy samych krawędziach.
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4 + 3] > 32) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      const result = maxX < 0 ? null : {
        x: minX / w, y: minY / h,
        width: (maxX - minX + 1) / w,
        height: (maxY - minY + 1) / h
      };
      alphaBoundsCache.set(img, result);
      return result;
    } catch (_) {
      // Jeśli przeglądarka nie pozwoli odczytać pikseli, stosujemy dopasowanie bez cropowania.
      return null;
    }
  }

  function fitWrap(wrap) {
    if (!wrap || !wrap.isConnected) return;
    const portrait = wrap.querySelector(':scope > .hero-v2-portrait');
    const frame = wrap.querySelector(':scope > .hero-portrait-frame-overlay');
    if (!portrait || !frame) return;

    const is7 = portrait.matches(STAR7_SELECTOR);
    const mobile = isMobile();
    const side = is7
      ? (mobile ? STAR7_SIDE_MOBILE : STAR7_SIDE)
      : (mobile ? MAX_SIDE_MOBILE : MAX_SIDE);

    const applySize = () => {
      const nw = portrait.naturalWidth || portrait.videoWidth || 1;
      const nh = portrait.naturalHeight || portrait.videoHeight || 1;
      const ratio = nw / nh;
      let width = side, height = side;
      if (ratio >= 1) height = side / ratio;
      else width = side * ratio;

      // Zachowujemy proporcje pliku źródłowego. Portret nie jest rozciągany,
      // a ramka i kontener otrzymują identyczny obrys.
      wrap.style.setProperty('--portrait-frame-width', `${width.toFixed(2)}px`);
      wrap.style.setProperty('--portrait-frame-height', `${height.toFixed(2)}px`);
      wrap.style.setProperty('--portrait-frame-width-mobile',
        `${(mobile ? width : width * MAX_SIDE_MOBILE / MAX_SIDE).toFixed(2)}px`);
      wrap.style.setProperty('--portrait-frame-height-mobile',
        `${(mobile ? height : height * MAX_SIDE_MOBILE / MAX_SIDE).toFixed(2)}px`);

      const bounds = frameAlphaBounds(frame);
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        // Przesuwamy i skalujemy PNG tak, aby obszar nieprzezroczysty ramki
        // pokrył dokładnie obrys kontenera. Działa także przy przezroczystym marginesie.
        const fw = width / bounds.width;
        const fh = height / bounds.height;
        wrap.style.setProperty('--frame-width', `${fw.toFixed(2)}px`);
        wrap.style.setProperty('--frame-height', `${fh.toFixed(2)}px`);
        wrap.style.setProperty('--frame-left', `${(-bounds.x * fw).toFixed(2)}px`);
        wrap.style.setProperty('--frame-top', `${(-bounds.y * fh).toFixed(2)}px`);
      } else {
        wrap.style.setProperty('--frame-width', '100%');
        wrap.style.setProperty('--frame-height', '100%');
        wrap.style.setProperty('--frame-left', '0px');
        wrap.style.setProperty('--frame-top', '0px');
      }
      wrap.classList.add('frame-autofit');
    };

    if (portrait.complete && (portrait.naturalWidth || portrait.tagName !== 'IMG')) applySize();
    else portrait.addEventListener('load', applySize, { once: true });
    if (frame.complete && frame.naturalWidth) applySize();
    else frame.addEventListener('load', applySize, { once: true });
  }

  function scan(root = document) {
    if (root.matches?.(SELECTOR)) fitWrap(root);
    root.querySelectorAll?.(SELECTOR).forEach(fitWrap);
  }

  function start() {
    scan();
    const observer = new MutationObserver(records => {
      for (const record of records) {
        record.addedNodes.forEach(node => {
          if (node.nodeType === 1) scan(node);
        });
        if (record.type === 'attributes' && record.target.closest) {
          scan(record.target.closest(SELECTOR) || record.target.parentElement || document);
        }
      }
    });
    observer.observe(document.documentElement, {
      subtree: true, childList: true, attributes: true,
      attributeFilter: ['src', 'class']
    });
    window.addEventListener('resize', () => scan(), { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else start();
})();
