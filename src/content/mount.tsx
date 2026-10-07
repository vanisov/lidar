import { effect } from '@preact/signals';
import { render } from 'preact';
import css from './ui/styles.css';
import { createHost } from './core/host';
import { loadFonts } from './core/fonts';
import { bindKeys } from './core/keys';
import { startOverlay } from './core/overlay';
import { loadSettings, settings } from './core/settings';
import { altHeld, closeSearch, flyout, pinNext, pinned, toastMsg, tool } from './core/store';
import { App } from './ui/app';

export function mount(onClosed: () => void): { close(): void } {
  const host = createHost();
  // adoptedStyleSheets are exempt from page CSP; <style> tags are not.
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  host.root.adoptedStyleSheets = [sheet];

  const wrap = document.createElement('div');
  wrap.className = 'lidar';
  const layer = document.createElement('div'); // overlay nodes, drawn under the UI
  const ui = document.createElement('div');
  wrap.append(layer, ui);
  host.root.append(wrap);

  const cleanups: Array<() => void> = [loadFonts()];
  cleanups.push(effect(() => {
    wrap.dataset.theme = settings.value.theme;
  }));
  cleanups.push(bindKeys(host, close));
  cleanups.push(startOverlay(host, layer, close));
  const onMessage = (msg: unknown) => {
    if ((msg as { type?: string } | null)?.type === 'pin-next') pinNext.value = true;
  };
  chrome.runtime.onMessage.addListener(onMessage);
  cleanups.push(() => chrome.runtime.onMessage.removeListener(onMessage));

  render(<App host={host} onClose={close} />, ui);
  void loadSettings();

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    render(null, ui);
    cleanups.forEach(fn => fn());
    pinned.value = null;
    tool.value = 'measure';
    pinNext.value = false;
    closeSearch();
    toastMsg.value = null;
    altHeld.value = false;
    flyout.value = null;
    host.destroy();
    onClosed();
  }
  return { close };
}
