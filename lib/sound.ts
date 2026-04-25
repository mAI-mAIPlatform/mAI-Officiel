"use client";

export const SOUND_EFFECTS_ENABLED_STORAGE_KEY =
  "mai.settings.sound-effects.enabled.v1";

let audioContextRef: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextCtor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  if (!audioContextRef) {
    audioContextRef = new AudioContextCtor();
  }

  return audioContextRef;
}

export function playUiSound(
  tone: "toggle" | "success" | "notification" = "notification"
) {
  if (typeof window === "undefined") {
    return;
  }

  const enabled =
    window.localStorage.getItem(SOUND_EFFECTS_ENABLED_STORAGE_KEY) === "true";
  if (!enabled) {
    return;
  }

  const context = getAudioContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  const now = context.currentTime;
  const frequencyByTone = {
    toggle: 520,
    success: 780,
    notification: 620,
  } as const;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequencyByTone[tone], now);
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  oscillator.start(now);
  oscillator.stop(now + 0.17);
}
