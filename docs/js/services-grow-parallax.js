document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('[data-service-grow-wrap]');
  const frame = document.querySelector('[data-service-grow-frame]');
  const gallery = frame ? frame.querySelector('[data-service-gallery]') : null;
  const thumbsWrap = gallery ? gallery.querySelector('[data-service-gallery-thumbs]') : null;
  const thumbs = thumbsWrap ? Array.from(thumbsWrap.querySelectorAll('[data-service-gallery-thumb]')) : [];
  const mainMedia = gallery ? gallery.querySelector('[data-service-gallery-main]') : null;

  if (!wrapper || !frame) {
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const expandDurationMs = 1600;
  const thumbsRevealLeadMs = 900;

  let ticking = false;
  let isExpanded = false;
  let thumbsVisible = false;
  let revealTimeoutId = null;
  let waitingForExpandEndReveal = false;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const getSizes = () => {
    const viewportHeight = window.innerHeight || 1;
    const wrapperWidth = wrapper.clientWidth || viewportHeight;
    const wrapperStyles = window.getComputedStyle(wrapper);
    const paddingLeft = Number.parseFloat(wrapperStyles.paddingLeft) || 0;
    const paddingRight = Number.parseFloat(wrapperStyles.paddingRight) || 0;
    const wrapperInnerWidth = Math.max(0, wrapperWidth - paddingLeft - paddingRight);
    const startSize = clamp(wrapperInnerWidth * 0.36, 140, 230);
    const endWidth = Math.max(startSize, wrapperInnerWidth);
    const endHeight = Math.max(startSize, endWidth * (window.innerWidth < 640 ? 0.82 : 0.56));

    return {
      startWidth: startSize,
      startHeight: startSize,
      startRadius: 28,
      endWidth,
      endHeight,
      endRadius: 10,
    };
  };

  const setMainMaskState = (expanded, immediate = false) => {
    if (!mainMedia) {
      return;
    }

    const collapsedClipPath = 'inset(26% round 22px)';
    const expandedClipPath = 'inset(-1px round 22px)';

    if (reduceMotion.matches || immediate) {
      mainMedia.style.transition = 'none';
    } else {
      mainMedia.style.transition = `clip-path ${expandDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    }

    mainMedia.style.left = '-1px';
    mainMedia.style.right = '-1px';
    mainMedia.style.top = '-1px';
    mainMedia.style.bottom = '-1px';
    mainMedia.style.clipPath = expanded ? expandedClipPath : collapsedClipPath;
    mainMedia.style.webkitClipPath = expanded ? expandedClipPath : collapsedClipPath;

    if (reduceMotion.matches || immediate) {
      window.requestAnimationFrame(() => {
        mainMedia.style.transition = '';
      });
    }
  };

  const setVisualState = (expanded, immediate = false) => {
    const sizes = getSizes();

    if (reduceMotion.matches || immediate) {
      frame.style.transition = 'none';
    } else {
      frame.style.transition =
        `width ${expandDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), height ${expandDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${expandDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    }

    if (expanded) {
      frame.style.width = `${sizes.endWidth}px`;
      frame.style.height = `${sizes.endHeight}px`;
      frame.style.borderRadius = `${sizes.endRadius}px`;
    } else {
      frame.style.width = `${sizes.startWidth}px`;
      frame.style.height = `${sizes.startHeight}px`;
      frame.style.borderRadius = `${sizes.startRadius}px`;
    }

    setMainMaskState(expanded, immediate);

    if (reduceMotion.matches || immediate) {
      window.requestAnimationFrame(() => {
        frame.style.transition = '';
      });
    }
  };

  const hideThumbs = () => {
    if (!thumbsWrap) {
      return;
    }

    thumbsVisible = false;
    thumbsWrap.style.opacity = '1';
    thumbsWrap.style.transform = 'none';
    thumbsWrap.style.transition = 'none';
    thumbsWrap.style.pointerEvents = 'none';

    thumbs.forEach((thumb) => {
      thumb.style.opacity = '0';
      thumb.style.transform = 'translateY(12px)';
      thumb.style.transition = 'none';
    });
  };

  const revealThumbs = (immediate = false) => {
    if (!thumbsWrap) {
      return;
    }

    thumbsVisible = true;
    thumbsWrap.style.pointerEvents = 'auto';

    if (immediate || reduceMotion.matches) {
      thumbs.forEach((thumb) => {
        thumb.style.opacity = '1';
        thumb.style.transform = 'translateY(0)';
        thumb.style.transition = 'none';
      });
      return;
    }

    thumbs.forEach((thumb, index) => {
      thumb.style.opacity = '0';
      thumb.style.transform = 'translateY(14px)';
      thumb.style.transition = 'none';
    });

    // Use a double RAF so hidden start state is painted before transition starts.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        thumbs.forEach((thumb, index) => {
          const delayMs = index * 90;

          thumb.style.transition = `transform 520ms cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms, opacity 420ms ease-out ${delayMs}ms`;
          thumb.style.opacity = '1';
          thumb.style.transform = 'translateY(0)';
        });
      });
    });
  };

  const clearRevealTimer = () => {
    if (revealTimeoutId) {
      window.clearTimeout(revealTimeoutId);
      revealTimeoutId = null;
    }
  };

  const queueThumbRevealAfterExpand = () => {
    clearRevealTimer();
    waitingForExpandEndReveal = true;

    if (reduceMotion.matches) {
      revealThumbs(true);
      return;
    }

    const revealDelayMs = Math.max(0, expandDurationMs - thumbsRevealLeadMs);

    revealTimeoutId = window.setTimeout(() => {
      revealTimeoutId = null;

      if (isExpanded && waitingForExpandEndReveal) {
        waitingForExpandEndReveal = false;
        revealThumbs(false);
      }
    }, revealDelayMs);
  };

  const onFrameTransitionEnd = (event) => {
    if (!waitingForExpandEndReveal || !isExpanded) {
      return;
    }

    if (event.target !== frame || event.propertyName !== 'width') {
      return;
    }

    waitingForExpandEndReveal = false;

    if (!thumbsVisible) {
      revealThumbs(false);
    }
  };

  const updateStateFromScroll = () => {
    const rect = wrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const triggerLine = viewportHeight * 0.62;
    const resetLine = viewportHeight * 0.74;
    const shouldExpand = rect.top <= triggerLine;
    const shouldCollapse = rect.top > resetLine;

    if (!isExpanded && shouldExpand) {
      isExpanded = true;
      hideThumbs();
      setVisualState(true);
      queueThumbRevealAfterExpand();
      return;
    }

    if (isExpanded && shouldCollapse) {
      isExpanded = false;
      waitingForExpandEndReveal = false;
      clearRevealTimer();
      hideThumbs();
      setVisualState(false);
    }
  };

  const onScrollOrResize = () => {
    if (ticking) {
      return;
    }

    ticking = true;

    window.requestAnimationFrame(() => {
      updateStateFromScroll();
      ticking = false;
    });
  };

  frame.style.willChange = 'width, height, border-radius';
  if (mainMedia) {
    mainMedia.style.willChange = 'clip-path';
  }
  hideThumbs();
  isExpanded = false;
  setVisualState(false, true);

  frame.addEventListener('transitionend', onFrameTransitionEnd);

  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', () => {
    setVisualState(isExpanded, true);

    if (isExpanded && thumbsVisible) {
      revealThumbs(true);
    }

    onScrollOrResize();
  });

  const onMotionChange = () => {
    setVisualState(isExpanded, true);
    waitingForExpandEndReveal = false;

    if (isExpanded) {
      clearRevealTimer();
      revealThumbs(true);
    }
  };

  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', onMotionChange);
  } else if (typeof reduceMotion.addListener === 'function') {
    reduceMotion.addListener(onMotionChange);
  }
});
