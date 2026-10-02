const nextPaint = () => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));

function dataUrlToBlob(url: string): Blob {
  const [head, b64] = url.split(',');
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return new Blob([bytes], { type: head.slice(5, head.indexOf(';')) });
}

/** PNG of the element's visible part, with Lidar's own UI hidden for the capture. */
export async function captureElement(el: Element, hostEl: HTMLElement): Promise<Blob> {
  const r = el.getBoundingClientRect();
  const x = Math.max(0, r.left);
  const y = Math.max(0, r.top);
  const w = Math.min(r.right, innerWidth) - x;
  const h = Math.min(r.bottom, innerHeight) - y;
  if (w <= 0 || h <= 0) throw new Error('element is off-screen');

  hostEl.style.setProperty('visibility', 'hidden', 'important');
  await nextPaint();
  let res: { url?: string; error?: string };
  try {
    res = await chrome.runtime.sendMessage({ type: 'capture' });
  } finally {
    hostEl.style.removeProperty('visibility');
  }
  if (!res?.url) throw new Error(res?.error ?? 'capture failed');

  const img = await createImageBitmap(dataUrlToBlob(res.url));
  const scale = img.width / innerWidth;
  const canvas = new OffscreenCanvas(Math.round(w * scale), Math.round(h * scale));
  canvas.getContext('2d')!.drawImage(img, x * scale, y * scale, w * scale, h * scale, 0, 0, canvas.width, canvas.height);
  return canvas.convertToBlob({ type: 'image/png' });
}
