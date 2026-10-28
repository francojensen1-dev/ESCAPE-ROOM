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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto">
      {/* Floating Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-stone-900/90 text-stone-300 hover:text-white border border-stone-700/60 shadow-xl hover:scale-110 active:scale-95 transition-all z-50"
        title="Cerrar"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Rustic Padlock Visual (No modal interface box) */}
      <div className="relative w-full max-w-lg flex flex-col items-center justify-center my-auto select-none">
        {/* Custom Shackle */}
        <div
          className={`w-40 sm:w-48 h-24 sm:h-28 border-[7px] sm:border-[8px] border-stone-600 rounded-t-full transition-all duration-500 drop-shadow-[0_10px_15px_rgba(0,0,0,0.9)] ${
            isUnlocked ? '-translate-y-6 rotate-3 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]' : ''
          }`}
        />

        {/* Carved Dark Metal Body Chamber */}
        <div className="-mt-4 w-full p-4 sm:p-6 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 border-4 border-stone-800 rounded-3xl shadow-[inset_0_5px_15px_rgba(0,0,0,0.9),0_20px_40px_rgba(0,0,0,0.95)] flex flex-col items-center">
          {/* Dials Chamber Window */}
          <div className="w-full p-3 sm:p-4 bg-stone-950 border-2 border-stone-800 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.95)] flex items-center justify-center gap-2 sm:gap-3">
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
                    className="p-1 text-amber-400/80 hover:text-amber-200 hover:scale-125 active:scale-90 transition-transform disabled:opacity-0"
                    title="Anterior opción"
                  >
                    <ChevronUp className="w-6 h-6 stroke-[3] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
                  </button>

                  <div
                    onClick={() => !isUnlocked && handleLetterChange(idx, 1)}
                    onWheel={(e) => {
                      e.preventDefault();
                      handleLetterChange(idx, e.deltaY > 0 ? 1 : -1);
                    }}
                    className={`w-11 sm:w-14 h-24 sm:h-28 bg-gradient-to-b from-[#695022] via-[#eed885] via-48% to-[#4d3814] border-2 ${
                      isUnlocked
                        ? 'border-emerald-400 bg-gradient-to-b from-[#2d523c] via-[#85eed0] to-[#173825]'
                        : 'border-[#f0d075]/80 hover:brightness-125'
                    } rounded-lg flex flex-col items-center justify-between py-1.5 shadow-[inset_0_3px_5px_rgba(255,255,255,0.7),inset_0_-3px_5px_rgba(0,0,0,0.9),0_4px_8px_rgba(0,0,0,0.85)] select-none cursor-pointer transition-all relative overflow-hidden`}
                    title="Haz clic o usa la rueda para girar"
                  >
                    <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/60 shadow-[0_1px_0_rgba(255,255,255,0.4)] pointer-events-none" />

                    <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-950/70 opacity-60 relative z-10">
                      {prevLetter}
                    </span>
                    <span
                      className={`relative z-10 font-serif font-black text-2xl sm:text-3xl ${
                        isUnlocked ? 'text-emerald-950' : 'text-[#1c1305]'
                      } drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]`}
                    >
                      {letter}
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-950/70 opacity-60 relative z-10">
                      {nextLetter}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isUnlocked}
                    onClick={() => handleLetterChange(idx, 1)}
                    className="p-1 text-amber-400/80 hover:text-amber-200 hover:scale-125 active:scale-90 transition-transform disabled:opacity-0"
                    title="Siguiente opción"
                  >
                    <ChevronDown className="w-6 h-6 stroke-[3] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
                  </button>

                  {/* 5-slot dots indicator */}
                  <div className="flex gap-1.5 mt-2" title={`Opción ${currentOptIdx + 1} de 5`}>
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
        </div>
      </div>

      {/* Floating Status & Return Controls */}
      <div className="mt-4 sm:mt-6 text-center z-10 flex flex-col items-center gap-3">
        {isUnlocked ? (
          <div className="px-5 py-2.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-pulse">
            <p className="text-xs sm:text-sm font-mono text-emerald-300 font-bold tracking-widest uppercase flex items-center gap-2">
              <Unlock className="w-4 h-4" /> ¡CANDADO DE 5 LETRAS ABIERTO!
            </p>
          </div>
        ) : (
          <p className="text-xs sm:text-sm font-mono text-stone-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-stone-950/60 px-4 py-1.5 rounded-full border border-stone-800/80">
            Gira los cilindros dorados para formar la palabra de 5 letras
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
