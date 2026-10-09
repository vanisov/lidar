import { compactSides } from '../../../core/geometry';
import type { ElementInfo } from '../../../core/describe';

export function BoxModel({ info, fmt }: { info: ElementInfo; fmt(n: number): string }) {
  const [pt, pr, pb, pl] = info.padding;
  const [bt, br, bb, bl] = info.border;
  return (
    <div class="bm">
      <div class="lb"><span>margin</span><span>{compactSides(info.margin, fmt)}</span></div>
      <div class="p">
        <div class="lb"><span>padding</span><span>{compactSides(info.padding, fmt)}</span></div>
        <div class="c">{fmt(info.width - pl - pr - bl - br)} × {fmt(info.height - pt - pb - bt - bb)}</div>
      </div>
    </div>
  );
}
