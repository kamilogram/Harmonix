/**
 * Concert Grand Acoustic Piano Synthesizer using Web Audio API
 *
 * Designed specifically for realistic acoustic piano reproduction:
 * 1. 100% Simultaneous chord scheduling (all chord notes strike synchronously on the exact same audio sample clock)
 * 2. Multi-string unison beating (simulates the 3-string choir of acoustic grand piano keys)
 * 3. Stiff string inharmonicity model (slight natural overtone stretching: fn = n * f0 * sqrt(1 + B * n^2))
 * 4. Differential harmonic decay (higher partials fade quickly, leaving warm fundamental and octave sustain)
 * 5. Tactile felt hammer transient (simulates the wooden hammer felt striking steel strings)
 * 6. Warm stereo acoustic soundboard resonance (spruce body reflection & room acoustics)
 * 7. Velocity-sensitive timbre & dynamic polyphonic headroom scaling
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundboardGain: GainNode | null = null;
  private isMuted: boolean = false;
  private activeNotes: Map<number, () => void> = new Map();

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output gain with gentle safety ceiling
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.72, this.ctx.currentTime);

      // Warm acoustic soundboard resonator (multi-tap delay simulating grand piano wooden body & open lid)
      const delayL = this.ctx.createDelay();
      const delayR = this.ctx.createDelay();
      const delayCenter = this.ctx.createDelay();

      delayL.delayTime.setValueAtTime(0.021, this.ctx.currentTime); // 21ms
      delayR.delayTime.setValueAtTime(0.035, this.ctx.currentTime); // 35ms
      delayCenter.delayTime.setValueAtTime(0.049, this.ctx.currentTime); // 49ms

      // Wooden body damping filter (gentle lowpass at 1800Hz with soft slope)
      const dampFilter = this.ctx.createBiquadFilter();
      dampFilter.type = 'lowpass';
      dampFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
      dampFilter.Q.setValueAtTime(0.6, this.ctx.currentTime);

      // Body warmth peaking filter (subtle 240Hz spruce rim resonance)
      const bodyFilter = this.ctx.createBiquadFilter();
      bodyFilter.type = 'peaking';
      bodyFilter.frequency.setValueAtTime(240, this.ctx.currentTime);
      bodyFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
      bodyFilter.gain.setValueAtTime(1.8, this.ctx.currentTime); // +1.8dB warmth

      const feedback = this.ctx.createGain();
      feedback.gain.setValueAtTime(0.19, this.ctx.currentTime);

      this.soundboardGain = this.ctx.createGain();
      this.soundboardGain.gain.setValueAtTime(0.24, this.ctx.currentTime);

      // Soundboard routing
      this.masterGain.connect(delayL);
      this.masterGain.connect(delayR);
      this.masterGain.connect(delayCenter);

      delayL.connect(dampFilter);
      delayR.connect(dampFilter);
      delayCenter.connect(dampFilter);

      dampFilter.connect(bodyFilter);
      bodyFilter.connect(feedback);
      feedback.connect(delayL);

      bodyFilter.connect(this.soundboardGain);
      this.soundboardGain.connect(this.ctx.destination);

      // Direct dry signal
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Play an authentic acoustic piano note with:
   * - Unison string chorus (detuned string choir)
   * - Inharmonic partial overtones
   * - Differential decay
   * - Felt hammer impact impulse
   * - Precise audio-clock start time
   */
  public playNote(
    midi: number,
    duration: number = 2.6,
    velocity: number = 0.85,
    exactStartTime?: number
  ): () => void {
    if (this.isMuted) return () => {};
    this.initContext();
    if (!this.ctx || !this.masterGain) return () => {};

    const now = exactStartTime !== undefined ? exactStartTime : this.ctx.currentTime + 0.002;
    const baseFreq = this.midiToFreq(midi);

    // Stop previous voice of same MIDI pitch to avoid phase buildup
    const existingStop = this.activeNotes.get(midi);
    if (existingStop) {
      existingStop();
      this.activeNotes.delete(midi);
    }

    // Voice Main Gain Node
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);
    // Smooth 5ms attack - instantaneous, crisp, but zero DC-pop or digital click
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.46, now + 0.005);
    // Initial acoustic hammer impact settling (felt compression)
    voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.32, now + 0.06);
    // Long, singing acoustic sustain decay
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Acoustic Piano Felt Lowpass Filter (brightness scales dynamically with velocity)
    const voiceFilter = this.ctx.createBiquadFilter();
    voiceFilter.type = 'lowpass';
    const cutoff = Math.min(8500, Math.max(1600, baseFreq * 3.5 + velocity * 2200));
    voiceFilter.frequency.setValueAtTime(cutoff, now);
    // Filter decay: high frequencies damp faster in wooden piano soundboards
    voiceFilter.frequency.exponentialRampToValueAtTime(Math.max(900, cutoff * 0.4), now + duration * 0.7);
    voiceFilter.Q.setValueAtTime(0.55, now);

    // Stereo Panning (natural keyboard spread across acoustic grand soundboard)
    const pan = Math.max(-0.42, Math.min(0.42, (midi - 60) / 32));
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);

    // =========================================================================
    // 1. TACTILE HAMMER FELT STRIKE TRANSIENT
    // Simulates the physical felt hammer striking steel wire (lasting ~15ms)
    // =========================================================================
    const hammerOsc = this.ctx.createOscillator();
    const hammerGain = this.ctx.createGain();
    const hammerFilter = this.ctx.createBiquadFilter();

    hammerFilter.type = 'bandpass';
    hammerFilter.frequency.setValueAtTime(Math.min(420, Math.max(180, baseFreq * 0.85)), now);
    hammerFilter.Q.setValueAtTime(1.2, now);

    hammerOsc.type = 'sine';
    hammerOsc.frequency.setValueAtTime(baseFreq * 0.9, now);
    hammerOsc.frequency.exponentialRampToValueAtTime(80, now + 0.02);

    hammerGain.gain.setValueAtTime(velocity * 0.16, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

    hammerOsc.connect(hammerFilter);
    hammerFilter.connect(hammerGain);
    hammerGain.connect(voiceGain);

    hammerOsc.start(now);
    hammerOsc.stop(now + 0.03);

    // =========================================================================
    // 2. MULTI-STRING ACOUSTIC HARMONICS WITH INHARMONICITY & UNISON DETUNING
    // Piano strings are stiff wires, so harmonics are slightly sharp: fn = n * f0 * sqrt(1 + B * n^2)
    // =========================================================================
    const B = 0.00014; // Acoustic piano inharmonicity coefficient
    const getInharmonicFreq = (n: number) => n * baseFreq * Math.sqrt(1 + B * n * n);

    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    // Helper to build a partial with its own gain envelope
    const addPartial = (
      freq: number,
      amp: number,
      decayRatio: number,
      detuneCents: number = 0
    ) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      if (detuneCents !== 0) {
        osc.detune.setValueAtTime(detuneCents, now);
      }

      const initialAmp = Math.max(0.0001, amp * velocity);
      g.gain.setValueAtTime(initialAmp, now);
      const partialDuration = Math.max(0.12, duration * decayRatio);
      g.gain.exponentialRampToValueAtTime(0.0001, now + partialDuration);

      osc.connect(g);
      g.connect(voiceFilter);

      osc.start(now);
      osc.stop(now + partialDuration + 0.05);

      oscs.push(osc);
      gains.push(g);
    };

    // 1st Harmonic (Fundamental): Unison Pair (-0.8 cents and +0.8 cents) for warm, singing body
    const f1 = getInharmonicFreq(1);
    addPartial(f1, 0.52, 1.0, -0.8);
    addPartial(f1, 0.52, 1.0, 0.8);

    // 2nd Harmonic (Octave): Rich acoustic body with subtle unison detune
    const f2 = getInharmonicFreq(2);
    addPartial(f2, 0.28, 0.78, 0.6);
    addPartial(f2, 0.18, 0.74, -0.6);

    // 3rd Harmonic (Fifth): Acoustic chime
    const f3 = getInharmonicFreq(3);
    addPartial(f3, 0.16, 0.52, 0.3);

    // 4th Harmonic (Double Octave): Bell clarity
    const f4 = getInharmonicFreq(4);
    addPartial(f4, 0.08, 0.36, 0);

    // 5th Harmonic (Tierce): Warm presence
    const f5 = getInharmonicFreq(5);
    addPartial(f5, 0.04, 0.24, 0);

    // 6th Harmonic: Initial strike ring
    const f6 = getInharmonicFreq(6);
    addPartial(f6, 0.02, 0.16, 0);

    // Final routing
    voiceFilter.connect(voiceGain);
    voiceGain.connect(panner);
    panner.connect(this.masterGain);

    const stopTime = now + duration + 0.08;

    const stopFn = () => {
      try {
        const t = this.ctx?.currentTime || now;
        voiceGain.gain.cancelScheduledValues(t);
        voiceGain.gain.setValueAtTime(voiceGain.gain.value, t);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
        setTimeout(() => {
          try {
            hammerOsc.stop();
            oscs.forEach((o) => {
              try {
                o.stop();
              } catch {
                // Already stopped
              }
            });
          } catch {
            // Already stopped
          }
        }, 110);
      } catch {
        // Ignored
      }
    };

    this.activeNotes.set(midi, stopFn);
    setTimeout(() => {
      if (this.activeNotes.get(midi) === stopFn) {
        this.activeNotes.delete(midi);
      }
    }, duration * 1000);

    return stopFn;
  }

  /**
   * Play multiple notes as a crisp, solid acoustic piano chord.
   *
   * ALL notes are scheduled synchronously on the exact same audio-clock microsecond.
   * Zero setTimeout jitter, zero rolling delay: every key strikes together simultaneously
   * just like a pianist striking a chord block on a real piano keyboard.
   */
  public playChord(
    midiNotes: number[],
    duration: number = 2.6,
    _staggerMs: number = 0, // Kept for API backwards compatibility, but forced to 0 for tight sync
    velocity: number = 0.85
  ): void {
    if (this.isMuted || midiNotes.length === 0) return;
    this.initContext();
    if (!this.ctx) return;

    // Remove duplicates and sort from bass to treble
    const uniqueNotes = Array.from(new Set(midiNotes)).sort((a, b) => a - b);
    if (uniqueNotes.length === 0) return;

    // Synchronized Web Audio scheduling timestamp (+3ms buffer for atomic frame dispatch)
    const exactStartTime = this.ctx.currentTime + 0.003;

    // Polyphonic Headroom Balancing:
    // When playing chords with 3-5 notes, scale volume smoothly to prevent clipping
    // while keeping the chord punchy, rich, and full-bodied.
    const chordCount = uniqueNotes.length;
    const polyScale = Math.min(1.0, 1.15 / Math.sqrt(Math.max(1, chordCount)));

    uniqueNotes.forEach((midi, index) => {
      // Natural pianist chord voicing:
      // Subtle acoustic accent on the bass note (root foundation) and highest note (melody top)
      const isRoot = index === 0;
      const isTop = index === chordCount - 1;
      const noteVel = velocity * polyScale * (isRoot ? 1.08 : isTop ? 1.04 : 0.94);

      // Play ALL notes at the EXACT SAME exactStartTime!
      this.playNote(midi, duration, noteVel, exactStartTime);
    });
  }

  /**
   * Play full harmonic progression smoothly, with seamless acoustic sustain transitions
   */
  public async playProgression(
    chordMidiList: number[][],
    bpm: number = 76,
    onChordStart?: (index: number) => void
  ): Promise<void> {
    this.initContext();
    // 2 beats per chord
    const chordDurationSeconds = (60 / bpm) * 2;
    const chordDurationMs = chordDurationSeconds * 1000;

    for (let i = 0; i < chordMidiList.length; i++) {
      onChordStart?.(i);
      // Give each chord generous acoustic sustain (1.5x) so chords naturally resonate and ring out into one another like a piano sustain pedal
      this.playChord(chordMidiList[i], chordDurationSeconds * 1.5, 0, 0.85);
      await new Promise((res) => setTimeout(res, chordDurationMs));
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const sound = new AudioEngine();
