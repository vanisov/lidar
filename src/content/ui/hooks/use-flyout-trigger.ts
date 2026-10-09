import { useRef } from 'preact/hooks';
import { flyout } from '../../core/store';
import type { Tool } from '../../tools/registry';

const HOLD_MS = 350;

/** `opened()` says whether the last press opened the flyout, so that press doesn't also run the tool. */
export function useFlyoutTrigger(tool: Tool) {
  const timer = useRef(0);
  const openedByPress = useRef(false);
  const open = () => {
    openedByPress.current = true;
    flyout.value = tool.id;
  };
  const cancel = () => clearTimeout(timer.current);

  const opened = () => {
    const was = openedByPress.current;
    openedByPress.current = false;
    return was;
  };
  if (!tool.options) return { props: {}, opened };

  const props = {
    'aria-haspopup': 'menu' as const,
    'aria-expanded': flyout.value === tool.id,
    onContextMenu: (e: MouseEvent) => {
      e.preventDefault();
      open();
    },
    onPointerDown: (e: PointerEvent) => {
      if (e.button !== 0) return;
      openedByPress.current = false;
      timer.current = window.setTimeout(open, HOLD_MS);
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      open();
    },
  };
  return { props, opened };
}
