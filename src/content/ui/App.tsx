import type { Host } from '../core/host';
import { Dock } from './Dock';
import { search } from '../core/store';
import { Panel } from './Panel';
import { SearchBar } from './SearchBar';
import { Toast } from './Toast';

export function App({ host, onClose }: { host: Host; onClose(): void }) {
  return (
    <>
      <Panel host={host} />
      <Dock onClose={onClose} />
      {search.value.open && <SearchBar host={host} />}
      <Toast />
    </>
  );
}
