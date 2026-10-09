import { readStorage, writeStorage } from '../utils/storage';

const root = document.documentElement;

/** base-layout.astro's head script applies the saved theme before first paint. */
export function initThemeToggle(button: HTMLButtonElement) {
  const label = () => button.setAttribute('aria-label', `Switch to ${root.dataset.theme === 'dark' ? 'light' : 'dark'} theme`);
  label();
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    writeStorage('theme', root.dataset.theme);
    label();
  });
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (readStorage('theme')) return;
    root.dataset.theme = e.matches ? 'light' : 'dark';
    label();
  });
}
