document.addEventListener('DOMContentLoaded', () => {
  const hills = Array.from(document.querySelectorAll('.hero-hill'));

  if (!hills.length) {
    return;
  }

  const section = document.querySelector('main section');

  if (!section) {
    return;
  }

  let ticking = false;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const updateParallax = () => {
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const sectionHeight = rect.height || 1;
    const sectionTop = section.offsetTop || 0;
    const scrollStart = sectionTop - viewportHeight * 0.35;
    const scrollEnd = sectionTop + sectionHeight - viewportHeight * 0.25;
    const progress = clamp((window.scrollY - scrollStart) / Math.max(1, scrollEnd - scrollStart), 0, 1);
    const maxTranslate = window.innerWidth < 640 ? 72 : 130;

    hills.forEach((hill, index) => {
      const depth = Number.parseFloat(hill.getAttribute('data-parallax-depth') || '0.5');
      const scale = Number.parseFloat(hill.getAttribute('data-parallax-scale') || '0.08');
      const translateY = progress * maxTranslate * depth;
      const isBackHill = hill.classList.contains('z-0');
      const baseScaleX = isBackHill ? 1.25 : 1;
      const scaleX = baseScaleX + progress * (index === 0 ? scale : scale * 1.35);

      hill.style.transform = `translate3d(0, ${translateY}px, 0) scaleX(${scaleX})`;
    });

    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateParallax);
    }
  };

  updateParallax();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
});
