/**
 * Jumpscare Modal (Screamer de Fin de Juego)
 * Horrifying jumpscare triggered when time expires (15 minutes).
 * Features VHS horror glitches, demonic silhouette lunge, and audio screech.
 */

import React, { useEffect, useState } from 'react';
import { RotateCcw, Skull } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface JumpscareModalProps {
  onRestart: () => void;
}

export const JumpscareModal: React.FC<JumpscareModalProps> = ({ onRestart }) => {
  const [glitchPhase, setGlitchPhase] = useState<number>(0);

  useEffect(() => {
    // Play screamer
    horrorAudio.playJumpscareScreamer();
    sensorManager.vibrate([300, 150, 400, 100, 600]);

    const timer1 = setTimeout(() => setGlitchPhase(1), 200);
    const timer2 = setTimeout(() => setGlitchPhase(2), 700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Glitch & Red Strobe Background */}
      <div className="absolute inset-0 bg-red-950/50 animate-ping opacity-30 pointer-events-none" />

      {/* Terrifying Face Art (SVG / Canvas stylized horror silhouette) */}
      <div
        className={`relative z-10 flex flex-col items-center transition-transform duration-100 ${
          glitchPhase === 0
            ? 'scale-75'
            : glitchPhase === 1
            ? 'scale-125 translate-y-2'
            : 'scale-150 animate-pulse'
        }`}
      >
        <div className="relative w-72 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
          {/* Distorted Horror Skull Face */}
          <div className="w-56 h-72 bg-neutral-950 rounded-full border-4 border-red-900/60 shadow-[0_0_80px_rgba(255,0,0,0.8)] relative flex flex-col items-center justify-center">
            {/* Sunken Eyes */}
            <div className="flex gap-16 mb-4">
              <div className="w-12 h-14 bg-black rounded-full shadow-[inset_0_0_15px_#000] relative">
                <div className="w-3 h-3 bg-red-600 rounded-full absolute top-5 left-4 animate-ping" />
              </div>
              <div className="flex w-12 h-14 bg-black rounded-full shadow-[inset_0_0_15px_#000] relative">
                <div className="w-3 h-3 bg-red-600 rounded-full absolute top-5 right-4 animate-ping" />
              </div>
            </div>

            {/* Distorted Wide Jagged Mouth */}
            <div className="w-36 h-20 bg-black rounded-b-full border-2 border-red-800/80 flex items-center justify-center gap-1 overflow-hidden">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  style={{ height: `${20 + (i % 3) * 14}px` }}
                  className="w-2.5 bg-neutral-300 rounded-t-sm"
                />
              ))}
            </div>

            {/* Forehead Blood Marks */}
            <div className="absolute top-6 text-red-600 font-mono text-xs tracking-widest uppercase">
              NO HAY ESCAPATORIA
            </div>
          </div>
        </div>
      </div>

      {/* Screen text */}
      <div className="relative z-20 mt-6 text-center px-4">
        <h1 className="text-3xl sm:text-5xl font-mono font-extrabold text-red-600 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">
          EL PIBE TE ATRAPÓ
        </h1>
        <p className="mt-2 text-stone-400 font-mono text-sm">
          Se agotaron los 15 minutos. El pasillo nunca estuvo vacío.
        </p>

        <button
          onClick={onRestart}
          className="mt-8 px-8 py-3.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-mono text-sm font-bold uppercase tracking-wider flex items-center gap-2 mx-auto shadow-[0_0_30px_rgba(220,38,38,0.6)] active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          VOLVER A INTENTAR
        </button>
      </div>

      {/* Static Scanline Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-60" />
    </div>
  );
};
