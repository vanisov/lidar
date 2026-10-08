import { useEffect, useRef } from 'preact/hooks';

const ITEM = '[role="menuitemradio"]';
const items = (menu: HTMLElement) => [...menu.querySelectorAll<HTMLButtonElement>(ITEM)];

export function useMenu(trigger: HTMLElement | null, onDismiss: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = items(ref.current!);
    (list.find(i => i.getAttribute('aria-checked') === 'true') ?? list[0])?.focus();
    const outside = (e: PointerEvent) => {
      const path = e.composedPath();
      if (!path.includes(ref.current!) && !(trigger && path.includes(trigger))) onDismiss();
    };
    addEventListener('pointerdown', outside, true);
    return () => {
      removeEventListener('pointerdown', outside, true);
      trigger?.focus({ preventScroll: true });
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    const list = items(ref.current!);
    const i = list.indexOf(e.target as HTMLButtonElement);
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    list[(to + list.length) % list.length].focus();
  };

  return { ref, onKeyDown };
}
