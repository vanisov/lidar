import { Row } from './row';

const ROWS: Record<'grid' | 'flex', [name: string, prop: string][]> = {
  grid: [['Columns', 'grid-template-columns'], ['Rows', 'grid-template-rows'], ['Gap', 'gap'], ['Flow', 'grid-auto-flow'], ['Justify', 'justify-content'], ['Align', 'align-items']],
  flex: [['Direction', 'flex-direction'], ['Wrap', 'flex-wrap'], ['Gap', 'gap'], ['Justify', 'justify-content'], ['Align', 'align-items']],
};

/** The pinned flex or grid container's layout: its display, then the properties that shape its tracks or lines. */
export function LayoutRows({ el, display }: { el: Element; display: string }) {
  const cs = getComputedStyle(el);
  return (
    <>
      <Row name="Layout" raw={display}>{display}</Row>
      {ROWS[display.includes('grid') ? 'grid' : 'flex'].map(([name, prop]) => {
        const v = cs.getPropertyValue(prop);
        return <Row key={name} name={name} raw={`${prop}: ${v};`}>{v}</Row>;
      })}
    </>
  );
}
