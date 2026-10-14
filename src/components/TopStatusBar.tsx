/**
 * Top Status Bar Component
 * Displays:
 * - Brand wordmark: ESCAPE: THE PIBE
 * - Sensor Indicators: Gyroscope active, Audio Engine status, Flashlight
 * - 15-Minute Countdown Timer with tension meter
 * - Recenter orientation control
 */

import React, { useRef } from 'react';
import { Compass, Volume2, VolumeX, Flashlight, RefreshCw, Key, ShieldAlert, Music } from 'lucide-react';
import { AudioMetrics, SensorsState, InventoryItem } from '../types/game';
import { horrorAudio } from '../audio/HorrorAudioManager';

interface TopStatusBarProps {
  sensors: SensorsState;
  audioMetrics: AudioMetrics;
  timeLeft: number; // in seconds (max 900)
  isFlashlightOn: boolean;
  inventory: InventoryItem[];
  onToggleFlashlight: () => void;
  onToggleAudioMute: () => void;
  onRecenterCamera: () => void;
  onOpenInventory: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  sensors,
  audioMetrics,
  timeLeft,
  isFlashlightOn,
  inventory,
  onToggleFlashlight,
  onToggleAudioMute,
  onRecenterCamera,
  onOpenInventory,
}) => {
  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLowTime = timeLeft < 180; // under 3 minutes
  const isCriticalTime = timeLeft < 60;
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-3 py-2.5 sm:px-5 sm:py-3 bg-stone-950/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between pointer-events-auto">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-2">
        <span className="text-sm sm:text-base font-bold tracking-wider text-stone-200 uppercase font-mono">
          THE PIBE ROOM
        </span>
      </div>

      {/* Zone 2: Timer & Tension Indicator */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
            isCriticalTime
              ? 'border-red-600/70 bg-red-950/40 text-red-400 animate-pulse'
              : isLowTime
              ? 'border-amber-600/60 bg-amber-950/30 text-amber-300'
              : 'border-stone-800 bg-stone-900/60 text-stone-300'
          }`}
        >
          <ShieldAlert className={`w-3.5 h-3.5 ${isCriticalTime ? 'text-red-500' : 'text-stone-400'}`} />
          <span className="text-xs sm:text-sm font-mono font-bold tabular-nums">
            {timeFormatted}
          </span>
        </div>

        {/* Audio Reactive Vumeter */}
        <div className="hidden sm:flex items-center gap-0.5 h-4 px-1.5 bg-stone-900/60 border border-stone-800 rounded">
          {[0.1, 0.25, 0.45, 0.7, 0.9].map((threshold, i) => (
            <div
              key={i}
              style={{
                height: `${Math.max(3, Math.min(14, audioMetrics.volume * 16 * (i + 1) * 0.4))}px`,
              }}
              className={`w-1 rounded-xs transition-all duration-75 ${
                audioMetrics.volume > threshold
                  ? i > 3
                    ? 'bg-red-500'
                    : 'bg-emerald-500'
                  : 'bg-stone-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Zone 3: Actions & Sensors */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Gyroscope Indicator Button */}
        <button
          onClick={onRecenterCamera}
          title={sensors.hasDeviceOrientation ? 'Giroscopio Activo (Toca para centrar)' : 'Giroscopio Inactivo'}
          className={`p-1.5 sm:p-2 rounded border text-xs flex items-center gap-1 transition-colors ${
            sensors.hasDeviceOrientation
              ? 'border-emerald-600/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
              : 'border-stone-800 bg-stone-900/40 text-stone-500'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px] font-mono">
            {sensors.hasDeviceOrientation ? 'GYRO ON' : 'TOUCH'}
          </span>
        </button>

        {/* Flashlight Toggle */}
        <button
          onClick={onToggleFlashlight}
          title="Alternar Linterna"
          className={`p-1.5 sm:p-2 rounded border transition-colors ${
            isFlashlightOn
              ? 'border-amber-500/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
              : 'border-stone-800 bg-stone-900/40 text-stone-500 hover:text-stone-300'
          }`}
        >
          <Flashlight className="w-3.5 h-3.5" />
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={onToggleAudioMute}
          title="Alternar Sonido"
          className="p-1.5 sm:p-2 rounded border border-stone-800 bg-stone-900/40 text-stone-300 hover:text-white hover:border-stone-700 transition-colors"
        >
          {sensors.audioActive ? <Volume2 className="w-3.5 h-3.5 text-stone-200" /> : <VolumeX className="w-3.5 h-3.5 text-stone-500" />}
        </button>

        {/* Custom Background Music Uploader Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Cargar tu archivo de música (.mp3 / .wav)"
          className="p-1.5 sm:p-2 rounded border border-amber-600/40 bg-amber-950/25 text-amber-300 hover:text-amber-200 hover:border-amber-500 hover:bg-amber-900/40 transition-colors flex items-center gap-1"
        >
          <Music className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[10px] font-mono">CAMBIAR AUDIO</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              horrorAudio.setCustomAudioFile(file);
            }
          }}
        />

        {/* Recenter Camera Button */}
        <button
          onClick={onRecenterCamera}
          title="Centrar Cámara"
          className="p-1.5 sm:p-2 rounded border border-stone-800 bg-stone-900/40 text-stone-300 hover:text-white hover:border-stone-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Inventory Shortcut */}
        <button
          onClick={onOpenInventory}
          className="relative p-1.5 sm:p-2 rounded border border-stone-800 bg-stone-900/40 text-stone-300 hover:text-white hover:border-stone-700 transition-colors"
          title="Inventario"
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          {inventory.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
              {inventory.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
