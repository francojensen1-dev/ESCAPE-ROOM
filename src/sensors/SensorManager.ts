/**
 * Sensor Manager for Landscape Horizontal Mobile Gyroscope
 * Implements:
 * 1. Standard kinematic DeviceOrientation to Camera Quaternion conversion.
 * 2. Automatic screen orientation compensation for 90° and -90° (270°) landscape.
 * 3. Silky-smooth spherical quaternion interpolation (slerp) without gimbal lock.
 * 4. Instant yaw recentering and fine-touch heading calibration.
 * 5. Haptic vibration (navigator.vibrate).
 */

import * as THREE from 'three';
import { OrientationData } from '../types/game';

type QuaternionCallback = (quat: THREE.Quaternion) => void;

class SensorManager {
  private rawOrientation: OrientationData = { alpha: 0, beta: 0, gamma: 0 };
  private hasSensorData: boolean = false;
  private isListening: boolean = false;
  private callbacks: Set<QuaternionCallback> = new Set();

  // Mathematical orientation matrices
  private readonly _zee = new THREE.Vector3(0, 0, 1);
  private readonly _euler = new THREE.Euler();
  private readonly _q0 = new THREE.Quaternion();
  private readonly _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -PI/2 around X

  private targetQuat = new THREE.Quaternion();
  private smoothedQuat = new THREE.Quaternion();
  private yawOffset: number = 0; // heading offset for recentering
  private slerpFactor: number = 0.16; // Slerp smoothing factor
  private screenAngle: number = 90; // Default landscape angle
  private hasInitializedYaw: boolean = false;

  private cameraStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  constructor() {
    this.handleOrientationEvent = this.handleOrientationEvent.bind(this);
    this.updateScreenAngle = this.updateScreenAngle.bind(this);

    if (typeof window !== 'undefined') {
      this.updateScreenAngle();
      window.addEventListener('orientationchange', this.updateScreenAngle);
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.addEventListener('change', this.updateScreenAngle);
      }
    }
  }

  private updateScreenAngle() {
    if (typeof window === 'undefined') return;

    let angle = 0;
    if (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === 'number') {
      angle = window.screen.orientation.angle;
    } else if (typeof window.orientation === 'number') {
      angle = window.orientation;
    }

    // In desktop or ambiguous states, prefer 90 if width > height
    if (angle === 0 && window.innerWidth > window.innerHeight) {
      angle = 90;
    }

    this.screenAngle = angle;
  }

  public getScreenAngle(): number {
    return this.screenAngle;
  }

  public isLandscape(): boolean {
    if (typeof window === 'undefined') return true;
    return window.innerWidth > window.innerHeight;
  }

  /**
   * Request DeviceOrientation permissions (required for iOS 13+)
   */
  public async requestOrientationPermission(): Promise<boolean> {
    try {
      const DeviceOrientationEventAny = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };

      if (typeof DeviceOrientationEventAny.requestPermission === 'function') {
        const permissionState = await DeviceOrientationEventAny.requestPermission();
        if (permissionState === 'granted') {
          this.startListening();
          return true;
        }
        return false;
      } else if ('DeviceOrientationEvent' in window) {
        this.startListening();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Orientation permission error:', err);
      return false;
    }
  }

  public startListening() {
    if (this.isListening) return;
    this.updateScreenAngle();
    window.addEventListener('deviceorientation', this.handleOrientationEvent, true);
    this.isListening = true;
  }

  public stopListening() {
    if (!this.isListening) return;
    window.removeEventListener('deviceorientation', this.handleOrientationEvent, true);
    this.isListening = false;
  }

  private handleOrientationEvent(event: DeviceOrientationEvent) {
    if (event.alpha === null && event.beta === null && event.gamma === null) {
      return;
    }

    this.hasSensorData = true;

    const alpha = event.alpha ?? 0; // 0..360
    const beta = event.beta ?? 0;   // -180..180
    const gamma = event.gamma ?? 0; // -90..90

    this.rawOrientation = { alpha, beta, gamma };

    // Calculate Device Orientation Quaternion with screen orientation compensation
    const degToRad = Math.PI / 180;
    const alphaRad = alpha * degToRad;
    const betaRad = beta * degToRad;
    const gammaRad = gamma * degToRad;
    const orientRad = this.screenAngle * degToRad;

    // Standard device orientation Euler order 'YXZ'
    this._euler.set(betaRad, alphaRad, -gammaRad, 'YXZ');
    this.targetQuat.setFromEuler(this._euler);
    this.targetQuat.multiply(this._q1); // Orient camera looking out back of phone
    this.targetQuat.multiply(this._q0.setFromAxisAngle(this._zee, -orientRad)); // Compensate screen orientation

    // First time receiving sensor data: auto-recenter forward
    if (!this.hasInitializedYaw) {
      this.recenter();
      this.hasInitializedYaw = true;
    }
  }

  /**
   * Called every frame to smooth orientation using Spherical Linear Interpolation (Slerp)
   */
  public updateSmoothing(): THREE.Quaternion {
    if (!this.hasSensorData) {
      return this.smoothedQuat;
    }

    // Apply yawOffset (heading adjustment for recentering)
    const finalTarget = new THREE.Quaternion();
    const yawRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -this.yawOffset);
    finalTarget.multiplyQuaternions(yawRot, this.targetQuat);

    // Smooth slerp towards finalTarget
    this.smoothedQuat.slerp(finalTarget, this.slerpFactor);

    this.callbacks.forEach((cb) => cb(this.smoothedQuat));
    return this.smoothedQuat;
  }

  public getQuaternion(): THREE.Quaternion {
    return this.smoothedQuat;
  }

  public getRawOrientation(): OrientationData {
    return this.rawOrientation;
  }

  public hasOrientationSupport(): boolean {
    return this.hasSensorData;
  }

  /**
   * Recenter camera forward direction to 0 yaw (looking at the main door)
   */
  public recenter() {
    this.updateScreenAngle();

    // Extract current horizontal yaw from targetQuat
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.targetQuat);
    forward.y = 0;
    forward.normalize();

    // Current yaw angle
    this.yawOffset = Math.atan2(forward.x, -forward.z);

    // Snap smoothed quaternion directly to current recentered orientation
    const yawRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -this.yawOffset);
    this.smoothedQuat.multiplyQuaternions(yawRot, this.targetQuat);
  }

  /**
   * Fine horizontal adjustment from touch drag
   */
  public adjustYaw(deltaRadians: number) {
    this.yawOffset += deltaRadians;
  }

  public onQuaternionChange(cb: QuaternionCallback) {
    this.callbacks.add(cb);
    return () => {
      this.callbacks.delete(cb);
    };
  }

  /**
   * Haptic vibration feedback
   */
  public vibrate(pattern: number | number[]) {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore vibration error on unsupported platforms
    }
  }

  /**
   * Request WebRTC Camera stream
   */
  public async requestCamera(): Promise<HTMLVideoElement | null> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
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

  public stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  public dispose() {
    this.stopListening();
    this.stopCamera();
    this.callbacks.clear();
    if (typeof window !== 'undefined') {
      window.removeEventListener('orientationchange', this.updateScreenAngle);
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', this.updateScreenAngle);
      }
    }
  }
}

export const sensorManager = new SensorManager();
