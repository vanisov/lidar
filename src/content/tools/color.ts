import { copyText } from '../core/clipboard';
import { toast, tool } from '../core/store';

type EyeDropperCtor = new () => { open(): Promise<{ sRGBHex: string }> };

export async function pickColor(): Promise<void> {
  const EyeDropper = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
  if (!EyeDropper) {
    toast('The color picker needs Chrome 95 or newer');
    return;
  }
  const previous = tool.value;
  tool.value = 'color';
  try {
    const { sRGBHex } = await new EyeDropper().open();
    const hex = sRGBHex.toUpperCase();
    await copyText(hex);
    toast(`Copied ${hex}`);
  } catch {
    // Esc in the picker cancels it: nothing to report.
  } finally {
    tool.value = previous === 'color' ? 'measure' : previous;
  }
}
