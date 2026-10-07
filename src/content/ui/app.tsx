import type { Host } from '../core/host';
import { Dock } from './components/dock/dock';
import { Panel } from './components/panel/panel';
import { Toast } from './components/toast';

export function App({ host, onClose }: { host: Host; onClose(): void }) {
  return (
    <>
      <Panel host={host} />
      <Dock onClose={onClose} />
      <Toast />
    </>
  );
}
