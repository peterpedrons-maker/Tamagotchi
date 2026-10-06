/**
 * Tiny procedural sound engine (Web Audio oscillators, no audio files).
 * The combo "rising pitch" hit sound is the main dopamine hook: each hit
 * in a streak is a little higher-pitched than the last, Peggle-style.
 */
export class Sfx {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext | null {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!this.ctx) this.ctx = new Ctor();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, duration: number, opts: { type?: OscillatorType; gain?: number; sweep?: number } = {}): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type ?? "triangle";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(freq, now);
    if (opts.sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + opts.sweep), now + duration);

    const peak = opts.gain ?? 0.18;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /** Combo hit "plink" — pitch climbs with each consecutive hit in a shot. */
  hit(comboIndex: number): void {
    const freq = Math.min(1500, 420 + (comboIndex - 1) * 65);
    this.tone(freq, 0.09, { type: "triangle", gain: 0.15 });
  }

  /** A brighter two-tone chime layered on top of hit() when a peg breaks. */
  destroy(comboIndex: number): void {
    const freq = Math.min(1600, 500 + (comboIndex - 1) * 65);
    this.tone(freq, 0.08, { type: "sine", gain: 0.12 });
    window.setTimeout(() => this.tone(freq * 1.5, 0.12, { type: "sine", gain: 0.1 }), 35);
  }

  launch(): void {
    this.tone(220, 0.1, { type: "sawtooth", gain: 0.1, sweep: 260 });
  }

  gameOver(won: boolean): void {
    const base = won ? 660 : 320;
    this.tone(base, 0.18, { type: "triangle", gain: 0.14, sweep: won ? 220 : -180 });
    window.setTimeout(() => this.tone(base * (won ? 1.25 : 0.7), 0.24, { type: "triangle", gain: 0.12 }), 150);
  }
}
