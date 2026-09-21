document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('#header');
  const headerColorStart = [0x2b, 0x2b, 0x2b];
  const headerColorEnd = [0x48, 0x3b, 0x29];
  const headerColorDistance = 1000;
  const currentScript =
    document.currentScript || document.querySelector('script[src*="header-menu.js"]');
  const headerColorOverride = currentScript?.dataset.headerColor?.trim();

  const channelToHex = (value) => value.toString(16).padStart(2, '0');

  const mixChannel = (start, end, progress) => Math.round(start + (end - start) * progress);

  const normalizeHexColor = (value) => {
    if (!value) {
      return null;
    }

    const hexMatch = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
    if (!hexMatch) {
      return null;
    }

    const hexValue = hexMatch[1];
    if (hexValue.length === 3) {
      return `#${hexValue
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
        .toLowerCase()}`;
    }

    return `#${hexValue.toLowerCase()}`;
  };

  const syncHeaderColorWithScroll = () => {
    if (!header) {
      return;
    }

    const progress = Math.max(0, Math.min(window.scrollY / headerColorDistance, 1));
    const mixed = [
      mixChannel(headerColorStart[0], headerColorEnd[0], progress),
      mixChannel(headerColorStart[1], headerColorEnd[1], progress),
      mixChannel(headerColorStart[2], headerColorEnd[2], progress)
    ];

    const nextColor = `#${channelToHex(mixed[0])}${channelToHex(mixed[1])}${channelToHex(mixed[2])}`;
    header.style.setProperty('--header-brand', nextColor);
  };

  const normalizedHeaderColorOverride = normalizeHexColor(headerColorOverride);

  if (header && normalizedHeaderColorOverride) {
    header.style.setProperty('--header-brand', normalizedHeaderColorOverride);
  } else {
    syncHeaderColorWithScroll();
    window.addEventListener('scroll', syncHeaderColorWithScroll, { passive: true });
  }

  const toggleButton = document.querySelector('[data-header-menu-toggle]');
  const menu = document.querySelector('[data-header-menu]');
  const headerSurface = document.querySelector('[data-header-surface]');
  const headerRow = document.querySelector('[data-header-row]');
  const menuIcon = document.querySelector('[data-header-menu-icon]');
  const menuIconLine1 = document.querySelector('[data-header-menu-icon-line-1]');
  const menuIconLine2 = document.querySelector('[data-header-menu-icon-line-2]');
  const menuIconLine3 = document.querySelector('[data-header-menu-icon-line-3]');
  const headerLogo = document.querySelector('[data-header-logo]');
  const headerLogoIcon = document.querySelector('[data-header-logo-icon]');
  const headerLogoText = document.querySelector('[data-header-logo-text]');
  if (toggleButton && menu) {
    const menuCta = menu.querySelector('[data-header-menu-cta]');
    const menuCtaText = menu.querySelector('[data-header-menu-cta-text]');
    const menuCtaIcon = menu.querySelector('[data-header-menu-cta-icon]');
    const mobileServicesToggle = menu.querySelector('[data-mobile-services-toggle]');
    const mobileServicesPanel = menu.querySelector('[data-mobile-services-panel]');
    const mobileServicesIcon = menu.querySelector('[data-mobile-services-icon]');
    const mobileServicesItems = Array.from(menu.querySelectorAll('[data-mobile-services-item]'));
    let closeTimeout;
    let openFrameId = null;
    let menuTransitionToken = 0;
    let isMenuOpen = false;
    let mobileServicesCloseTimeout;
    let isMobileServicesOpen = false;

    const cancelPendingOpenFrame = () => {
      if (openFrameId === null) {
        return;
      }

      window.cancelAnimationFrame(openFrameId);
      openFrameId = null;
    };

    const setMenuHeight = (isOpen) => {
      menu.style.height = isOpen ? '100dvh' : '0px';
    };

    const setMenuSurfaceState = (isOpen) => {
      if (headerSurface) {
        headerSurface.classList.toggle('min-h-[100dvh]', isOpen);
        headerSurface.classList.toggle('rounded-none', isOpen);
        headerSurface.classList.toggle('rounded-bl-2xl', !isOpen);
        headerSurface.classList.toggle('rounded-br-2xl', !isOpen);
      }

      if (headerRow) {
        headerRow.classList.toggle('min-h-[100dvh]', isOpen);
      }
    };

    const setMenuItemsState = (isOpen) => {
      const items = Array.from(menu.querySelectorAll('[data-header-menu-item]'));

      items.forEach((item, index) => {
        const delay = isOpen ? `${index * 70}ms` : `${(items.length - index - 1) * 45}ms`;
        const duration = isOpen ? '260ms' : '180ms';
        const opacity = isOpen ? '1' : '0';
        const transform = isOpen ? 'translateY(0)' : 'translateY(-8px)';

        item.style.transitionDelay = delay;
        item.style.transitionDuration = duration;
        item.style.opacity = opacity;
        item.style.transform = transform;
      });
    };

    const setMenuCtaState = (isOpen) => {
      if (!menuCta || !menuCtaText || !menuCtaIcon) {
        return;
      }

      const itemCount = menu.querySelectorAll('[data-header-menu-item]').length;
      const containerDelay = isOpen ? `${itemCount * 70 + 40}ms` : '0ms';
      const containerDuration = isOpen ? '280ms' : '180ms';
      const textDelay = isOpen ? `${itemCount * 70 + 90}ms` : '0ms';
      const iconDelay = isOpen ? `${itemCount * 70 + 120}ms` : '20ms';

      menuCta.style.transitionDelay = containerDelay;
      menuCta.style.transitionDuration = containerDuration;
      menuCta.style.opacity = isOpen ? '1' : '0';
      menuCta.style.transform = isOpen ? 'translateY(0)' : 'translateY(-10px)';
      menuCta.style.paddingTop = isOpen ? '0.375rem' : '0.2rem';
      menuCta.style.paddingBottom = isOpen ? '0.375rem' : '0.2rem';
      menuCta.style.paddingLeft = isOpen ? '1.5rem' : '1rem';
      menuCta.style.paddingRight = isOpen ? '0.375rem' : '0.2rem';

      menuCtaText.style.transitionDelay = textDelay;
      menuCtaText.style.transitionDuration = containerDuration;
      menuCtaText.style.opacity = isOpen ? '1' : '0';
      menuCtaText.style.transform = isOpen ? 'translateY(0)' : 'translateY(-6px)';

      menuCtaIcon.style.transitionDelay = iconDelay;
      menuCtaIcon.style.transitionDuration = containerDuration;
      menuCtaIcon.style.opacity = isOpen ? '1' : '0';
      menuCtaIcon.style.transform = isOpen ? 'translateX(0) scale(1)' : 'translateX(-6px) scale(0.92)';
    };

    const setMenuIconState = (isOpen) => {
      if (!menuIcon || !menuIconLine1 || !menuIconLine2 || !menuIconLine3) {
        return;
      }

      if (isOpen) {
        menuIcon.classList.add('rotate-90', 'translate-y-2');
        if (headerLogo) {
          headerLogo.classList.add('translate-y-1');
        }
        if (headerLogoIcon) {
          headerLogoIcon.classList.add('translate-y-1');
        }
        if (headerLogoText) {
          headerLogoText.classList.add('translate-y-1');
        }
        menuIconLine1.setAttribute('d', 'M6 6L18 18');
        menuIconLine2.style.opacity = '0';
        menuIconLine3.setAttribute('d', 'M6 18L18 6');
      } else {
        menuIcon.classList.remove('rotate-90', 'translate-y-2');
        if (headerLogo) {
          headerLogo.classList.remove('translate-y-1');
        }
        if (headerLogoIcon) {
          headerLogoIcon.classList.remove('translate-y-1');
        }
        if (headerLogoText) {
          headerLogoText.classList.remove('translate-y-1');
        }
        menuIconLine1.setAttribute('d', 'M4 6h16');
        menuIconLine2.style.opacity = '1';
        menuIconLine2.setAttribute('d', 'M4 12h16');
        menuIconLine3.setAttribute('d', 'M4 18h16');
      }
    };

    const setMobileServicesItemsState = (isOpen) => {
      if (!mobileServicesItems.length) {
        return;
      }

      mobileServicesItems.forEach((item, index) => {
        const delay = isOpen ? `${50 + index * 40}ms` : `${(mobileServicesItems.length - index - 1) * 30}ms`;

        item.style.transitionDelay = delay;
        item.style.opacity = isOpen ? '1' : '0';
        item.style.transform = isOpen ? 'translateY(0)' : 'translateY(-4px)';
      });
    };

    const closeMobileServicesMenu = ({ immediate = false } = {}) => {
      if (!mobileServicesToggle || !mobileServicesPanel || !mobileServicesIcon) {
        return;
      }

      window.clearTimeout(mobileServicesCloseTimeout);
      const currentHeight = mobileServicesPanel.scrollHeight;

      mobileServicesPanel.style.height = `${currentHeight}px`;

      window.requestAnimationFrame(() => {
        mobileServicesPanel.style.transitionDuration = immediate ? '0ms' : '260ms';
        mobileServicesPanel.style.height = '0px';
        mobileServicesPanel.style.opacity = '0';
        mobileServicesPanel.style.transform = 'translateY(-4px)';
      });

      mobileServicesCloseTimeout = window.setTimeout(() => {
        mobileServicesPanel.classList.add('pointer-events-none');
      }, immediate ? 0 : 260);

      mobileServicesToggle.setAttribute('aria-expanded', 'false');
      mobileServicesIcon.classList.remove('rotate-180');
      setMobileServicesItemsState(false);
      isMobileServicesOpen = false;
    };

    const openMobileServicesMenu = () => {
      if (!mobileServicesToggle || !mobileServicesPanel || !mobileServicesIcon) {
        return;
      }

      window.clearTimeout(mobileServicesCloseTimeout);
      mobileServicesPanel.classList.remove('pointer-events-none');
      mobileServicesPanel.style.transitionDuration = '320ms';
      mobileServicesPanel.style.height = `${mobileServicesPanel.scrollHeight}px`;
      mobileServicesPanel.style.opacity = '1';
      mobileServicesPanel.style.transform = 'translateY(0)';

      mobileServicesToggle.setAttribute('aria-expanded', 'true');
      mobileServicesIcon.classList.add('rotate-180');
      setMobileServicesItemsState(true);
      isMobileServicesOpen = true;
    };

    const syncMobileServicesHeight = () => {
      if (!isMobileServicesOpen || !mobileServicesPanel) {
        return;
      }

      mobileServicesPanel.style.height = `${mobileServicesPanel.scrollHeight}px`;
    };

    const closeMobileMenu = () => {
      menuTransitionToken += 1;
      const transitionToken = menuTransitionToken;

      clearTimeout(closeTimeout);
      cancelPendingOpenFrame();
      closeMobileServicesMenu({ immediate: true });
      setMenuItemsState(false);
      setMenuCtaState(false);

      setMenuHeight(false);
      setMenuSurfaceState(false);
      menu.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto', 'rounded-none');
      menu.classList.add('opacity-0', '-translate-y-2', 'pointer-events-none', 'rounded-2xl');

      closeTimeout = window.setTimeout(() => {
        if (menuTransitionToken !== transitionToken) {
          return;
        }

        menu.classList.add('hidden');
      }, 220);

      toggleButton.setAttribute('aria-expanded', 'false');
      toggleButton.classList.remove('text-white');
      toggleButton.classList.add('text-white/70');
      setMenuIconState(false);
      isMenuOpen = false;
    };

    const openMobileMenu = () => {
      menuTransitionToken += 1;
      const transitionToken = menuTransitionToken;

      clearTimeout(closeTimeout);
      cancelPendingOpenFrame();
      menu.classList.remove('hidden');

      openFrameId = window.requestAnimationFrame(() => {
        openFrameId = null;

        if (menuTransitionToken !== transitionToken) {
          return;
        }

        menu.classList.remove('opacity-0', '-translate-y-2', 'pointer-events-none', 'rounded-2xl');
        menu.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto', 'rounded-none');
        setMenuHeight(true);
        setMenuSurfaceState(true);
        setMenuItemsState(true);
        setMenuCtaState(true);
        syncMobileServicesHeight();
      });

      toggleButton.setAttribute('aria-expanded', 'true');
      toggleButton.classList.remove('text-white/70');
      toggleButton.classList.add('text-white');
      setMenuIconState(true);
      isMenuOpen = true;
    };

    setMenuCtaState(false);
    setMobileServicesItemsState(false);

    if (mobileServicesToggle) {
      mobileServicesToggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (isMobileServicesOpen) {
          closeMobileServicesMenu();
        } else {
          openMobileServicesMenu();
        }

        if (isMenuOpen) {
          setMenuHeight(true);
        }
      });
    }

    toggleButton.addEventListener('click', () => {
      if (isMenuOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('click', (event) => {
      const clickedInside = toggleButton.contains(event.target) || menu.contains(event.target);

      if (!clickedInside && isMenuOpen) {
        closeMobileMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        closeMobileMenu();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        closeMobileMenu();
      } else if (isMenuOpen) {
        setMenuHeight(true);
        syncMobileServicesHeight();
      }
    });
  }

  const desktopServicesMenus = document.querySelectorAll('[data-desktop-services-menu]');

  desktopServicesMenus.forEach((desktopMenu) => {
    const toggle = desktopMenu.querySelector('[data-desktop-services-toggle]');
    const panel = desktopMenu.querySelector('[data-desktop-services-panel]');
    const icon = desktopMenu.querySelector('[data-desktop-services-icon]');

    if (!toggle || !panel || !icon) {
      return;
    }

    const openDesktopMenu = () => {
      panel.classList.remove('invisible', 'pointer-events-none', 'opacity-0', 'translate-y-2');
      panel.classList.add('visible', 'pointer-events-auto', 'opacity-100', 'translate-y-0');
      toggle.classList.remove('text-white/40');
      toggle.classList.add('text-white');
      toggle.setAttribute('aria-expanded', 'true');
      icon.classList.add('rotate-180');
    };

    const closeDesktopMenu = () => {
      panel.classList.add('invisible', 'pointer-events-none', 'opacity-0', 'translate-y-2');
      panel.classList.remove('visible', 'pointer-events-auto', 'opacity-100', 'translate-y-0');
      toggle.classList.remove('text-white');
      toggle.classList.add('text-white/40');
      toggle.setAttribute('aria-expanded', 'false');
      icon.classList.remove('rotate-180');
    };

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';

      if (isOpen) {
        closeDesktopMenu();
      } else {
        openDesktopMenu();
      }
    });

    desktopMenu.addEventListener('mouseenter', openDesktopMenu);
    desktopMenu.addEventListener('mouseleave', closeDesktopMenu);

    document.addEventListener('click', (event) => {
      if (!desktopMenu.contains(event.target)) {
        closeDesktopMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDesktopMenu();
      }
    });
  });
});
