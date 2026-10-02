import { describe, expect, it } from 'vitest';
import { aiBrief, cssRule, interestingStyles, label, type ElementInfo } from '../../src/content/core/describe';

describe('label', () => {
  it('joins tag, id and up to three classes', () => {
    expect(label('a', '', ['cta'])).toBe('a.cta');
    expect(label('div', 'hero', ['x', 'y', 'z', 'w'])).toBe('div#hero.x.y.z');
    expect(label('section', '', [])).toBe('section');
  });
});

describe('interestingStyles', () => {
  const from = (map: Record<string, string>) => (p: string) => map[p] ?? '';
  it('keeps meaningful values in a stable order and drops defaults', () => {
    const get = from({
      display: 'flex', position: 'static', top: '10px', gap: '8px', 'flex-direction': 'row', padding: '13px 22px',
      margin: '0px', color: 'rgb(255, 255, 255)', 'background-color': 'rgba(0, 0, 0, 0)', 'border-radius': '10px',
    });
    expect(interestingStyles(get)).toEqual([
      ['display', 'flex'], ['padding', '13px 22px'], ['border-radius', '10px'], ['color', 'rgb(255, 255, 255)'], ['gap', '8px'],
    ]);
  });
  it('shows offsets only for positioned elements', () => {
    expect(interestingStyles(from({ position: 'absolute', top: '10px' }))).toEqual([['position', 'absolute'], ['top', '10px']]);
  });
  it('hides flex and grid properties on other layouts', () => {
    expect(interestingStyles(from({ display: 'block', gap: '8px' }))).toEqual([['display', 'block']]);
  });
  it('keeps a border on one side only', () => {
    expect(interestingStyles(from({ 'border-top': '0px none rgb(0, 0, 0)', 'border-bottom': '1px solid rgb(204, 204, 204)' })))
      .toEqual([['border-bottom', '1px solid rgb(204, 204, 204)']]);
  });
});

const info: ElementInfo = {
  label: 'a.cta', path: ['body', 'section.hero', 'a.cta'], selector: 'section.hero > a.cta', text: 'Start free',
  width: 108, height: 43, padding: [13, 22, 13, 22], margin: [0, 10, 0, 0], border: [0, 0, 0, 0],
  font: 'Inter 14 / 600', lineHeight: 'normal', color: [255, 255, 255, 1], background: [29, 29, 29, 1], largeText: false,
  styles: [['display', 'inline-block'], ['padding', '13px 22px'], ['color', 'rgb(255, 255, 255)']],
};

describe('cssRule', () => {
  it('prints the interesting styles as a rule', () => {
    expect(cssRule(info)).toBe('a.cta {\n  display: inline-block;\n  padding: 13px 22px;\n  color: rgb(255, 255, 255);\n}');
  });
});

describe('aiBrief', () => {
  const brief = aiBrief(info, 'https://example.com/');
  it('describes the element for an AI agent', () => {
    expect(brief).toContain('## `a.cta` on https://example.com/');
    expect(brief).toContain('- Selector: `section.hero > a.cta`');
    expect(brief).toContain('- DOM path: body › section.hero › a.cta');
    expect(brief).toContain('- Text: "Start free"');
    expect(brief).toContain('- Size: 108 × 43 px');
    expect(brief).toContain('- Padding: 13px 22px · Margin: 0 10px 0 0');
    expect(brief).toMatch(/- Color #FFFFFF on #1D1D1D \(contrast 16\.\d\d:1, AAA\)/);
    expect(brief).toContain('```css\na.cta {');
  });
  it('omits the text line for empty elements', () => {
    expect(aiBrief({ ...info, text: '' }, 'https://example.com/')).not.toContain('- Text:');
  });
});
