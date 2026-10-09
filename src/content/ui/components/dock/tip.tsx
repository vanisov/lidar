interface Props {
  name: string;
  detail?: string;
  keys: string;
  hold?: string;
}

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
