/**
 * Horror Audio Manager
 * - "the illuminato": continuous background music loop
 * - "sonido de foco": lower volume ambient electrical hum synchronized with ceiling light flicker
 * - "sonido de puerta": random heavy door knocks ("golpes en la puerta") when "el pibe" is near the door
 * - Integrates Web Audio API, AnalyserNode for reactive HUD audio metrics, and spatial audio effects.
 */

import { AudioMetrics } from '../types/game';

class HorrorAudioManager {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;

  // Background Music ("the illuminato")
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmVolume: number = 0.95;
  private isBgmPlaying: boolean = false;

  // Ceiling Light Bulb Sound ("sonido de foco")
  private focoAudio: HTMLAudioElement | null = null;
  private focoGain: GainNode | null = null;
  private focoSynthOsc: OscillatorNode | null = null;
  private focoSynthGain: GainNode | null = null;

  // Door Knocks Sound ("sonido de puerta / golpes")
  private doorBuffer: AudioBuffer | null = null;

  // Sink Baby Cry Positional Audio ("LLANTO ATERRADOR - llanto.wav")
  private cryBuffer: AudioBuffer | null = null;
  private crySource: AudioBufferSourceNode | null = null;
  private cryGain: GainNode | null = null;
  private cryPanner: StereoPannerNode | null = null;
  private isCryPlaying: boolean = false;
  private bathroomCryAudio: HTMLAudioElement | null = null;

  // Procedural tension elements
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private fridgeGain: GainNode | null = null;
  private fridgeOsc: OscillatorNode | null = null;
  private heartbeatTimer: number | null = null;
  private isMuted: boolean = false;

  // Microphone
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;

  // Visualizer metrics buffers
  private freqData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;

  // Door knock listeners (e.g. for visual door rumble / camera jolt)
  private knockListeners: Array<() => void> = [];

  constructor() {
    // Setup gesture listener to unblock audio on first interaction
    this.setupGestureUnlock();
  }

  private setupGestureUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.resume();
      if (!this.isBgmPlaying && !this.isMuted) {
        this.startBackgroundMusic();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  public init(): boolean {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.startBackgroundMusic();
      this.startCeilingFocoSound();
      return true;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

      // Analyser Node for reactive UI visualizers
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.frequencyBinCount);

      // Setup Foco Synth Gain
      this.focoGain = this.ctx.createGain();
      this.focoGain.gain.setValueAtTime(0.10, this.ctx.currentTime);
      this.focoGain.connect(this.masterGain);

      // Preload door knock audio buffer
      this.loadDoorBuffer();

      // Preload sink baby weeping audio buffer for 3D positional audio
      this.loadCryBuffer();

      // Start "the illuminato" background loop directly
      this.startBackgroundMusic();

      // Start "sonido de foco" synchronized with ceiling light
      this.startCeilingFocoSound();

      // Start subtle atmospheric ambient synth layers
      this.startAmbientDrone();
      this.startFridgeHum();

      return true;
    } catch (err) {
      console.warn('AudioContext failed to initialize:', err);
      this.startBackgroundMusic();
      this.startCeilingFocoSound();
      return false;
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.isCryPlaying && this.cryBuffer) {
      this.startSinkCryLoop();
    }
    if (this.bgmAudio && this.bgmAudio.paused && !this.isMuted) {
      this.bgmAudio.play().catch(() => {});
    }
    if (this.focoAudio && this.focoAudio.paused && !this.isMuted) {
      this.focoAudio.play().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.75, this.ctx.currentTime, 0.1);
    }
    if (this.bgmAudio) {
      this.bgmAudio.volume = muted ? 0 : this.bgmVolume;
      if (muted) {
        this.bgmAudio.pause();
      } else {
        this.bgmAudio.play().catch(() => {});
      }
    }
    if (this.focoAudio) {
      this.focoAudio.volume = muted ? 0 : 0.025;
      if (muted) {
        this.focoAudio.pause();
      } else {
        this.focoAudio.play().catch(() => {});
      }
    }
    if (this.bathroomCryAudio) {
      if (muted) {
        this.bathroomCryAudio.volume = 0;
        this.bathroomCryAudio.pause();
      }
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsBgmPlaying(): boolean {
    return this.isBgmPlaying;
  }

  /**
   * Preload door knock buffer for zero-latency audio
   */
  private async loadDoorBuffer() {
    if (!this.ctx) return;
    try {
      const resp = await fetch('/audio/golpes_puerta.mp3');
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        if (this.ctx) {
          this.doorBuffer = await this.ctx.decodeAudioData(arrayBuf);
        }
      }
    } catch {
      // Procedural fallback available
    }
  }

  /**
   * Start "the illuminato" background music in a continuous seamless loop
   */
  public startBackgroundMusic() {
    if (this.isMuted) return;

    if (!this.bgmAudio) {
      // Use clean standard HTML5 Audio element without CORS-hijacking createMediaElementSource
      this.bgmAudio = new Audio('/audio/the_illuminato.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this.bgmVolume;
      this.bgmAudio.preload = 'auto';

      this.bgmAudio.addEventListener('play', () => {
        this.isBgmPlaying = true;
      });
      this.bgmAudio.addEventListener('pause', () => {
        this.isBgmPlaying = false;
      });
      this.bgmAudio.addEventListener('error', (e) => {
        console.warn('the_illuminato.wav error, switching to illuminato.wav:', e);
        if (this.bgmAudio) {
          this.bgmAudio.src = '/audio/illuminato.wav';
          this.bgmAudio.play().catch(() => {});
        }
      });
    }

    const p = this.bgmAudio.play();
    if (p !== undefined) {
      p.then(() => {
        this.isBgmPlaying = true;
      }).catch((err) => {
        console.warn('Autoplay waiting for user gesture to play BGM:', err);
      });
    }
  }

  /**
   * Start "sonido de foco" - Lower volume electrical hum synchronized with ceiling light
   * Strictly calibrated at very low levels (0.006 - 0.014) to eliminate harsh static or hiss
   */
  public startCeilingFocoSound() {
    if (!this.focoAudio) {
      this.focoAudio = new Audio('/audio/sonido_foco.wav');
      this.focoAudio.loop = true;
      this.focoAudio.volume = this.isMuted ? 0 : 0.008; // Muy suave, sin estática molesta
      this.focoAudio.preload = 'auto';

      this.focoAudio.addEventListener('error', () => {
        if (this.focoAudio) {
          this.focoAudio.src = '/audio/foco.wav';
          this.focoAudio.play().catch(() => {});
        }
      });
    }

    this.focoAudio.play().catch(() => {});
  }

  /**
   * Synchronize "sonido de foco" with ceiling light flicker
   * Soft volume modulation without any harsh static or clicks
   */
  public syncCeilingLight(lightIntensity: number, isFlickerDip: boolean) {
    // Very subtle, quiet background hum: 0.005 to 0.014 max
    const targetVol = this.isMuted
      ? 0
      : isFlickerDip
      ? 0.014
      : 0.006 * Math.max(0.2, Math.min(1.0, lightIntensity));

    if (this.focoAudio) {
      this.focoAudio.volume = Math.max(0, Math.min(1, targetVol));
    }

    if (this.ctx && this.focoGain && !this.isMuted) {
      const now = this.ctx.currentTime;
      this.focoGain.gain.setTargetAtTime(targetVol, now, 0.05);
    }
  }

  /**
   * Preload baby weeping audio buffer for 3D positional audio
   */
  private async loadCryBuffer() {
    if (!this.ctx) return;
    try {
      const resp = await fetch('/audio/llanto.wav');
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        if (this.ctx) {
          this.cryBuffer = await this.ctx.decodeAudioData(arrayBuf);
          this.startSinkCryLoop();
        }
      }
    } catch (e) {
      console.warn('Could not decode llanto.wav buffer, using HTMLAudioElement fallback:', e);
    }
  }

  /**
   * Start continuous sink crying audio loop via Web Audio API with StereoPanner
   */
  private startSinkCryLoop() {
    if (!this.ctx || !this.cryBuffer || this.isCryPlaying) return;

    try {
      this.crySource = this.ctx.createBufferSource();
      this.crySource.buffer = this.cryBuffer;
      this.crySource.loop = true;

      this.cryGain = this.ctx.createGain();
      this.cryGain.gain.setValueAtTime(0, this.ctx.currentTime);

      if (this.ctx.createStereoPanner) {
        this.cryPanner = this.ctx.createStereoPanner();
        this.cryPanner.pan.setValueAtTime(0, this.ctx.currentTime);
        this.crySource.connect(this.cryPanner);
        this.cryPanner.connect(this.cryGain);
      } else {
        this.crySource.connect(this.cryGain);
      }

      this.cryGain.connect(this.masterGain || this.ctx.destination);
      this.crySource.start(0);
      this.isCryPlaying = true;
    } catch (err) {
      console.warn('Failed to start Web Audio sink cry loop:', err);
    }
  }

  /**
   * Modulate baby weeping audio specifically emanating from the Silent Hill Sink
   * @param distToSink Distance in meters from player camera to the sink
   * @param pan Horizontal audio panning (-1.0 left, 0 center, +1.0 right) based on player look angle
   * @param isDoorOpen Whether bathroom door is open or closed
   */
  public updateSinkCryAudio(distToSink: number, pan: number = 0, isDoorOpen: boolean = false) {
    if (this.isMuted) {
      if (this.cryGain && this.ctx) {
        this.cryGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      if (this.bathroomCryAudio) {
        this.bathroomCryAudio.volume = 0;
      }
      return;
    }

    // Distance attenuation from the sink:
    // Right at sink (< 1.5m): loudest and clearest (0.85)
    // In bathroom (1.5m - 4.5m): 0.50 - 0.75
    // Near bathroom entrance (4.5m - 7.5m): 0.20 - 0.45
    // Across main room (> 7.5m): faint creepy murmur (0.02 - 0.15)
    let baseVolume = 0;
    if (distToSink < 1.5) {
      baseVolume = 0.85;
    } else if (distToSink < 4.5) {
      const t = (distToSink - 1.5) / 3.0;
      baseVolume = 0.85 - t * 0.35; // 0.85 -> 0.50
    } else if (distToSink < 8.0) {
      const t = (distToSink - 4.5) / 3.5;
      baseVolume = 0.50 - t * 0.32; // 0.50 -> 0.18
    } else if (distToSink < 13.0) {
      const t = (distToSink - 8.0) / 5.0;
      baseVolume = 0.18 - t * 0.15; // 0.18 -> 0.03
    } else {
      baseVolume = 0.02;
    }

    // If door is closed/locked and player is outside, muffle the sound
    if (!isDoorOpen && distToSink > 3.8) {
      baseVolume *= 0.40;
    }

    // 1. Web Audio API with real-time 3D stereo panning
    if (this.ctx && this.cryGain && this.isCryPlaying) {
      const now = this.ctx.currentTime;
      this.cryGain.gain.setTargetAtTime(baseVolume, now, 0.08);
      if (this.cryPanner) {
        this.cryPanner.pan.setTargetAtTime(pan, now, 0.06);
      }
    } else {
      // 2. HTMLAudioElement Fallback
      if (!this.bathroomCryAudio) {
        this.bathroomCryAudio = new Audio('/audio/llanto.wav');
        this.bathroomCryAudio.loop = true;
        this.bathroomCryAudio.volume = 0;
        this.bathroomCryAudio.preload = 'auto';
        this.bathroomCryAudio.play().catch(() => {});
      }
      this.bathroomCryAudio.volume = Math.max(0, Math.min(1, baseVolume));
      if (this.bathroomCryAudio.paused) {
        this.bathroomCryAudio.play().catch(() => {});
      }
    }
  }

  /**
   * Backwards compatibility helper
   */
  public updateBathroomDistance(distanceToBathroom: number) {
    this.updateSinkCryAudio(distanceToBathroom, 0, true);
  }

  /**
   * Play heavy wooden door knocks ("golpes en la puerta")
   * Called randomly when "el pibe" is near the door
   * @param volumeFactor 0.0 to 1.0 (scales with proximity to door)
   */
  public playDoorKnocks(volumeFactor: number = 0.85) {
    if (this.isMuted) return;
    this.resume();

    // Trigger registered UI & camera shake listeners asynchronously
    this.knockListeners.forEach((fn) => {
      try {
        setTimeout(fn, 0);
      } catch {
        // Ignore
      }
    });

    // Play dedicated Audio instance for overlapping distinct knocks
    try {
      const knockAudio = new Audio('/audio/golpes_puerta.mp3');
      knockAudio.volume = Math.max(0.25, Math.min(1.0, volumeFactor * 0.95));
      const p = knockAudio.play();
      if (p !== undefined) {
        p.catch(() => {
          this.playDoorKnockBuffer(volumeFactor);
        });
      }
    } catch {
      this.playDoorKnockBuffer(volumeFactor);
    }
  }

  private playDoorKnockBuffer(volumeFactor: number) {
    if (this.ctx && this.masterGain && this.doorBuffer) {
      try {
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        src.buffer = this.doorBuffer;
        src.playbackRate.setValueAtTime(0.96 + Math.random() * 0.08, this.ctx.currentTime);
        gain.gain.setValueAtTime(Math.max(0.2, volumeFactor * 0.85), this.ctx.currentTime);
        src.connect(gain);
        gain.connect(this.masterGain);
        src.start(0);
        return;
      } catch {
        // Procedural fallback
      }
    }
    this.synthesizeDoorKnocks(volumeFactor);
  }

  /**
   * Procedural door knock fallback (4 rapid wooden thuds)
   */
  private synthesizeDoorKnocks(volumeFactor: number) {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const knockTimes = [0.0, 0.38, 0.74, 1.12];

    knockTimes.forEach((delay, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const hitTime = now + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110 + idx * 5, hitTime);
      osc.frequency.exponentialRampToValueAtTime(38, hitTime + 0.14);

      const hitVol = (0.35 + idx * 0.05) * volumeFactor;
      gain.gain.setValueAtTime(hitVol, hitTime);
      gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(hitTime);
      osc.stop(hitTime + 0.17);
    });
  }

  public onDoorKnock(listener: () => void): () => void {
    this.knockListeners.push(listener);
    return () => {
      this.knockListeners = this.knockListeners.filter((l) => l !== listener);
    };
  }

  private startAmbientDrone() {
    if (!this.ctx || !this.masterGain) return;

    try {
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      this.droneOsc.type = 'sine'; // Pure smooth sine (zero harsh buzz)
      this.droneOsc.frequency.setValueAtTime(46.25, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.droneGain.gain.setValueAtTime(0.03, this.ctx.currentTime);

      this.droneOsc.connect(filter);
      filter.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);

      this.droneOsc.start();
    } catch {
      // Ignore
    }
  }

  private startFridgeHum() {
    if (!this.ctx || !this.masterGain) return;

    try {
      this.fridgeOsc = this.ctx.createOscillator();
      this.fridgeGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      this.fridgeOsc.type = 'sine';
      this.fridgeOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.fridgeGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      this.fridgeOsc.connect(filter);
      filter.connect(this.fridgeGain);
      this.fridgeGain.connect(this.masterGain);

      this.fridgeOsc.start();
    } catch {
      // Ignore
    }
  }

  public updateTension(tension: number) {
    if (!this.ctx) return;

    if (this.droneOsc) {
      const baseFreq = 46.25;
      const detune = tension * 12;
      this.droneOsc.frequency.setTargetAtTime(
        baseFreq + Math.sin(Date.now() * 0.002) * detune,
        this.ctx.currentTime,
        0.5
      );
    }

    if (tension > 0.4 && !this.heartbeatTimer) {
      this.scheduleHeartbeat(tension);
    }
  }

  private scheduleHeartbeat(tension: number) {
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);

    this.playHeartbeatSound();

    const interval = Math.max(450, 1500 - tension * 1000);
    this.heartbeatTimer = window.setTimeout(() => {
      this.scheduleHeartbeat(tension);
    }, interval);
  }

  public playHeartbeatSound() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    this.triggerThump(now, 55, 0.35);
    this.triggerThump(now + 0.14, 48, 0.28);
  }

  private triggerThump(time: number, freq: number, gainVal: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(20, time + 0.12);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  public playFootstep() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80 + Math.random() * 30, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.09);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playCreak() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220 + Math.random() * 50, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.4);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playUnlockClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.09);

    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      const rattleNow = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(450, rattleNow);
      gain2.gain.setValueAtTime(0.2, rattleNow);
      gain2.gain.exponentialRampToValueAtTime(0.001, rattleNow + 0.15);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(rattleNow);
      osc2.stop(rattleNow + 0.16);
    }, 90);
  }

  public playDialTick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playJumpscareScreamer() {
    if (!this.ctx || !this.masterGain) return;

    this.resume();
    const now = this.ctx.currentTime;

    const freqs = [320, 480, 510, 680, 890, 1250, 1800];
    freqs.forEach((f) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 1.8, now + 1.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 1.9);
    });

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(120, now);
    sub.frequency.exponentialRampToValueAtTime(25, now + 0.8);
    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 1.6);
  }

  public playDoorOpen() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(90, now + 1.5);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 1.8);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.9);
  }

  public async enableMicrophone(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (this.ctx && this.analyser) {
        this.micSource = this.ctx.createMediaStreamSource(this.micStream);
        this.micGain = this.ctx.createGain();
        this.micGain.gain.value = 0.5;
        this.micSource.connect(this.micGain);
        this.micGain.connect(this.analyser);
      }
      return true;
    } catch {
      return false;
    }
  }

  public getMetrics(): AudioMetrics {
    if (!this.analyser || !this.freqData || !this.timeData) {
      return { volume: 0, bassLevel: 0 };
    }

    this.analyser.getByteFrequencyData(this.freqData as unknown as Uint8Array<ArrayBuffer>);
    this.analyser.getByteTimeDomainData(this.timeData as unknown as Uint8Array<ArrayBuffer>);

    let sumSquares = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const norm = (this.timeData[i] - 128) / 128;
      sumSquares += norm * norm;
    }
    const volume = Math.min(1.0, Math.sqrt(sumSquares / this.timeData.length) * 2.5);

    let bassSum = 0;
    const bassBins = Math.min(12, this.freqData.length);
    for (let i = 0; i < bassBins; i++) {
      bassSum += this.freqData[i];
    }
    const bassLevel = Math.min(1.0, bassSum / (bassBins * 255));

    return { volume, bassLevel };
  }

  public dispose() {
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio = null;
    }
    if (this.focoAudio) {
      this.focoAudio.pause();
      this.focoAudio = null;
    }
    if (this.bathroomCryAudio) {
      this.bathroomCryAudio.pause();
      this.bathroomCryAudio = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}

export const horrorAudio = new HorrorAudioManager();
