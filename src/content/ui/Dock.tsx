import { useEffect, useRef } from 'preact/hooks';
import { flyout } from '../core/store';
import { TOOLS, type Tool } from '../tools/registry';
import { icons, mark } from './icons';

const HOLD_MS = 350;

/** Photoshop-style tooltip: the name, the current mode, then the key (and the modifier you can hold instead). */
function Tip({ name, detail, keys, hold }: { name: string; detail?: string; keys: string; hold?: string }) {
  return (
    <span class="tip" aria-hidden="true">
      <b>{name}</b>
      {detail && <em>{detail}</em>}
      <kbd>{keys}</kbd>
      {hold && <><span class="or">or hold</span><kbd>{hold}</kbd></>}
    </span>
  );
}

function Flyout({ t, trigger }: { t: Tool; trigger: HTMLButtonElement | null }) {
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const items = () => [...menu.current!.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')];
    (items().find(i => i.getAttribute('aria-checked') === 'true') ?? items()[0]).focus();
    const outside = (e: PointerEvent) => {
      const path = e.composedPath();
      if (!path.includes(menu.current!) && !path.includes(trigger!)) flyout.value = null;
    };
    addEventListener('pointerdown', outside, true);
    return () => {
      removeEventListener('pointerdown', outside, true);
      trigger?.focus({ preventScroll: true });
    };
  }, []);
  const onKey = (e: KeyboardEvent) => {
    const list = [...menu.current!.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')];
    const i = list.indexOf(e.target as HTMLButtonElement);
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    list[(to + list.length) % list.length].focus();
  };
  return (
    <div class="flyout" role="menu" aria-label={`${t.label} options`} ref={menu} onKeyDown={onKey}>
      {t.options!.map(o => (
        <button
          key={o.label}
          role="menuitemradio"
          aria-checked={o.isOn()}
          onClick={() => {
            o.select();
            flyout.value = null;
          }}
        >
          <i class="dot" aria-hidden="true" />
          <span><b>{o.label}</b><small>{o.hint}</small></span>
        </button>
      ))}
    </div>
  );
}

function ToolButton({ t }: { t: Tool }) {
  const btn = useRef<HTMLButtonElement>(null);
  const timer = useRef(0);
  const opened = useRef(false); // a press-and-hold that opened the flyout shouldn't also click the tool
  const open = flyout.value === t.id;
  const show = () => {
    opened.current = true;
    flyout.value = t.id;
  };
  const cancelHold = () => clearTimeout(timer.current);
  const detail = t.detail?.();
  const menu = t.options
    ? {
        'aria-haspopup': 'menu' as const,
        'aria-expanded': open,
        onContextMenu: (e: MouseEvent) => {
          e.preventDefault();
          show();
        },
        onPointerDown: (e: PointerEvent) => {
          if (e.button !== 0) return;
          opened.current = false;
          timer.current = window.setTimeout(show, HOLD_MS);
        },
        onPointerUp: cancelHold,
        onPointerLeave: cancelHold,
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
          e.preventDefault();
          show();
        },
      }
    : {};
  return (
    <span class={`slot${open ? ' open' : ''}`}>
      <button
        ref={btn}
        class={t.toggle ? 'toggle' : ''}
        data-tool={t.id}
        data-mode={detail?.toLowerCase()}
        aria-label={detail ? `${t.label}, ${detail}` : t.label}
        aria-pressed={t.isOn()}
        aria-keyshortcuts={t.key.toUpperCase()}
        onClick={() => {
          if (opened.current) return void (opened.current = false);
          void t.run();
        }}
        {...menu}
      >
        {t.icon()}
        {t.options && <span class="corner" aria-hidden="true" />}
        <Tip name={t.label} detail={detail} keys={t.key.toUpperCase()} hold={t.hold} />
      </button>
      {open && <Flyout t={t} trigger={btn.current} />}
    </span>
  );
}

export function Dock({ onClose }: { onClose(): void }) {
  return (
    <div class="dock ui" role="toolbar" aria-label="Lidar tools">
      <span class="mark">{mark()}</span>
      <span class="sep" />
      {TOOLS.map(t => <ToolButton key={t.id} t={t} />)}
      <span class="sep" />
      <span class="slot">
        <button data-tool="close" aria-label="Close Lidar" aria-keyshortcuts="Escape" onClick={onClose}>
          {icons.close()}
          <Tip name="Close" keys="Esc" />
        </button>
      </span>
    </div>
  );
}
