/**
 * Electrical Fuse Box Modal (Caja de Fusibles)
 * 3 toggle breaker levers.
 * Solution from diary notes: [ARRIBA, ABAJO, ARRIBA]
 */

import React, { useState } from 'react';
import { X, Zap, CheckCircle2 } from 'lucide-react';
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
  // Levers state: boolean (true = UP, false = DOWN)
  const [switches, setSwitches] = useState<boolean[]>([false, true, false]);
  const [isSolved, setIsSolved] = useState<boolean>(initialSolved);

  const TARGET = [true, false, true]; // ARRIBA, ABAJO, ARRIBA

  const handleToggle = (index: number) => {
    if (isSolved) return;

    horrorAudio.playDialTick();
    sensorManager.vibrate(30);

    const newSwitches = [...switches];
    newSwitches[index] = !newSwitches[index];
    setSwitches(newSwitches);

    if (newSwitches.every((val, i) => val === TARGET[i])) {
      setIsSolved(true);
      horrorAudio.playUnlockClick();
      sensorManager.vibrate([100, 50, 150]);
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-stone-200">
              CAJA DE FUSIBLES (220V)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interior panel */}
        <div className="p-6 bg-stone-950 flex flex-col items-center">
          <div className="w-full p-4 bg-stone-900 border border-stone-700 rounded-lg flex items-center justify-around">
            {switches.map((isUp, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-mono text-stone-400 uppercase">
                  FUSIBLE 0{idx + 1}
                </span>

                <button
                  disabled={isSolved}
                  onClick={() => handleToggle(idx)}
                  className={`w-12 h-24 rounded-lg p-1.5 flex flex-col justify-between transition-colors border ${
                    isUp
                      ? 'bg-emerald-950/80 border-emerald-600/80'
                      : 'bg-red-950/80 border-red-700/80'
                  }`}
                >
                  <div
                    className={`w-full h-9 rounded bg-gradient-to-b from-stone-400 to-stone-600 border border-white/20 shadow transition-all ${
                      isUp ? 'translate-y-0' : 'translate-y-11'
                    }`}
                  />
                  <span className="text-[9px] font-mono font-bold text-center text-stone-300">
                    {isUp ? 'ARRIBA' : 'ABAJO'}
                  </span>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            {isSolved ? (
              <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>CIRCUITO SOBRECARGADO - PESTILLO ELÉCTRICO DESACTIVADO</span>
              </div>
            ) : (
              <p className="text-xs font-mono text-stone-400">
                Pista: Revisa el diario en el escritorio para la combinación de palancas.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono transition-colors"
          >
            CERRAR TABLERO
          </button>
        </div>
      </div>
    </div>
  );
};
