document.addEventListener('DOMContentLoaded', () => {
  const targets = Array.from(document.querySelectorAll('[data-line-reveal]'));

  if (!targets.length) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const states = new Map();

  const normalizeText = (value) => value.replace(/\s+/g, ' ').trim();

  const buildLineReveal = (target) => {
    const existingState = states.get(target);
    const wasRevealed = Boolean(existingState?.revealed);

    if (existingState?.observer) {
      existingState.observer.disconnect();
    }

    const rawText = normalizeText(target.textContent || '');

    if (!rawText) {
      return;
    }

    const computedStyle = window.getComputedStyle(target);
    const lineHeight = computedStyle.lineHeight;

    const tokens = rawText.match(/\S+\s*/g) || [rawText];
    const wordSpans = tokens.map((token) => {
      const span = document.createElement('span');
      span.textContent = token;
      span.style.display = 'inline-block';
      span.style.whiteSpace = 'pre';
      return span;
    });

    target.textContent = '';
    wordSpans.forEach((span) => target.appendChild(span));

    const firstDelay = Number.parseFloat(target.getAttribute('data-line-reveal-delay') || '0');
    const staggerMs = Number.parseInt(target.getAttribute('data-line-reveal-stagger') || '100', 10);

    const groups = [];

    wordSpans.forEach((span) => {
      const offsetTop = span.offsetTop;
      const currentGroup = groups[groups.length - 1];

      if (!currentGroup || currentGroup.offsetTop !== offsetTop) {
        groups.push({ offsetTop, words: [span] });
        return;
      }

      currentGroup.words.push(span);
    });

    const fragment = document.createDocumentFragment();
    const lineInners = [];

    groups.forEach((group, lineIndex) => {
      const clip = document.createElement('span');
      clip.style.display = 'block';
      clip.style.overflow = 'hidden';
      clip.style.lineHeight = lineHeight;

      const inner = document.createElement('span');
      inner.style.display = 'inline-block';
      inner.style.lineHeight = lineHeight;
      inner.style.transform = 'translate3d(0, 110%, 0)';
      inner.style.opacity = '0';
      inner.style.willChange = 'transform, opacity';
      inner.style.transitionProperty = 'transform, opacity';
      inner.style.transitionDuration = '780ms';
      inner.style.transitionTimingFunction = 'cubic-bezier(0.22, 1, 0.36, 1)';
      inner.style.transitionDelay = `${Math.max(0, firstDelay * 1000) + lineIndex * Math.max(0, staggerMs)}ms`;

      group.words.forEach((word) => {
        word.style.display = 'inline';
        inner.appendChild(word);
      });

      clip.appendChild(inner);
      fragment.appendChild(clip);
      lineInners.push(inner);
    });

    target.textContent = '';
    target.appendChild(fragment);

    const state = {
      revealed: false,
      observer: null,
      lineInners,
    };

    states.set(target, state);

    if (prefersReducedMotion || wasRevealed) {
      lineInners.forEach((line) => {
        line.style.transform = 'translate3d(0, 0, 0)';
        line.style.opacity = '1';

        // Keep rebuilds stable on resize once content has already been revealed.
        if (wasRevealed) {
          line.style.transition = 'none';
        }
      });
      state.revealed = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const currentState = states.get(target);

          if (!currentState || currentState.revealed) {
            observer.unobserve(target);
            return;
          }

          currentState.revealed = true;

          window.requestAnimationFrame(() => {
            currentState.lineInners.forEach((line) => {
              line.style.transform = 'translate3d(0, 0, 0)';
              line.style.opacity = '1';
            });
          });

          observer.unobserve(target);
        });
      },
      {
        root: null,
        threshold: 0.35,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    observer.observe(target);
    state.observer = observer;
  };

  targets.forEach((target) => {
    buildLineReveal(target);
  });

  // Fonts can change line breaks after DOMContentLoaded; rebuild once they are ready.
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      targets.forEach((target) => {
        buildLineReveal(target);
      });
    });
  }

  let resizeTicking = false;

  window.addEventListener('resize', () => {
    if (resizeTicking) {
      return;
    }

    resizeTicking = true;

    window.requestAnimationFrame(() => {
      targets.forEach((target) => {
        buildLineReveal(target);
      });

      resizeTicking = false;
    });
  });
});
