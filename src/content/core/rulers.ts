import type { Units } from './geometry';

export interface RulerScale {
  /** Tick spacing in px: long tick + number, medium tick, small tick. */
  major: number;
  mid: number;
  minor: number;
  /** Text for the n-th long tick. */
  label(n: number): string;
}

const REM_STEPS = [1, 2, 5, 10, 20, 50];

/** Every 100px in px mode; in rem mode the first whole-rem step at least 64px apart, so labels never crowd. */
export function rulerScale(units: Units, remBase: number): RulerScale {
  if (units === 'px') return { major: 100, mid: 50, minor: 10, label: n => String(n * 100) };
  const k = REM_STEPS.find(s => s * remBase >= 64) ?? REM_STEPS[REM_STEPS.length - 1];
  const major = k * remBase;
  return { major, mid: major / 2, minor: major / 10, label: n => `${n * k}rem` };
}
