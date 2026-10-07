import { KEYS } from '../core/platform';
import { saveSettings, settings } from '../core/settings';

function Seg<T extends string>(props: { name: string; value: T; options: [T, string][]; onChange(v: T): void }) {
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

export function SettingsView() {
  const s = settings.value;
  return (
    <div class="settings">
      <div class="r">
        <span>Theme</span>
        <Seg name="Theme" value={s.theme} options={[['graphite', 'Dark'], ['light', 'Light']]} onChange={theme => saveSettings({ theme })} />
      </div>
      <div class="r">
        <span>Units</span>
        <Seg name="Units" value={s.units} options={[['px', 'px'], ['rem', 'rem']]} onChange={units => saveSettings({ units })} />
      </div>
      {s.units === 'rem' && (
        <div class="r">
          <span>1rem =</span>
          <span>
            <input
              type="number"
              min={1}
              max={64}
              aria-label="Pixels per rem"
              value={s.remBase}
              onInput={e => {
                const v = Number(e.currentTarget.value);
                if (Number.isFinite(v) && v >= 1 && v <= 64) saveSettings({ remBase: v });
              }}
              onBlur={e => (e.currentTarget.value = String(settings.value.remBase))}
            />{' '}
            px
          </span>
        </div>
      )}
      <div class="r">
        <span>Rulers</span>
        <Seg name="Rulers" value={s.rulers ? 'on' : 'off'} options={[['on', 'On'], ['off', 'Off']]} onChange={v => saveSettings({ rulers: v === 'on' })} />
      </div>
      <div class="r">
        <span>Spread stops at</span>
        <Seg
          name="Spread stops at"
          value={s.spreadMode}
          options={[['visual', 'What you see'], ['layout', 'Element boxes']]}
          onChange={spreadMode => saveSettings({ spreadMode })}
        />
      </div>
      {s.spreadMode === 'visual' && (
        <div class="r">
          <span>Edge tolerance</span>
          <span>
            <input
              type="range"
              min={1}
              max={64}
              aria-label="Edge tolerance"
              title="How different a color must be to count as an edge. Raise it if lines stop at faint shadows."
              value={s.spreadTolerance}
              onInput={e => saveSettings({ spreadTolerance: Number(e.currentTarget.value) })}
            />{' '}
            {s.spreadTolerance}
          </span>
        </div>
      )}
      <button class="link" onClick={() => void chrome.runtime.sendMessage({ type: 'open-shortcuts' })}>
        Change the {KEYS.toggle} shortcut…
      </button>
    </div>
  );
}
