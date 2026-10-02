import { Fragment, type ComponentChildren } from 'preact';
import { useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { copyImage, copyText } from '../core/clipboard';
import { contrast, grade, toHex } from '../core/color';
import { aiBrief, cssRule, label } from '../core/describe';
import { compactSides, formatLength, panelSide } from '../core/geometry';
import type { Host } from '../core/host';
import { ancestors, describe, hasImageBackdrop } from '../core/inspect';
import { captureElement } from '../core/screenshot';
import { settings } from '../core/settings';
import { pinned, toast } from '../core/store';
import { icons } from './icons';

const PANEL_WIDTH = 280;

async function copy(text: string, what = text) {
  try {
    await copyText(text);
    toast(`Copied ${what.length > 32 ? `${what.slice(0, 32)}…` : what}`);
  } catch {
    toast('Copy failed: this page blocks clipboard access');
  }
}

function Row({ name, raw, children }: { name: string; raw: string; children: ComponentChildren }) {
  return (
    <div class="r" data-row={name}>
      <span>{name}</span>
      <button class="val" title="Click to copy" aria-label={`Copy ${name}: ${raw}`} onClick={() => copy(raw)}>
        {children}
      </button>
    </div>
  );
}

export function Panel({ host }: { host: Host }) {
  const el = pinned.value;
  const s = settings.value;
  const info = useMemo(() => (el ? describe(el) : null), [el]);
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [side, setSide] = useState<'left' | 'right'>('right');
  useLayoutEffect(() => {
    if (el && !pos) setSide(panelSide(el.getBoundingClientRect(), PANEL_WIDTH, innerWidth));
  }, [el, pos]);
  const fmt = (n: number) => formatLength(n, s.units, s.remBase);

  const busy = useRef(false);
  async function shot(forAI: boolean) {
    if (!el || !info || busy.current) return;
    busy.current = true;
    try {
      await shoot(forAI);
    } finally {
      busy.current = false;
    }
  }
  async function shoot(forAI: boolean) {
    if (!el || !info) return;
    const brief = forAI ? aiBrief(info, location.href) : undefined;
    let png: Blob;
    try {
      png = await captureElement(el, host.el);
    } catch (err) {
      const why = (err as Error).message;
      if (!brief) return toast(`Screenshot failed: ${why}`);
      try {
        await copyText(brief);
        return toast(`Copied brief for AI · no screenshot: ${why}`);
      } catch {
        return toast(`Screenshot failed: ${why}`);
      }
    }
    const how = await copyImage(png, brief);
    if (how === 'copied') return toast(brief ? 'Copied brief + screenshot for AI' : 'Screenshot copied');
    if (!brief) return toast('Screenshot downloaded');
    try {
      await copyText(brief);
      toast('Brief copied · screenshot downloaded');
    } catch {
      toast("Screenshot downloaded · couldn't copy the brief");
    }
  }

  const drag = (e: PointerEvent) => {
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

  const style = pos
    ? { left: `${pos.x}px`, top: `${pos.y}px` }
    : side === 'left' ? { left: '18px', top: '34px' } : { right: '18px', top: '34px' };

  let body: ComponentChildren;
  if (!el || !info) {
    body = (
      <div class="empty">
        Hover anything to measure it. <b>Click</b> to pin it.
        <br />
        Hold <kbd>Alt</kbd> to measure the distance to the pinned element.
        <br />
        <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> walk the tree · <kbd>Esc</kbd> closes
      </div>
    );
  } else {
    const [pt, pr, pb, pl] = info.padding;
    const [bt, br, bb, bl] = info.border;
    const ratio = contrast(info.color, info.background);
    const g = grade(ratio, info.largeText);
    const approx = hasImageBackdrop(el);
    const styleOf = (prop: string) => info.styles.find(([k]) => k === prop)?.[1];
    const radius = styleOf('border-radius');
    const display = styleOf('display') ?? '';
    const gap = styleOf('gap');
    const chain = ancestors(el).slice(-4);
    body = (
      <>
        <div class="crumbs">
          {chain.map((a, i) => (
            <Fragment key={i}>
              {i > 0 && <span aria-hidden="true">›</span>}
              <button class={a === el ? 'cur' : ''} aria-current={a === el ? 'true' : undefined} onClick={() => (pinned.value = a)}>
                {label(a.tagName.toLowerCase(), a.id, [...a.classList].slice(0, 1))}
              </button>
            </Fragment>
          ))}
        </div>
        <div class="bm">
          <div class="lb"><span>margin</span><span>{compactSides(info.margin, fmt)}</span></div>
          <div class="p">
            <div class="lb"><span>padding</span><span>{compactSides(info.padding, fmt)}</span></div>
            <div class="c">{fmt(info.width - pl - pr - bl - br)} × {fmt(info.height - pt - pb - bt - bb)}</div>
          </div>
        </div>
        <Row name="Size" raw={`${Math.round(info.width)} × ${Math.round(info.height)}`}>{fmt(info.width)} × {fmt(info.height)}</Row>
        <Row name="Font" raw={info.font}>{info.font}</Row>
        <Row name="Line height" raw={info.lineHeight}>{info.lineHeight}</Row>
        <Row name="Color" raw={toHex(info.color)}><i class="sw" style={{ background: toHex(info.color) }} />{toHex(info.color)}</Row>
        <Row name="Background" raw={toHex(info.background)}><i class="sw" style={{ background: toHex(info.background) }} />{toHex(info.background)}</Row>
        {radius && <Row name="Radius" raw={radius}>{radius}</Row>}
        {/flex|grid/.test(display) && <Row name="Layout" raw={display}>{display}{gap ? ` · gap ${gap}` : ''}</Row>}
        <Row name="Contrast" raw={ratio.toFixed(2)}><span class={g === 'Fail' ? 'bad' : 'ok'} title={approx ? "Approximate: there's a background image behind this text" : undefined}>{approx ? '≈ ' : ''}{ratio.toFixed(1)} {g}</span></Row>
        <details class="computed">
          <summary>Computed styles · {info.styles.length}</summary>
          {info.styles.map(([k, v]) => <Row key={k} name={k} raw={`${k}: ${v};`}>{v}</Row>)}
        </details>
        <div class="btns">
          <button class="pri" onClick={() => copy(cssRule(info), 'CSS')}>Copy CSS</button>
          <button onClick={() => shot(true)}>Copy for AI</button>
          <button onClick={() => shot(false)}>Screenshot</button>
        </div>
      </>
    );
  }

  return (
    <div class={`panel ui${collapsed ? ' collapsed' : ''}`} style={style} role="dialog" aria-label="Lidar inspector">
      <div class="ph" onPointerDown={drag}>
        <span class="tag">{info ? info.label : 'Inspector'}</span>
        <div class="acts">
          <button aria-label={collapsed ? 'Expand' : 'Collapse'} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? icons.chevronRight() : icons.chevronDown()}
          </button>
        </div>
      </div>
      <div class="pb">{body}</div>
    </div>
  );
}
