document.addEventListener('DOMContentLoaded', () => {
  const targets = document.querySelectorAll('[data-reveal-up], [data-animate-reveal-up], [data-animate-reveal-down]');

  if (!targets.length) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const getDelaySeconds = (target) => {
    const attributeValue = target.getAttribute('data-reveal-delay') || target.getAttribute('data-animate-delay') || '0';
    const configuredDelay = Number.parseFloat(attributeValue);
    return Number.isFinite(configuredDelay) ? Math.max(0, configuredDelay) : 0;
  };

  targets.forEach((target) => {
    const delaySeconds = getDelaySeconds(target);
    const delayMs = delaySeconds * 1000;

    if (prefersReducedMotion) {
      target.style.opacity = '1';
      target.style.filter = 'none';
      target.style.transform = 'translate3d(0, 0, 0)';
      target.style.willChange = 'auto';
      return;
    }

    target.style.opacity = '0';
    target.style.filter = 'blur(8px)';
    target.style.transform = 'translate3d(0, 14px, 0)';
    target.style.willChange = 'opacity, transform, filter';

    const reveal = () => {
      target.style.transitionProperty = 'opacity, transform, filter';
      target.style.transitionDuration = '1200ms';
      target.style.transitionTimingFunction = 'cubic-bezier(0.22, 1, 0.36, 1)';
      target.style.opacity = '1';
      target.style.filter = 'blur(0)';
      target.style.transform = 'translate3d(0, 0, 0)';

      window.setTimeout(() => {
        target.style.willChange = 'auto';
      }, 1300);
    };

    window.setTimeout(() => {
      window.requestAnimationFrame(reveal);
    }, delayMs);
  });
});
