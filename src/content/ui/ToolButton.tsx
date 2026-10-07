import { useRef } from 'preact/hooks';
import { flyout } from '../core/store';
import type { Tool } from '../tools/registry';
import { Flyout } from './Flyout';
import { Tip } from './Tip';
import { useFlyoutTrigger } from './useFlyoutTrigger';

/** One dock tool: its icon, its tooltip and, for a tool with options, the corner triangle and flyout. */
export function ToolButton({ tool }: { tool: Tool }) {
  const btn = useRef<HTMLButtonElement>(null);
  const { props, opened } = useFlyoutTrigger(tool);
  const detail = tool.detail?.();
  const open = flyout.value === tool.id;
  return (
    <span class={`slot${open ? ' open' : ''}`}>
      <button
        ref={btn}
        class={tool.toggle ? 'toggle' : ''}
        data-tool={tool.id}
        data-mode={detail?.toLowerCase()}
        aria-label={detail ? `${tool.label}, ${detail}` : tool.label}
        aria-pressed={tool.isOn()}
        aria-keyshortcuts={tool.key.toUpperCase()}
        onClick={() => {
          if (!opened()) void tool.run();
        }}
        {...props}
      >
        {tool.icon()}
        {tool.options && <span class="corner" aria-hidden="true" />}
        <Tip name={tool.label} detail={detail} keys={tool.key.toUpperCase()} hold={tool.hold} />
      </button>
      {open && <Flyout tool={tool} trigger={btn.current} />}
    </span>
  );
}
