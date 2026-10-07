import { KEYS } from '../core/platform';

/** What the inspector says before anything is pinned: how to use it. */
export function PanelHint() {
  return (
    <div class="empty">
      Hover anything to measure it. <b>Click</b> to pin it.
      <br />
      Hold <kbd>{KEYS.alt}</kbd> to measure the distance to the pinned element.
      <br />
      Hold <kbd>⇧</kbd> or press <kbd>S</kbd> to spread lines to the nearest edges.
      <br />
      <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> walk the tree · <kbd>Esc</kbd> closes
    </div>
  );
}
