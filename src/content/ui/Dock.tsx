import { TOOLS } from '../tools/registry';
import { icons } from './icons';
import { Mark } from './Mark';
import { Tip } from './Tip';
import { ToolButton } from './ToolButton';

export function Dock({ onClose }: { onClose(): void }) {
  return (
    <div class="dock ui" role="toolbar" aria-label="Lidar tools">
      <span class="mark"><Mark /></span>
      <span class="sep" />
      {TOOLS.map(t => <ToolButton key={t.id} tool={t} />)}
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
