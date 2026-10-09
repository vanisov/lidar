export function Seg<T extends string>(props: { name: string; value: T; options: [T, string][]; onChange(v: T): void }) {
  return (
    <div class="seg" role="radiogroup" aria-label={props.name}>
      {props.options.map(([v, text]) => (
        <button key={v} role="radio" aria-checked={v === props.value} onClick={() => props.onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}
