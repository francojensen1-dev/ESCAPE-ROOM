/**
 * Horror Web Audio Manager
 * Features:
 * 1. Background Music: Continuous seamless loop of Silent Hill 4 "Room of Angel" (/audio/room_of_angel.mp3).
 * 2. Lightbulb Hum (Sonido de foco): Seamless gapless loop (/audio/foco_hum.wav) with dynamic flicker modulation.
 * 3. Random Door Banging (Sonido de puerta): Terrifying door knocks triggered randomly when "El Pibe" is near the door or as tension escalates.
 * 4. Procedural Horror SFX: Heartbeat, creaks, footsteps, chains, jumpscare screamer, and AnalyserNode metrics.
 */

import { AudioMetrics } from '../types/game';

class HorrorAudioManager {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;

  // Background Music
  private bgMusic: HTMLAudioElement | null = null;
  private bgMusicGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;

  // Lightbulb / Foco Audio
  private focoBuffer: AudioBuffer | null = null;
  private focoSource: AudioBufferSourceNode | null = null;
  private focoGain: GainNode | null = null;
  private focoOsc: OscillatorNode | null = null;
  private focoOscGain: GainNode | null = null;

  // Door Knock Audio Buffer
  private doorKnockBuffer: AudioBuffer | null = null;
  private doorKnockTimer: number | null = null;
  private onDoorKnockCallback: (() => void) | null = null;

  // Ambient Drone & Rotten Fridge Hum
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private fridgeGain: GainNode | null = null;
  private fridgeOsc: OscillatorNode | null = null;
  private heartbeatTimer: number | null = null;

  // State
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
      this.startBackgroundMusic();
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

      // Analyser Node
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.frequencyBinCount);

      // 1. Start Background Music Loop (Room of Angel)
      this.startBackgroundMusic();

      // 2. Start Foco Hum (Seamless loop)
      this.initFocoHum();

      // 3. Preload Door Knock Audio
      this.loadDoorKnockBuffer();

      // 4. Start Ambient Sub Drone & Fridge Hum
      this.startAmbientDrone();
      this.startFridgeHum();

      return true;
    } catch (err) {
      console.warn('AudioContext failed to initialize:', err);
      // Fallback music start
      this.startBackgroundMusic();
      return false;
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.bgMusic && this.bgMusic.paused && !this.isMuted) {
      this.bgMusic.play().catch(() => {});
    }
  }

  /**
   * 1. BACKGROUND MUSIC: Room of Angel continuous loop
   */
  public startBackgroundMusic() {
    if (!this.bgMusic) {
      this.bgMusic = new Audio('/audio/room_of_angel.mp3');
      this.bgMusic.loop = true;
      this.bgMusic.volume = this.isMuted ? 0 : 0.42;

      // Connect to Web Audio masterGain if context exists
      if (this.ctx && this.masterGain) {
        try {
          const musicSource = this.ctx.createMediaElementSource(this.bgMusic);
          this.bgMusicGain = this.ctx.createGain();
          this.bgMusicGain.gain.setValueAtTime(0.48, this.ctx.currentTime);
          musicSource.connect(this.bgMusicGain);
          this.bgMusicGain.connect(this.masterGain);
        } catch {
          // MediaElementSource CORS or single-connect fallback: standard element volume handles it
        }
      }
    }

    if (!this.isMuted) {
      this.bgMusic.play().then(() => {
        this.isMusicPlaying = true;
      }).catch((err) => {
        console.log('Background music autoplay waiting for interaction:', err);
      });
    }
  }

  /**
   * 2. FOCO HUM: Seamless loop without noticeable cuts
   * Uses decoded Web Audio AudioBufferSourceNode with loop = true (sample-accurate gapless loop),
   * plus a procedural harmonic oscillator fallback so it is never silent.
   */
  private async initFocoHum() {
    if (!this.ctx || !this.masterGain) return;

    this.focoGain = this.ctx.createGain();
    this.focoGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
    this.focoGain.connect(this.masterGain);

    // Procedural 60Hz/120Hz continuous oscillator hum (always runs smoothly)
    try {
      this.focoOsc = this.ctx.createOscillator();
      this.focoOscGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      this.focoOsc.type = 'sawtooth';
      this.focoOsc.frequency.setValueAtTime(60.0, this.ctx.currentTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(120.0, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.focoOscGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.focoOsc.connect(filter);
      filter.connect(this.focoOscGain);
      this.focoOscGain.connect(this.focoGain);

      this.focoOsc.start();
    } catch {
      // Ignore
    }

    // Load and decode high-fidelity seamless audio file
    try {
      const res = await fetch('/audio/foco_hum.wav');
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        this.focoBuffer = await this.ctx.decodeAudioData(arrayBuf);
        this.playFocoBufferLoop();
      }
    } catch (e) {
      console.warn('Using procedural foco hum fallback:', e);
    }
  }

  private playFocoBufferLoop() {
    if (!this.ctx || !this.focoBuffer || !this.focoGain) return;

    try {
      if (this.focoSource) {
        this.focoSource.stop();
        this.focoSource.disconnect();
      }

      this.focoSource = this.ctx.createBufferSource();
      this.focoSource.buffer = this.focoBuffer;
      this.focoSource.loop = true;
      this.focoSource.loopStart = 0;
      this.focoSource.loopEnd = this.focoBuffer.duration;

      this.focoSource.connect(this.focoGain);
      this.focoSource.start(0);

      // When the decoded buffer plays, lower the oscillator gain slightly for perfect balance
      if (this.focoOscGain && this.ctx) {
        this.focoOscGain.gain.setTargetAtTime(0.02, this.ctx.currentTime, 0.5);
      }
    } catch (err) {
      console.warn('Could not start foco buffer loop:', err);
    }
  }

  /**
   * Modulate Foco Hum dynamically when the 3D ceiling bulb flickers
   */
  public updateFocoFlicker(flickerIntensity: number) {
    if (!this.focoGain || !this.ctx) return;
    const baseGain = 0.22;
    // When bulb flickers down or pops, hum volume responds instantly
    const target = Math.max(0.08, Math.min(0.40, baseGain * flickerIntensity));
    this.focoGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.04);
  }

  /**
   * 3. DOOR KNOCK: Preload audio buffer for instantaneous playback
   */
  private async loadDoorKnockBuffer() {
    if (!this.ctx) return;
    try {
      const res = await fetch('/audio/door_knock.wav');
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        this.doorKnockBuffer = await this.ctx.decodeAudioData(arrayBuf);
      }
    } catch {
      // Fallback procedural knock is ready
    }
  }

  /**
   * Play heavy terrifying door knocking sound effect
   */
  public playDoorKnock(volume = 0.95) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    this.resume();

    // 1. Play decoded audio buffer if available
    if (this.doorKnockBuffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.doorKnockBuffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        source.connect(gain);
        gain.connect(this.masterGain);
        source.start(0);
      } catch {
        this.playProceduralDoorKnock(volume);
      }
    } else {
      this.playProceduralDoorKnock(volume);
    }

    // Notify listeners (camera shudder, haptic, visual alerts)
    if (this.onDoorKnockCallback) {
      this.onDoorKnockCallback();
    }
  }

  /**
   * Procedural fallback door knock (3 heavy thuds with chain jingle)
   */
  private playProceduralDoorKnock(volume = 0.9) {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    const now = ctx.currentTime;
    const knockTimes = [0.05, 0.75, 1.45];

    knockTimes.forEach((delay, idx) => {
      const time = now + delay;
      const intensity = (0.7 + idx * 0.15) * volume;

      // Heavy low thud impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.14);

      gain.gain.setValueAtTime(0.5 * intensity, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.2);

      // Wood resonance
      const woodOsc = ctx.createOscillator();
      const woodGain = ctx.createGain();
      woodOsc.type = 'sine';
      woodOsc.frequency.setValueAtTime(185, time);
      woodGain.gain.setValueAtTime(0.3 * intensity, time);
      woodGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      woodOsc.connect(woodGain);
      woodGain.connect(masterGain);
      woodOsc.start(time);
      woodOsc.stop(time + 0.23);

      // Metallic chain rattle
      setTimeout(() => {
        if (!this.ctx || !this.masterGain) return;
        const rattleTime = this.ctx.currentTime;
        const rOsc = this.ctx.createOscillator();
        const rGain = this.ctx.createGain();
        rOsc.type = 'square';
        rOsc.frequency.setValueAtTime(620 + Math.random() * 200, rattleTime);
        rGain.gain.setValueAtTime(0.12 * intensity, rattleTime);
        rGain.gain.exponentialRampToValueAtTime(0.001, rattleTime + 0.12);
        rOsc.connect(rGain);
        rGain.connect(this.masterGain);
        rOsc.start(rattleTime);
        rOsc.stop(rattleTime + 0.13);
      }, delay * 1000 + 40);
    });
  }

  /**
   * Automatic Random Door Knock Scheduler:
   * Triggers randomly when "El Pibe" is near the door or as tension increases
   */
  public startRandomDoorKnocks(
    getDistanceToDoor: () => number,
    getTension: () => number,
    onKnock?: () => void
  ) {
    if (onKnock) {
      this.onDoorKnockCallback = onKnock;
    }

    const scheduleNext = () => {
      if (this.doorKnockTimer) clearTimeout(this.doorKnockTimer);

      const dist = getDistanceToDoor();
      const tension = getTension();

      // Proximity check: is player near the door?
      const isNearDoor = dist < 3.8;

      // Base interval:
      // When near the door: faster interval between 10s and 25s
      // When far away: interval between 25s and 60s, scaled down by tension
      let minDelay = isNearDoor ? 10000 : 25000;
      let maxDelay = isNearDoor ? 24000 : 55000;

      // High tension speeds up the knocks
      if (tension > 0.6) {
        minDelay = Math.max(7000, minDelay * 0.7);
        maxDelay = Math.max(16000, maxDelay * 0.7);
      }

      const nextDelay = minDelay + Math.random() * (maxDelay - minDelay);

      this.doorKnockTimer = window.setTimeout(() => {
        // Evaluate condition at trigger time
        const currentDist = getDistanceToDoor();
        const currentTension = getTension();

        // 80% chance when near the door, or proportional to tension
        const chance = currentDist < 3.8 ? 0.85 : 0.35 + currentTension * 0.5;

        if (Math.random() < chance && !this.isMuted) {
          const vol = currentDist < 3.8 ? 1.0 : Math.max(0.45, 1.0 - currentDist * 0.08);
          this.playDoorKnock(vol);
        }

        scheduleNext();
      }, nextDelay);
    };

    scheduleNext();
  }

  public stopRandomDoorKnocks() {
    if (this.doorKnockTimer) {
      clearTimeout(this.doorKnockTimer);
      this.doorKnockTimer = null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.75, this.ctx.currentTime, 0.1);
    }
    if (this.bgMusic) {
      this.bgMusic.volume = muted ? 0 : 0.42;
      if (muted) {
        this.bgMusic.pause();
      } else {
        this.bgMusic.play().catch(() => {});
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

  private startAmbientDrone() {
    if (!this.ctx || !this.masterGain) return;

    try {
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      this.droneOsc.type = 'sawtooth';
      this.droneOsc.frequency.setValueAtTime(46.25, this.ctx.currentTime); // F#1

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      this.droneGain.gain.setValueAtTime(0.14, this.ctx.currentTime);

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
      this.fridgeOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      this.fridgeGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

      this.fridgeOsc.connect(filter);
      filter.connect(this.fridgeGain);
      this.fridgeGain.connect(this.masterGain);

      this.fridgeOsc.start();
    } catch {
      // Ignore
    }
  }

  public updateTension(tension: number) {
    if (!this.ctx || !this.droneOsc) return;

    const baseFreq = 46.25;
    const detune = tension * 12;
    this.droneOsc.frequency.setTargetAtTime(baseFreq + Math.sin(Date.now() * 0.002) * detune, this.ctx.currentTime, 0.5);

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

    gain.gain.setValueAtTime(0.14, now);
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
    this.stopRandomDoorKnocks();
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.src = '';
      this.bgMusic = null;
    }
    if (this.focoSource) {
      try { this.focoSource.stop(); } catch {}
      this.focoSource = null;
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
