/**
 * Jumpscare Modal (Screamer de Fin de Juego)
 * Triggered when time expires (15 min) or when the player repeatedly calls "El Pibe".
 * Displays the horrifying screamer image from /imgs/Elpibe_4.jpg with screen shake,
 * violent blood-red strobe flashes, audio screech, and mobile haptics.
 */

import React, { useEffect, useState } from 'react';
import { RotateCcw, Skull, AlertTriangle } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

export interface JumpscareModalProps {
  reason?: 'timeout' | 'called_too_much';
  onRestart: () => void;
}

const PRIMARY_SCREAMER = '/imgs/screamer.jpg';
const SECONDARY_GLITCH = '/imgs/screamer.jpg';

const SCREAMER_FALLBACKS = [
  '/imgs/screamer.jpg',
  '/imgs/Screamer.jpg',
  '/imgs/screamer.jpeg',
  '/imgs/screamer.png',
  '/imgs/Elpibe_4.jpg',
  '/imgs/Elpibe_3.jpg',
];

export const JumpscareModal: React.FC<JumpscareModalProps> = ({
  reason = 'timeout',
  onRestart,
}) => {
  const [screamerPhase, setScreamerPhase] = useState<number>(0);
  const [activeImage, setActiveImage] = useState<string>(PRIMARY_SCREAMER);
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [imageError, setImageError] = useState<boolean>(false);
  const [isFlashing, setIsFlashing] = useState<boolean>(true);

  useEffect(() => {
    // 0. Preload screamer image
    const img1 = new Image();
    img1.src = PRIMARY_SCREAMER;

    // 1. Play bloodcurdling screamer audio
    horrorAudio.playJumpscareScreamer();

    // 2. Heavy haptic vibration sequence
    sensorManager.vibrate([400, 80, 500, 100, 800, 150, 600]);

    // 3. Rapid strobe & glitch sequence in first 450ms
    const glitch1 = setTimeout(() => setIsFlashing(false), 90);
    const glitch2 = setTimeout(() => setIsFlashing(true), 180);
    const glitch3 = setTimeout(() => setIsFlashing(false), 270);
    const glitch4 = setTimeout(() => setIsFlashing(false), 420);

    // 4. Staged shock zoom animation
    const t1 = setTimeout(() => setScreamerPhase(1), 100);
    const t2 = setTimeout(() => setScreamerPhase(2), 500);

    return () => {
      clearTimeout(glitch1);
      clearTimeout(glitch2);
      clearTimeout(glitch3);
      clearTimeout(glitch4);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleImageError = () => {
    if (candidateIndex + 1 < SCREAMER_FALLBACKS.length) {
      const nextIdx = candidateIndex + 1;
      setCandidateIndex(nextIdx);
      setActiveImage(SCREAMER_FALLBACKS[nextIdx]);
    } else {
      setImageError(true);
    }
  };

  const isCalledTooMuch = reason === 'called_too_much';

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Violent Red / White Strobe Flash */}
      <div
        className={`absolute inset-0 pointer-events-none mix-blend-screen transition-opacity ${
          isFlashing
            ? 'bg-red-600/60 animate-ping'
            : 'bg-red-600/30 animate-pulse duration-300'
        }`}
      />
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* Main Screamer Visual Container with Jolt Animation */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center transition-all duration-75 ${
          screamerPhase === 0
            ? 'scale-95 opacity-90'
            : screamerPhase === 1
            ? 'scale-110 -translate-y-2 rotate-1'
            : 'scale-125 translate-x-1 -translate-y-1 animate-pulse'
        }`}
      >
        <div className="relative w-80 h-80 sm:w-[500px] sm:h-[500px] max-w-[88vw] max-h-[50vh] rounded-2xl overflow-hidden border-4 border-red-700 shadow-[0_0_120px_rgba(255,0,0,0.95),inset_0_0_80px_rgba(0,0,0,0.95)] bg-black flex items-center justify-center">
          {!imageError ? (
            <img
              key={activeImage}
              src={activeImage}
              alt="Screamer El Pibe"
              onError={handleImageError}
              className={`w-full h-full object-cover transition-all duration-75 ${
                isFlashing
                  ? 'filter invert contrast-200 saturate-200 brightness-125 scale-105'
                  : 'filter contrast-125 saturate-125 brightness-105 scale-100'
              }`}
            />
          ) : (
            /* Emergency fallback only if image is missing */
            <div className="w-full h-full bg-neutral-950 flex flex-col items-center justify-center relative p-6 text-center">
              <Skull className="w-36 h-36 text-red-600 animate-ping opacity-80 mb-4" />
              <div className="text-red-500 font-mono text-2xl font-black uppercase tracking-widest text-center px-4">
                NO HAY ESCAPATORIA
              </div>
            </div>
          )}

          {/* Blood & Vignette Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(180,0,0,0.5)_75%,_rgba(0,0,0,0.95)_100%)] pointer-events-none" />
          {/* Static Scanline Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0)_50%,rgba(0,0,0,0.7)_50%)] bg-[length:100%_4px] pointer-events-none opacity-60" />
        </div>
      </div>

      {/* Screamer Title & Cause */}
      <div className="relative z-20 mt-6 text-center px-4 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/90 border border-red-600/80 text-red-400 text-xs font-mono font-bold tracking-widest uppercase mb-2 animate-bounce">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          {isCalledTooMuch ? 'PROVOCACIÓN MORTAL' : 'LÍMITE DE TIEMPO AGOTADO'}
        </div>

        <h1 className="text-3xl sm:text-5xl font-mono font-black text-red-600 uppercase tracking-widest drop-shadow-[0_0_25px_rgba(239,68,68,0.9)]">
          {isCalledTooMuch ? 'EL PIBE DERRIBÓ LA PUERTA' : 'EL PIBE TE ATRAPÓ'}
        </h1>

        <p className="mt-2 text-stone-300 font-mono text-sm leading-relaxed">
          {isCalledTooMuch
            ? 'Lo llamaste demasiadas veces a la puerta. Derribó el marco y no tuviste a dónde correr.'
            : 'Los 15 minutos expiraron. En la penumbra nadie puede oír tus gritos.'}
        </p>

        {/* Action Button */}
        <button
          onClick={onRestart}
          className="mt-6 px-8 py-3.5 rounded-xl bg-red-700 hover:bg-red-600 active:scale-95 text-white font-mono text-sm font-bold uppercase tracking-wider flex items-center gap-2.5 mx-auto shadow-[0_0_40px_rgba(220,38,38,0.7)] transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          VOLVER A INTENTAR
        </button>
      </div>

      {/* VHS Noise Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle,_#ffffff_10%,_transparent_20%)] bg-[length:6px_6px]" />
    </div>
  );
};

