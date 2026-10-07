import { useState } from 'preact/hooks';

/** Drag a floating box by its header. Returns where it was dropped (null until moved) and the header's handler. */
export function useDrag() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: PointerEvent) => {
    if ((e.target as Element).closest('button')) return;
    const head = e.currentTarget as HTMLElement;
    const box = head.parentElement!.getBoundingClientRect();
    const dx = e.clientX - box.left;
    const dy = e.clientY - box.top;
    head.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) =>
      setPos({
        x: Math.min(Math.max(0, ev.clientX - dx), innerWidth - 60),
        y: Math.min(Math.max(0, ev.clientY - dy), innerHeight - 40),
      });
    head.addEventListener('pointermove', move);
    head.addEventListener('pointerup', () => head.removeEventListener('pointermove', move), { once: true });
  };

  return { pos, onPointerDown };
}
