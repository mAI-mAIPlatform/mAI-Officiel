"use client";

export type HapticPattern = number | number[];

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

  navigator.vibrate(pattern);
}
