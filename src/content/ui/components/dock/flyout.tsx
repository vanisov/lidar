import { flyout } from '../../../core/store';
import type { Tool } from '../../../tools/registry';
import { useMenu } from '../../hooks/use-menu';

/** A tool's options, opened from the corner triangle on its dock button. Choosing one selects it and closes. */
export function Flyout({ tool, trigger }: { tool: Tool; trigger: HTMLButtonElement | null }) {
  const close = () => (flyout.value = null);
  const { ref, onKeyDown } = useMenu(trigger, close);
  return (
    <div class="flyout" role="menu" aria-label={`${tool.label} options`} ref={ref} onKeyDown={onKeyDown}>
      {tool.options!.map(o => (
        <button
          key={o.label}
          role="menuitemradio"
          aria-checked={o.isOn()}
          onClick={() => {
            o.select();
            close();
          }}
        >
          <i class="dot" aria-hidden="true" />
          <span><b>{o.label}</b><small>{o.hint}</small></span>
        </button>
      ))}
    </div>
  );
}
