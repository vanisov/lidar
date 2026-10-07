import type { Host } from '../core/host';
import { search } from '../core/store';
import { Dock } from './components/dock/dock';
import { Panel } from './components/panel/panel';
import { SearchBar } from './components/search-bar';
import { Toast } from './components/toast';

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
