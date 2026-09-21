document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loadingScreen');
  const loadingLogo = document.getElementById('loadingScreenLogo');
  const loadingImageA = document.getElementById('loadingScreenImageA');
  const loadingImageB = document.getElementById('loadingScreenImageB');
  
  if (!loadingScreen || !loadingLogo || !loadingImageA || !loadingImageB) return;

  const basePath = (loadingScreen.dataset.logoBasePath || './').replace(/\/+$/, '');
  const loadingFrames = [
    'assets/images/logos/lumazon-icon-wit-geel-loading-1.png',
    'assets/images/logos/lumazon-icon-wit-geel-loading-2.png',
    'assets/images/logos/lumazon-icon-wit-geel-loading-3.png',
    'assets/images/logos/lumazon-icon-wit-geel-loading-4.png',
    'assets/images/logos/lumazon-icon-wit-geel-loading-5.png',
    'assets/images/logos/lumazon-icon-wit-geel-loading-6.png',
  ].map((frame) => `${basePath}/${frame.replace(/^\/?/, '')}`);

  loadingFrames.forEach((source) => {
    const image = new Image();
    image.src = source;
  });

  const frameDelay = 100;
  const introRevealDelay = 100;
  const initialHoldDelay = 260;
  const finalFadeDelay = 120;
  const removeDelay = 500;

  const delay = (duration) => new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

  const setOpacity = (element, isVisible) => {
    element.classList.toggle('opacity-100', isVisible);
    element.classList.toggle('opacity-0', !isVisible);
  };

  const createFrameLayer = (source) => {
    const layer = document.createElement('img');
    layer.src = source;
    layer.alt = 'Lumazon';
    layer.decoding = 'async';
    layer.className = 'absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-220 ease-out';
    loadingLogo.appendChild(layer);
    return layer;
  };

  const fadeOutLogo = () => {
    loadingLogo.classList.remove('opacity-100', 'scale-100');
    loadingLogo.classList.add('opacity-0', 'scale-95');
  };

  const startSequence = async (startIndex = 1) => {
    for (let index = startIndex; index < loadingFrames.length; index += 1) {
      const nextLayer = createFrameLayer(loadingFrames[index]);

      window.requestAnimationFrame(() => {
        setOpacity(nextLayer, true);
      });

      // Keep previous layers visible; only fade in the new top layer.
      await delay(frameDelay);
    }

    await delay(finalFadeDelay);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        fadeOutLogo();
      });
    });

    window.setTimeout(() => {
      loadingScreen.remove();
    }, removeDelay);
  };

  // Use loading-1 as the base frame and keep the second starter layer hidden.
  loadingImageA.src = loadingFrames[0];
  loadingImageB.src = loadingFrames[0];
  loadingImageA.classList.remove('duration-75');
  loadingImageB.classList.remove('duration-75');
  loadingImageA.classList.add('duration-220');
  loadingImageB.classList.add('duration-220');

  // Keep loading-1 hidden at first, then fade it in once.
  setOpacity(loadingImageA, false);
  setOpacity(loadingImageB, false);

  const revealTimer = window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      setOpacity(loadingImageA, true);
      setOpacity(loadingImageB, false);
    });
  }, introRevealDelay);

  const timer = window.setTimeout(() => {
    startSequence(1);
  }, introRevealDelay + initialHoldDelay);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    window.clearTimeout(revealTimer);
    window.clearTimeout(timer);
  });
});
