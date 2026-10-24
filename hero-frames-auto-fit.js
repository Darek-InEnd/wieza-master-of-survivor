/* Wieża: auto-fit ramek. Ładowany automatycznie przez sw.js. */
(() => {
  "use strict";
  const DESKTOP_MAX = 66, MOBILE_MAX = 58;
  function fit(wrap) {
    const portrait = wrap.querySelector(".hero-v2-portrait");
    if (!portrait) return;
    const apply = () => {
      const nw = portrait.naturalWidth || 1, nh = portrait.naturalHeight || 1;
      const max = matchMedia("(max-width:700px)").matches ? MOBILE_MAX : DESKTOP_MAX;
      const scale = Math.min(max / nw, max / nh);
      const w = Math.max(1, Math.round(nw * scale)), h = Math.max(1, Math.round(nh * scale));
      wrap.style.setProperty("width", `${w}px`, "important");
      wrap.style.setProperty("height", `${h}px`, "important");
      wrap.style.setProperty("flex-basis", `${w}px`, "important");
      wrap.style.setProperty("aspect-ratio", `${w} / ${h}`, "important");
      const frame = wrap.querySelector(".hero-portrait-frame-overlay");
      if (frame) {
        frame.style.setProperty("inset", "0", "important");
        frame.style.setProperty("width", "100%", "important");
        frame.style.setProperty("height", "100%", "important");
        frame.style.setProperty("transform", "none", "important");
        frame.style.setProperty("object-fit", "fill", "important");
      }
    };
    if (portrait.complete && (portrait.naturalWidth || portrait.tagName === "DIV")) apply();
    else portrait.addEventListener("load", apply, { once: true });
  }
  function scan(root = document) {
    if (root.matches?.(".hero-portrait-frame-wrap")) fit(root);
    root.querySelectorAll?.(".hero-portrait-frame-wrap").forEach(fit);
  }
  const start = () => {
    scan();
    new MutationObserver(records => records.forEach(r => r.addedNodes.forEach(n => {
      if (n.nodeType === 1) scan(n);
    }))).observe(document.documentElement, { subtree: true, childList: true });
    addEventListener("resize", () => scan());
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
