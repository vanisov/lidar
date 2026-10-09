export function keyLabels(platform: string): { alt: string; toggle: string } {
  return /mac/i.test(platform) ? { alt: '⌥', toggle: '⌥L' } : { alt: 'Alt', toggle: 'Alt+L' };
}

const nav = navigator as Navigator & { userAgentData?: { platform: string } };
export const KEYS = keyLabels(nav.userAgentData?.platform ?? nav.platform ?? '');
