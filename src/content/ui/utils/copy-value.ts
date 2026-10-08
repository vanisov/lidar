import { copyText } from '../../core/clipboard';
import { toast } from '../../core/store';

/** `what` names the text in the toast when the text is too long to show. */
export async function copyValue(text: string, what = text): Promise<void> {
  try {
    await copyText(text);
    toast(`Copied ${what.length > 32 ? `${what.slice(0, 32)}…` : what}`);
  } catch {
    toast('Copy failed: this page blocks clipboard access');
  }
}
