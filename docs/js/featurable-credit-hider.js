(() => {
  // Branding target: houd ’m stabiel (href + optioneel class-fragment)
  const SELECTOR = [
    'a[href^="https://featurable.com"][href*="utm_source=widget"]',
    'a[href^="https://featurable.com"][href*="utm_medium="]',
    'a[class*="Branding-module__container"]',
    '[class*="Branding-module__container"] a[href^="https://featurable.com"]'
  ].join(',');

  const MARK = 'data-featurable-branding-hidden';
  const observedRoots = new WeakSet();
  let scheduled = false;

  function applyHide(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.hasAttribute(MARK)) return;

    el.setAttribute(MARK, '1');
    el.setAttribute('aria-hidden', 'true');
    el.tabIndex = -1;

    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('opacity', '0', 'important');
    el.style.setProperty('pointer-events', 'none', 'important');
  }

  function hideInRoot(root) {
    const matches = root.querySelectorAll?.(SELECTOR);
    if (matches && matches.length) matches.forEach(applyHide);
  }

  function walkAndHide(root) {
    // 1) hide in this root
    hideInRoot(root);

    // 2) recurse into shadow roots (open)
    const all = root.querySelectorAll?.('*');
    if (!all) return;

    for (const el of all) {
      if (el.shadowRoot) {
        observeRoot(el.shadowRoot);
        walkAndHide(el.shadowRoot);
      }
    }
  }

  function observeRoot(root) {
    if (!root || observedRoots.has(root)) return;
    observedRoots.add(root);

    const mo = new MutationObserver(() => scheduleScan());
    mo.observe(root, { childList: true, subtree: true });
  }

  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      // scan document + all reachable shadow roots
      walkAndHide(document);
    });
  }

  // Optional CSS: helpt alleen buiten shadow DOM, maar is harmless
  function injectCSS() {
    if (document.getElementById('featurable-branding-hide-style')) return;
    const style = document.createElement('style');
    style.id = 'featurable-branding-hide-style';
    style.textContent = `${SELECTOR}{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}`;
    document.head.appendChild(style);
  }

  // Start
  injectCSS();
  observeRoot(document.documentElement);
  scheduleScan();
})();
