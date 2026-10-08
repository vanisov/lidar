import { Fragment } from 'preact';
import { label } from '../../../core/describe';
import { ancestors } from '../../../core/inspect';
import { pinned } from '../../../core/store';

export function Breadcrumbs({ el }: { el: Element }) {
  const chain = ancestors(el).slice(-4);
  return (
    <div class="crumbs">
      {chain.map((a, i) => (
        <Fragment key={i}>
          {i > 0 && <span aria-hidden="true">›</span>}
          <button class={a === el ? 'cur' : ''} aria-current={a === el ? 'true' : undefined} onClick={() => (pinned.value = a)}>
            {label(a.tagName.toLowerCase(), a.id, [...a.classList].slice(0, 1))}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
