import { useEffect, useRef } from 'preact/hooks';

const ITEM = '[role="menuitemradio"]';
const items = (menu: HTMLElement) => [...menu.querySelectorAll<HTMLButtonElement>(ITEM)];

/**
 * Keyboard and focus behaviour for a small popup menu: focus starts on the checked item, arrows and Home/End
 * move between items, a press outside the menu and its trigger calls onDismiss, and focus returns to the
 * trigger when the menu goes away.
 */
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
