"use client";

export type HapticPattern = number | number[];
export const HAPTICS_ENABLED_STORAGE_KEY = "mai.settings.vibrations.enabled.v1";

function isMobileLikeDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}

export function triggerHaptic(pattern: HapticPattern) {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.vibrate !== "function" ||
    !isMobileLikeDevice()
  ) {
    return;
  }

  if (typeof window !== "undefined") {
    const enabled = window.localStorage.getItem(HAPTICS_ENABLED_STORAGE_KEY);
    if (enabled === "false") {
      return;
    }
  }

  navigator.vibrate(pattern);
}
