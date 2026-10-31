/**
 * Rusted 4-Digit Combination Padlock Modal (Candado Oxidado de 4 Dígitos)
 * Features revolving dials (0-9) with click sounds and haptic feedback.
 * Correct code: 5-4-7-3
 */

import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown, Unlock } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface RustedCodeLockModalProps {
  isUnlocked: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const RustedCodeLockModal: React.FC<RustedCodeLockModalProps> = ({
  isUnlocked: initialUnlocked,
  onSuccess,
  onClose,
}) => {
  const [digits, setDigits] = useState<number[]>([0, 0, 0, 0]);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(initialUnlocked);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const CORRECT_CODE = [5, 4, 7, 3];

  const handleDigitChange = (index: number, delta: number) => {
    if (isUnlocked) return;

    horrorAudio.playSwitchClick();
    sensorManager.vibrate(25);

    const newDigits = [...digits];
    newDigits[index] = (newDigits[index] + delta + 10) % 10;
    setDigits(newDigits);
    setErrorMsg(null);

    // Check code
    if (newDigits.every((val, i) => val === CORRECT_CODE[i])) {
      setIsUnlocked(true);
      horrorAudio.playPadlockSound();
      sensorManager.vibrate([80, 50, 120]);
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto">
      {/* Floating Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-stone-900/90 text-stone-300 hover:text-white border border-stone-700/60 shadow-xl hover:scale-110 active:scale-95 transition-all z-50"
        title="Cerrar"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Padlock Container */}
      <div className="relative w-full max-w-lg aspect-[4/3] flex flex-col items-center justify-center my-auto select-none">
        {/* Lock Graphic Image */}
        <img
          src="/assets/aistudio/image_7332d7a1.png"
          alt="Candado oxidado de combinación"
          className={`w-full h-full object-contain filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.95)] transition-all duration-500 ${
            isUnlocked
              ? '-translate-y-6 rotate-3 brightness-110 drop-shadow-[0_0_50px_rgba(16,185,129,0.6)]'
              : 'hover:scale-[1.01]'
          }`}
        />

        {/* Interactive 4 Tumbler Dials Overlay */}
        <div className="absolute left-[36.5%] top-[55.5%] w-[27%] h-[14%] flex items-center justify-between gap-1 px-0.5">
          {digits.map((digit, idx) => (
            <div key={idx} className="relative w-[23%] h-full flex flex-col items-center justify-center group">
              {/* Up button */}
              <button
                type="button"
                disabled={isUnlocked}
                onClick={() => handleDigitChange(idx, 1)}
                className="absolute -top-7 text-amber-400/90 hover:text-amber-200 hover:scale-125 active:scale-90 transition-all z-20 p-0.5 disabled:opacity-0"
                title="Aumentar número"
              >
                <ChevronUp className="w-5 h-5 stroke-[3] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]" />
              </button>

              {/* Rusted Gold metallic cylinder dial */}
              <div
                onClick={() => !isUnlocked && handleDigitChange(idx, 1)}
                onWheel={(e) => {
                  e.preventDefault();
                  handleDigitChange(idx, e.deltaY > 0 ? -1 : 1);
                }}
                className={`w-full h-full bg-gradient-to-b from-[#59421b] via-[#d4ba63] via-48% to-[#3d2c0d] border border-[#d4ba63]/80 rounded-sm flex items-center justify-center cursor-pointer shadow-[inset_0_3px_5px_rgba(255,255,255,0.7),inset_0_-3px_5px_rgba(0,0,0,0.9),0_4px_8px_rgba(0,0,0,0.85)] ${
                  isUnlocked
                    ? 'border-emerald-400 bg-gradient-to-b from-[#2d523c] via-[#85eed0] to-[#173825]'
                    : 'hover:brightness-125'
                } transition-all relative overflow-hidden select-none`}
                title="Haz clic o gira la rueda para cambiar"
              >
                {/* 3D shading overlays */}
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/60 shadow-[0_1px_0_rgba(255,255,255,0.4)] pointer-events-none" />

                <span
                  className={`relative z-10 font-serif font-black text-lg sm:text-2xl ${
                    isUnlocked ? 'text-emerald-950' : 'text-[#1c1305]'
                  } drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-tighter`}
                >
                  {digit}
                </span>
              </div>

              {/* Down button */}
              <button
                type="button"
                disabled={isUnlocked}
                onClick={() => handleDigitChange(idx, -1)}
                className="absolute -bottom-7 text-amber-400/90 hover:text-amber-200 hover:scale-125 active:scale-90 transition-all z-20 p-0.5 disabled:opacity-0"
                title="Disminuir número"
              >
                <ChevronDown className="w-5 h-5 stroke-[3] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Status & Back Label */}
      <div className="mt-4 sm:mt-6 text-center z-10 flex flex-col items-center gap-3">
        {isUnlocked ? (
          <div className="px-5 py-2.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-pulse">
            <p className="text-xs sm:text-sm font-mono text-emerald-300 font-bold tracking-widest uppercase flex items-center gap-2">
              <Unlock className="w-4 h-4" /> ¡CANDADO ABIERTO! LA CADENA HA CEDIDO
            </p>
          </div>
        ) : (
          <p className="text-xs sm:text-sm font-mono text-stone-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-stone-950/60 px-4 py-1.5 rounded-full border border-stone-800/80">
            Toca los cilindros o usa las flechas para ingresar la combinación
          </p>
        )}
        {errorMsg && <p className="text-xs font-mono text-red-400 font-semibold">{errorMsg}</p>}

        <button
          onClick={onClose}
          className="mt-1 px-6 py-2 rounded-full bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-mono transition-all border border-stone-700/60 shadow-lg"
        >
          VOLVER A LA PUERTA
        </button>
      </div>
    </div>
  );
};
