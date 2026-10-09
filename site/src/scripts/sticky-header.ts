/** Two thresholds, so a page resting near one doesn't flicker between sizes. */
export function compactOnScroll(header: HTMLElement) {
  const update = () => header.classList.toggle('compact', scrollY > (header.classList.contains('compact') ? 60 : 120));
  addEventListener('scroll', update, { passive: true });
  update();
}
