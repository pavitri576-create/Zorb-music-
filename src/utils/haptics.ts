/**
 * Tactile haptic feedback helpers powered by the Web Vibration API (`navigator.vibrate`).
 * Safely no-ops when unsupported or when disabled in Profile Settings.
 */

let hapticsEnabled = true;
let lastSpecificHapticAt = 0;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

export function getHapticsEnabled(): boolean {
  return hapticsEnabled;
}

function vibrate(pattern: number | number[], isSpecific = true): void {
  if (!hapticsEnabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  if (isSpecific) {
    lastSpecificHapticAt = Date.now();
  }
  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore permission or browser-policy blocks
  }
}

/** Light crisp tap for standard button interactions, tabs, chips & navigation */
export function hapticTap(): void {
  if (Date.now() - lastSpecificHapticAt < 140) {
    return;
  }
  vibrate(10, false);
}

/** Medium tactile detent for Play/Pause, Likes, Bookmarks, Shuffle & A-B Loop markers */
export function hapticToggle(): void {
  vibrate(18, true);
}

/** Punchy drum-pad feedback for Beat Maker pads & long-press clears */
export function hapticPad(): void {
  vibrate(16, true);
}

/** Crisp double-pulse for track skips (Next, Prev, Swipe Skip, Play Next) */
export function hapticSkip(): void {
  vibrate([12, 24, 16], true);
}

/** Celebratory multi-pulse burst for streak completion, rewards, unlocks & Coin Shop */
export function hapticMilestone(): void {
  vibrate([25, 45, 35, 45, 70], true);
}

/** Distinct double-buzz for invalid input, limit hit, or offline-blocked playback */
export function hapticError(): void {
  vibrate([35, 30, 35], true);
}
