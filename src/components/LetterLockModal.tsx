/**
 * 5-Letter Word Combination Padlock Modal (Candado de 5 Letras del Baño)
 * Features 5 revolving letter dials, each with exactly 5 available letter options.
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

// Exactly 5 options per dial (5 options x 5 dials)
// Target word: M - O - R - I - R
export const DIAL_OPTIONS: string[][] = [
  ['C', 'H', 'M', 'P', 'V'], // Target: M (pos 2)
  ['A', 'E', 'L', 'O', 'U'], // Target: O (pos 3)
  ['B', 'F', 'N', 'R', 'T'], // Target: R (pos 3)
  ['A', 'D', 'I', 'S', 'Z'], // Target: I (pos 2)
  ['E', 'K', 'O', 'R', 'Y'], // Target: R (pos 3)
];

const TARGET_WORD = ['M', 'O', 'R', 'I', 'R'];

export const LetterLockModal: React.FC<LetterLockModalProps> = ({
  isUnlocked: initialUnlocked,
  onSuccess,
  onClose,
}) => {
  const [letters, setLetters] = useState<string[]>(() =>
    initialUnlocked ? [...TARGET_WORD] : DIAL_OPTIONS.map((opts) => opts[0])
  );
  const [isUnlocked, setIsUnlocked] = useState<boolean>(initialUnlocked);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getPrevLetter = (dialIndex: number, currentLetter: string) => {
    const opts = DIAL_OPTIONS[dialIndex];
    const idx = opts.indexOf(currentLetter);
    const safeIdx = idx === -1 ? 0 : idx;
    return opts[(safeIdx - 1 + opts.length) % opts.length];
  };

  const getNextLetter = (dialIndex: number, currentLetter: string) => {
    const opts = DIAL_OPTIONS[dialIndex];
    const idx = opts.indexOf(currentLetter);
    const safeIdx = idx === -1 ? 0 : idx;
    return opts[(safeIdx + 1) % opts.length];
  };

  const handleLetterChange = (index: number, delta: number) => {
    if (isUnlocked) return;

    horrorAudio.playDialTick();
    sensorManager.vibrate(25);

    const options = DIAL_OPTIONS[index];
    const currentIdx = options.indexOf(letters[index]);
    const safeCurrentIdx = currentIdx === -1 ? 0 : currentIdx;
    const nextIdx = (safeCurrentIdx + delta + options.length) % options.length;
    const nextLetters = [...letters];
    nextLetters[index] = options[nextIdx];
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
            title="Cerrar"
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
          <div className="w-full p-3.5 bg-stone-950 border-2 border-stone-700 rounded-xl shadow-2xl flex items-center justify-center gap-2.5 sm:gap-3">
            {letters.map((letter, idx) => {
              const opts = DIAL_OPTIONS[idx];
              const currentOptIdx = Math.max(0, opts.indexOf(letter));
              const prevLetter = getPrevLetter(idx, letter);
              const nextLetter = getNextLetter(idx, letter);

              return (
                <div key={idx} className="flex flex-col items-center">
                  <button
                    type="button"
                    disabled={isUnlocked}
                    onClick={() => handleLetterChange(idx, -1)}
                    className="p-1 text-stone-400 hover:text-amber-400 active:scale-90 transition-transform disabled:opacity-30"
                    title="Anterior opción"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>

                  <div
                    onClick={() => !isUnlocked && handleLetterChange(idx, 1)}
                    onWheel={(e) => {
                      e.preventDefault();
                      handleLetterChange(idx, e.deltaY > 0 ? 1 : -1);
                    }}
                    className={`w-11 sm:w-12 h-24 bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 border-2 ${
                      isUnlocked ? 'border-emerald-500/70' : 'border-stone-600'
                    } rounded-lg flex flex-col items-center justify-between py-1 shadow-inner select-none cursor-pointer hover:border-amber-500/60 transition-colors`}
                    title="Haz clic o usa la rueda para girar (5 opciones)"
                  >
                    <span className="text-[10px] font-mono font-semibold text-stone-500 opacity-60">
                      {prevLetter}
                    </span>
                    <span
                      className={`text-2xl font-mono font-extrabold ${
                        isUnlocked ? 'text-emerald-300' : 'text-amber-300'
                      } drop-shadow-md`}
                    >
                      {letter}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-stone-500 opacity-60">
                      {nextLetter}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isUnlocked}
                    onClick={() => handleLetterChange(idx, 1)}
                    className="p-1 text-stone-400 hover:text-amber-400 active:scale-90 transition-transform disabled:opacity-30"
                    title="Siguiente opción"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>

                  {/* 5-slot dots indicator */}
                  <div className="flex gap-1 mt-1.5" title={`Opción ${currentOptIdx + 1} de 5`}>
                    {opts.map((_, oIdx) => (
                      <span
                        key={oIdx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          oIdx === currentOptIdx
                            ? isUnlocked
                              ? 'bg-emerald-400 scale-125'
                              : 'bg-amber-400 scale-125'
                            : 'bg-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Message */}
          <div className="mt-4 text-center">
            {isUnlocked ? (
              <p className="text-xs font-mono text-emerald-400 font-semibold tracking-wider animate-pulse">
                ✓ ¡CANDADO DE 5 LETRAS ABIERTO! CADENA LIBERADA
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-mono text-amber-400/90">
                  Cada dial tiene 5 opciones de letras disponibles.
                </p>
                <p className="text-xs font-mono text-stone-400">
                  Pista: La palabra oculta detrás del azulejo roto en el baño.
                </p>
              </div>
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
