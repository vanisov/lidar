import { useRef } from 'preact/hooks';
import { copyImage, copyText } from '../../core/clipboard';
import { aiBrief } from '../../core/describe';
import type { Host } from '../../core/host';
import type { ElementInfo } from '../../core/describe';
import { captureElement } from '../../core/screenshot';
import { toast } from '../../core/store';

/**
 * Screenshot and Copy for AI. Copies the image (with the brief, for AI) and falls back step by step: a
 * download when the clipboard refuses an image, the brief alone when the capture fails. One run at a time.
 */
export function useShot(host: Host, el: Element | null, info: ElementInfo | null) {
  const busy = useRef(false);

  async function shoot(forAI: boolean) {
    if (!el || !info) return;
    const brief = forAI ? aiBrief(info, location.href) : undefined;
    let png: Blob;
    try {
      png = await captureElement(el, host.el);
    } catch (err) {
      const why = (err as Error).message;
      if (why.includes('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND')) return toast('Try again in a moment');
      if (!brief) return toast(`Screenshot failed: ${why}`);
      try {
        await copyText(brief);
        return toast(`Copied brief for AI · no screenshot: ${why}`);
      } catch {
        return toast(`Screenshot failed: ${why}`);
      }
    }
    const how = await copyImage(png, brief);
    if (how === 'copied') return toast(brief ? 'Copied brief + screenshot for AI' : 'Screenshot copied');
    if (!brief) return toast('Screenshot downloaded');
    try {
      await copyText(brief);
      toast('Brief copied · screenshot downloaded');
    } catch {
      toast("Screenshot downloaded · couldn't copy the brief");
    }
  }

  return async (forAI: boolean) => {
    if (!el || !info || busy.current) return;
    busy.current = true;
    try {
      await shoot(forAI);
    } finally {
      busy.current = false;
    }
  };
}
