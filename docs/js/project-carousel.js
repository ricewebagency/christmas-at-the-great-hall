document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.querySelector('[data-project-carousel]');

  if (!carousel) {
    return;
  }

  const scrollContainer = carousel.querySelector('[data-project-carousel-scroll]');
  const prevButton = carousel.querySelector('[data-project-carousel-prev]');
  const nextButton = carousel.querySelector('[data-project-carousel-next]');
  const cards = Array.from(carousel.querySelectorAll('[data-project-carousel-card]'));

  if (!scrollContainer || !prevButton || !nextButton || cards.length < 1) {
    return;
  }

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const getCurrentCardIndex = () => {
    const firstCard = cards[0];

    if (!firstCard) {
      return 0;
    }

    const cardWidth = firstCard.getBoundingClientRect().width;
    const trackStyle = window.getComputedStyle(scrollContainer.querySelector('[data-project-carousel-track]'));
    const gap = Number.parseFloat(trackStyle.columnGap || trackStyle.gap || '0');
    const step = cardWidth + (Number.isFinite(gap) ? gap : 0);

    if (!step) {
      return 0;
    }

    return Math.max(0, Math.min(cards.length - 1, Math.round(scrollContainer.scrollLeft / step)));
  };

  const updateButtonState = () => {
    const maxScrollLeft = Math.max(0, scrollContainer.scrollWidth - scrollContainer.clientWidth - 1);
    const atStart = scrollContainer.scrollLeft <= 0;
    const atEnd = scrollContainer.scrollLeft >= maxScrollLeft;

    prevButton.disabled = atStart;
    nextButton.disabled = atEnd;
    prevButton.setAttribute('aria-disabled', String(atStart));
    nextButton.setAttribute('aria-disabled', String(atEnd));
  };

  const scrollToCard = (index) => {
    const targetIndex = Math.max(0, Math.min(index, cards.length - 1));
    const targetCard = cards[targetIndex];

    if (!targetCard) {
      return;
    }

    targetCard.scrollIntoView({
      behavior: reduceMotionQuery.matches ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'start',
    });
  };

  prevButton.addEventListener('click', () => {
    scrollToCard(getCurrentCardIndex() - 1);
  });

  nextButton.addEventListener('click', () => {
    scrollToCard(getCurrentCardIndex() + 1);
  });

  scrollContainer.addEventListener(
    'scroll',
    () => {
      window.requestAnimationFrame(updateButtonState);
    },
    { passive: true }
  );

  window.addEventListener('resize', updateButtonState);
  updateButtonState();
});