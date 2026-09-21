document.addEventListener('DOMContentLoaded', () => {
  const labels = document.querySelectorAll('[data-offerte-label]');

  if (!labels.length) return;

  const revealScrollThreshold = 300;
  const swipeFadeDistance = 140;
  const swipeDismissDistance = 140;
  const swipeActivationDistance = 8;
  let scrollTicking = false;

  const labelState = new WeakMap();

  const setVisible = (target) => {
    if (labelState.get(target)?.dismissed) return;

    target.classList.remove('translate-x-full', 'opacity-0');
    target.classList.add('translate-x-0', 'opacity-100');
  };

  const setHidden = (target) => {
    target.classList.remove('translate-x-0', 'opacity-100');
    target.classList.add('translate-x-full', 'opacity-0');
  };

  const revealAll = () => {
    labels.forEach((label) => {
      setVisible(label);
    });
  };

  const syncWithScroll = () => {
    const shouldReveal = window.scrollY >= revealScrollThreshold;

    labels.forEach((label) => {
      if (labelState.get(label)?.dismissed) {
        setHidden(label);
        return;
      }

      if (shouldReveal) {
        setVisible(label);
        return;
      }

      setHidden(label);
    });
  };

  const onScroll = () => {
    if (scrollTicking) return;

    scrollTicking = true;
    window.requestAnimationFrame(() => {
      syncWithScroll();
      scrollTicking = false;
    });
  };

  const initializeRevealCycle = () => {
    syncWithScroll();
  };

  const resetSwipeVisualState = (label, { preserveVerticalOffset = false } = {}) => {
    if (!preserveVerticalOffset) {
      label.style.removeProperty('--tw-translate-y');
    }

    label.style.removeProperty('opacity');
  };

  const dismissLabel = (label) => {
    const state = labelState.get(label);

    if (!state) return;

    state.dismissed = true;
    state.dragging = false;
    state.pointerId = null;

    resetSwipeVisualState(label, { preserveVerticalOffset: true });
    setHidden(label);
  };

  const initializeSwipe = (label) => {
    const state = {
      dismissed: false,
      dragging: false,
      startY: 0,
      dragOffsetY: 0,
      pointerId: null,
      suppressClick: false,
    };

    labelState.set(label, state);
    label.style.touchAction = 'none';

    const releaseIfCaptured = (pointerId) => {
      if (pointerId === null || pointerId === undefined) {
        return;
      }

      if (label.hasPointerCapture(pointerId)) {
        label.releasePointerCapture(pointerId);
      }
    };

    const resetPointerState = () => {
      releaseIfCaptured(state.pointerId);
      state.dragging = false;
      state.dragOffsetY = 0;
      state.pointerId = null;
      resetSwipeVisualState(label);
    };

    label.addEventListener('pointerdown', (event) => {
      if (state.dismissed) return;
      if (event.pointerType === 'mouse') return;
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      if (event.button !== 0) return;

      state.pointerId = event.pointerId;
      state.startY = event.clientY;
      state.dragOffsetY = 0;
      state.dragging = false;

      label.setPointerCapture(event.pointerId);
    });

    label.addEventListener('pointermove', (event) => {
      if (state.dismissed) return;
      if (state.pointerId !== event.pointerId) return;

      const dragOffsetY = event.clientY - state.startY;
      const dragDistance = Math.abs(dragOffsetY);

      if (!state.dragging && dragDistance >= swipeActivationDistance) {
        state.dragging = true;
      }

      if (!state.dragging) return;

      state.dragOffsetY = dragOffsetY;
      label.style.setProperty('--tw-translate-y', `calc(-50% + ${dragOffsetY}px)`);

      const opacity = Math.max(0, 1 - dragDistance / swipeFadeDistance);
      label.style.opacity = String(opacity);

      event.preventDefault();
    });

    const finishSwipe = (event) => {
      if (state.pointerId !== event.pointerId) return;

      const dragDistance = Math.abs(state.dragOffsetY);
      const shouldDismiss = state.dragging && dragDistance >= swipeDismissDistance;

      if (shouldDismiss) {
        dismissLabel(label);
        state.suppressClick = true;
      } else {
        resetSwipeVisualState(label);
      }

      state.dragging = false;
      state.dragOffsetY = 0;
      state.pointerId = null;
      releaseIfCaptured(event.pointerId);
    };

    label.addEventListener('pointerup', finishSwipe);
    label.addEventListener('pointercancel', finishSwipe);
    label.addEventListener('lostpointercapture', () => {
      state.pointerId = null;
      state.dragging = false;
      state.dragOffsetY = 0;
      resetSwipeVisualState(label);
    });

    window.addEventListener('blur', resetPointerState);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        resetPointerState();
      }
    });

    label.addEventListener('click', (event) => {
      if (state.dismissed || state.suppressClick) {
        event.preventDefault();
        event.stopPropagation();
        state.suppressClick = false;
      }
    });
  };

  labels.forEach((label) => {
    initializeSwipe(label);
  });

  if (document.readyState === 'complete') {
    initializeRevealCycle();
  } else {
    window.addEventListener('load', initializeRevealCycle, { once: true });
  }

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) {
      return;
    }

    initializeRevealCycle();
  });

  window.addEventListener('scroll', onScroll, { passive: true });
});
