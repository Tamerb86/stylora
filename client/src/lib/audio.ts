/**
 * Audio Notification Utility
 *
 * Plays sound notifications for payment events
 */

// Audio context for Web Audio API
let audioContext: AudioContext | null = null;

/**
 * Initialize audio context (required for iOS Safari)
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a beep sound with specified frequency and duration
 */
function playBeep(
  frequency: number,
  duration: number,
  volume: number = 0.3
): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      ctx.currentTime + duration
    );

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.error("Failed to play beep:", error);
  }
}

/**
 * Play success sound (pleasant "ding")
 */
export function playSuccessSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Play a pleasant two-tone "ding"
    // First tone: E6 (1318.51 Hz)
    playBeep(1318.51, 0.15, 0.3);

    // Second tone: C7 (2093.00 Hz) - slightly delayed
    setTimeout(() => {
      playBeep(2093.0, 0.2, 0.25);
    }, 100);
  } catch (error) {
    console.error("Failed to play success sound:", error);
  }
}

/**
 * Play error sound (alert beep)
 */
export function playErrorSound(): void {
  try {
    const ctx = getAudioContext();

    // Play a lower, more urgent beep
    // Three short beeps at 400 Hz
    playBeep(400, 0.1, 0.4);
    setTimeout(() => playBeep(400, 0.1, 0.4), 150);
    setTimeout(() => playBeep(400, 0.15, 0.4), 300);
  } catch (error) {
    console.error("Failed to play error sound:", error);
  }
}

/**
 * Play warning sound (single beep)
 */
export function playWarningSound(): void {
  try {
    playBeep(600, 0.2, 0.3);
  } catch (error) {
    console.error("Failed to play warning sound:", error);
  }
}

/**
 * Initialize audio context on user interaction (required for iOS)
 */
export function initAudio(): void {
  try {
    const ctx = getAudioContext();
    // Resume context if suspended (iOS Safari requirement)
    if (ctx.state === "suspended") {
      ctx.resume();
    }
  } catch (error) {
    console.error("Failed to initialize audio:", error);
  }
}
