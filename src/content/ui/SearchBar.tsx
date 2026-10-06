import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { Host } from '../core/host';
import { closeSearch, pinned, search } from '../core/store';

export function SearchBar({ host }: { host: Host }) {
  const s = search.value;
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => input.current?.focus(), []);

  const find = (q: string) => {
    setQuery(q);
    let matches: Element[] = [];
    let invalid = false;
    try {
      // Only rendered elements count: <head>, <meta> and hidden ones can't be shown or pinned.
      if (q.trim()) matches = [...document.querySelectorAll(q)].filter(e => e !== host.el && e.getClientRects().length > 0);
    } catch {
      invalid = true;
    }
    search.value = { open: true, matches, index: 0, invalid };
    matches[0]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  const step = (by: number) => {
    const n = s.matches.length;
    if (!n) return;
    const index = (s.index + by + n) % n;
    search.value = { ...s, index };
    s.matches[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      step(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Enter' && s.matches[s.index]) {
      pinned.value = s.matches[s.index];
      closeSearch();
    }
  };
  const status = s.invalid
    ? 'Not a valid selector'
    : !query.trim()
      ? 'Type a CSS selector'
      : s.matches.length
        ? `${s.index + 1} of ${s.matches.length}`
        : 'No matches';

  return (
    <div class="search ui" role="search">
      <span aria-hidden="true">/</span>
      <input
        ref={input}
        value={query}
        onInput={e => find(e.currentTarget.value)}
        onKeyDown={onKey}
        aria-label="Find elements by CSS selector"
        placeholder=".card, button, #main"
        spellcheck={false}
      />
      <span class="n" role="status" aria-live="polite">{status}</span>
    </div>
  );
}
