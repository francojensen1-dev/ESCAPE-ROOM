/**
 * Sensor Manager
 * Handles:
 * 1. DeviceOrientationEvent (iOS 13+ permission request + Android/Chrome fallback)
 * 2. Lerp smoothing for pitch, yaw, roll
 * 3. Haptic vibration (navigator.vibrate)
 * 4. WebRTC Camera (navigator.mediaDevices.getUserMedia)
 */

import { OrientationData } from '../types/game';

export type OrientationCallback = (data: OrientationData) => void;

export class SensorManager {
  private rawOrientation: OrientationData = { alpha: 0, beta: 0, gamma: 0 };
  private smoothedOrientation: OrientationData = { alpha: 0, beta: 0, gamma: 0 };
  private initialOrientation: OrientationData | null = null;
  private hasSensorData: boolean = false;
  private isListening: boolean = false;
  private callbacks: Set<OrientationCallback> = new Set();
  private smoothingFactor: number = 0.15; // Lerp factor
  private cameraStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  constructor() {
    this.handleOrientationEvent = this.handleOrientationEvent.bind(this);
    this.onOrientationChange = this.onOrientationChange.bind(this);
    this.updateSmoothing = this.updateSmoothing.bind(this);
    this.vibrate = this.vibrate.bind(this);
    this.recenter = this.recenter.bind(this);
    this.startListening = this.startListening.bind(this);
    this.stopListening = this.stopListening.bind(this);
  }

  /**
   * Request DeviceOrientation permissions (required for iOS 13+)
   */
  public async requestOrientationPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const DeviceOrientationEventAny = (window as unknown as { DeviceOrientationEvent?: unknown })
        ?.DeviceOrientationEvent as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      } | undefined;

      if (typeof DeviceOrientationEventAny?.requestPermission === 'function') {
        const permissionState = await DeviceOrientationEventAny.requestPermission();
        if (permissionState === 'granted') {
          this.startListening();
          return true;
        }
        return false;
      } else if ('DeviceOrientationEvent' in window) {
        // Android / non-iOS standard browsers
        this.startListening();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Orientation permission error:', err);
      return false;
    }
  }

  public startListening = () => {
    if (typeof window === 'undefined' || this.isListening) return;
    try {
      window.addEventListener('deviceorientation', this.handleOrientationEvent, true);
      this.isListening = true;
    } catch {
      // Ignore
    }
  };

  public stopListening = () => {
    if (typeof window === 'undefined' || !this.isListening) return;
    try {
      window.removeEventListener('deviceorientation', this.handleOrientationEvent, true);
      this.isListening = false;
    } catch {
      // Ignore
    }
  };

  private handleOrientationEvent(event: DeviceOrientationEvent) {
    if (event.alpha === null && event.beta === null && event.gamma === null) {
      return;
    }

    this.hasSensorData = true;

    const alpha = event.alpha ?? 0; // 0..360
    const beta = event.beta ?? 0;   // -180..180
    const gamma = event.gamma ?? 0; // -90..90

    if (!this.initialOrientation) {
      this.initialOrientation = { alpha, beta, gamma };
    }

    this.rawOrientation = { alpha, beta, gamma };
  }

  /**
   * Called every frame to smooth orientation using Lerp
   */
  public updateSmoothing = (): OrientationData => {
    // Shortest angular difference for circular alpha (0..360)
    let diffAlpha = (this.rawOrientation.alpha - this.smoothedOrientation.alpha) % 360;
    if (diffAlpha > 180) diffAlpha -= 360;
    if (diffAlpha < -180) diffAlpha += 360;
    this.smoothedOrientation.alpha = (this.smoothedOrientation.alpha + diffAlpha * this.smoothingFactor) % 360;
    if (this.smoothedOrientation.alpha < 0) this.smoothedOrientation.alpha += 360;

    this.smoothedOrientation.beta +=
      (this.rawOrientation.beta - this.smoothedOrientation.beta) * this.smoothingFactor;
    this.smoothedOrientation.gamma +=
      (this.rawOrientation.gamma - this.smoothedOrientation.gamma) * this.smoothingFactor;

    this.callbacks.forEach((cb) => {
      try {
        cb(this.smoothedOrientation);
      } catch {
        // Safe callback execution
      }
    });
    return this.smoothedOrientation;
  };

  public getOrientation = (): OrientationData => {
    return this.smoothedOrientation;
  };

  public getRawOrientation = (): OrientationData => {
    return this.rawOrientation;
  };

  public hasOrientationSupport = (): boolean => {
    return this.hasSensorData;
  };

  public recenter = () => {
    this.initialOrientation = { ...this.rawOrientation };
    this.smoothedOrientation = { ...this.rawOrientation };
  };

  public onOrientationChange = (cb: OrientationCallback): (() => void) => {
    if (typeof cb === 'function') {
      this.callbacks.add(cb);
    }
    return () => {
      this.callbacks.delete(cb);
    };
  };

  /**
   * Haptic vibration feedback
   */
  public vibrate = (pattern: number | number[]) => {
    try {
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore vibration error on unsupported platforms
    }
  };

  /**
   * Request WebRTC Camera stream
   */
  public async requestCamera(): Promise<HTMLVideoElement | null> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return null;
    }

    try {
      if (this.cameraStream && this.videoElement) {
        return this.videoElement;
      }

      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true;
      this.videoElement.srcObject = this.cameraStream;
      await this.videoElement.play();

      return this.videoElement;
    } catch (err) {
      console.warn('Camera request denied or unavailable:', err);
      return null;
    }
  }

  public stopCamera = () => {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  };

  public dispose = () => {
    this.stopListening();
    this.stopCamera();
    this.callbacks.clear();
  };
}

export const sensorManager = new SensorManager();
export default sensorManager;
