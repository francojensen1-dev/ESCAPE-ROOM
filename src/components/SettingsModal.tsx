/**
 * Settings & Options Modal (Configuración del Escape Room)
 * Allows calibrating gyroscope sensitivity, inverting axes,
 * toggling gyro/touch mode, and recalibrating center orientation.
 */

import React, { useState } from 'react';
import { X, Compass, Sliders, Check, RefreshCw, Eye, Flashlight, Hand, Volume2 } from 'lucide-react';
import { sensorManager } from '../sensors/SensorManager';
import { horrorAudio } from '../audio/HorrorAudioManager';

interface SettingsModalProps {
  useGyro: boolean;
  gyroSensitivity: number;
  invertX: boolean;
  invertY: boolean;
  onToggleGyro: (enabled: boolean) => void;
  onChangeSensitivity: (val: number) => void;
  onToggleInvertX: (inverted: boolean) => void;
  onToggleInvertY: (inverted: boolean) => void;
  onRecenter: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  useGyro,
  gyroSensitivity,
  invertX,
  invertY,
  onToggleGyro,
  onChangeSensitivity,
  onToggleInvertX,
  onToggleInvertY,
  onRecenter,
  onClose,
}) => {
  const [calibratedNotice, setCalibratedNotice] = useState(false);

  const handleRecenterClick = () => {
    onRecenter();
    sensorManager.vibrate([60, 40, 80]);
    horrorAudio.playUnlockClick();
    setCalibratedNotice(true);
    setTimeout(() => setCalibratedNotice(false), 2000);
  };

  const getSensitivityLabel = (val: number) => {
    if (val < 0.6) return 'Baja (Muy suave)';
    if (val < 1.3) return 'Normal (Equilibrada)';
    if (val < 2.0) return 'Alta (Rápida)';
    return 'Extrema (Muy sensible)';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-stone-200 font-bold">
              OPCIONES Y SENSIBILIDAD
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 bg-stone-950/70 max-h-[75vh] overflow-y-auto">
          {/* Gyroscope Toggle */}
          <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Compass className={`w-5 h-5 ${useGyro ? 'text-emerald-400' : 'text-stone-500'}`} />
              <div>
                <p className="text-xs font-semibold text-stone-200">Giroscopio del Celular</p>
                <p className="text-[11px] text-stone-400">
                  {useGyro ? 'Controla la mirada moviendo el teléfono' : 'Solo arrastre táctil / mouse'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sensorManager.vibrate(40);
                onToggleGyro(!useGyro);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                useGyro ? 'bg-emerald-600' : 'bg-stone-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  useGyro ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Gyroscope Sensitivity Slider */}
          <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-200 flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-500" />
                Sensibilidad del Giroscopio
              </span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded">
                {gyroSensitivity.toFixed(1)}x
              </span>
            </div>

            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={gyroSensitivity}
              onChange={(e) => onChangeSensitivity(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-stone-800 h-2 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
              <span>0.2x (Suave)</span>
              <span className="text-stone-300 font-semibold">{getSensitivityLabel(gyroSensitivity)}</span>
              <span>3.0x (Rápido)</span>
            </div>
          </div>

          {/* Invert Axis X (Horizontal) Toggle */}
          <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-200">Invertir Eje X (Horizontal: Izq / Der)</p>
              <p className="text-[11px] text-stone-400">
                {invertX ? 'Giro horizontal invertido' : 'Giro horizontal natural'}
              </p>
            </div>
            <button
              onClick={() => {
                sensorManager.vibrate(30);
                onToggleInvertX(!invertX);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                invertX ? 'bg-amber-600' : 'bg-stone-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  invertX ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Invert Axis Y (Vertical) Toggle */}
          <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-200">Invertir Eje Y (Vertical: Arriba / Abajo)</p>
              <p className="text-[11px] text-stone-400">
                {invertY ? 'Mirada vertical invertida' : 'Mirada vertical natural'}
              </p>
            </div>
            <button
              onClick={() => {
                sensorManager.vibrate(30);
                onToggleInvertY(!invertY);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                invertY ? 'bg-amber-600' : 'bg-stone-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  invertY ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Recenter & Calibrate Button */}
          <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60 space-y-2">
            <button
              onClick={handleRecenterClick}
              className="w-full py-2.5 px-4 rounded-lg bg-stone-800 hover:bg-stone-700 active:scale-98 text-amber-300 font-mono text-xs font-bold flex items-center justify-center gap-2 border border-amber-500/40 transition-all shadow-md"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>CENTRAR Y CALIBRAR ORIENTACIÓN AHORA</span>
            </button>
            {calibratedNotice && (
              <p className="text-[11px] font-mono text-emerald-400 text-center flex items-center justify-center gap-1 animate-pulse">
                <Check className="w-3.5 h-3.5" /> ¡Orientación centrada al frente!
              </p>
            )}
            <p className="text-[10px] text-stone-400 text-center">
              Sostén tu teléfono en posición cómoda y pulsa el botón para fijar el frente hacia la puerta.
            </p>
          </div>

          {/* Interaction System Guide (Giroscopio + Linterna + Touch) */}
          <div className="p-3.5 rounded-xl border border-amber-900/40 bg-amber-950/15 space-y-2 text-stone-300">
            <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-400" />
              SISTEMA DE INTERACCIÓN ACTIVO
            </p>
            <ul className="text-[11px] font-sans space-y-1.5 text-stone-300 pl-1">
              <li className="flex items-start gap-2">
                <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-emerald-300 font-mono">1. Giroscopio / Vista:</strong> Mueve el teléfono para apuntar la cámara hacia el objeto deseado.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Flashlight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-amber-300 font-mono">2. Linterna Encendida:</strong> El objeto debe estar dentro del cono de luz de la linterna. Si la apagas, la oscuridad impide examinarlo.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Hand className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-cyan-300 font-mono">3. Touch en Pantalla:</strong> Toca directamente sobre el objeto iluminado para abrir su puzzle o recogerlo.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono transition-colors"
          >
            GUARDAR Y VOLVER AL JUEGO
          </button>
        </div>
      </div>
    </div>
  );
};
