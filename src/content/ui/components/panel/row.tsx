import type { ComponentChildren } from 'preact';
import { copyValue } from '../../utils/copy-value';

/** One inspector row: a name, and a value that copies `raw` when clicked. */
export function Row({ name, raw, children }: { name: string; raw: string; children: ComponentChildren }) {
  return (
    <div class="r" data-row={name}>
      <span>{name}</span>
      <button class="val" title="Click to copy" aria-label={`Copy ${name}: ${raw}`} onClick={() => copyValue(raw)}>
        {children}
      </button>
    </div>
  );
}
