/** navigator.clipboard is missing on http: pages, so fall back to execCommand. */
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (!ok) throw new Error('clipboard unavailable');
  }
}

/** Downloads the PNG instead when the clipboard refuses images. */
export async function copyImage(png: Blob, text?: string): Promise<'copied' | 'downloaded'> {
  try {
    const parts: Record<string, Blob> = { 'image/png': png };
    if (text) parts['text/plain'] = new Blob([text], { type: 'text/plain' });
    await navigator.clipboard.write([new ClipboardItem(parts)]);
    return 'copied';
  } catch {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(png);
    a.download = 'lidar-element.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return 'downloaded';
  }
}
