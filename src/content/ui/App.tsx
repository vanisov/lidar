import type { Host } from '../core/host';
import { Dock } from './Dock';
import { Panel } from './Panel';
import { Toast } from './Toast';

export function App({ host, onClose }: { host: Host; onClose(): void }) {
  return (
    <>
      <Panel host={host} />
      <Dock onClose={onClose} />
      <Toast />
    </>
  );
}
