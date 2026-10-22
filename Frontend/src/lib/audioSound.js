// Frontend/src/lib/audioSound.js

class SoundController {
  constructor() {
    this.audioCtx = null;
    this.enabled = localStorage.getItem("gupshup_sound_enabled") !== "false";
    this.ringtoneInterval = null;
    this.activeOscillators = [];

    // Automatically resume AudioContext on first user interaction anywhere
    if (typeof window !== "undefined") {
      const resumeOnGesture = () => {
        this.resume();
        window.removeEventListener("click", resumeOnGesture);
        window.removeEventListener("keydown", resumeOnGesture);
        window.removeEventListener("touchstart", resumeOnGesture);
      };
      window.addEventListener("click", resumeOnGesture);
      window.addEventListener("keydown", resumeOnGesture);
      window.addEventListener("touchstart", resumeOnGesture);
    }
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  resume() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
  }

  isSoundEnabled() {
    return this.enabled;
  }

  setSoundEnabled(val) {
    this.enabled = val;
    localStorage.setItem("gupshup_sound_enabled", val ? "true" : "false");
  }

  // ================= MESSAGE SOUNDS =================
  playSentSound() {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      this.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1050, now + 0.1);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn("Could not play sent sound:", e);
    }
  }

  playReceivedSound() {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      this.resume();

      const now = ctx.currentTime;

      // Bell 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now); // E5
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      // Bell 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.1); // A5
      gain2.gain.setValueAtTime(0.28, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn("Could not play received sound:", e);
    }
  }

  // ================= CALL RINGTONES =================

  /**
   * Plays a repeating classic telephone ringback tone ("ring-ring... ring-ring...")
   * while waiting for the other person to answer.
   */
  startCallingRingtone() {
    this.stopRingtone();
    if (!this.enabled) return;

    const playPulse = () => {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        this.resume();

        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // US standard ringback: 440Hz + 480Hz
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, now);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.setValueAtTime(0.35, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.35);
        osc2.stop(now + 1.35);
      } catch (err) {
        console.warn("Ringtone pulse error:", err);
      }
    };

    // First pulse immediately
    playPulse();
    // Repeat every 3.5 seconds (standard ring interval)
    this.ringtoneInterval = setInterval(playPulse, 3500);
  }

  /**
   * Plays a repeating musical chime melody when an incoming call arrives.
   */
  startIncomingRingtone() {
    this.stopRingtone();
    if (!this.enabled) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    const playMelody = () => {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        this.resume();

        const now = ctx.currentTime;

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.18;

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.38, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.35);
        });
      } catch (err) {
        console.warn("Incoming ringtone error:", err);
      }
    };

    playMelody();
    this.ringtoneInterval = setInterval(playMelody, 2800);
  }

  /**
   * Stop any active ringtone loop immediately.
   */
  stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  /**
   * Plays a descending 3-beep tone when a call ends or is rejected.
   */
  playCallEndTone() {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      this.resume();

      const tones = [480, 400, 320];
      const now = ctx.currentTime;

      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.12;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.1);
      });
    } catch (e) {
      console.warn("Call end tone error:", e);
    }
  }

  /**
   * Test tone to verify speakers and audio context are working
   */
  playTestTone() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      this.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn("Test tone error:", e);
    }
  }
}

export const soundFx = new SoundController();
