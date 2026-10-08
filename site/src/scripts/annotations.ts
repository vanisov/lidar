const px = Math.round;

function spec(el: HTMLElement) {
  const cs = getComputedStyle(el), r = el.getBoundingClientRect(), fs = parseFloat(cs.fontSize);
  return `<${el.localName}> font: ${cs.fontWeight} ${px(fs)}px/${+(parseFloat(cs.lineHeight) / fs).toFixed(2)} · ${px(r.width)} × ${px(r.height)}`;
}

function dim(note: HTMLElement) {
  const [sel, axis] = note.dataset.dim!.split(' ');
  const r = document.querySelector(sel)!.getBoundingClientRect();
  return `${px(axis === 'h' ? r.height : r.width)} px`;
}

/** All reads happen before any write, so one layout pass serves every note. */
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
