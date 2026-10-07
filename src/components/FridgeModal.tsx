/**
 * Rotten Refrigerator Modal (Heladera con Comida Podrida)
 * Inspection view showing decayed interior, buzzing flies, moldy jars,
 * and the hidden brass key needed for the main door padlock.
 */

import React, { useState } from 'react';
import { X, Key, AlertTriangle, Check } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface FridgeModalProps {
  hasKey: boolean;
  onPickUpKey: () => void;
  onClose: () => void;
}

export const FridgeModal: React.FC<FridgeModalProps> = ({
  hasKey,
  onPickUpKey,
  onClose,
}) => {
  const [collected, setCollected] = useState(hasKey);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleGrabKey = () => {
    if (collected) return;
    setCollected(true);
    horrorAudio.playUnlockClick();
    sensorManager.vibrate([60, 40, 80]);
    onPickUpKey();
    setFeedback('¡Has obtenido la LLAVE ANTIGUA DE LATÓN!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      {/* Container */}
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-stone-200">
              REFRIGERADOR EN DESCOMPOSICIÓN
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fridge Interior Visual */}
        <div className="relative h-72 sm:h-80 bg-gradient-to-b from-[#252c1e] to-[#12160e] p-4 flex flex-col justify-between overflow-hidden border-y border-stone-800">
          {/* Grime and Flies effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(120,180,60,0.15),_transparent_70%)] pointer-events-none" />

          {/* Top Freezer Shelf */}
          <div className="relative border-b-2 border-stone-700 pb-3 flex items-center justify-around bg-black/30 rounded p-2">
            <div className="text-center">
              <div className="w-16 h-12 bg-amber-950/80 border border-amber-900/60 rounded flex items-center justify-center text-[10px] text-amber-200 font-mono">
                [CARNE NEGRA]
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">Podrido hace años</span>
            </div>

            {/* Hidden Key in Freezer Shelf */}
            <div className="text-center">
              {!collected ? (
                <button
                  onClick={handleGrabKey}
                  className="group relative px-4 py-3 bg-amber-950/90 hover:bg-amber-900 border-2 border-amber-500/80 rounded-lg flex flex-col items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse transition-transform active:scale-95"
                >
                  <Key className="w-7 h-7 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span className="text-xs font-mono font-bold text-amber-300">
                    TOCAR LLAVE
                  </span>
                </button>
              ) : (
                <div className="px-4 py-3 bg-stone-800/40 border border-stone-700/50 rounded-lg flex flex-col items-center gap-1 opacity-60">
                  <Check className="w-6 h-6 text-emerald-400" />
                  <span className="text-[11px] font-mono text-stone-400">LLAVE RECOGIDA</span>
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="w-14 h-12 bg-stone-800/90 border border-stone-700 rounded flex items-center justify-center text-[10px] text-stone-300 font-mono">
                [FRASCO HONGOS]
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">Moho verde</span>
            </div>
          </div>

          {/* Bottom Vegetable Crisper */}
          <div className="relative bg-black/40 border border-stone-700/60 rounded p-3 flex items-center justify-between">
            <div className="text-xs text-stone-400 space-y-1">
              <p className="text-stone-300 font-mono font-semibold">
                Olor nauseabundo...
              </p>
              <p className="text-[11px] text-stone-400">
                Alguien escondió la llave entre la escarcha podrida para que nadie se atreviera a buscarla.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info & button */}
        <div className="p-4 bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-amber-400">
            {feedback || (collected ? 'Ya tienes la llave antigua en tu inventario.' : 'Toca la llave oxidada para recogerla.')}
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono transition-colors"
          >
            CERRAR HELADERA
          </button>
        </div>
      </div>
    </div>
  );
};
