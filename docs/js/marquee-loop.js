document.addEventListener('DOMContentLoaded', () => {
  const tracks = document.querySelectorAll('[data-marquee-track]');

  tracks.forEach((track) => {
    const sourceGroup = track.querySelector('[data-marquee-group]');

    if (!sourceGroup) {
      return;
    }

    const clone = sourceGroup.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.removeAttribute('data-marquee-group');
    track.appendChild(clone);
  });
});
