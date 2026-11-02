/**
 * Horror Audio Manager
 * - "the illuminato": continuous background music loop
 * - "sonido de foco": lower volume ambient electrical hum synchronized with ceiling light flicker
 * - Random outside ambient horror sounds: GRITO1, GRITO2, PUERTA2, PUERTA3, RISA 1, TENSION2..8, TocanPuerta, risa
 * - Main door interface open/close: Puerta.mp3
 * - Padlock manipulation: Candado.mp3
 * - Fridge interaction: cerrarHeladera.mp3
 * - Fridge motor loop: motorHeladera.mp3 (positional)
 * - Key collect: KeyCollect.mp3
 * - Living room radio: LaRadio.mp3 & TENSION10.mp3 (positional)
 * - 1 minute countdown tension: TENSION1.mp3
 * - Pibe door voices: AbrimeLaPuerta1..24.mp3 (positional & boosted in peephole)
 * - Screamer: scream.mp3
 * - Fuse box breaker switches: ClickPerilla.mp3
 * - Integrates Web Audio API, AnalyserNode for reactive HUD audio metrics, and spatial audio effects.
 */

import { AudioMetrics } from '../types/game';

// Ambience random horror sounds (played randomly with intervals from outside)
const AMBIENT_HORROR_SOUNDS = [
  '/audio/GRITO1.mp3',
  '/audio/GRITO2.mp3',
  '/audio/PUERTA2.mp3',
  '/audio/PUERTA3.mp3',
  '/audio/RISA 1.mp3',
  '/audio/TENSION2.mp3',
  '/audio/TENSION3.mp3',
  '/audio/TENSION4.mp3',
  '/audio/TENSION5.mp3',
  '/audio/TENSION6.mp3',
  '/audio/TENSION7.mp3',
  '/audio/TENSION8.mp3',
  '/audio/TocanPuerta.mp3',
  '/audio/risa.mp3',
];

// 24 Voice lines for "El Pibe" behind his door
const ABRIME_LA_PUERTA_TRACKS = Array.from({ length: 24 }, (_, i) => `/audio/AbrimeLaPuerta${i + 1}.mp3`);

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

  // Door Knocks Sound ("sonido de puerta / golpes")
  private doorBuffer: AudioBuffer | null = null;

  // Sink Baby Cry Positional Audio ("LLANTO ATERRADOR - llanto.wav")
  private cryBuffer: AudioBuffer | null = null;
  private crySource: AudioBufferSourceNode | null = null;
  private cryGain: GainNode | null = null;
  private cryPanner: StereoPannerNode | null = null;
  private isCryPlaying: boolean = false;
  private bathroomCryAudio: HTMLAudioElement | null = null;

  // Random Ambient Horror Sounds Loop (outside noises)
  private ambientHorrorAudio: HTMLAudioElement | null = null;
  private ambientHorrorTimer: number | null = null;
  private isAmbientHorrorActive: boolean = false;
  private lastAmbientIndex: number = -1;

  // Zero-latency Web Audio API pre-decoded buffers
  private sfxBuffers: Map<string, AudioBuffer> = new Map();

  // Zero-latency pre-instantiated SFX players
  private mainDoorAudio: HTMLAudioElement | null = null;
  private fridgeAudio: HTMLAudioElement | null = null;
  private padlockAudio: HTMLAudioElement | null = null;
  private paperAudio: HTMLAudioElement | null = null;
  private switchClickAudio: HTMLAudioElement | null = null;

  // Fridge Motor Positional Audio
  private fridgeMotorAudio: HTMLAudioElement | null = null;
  private fridgeMotorBaseVol: number = 0.55;

  // Room Table Radio (LaRadio.mp3 & TENSION10.mp3 continuous loop)
  private radioAudio: HTMLAudioElement | null = null;
  private radioTracks: string[] = ['/audio/LaRadio.mp3', '/audio/TENSION10.mp3'];
  private currentRadioTrackIndex: number = 0;
  private radioBaseVol: number = 0.65;

  // 1-Minute Remaining Countdown Tension Audio (TENSION1.mp3)
  private oneMinuteAudio: HTMLAudioElement | null = null;
  private isOneMinutePlaying: boolean = false;

  // Pibe Door Voice Lines (AbrimeLaPuerta1..24)
  private pibeVoiceAudio: HTMLAudioElement | null = null;
  private pibeVoiceTimer: number | null = null;
  private isPibeVoiceActive: boolean = false;
  private isAtPeephole: boolean = false;
  private pibeVoiceDist: number = 6.0;
  private pibeVoiceAvailable: number[] = [];
  private currentPibeSource: AudioBufferSourceNode | null = null;
  private pibeVoiceGain: GainNode | null = null;

  // Procedural tension elements
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private heartbeatTimer: number | null = null;
  private isMuted: boolean = false;
  private isStopped: boolean = false;

  // Microphone
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;

  // Visualizer metrics buffers
  private freqData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;

  // Door knock listeners
  private knockListeners: Array<() => void> = [];

  constructor() {
    this.setupGestureUnlock();
    this.preloadSFXAudioElements();
  }

  private preloadSFXAudioElements() {
    try {
      this.fridgeAudio = new Audio('/audio/cerrarHeladera.mp3');
      this.fridgeAudio.preload = 'auto';

      this.mainDoorAudio = new Audio('/audio/Puerta.mp3');
      this.mainDoorAudio.preload = 'auto';

      this.padlockAudio = new Audio('/audio/Candado.mp3');
      this.padlockAudio.preload = 'auto';

      this.paperAudio = new Audio('/audio/Papel.mp3');
      this.paperAudio.preload = 'auto';

      this.switchClickAudio = new Audio('/audio/ClickPerilla.mp3');
      this.switchClickAudio.preload = 'auto';
    } catch {
      // Ignore
    }
  }

  private async loadSFXBuffer(url: string) {
    if (!this.ctx) return;
    try {
      const cleanUrl = encodeURI(url);
      const resp = await fetch(cleanUrl);
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        if (this.ctx) {
          const decoded = await this.ctx.decodeAudioData(arrayBuf);
          this.sfxBuffers.set(url, decoded);
          this.sfxBuffers.set(cleanUrl, decoded);
        }
      }
    } catch {
      // Ignore
    }
  }

  private preloadSFXBuffers() {
    const urls = [
      '/audio/cerrarHeladera.mp3',
      '/audio/Puerta.mp3',
      '/audio/Candado.mp3',
      '/audio/Papel.mp3',
      '/audio/ClickPerilla.mp3',
      '/audio/KeyCollect.mp3',
      '/audio/golpes_puerta.mp3',
      '/audio/TocanPuerta.mp3',
      '/audio/scream.mp3',
      '/audio/GRITO1.mp3',
      '/audio/GRITO2.mp3',
      '/audio/RISA 1.mp3',
      '/audio/risa.mp3',
      '/audio/PUERTA2.mp3',
      '/audio/PUERTA3.mp3',
      ...ABRIME_LA_PUERTA_TRACKS,
    ];
    urls.forEach((url) => {
      const cleanUrl = encodeURI(url);
      if (!this.sfxBuffers.has(cleanUrl) && !this.sfxBuffers.has(url)) {
        this.loadSFXBuffer(url);
      }
    });
  }

  private playZeroLatencySFX(url: string, fallbackAudio: HTMLAudioElement | null, volume: number = 0.8) {
    if (this.isMuted) return;
    this.resume();

    const buffer = this.sfxBuffers.get(url);
    if (this.ctx && this.masterGain && buffer) {
      try {
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        src.buffer = buffer;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        src.connect(gain);
        gain.connect(this.masterGain);
        src.start(0);
        return;
      } catch {
        // Fallback below
      }
    }

    try {
      if (fallbackAudio) {
        fallbackAudio.currentTime = 0;
        fallbackAudio.volume = volume;
        const p = fallbackAudio.play();
        if (p !== undefined) p.catch(() => {});
      } else {
        const audio = new Audio(url);
        audio.volume = volume;
        audio.play().catch(() => {});
      }
    } catch {
      // Ignore
    }
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
      this.preloadSFXBuffers();
      this.startBackgroundMusic();
      this.startCeilingFocoSound();
      this.startAmbientLayers();
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

      // Preload door knock, baby cry, and zero-latency SFX buffers
      this.loadDoorBuffer();
      this.loadCryBuffer();
      this.preloadSFXBuffers();

      // Start all background audio streams
      this.startBackgroundMusic();
      this.startCeilingFocoSound();
      this.startAmbientLayers();
      this.startAmbientDrone();

      return true;
    } catch (err) {
      console.warn('AudioContext failed to initialize:', err);
      this.startBackgroundMusic();
      this.startCeilingFocoSound();
      this.startAmbientLayers();
      return false;
    }
  }

  public resume() {
    this.isStopped = false;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
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
    if (this.fridgeMotorAudio && this.fridgeMotorAudio.paused && !this.isMuted) {
      this.fridgeMotorAudio.play().catch(() => {});
    }
    if (this.radioAudio && this.radioAudio.paused && !this.isMuted) {
      this.radioAudio.play().catch(() => {});
    }
    if (!this.isAmbientHorrorActive) {
      this.startRandomAmbientHorrorSounds();
    }
    if (!this.isPibeVoiceActive) {
      this.startPibeVoiceLoop();
    } else if (!this.currentPibeSource && (!this.pibeVoiceAudio || this.pibeVoiceAudio.paused)) {
      this.playNextPibeVoice();
    }
  }

  public stopBackgroundLoops() {
    this.isStopped = true;
    this.isAmbientHorrorActive = false;
    this.isPibeVoiceActive = false;
    this.isCryPlaying = false;
    this.isOneMinutePlaying = false;

    if (this.ambientHorrorTimer) {
      clearTimeout(this.ambientHorrorTimer);
      this.ambientHorrorTimer = null;
    }
    if (this.pibeVoiceTimer) {
      clearTimeout(this.pibeVoiceTimer);
      this.pibeVoiceTimer = null;
    }
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.currentPibeSource) {
      try { this.currentPibeSource.stop(); } catch {}
      this.currentPibeSource = null;
    }

    if (this.crySource) {
      try { this.crySource.stop(); } catch {}
      this.crySource = null;
    }

    if (this.cryGain && this.ctx) {
      try {
        this.cryGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch {}
    }

    const killAudio = (audio: HTMLAudioElement | null) => {
      if (audio) {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 0;
        } catch {}
      }
    };

    killAudio(this.bgmAudio);
    killAudio(this.focoAudio);
    killAudio(this.bathroomCryAudio);
    killAudio(this.fridgeMotorAudio);
    killAudio(this.radioAudio);
    killAudio(this.oneMinuteAudio);
    killAudio(this.ambientHorrorAudio);
    killAudio(this.pibeVoiceAudio);

    this.bgmAudio = null;
    this.focoAudio = null;
    this.bathroomCryAudio = null;
    this.fridgeMotorAudio = null;
    this.radioAudio = null;
    this.oneMinuteAudio = null;
    this.ambientHorrorAudio = null;
    this.pibeVoiceAudio = null;

    if (this.droneOsc) {
      try { this.droneOsc.stop(); } catch {}
      this.droneOsc = null;
    }
  }

  public stopAllSounds() {
    this.isStopped = true;
    this.isAmbientHorrorActive = false;
    this.isPibeVoiceActive = false;
    this.isCryPlaying = false;
    this.stopBackgroundLoops();
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch {}
    }
  }

  private startAmbientLayers() {
    this.startRandomAmbientHorrorSounds();
    this.startFridgeMotorLoop();
    this.startRadioLoop();
    this.startPibeVoiceLoop();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.75, this.ctx.currentTime, 0.1);
    }
    if (this.bgmAudio) {
      this.bgmAudio.volume = muted ? 0 : this.bgmVolume;
      if (muted) this.bgmAudio.pause();
      else this.bgmAudio.play().catch(() => {});
    }
    if (this.focoAudio) {
      this.focoAudio.volume = muted ? 0 : 0.008;
      if (muted) this.focoAudio.pause();
      else this.focoAudio.play().catch(() => {});
    }
    if (this.fridgeMotorAudio) {
      this.fridgeMotorAudio.volume = muted ? 0 : this.fridgeMotorBaseVol;
      if (muted) this.fridgeMotorAudio.pause();
      else this.fridgeMotorAudio.play().catch(() => {});
    }
    if (this.radioAudio) {
      this.radioAudio.volume = muted ? 0 : this.radioBaseVol;
      if (muted) this.radioAudio.pause();
      else this.radioAudio.play().catch(() => {});
    }
    if (this.oneMinuteAudio) {
      this.oneMinuteAudio.volume = muted ? 0 : 0.70;
      if (muted) this.oneMinuteAudio.pause();
      else this.oneMinuteAudio.play().catch(() => {});
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

  // =========================================================================
  // 1. RANDOM AMBIENT HORROR SOUNDS (GRITO, PUERTA, RISA, TENSION, etc.)
  // =========================================================================
  public startRandomAmbientHorrorSounds() {
    if (this.isAmbientHorrorActive) return;
    this.isAmbientHorrorActive = true;
    this.scheduleNextAmbientHorrorSound(4000);
  }

  private scheduleNextAmbientHorrorSound(delayMs: number) {
    if (this.isStopped || !this.isAmbientHorrorActive) return;
    if (this.ambientHorrorTimer) clearTimeout(this.ambientHorrorTimer);
    this.ambientHorrorTimer = window.setTimeout(() => {
      if (!this.isStopped && this.isAmbientHorrorActive) {
        this.playRandomAmbientHorrorSound();
      }
    }, delayMs);
  }

  private playRandomAmbientHorrorSound() {
    if (this.isStopped || !this.isAmbientHorrorActive || this.isMuted) {
      if (!this.isStopped && this.isAmbientHorrorActive) {
        this.scheduleNextAmbientHorrorSound(8000);
      }
      return;
    }

    // Pick a random track avoiding direct repeat
    let nextIndex = Math.floor(Math.random() * AMBIENT_HORROR_SOUNDS.length);
    if (nextIndex === this.lastAmbientIndex) {
      nextIndex = (nextIndex + 1) % AMBIENT_HORROR_SOUNDS.length;
    }
    this.lastAmbientIndex = nextIndex;
    const trackSrc = AMBIENT_HORROR_SOUNDS[nextIndex];

    const cleanupAndScheduleNext = () => {
      // Pause between 7 and 16 seconds so sounds don't overlap
      const pause = Math.floor(Math.random() * 9000) + 7000;
      this.scheduleNextAmbientHorrorSound(pause);
    };

    const buffer = this.sfxBuffers.get(trackSrc) || this.sfxBuffers.get(encodeURI(trackSrc));
    if (this.ctx && this.masterGain && buffer) {
      try {
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        src.buffer = buffer;
        gain.gain.setValueAtTime(0.20, this.ctx.currentTime);
        src.connect(gain);
        gain.connect(this.masterGain);
        src.onended = cleanupAndScheduleNext;
        src.start(0);
        return;
      } catch {}
    }

    try {
      this.ambientHorrorAudio = new Audio(encodeURI(trackSrc));
      this.ambientHorrorAudio.volume = 0.15;
      this.ambientHorrorAudio.preload = 'auto';

      this.ambientHorrorAudio.onended = cleanupAndScheduleNext;
      this.ambientHorrorAudio.onerror = cleanupAndScheduleNext;

      const p = this.ambientHorrorAudio.play();
      if (p !== undefined) {
        p.catch(() => {
          cleanupAndScheduleNext();
        });
      }
    } catch {
      this.scheduleNextAmbientHorrorSound(8000);
    }
  }

  // =========================================================================
  // 2. MAIN DOOR OPEN/CLOSE SOUND ("Puerta.mp3")
  // =========================================================================
  public playMainDoorSound() {
    this.playZeroLatencySFX('/audio/Puerta.mp3', this.mainDoorAudio, 0.85);
  }

  // =========================================================================
  // 3. PADLOCK INTERACTION SOUND ("Candado.mp3")
  // =========================================================================
  public playPadlockSound() {
    this.playZeroLatencySFX('/audio/Candado.mp3', this.padlockAudio, 0.80);
  }

  // =========================================================================
  // 4. FRIDGE OPEN / CLOSE / INTERACT SOUND ("cerrarHeladera.mp3")
  // =========================================================================
  public playFridgeSound() {
    this.playZeroLatencySFX('/audio/cerrarHeladera.mp3', this.fridgeAudio, 0.85);
  }

  // =========================================================================
  // 5. FRIDGE MOTOR POSITIONAL CONTINUOUS LOOP ("motorHeladera.mp3")
  // =========================================================================
  private startFridgeMotorLoop() {
    if (!this.fridgeMotorAudio) {
      this.fridgeMotorAudio = new Audio('/audio/motorHeladera.mp3');
      this.fridgeMotorAudio.loop = true;
      this.fridgeMotorAudio.volume = this.isMuted ? 0 : 0.08;
      this.fridgeMotorAudio.preload = 'auto';
    }
    this.fridgeMotorAudio.play().catch(() => {});
  }

  public updateFridgeMotorDistance(dist: number) {
    if (this.isMuted || this.isStopped || !this.fridgeMotorAudio) {
      if (this.fridgeMotorAudio) {
        this.fridgeMotorAudio.volume = 0;
        if (!this.fridgeMotorAudio.paused) {
          this.fridgeMotorAudio.pause();
        }
      }
      return;
    }

    // Attenuation based on distance to the fridge in meters
    // At fridge (< 1.5m): 0.55
    // Near fridge (1.5m - 3.5m): 0.55 -> 0.25
    // Across room (3.5m - 7m): 0.25 -> 0.04
    // Far (> 7m): 0.02
    let vol = 0.02;
    if (dist < 1.5) {
      vol = 0.55;
    } else if (dist < 3.5) {
      const t = (dist - 1.5) / 2.0;
      vol = 0.55 - t * 0.30;
    } else if (dist < 7.0) {
      const t = (dist - 3.5) / 3.5;
      vol = 0.25 - t * 0.21;
    }

    this.fridgeMotorBaseVol = vol;
    this.fridgeMotorAudio.volume = Math.max(0, Math.min(1, vol));
    if (this.fridgeMotorAudio.paused && !this.isMuted) {
      this.fridgeMotorAudio.play().catch(() => {});
    }
  }

  // =========================================================================
  // 6. KEY COLLECT SOUND ("KeyCollect.mp3")
  // =========================================================================
  public playKeyCollect() {
    this.playZeroLatencySFX('/audio/KeyCollect.mp3', null, 0.90);
  }

  // =========================================================================
  // 7. ROOM RADIO CONTINUOUS LOOP ("LaRadio.mp3" & "TENSION10.mp3")
  // =========================================================================
  private startRadioLoop() {
    this.playNextRadioTrack();
  }

  private playNextRadioTrack() {
    const src = this.radioTracks[this.currentRadioTrackIndex];
    this.radioAudio = new Audio(src);
    this.radioAudio.volume = this.isMuted ? 0 : this.radioBaseVol;
    this.radioAudio.preload = 'auto';

    const onFinish = () => {
      this.currentRadioTrackIndex = (this.currentRadioTrackIndex + 1) % this.radioTracks.length;
      this.playNextRadioTrack();
    };

    this.radioAudio.onended = onFinish;
    this.radioAudio.onerror = onFinish;

    if (!this.isMuted) {
      this.radioAudio.play().catch(() => {
        setTimeout(onFinish, 4000);
      });
    }
  }

  public updateRadioDistance(dist: number) {
    if (this.isMuted || this.isStopped || !this.radioAudio) {
      if (this.radioAudio) {
        this.radioAudio.volume = 0;
        if (!this.radioAudio.paused) {
          this.radioAudio.pause();
        }
      }
      return;
    }

    // Increased audible distance for the radio across the room
    // Close to desk (< 1.8m): volume 0.38
    // Across the room (1.8m - 6.5m): smooth attenuation 0.38 -> 0.04
    // Beyond 6.5m: 0
    let vol = 0;
    if (dist < 1.8) {
      vol = 0.38;
    } else if (dist < 6.5) {
      const t = (dist - 1.8) / 4.7;
      vol = 0.38 - t * 0.34;
    } else {
      vol = 0;
    }

    this.radioBaseVol = vol;
    this.radioAudio.volume = Math.max(0, Math.min(1, vol));
  }

  // =========================================================================
  // 8. 1-MINUTE REMAINING TENSION ("TENSION1.mp3")
  // =========================================================================
  public startOneMinuteTension() {
    if (this.isOneMinutePlaying) return;
    this.isOneMinutePlaying = true;

    try {
      if (!this.oneMinuteAudio) {
        this.oneMinuteAudio = new Audio('/audio/TENSION1.mp3');
        this.oneMinuteAudio.loop = true;
        this.oneMinuteAudio.volume = this.isMuted ? 0 : 0.70;
        this.oneMinuteAudio.preload = 'auto';
      }
      this.oneMinuteAudio.play().catch(() => {});
    } catch {
      // Ignore
    }
  }

  public stopOneMinuteTension() {
    this.isOneMinutePlaying = false;
    if (this.oneMinuteAudio) {
      this.oneMinuteAudio.pause();
      this.oneMinuteAudio.currentTime = 0;
    }
  }

  // =========================================================================
  // 9. PIBE DOOR VOICE CALLS ("AbrimeLaPuerta1..24.mp3")
  // =========================================================================
  public startPibeVoiceLoop() {
    if (this.isPibeVoiceActive) return;
    this.isPibeVoiceActive = true;
    this.refillPibeVoiceTracks();
    this.scheduleNextPibeVoice(1500);
  }

  private refillPibeVoiceTracks() {
    this.pibeVoiceAvailable = Array.from({ length: 24 }, (_, i) => i + 1);
    // Shuffle array
    for (let i = this.pibeVoiceAvailable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.pibeVoiceAvailable[i], this.pibeVoiceAvailable[j]] = [
        this.pibeVoiceAvailable[j],
        this.pibeVoiceAvailable[i],
      ];
    }
  }

  private scheduleNextPibeVoice(delayMs: number) {
    if (this.isStopped || !this.isPibeVoiceActive) return;
    if (this.pibeVoiceTimer) clearTimeout(this.pibeVoiceTimer);
    this.pibeVoiceTimer = window.setTimeout(() => {
      if (!this.isStopped && this.isPibeVoiceActive) {
        this.playNextPibeVoice();
      }
    }, delayMs);
  }

  private calculatePibeVoiceVolume(): number {
    if (this.isMuted || this.isStopped) return 0;
    if (this.isAtPeephole) return 1.0;

    let vol = 0.50;
    if (this.pibeVoiceDist < 2.0) {
      vol = 0.95;
    } else if (this.pibeVoiceDist < 5.0) {
      const t = (this.pibeVoiceDist - 2.0) / 3.0;
      vol = 0.95 - t * 0.30;
    } else {
      vol = 0.50;
    }
    return Math.max(0, Math.min(1, vol));
  }

  private playNextPibeVoice() {
    if (this.isStopped || !this.isPibeVoiceActive) return;

    if (this.pibeVoiceAvailable.length === 0) {
      this.refillPibeVoiceTracks();
    }

    const trackNum = this.pibeVoiceAvailable.pop() || 1;
    const src = `/audio/AbrimeLaPuerta${trackNum}.mp3`;

    const handleDone = () => {
      this.currentPibeSource = null;
      this.scheduleNextPibeVoice(2000);
    };

    const buffer = this.sfxBuffers.get(src) || this.sfxBuffers.get(encodeURI(src));
    if (this.ctx && this.masterGain && buffer) {
      try {
        if (this.currentPibeSource) {
          try { this.currentPibeSource.stop(); } catch {}
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        if (!this.pibeVoiceGain) {
          this.pibeVoiceGain = this.ctx.createGain();
          this.pibeVoiceGain.connect(this.masterGain);
        }

        const vol = this.calculatePibeVoiceVolume();
        this.pibeVoiceGain.gain.setValueAtTime(vol, this.ctx.currentTime);

        source.connect(this.pibeVoiceGain);
        source.onended = handleDone;
        this.currentPibeSource = source;
        source.start(0);
        return;
      } catch {
        // Fallback below
      }
    }

    try {
      this.pibeVoiceAudio = new Audio(encodeURI(src));
      const vol = this.calculatePibeVoiceVolume();
      this.pibeVoiceAudio.volume = vol;
      this.pibeVoiceAudio.preload = 'auto';

      this.pibeVoiceAudio.onended = handleDone;
      this.pibeVoiceAudio.onerror = handleDone;

      if (!this.isMuted) {
        this.pibeVoiceAudio.play().catch(() => {
          this.scheduleNextPibeVoice(2000);
        });
      } else {
        this.scheduleNextPibeVoice(2000);
      }
    } catch {
      this.scheduleNextPibeVoice(2000);
    }
  }

  public updatePibeDoorDistance(dist: number, isAtPeephole: boolean = false) {
    this.pibeVoiceDist = dist;
    this.isAtPeephole = isAtPeephole;
    this.updatePibeVoiceVolume();
  }

  public setPeepholeActive(active: boolean) {
    this.isAtPeephole = active;
    this.updatePibeVoiceVolume();
  }

  private updatePibeVoiceVolume() {
    const vol = this.calculatePibeVoiceVolume();

    if (this.pibeVoiceGain && this.ctx) {
      this.pibeVoiceGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }

    if (this.pibeVoiceAudio) {
      this.pibeVoiceAudio.volume = vol;
    }
  }

  // =========================================================================
  // 10. SCREAMER SOUND ("scream.mp3")
  // =========================================================================
  public playScream() {
    this.resume();
    const screamUrl = '/audio/scream.mp3';
    const buffer = this.sfxBuffers.get(screamUrl) || this.sfxBuffers.get('/audio/GRITO1.mp3');

    if (this.ctx && this.masterGain && buffer) {
      try {
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        src.buffer = buffer;
        gain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        src.connect(gain);
        gain.connect(this.masterGain);
        src.start(0);
        return;
      } catch {}
    }

    try {
      const screamAudio = new Audio(encodeURI(screamUrl));
      screamAudio.volume = 1.0;
      screamAudio.play().catch(() => {
        this.playJumpscareScreamer();
      });
    } catch {
      this.playJumpscareScreamer();
    }
  }

  // =========================================================================
  // 11. FUSE BOX / DIAL SWITCH CLICK SOUND ("ClickPerilla.mp3")
  // =========================================================================
  public playSwitchClick() {
    this.playZeroLatencySFX('/audio/ClickPerilla.mp3', this.switchClickAudio, 0.85);
  }

  // =========================================================================
  // 12. PAPER INTERACTION SOUND ("Papel.mp3")
  // =========================================================================
  public playPaperSound() {
    this.playZeroLatencySFX('/audio/Papel.mp3', this.paperAudio, 0.85);
  }

  // =========================================================================
  // LEGACY & WEB AUDIO UTILITIES
  // =========================================================================
  public startBackgroundMusic() {
    if (this.isMuted) return;

    if (!this.bgmAudio) {
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
        console.warn('the_illuminato error, fallback to illuminato.wav:', e);
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
        console.warn('Autoplay waiting for user gesture:', err);
      });
    }
  }

  public startCeilingFocoSound() {
    if (!this.focoAudio) {
      this.focoAudio = new Audio('/audio/sonido_foco.wav');
      this.focoAudio.loop = true;
      this.focoAudio.volume = this.isMuted ? 0 : 0.008;
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

  public syncCeilingLight(lightIntensity: number, isFlickerDip: boolean) {
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
      // Procedural fallback
    }
  }

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
      console.warn('Could not decode llanto.wav buffer:', e);
    }
  }

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

  public updateSinkCryAudio(distToSink: number, pan: number = 0, isDoorOpen: boolean = false) {
    if (this.isMuted || this.isStopped) {
      if (this.crySource) {
        try { this.crySource.stop(); } catch {}
        this.crySource = null;
      }
      if (this.cryGain && this.ctx) {
        try { this.cryGain.gain.setValueAtTime(0, this.ctx.currentTime); } catch {}
      }
      this.isCryPlaying = false;
      if (this.bathroomCryAudio) {
        this.bathroomCryAudio.volume = 0;
        if (!this.bathroomCryAudio.paused) {
          this.bathroomCryAudio.pause();
        }
      }
      return;
    }

    let baseVolume = 0;
    if (distToSink < 1.5) {
      baseVolume = 0.85;
    } else if (distToSink < 4.5) {
      const t = (distToSink - 1.5) / 3.0;
      baseVolume = 0.85 - t * 0.35;
    } else if (distToSink < 8.0) {
      const t = (distToSink - 4.5) / 3.5;
      baseVolume = 0.50 - t * 0.32;
    } else if (distToSink < 13.0) {
      const t = (distToSink - 8.0) / 5.0;
      baseVolume = 0.18 - t * 0.15;
    } else {
      baseVolume = 0.02;
    }

    if (!isDoorOpen && distToSink > 3.8) {
      baseVolume *= 0.40;
    }

    if (this.ctx && this.cryGain && this.isCryPlaying) {
      const now = this.ctx.currentTime;
      this.cryGain.gain.setTargetAtTime(baseVolume, now, 0.08);
      if (this.cryPanner) {
        this.cryPanner.pan.setTargetAtTime(pan, now, 0.06);
      }
    } else {
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

  public updateBathroomDistance(distanceToBathroom: number) {
    this.updateSinkCryAudio(distanceToBathroom, 0, true);
  }

  public playDoorKnocks(volumeFactor: number = 0.85) {
    if (this.isMuted) return;
    this.resume();

    this.knockListeners.forEach((fn) => {
      try {
        setTimeout(fn, 0);
      } catch {
        // Ignore
      }
    });

    const knockUrls = ['/audio/golpes_puerta.mp3', '/audio/TocanPuerta.mp3'];
    const chosenUrl = knockUrls[Math.floor(Math.random() * knockUrls.length)];
    const buffer = this.sfxBuffers.get(chosenUrl) || this.sfxBuffers.get('/audio/golpes_puerta.mp3') || this.doorBuffer;

    if (this.ctx && this.masterGain && buffer) {
      try {
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        src.buffer = buffer;
        src.playbackRate.setValueAtTime(0.95 + Math.random() * 0.10, this.ctx.currentTime);
        const finalVol = Math.max(0.35, Math.min(1.0, volumeFactor * 0.95));
        gain.gain.setValueAtTime(finalVol, this.ctx.currentTime);
        src.connect(gain);
        gain.connect(this.masterGain);
        src.start(0);
        return;
      } catch {
        // Fallback below
      }
    }

    try {
      const knockAudio = new Audio(encodeURI(chosenUrl));
      knockAudio.volume = Math.max(0.25, Math.min(1.0, volumeFactor * 0.95));
      const p = knockAudio.play();
      if (p !== undefined) {
        p.catch(() => {
          this.synthesizeDoorKnocks(volumeFactor);
        });
      }
    } catch {
      this.synthesizeDoorKnocks(volumeFactor);
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

      this.droneOsc.type = 'sine';
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
    if (this.ambientHorrorTimer) clearTimeout(this.ambientHorrorTimer);
    if (this.pibeVoiceTimer) clearTimeout(this.pibeVoiceTimer);

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
    if (this.fridgeMotorAudio) {
      this.fridgeMotorAudio.pause();
      this.fridgeMotorAudio = null;
    }
    if (this.radioAudio) {
      this.radioAudio.pause();
      this.radioAudio = null;
    }
    if (this.oneMinuteAudio) {
      this.oneMinuteAudio.pause();
      this.oneMinuteAudio = null;
    }
    if (this.ambientHorrorAudio) {
      this.ambientHorrorAudio.pause();
      this.ambientHorrorAudio = null;
    }
    if (this.pibeVoiceAudio) {
      this.pibeVoiceAudio.pause();
      this.pibeVoiceAudio = null;
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
