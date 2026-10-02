import { useEffect, useState } from 'preact/hooks';
import { toastMsg } from '../core/store';

export function Toast() {
  const msg = toastMsg.value;
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!msg) return;
    setShown(true);
    const id = setTimeout(() => setShown(false), 1600);
    return () => clearTimeout(id);
  }, [msg?.n]);
  return (
    <div class={`toast${shown ? ' show' : ''}`} role="status" aria-live="polite">
      {msg?.text}
    </div>
  );
}
