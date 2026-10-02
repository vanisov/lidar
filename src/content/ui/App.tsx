import type { Host } from '../core/host';
import { Dock } from './Dock';
import { Toast } from './Toast';

export function App({ onClose }: { host: Host; onClose(): void }) {
  return (
    <>
      <Dock onClose={onClose} />
      <Toast />
    </>
  );
}
