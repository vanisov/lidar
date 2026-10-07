interface Props {
  name: string;
  /** The tool's current mode, if it has one. */
  detail?: string;
  keys: string;
  /** A modifier that works the tool while held. */
  hold?: string;
}

/** Photoshop-style tooltip: the name, the current mode, then the key (and the modifier you can hold instead). */
export function Tip({ name, detail, keys, hold }: Props) {
  return (
    <span class="tip" aria-hidden="true">
      <b>{name}</b>
      {detail && <em>{detail}</em>}
      <kbd>{keys}</kbd>
      {hold && <><span class="or">or hold</span><kbd>{hold}</kbd></>}
    </span>
  );
}
