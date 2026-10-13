/**
 * Procedural Horror Web Audio Manager
 * Generates ambient horror drones, rotten fridge buzz, tension heartbeats,
 * chain clicks, footsteps, and jump scare sounds with zero external audio assets.
 * Exposes AnalyserNode for audioMetrics (volume, bassLevel).
 */

import { AudioMetrics } from '../types/game';

class HorrorAudioManager {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private fridgeGain: GainNode | null = null;
  private fridgeOsc: OscillatorNode | null = null;
  private heartbeatTimer: number | null = null;
  private isMuted: boolean = false;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;

  private freqData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;

  public init(): boolean {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

      // Analyser Node
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.frequencyBinCount);

      // Start dark ambient drone
      this.startAmbientDrone();
      this.startFridgeHum();

      return true;
    } catch (err) {
      console.warn('AudioContext failed to initialize:', err);
      return false;
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.1);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
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

      this.droneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.droneOsc.connect(filter);
      filter.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);

      this.droneOsc.start();
    } catch {
      // Audio autoplay policy catch
    }
  }

  private startFridgeHum() {
    if (!this.ctx || !this.masterGain) return;

    try {
      this.fridgeOsc = this.ctx.createOscillator();
      this.fridgeGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      this.fridgeOsc.type = 'triangle';
      this.fridgeOsc.frequency.setValueAtTime(60, this.ctx.currentTime); // 60Hz mains electrical buzz

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      this.fridgeGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      this.fridgeOsc.connect(filter);
      filter.connect(this.fridgeGain);
      this.fridgeGain.connect(this.masterGain);

      this.fridgeOsc.start();
    } catch {
      // Ignore
    }
  }

  /**
   * Adjust tension level (0.0 to 1.0)
   * As tension increases, heartbeat accelerates and ambient pitch detunes
   */
  public updateTension(tension: number) {
    if (!this.ctx || !this.droneOsc) return;

    const baseFreq = 46.25;
    const detune = tension * 12; // Slight unsettling pitch drift
    this.droneOsc.frequency.setTargetAtTime(baseFreq + Math.sin(Date.now() * 0.002) * detune, this.ctx.currentTime, 0.5);

    // Dynamic heartbeat rate: from once every 2s up to twice a second
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
    // Thump 1
    this.triggerThump(now, 55, 0.35);
    // Thump 2 (slightly softer, 120ms later)
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
    // Low wooden floor thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80 + Math.random() * 30, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.09);

    gain.gain.setValueAtTime(0.15, now);
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
    // Sharp metallic mechanical click
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

    // Secondary chain rattle
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

    // Screaming dissonant chords
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

    // Intense low sub impact
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

    // Heavy long creak + cinematic release chord
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

  /**
   * Connect microphone to analyser if user grants permission
   */
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

  /**
   * Extract realtime volume and bass level from AnalyserNode
   */
  public getMetrics(): AudioMetrics {
    if (!this.analyser || !this.freqData || !this.timeData) {
      return { volume: 0, bassLevel: 0 };
    }

    this.analyser.getByteFrequencyData(this.freqData as unknown as Uint8Array<ArrayBuffer>);
    this.analyser.getByteTimeDomainData(this.timeData as unknown as Uint8Array<ArrayBuffer>);

    // Calculate RMS Volume
    let sumSquares = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const norm = (this.timeData[i] - 128) / 128;
      sumSquares += norm * norm;
    }
    const volume = Math.min(1.0, Math.sqrt(sumSquares / this.timeData.length) * 2.5);

    // Calculate Bass Level (first 12 frequency bins, ~0-500Hz)
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
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}

export const horrorAudio = new HorrorAudioManager();
