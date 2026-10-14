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
  private bgmSource: MediaElementAudioSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  private illuminatoBuffer: AudioBuffer | null = null;
  private illuminatoSourceNode: AudioBufferSourceNode | null = null;

  // Ceiling Light Bulb Sound ("sonido de foco")
  private focoAudio: HTMLAudioElement | null = null;
  private focoSource: MediaElementAudioSourceNode | null = null;
  private focoGain: GainNode | null = null;
  private focoBuffer: AudioBuffer | null = null;
  private focoSourceNode: AudioBufferSourceNode | null = null;
  private focoSynthOsc: OscillatorNode | null = null;
  private focoSynthGain: GainNode | null = null;

  // Door Knocks Sound ("sonido de puerta / golpes")
  private doorBuffer: AudioBuffer | null = null;

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

      // Setup Background Music Gain
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.38, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      // Setup Foco (Ceiling light) Gain - lower volume
      this.focoGain = this.ctx.createGain();
      this.focoGain.gain.setValueAtTime(0.10, this.ctx.currentTime);
      this.focoGain.connect(this.masterGain);

      // Preload audio files
      this.loadAudioFiles();

      // Start "the illuminato" background loop
      this.startBackgroundMusic();

      // Start "sonido de foco" synchronized with ceiling light
      this.startCeilingFocoSound();

      // Start ambient synth drone and fridge hum
      this.startAmbientDrone();
      this.startFridgeHum();

      return true;
    } catch (err) {
      console.warn('AudioContext failed to initialize:', err);
      // Fallback simple HTMLAudio elements
      this.startBackgroundMusicFallback();
      return false;
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.bgmAudio && this.bgmAudio.paused) {
      this.bgmAudio.play().catch(() => {});
    }
    if (this.focoAudio && this.focoAudio.paused) {
      this.focoAudio.play().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.75, this.ctx.currentTime, 0.1);
    }
    if (this.bgmAudio) {
      this.bgmAudio.muted = muted;
    }
    if (this.focoAudio) {
      this.focoAudio.muted = muted;
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Preload audio files into AudioBuffers for zero-latency, high precision playback
   */
  private async loadAudioFiles() {
    if (!this.ctx) return;

    const loadBuffer = async (url: string): Promise<AudioBuffer | null> => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const arrayBuf = await resp.arrayBuffer();
        if (this.ctx) {
          return await this.ctx.decodeAudioData(arrayBuf);
        }
      } catch (e) {
        console.warn(`Could not load audio buffer from ${url}:`, e);
      }
      return null;
    };

    // Load in parallel
    Promise.all([
      loadBuffer('/audio/the_illuminato.wav'),
      loadBuffer('/audio/sonido_foco.wav'),
      loadBuffer('/audio/golpes_puerta.wav'),
    ]).then(([illuminato, foco, puerta]) => {
      this.illuminatoBuffer = illuminato;
      this.focoBuffer = foco;
      this.doorBuffer = puerta;

      // If buffer loaded and audio element isn't playing, switch to buffer source
      if (this.illuminatoBuffer && (!this.bgmAudio || this.bgmAudio.paused)) {
        this.playIlluminatoBufferLoop();
      }
      if (this.focoBuffer && (!this.focoAudio || this.focoAudio.paused)) {
        this.playFocoBufferLoop();
      }
    });
  }

  /**
   * Start "the illuminato" background music in a continuous seamless loop
   */
  public startBackgroundMusic() {
    if (this.bgmAudio) {
      this.bgmAudio.play().catch(() => {});
      return;
    }

    try {
      this.bgmAudio = new Audio('/audio/the_illuminato.wav');
      this.bgmAudio.loop = true;
      this.bgmAudio.crossOrigin = 'anonymous';
      this.bgmAudio.volume = 0.45;

      if (this.ctx && this.bgmGain) {
        try {
          this.bgmSource = this.ctx.createMediaElementSource(this.bgmAudio);
          this.bgmSource.connect(this.bgmGain);
        } catch {
          // If already connected or CORS issue, direct HTML audio playback works
        }
      }

      this.bgmAudio.play().catch(() => {
        // Autoplay policy: will resume on next user touch or click
        const resumeOnUser = () => {
          this.bgmAudio?.play().catch(() => {});
          window.removeEventListener('pointerdown', resumeOnUser);
          window.removeEventListener('keydown', resumeOnUser);
        };
        window.addEventListener('pointerdown', resumeOnUser, { once: true });
        window.addEventListener('keydown', resumeOnUser, { once: true });
      });
    } catch {
      this.startBackgroundMusicFallback();
    }
  }

  private playIlluminatoBufferLoop() {
    if (!this.ctx || !this.illuminatoBuffer || !this.bgmGain || this.illuminatoSourceNode) return;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = this.illuminatoBuffer;
      src.loop = true;
      src.connect(this.bgmGain);
      src.start(0);
      this.illuminatoSourceNode = src;
    } catch (e) {
      console.warn('Could not start illuminato buffer loop:', e);
    }
  }

  private startBackgroundMusicFallback() {
    if (this.bgmAudio) return;
    try {
      this.bgmAudio = new Audio('/audio/the_illuminato.wav');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0.45;
      this.bgmAudio.play().catch(() => {});
    } catch {
      // Fallback
    }
  }

  /**
   * Start "sonido de foco" - Electrical hum and crackle synchronized with ceiling light
   */
  public startCeilingFocoSound() {
    if (this.focoAudio || this.focoSourceNode) return;

    try {
      this.focoAudio = new Audio('/audio/sonido_foco.wav');
      this.focoAudio.loop = true;
      this.focoAudio.crossOrigin = 'anonymous';
      this.focoAudio.volume = 0.12; // Un sonido más bajo

      if (this.ctx && this.focoGain) {
        try {
          this.focoSource = this.ctx.createMediaElementSource(this.focoAudio);
          this.focoSource.connect(this.focoGain);
        } catch {
          // Direct element volume fallback
        }
      }

      this.focoAudio.play().catch(() => {});
    } catch {
      // Use procedural 60Hz hum fallback
      this.startFocoProceduralHum();
    }
  }

  private playFocoBufferLoop() {
    if (!this.ctx || !this.focoBuffer || !this.focoGain || this.focoSourceNode) return;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = this.focoBuffer;
      src.loop = true;
      src.connect(this.focoGain);
      src.start(0);
      this.focoSourceNode = src;
    } catch (e) {
      console.warn('Could not start foco buffer loop:', e);
    }
  }

  private startFocoProceduralHum() {
    if (!this.ctx || !this.focoGain || this.focoSynthOsc) return;

    try {
      this.focoSynthOsc = this.ctx.createOscillator();
      this.focoSynthGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      this.focoSynthOsc.type = 'sawtooth';
      this.focoSynthOsc.frequency.setValueAtTime(60.0, this.ctx.currentTime); // 60Hz mains

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(120.0, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      this.focoSynthGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.focoSynthOsc.connect(filter);
      filter.connect(this.focoSynthGain);
      this.focoSynthGain.connect(this.focoGain);

      this.focoSynthOsc.start();
    } catch {
      // Ignore
    }
  }

  /**
   * Synchronize "sonido de foco" with ceiling light flicker
   * @param lightIntensity Current ceiling light intensity (e.g. 0.2 to 1.4)
   * @param isFlickerDip True if the bulb is currently flickering or dimming
   */
  public syncCeilingLight(lightIntensity: number, isFlickerDip: boolean) {
    if (!this.ctx || !this.focoGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Base lower volume: 0.06 to 0.14
    // When the light dims or dips, the electrical transformer buzz crackles
    const targetGain = isFlickerDip ? 0.16 : 0.08 * Math.max(0.4, Math.min(1.2, lightIntensity));
    this.focoGain.gain.setTargetAtTime(targetGain, now, 0.04);

    // If a sudden sharp flicker dip occurs, synthesize a micro-filament spark sizzle
    if (isFlickerDip && Math.random() < 0.25) {
      this.triggerFilamentSpark(now);
    }
  }

  private triggerFilamentSpark(time: number) {
    if (!this.ctx || !this.focoGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180 + Math.random() * 80, time);
      osc.frequency.exponentialRampToValueAtTime(60, time + 0.06);

      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

      osc.connect(gain);
      gain.connect(this.focoGain);

      osc.start(time);
      osc.stop(time + 0.07);
    } catch {
      // Ignore
    }
  }

  /**
   * Play heavy wooden door knocks ("golpes en la puerta")
   * Called randomly when "el pibe" is near the door
   * @param volumeFactor 0.0 to 1.0 (scales with proximity to door)
   */
  public playDoorKnocks(volumeFactor: number = 0.85) {
    if (this.isMuted) return;
    this.resume();

    // Trigger registered UI & camera shake listeners
    this.knockListeners.forEach((fn) => {
      try {
        fn();
      } catch {
        // Ignore
      }
    });

    // If preloaded AudioBuffer is available, play via Web Audio API
    if (this.ctx && this.masterGain && this.doorBuffer) {
      try {
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        src.buffer = this.doorBuffer;
        // Subtle pitch variation each time for realism
        src.playbackRate.setValueAtTime(0.96 + Math.random() * 0.08, this.ctx.currentTime);

        // Acoustic muffling based on distance
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(Math.max(800, 3200 * volumeFactor), this.ctx.currentTime);

        const clampedVol = Math.max(0.18, Math.min(1.0, volumeFactor * 0.85));
        gain.gain.setValueAtTime(clampedVol, this.ctx.currentTime);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        src.start(0);
        return;
      } catch (err) {
        console.warn('Error playing door knock buffer:', err);
      }
    }

    // Fallback: Audio element or procedural knocks
    try {
      const audio = new Audio('/audio/golpes_puerta.wav');
      audio.volume = Math.max(0.15, Math.min(1.0, volumeFactor * 0.8));
      audio.play().catch(() => {
        this.synthesizeDoorKnocks(volumeFactor);
      });
    } catch {
      this.synthesizeDoorKnocks(volumeFactor);
    }
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

  /**
   * Register a callback when door knocks occur (for visual door shake / camera rumble)
   */
  public onDoorKnock(listener: () => void): () => void {
    this.knockListeners.push(listener);
    return () => {
      this.knockListeners = this.knockListeners.filter((l) => l !== listener);
    };
  }

  private startAmbientDrone() {
    if (!this.ctx || !this.masterGain) return;

    try {
      // Sub-bass drone
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      this.droneOsc.type = 'sawtooth';
      this.droneOsc.frequency.setValueAtTime(46.25, this.ctx.currentTime); // F#1

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      this.droneGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

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

      this.fridgeOsc.type = 'triangle';
      this.fridgeOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      this.fridgeGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

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

    // Detune drone slightly with tension
    if (this.droneOsc) {
      const baseFreq = 46.25;
      const detune = tension * 12;
      this.droneOsc.frequency.setTargetAtTime(
        baseFreq + Math.sin(Date.now() * 0.002) * detune,
        this.ctx.currentTime,
        0.5
      );
    }

    // Slightly increase illuminato presence with tension
    if (this.bgmGain) {
      const bgmVol = 0.35 + tension * 0.15;
      this.bgmGain.gain.setTargetAtTime(bgmVol, this.ctx.currentTime, 0.5);
    }

    // Heartbeat accelerates with tension
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
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}

export const horrorAudio = new HorrorAudioManager();
