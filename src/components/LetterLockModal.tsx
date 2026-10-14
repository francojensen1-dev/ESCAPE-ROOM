/**
 * 5-Letter Word Combination Padlock Modal (Candado de 5 Letras del Baño)
 * Features 5 revolving letter dials (A-Z) with tactile click sound and haptic feedback.
 * Correct code: M - O - R - I - R (found behind the broken bathroom tile).
 */

import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown, Unlock, Lock } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface LetterLockModalProps {
  isUnlocked: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const LetterLockModal: React.FC<LetterLockModalProps> = ({
  isUnlocked: initialUnlocked,
  onSuccess,
  onClose,
}) => {
  const [letters, setLetters] = useState<string[]>(['A', 'A', 'A', 'A', 'A']);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(initialUnlocked);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const TARGET_WORD = ['M', 'O', 'R', 'I', 'R'];

  const handleLetterChange = (index: number, delta: number) => {
    if (isUnlocked) return;

    horrorAudio.playDialTick();
    sensorManager.vibrate(25);

    const currentIdx = ALPHABET.indexOf(letters[index]);
    const nextIdx = (currentIdx + delta + ALPHABET.length) % ALPHABET.length;
    const nextLetters = [...letters];
    nextLetters[index] = ALPHABET[nextIdx];
    setLetters(nextLetters);
    setErrorMsg(null);

    // Check code
    if (nextLetters.every((l, i) => l === TARGET_WORD[i])) {
      setIsUnlocked(true);
      horrorAudio.playUnlockClick();
      sensorManager.vibrate([100, 60, 150]);
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            {isUnlocked ? (
              <Unlock className="w-4 h-4 text-emerald-400" />
            ) : (
              <Lock className="w-4 h-4 text-amber-500" />
            )}
            <h2 className="text-sm font-mono uppercase tracking-wider text-stone-200">
              CANDADO DE 5 LETRAS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Visual */}
        <div className="p-6 bg-gradient-to-b from-stone-900 to-stone-950 flex flex-col items-center">
          {/* Shackle */}
          <div
            className={`w-32 h-16 border-4 border-stone-400 rounded-t-full transition-transform ${
              isUnlocked ? '-translate-y-4 rotate-6 border-emerald-400' : ''
            }`}
          />

          {/* Dials Chamber */}
          <div className="w-full p-3.5 bg-stone-800 border-2 border-stone-700 rounded-lg shadow-inner flex items-center justify-center gap-2">
            {letters.map((letter, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <button
                  disabled={isUnlocked}
                  onClick={() => handleLetterChange(idx, 1)}
                  className="p-1 text-stone-400 hover:text-amber-400 active:scale-90 transition-transform disabled:opacity-30"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>

                <div className="w-10 h-14 bg-stone-950 border border-stone-600 rounded flex items-center justify-center text-2xl font-mono font-bold text-amber-300 shadow-inner select-none">
                  {letter}
                </div>

                <button
                  disabled={isUnlocked}
                  onClick={() => handleLetterChange(idx, -1)}
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
                ✓ ¡CANDADO DE 5 LETRAS ABIERTO! CADENA LIBERADA
              </p>
            ) : (
              <p className="text-xs font-mono text-stone-400">
                Pista: La palabra raspada oculta detrás del azulejo roto en el baño.
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
            VOLVER A LA PUERTA
          </button>
        </div>
      </div>
    </div>
  );
};
