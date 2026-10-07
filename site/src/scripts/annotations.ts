const px = Math.round;

/** `<h1> font: 800 148px/0.88 · 1070 × 391` for the element a `[data-spec]` note points at. */
function spec(el: HTMLElement) {
  const cs = getComputedStyle(el), r = el.getBoundingClientRect(), fs = parseFloat(cs.fontSize);
  return `<${el.localName}> font: ${cs.fontWeight} ${px(fs)}px/${+(parseFloat(cs.lineHeight) / fs).toFixed(2)} · ${px(r.width)} × ${px(r.height)}`;
}

/** `1070 px` for a `[data-dim]` note: its target's width, or its height with a trailing `h`. */
function dim(note: HTMLElement) {
  const [sel, axis] = note.dataset.dim!.split(' ');
  const r = document.querySelector(sel)!.getBoundingClientRect();
  return `${px(axis === 'h' ? r.height : r.width)} px`;
}

/**
 * Keeps every `[data-spec]` and `[data-dim]` note printing its target's real computed values, so the page
 * measures itself. All reads happen before any write, so one layout pass serves every note.
 */
export function watchAnnotations() {
  const update = () => {
    const texts = [
      ...[...document.querySelectorAll<HTMLElement>('[data-spec]')].map(n => [n, spec(document.querySelector<HTMLElement>(n.dataset.spec!)!)] as const),
      ...[...document.querySelectorAll<HTMLElement>('[data-dim]')].map(n => [n, dim(n)] as const),
    ];
    for (const [n, text] of texts) n.textContent = text;
  };
  new ResizeObserver(update).observe(document.body);
  document.fonts.ready.then(update);
}
