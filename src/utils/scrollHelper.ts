/**
 * Utility to scroll the viewport smoothly so that the first piano keyboard
 * is centered vertically on screen.
 */
export function scrollToFirstPianoKeyboard(retries = 15) {
  const tryScroll = (attemptsLeft: number) => {
    const panel = document.getElementById('tabpanel-workshop');
    const pianoEl =
      document.getElementById('first-piano-keyboard-container') ||
      document.querySelector('[data-first-piano="true"]') ||
      document.querySelector('#step_1_piano_container');
    const stepCard =
      document.getElementById('step-1-card-container') ||
      (pianoEl ? (pianoEl.closest('[data-step-card="true"]') as HTMLElement | null) : null) ||
      document.querySelector('[data-step-index="1"]');

    const el = pianoEl || stepCard;

    if (panel && el) {
      const panelRect = panel.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const stickyBar = document.getElementById('workshop-tonality-progression-bar');
      const stickyHeight = stickyBar ? stickyBar.getBoundingClientRect().height : 85;

      const targetY = panel.scrollTop + (elRect.top - panelRect.top) - (stickyHeight + 16);
      panel.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth',
      });
      el.classList.add('ring-4', 'ring-amber-400', 'shadow-2xl', 'shadow-amber-500/40');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-amber-400', 'shadow-2xl', 'shadow-amber-500/40');
      }, 1500);
    } else if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    } else if (attemptsLeft > 0) {
      setTimeout(() => tryScroll(attemptsLeft - 1), 60);
    }
  };

  // Delay to allow tab display transition (hidden -> block) and layout rendering
  setTimeout(() => {
    requestAnimationFrame(() => tryScroll(retries));
  }, 50);
}

/**
 * Utility to scroll the viewport smoothly so that the loaded progression card
 * in the Progression Library view is centered on screen.
 */
export function scrollToLoadedProgressionCard(progressionId?: string | null, retries = 15) {
  const tryScroll = (attemptsLeft: number) => {
    const panel = document.getElementById('tabpanel-library');
    const el =
      (progressionId && document.getElementById(`progression-card-${progressionId}`)) ||
      (progressionId && document.querySelector(`[data-progression-id="${progressionId}"]`)) ||
      document.querySelector('[data-loaded-progression="true"]') ||
      document.querySelector('[data-first-progression-card="true"]');

    if (panel && el) {
      const panelRect = panel.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const targetY = panel.scrollTop + (elRect.top - panelRect.top) - panelRect.height / 3;
      panel.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth',
      });
      el.classList.add('ring-4', 'ring-amber-400', 'shadow-2xl', 'shadow-amber-500/30');
      setTimeout(() => {
        el.classList.remove('shadow-2xl', 'shadow-amber-500/30');
      }, 2000);
    } else if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
      el.classList.add('ring-4', 'ring-amber-400', 'shadow-2xl', 'shadow-amber-500/30');
      setTimeout(() => {
        el.classList.remove('shadow-2xl', 'shadow-amber-500/30');
      }, 2000);
    } else if (attemptsLeft > 0) {
      setTimeout(() => tryScroll(attemptsLeft - 1), 60);
    }
  };

  setTimeout(() => {
    requestAnimationFrame(() => tryScroll(retries));
  }, 60);
}

/**
 * Utility to scroll the viewport smoothly so that the active tonality and progression
 * bar above step 1 is positioned near the top of the viewport when a pattern is loaded.
 */
export function scrollToTonalityProgressionBar(retries = 15) {
  const tryScroll = (attemptsLeft: number) => {
    const panel = document.getElementById('tabpanel-workshop');
    const el =
      document.getElementById('workshop-tonality-progression-bar') ||
      document.querySelector('[data-tonality-bar="true"]') ||
      document.getElementById('first-piano-keyboard-container');

    if (panel && el) {
      const panelRect = panel.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const targetY = panel.scrollTop + (elRect.top - panelRect.top) - 10;
      panel.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth',
      });
      el.classList.add('ring-4', 'ring-amber-400', 'shadow-2xl', 'shadow-amber-500/40');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-amber-400', 'shadow-2xl', 'shadow-amber-500/40');
      }, 1800);
    } else if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
      el.classList.add('ring-4', 'ring-amber-400', 'shadow-2xl', 'shadow-amber-500/40');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-amber-400', 'shadow-2xl', 'shadow-amber-500/40');
      }, 1800);
    } else if (attemptsLeft > 0) {
      setTimeout(() => tryScroll(attemptsLeft - 1), 60);
    }
  };

  setTimeout(() => {
    requestAnimationFrame(() => tryScroll(retries));
  }, 60);
}

