export function startCrosshair(area: HTMLElement, [x, y, label]: HTMLElement[]) {
  area.addEventListener('pointerenter', () => document.body.classList.add('crossing'));
  area.addEventListener('pointerleave', () => document.body.classList.remove('crossing'));
  area.addEventListener('pointermove', (e) => {
    const r = area.getBoundingClientRect();
    Object.assign(x.style, { height: `${r.height}px`, transform: `translate(${e.clientX}px, ${r.top}px)` });
    Object.assign(y.style, { width: `${r.width}px`, transform: `translate(${r.left}px, ${e.clientY}px)` });
    label.style.transform = `translate(${e.clientX + 10}px, ${e.clientY + 10}px)`;
    label.textContent = `${Math.round(e.pageX)}, ${Math.round(e.pageY)}`;
  });
}
