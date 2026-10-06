import { TOOLS } from '../tools/registry';
import { icons } from './icons';

export function Dock({ onClose }: { onClose(): void }) {
  return (
    <div class="dock ui" role="toolbar" aria-label="Lidar tools">
      <div class="brand" aria-hidden="true">
        <i style={{ height: '9px' }} />
        <i style={{ height: '16px' }} />
        <i style={{ height: '11px' }} />
        <b />
      </div>
      <span class="sep" />
      {TOOLS.map(t => (
        <button
          key={t.id}
          class={t.toggle ? 'toggle' : ''}
          data-tool={t.id}
          aria-label={t.label}
          aria-pressed={t.isOn()}
          data-tip={`${t.label}   ${t.key.toUpperCase()}`}
          onClick={() => void t.run()}
        >
          {t.icon()}
          {t.badge && <span class="badge" aria-hidden="true">{t.badge()}</span>}
        </button>
      ))}
      <span class="sep" />
      <button data-tool="close" aria-label="Close Lidar" data-tip="Close   Esc" onClick={onClose}>
        {icons.close()}
      </button>
    </div>
  );
}
