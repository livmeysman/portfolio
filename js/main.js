/* ==========================================================
   Liv Meysman — Portfolio
   ========================================================== */

/* Pagina tonen zodra alles geladen is (na max. 8 seconden in elk geval) */
(() => {
  const show = () => document.documentElement.classList.remove('is-loading');
  if (document.readyState === 'complete') show();
  else window.addEventListener('load', show, { once: true });
  setTimeout(show, 8000);
})();

document.addEventListener('DOMContentLoaded', () => {

  /* Hoogte van de vaste header beschikbaar maken voor CSS (--header-h) */
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    const setHeaderHeight = () =>
      document.documentElement.style.setProperty('--header-h', siteHeader.offsetHeight + 'px');
    setHeaderHeight();
    window.addEventListener('resize', setHeaderHeight);
  }

  /* Jaartal in footer */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Beelden: fade-in zodra geladen, verbergen als bestand ontbreekt */
  document.querySelectorAll('.project-figure img').forEach((img) => {
    const loaded = () => img.classList.add('is-loaded');
    const broken = () => img.classList.add('is-broken');

    if (img.complete) {
      img.naturalWidth > 0 ? loaded() : broken();
    } else {
      img.addEventListener('load', loaded, { once: true });
      img.addEventListener('error', broken, { once: true });
    }
  });

  /* ---------- Projectdetail ---------- */
  const text = document.querySelector('.project-text');
  const images = document.querySelectorAll('.project-images img');

  if (text && images.length) {
    const desktop = window.matchMedia('(min-width: 992px)');
    const header = document.querySelector('.site-header');
    const main = document.querySelector('.page-project .site-main');
    const first = images[0];
    const peek = () => Math.round(window.innerHeight * 0.06); // hoeveel van beeld 2 zichtbaar is bij laden

    // Behoud de volledige eerste foto en laat een stukje van de volgende zien.
    const layoutText = () => {
      first.style.removeProperty('height');
      text.style.removeProperty('--text-offset');
      text.style.removeProperty('--text-sticky-top');
      if (!desktop.matches || !first.naturalWidth || !main) {
        if (main) main.style.removeProperty('--project-main-padding');
        return;
      }

      const height = first.offsetHeight;
      const headerHeight = header ? header.offsetHeight : 0;
      const mainTop = main.getBoundingClientRect().top + window.scrollY;
      const gap = parseFloat(window.getComputedStyle(first.parentElement).rowGap) || 0;
      const imageTop = Math.max(headerHeight, window.innerHeight - height - gap - peek());
      const mainPadding = Math.max(0, imageTop - mainTop);
      main.style.setProperty('--project-main-padding', mainPadding + 'px');

      const textHeight = text.offsetHeight;
      const offset = Math.max(0, height - textHeight);
      const stickyTop = Math.max(headerHeight, imageTop + height - textHeight);
      text.style.setProperty('--text-offset', offset + 'px');
      text.style.setProperty('--text-sticky-top', stickyTop + 'px');
    };

    images[0].complete ? layoutText() : images[0].addEventListener('load', layoutText, { once: true });
    window.addEventListener('resize', layoutText);
    if (document.fonts) document.fonts.ready.then(layoutText);

    // Teller (1/8): toont welk beeld onderaan het scherm, naast de tekst staat
    const current = text.querySelector('.js-current');
    const total = text.querySelector('.js-total');
    if (total) total.textContent = images.length;

    if (current) {
      const updateCounter = () => {
        const line = text.getBoundingClientRect().bottom;
        let index = 0;
        images.forEach((img, i) => {
          if (img.getBoundingClientRect().top < line) index = i;
        });
        current.textContent = index + 1;
      };
      window.addEventListener('scroll', updateCounter, { passive: true });
      window.addEventListener('resize', updateCounter);
      updateCounter();
    }

    /* ---------- Lightbox: klik op beeld = fullscreen overlay ---------- */
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Beelden');
    box.hidden = true;
    box.innerHTML = `
      <img class="lightbox-img" alt="">
      <button class="lightbox-btn lightbox-prev" type="button" aria-label="Vorig beeld">&larr;</button>
      <button class="lightbox-btn lightbox-next" type="button" aria-label="Volgend beeld">&rarr;</button>
      <button class="lightbox-btn lightbox-close" type="button" aria-label="Sluiten">&times;</button>
      <p class="lightbox-count"></p>`;
    document.body.appendChild(box);

    const boxImg = box.querySelector('.lightbox-img');
    const boxCount = box.querySelector('.lightbox-count');
    let index = 0;
    let lastFocus = null;

    const show = (i) => {
      index = (i + images.length) % images.length; // na het laatste beeld terug naar het eerste
      boxImg.src = images[index].currentSrc || images[index].src;
      boxImg.alt = images[index].alt;
      boxCount.textContent = `(${index + 1}/${images.length})`;
    };
    const open = (i) => {
      lastFocus = document.activeElement;
      show(i);
      box.hidden = false;
      document.body.classList.add('lightbox-open');
      box.querySelector('.lightbox-close').focus();
    };
    const close = () => {
      box.hidden = true;
      document.body.classList.remove('lightbox-open');
      if (lastFocus) lastFocus.focus();
    };

    images.forEach((img, i) => {
      img.classList.add('is-zoomable');
      img.tabIndex = 0;
      img.addEventListener('click', () => open(i));
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });

    box.querySelector('.lightbox-prev').addEventListener('click', () => show(index - 1));
    box.querySelector('.lightbox-next').addEventListener('click', () => show(index + 1));
    box.querySelector('.lightbox-close').addEventListener('click', close);
    boxImg.addEventListener('click', () => show(index + 1));
    box.addEventListener('click', (e) => { if (e.target === box) close(); });

    // Toetsenbord: pijltjes links/rechts, Escape sluit
    document.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'Escape') close();
    });

    // Swipen op telefoon/tablet
    let touchX = null;
    box.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }
});
