document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('[data-service-gallery]');
  const supportsIntersectionObserver = 'IntersectionObserver' in window;

  const prepareVideoForAutoplay = (videoEl) => {
    if (!videoEl || videoEl.tagName !== 'VIDEO') {
      return;
    }

    videoEl.muted = true;
    videoEl.defaultMuted = true;
    videoEl.playsInline = true;
    videoEl.autoplay = true;
    videoEl.loop = true;
    videoEl.setAttribute('muted', '');
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('webkit-playsinline', '');
  };

  const tryPlay = (videoEl) => {
    if (!videoEl || videoEl.tagName !== 'VIDEO') {
      return;
    }

    const playResult = videoEl.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(() => {});
    }
  };

  galleries.forEach((gallery) => {
    const mainWrap = gallery.querySelector('[data-service-gallery-main-wrap]');
    const mainMedia = gallery.querySelector('[data-service-gallery-main]');
    const nextMainMedia = gallery.querySelector('[data-service-gallery-main-next]');
    const thumbnails = Array.from(gallery.querySelectorAll('[data-service-gallery-thumb]'));

    if (!mainWrap || !mainMedia || thumbnails.length === 0) {
      return;
    }

    let activeMedia = mainMedia;
    let incomingMedia = nextMainMedia;

    const ensureVideoSource = (videoEl) => {
      if (!videoEl || videoEl.tagName !== 'VIDEO') {
        return;
      }

      prepareVideoForAutoplay(videoEl);

      const deferredSrc = videoEl.dataset.src;

      if (!deferredSrc || videoEl.getAttribute('src') === deferredSrc) {
        tryPlay(videoEl);
        return;
      }

      videoEl.src = deferredSrc;
      videoEl.load();
      tryPlay(videoEl);
    };

    const loadInitialGalleryVideos = () => {
      ensureVideoSource(mainMedia);

      thumbnails.forEach((thumb) => {
        const thumbVideo = thumb.querySelector('video[data-src]');
        ensureVideoSource(thumbVideo);
      });
    };

    const setActiveThumb = (activeThumb) => {
      thumbnails.forEach((thumb) => {
        const isActive = thumb === activeThumb;

        thumb.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        thumb.classList.toggle('after:opacity-0', isActive);
        thumb.classList.toggle('after:opacity-100', !isActive);
      });
    };

    const getMediaConfigFromThumb = (thumb) => {
      const mediaSrc = thumb.getAttribute('data-media-src') || thumb.getAttribute('data-video-src');

      if (!mediaSrc) {
        return null;
      }

      const explicitType = thumb.getAttribute('data-media-type');
      const mediaType = explicitType || (thumb.hasAttribute('data-video-src') ? 'video' : 'image');
      const mediaAlt = thumb.getAttribute('data-media-alt') || thumb.getAttribute('data-video-alt') || '';

      return {
        type: mediaType === 'image' ? 'image' : 'video',
        src: mediaSrc,
        alt: mediaAlt,
      };
    };

    const createMediaElement = (type, role, referenceEl) => {
      const element = document.createElement(type === 'video' ? 'video' : 'img');
      element.className = referenceEl.className;
      element.setAttribute(role === 'main' ? 'data-service-gallery-main' : 'data-service-gallery-main-next', '');
      element.setAttribute(
        'data-service-gallery-object-position',
        referenceEl.getAttribute('data-service-gallery-object-position') || '50% 50%',
      );

      if (type === 'video') {
        element.setAttribute('autoplay', '');
        element.setAttribute('loop', '');
        element.setAttribute('muted', '');
        element.setAttribute('playsinline', '');
        element.setAttribute('webkit-playsinline', '');
        element.setAttribute('preload', 'metadata');
        element.setAttribute('aria-label', '');
        prepareVideoForAutoplay(element);
      } else {
        element.setAttribute('loading', 'lazy');
        element.setAttribute('decoding', 'async');
        element.setAttribute('alt', '');
      }

      mainWrap.appendChild(element);
      return element;
    };

    const ensureMediaType = (currentMedia, targetType, role) => {
      const expectedTag = targetType === 'video' ? 'VIDEO' : 'IMG';

      if (currentMedia && currentMedia.tagName === expectedTag) {
        return currentMedia;
      }

      const replacement = createMediaElement(targetType, role, currentMedia || activeMedia);

      if (currentMedia) {
        currentMedia.remove();
      }

      return replacement;
    };

    const applyMediaSource = (element, mediaConfig) => {
      if (element.tagName === 'VIDEO') {
        prepareVideoForAutoplay(element);
        element.src = mediaConfig.src;
        element.removeAttribute('data-src');
        element.load();
        tryPlay(element);
        element.setAttribute('aria-label', mediaConfig.alt || element.getAttribute('aria-label') || '');
      } else {
        element.src = mediaConfig.src;
        element.alt = mediaConfig.alt || element.alt;
      }
    };

    const onMediaReady = (element, callback) => {
      if (element.tagName === 'VIDEO') {
        if (element.readyState >= 2) {
          callback();
          return;
        }

        let hasResolved = false;
        const handleReady = () => {
          if (hasResolved) {
            return;
          }

          hasResolved = true;
          element.removeEventListener('loadeddata', handleReady);
          element.removeEventListener('canplaythrough', handleReady);
          element.removeEventListener('error', handleReady);
          callback();
        };

        element.addEventListener('loadeddata', handleReady, { once: true });
        element.addEventListener('canplaythrough', handleReady, { once: true });
        element.addEventListener('error', handleReady, { once: true });
        return;
      }

      if (element.complete && element.naturalWidth > 0) {
        callback();
        return;
      }

      let hasResolved = false;
      const handleReady = () => {
        if (hasResolved) {
          return;
        }

        hasResolved = true;
        element.removeEventListener('load', handleReady);
        element.removeEventListener('error', handleReady);
        callback();
      };

      element.addEventListener('load', handleReady, { once: true });
      element.addEventListener('error', handleReady, { once: true });
    };

    const resetMediaState = () => {
      activeMedia.classList.remove('opacity-0');
      activeMedia.classList.add('opacity-100');

      incomingMedia.classList.remove('opacity-100');
      incomingMedia.classList.add('opacity-0');
    };

    const transitionMedia = (mediaConfig) => {
      if (!incomingMedia) {
        activeMedia = ensureMediaType(activeMedia, mediaConfig.type, 'main');
        applyMediaSource(activeMedia, mediaConfig);

        return;
      }

      incomingMedia = ensureMediaType(incomingMedia, mediaConfig.type, 'next');

      resetMediaState();

      applyMediaSource(incomingMedia, mediaConfig);
      onMediaReady(incomingMedia, () => {
        incomingMedia.classList.remove('opacity-0');
        incomingMedia.classList.add('opacity-100');

        activeMedia.classList.remove('opacity-100');
        activeMedia.classList.add('opacity-0');

        [activeMedia, incomingMedia] = [incomingMedia, activeMedia];
        resetMediaState();
      });
    };

    thumbnails.forEach((thumb) => {
      thumb.setAttribute('aria-pressed', 'false');

      thumb.addEventListener('click', () => {
        const mediaConfig = getMediaConfigFromThumb(thumb);

        if (!mediaConfig) {
          return;
        }

        transitionMedia(mediaConfig);
        setActiveThumb(thumb);
      });
    });

    if (supportsIntersectionObserver) {
      const initialVideoObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            loadInitialGalleryVideos();
            observer.disconnect();
          });
        },
        {
          rootMargin: '250px 0px',
          threshold: 0.01,
        },
      );

      initialVideoObserver.observe(mainWrap);
    } else {
      loadInitialGalleryVideos();
    }

    const defaultThumb = thumbnails.find((thumb) => {
      const mediaConfig = getMediaConfigFromThumb(thumb);
      return mediaConfig?.src === (mainMedia.getAttribute('src') || mainMedia.dataset.src);
    });

    setActiveThumb(defaultThumb || thumbnails[0]);
  });
});
