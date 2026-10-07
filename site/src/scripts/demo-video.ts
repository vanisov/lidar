/**
 * Plays the muted demo only while it's on screen, never on its own for people who ask for reduced motion,
 * and lets the button pause it (motion longer than 5 s needs a way to stop it).
 */
export function initDemoVideo(video: HTMLVideoElement, button: HTMLButtonElement) {
  let wanted = !matchMedia('(prefers-reduced-motion: reduce)').matches; // the visitor's choice, once they make one
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
