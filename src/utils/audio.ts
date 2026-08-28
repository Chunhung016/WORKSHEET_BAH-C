/**
 * Web Audio API synthesizer for kid-friendly bee-themed sound effects
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public beeBuzzEnabled: boolean = true;
  public popEnabled: boolean = true;
  public chimeEnabled: boolean = true;
  public fanfareEnabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public syncWithSettings(settings: {
    soundEnabled?: boolean;
    beeBuzzEnabled?: boolean;
    popSoundEnabled?: boolean;
    chimeSoundEnabled?: boolean;
    fanfareSoundEnabled?: boolean;
  }) {
    if (settings.soundEnabled !== undefined) {
      this.isMuted = !settings.soundEnabled;
    }
    if (settings.beeBuzzEnabled !== undefined) {
      this.beeBuzzEnabled = settings.beeBuzzEnabled;
    }
    if (settings.popSoundEnabled !== undefined) {
      this.popEnabled = settings.popSoundEnabled;
    }
    if (settings.chimeSoundEnabled !== undefined) {
      this.chimeEnabled = settings.chimeSoundEnabled;
    }
    if (settings.fanfareSoundEnabled !== undefined) {
      this.fanfareEnabled = settings.fanfareSoundEnabled;
    }
  }

  // Cheerful pop sound for clicking points / buttons
  public playPop() {
    if (this.isMuted || !this.popEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // ignore
    }
  }

  // Friendly bee buzz sound effect
  public playBeeBuzz() {
    if (this.isMuted || !this.beeBuzzEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(280, now + 0.15);
      osc.frequency.linearRampToValueAtTime(240, now + 0.3);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // ignore
    }
  }

  // Correct chime sound effect
  public playChime() {
    if (this.isMuted || !this.chimeEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {
      // ignore
    }
  }

  // Wrong placement sound (gentle friendly wobble)
  public playWrong() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(240, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // ignore
    }
  }

  // Countdown beep for 3..2..1
  public playCountdownBeep(isFinal: boolean = false) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isFinal ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 523.25, now);
      if (isFinal) {
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2);
      }

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.35 : 0.18));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + (isFinal ? 0.35 : 0.18));
    } catch {
      // ignore
    }
  }

  // Grand celebration fanfare
  public playCelebration() {
    if (this.isMuted || !this.fanfareEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const fanfare = [
        { f: 523.25, d: 0.12, t: 0 },
        { f: 659.25, d: 0.12, t: 0.12 },
        { f: 783.99, d: 0.12, t: 0.24 },
        { f: 1046.5, d: 0.4, t: 0.36 },
        { f: 880.0, d: 0.15, t: 0.78 },
        { f: 1046.5, d: 0.6, t: 0.95 },
      ];

      fanfare.forEach((item) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + item.t;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, start);

        gain.gain.setValueAtTime(0.28, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + item.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + item.d + 0.05);
      });
    } catch {
      // ignore
    }
  }
}

export const sound = new SoundEffects();

