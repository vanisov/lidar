import { contrast, grade, toHex } from '../../../core/color';
import { cssRule, type ElementInfo } from '../../../core/describe';
import { formatLength } from '../../../core/geometry';
import { hasImageBackdrop } from '../../../core/inspect';
import { settings } from '../../../core/settings';
import { BoxModel } from './box-model';
import { Breadcrumbs } from './breadcrumbs';
import { copyValue } from '../../utils/copy-value';
import { Row } from './row';

/** The inspector body for a pinned element: where it sits, its box, its styles, and the copy actions. */
export function Inspection({ el, info, onShot }: { el: Element; info: ElementInfo; onShot(forAI: boolean): void }) {
  const s = settings.value;
  const fmt = (n: number) => formatLength(n, s.units, s.remBase);
  const ratio = contrast(info.color, info.background);
  const g = grade(ratio, info.largeText);
  const approx = hasImageBackdrop(el);
  const styleOf = (prop: string) => info.styles.find(([k]) => k === prop)?.[1];
  const radius = styleOf('border-radius');
  const display = styleOf('display') ?? '';
  const gap = styleOf('gap');
  return (
    <>
      <Breadcrumbs el={el} />
      <BoxModel info={info} fmt={fmt} />
      <Row name="Size" raw={`${fmt(info.width)} × ${fmt(info.height)}`}>{fmt(info.width)} × {fmt(info.height)}</Row>
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
        <button class="pri" onClick={() => copyValue(cssRule(info), 'CSS')}>Copy CSS</button>
        <button onClick={() => onShot(true)}>Copy for AI</button>
        <button onClick={() => onShot(false)}>Screenshot</button>
      </div>
    </>
  );
}
