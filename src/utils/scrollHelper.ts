/**
 * Utility to scroll the viewport smoothly so that the first piano keyboard
 * is centered vertically on screen.
 */
export function scrollToFirstPianoKeyboard(retries = 12) {
  const tryScroll = (attemptsLeft: number) => {
    const el =
      document.getElementById('first-piano-keyboard-container') ||
      document.querySelector('[data-step-index="1"]') ||
      document.querySelector('#step_1_piano_container');

    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    } else if (attemptsLeft > 0) {
      setTimeout(() => tryScroll(attemptsLeft - 1), 60);
    }
  };

  // Initial delay to allow tab display transition from hidden to block
  setTimeout(() => {
    requestAnimationFrame(() => tryScroll(retries));
  }, 60);
}
