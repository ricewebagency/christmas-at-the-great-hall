document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loadingScreen');
  const leftDoor = document.getElementById('loadingScreenDoorLeft');
  const rightDoor = document.getElementById('loadingScreenDoorRight');

  if (!loadingScreen || !leftDoor || !rightDoor) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const exitDelay = prefersReducedMotion ? 150 : 1150;
  const exitFadeDelay = prefersReducedMotion ? 120 : 180;
  const removeDelay = prefersReducedMotion ? 260 : 980;

  let hasExited = false;

  const removeScreen = () => {
    if (!loadingScreen.isConnected) return;
    loadingScreen.remove();
  };

  const openDoors = () => {
    if (hasExited) return;
    hasExited = true;

    leftDoor.classList.add('-translate-x-full');
    rightDoor.classList.add('translate-x-full');

    window.setTimeout(removeScreen, removeDelay);
  };

  const startExitSequence = () => {
    window.setTimeout(() => {
      window.requestAnimationFrame(openDoors);
    }, exitFadeDelay);
  };

  const fallbackTimer = window.setTimeout(startExitSequence, exitDelay);

  window.addEventListener('load', () => {
    window.clearTimeout(fallbackTimer);
    startExitSequence();
  }, { once: true });
});