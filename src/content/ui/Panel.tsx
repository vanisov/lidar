import { useLayoutEffect, useMemo, useState } from 'preact/hooks';
import { panelSide } from '../core/geometry';
import type { Host } from '../core/host';
import { describe } from '../core/inspect';
import { pinned } from '../core/store';
import { icons } from './icons';
import { Inspection } from './Inspection';
import { PanelHint } from './PanelHint';
import { SettingsView } from './SettingsView';
import { useDrag } from './useDrag';
import { useShot } from './useShot';

const PANEL_WIDTH = 280;

/** The floating inspector: docks on whichever side keeps the pinned element visible, until dragged. */
export function Panel({ host }: { host: Host }) {
  const el = pinned.value;
  const info = useMemo(() => (el ? describe(el) : null), [el]);
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState<'inspect' | 'settings'>('inspect');
  const [side, setSide] = useState<'left' | 'right'>('right');
  const { pos, onPointerDown } = useDrag();
  const shot = useShot(host, el, info);
  useLayoutEffect(() => {
    if (el && !pos) setSide(panelSide(el.getBoundingClientRect(), PANEL_WIDTH, innerWidth));
  }, [el, pos]);

  const style = pos
    ? { left: `${pos.x}px`, top: `${pos.y}px` }
    : side === 'left' ? { left: '18px', top: '34px' } : { right: '18px', top: '34px' };
  const body = view === 'settings' ? <SettingsView /> : el && info ? <Inspection el={el} info={info} onShot={shot} /> : <PanelHint />;

  return (
    <div class={`panel ui${collapsed ? ' collapsed' : ''}`} style={style} role="dialog" aria-label="Lidar inspector">
      <div class="ph" onPointerDown={onPointerDown}>
        <span class="tag">{view === 'settings' ? 'Settings' : info ? info.label : 'Inspector'}</span>
        <div class="acts">
          <button aria-label="Settings" aria-pressed={view === 'settings'} onClick={() => setView(view === 'settings' ? 'inspect' : 'settings')}>
            {icons.gear()}
          </button>
          <button aria-label={collapsed ? 'Expand' : 'Collapse'} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? icons.chevronRight() : icons.chevronDown()}
          </button>
        </div>
      </div>
      <div class="pb">{body}</div>
    </div>
  );
}
