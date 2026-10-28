/**
 * 4-Digit Combination Padlock Modal (Candado de Combinación)
 * Features revolving dials (0-9) with click sounds and haptic feedback.
 * Correct code: 1-9-8-6 (found from the vintage 1986 calendar).
 */

import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown, Unlock, Lock } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface CodeLockModalProps {
  isUnlocked: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const CodeLockModal: React.FC<CodeLockModalProps> = ({
  isUnlocked: initialUnlocked,
  onSuccess,
  onClose,
}) => {
  const [digits, setDigits] = useState<number[]>([0, 0, 0, 0]);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(initialUnlocked);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const CORRECT_CODE = [1, 9, 8, 6];

  const handleDigitChange = (index: number, delta: number) => {
    if (isUnlocked) return;

    horrorAudio.playDialTick();
    sensorManager.vibrate(25);

    const newDigits = [...digits];
    newDigits[index] = (newDigits[index] + delta + 10) % 10;
    setDigits(newDigits);
    setErrorMsg(null);

    // Check code
    if (newDigits.every((val, i) => val === CORRECT_CODE[i])) {
      setIsUnlocked(true);
      horrorAudio.playUnlockClick();
      sensorManager.vibrate([80, 50, 120]);
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            {isUnlocked ? (
              <Unlock className="w-4 h-4 text-emerald-400" />
            ) : (
              <Lock className="w-4 h-4 text-amber-500" />
            )}
            <h2 className="text-sm font-mono uppercase tracking-wider text-stone-200">
              CANDADO DE COMBINACIÓN
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Padlock Body Visual */}
        <div className="p-6 bg-gradient-to-b from-stone-900 to-stone-950 flex flex-col items-center">
          {/* Shackle */}
          <div
            className={`w-28 h-20 border-4 border-stone-400 rounded-t-full transition-transform ${
              isUnlocked ? '-translate-y-4 rotate-6 border-emerald-400' : ''
            }`}
          />

          {/* Brass Dial Chamber */}
          <div className="w-full p-4 bg-stone-800 border-2 border-stone-700 rounded-lg shadow-inner flex items-center justify-center gap-2.5">
            {digits.map((digit, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <button
                  disabled={isUnlocked}
                  onClick={() => handleDigitChange(idx, 1)}
                  className="p-1 text-stone-400 hover:text-amber-400 active:scale-90 transition-transform disabled:opacity-30"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>

                <div className="w-12 h-14 bg-stone-950 border border-stone-600 rounded flex items-center justify-center text-2xl font-mono font-bold text-amber-300 shadow-inner select-none">
                  {digit}
                </div>

                <button
                  disabled={isUnlocked}
                  onClick={() => handleDigitChange(idx, -1)}
                  className="p-1 text-stone-400 hover:text-amber-400 active:scale-90 transition-transform disabled:opacity-30"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Status Message */}
          <div className="mt-4 text-center">
            {isUnlocked ? (
              <p className="text-xs font-mono text-emerald-400 font-semibold tracking-wider animate-pulse">
                ✓ ¡CANDADO ABIERTO! CADENA LIBERADA
              </p>
            ) : (
              <p className="text-xs font-mono text-stone-400">
                Ingresa la combinación de 4 dígitos para abrir este candado.
              </p>
            )}
            {errorMsg && <p className="text-xs font-mono text-red-400 mt-1">{errorMsg}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono transition-colors"
          >
            VOLVER A LA HABITACIÓN
          </button>
        </div>
      </div>
    </div>
  );
};
