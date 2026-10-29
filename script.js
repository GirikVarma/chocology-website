(() => {
  'use strict';
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  const setMenu = (open) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.querySelector('.sr-only').textContent = open ? 'Close navigation' : 'Open navigation';
    navigation.classList.toggle('open', open);
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.header')) setMenu(false);
  });
  window.matchMedia('(min-width: 651px)').addEventListener('change', event => {
    if (event.matches) setMenu(false);
  });

  const filters = document.querySelectorAll('[data-filter]');
  const flavours = document.querySelectorAll('[data-category]');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(filter => {
      const selected = filter === button;
      filter.setAttribute('aria-pressed', String(selected));
      filter.classList.toggle('active', selected);
    });
    let count = 0;
    flavours.forEach(flavour => {
      const visible = button.dataset.filter === 'all' || flavour.dataset.category.split(' ').includes(button.dataset.filter);
      flavour.hidden = !visible;
      if (visible) count++;
    });
    document.querySelector('#flavour-status').textContent = `Showing ${count} flavours: ${button.textContent}`;
  }));

  const gallery = document.querySelector('.gallery');
  const galleryWindow = document.querySelector('#gallery-window');
  const gallerySets = [document.querySelector('#gallery-set-a'), document.querySelector('#gallery-set-b')];
  const galleryStatus = document.querySelector('#gallery-status');
  const galleryPlay = document.querySelector('#gallery-play');
  const galleryTotal = 41;
  const galleryDelay = 5000;
  let galleryIndex = 0;
  let activeGallerySet = 0;
  let galleryTimer;
  let galleryLoading = false;
  let manuallyPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pointerWasPlaying = false;
  let swipeStartX = null;

  const updateGalleryPlayButton = () => {
    const label = manuallyPaused ? 'Play slideshow' : 'Pause slideshow';
    galleryPlay.setAttribute('aria-label', label);
    galleryPlay.title = label;
  };
  const stopGallery = () => {
    clearTimeout(galleryTimer);
    galleryTimer = null;
    gallery.classList.remove('playing');
  };
  const startGallery = () => {
    stopGallery();
    if (manuallyPaused || document.hidden || gallery.matches(':hover') || gallery.contains(document.activeElement)) return;
    gallery.classList.add('playing');
    galleryTimer = setTimeout(() => showGalleryPhotos(3, false), galleryDelay);
  };
  const showGalleryPhotos = async (direction, announce = true) => {
    if (galleryLoading) return;
    galleryLoading = true;
    stopGallery();
    const nextIndex = (galleryIndex + direction + galleryTotal) % galleryTotal;
    const photoNumbers = [0, 1, 2].map(offset => (nextIndex + offset) % galleryTotal + 1);
    const nextSetIndex = 1 - activeGallerySet;
    const nextSet = gallerySets[nextSetIndex];
    try {
      await Promise.all(photoNumbers.map(number => new Promise((resolve, reject) => {
        const photo = new Image();
        photo.onload = resolve;
        photo.onerror = reject;
        photo.src = `assets/gallery/gallery-${String(number).padStart(2, '0')}.jpg`;
      })));
      nextSet.querySelectorAll('img').forEach((photo, position) => {
        const number = photoNumbers[position];
        photo.src = `assets/gallery/gallery-${String(number).padStart(2, '0')}.jpg`;
        photo.alt = `Chocology product and gifting photograph ${number} of ${galleryTotal}`;
      });
      nextSet.removeAttribute('aria-hidden');
      requestAnimationFrame(() => {
        nextSet.classList.add('active');
        gallerySets[activeGallerySet].classList.remove('active');
        galleryIndex = nextIndex;
        activeGallerySet = nextSetIndex;
        const range = photoNumbers[2] > photoNumbers[0] ? `${photoNumbers[0]}–${photoNumbers[2]}` : `${photoNumbers[0]}, ${photoNumbers[1]} & ${photoNumbers[2]}`;
        galleryStatus.setAttribute('aria-live', announce ? 'polite' : 'off');
        galleryStatus.textContent = `Showing photos ${range} of ${galleryTotal}`;
        window.setTimeout(() => {
          gallerySets[1 - activeGallerySet].setAttribute('aria-hidden', 'true');
          galleryLoading = false;
          startGallery();
        }, 740);
      });
    } catch {
      galleryLoading = false;
      startGallery();
    }
  };

  galleryPlay.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    updateGalleryPlayButton();
    if (manuallyPaused) stopGallery();
    else startGallery();
  });
  document.querySelector('#gallery-previous').addEventListener('click', () => showGalleryPhotos(-3));
  document.querySelector('#gallery-next').addEventListener('click', () => showGalleryPhotos(3));
  galleryWindow.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showGalleryPhotos(event.key === 'ArrowRight' ? 3 : -3);
    }
  });
  galleryWindow.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') swipeStartX = event.clientX;
  });
  galleryWindow.addEventListener('pointerup', event => {
    if (swipeStartX === null) return;
    const distance = event.clientX - swipeStartX;
    if (Math.abs(distance) > 50) showGalleryPhotos(distance < 0 ? 3 : -3);
    swipeStartX = null;
  });
  gallery.addEventListener('pointerenter', () => {
    pointerWasPlaying = galleryTimer !== undefined && galleryTimer !== null;
    stopGallery();
  });
  gallery.addEventListener('pointerleave', () => {
    if (pointerWasPlaying && !manuallyPaused && !gallery.contains(document.activeElement)) startGallery();
    pointerWasPlaying = false;
  });
  gallery.addEventListener('focusin', stopGallery);
  gallery.addEventListener('focusout', event => {
    if (!gallery.contains(event.relatedTarget) && !manuallyPaused && !gallery.matches(':hover')) startGallery();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopGallery();
    else if (!manuallyPaused && !gallery.matches(':hover') && !gallery.contains(document.activeElement)) startGallery();
  });
  updateGalleryPlayButton();
  if (!manuallyPaused) startGallery();

  const dialog = document.querySelector('#enquiry-dialog');
  const interest = document.querySelector('#interest');
  const form = document.querySelector('#enquiry-form');
  let lastTrigger;
  document.querySelectorAll('[data-enquire]').forEach(button => button.addEventListener('click', () => {
    lastTrigger = button;
    const selection = button.dataset.enquire;
    interest.value = Array.from(interest.options).some(option => option.value === selection) ? selection : 'Help me choose';
    setMenu(false);
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add('dialog-open');
  }));
  const closeDialog = () => dialog.close();
  dialog.querySelector('.dialog-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeDialog();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (lastTrigger && lastTrigger.getClientRects().length) lastTrigger.focus();
    else if (lastTrigger?.closest('.navigation')) menuButton.focus();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('name')).trim();
    const quantity = String(data.get('quantity')).trim();
    const note = String(data.get('message')).trim();
    const lines = [name ? `Hi Chocology! I'm ${name}.` : 'Hi Chocology!', `I'm interested in: ${data.get('interest')}.`];
    if (quantity) lines.push(`Number of gifts: ${quantity}.`);
    if (note) lines.push(note);
    lines.push('Could you please share the available options and prices?');
    const url = `https://wa.me/919881125124?text=${encodeURIComponent(lines.join('\n\n'))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });
  document.querySelector('#year').textContent = new Date().getFullYear();
})();
