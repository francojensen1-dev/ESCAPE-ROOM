/**
 * Sensor Manager
 * Handles:
 * 1. DeviceOrientationEvent (iOS 13+ permission request + Android/Chrome fallback)
 * 2. Lerp smoothing for pitch, yaw, roll
 * 3. Haptic vibration (navigator.vibrate)
 * 4. WebRTC Camera (navigator.mediaDevices.getUserMedia)
 */

import * as THREE from 'three';
import { OrientationData } from '../types/game';

export type OrientationCallback = (data: OrientationData) => void;

export class SensorManager {
  private rawOrientation: OrientationData = { alpha: 0, beta: 0, gamma: 0 };
  private smoothedOrientation: OrientationData = { alpha: 0, beta: 0, gamma: 0 };
  private hasSensorData: boolean = false;
  private isListening: boolean = false;
  private callbacks: Set<OrientationCallback> = new Set();

  // Sensitivity and Axis Inversions
  private sensitivity: number = 1.0;
  private invertYaw: boolean = false;
  private invertPitch: boolean = false;

  // Unwrapped Angle Tracking for continuous 360-degree rotation without modulus snapping
  private hasReceivedFirstEvent: boolean = false;
  private lastRawYaw: number = 0;
  private unwrappedYaw: number = 0;
  private unwrappedPitch: number = 0;
  private calibratedYaw: number = 0;
  private calibratedPitch: number = 0;
  private pendingRecenter: boolean = true;

  // Target relative angles (radians)
  private targetYaw: number = 0;
  private targetPitch: number = 0;
  private smoothedYaw: number = 0;
  private smoothedPitch: number = 0;

  // Reusable Three.js math objects to avoid garbage collection churn
  private readonly zee = new THREE.Vector3(0, 0, 1);
  private readonly euler = new THREE.Euler();
  private readonly q0 = new THREE.Quaternion();
  private readonly q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -90 deg around X
  private readonly deviceQuat = new THREE.Quaternion();
  private readonly forwardVec = new THREE.Vector3();

  // WebRTC Camera
  private cameraStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  constructor() {
    this.handleOrientationEvent = this.handleOrientationEvent.bind(this);
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
        // Android / standard desktop browsers
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

  /**
   * Processes raw mobile DeviceOrientationEvent:
   * 1. Converts (alpha, beta, gamma) into a 3D Device Quaternion (eliminating Euler gimbal lock at 90 deg tilt).
   * 2. Extracts forward look vector in 3D world space.
   * 3. Continuously unwraps yaw across the -PI..PI boundary so the player can spin 360 degrees indefinitely.
   */
  private handleOrientationEvent(event: DeviceOrientationEvent) {
    if (event.alpha === null && event.beta === null && event.gamma === null) {
      return;
    }

    this.hasSensorData = true;

    const alpha = event.alpha ?? 0;
    const beta = event.beta ?? 0;
    const gamma = event.gamma ?? 0;
    this.rawOrientation = { alpha, beta, gamma };

    const degToRad = Math.PI / 180;
    const a = alpha * degToRad;
    const b = beta * degToRad;
    const g = gamma * degToRad;

    // Screen orientation angle (0 for portrait, 90/-90 for landscape)
    let screenAngleDeg = 0;
    if (typeof window !== 'undefined') {
      if (window.screen?.orientation?.angle !== undefined) {
        screenAngleDeg = window.screen.orientation.angle;
      } else if (typeof window.orientation === 'number') {
        screenAngleDeg = window.orientation;
      }
    }
    const screenAngleRad = screenAngleDeg * degToRad;

    // Convert W3C Device Orientation angles to 3D Device Quaternion (no gimbal lock)
    this.euler.set(b, a, -g, 'YXZ');
    this.deviceQuat.setFromEuler(this.euler);
    this.deviceQuat.multiply(this.q1);
    this.q0.setFromAxisAngle(this.zee, -screenAngleRad);
    this.deviceQuat.multiply(this.q0);

    // Compute forward looking direction in world space (camera looks down -Z)
    this.forwardVec.set(0, 0, -1).applyQuaternion(this.deviceQuat);

    // Raw Heading Yaw in (-PI, PI] and Pitch in (-PI/2, PI/2)
    const currentRawYaw = Math.atan2(-this.forwardVec.x, -this.forwardVec.z);
    const currentRawPitch = Math.asin(Math.max(-0.999, Math.min(0.999, this.forwardVec.y)));

    if (!this.hasReceivedFirstEvent) {
      this.hasReceivedFirstEvent = true;
      this.lastRawYaw = currentRawYaw;
      this.unwrappedYaw = currentRawYaw;
      this.unwrappedPitch = currentRawPitch;
      this.calibratedYaw = this.unwrappedYaw;
      this.calibratedPitch = this.unwrappedPitch;
      this.pendingRecenter = false;
      this.targetYaw = 0;
      this.targetPitch = 0;
      this.smoothedYaw = 0;
      this.smoothedPitch = 0;
    } else {
      // Small delta angle between successive events with [-PI, PI] wrapping protection
      let deltaYaw = currentRawYaw - this.lastRawYaw;
      while (deltaYaw > Math.PI) deltaYaw -= 2 * Math.PI;
      while (deltaYaw < -Math.PI) deltaYaw += 2 * Math.PI;
      this.lastRawYaw = currentRawYaw;

      // Accumulate into continuous unwrappedYaw (allows infinite 360-degree rotation)
      this.unwrappedYaw += deltaYaw;
      this.unwrappedPitch = currentRawPitch;

      if (this.pendingRecenter) {
        this.calibratedYaw = this.unwrappedYaw;
        this.calibratedPitch = this.unwrappedPitch;
        this.pendingRecenter = false;
        this.targetYaw = 0;
        this.targetPitch = 0;
        this.smoothedYaw = 0;
        this.smoothedPitch = 0;
      } else {
        this.targetYaw = this.unwrappedYaw - this.calibratedYaw;
        this.targetPitch = this.unwrappedPitch - this.calibratedPitch;
      }
    }
  }

  /**
   * Called every frame to smooth orientation using Lerp filter
   */
  public updateSmoothing = (): OrientationData => {
    // Smooth target relative angles with exponential lerp factor (balanced for responsiveness & stability)
    const lerpFactor = 0.22;
    this.smoothedYaw += (this.targetYaw - this.smoothedYaw) * lerpFactor;
    this.smoothedPitch += (this.targetPitch - this.smoothedPitch) * lerpFactor;

    this.smoothedOrientation = {
      alpha: (this.smoothedYaw * 180) / Math.PI,
      beta: (this.smoothedPitch * 180) / Math.PI,
      gamma: 0,
    };

    this.callbacks.forEach((cb) => {
      try {
        cb(this.smoothedOrientation);
      } catch {
        // Safe callback execution
      }
    });

    return this.smoothedOrientation;
  };

  /**
   * Returns calculated yaw, pitch, roll in radians relative to calibrated baseline
   * Scaled by user-defined sensitivity and axis inversion settings
   */
  public getRelativeAnglesRad = (): { yaw: number; pitch: number; roll: number } => {
    const yaw = (this.invertYaw ? -1 : 1) * this.smoothedYaw * this.sensitivity;
    const pitch = (this.invertPitch ? -1 : 1) * this.smoothedPitch * this.sensitivity;
    return { yaw, pitch, roll: 0 };
  };

  public setSensitivity = (val: number) => {
    this.sensitivity = Math.max(0.2, Math.min(3.0, val));
  };

  public getSensitivity = (): number => {
    return this.sensitivity;
  };

  public setInvertYaw = (inverted: boolean) => {
    this.invertYaw = inverted;
  };

  public getInvertYaw = (): boolean => {
    return this.invertYaw;
  };

  public setInvertPitch = (inverted: boolean) => {
    this.invertPitch = inverted;
  };

  public getInvertPitch = (): boolean => {
    return this.invertPitch;
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

  /**
   * Calibrate current device orientation to be (0, 0, 0)
   * Ensures camera faces straight ahead at the chained door
   */
  public recenter = () => {
    this.pendingRecenter = true;
    if (this.hasReceivedFirstEvent) {
      this.calibratedYaw = this.unwrappedYaw;
      this.calibratedPitch = this.unwrappedPitch;
      this.targetYaw = 0;
      this.targetPitch = 0;
      this.smoothedYaw = 0;
      this.smoothedPitch = 0;
      this.pendingRecenter = false;
    }
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
