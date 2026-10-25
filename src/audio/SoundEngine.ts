import { RadioStation, RadioStationId } from '../types.ts';

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'synthwave',
    name: 'NEON FM',
    frequency: '102.4 FM',
    genre: 'Synthwave / Retrowave',
    description: 'Analog synthesizers, rolling 16th bass, and 80s outrun chords for highway cruising.',
    bpm: 126,
    accentColor: '#06b6d4',
  },
  {
    id: 'darksynth',
    name: 'OVERDRIVE 99.1',
    frequency: '99.1 FM',
    genre: 'Cyberpunk / Darksynth',
    description: 'Heavy industrial kicks, menacing saw stabs, and gritty cyberpunk bass.',
    bpm: 138,
    accentColor: '#ef4444',
  },
  {
    id: 'eurobeat',
    name: 'REDLINE RADIO',
    frequency: '107.9 FM',
    genre: 'Arcade / Eurobeat',
    description: 'Galloping octave bass, high-octane brass hooks, and offbeat hi-hats for maximum speed.',
    bpm: 154,
    accentColor: '#f59e0b',
  },
  {
    id: 'chillwave',
    name: 'HORIZON CHILL',
    frequency: '88.5 FM',
    genre: 'Sunset Lo-Fi / Chillwave',
    description: 'Warm filtered pads, relaxed swing groove, and deep sub-bass for scenic open road sunsets.',
    bpm: 86,
    accentColor: '#10b981',
  },
  {
    id: 'off',
    name: 'RADIO OFF',
    frequency: '--.- FM',
    genre: 'Engine Only',
    description: 'Silence the radio while keeping engine revs, turbo spool, and tire screeches alive.',
    bpm: 0,
    accentColor: '#64748b',
  },
];

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  // Engine synthesizer nodes (with procedural pitch shifting & load modeling)
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSub: OscillatorNode | null = null;
  private engineTurboOsc: OscillatorNode | null = null;
  private engineTurboGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineDistortion: WaveShaperNode | null = null;
  private engineGain: GainNode | null = null;
  private currentEngineLoad: number = 0;
  private lastThrottle: number = 0;
  private lastPopTime: number = 0;

  // Nitro hiss nodes
  private nitroNoise: AudioBufferSourceNode | null = null;
  private nitroGain: GainNode | null = null;

  // Multi-layer Tire screech nodes (asphalt scrub, high-Q squeal, and lateral-force tracking)
  private tireGain: GainNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private tireFilter2: BiquadFilterNode | null = null;
  private lastTireChirpTime: number = 0;

  // Horn nodes
  private hornGain: GainNode | null = null;
  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;

  // Dynamic Radio & Procedural music generator
  private musicInterval: number | null = null;
  private musicStep: number = 0;
  private isMusicPlaying: boolean = false;
  private activeStation: RadioStationId = 'synthwave';
  private isRadioMuted: boolean = false;

  private soundVol: number = 0.8;
  private musicVol: number = 0.5;

  constructor() {
    // AudioContext will be initialized on user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.soundVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.setupEngineSynth();
      this.setupNitroSynth();
      this.setupTireSynth();
      this.setupHornSynth();
    } catch {
      // Audio not supported or blocked
    }
  }

  private makeDistortionCurve(amount: number = 18): Float32Array<ArrayBuffer> {
    const k = typeof amount === 'number' ? amount : 18;
    const n_samples = 44100;
    const buffer = new ArrayBuffer(n_samples * Float32Array.BYTES_PER_ELEMENT);
    const curve = new Float32Array(buffer);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private setupEngineSynth() {
    if (!this.ctx || !this.sfxGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // Primary combustion cylinder firing oscillator
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);

    // Secondary overtone / harmonic stack oscillator
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

    // Sub-bass mechanical crankcase rumble
    this.engineSub = this.ctx.createOscillator();
    this.engineSub.type = 'sine';
    this.engineSub.frequency.setValueAtTime(30, this.ctx.currentTime);

    // Turbocharger spool & high-frequency induction whistle
    this.engineTurboOsc = this.ctx.createOscillator();
    this.engineTurboOsc.type = 'sine';
    this.engineTurboOsc.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.engineTurboGain = this.ctx.createGain();
    this.engineTurboGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.engineTurboOsc.connect(this.engineTurboGain);

    // Dynamic wave-shaping distortion for rich harmonic bark under heavy engine load
    this.engineDistortion = this.ctx.createWaveShaper();
    this.engineDistortion.curve = this.makeDistortionCurve(16);
    this.engineDistortion.oversample = '2x';

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineSub.connect(this.engineFilter);
    this.engineTurboGain.connect(this.engineFilter);

    this.engineFilter.connect(this.engineDistortion);
    this.engineDistortion.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineSub.start();
    this.engineTurboOsc.start();
  }

  private setupNitroSynth() {
    if (!this.ctx || !this.sfxGain) return;

    // Procedural white/pink noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.nitroNoise = this.ctx.createBufferSource();
    this.nitroNoise.buffer = noiseBuffer;
    this.nitroNoise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1200, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.nitroNoise.connect(bandpass);
    bandpass.connect(this.nitroGain);
    this.nitroGain.connect(this.sfxGain);
    this.nitroNoise.start();
  }

  private setupTireSynth() {
    if (!this.ctx || !this.sfxGain) return;

    // Procedural granulated asphalt scrub noise buffer (with micro-stick-slip pulsation)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Modulate noise with subtle 115Hz micro-slip pulsations typical of tire block friction
      const slipMod = 0.7 + 0.3 * Math.sin((i / this.ctx.sampleRate) * 115 * Math.PI * 2);
      output[i] = (Math.random() * 2 - 1) * 0.6 * slipMod;
    }

    const tireNoise = this.ctx.createBufferSource();
    tireNoise.buffer = noiseBuffer;
    tireNoise.loop = true;

    // Dual Formant Tire Filters:
    // 1. High-Q Swept Squeal Formant (1800Hz - 3600Hz)
    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.setValueAtTime(2100, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(4.6, this.ctx.currentTime);

    // 2. Heavy Tire Carcass Scrub / Low-Mid Growl (600Hz - 1100Hz)
    this.tireFilter2 = this.ctx.createBiquadFilter();
    this.tireFilter2.type = 'bandpass';
    this.tireFilter2.frequency.setValueAtTime(780, this.ctx.currentTime);
    this.tireFilter2.Q.setValueAtTime(2.6, this.ctx.currentTime);

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0, this.ctx.currentTime);

    tireNoise.connect(this.tireFilter);
    tireNoise.connect(this.tireFilter2);
    this.tireFilter.connect(this.tireGain);
    this.tireFilter2.connect(this.tireGain);
    this.tireGain.connect(this.sfxGain);
    tireNoise.start();
  }

  private setupHornSynth() {
    if (!this.ctx || !this.sfxGain) return;

    this.hornGain = this.ctx.createGain();
    this.hornGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.hornOsc1 = this.ctx.createOscillator();
    this.hornOsc1.type = 'sawtooth';
    this.hornOsc1.frequency.setValueAtTime(435, this.ctx.currentTime); // Low horn tone

    this.hornOsc2 = this.ctx.createOscillator();
    this.hornOsc2.type = 'sawtooth';
    this.hornOsc2.frequency.setValueAtTime(520, this.ctx.currentTime); // High horn tone

    const hornFilter = this.ctx.createBiquadFilter();
    hornFilter.type = 'lowpass';
    hornFilter.frequency.setValueAtTime(2000, this.ctx.currentTime);

    this.hornOsc1.connect(hornFilter);
    this.hornOsc2.connect(hornFilter);
    hornFilter.connect(this.hornGain);
    this.hornGain.connect(this.sfxGain);

    this.hornOsc1.start();
    this.hornOsc2.start();
  }

  private engineProfile: 'i6_turbo' | 'v12_hybrid' | 'v6_turbo' | 'v8_flatplane' | 'boxer6_na' | 'v8_crossplane' = 'i6_turbo';

  public setEngineProfile(profile: 'i6_turbo' | 'v12_hybrid' | 'v6_turbo' | 'v8_flatplane' | 'boxer6_na' | 'v8_crossplane') {
    this.engineProfile = profile;
  }

  /**
   * PROCEDURAL ENGINE SOUND WITH PITCH SHIFTING BASED ON RPM AND LOAD:
   * Dynamically models cylinder combustion frequency, mechanical load strain,
   * deceleration pitch sag, intake roar, and high-RPM vibrato.
   */
  public updateEngineSound(
    rpm: number,
    throttle: number,
    speedKmh: number,
    engineLoad?: number,
    isNitroActive: boolean = false
  ) {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineGain) return;

    let maxRpm = 8500;
    let baseFreqMin = 38;
    let baseFreqMax = 280;
    let harmonicMult = 1.5;
    let filterQ = 2.5;
    let filterBase = 450;
    let hasTurbo = true;

    if (this.engineProfile === 'boxer6_na') {
      maxRpm = 9200;
      baseFreqMin = 44;
      baseFreqMax = 360;
      harmonicMult = 1.66;
      filterQ = 3.8;
      filterBase = 580;
      hasTurbo = false;
    } else if (this.engineProfile === 'v12_hybrid') {
      maxRpm = 9500;
      baseFreqMin = 50;
      baseFreqMax = 420;
      harmonicMult = 2.0;
      filterQ = 4.2;
      filterBase = 680;
      hasTurbo = false;
    } else if (this.engineProfile === 'v8_crossplane') {
      maxRpm = 7500;
      baseFreqMin = 30;
      baseFreqMax = 240;
      harmonicMult = 1.33;
      filterQ = 2.0;
      filterBase = 380;
      hasTurbo = false;
    } else if (this.engineProfile === 'v8_flatplane') {
      maxRpm = 8800;
      baseFreqMin = 46;
      baseFreqMax = 340;
      harmonicMult = 1.75;
      filterQ = 3.2;
      filterBase = 520;
      hasTurbo = false;
    } else if (this.engineProfile === 'v6_turbo') {
      maxRpm = 8500;
      baseFreqMin = 42;
      baseFreqMax = 310;
      harmonicMult = 1.5;
      filterQ = 2.8;
      filterBase = 490;
      hasTurbo = true;
    }

    const clampedRpm = Math.max(900, Math.min(maxRpm, rpm));
    const rpmRatio = (clampedRpm - 900) / (maxRpm - 900);
    const now = this.ctx.currentTime;

    // Calculate or smooth Engine Load (0.0 = coasting / negative = engine braking / 1.0+ = full torque / nitro)
    let targetLoad = engineLoad !== undefined ? engineLoad : (
      throttle > 0
        ? throttle * (0.55 + 0.45 * Math.min(1.0, clampedRpm / 6000)) + (isNitroActive ? 0.35 : 0)
        : -0.15
    );
    // Smooth load transitions
    this.currentEngineLoad += (targetLoad - this.currentEngineLoad) * 0.15;
    const effLoad = Math.max(-0.3, Math.min(1.4, this.currentEngineLoad));

    // Base fundamental combustion frequency from RPM
    const baseFreq = baseFreqMin + Math.pow(rpmRatio, 1.05) * (baseFreqMax - baseFreqMin);

    // PROCEDURAL PITCH SHIFTING BASED ON LOAD:
    // 1. Positive load pitch stretch: cylinder firing pressures pitch-shift upward by up to +52 cents (+5.2%)
    const loadPitchShift = effLoad > 0 ? (effLoad * 0.052) : 0;

    // 2. Deceleration overrun pitch sag: lifting throttle creates intake vacuum and slight mechanical pitch drop (-24 cents)
    const decelPitchSag = throttle < 0.1 ? (1.0 - throttle) * 0.024 : 0;

    // 3. High-RPM combustion micro-vibrato (visceral mechanical roar near redline)
    const redlineVibrato = clampedRpm > 6800 ? Math.sin(now * 170) * 0.012 : 0;

    // Final pitch-shifted fundamental combustion frequency
    const fundamentalFreq = baseFreq * (1.0 + loadPitchShift - decelPitchSag + redlineVibrato);

    // Harmonic overtone pitch (widens slightly under heavy load)
    const dynamicHarmonic = harmonicMult * (1.0 + Math.max(0, effLoad) * 0.038);
    const overtoneFreq = fundamentalFreq * dynamicHarmonic;

    // Sub-bass crankcase rumble frequency (fundamental / 2)
    const subFreq = fundamentalFreq * 0.5;

    // Apply pitch shifting to primary oscillators
    this.engineOsc1.frequency.setTargetAtTime(fundamentalFreq, now, 0.035);
    this.engineOsc2.frequency.setTargetAtTime(overtoneFreq, now, 0.035);
    if (this.engineSub) {
      this.engineSub.frequency.setTargetAtTime(subFreq, now, 0.035);
    }

    // Turbocharger spool whistler frequency and induction volume
    if (this.engineTurboOsc && this.engineTurboGain) {
      if (hasTurbo || isNitroActive) {
        const turboFreq = 1400 + rpmRatio * 2800 + Math.max(0, effLoad) * 850;
        this.engineTurboOsc.frequency.setTargetAtTime(turboFreq, now, 0.04);
        const turboVol = Math.max(0, Math.min(0.18, effLoad * 0.12 + (isNitroActive ? 0.08 : 0)));
        this.engineTurboGain.gain.setTargetAtTime(turboVol, now, 0.06);
      } else {
        this.engineTurboGain.gain.setTargetAtTime(0, now, 0.08);
      }
    }

    // Dynamic Filter opening based on RPM and Engine Load
    // Under full throttle load, filter sweeps up to 5500Hz with high bite; when off throttle it muffles to low rumble
    const loadFilterBoost = Math.max(0, effLoad) * 3600;
    const filterFreq = filterBase + loadFilterBoost + rpmRatio * 2000 + (speedKmh / 350) * 800;
    const dynamicQ = filterQ + Math.max(0, effLoad) * 1.2;

    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.035);
    this.engineFilter.Q.setTargetAtTime(dynamicQ, now, 0.04);

    // Engine volume scales with load, throttle, and speed
    const engineVol = Math.min(0.72, 0.14 + Math.max(0, effLoad) * 0.36 + rpmRatio * 0.22);
    this.engineGain.gain.setTargetAtTime(engineVol, now, 0.045);

    // Overrun exhaust pops detection on sudden throttle lift from high RPM
    if (this.lastThrottle > 0.75 && throttle < 0.15 && clampedRpm > 4600 && now - this.lastPopTime > 0.4) {
      this.lastPopTime = now;
      this.playExhaustPop();
    }
    this.lastThrottle = throttle;
  }

  /**
   * Procedural exhaust crackle / overrun burble on throttle lift-off.
   */
  public playExhaustPop() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const popCount = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < popCount; i++) {
      const delay = i * (0.07 + Math.random() * 0.05);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 60, now + delay);
      osc.frequency.exponentialRampToValueAtTime(35, now + delay + 0.06);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 400, now + delay);

      gain.gain.setValueAtTime(0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.08);
    }
  }

  public setNitroSound(active: boolean) {
    if (!this.ctx || !this.nitroGain) return;
    const now = this.ctx.currentTime;
    this.nitroGain.gain.setTargetAtTime(active ? 0.4 : 0, now, 0.08);
  }

  /**
   * HIGH-LATERAL-FORCE TIRE PHYSICS & SCREECH ENGINE:
   * Modulates dual formant squeal frequencies and asphalt scrub volume
   * based on measured lateral acceleration (G-forces), drift angles, and high-speed braking.
   */
  public updateTirePhysics(lateralG: number, isDrifting: boolean, isBraking: boolean, speedKmh: number) {
    if (!this.ctx || !this.tireGain || !this.tireFilter || !this.tireFilter2) return;
    const now = this.ctx.currentTime;

    // Lateral force threshold: tires start scrubbing at 0.40g
    const scrubThreshold = 0.40;
    const highGThreshold = 0.75;

    let targetVol = 0;
    let targetFreq1 = 1800; // Primary high-Q squeal
    let targetFreq2 = 750;  // Low-mid carcass scrub

    if (isDrifting) {
      // Full power drift slide
      targetVol = Math.min(0.65, 0.45 + (speedKmh / 350) * 0.2);
      targetFreq1 = 2600 + Math.min(1000, (speedKmh / 200) * 800);
      targetFreq2 = 880 + Math.min(300, (speedKmh / 200) * 200);
    } else if (lateralG >= scrubThreshold && speedKmh > 40) {
      // High-lateral-force turn or sudden lane swerve
      const lateralFactor = Math.min(1.0, (lateralG - scrubThreshold) / (highGThreshold - scrubThreshold));
      targetVol = Math.min(0.55, lateralFactor * 0.48);
      // Pitch shifts up as lateral G force builds
      targetFreq1 = 1800 + lateralFactor * 1200 + (speedKmh / 350) * 400;
      targetFreq2 = 720 + lateralFactor * 320;
    } else if (isBraking && speedKmh > 75) {
      // Emergency high-speed straight-line threshold braking
      targetVol = Math.min(0.4, (speedKmh / 220) * 0.35);
      targetFreq1 = 1700 + (speedKmh / 250) * 500;
      targetFreq2 = 680;
    }

    this.tireGain.gain.setTargetAtTime(targetVol, now, 0.045);
    this.tireFilter.frequency.setTargetAtTime(targetFreq1, now, 0.045);
    this.tireFilter2.frequency.setTargetAtTime(targetFreq2, now, 0.045);
  }

  /**
   * TRANSIENT TIRE CHIRP / BITE SAMPLE:
   * Triggered by sharp lateral force spikes, violent weight transfers,
   * or snapping the vehicle into high-speed evasive maneuvers.
   */
  public playTireChirp(intensity: number = 1.0) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Throttled to prevent overlapping artifacts
    if (now - this.lastTireChirpTime < 0.16) return;
    this.lastTireChirpTime = now;

    // Transient resonant chirp tone
    const chirpOsc = this.ctx.createOscillator();
    const chirpGain = this.ctx.createGain();
    const chirpFilter = this.ctx.createBiquadFilter();

    chirpOsc.type = 'sawtooth';
    const startFreq = 2900 + Math.random() * 300;
    const endFreq = 1850 + Math.random() * 200;
    chirpOsc.frequency.setValueAtTime(startFreq, now);
    chirpOsc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.075);

    chirpFilter.type = 'bandpass';
    chirpFilter.frequency.setValueAtTime(startFreq * 0.95, now);
    chirpFilter.frequency.exponentialRampToValueAtTime(endFreq * 0.95, now + 0.075);
    chirpFilter.Q.setValueAtTime(5.5, now);

    const chirpVol = Math.min(0.42, 0.22 * Math.max(0.5, intensity));
    chirpGain.gain.setValueAtTime(chirpVol, now);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    chirpOsc.connect(chirpFilter);
    chirpFilter.connect(chirpGain);
    chirpGain.connect(this.sfxGain);

    chirpOsc.start(now);
    chirpOsc.stop(now + 0.085);

    // Layered high-frequency friction snap burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.07);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const snapSource = this.ctx.createBufferSource();
    snapSource.buffer = noiseBuffer;

    const snapFilter = this.ctx.createBiquadFilter();
    snapFilter.type = 'highpass';
    snapFilter.frequency.setValueAtTime(2400, now);

    const snapGain = this.ctx.createGain();
    snapGain.gain.setValueAtTime(0.25 * intensity, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    snapSource.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(this.sfxGain);
    snapSource.start(now);
  }

  // Backward-compatible alias
  public setTireScreech(active: boolean, intensity: number = 1.0) {
    this.updateTirePhysics(active ? 0.9 * intensity : 0, active, false, 150);
  }

  public setHorn(active: boolean) {
    if (!this.ctx || !this.hornGain) return;
    const now = this.ctx.currentTime;
    this.hornGain.gain.setTargetAtTime(active ? 0.35 : 0, now, 0.03);
  }

  public playGearShift() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Quick exhaust pop / blow-off valve
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playCrash() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Low boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.4);
    subGain.gain.setValueAtTime(0.8, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.45);

    // Crunch noise
    const bufferSize = this.ctx.sampleRate * 0.4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(600, now);
    noiseFilter.Q.setValueAtTime(1.5, now);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.linearRampToValueAtTime(0.01, now + 0.4);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
  }

  public playNearMiss() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // High velocity whoosh chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playCoin() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  private lastProximitySoundTime = 0;

  public playProximityWarning() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    if (now - this.lastProximitySoundTime < 1.4) return; // Prevent sound spamming
    this.lastProximitySoundTime = now;

    // High-tech sonar / proximity radar alert ping
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.setValueAtTime(880, now + 0.06);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  /**
   * Triumphant AAA Racing Victory Fanfare:
   * Multi-part brass arpeggio, sparkling victory chime chords, and celebratory resonance.
   */
  public playVictoryFanfare() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Fanfare Notes: Eb4, G4, Bb4, Eb5, G5
    const notes = [
      { freq: 311.13, delay: 0.0, dur: 0.35 },  // Eb4
      { freq: 392.00, delay: 0.16, dur: 0.35 }, // G4
      { freq: 466.16, delay: 0.32, dur: 0.4 },  // Bb4
      { freq: 622.25, delay: 0.50, dur: 1.4 },  // Eb5 (Sustained victory hero note)
      { freq: 783.99, delay: 0.50, dur: 1.4 },  // G5 (Harmony)
    ];

    notes.forEach(({ freq, delay, dur }) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + delay);

      // Warm brass low-pass filter with envelope swell
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now + delay);
      filter.frequency.exponentialRampToValueAtTime(3200, now + delay + 0.08);
      filter.frequency.exponentialRampToValueAtTime(1800, now + delay + dur);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(0.28, now + delay + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + delay);
      osc.stop(now + delay + dur);
    });

    // Celebratory Shimmer / Cymbal Crash Wash
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.9);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.setValueAtTime(3500, now + 0.5);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.2, now + 0.5);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(now + 0.5);
  }

  /**
   * Milestone Achievement Unlock Audio:
   * Ascending crystal chime arpeggio (C5 -> E5 -> G5 -> C6) with warm sub thump and harmonic shimmer.
   */
  public playAchievementUnlocked() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const chimeNotes = [
      { freq: 523.25, time: 0.0, dur: 0.28 },
      { freq: 659.25, time: 0.08, dur: 0.28 },
      { freq: 783.99, time: 0.16, dur: 0.35 },
      { freq: 1046.5, time: 0.26, dur: 0.8 },
      { freq: 1318.51, time: 0.28, dur: 0.7 },
    ];

    chimeNotes.forEach(({ freq, time, dur }) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.2, now + time);
      filter.Q.setValueAtTime(2.5, now + time);

      gain.gain.setValueAtTime(0.32, now + time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    // Sub Bass Warm Thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(55, now + 0.3);
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.35);
  }


  /**
   * Generates a short noise burst for snares and hi-hats.
   */
  private playNoiseBurst(t: number, duration: number, filterType: BiquadFilterType, freq: number, q: number, gainVol: number) {
    if (!this.ctx || !this.musicGain) return;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freq, t);
    filter.Q.setValueAtTime(q, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(t);
    noise.stop(t + duration);
  }

  /**
   * Dynamic procedural radio station soundtrack sequencer.
   * Synthesizes distinct genres: Neon Synthwave, Cyberpunk Darksynth, Redline Eurobeat, and Horizon Chill.
   */
  public startMusic() {
    if (this.isMusicPlaying || !this.ctx || !this.musicGain) return;
    if (this.activeStation === 'off') {
      this.isMusicPlaying = false;
      this.applyMusicGain();
      return;
    }

    this.isMusicPlaying = true;
    this.musicStep = 0;
    this.applyMusicGain();

    const stationInfo = this.getRadioStationInfo();
    const tempo = stationInfo.bpm || 126;
    const stepDurationMs = (60 / tempo / 4) * 1000; // 16th notes

    // Musical data per genre
    const synthBassNotes = [55, 55, 55, 65.4, 55, 55, 73.4, 82.4]; // A1, C2, D2, E2
    const synthLeadNotes = [220, 261.6, 329.6, 392, 440, 523.2, 659.2]; // A minor pentatonic

    const darkBassNotes = [36.7, 73.4, 36.7, 43.6, 36.7, 49.0, 36.7, 65.4]; // D1, D2, F1, G1
    const darkStabChords = [
      [146.8, 174.6, 220],     // Dm
      [130.8, 164.8, 196],     // C
      [116.5, 146.8, 174.6],   // Bb
      [110.0, 138.6, 164.8],   // A
    ];

    const eurobeatLeadRiff = [659.25, 493.88, 523.25, 587.33, 659.25, 783.99, 739.99, 659.25]; // E5, B4, C5, D5, E5, G5, F#5, E5
    const eurobeatBassRoots = [41.2, 41.2, 32.7, 36.7]; // E1, E1, C1, D1

    const chillChords = [
      [174.6, 220, 261.6, 329.6], // Fmaj7
      [196, 246.9, 293.6, 349.2], // G7
      [164.8, 196, 246.9, 293.6], // Em7
      [220, 261.6, 329.6, 392],   // Am7
    ];
    const chillBassNotes = [43.65, 49.0, 41.2, 55.0]; // F1, G1, E1, A1

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
      const t = this.ctx.currentTime;
      const step16 = this.musicStep % 16;
      const step32 = this.musicStep % 32;

      // ==========================================
      // STATION 1: SYNTHWAVE (NEON FM 102.4)
      // ==========================================
      if (this.activeStation === 'synthwave') {
        // Kick on 0, 4, 8, 12
        if (step16 % 4 === 0) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.frequency.setValueAtTime(140, t);
          kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.09);
          kickGain.gain.setValueAtTime(0.42, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          kickOsc.connect(kickGain);
          kickGain.connect(this.musicGain);
          kickOsc.start(t);
          kickOsc.stop(t + 0.13);
        }

        // Snare on 4 and 12
        if (step16 === 4 || step16 === 12) {
          const snareOsc = this.ctx.createOscillator();
          const snareGain = this.ctx.createGain();
          snareOsc.type = 'triangle';
          snareOsc.frequency.setValueAtTime(210, t);
          snareGain.gain.setValueAtTime(0.2, t);
          snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          snareOsc.connect(snareGain);
          snareGain.connect(this.musicGain);
          snareOsc.start(t);
          snareOsc.stop(t + 0.15);
          this.playNoiseBurst(t, 0.14, 'bandpass', 1200, 1.2, 0.16);
        }

        // Closed Hi-Hat on odd 16ths
        if (step16 % 2 === 1) {
          this.playNoiseBurst(t, 0.04, 'highpass', 7000, 2.0, 0.06);
        }

        // Rolling synth bassline on every other 16th
        if (step16 % 2 === 0) {
          const note = synthBassNotes[(this.musicStep >> 1) % synthBassNotes.length];
          const bassOsc = this.ctx.createOscillator();
          const bassFilter = this.ctx.createBiquadFilter();
          const bassGain = this.ctx.createGain();

          bassOsc.type = 'sawtooth';
          bassOsc.frequency.setValueAtTime(note, t);
          bassFilter.type = 'lowpass';
          bassFilter.frequency.setValueAtTime(340, t);
          bassFilter.frequency.exponentialRampToValueAtTime(110, t + 0.11);
          bassGain.gain.setValueAtTime(0.24, t);
          bassGain.gain.linearRampToValueAtTime(0.001, t + 0.13);

          bassOsc.connect(bassFilter);
          bassFilter.connect(bassGain);
          bassGain.connect(this.musicGain);
          bassOsc.start(t);
          bassOsc.stop(t + 0.14);
        }

        // Synth arpeggio
        if (step16 % 2 === 1 && Math.random() > 0.25) {
          const leadNote = synthLeadNotes[Math.floor((step32 / 2) % synthLeadNotes.length)];
          const leadOsc = this.ctx.createOscillator();
          const leadGain = this.ctx.createGain();
          leadOsc.type = 'square';
          leadOsc.frequency.setValueAtTime(leadNote, t);
          leadGain.gain.setValueAtTime(0.07, t);
          leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          leadOsc.connect(leadGain);
          leadGain.connect(this.musicGain);
          leadOsc.start(t);
          leadOsc.stop(t + 0.17);
        }
      }

      // ==========================================
      // STATION 2: DARKSYNTH (OVERDRIVE 99.1)
      // ==========================================
      else if (this.activeStation === 'darksynth') {
        // Heavy industrial punch kick on 0, 4, 8, 12 and syncopated 14
        if (step16 % 4 === 0 || step16 === 14) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.frequency.setValueAtTime(175, t);
          kickOsc.frequency.exponentialRampToValueAtTime(28, t + 0.1);
          kickGain.gain.setValueAtTime(step16 === 14 ? 0.35 : 0.48, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
          kickOsc.connect(kickGain);
          kickGain.connect(this.musicGain);
          kickOsc.start(t);
          kickOsc.stop(t + 0.14);
        }

        // Industrial noise snare on 4 and 12
        if (step16 === 4 || step16 === 12) {
          this.playNoiseBurst(t, 0.18, 'bandpass', 950, 1.8, 0.28);
          const bodyOsc = this.ctx.createOscillator();
          const bodyGain = this.ctx.createGain();
          bodyOsc.type = 'sawtooth';
          bodyOsc.frequency.setValueAtTime(160, t);
          bodyGain.gain.setValueAtTime(0.18, t);
          bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          bodyOsc.connect(bodyGain);
          bodyGain.connect(this.musicGain);
          bodyOsc.start(t);
          bodyOsc.stop(t + 0.13);
        }

        // Rapid 16th industrial hi-hats with accent
        this.playNoiseBurst(t, 0.035, 'highpass', 6500, 2.5, step16 % 2 === 0 ? 0.08 : 0.04);

        // Menacing gritty 16th bassline
        const bassNote = darkBassNotes[step16 % darkBassNotes.length];
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassNote, t);
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(step16 % 4 === 0 ? 550 : 280, t);
        bassFilter.frequency.exponentialRampToValueAtTime(90, t + 0.09);
        bassFilter.Q.setValueAtTime(3.5, t);
        bassGain.gain.setValueAtTime(0.28, t);
        bassGain.gain.linearRampToValueAtTime(0.001, t + 0.1);
        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start(t);
        bassOsc.stop(t + 0.11);

        // Cyberpunk saw chord stabs on syncopated steps (0, 3, 6, 10)
        if (step16 === 0 || step16 === 3 || step16 === 6 || step16 === 10) {
          const chordIndex = Math.floor(step32 / 8) % darkStabChords.length;
          const chord = darkStabChords[chordIndex];
          chord.forEach((freq) => {
            const stabOsc = this.ctx!.createOscillator();
            const stabGain = this.ctx!.createGain();
            stabOsc.type = 'sawtooth';
            stabOsc.frequency.setValueAtTime(freq * 2, t);
            stabGain.gain.setValueAtTime(0.05, t);
            stabGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            stabOsc.connect(stabGain);
            stabGain.connect(this.musicGain!);
            stabOsc.start(t);
            stabOsc.stop(t + 0.16);
          });
        }
      }

      // ==========================================
      // STATION 3: EUROBEAT (REDLINE RADIO 107.9)
      // ==========================================
      else if (this.activeStation === 'eurobeat') {
        // High-energy 4-on-the-floor kick
        if (step16 % 4 === 0) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.frequency.setValueAtTime(155, t);
          kickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
          kickGain.gain.setValueAtTime(0.46, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
          kickOsc.connect(kickGain);
          kickGain.connect(this.musicGain);
          kickOsc.start(t);
          kickOsc.stop(t + 0.12);
        }

        // Off-beat open hi-hat on every odd 8th (steps 2, 6, 10, 14)
        if (step16 % 4 === 2) {
          this.playNoiseBurst(t, 0.1, 'highpass', 8500, 3.0, 0.14);
        } else if (step16 % 2 === 1) {
          // Soft closed hi-hat on 16ths
          this.playNoiseBurst(t, 0.03, 'highpass', 9000, 2.0, 0.05);
        }

        // Snappy snare on 4 and 12, plus fill on 14, 15 at end of 32-step phrase
        const isSnareHit = step16 === 4 || step16 === 12 || (step32 >= 30);
        if (isSnareHit) {
          const snareOsc = this.ctx.createOscillator();
          const snareGain = this.ctx.createGain();
          snareOsc.type = 'triangle';
          snareOsc.frequency.setValueAtTime(240, t);
          snareGain.gain.setValueAtTime(0.24, t);
          snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          snareOsc.connect(snareGain);
          snareGain.connect(this.musicGain);
          snareOsc.start(t);
          snareOsc.stop(t + 0.13);
          this.playNoiseBurst(t, 0.12, 'bandpass', 1600, 1.4, 0.22);
        }

        // Galloping Eurobeat bass: octave jumping on every 16th note
        const rootBase = eurobeatBassRoots[Math.floor(step32 / 8) % eurobeatBassRoots.length];
        const octaveMult = (step16 % 2 === 1) ? 2 : 1;
        const euroBassOsc = this.ctx.createOscillator();
        const euroBassFilter = this.ctx.createBiquadFilter();
        const euroBassGain = this.ctx.createGain();

        euroBassOsc.type = 'sawtooth';
        euroBassOsc.frequency.setValueAtTime(rootBase * octaveMult, t);
        euroBassFilter.type = 'lowpass';
        euroBassFilter.frequency.setValueAtTime(420, t);
        euroBassFilter.frequency.exponentialRampToValueAtTime(140, t + 0.08);
        euroBassGain.gain.setValueAtTime(0.27, t);
        euroBassGain.gain.linearRampToValueAtTime(0.001, t + 0.09);

        euroBassOsc.connect(euroBassFilter);
        euroBassFilter.connect(euroBassGain);
        euroBassGain.connect(this.musicGain);
        euroBassOsc.start(t);
        euroBassOsc.stop(t + 0.1);

        // Soaring Eurobeat supersaw brass hook on 8th notes
        if (step16 % 2 === 0) {
          const noteIndex = Math.floor(step16 / 2) % eurobeatLeadRiff.length;
          const leadFreq = eurobeatLeadRiff[noteIndex];

          // Twin detuned oscillators for authentic Eurobeat synth brass sound
          [-4, 4].forEach((detune) => {
            const leadOsc = this.ctx!.createOscillator();
            const leadGain = this.ctx!.createGain();
            leadOsc.type = 'sawtooth';
            leadOsc.frequency.setValueAtTime(leadFreq, t);
            leadOsc.detune.setValueAtTime(detune, t);
            leadGain.gain.setValueAtTime(0.045, t);
            leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
            leadOsc.connect(leadGain);
            leadGain.connect(this.musicGain!);
            leadOsc.start(t);
            leadOsc.stop(t + 0.17);
          });
        }
      }

      // ==========================================
      // STATION 4: CHILLWAVE (HORIZON CHILL 88.5)
      // ==========================================
      else if (this.activeStation === 'chillwave') {
        // Soft round lo-fi kick on steps 0 and 10
        if (step16 === 0 || step16 === 10) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.frequency.setValueAtTime(95, t);
          kickOsc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
          kickGain.gain.setValueAtTime(0.35, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          kickOsc.connect(kickGain);
          kickGain.connect(this.musicGain);
          kickOsc.start(t);
          kickOsc.stop(t + 0.19);
        }

        // Soft rim/snap on step 8 and 24
        if (step16 === 8) {
          const rimOsc = this.ctx.createOscillator();
          const rimGain = this.ctx.createGain();
          rimOsc.type = 'triangle';
          rimOsc.frequency.setValueAtTime(320, t);
          rimGain.gain.setValueAtTime(0.12, t);
          rimGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
          rimOsc.connect(rimGain);
          rimGain.connect(this.musicGain);
          rimOsc.start(t);
          rimOsc.stop(t + 0.09);
          this.playNoiseBurst(t, 0.08, 'bandpass', 2400, 2.0, 0.09);
        }

        // Gentle lo-fi shaker on even steps
        if (step16 % 2 === 0) {
          this.playNoiseBurst(t, 0.05, 'highpass', 6000, 1.5, 0.035);
        }

        // Warm sub-bass note sustained every 8 steps
        if (step16 % 8 === 0) {
          const chordIndex = Math.floor(step32 / 8) % chillBassNotes.length;
          const bassFreq = chillBassNotes[chordIndex];
          const subOsc = this.ctx.createOscillator();
          const subGain = this.ctx.createGain();
          subOsc.type = 'sine';
          subOsc.frequency.setValueAtTime(bassFreq, t);
          subGain.gain.setValueAtTime(0.28, t);
          subGain.gain.linearRampToValueAtTime(0.001, t + 0.5);
          subOsc.connect(subGain);
          subGain.connect(this.musicGain);
          subOsc.start(t);
          subOsc.stop(t + 0.52);
        }

        // Dreamy 7th chord swells on steps 0, 4, 8, 12
        if (step16 % 4 === 0) {
          const chordIndex = Math.floor(step32 / 8) % chillChords.length;
          const chord = chillChords[chordIndex];
          chord.forEach((freq) => {
            const padOsc = this.ctx!.createOscillator();
            const padFilter = this.ctx!.createBiquadFilter();
            const padGain = this.ctx!.createGain();

            padOsc.type = 'triangle';
            padOsc.frequency.setValueAtTime(freq, t);
            padFilter.type = 'lowpass';
            padFilter.frequency.setValueAtTime(480, t);

            padGain.gain.setValueAtTime(0.001, t);
            padGain.gain.linearRampToValueAtTime(0.035, t + 0.08);
            padGain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

            padOsc.connect(padFilter);
            padFilter.connect(padGain);
            padGain.connect(this.musicGain!);
            padOsc.start(t);
            padOsc.stop(t + 0.45);
          });
        }
      }

      this.musicStep++;
    }, stepDurationMs);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public stopAll() {
    this.stopMusic();
    if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    if (this.nitroGain) this.nitroGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    if (this.tireGain) this.tireGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    if (this.hornGain) this.hornGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
  }

  /**
   * Updates music gain taking into account master mute, independent radio mute, and station status.
   */
  private applyMusicGain() {
    if (!this.musicGain || !this.ctx) return;
    const shouldSilence = this.isMuted || this.isRadioMuted || this.activeStation === 'off';
    const targetGain = shouldSilence ? 0.0001 : this.musicVol;
    this.musicGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1.0, this.ctx.currentTime);
    }
  }

  public setSoundVolume(vol: number) {
    this.soundVol = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.soundVol, this.ctx.currentTime);
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVol = Math.max(0, Math.min(1, vol));
    this.applyMusicGain();
  }

  public setRadioMuted(muted: boolean) {
    this.isRadioMuted = muted;
    this.applyMusicGain();
  }

  public isRadioMutedState(): boolean {
    return this.isRadioMuted;
  }

  public setRadioStation(stationId: RadioStationId) {
    if (this.activeStation === stationId) return;
    this.activeStation = stationId;

    if (this.isMusicPlaying) {
      this.stopMusic();
      if (stationId !== 'off') {
        this.startMusic();
      }
    }
    this.applyMusicGain();
  }

  public getActiveStation(): RadioStationId {
    return this.activeStation;
  }

  public getRadioStationInfo(id?: RadioStationId): RadioStation {
    const targetId = id || this.activeStation;
    return RADIO_STATIONS.find((s) => s.id === targetId) || RADIO_STATIONS[0];
  }

  /**
   * Cycles to the next radio station in the catalog and restarts playback if active.
   */
  public cycleRadioStation(): RadioStation {
    const currentIndex = RADIO_STATIONS.findIndex((s) => s.id === this.activeStation);
    const nextIndex = (currentIndex + 1) % RADIO_STATIONS.length;
    const nextStation = RADIO_STATIONS[nextIndex];
    this.setRadioStation(nextStation.id);
    return nextStation;
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const soundManager = new SoundEngine();
