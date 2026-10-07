/**
 * Escape From "The Pibe" Room - Game Types & Interfaces
 */

export interface SensorsState {
  gyroscopeAllowed: boolean;
  micAllowed: boolean;
  cameraAllowed: boolean;
  hasDeviceOrientation: boolean;
  useGyro: boolean;
  audioActive: boolean;
}

export interface OrientationData {
  alpha: number; // Z-axis rotation (0-360)
  beta: number;  // X-axis tilt (-180 to 180)
  gamma: number; // Y-axis tilt (-90 to 90)
}

export interface AudioMetrics {
  volume: number;    // 0.0 to 1.0
  bassLevel: number; // 0.0 to 1.0
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface LockState {
  keyLock: boolean;       // Opened with rusted brass key
  codeLock: boolean;      // Opened with 4-digit code (1986)
  fuseLock: boolean;      // Opened by fixing electrical fuse box
  allChainsRemoved: boolean;
}

export type InteractiveTargetId =
  | 'main_door'
  | 'door_peephole'
  | 'rotten_fridge'
  | 'study_desk'
  | 'fuse_box'
  | 'vintage_radio'
  | 'wall_graffiti'
  | null;

export interface InteractiveObject {
  id: InteractiveTargetId;
  title: string;
  actionText: string;
  distance: number;
}
