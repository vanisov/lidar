export interface Host {
  el: HTMLElement;
  root: ShadowRoot;
  destroy(): void;
}

// Inline !important beats any page stylesheet. Set through CSSOM, which CSP doesn't block.
const HOST_CSS = [
  'all:initial', 'display:block', 'position:fixed', 'inset:0', 'width:100vw', 'height:100vh', 'max-width:none',
  'max-height:none', 'margin:0', 'padding:0', 'border:0', 'background:transparent', 'overflow:visible',
  'z-index:2147483647', 'pointer-events:none',
].map(d => `${d} !important`).join(';');

/**
 * A manual popover lives in the browser's top layer: above every z-index, and immune to transforms on <html>
 * that would otherwise turn position:fixed into position:absolute.
 */
export function createHost(): Host {
  const el = document.createElement('lidar-root');
  el.style.cssText = HOST_CSS;
  el.popover = 'manual';
  const root = el.attachShadow({ mode: __TEST__ ? 'open' : 'closed' });
  document.documentElement.append(el);
  el.showPopover();
  return { el, root, destroy: () => el.remove() };
}
