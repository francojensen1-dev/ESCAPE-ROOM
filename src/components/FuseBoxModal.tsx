/**
 * Electrical Fuse Box Modal (Caja de Fusibles 220V)
 * High-realism industrial panel based directly on /assets/aistudio/image_41f85383.png:
 * - Weathered metal enclosure with "PANEL No. C"
 * - Dual analog voltmeters with dynamic moving needles responding to load
 * - 4 heavy-duty industrial rocker breaker switches with realistic ON (green/white toggle)
 *   and OFF (red/black toggle) states, sound effects, and haptic feedback
 * - Solution from investigator diary: [ARRIBA, ABAJO, ARRIBA, ABAJO]
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface FuseBoxModalProps {
  isSolved: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const FuseBoxModal: React.FC<FuseBoxModalProps> = ({
  isSolved: initialSolved,
  onSuccess,
  onClose,
}) => {
  // 4 Breaker switches: true = ARRIBA (ON), false = ABAJO (OFF)
  // Initial position: all down [false, false, false, false]
  const [switches, setSwitches] = useState<boolean[]>(() =>
    initialSolved ? [true, false, true, false] : [false, false, false, false]
  );
  const [isSolved, setIsSolved] = useState<boolean>(initialSolved);
  const [voltage, setVoltage] = useState<number>(initialSolved ? 0 : 2.0);

  // Target sequence from diary: [ARRIBA, ABAJO, ARRIBA, ABAJO]
  const TARGET = [true, false, true, false];

  // Dynamic voltage calculation based on active switches
  useEffect(() => {
    if (isSolved) {
      setVoltage(0);
      return;
    }
    const onCount = switches.filter(Boolean).length;
    // Base voltage ~2.5V + 1.8V per switch with slight analog jitter
    const calculated = 2.0 + onCount * 1.75;
    setVoltage(Math.min(9.8, Math.max(1.2, calculated)));
  }, [switches, isSolved]);

  const handleToggle = (index: number) => {
    if (isSolved) return;

    horrorAudio.playSwitchClick();
    sensorManager.vibrate(35);

    const nextSwitches = [...switches];
    nextSwitches[index] = !nextSwitches[index];
    setSwitches(nextSwitches);

    if (nextSwitches.every((val, i) => val === TARGET[i])) {
      setIsSolved(true);
      setVoltage(0);
      horrorAudio.playUnlockClick();
      sensorManager.vibrate([120, 60, 200]);
      onSuccess();
    }
  };

  // Needle angle for right voltmeter (0V = -32deg, 5V = 0deg, 10V = +32deg)
  const rightNeedleAngle = isSolved ? -34 : (voltage - 5) * 6.5;
  // Needle angle for left voltmeter (reflects current load)
  const leftNeedleAngle = isSolved ? -34 : (switches.filter(Boolean).length - 1.5) * 14;

  return (
    <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      {/* Top Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-40 p-2.5 rounded-full bg-stone-900/90 border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors shadow-2xl cursor-pointer hover:scale-105 active:scale-95"
        title="Cerrar tablero"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Industrial Panel Container */}
      <div className="relative w-full max-w-[540px] aspect-[578/535] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(0,0,0,0.8)] border border-stone-700/60 flex items-center justify-center">
        {/* Base Realistic Panel Texture from User Reference */}
        <img
          src="/assets/aistudio/image_41f85383.png"
          alt="Tablero de Fusibles 220V"
          className="w-full h-full object-cover pointer-events-none select-none filter contrast-105"
        />

        {/* Ambient Darkened Overlay over lower switch zone so realistic custom toggles blend seamlessly */}
        <div
          style={{
            top: '49%',
            left: '12%',
            width: '76%',
            height: '36%',
          }}
          className="absolute bg-stone-950/70 rounded-xl backdrop-blur-[0.5px] pointer-events-none"
        />

        {/* --- DYNAMIC VOLTMETER NEEDLE OVERLAYS --- */}
        {/* Left Gauge Needle Overlay */}
        <div
          style={{
            top: '10.5%',
            left: '25.5%',
            width: '21.5%',
            height: '24%',
          }}
          className="absolute pointer-events-none flex items-center justify-center overflow-hidden"
        >
          {/* Needle pivot and line */}
          <div
            style={{
              transform: `rotate(${leftNeedleAngle}deg)`,
              transformOrigin: '50% 88%',
              transition: 'transform 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            }}
            className="absolute bottom-[22%] w-[2px] h-[58%] bg-stone-900 shadow-[0_0_2px_rgba(0,0,0,0.9)] flex flex-col items-center"
          >
            <div className="w-[1.5px] h-full bg-red-800" />
          </div>
          {/* Center Pivot Screw */}
          <div className="absolute bottom-[18%] w-3.5 h-3.5 rounded-full bg-stone-950 border border-stone-600 shadow-md" />
        </div>

        {/* Right Gauge (Voltage 'V') Needle Overlay */}
        <div
          style={{
            top: '10.5%',
            left: '58%',
            width: '21.5%',
            height: '24%',
          }}
          className="absolute pointer-events-none flex items-center justify-center overflow-hidden"
        >
          {/* Needle pivot and line */}
          <div
            style={{
              transform: `rotate(${rightNeedleAngle}deg)`,
              transformOrigin: '50% 88%',
              transition: 'transform 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            }}
            className="absolute bottom-[22%] w-[2px] h-[58%] bg-stone-900 shadow-[0_0_2px_rgba(0,0,0,0.9)] flex flex-col items-center"
          >
            <div className="w-[1.5px] h-full bg-red-800" />
          </div>
          {/* Center Pivot Screw */}
          <div className="absolute bottom-[18%] w-3.5 h-3.5 rounded-full bg-stone-950 border border-stone-600 shadow-md" />
        </div>

        {/* --- 4 REALISTIC INDUSTRIAL BREAKER SWITCHES --- */}
        {switches.map((isUp, index) => {
          // Precise coordinate alignment matching the slots in image_41f85383.png
          const slotPositions = [
            { left: '15.6%' },
            { left: '33.8%' },
            { left: '52.0%' },
            { left: '70.2%' },
          ];
          const pos = slotPositions[index];

          return (
            <div
              key={index}
              style={{
                top: '51%',
                left: pos.left,
                width: '14.2%',
                height: '31.5%',
              }}
              className="absolute flex flex-col items-center justify-center"
            >
              {/* Outer Recessed Bezel Housing */}
              <button
                type="button"
                onClick={() => handleToggle(index)}
                disabled={isSolved}
                aria-label={`Fusible ${index + 1}: ${isUp ? 'Arriba' : 'Abajo'}`}
                className={`relative w-full h-full rounded-md border-2 border-stone-900 bg-[#121314] shadow-[inset_0_4px_8px_rgba(0,0,0,0.9),0_2px_4px_rgba(255,255,255,0.06)] p-1 flex flex-col justify-between items-center transition-all cursor-pointer select-none ${
                  isSolved ? 'opacity-90 cursor-default' : 'hover:border-stone-700 active:scale-[0.98]'
                }`}
              >
                {/* ON Label Header */}
                <span className="text-[10px] sm:text-[11px] font-mono font-black text-stone-300 tracking-wider select-none pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                  ON
                </span>

                {/* Central Switch Trench & Mechanical Lever */}
                <div className="relative w-full flex-1 my-0.5 rounded bg-[#090a0a] border border-stone-900 shadow-[inset_0_2px_6px_rgba(0,0,0,1)] flex flex-col justify-between p-0.5 overflow-hidden">
                  {/* UPPER INDICATOR ZONE */}
                  <div className="w-full h-1/2 flex items-center justify-center">
                    {/* When switch is DOWN (OFF), the RED indicator is exposed here */}
                    {!isUp && (
                      <div className="w-[85%] h-[75%] rounded-[2px] bg-gradient-to-b from-[#e53935] to-[#c62828] border border-[#ff867c]/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_0_6px_rgba(229,57,53,0.5)] transition-opacity duration-150 flex items-center justify-center">
                        <div className="w-[70%] h-[1px] bg-white/40 mb-1" />
                      </div>
                    )}
                  </div>

                  {/* LOWER INDICATOR ZONE */}
                  <div className="w-full h-1/2 flex items-center justify-center">
                    {/* When switch is UP (ON), the GREEN indicator is exposed here */}
                    {isUp && (
                      <div className="w-[85%] h-[75%] rounded-[2px] bg-gradient-to-b from-[#00e676] to-[#00b248] border border-[#b9f6ca]/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_0_8px_rgba(0,230,118,0.7)] transition-opacity duration-150 flex items-center justify-center">
                        <div className="w-[70%] h-[1px] bg-white/40 mb-1" />
                      </div>
                    )}
                  </div>

                  {/* MOVING 3D INDUSTRIAL TOGGLE HANDLE */}
                  <div
                    style={{
                      transform: isUp ? 'translateY(0%)' : 'translateY(100%)',
                      transition: 'transform 0.12s cubic-bezier(0.2, 0, 0, 1)',
                    }}
                    className="absolute top-0.5 left-0.5 right-0.5 h-[calc(50%-2px)] rounded-[3px] shadow-[0_4px_8px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.3)] flex flex-col items-center justify-center"
                  >
                    {isUp ? (
                      /* UP POSITION: Translucent White / Light Heavy Acrylic Toggle Head (matches photo) */
                      <div className="w-full h-full rounded-[3px] bg-gradient-to-b from-[#e8ecef] via-[#c2c7cb] to-[#8c9398] border border-white/60 shadow-[inset_0_2px_3px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center">
                        <div className="w-[60%] h-[2px] bg-white/70 shadow-sm" />
                      </div>
                    ) : (
                      /* DOWN POSITION: Solid Matte Black Heavy Molded Toggle Head (matches photo) */
                      <div className="w-full h-full rounded-[3px] bg-gradient-to-b from-[#3a3c3e] via-[#222426] to-[#121314] border border-stone-600/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.9)] flex items-center justify-center">
                        <div className="w-[60%] h-[2px] bg-stone-500/60 shadow-sm" />
                      </div>
                    )}
                  </div>
                </div>

                {/* OFF Label Footer */}
                <span className="text-[10px] sm:text-[11px] font-mono font-black text-stone-300 tracking-wider select-none pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                  OFF
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Real-time Status Notification Below Panel */}
      <div className="mt-3.5 w-full max-w-[540px] px-2 flex flex-col items-center">
        {isSolved ? (
          <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-950/90 border border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 text-emerald-400 font-mono text-xs sm:text-sm font-bold text-center animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>CIRCUITO SOBRECARGADO - CERROJO 220V DESACTIVADO</span>
          </div>
        ) : (
          <div className="w-full py-2 px-3 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-400 font-mono text-xs flex items-center justify-center gap-2 text-center">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Voltaje activo: {voltage.toFixed(1)}V — Configura las 4 palancas según el diario.</span>
          </div>
        )}

        {/* Close Button at bottom */}
        <button
          onClick={onClose}
          className="mt-3 px-6 py-2 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white font-mono text-xs tracking-wider transition-all cursor-pointer shadow-lg"
        >
          CERRAR TABLERO
        </button>
      </div>
    </div>
  );
};
