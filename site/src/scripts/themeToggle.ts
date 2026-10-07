const root = document.documentElement;

function readSaved() {
  try {
    return localStorage.getItem('theme');
  } catch {
    return null;
  }
}

/**
 * The header's light/dark switch. A click pins the choice in localStorage; until then the page follows the
 * system theme as it changes. (Layout's head script applies the theme before first paint.)
 */
export function initThemeToggle(button: HTMLButtonElement) {
  const label = () => button.setAttribute('aria-label', `Switch to ${root.dataset.theme === 'dark' ? 'light' : 'dark'} theme`);
  label();
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', root.dataset.theme);
    } catch {}
    label();
  });
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (readSaved()) return;
    root.dataset.theme = e.matches ? 'light' : 'dark';
    label();
  });
}
