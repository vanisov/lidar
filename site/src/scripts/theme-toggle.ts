import { readStorage, writeStorage } from '../utils/storage';

const root = document.documentElement;

/**
 * The header's light/dark switch. A click pins the choice in localStorage; until then the page follows the
 * system theme as it changes. (base-layout.astro's head script applies the theme before first paint.)
 */
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
