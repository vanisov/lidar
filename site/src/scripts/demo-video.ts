/** Motion longer than 5 s needs a way to stop it (WCAG 2.2.2), hence the pause button. */
export function initDemoVideo(video: HTMLVideoElement, button: HTMLButtonElement) {
  let wanted = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = false;
  const sync = () => {
    if (wanted && visible) video.play().catch(() => {});
    else video.pause();
    button.setAttribute('aria-label', wanted ? 'Pause demo' : 'Play demo');
    button.classList.toggle('paused', !wanted);
  };
  button.addEventListener('click', () => {
    wanted = !wanted;
    sync();
  });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    sync();
  }, { threshold: 0.4 }).observe(video);
  sync();
}
