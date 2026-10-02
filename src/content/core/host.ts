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
 * When the page later puts its own popover or dialog in the top layer, Lidar re-enters it to stay on top. A modal
 * dialog makes everything outside it inert, so while one is open the host moves inside it.
 */
export function createHost(): Host {
  const el = document.createElement('lidar-root');
  el.style.cssText = HOST_CSS;
  el.popover = 'manual';
  const root = el.attachShadow({ mode: __TEST__ ? 'open' : 'closed' });
  document.documentElement.append(el);
  el.showPopover();

  let inDialog = false;
  const restack = () => {
    const modals = document.querySelectorAll('dialog:modal');
    const parent = modals[modals.length - 1] ?? document.documentElement;
    inDialog = parent !== document.documentElement;
    if (el.matches(':popover-open')) el.hidePopover();
    if (el.parentNode !== parent) parent.append(el);
    el.showPopover();
  };
  const onToggle = (e: Event) => {
    if (e.target !== el && (e as ToggleEvent).newState === 'open') restack();
  };
  const watch = new MutationObserver(records => {
    // A dialog opened or closed, or the page removed the dialog (or its content) along with Lidar.
    if ((inDialog && !el.isConnected) || records.some(r => r.type === 'attributes' && r.target instanceof HTMLDialogElement)) restack();
  });
  watch.observe(document, { subtree: true, childList: true, attributeFilter: ['open'] });
  document.addEventListener('toggle', onToggle, true);

  return {
    el,
    root,
    destroy: () => {
      watch.disconnect();
      document.removeEventListener('toggle', onToggle, true);
      el.remove();
    },
  };
}
