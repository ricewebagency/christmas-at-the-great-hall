document.addEventListener('DOMContentLoaded', () => {
  const mobileCarousel = document.querySelector('[data-topbar-carousel]');

  if (!mobileCarousel) {
    return;
  }

  const mobileQuery = window.matchMedia('(max-width: 767px)');
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const slideItems = Array.from(mobileCarousel.querySelectorAll('[data-topbar-item]'));
  const realItems = Array.from(mobileCarousel.querySelectorAll('[data-topbar-item]:not([data-topbar-clone])'));
  const firstRealIndex = 1;

  let intervalId = null;
  let scrollTimeoutId = null;
  let isProgrammaticScroll = false;
  let activeIndex = 0;
  let isNormalized = false;

  const stopRotation = () => {
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }

    if (scrollTimeoutId) {
      window.clearTimeout(scrollTimeoutId);
      scrollTimeoutId = null;
    }
  };

  const withInstantScroll = (callback) => {
    const previousBehavior = mobileCarousel.style.scrollBehavior;
    mobileCarousel.style.scrollBehavior = 'auto';

    try {
      callback();
    } finally {
      mobileCarousel.style.scrollBehavior = previousBehavior;
    }
  };

  const getSlideWidth = () => mobileCarousel.clientWidth || window.innerWidth;

  const getMaxScrollLeft = () => Math.max(0, mobileCarousel.scrollWidth - mobileCarousel.clientWidth);

  const getCurrentIndex = () => {
    const slideWidth = getSlideWidth();

    if (!slideWidth) {
      return 0;
    }

    return Math.round(mobileCarousel.scrollLeft / slideWidth);
  };

  const isAtEndBoundary = () => {
    const maxScrollLeft = getMaxScrollLeft();

    return mobileCarousel.scrollLeft >= maxScrollLeft - 2;
  };

  const isAtStartBoundary = () => mobileCarousel.scrollLeft <= 2;

  const scrollToIndex = (index, smooth = true) => {
    if (!slideItems.length) {
      return;
    }

    const nextIndex = ((index % slideItems.length) + slideItems.length) % slideItems.length;
    const slideWidth = getSlideWidth();

    activeIndex = nextIndex;
    isProgrammaticScroll = smooth;
    isNormalized = false;

    const performScroll = () => {
      mobileCarousel.scrollTo({
        left: slideWidth * nextIndex,
        behavior: smooth ? 'smooth' : 'auto',
      });
    };

    if (smooth) {
      performScroll();
    } else {
      withInstantScroll(performScroll);
    }

    if (scrollTimeoutId) {
      window.clearTimeout(scrollTimeoutId);
    }

    scrollTimeoutId = window.setTimeout(() => {
      isProgrammaticScroll = false;
    }, smooth ? 500 : 0);
  };

  const normalizeLoop = () => {
    if (!realItems.length) {
      return;
    }

    const lastRealIndex = realItems.length;
    const lastCloneIndex = slideItems.length - 1;
    const currentIndex = getCurrentIndex();

    if (currentIndex <= 0 || isAtStartBoundary()) {
      isNormalized = true;
      scrollToIndex(lastRealIndex, false);
      return;
    }

    if (currentIndex >= lastCloneIndex || isAtEndBoundary()) {
      isNormalized = true;
      scrollToIndex(firstRealIndex, false);
      return;
    }

    activeIndex = currentIndex;
    isNormalized = true;
  };

  const startRotation = () => {
    stopRotation();

    if (!mobileQuery.matches || reduceMotionQuery.matches || realItems.length < 2) {
      return;
    }

    intervalId = window.setInterval(() => {
      const currentIndex = isNormalized ? activeIndex : getCurrentIndex();
      const nextIndex = currentIndex >= realItems.length ? firstRealIndex : currentIndex + 1;

      scrollToIndex(nextIndex, true);
    }, 3500);
  };

  mobileCarousel.addEventListener('scroll', () => {
    if (isProgrammaticScroll) {
      return;
    }

    if (scrollTimeoutId) {
      window.clearTimeout(scrollTimeoutId);
    }

    scrollTimeoutId = window.setTimeout(() => {
      normalizeLoop();
      startRotation();
    }, 120);
  }, { passive: true });

  mobileCarousel.addEventListener('pointerdown', stopRotation, { passive: true });
  mobileCarousel.addEventListener('touchstart', stopRotation, { passive: true });

  const resumeAfterInteraction = () => {
    normalizeLoop();
    startRotation();
  };

  mobileCarousel.addEventListener('pointerup', resumeAfterInteraction, { passive: true });
  mobileCarousel.addEventListener('pointercancel', resumeAfterInteraction, { passive: true });

  mobileCarousel.addEventListener('touchend', resumeAfterInteraction, { passive: true });
  mobileCarousel.addEventListener('touchcancel', resumeAfterInteraction, { passive: true });

  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', startRotation);
    reduceMotionQuery.addEventListener('change', startRotation);
  } else {
    mobileQuery.addListener(startRotation);
    reduceMotionQuery.addListener(startRotation);
  }

  const handleResize = () => {
    withInstantScroll(() => {
      scrollToIndex(Math.max(firstRealIndex, Math.min(activeIndex || firstRealIndex, realItems.length)), false);
    });
  };

  window.addEventListener('resize', handleResize, { passive: true });

  withInstantScroll(() => {
    scrollToIndex(firstRealIndex, false);
    normalizeLoop();
  });
  startRotation();
});