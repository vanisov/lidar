import { describe, expect, it } from 'vitest';
import { keyLabels } from '../../src/content/core/platform';

describe('keyLabels', () => {
  it('uses the Option symbol on Macs', () => {
    expect(keyLabels('macOS')).toEqual({ alt: '⌥', toggle: '⌥L' });
    expect(keyLabels('MacIntel')).toEqual({ alt: '⌥', toggle: '⌥L' });
  });
  it('uses Alt everywhere else', () => {
    for (const p of ['Windows', 'Win32', 'Linux x86_64', 'Chrome OS', '']) expect(keyLabels(p)).toEqual({ alt: 'Alt', toggle: 'Alt+L' });
  });
});
