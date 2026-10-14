/**
 * Toilet Puzzle Modal (Inodoro Asqueroso del Baño)
 * Reaching into the foul murky toilet water to fish out the rusty iron key.
 */

import React, { useState } from 'react';
import { X, Key, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface ToiletModalProps {
  hasFoundKey: boolean;
  onRetrieveKey: () => void;
  onClose: () => void;
}

export const ToiletModal: React.FC<ToiletModalProps> = ({
  hasFoundKey,
  onRetrieveKey,
  onClose,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [retrieved, setRetrieved] = useState(hasFoundKey);
  const [splashAnimation, setSplashAnimation] = useState(false);

  const handleSearch = () => {
    if (retrieved || isSearching) return;

    setIsSearching(true);
    setSplashAnimation(true);
    horrorAudio.playCreak();
    sensorManager.vibrate([80, 60, 120, 80, 200]);

    setTimeout(() => {
      setRetrieved(true);
      setIsSearching(false);
      setSplashAnimation(false);
      horrorAudio.playUnlockClick();
      onRetrieveKey();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-stone-200">
              INODORO DECRÉPITO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-gradient-to-b from-stone-900 to-stone-950 flex flex-col items-center text-center">
          {/* Toilet Bowl Graphic representation */}
          <div className="relative w-48 h-48 rounded-full border-8 border-stone-700 bg-stone-950 shadow-[inset_0_0_50px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden mb-5">
            {/* Murky water layer */}
            <div
              className={`w-36 h-36 rounded-full bg-gradient-to-br from-[#121c17] to-[#070d0a] border-4 border-stone-800/80 flex items-center justify-center relative transition-transform duration-300 ${
                splashAnimation ? 'scale-105 animate-pulse' : 'scale-100'
              }`}
            >
              {/* Sludge ripples */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(5,15,10,0.8)_80%)]" />

              {/* Submerged Key Visual */}
              {!retrieved && (
                <div className="relative z-10 flex flex-col items-center opacity-70 group hover:opacity-100 transition-opacity">
                  <div className="w-3 h-3 rounded-full bg-amber-400/30 blur-xs animate-ping absolute" />
                  <Key className="w-10 h-10 text-amber-600/90 rotate-45 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]" />
                  <span className="text-[10px] font-mono text-amber-400/90 mt-1 uppercase tracking-widest font-semibold">
                    Objeto Sumergido
                  </span>
                </div>
              )}

              {retrieved && (
                <div className="relative z-10 flex flex-col items-center text-stone-600">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mb-1" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    Fondo Vacío
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-stone-300 font-sans leading-relaxed max-w-sm">
            {retrieved
              ? 'Has extraído la llave de hierro herrumbrosa del fondo del sifón. El agua estancada quedó revuelta con un hedor insoportable.'
              : 'El inodoro está cubierto de moho y manchas de óxido. En el fondo del agua oscura y turbia se vislumbra el brillo metálico de una llave antigua.'}
          </p>

          {/* Action button */}
          {!retrieved ? (
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="mt-6 w-full py-3 px-4 rounded-lg bg-amber-700 hover:bg-amber-600 active:scale-98 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>BUSCANDO EN EL AGUA TURBIA...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 text-amber-200" />
                  <span>METER LA MANO Y SACAR LA LLAVE</span>
                </>
              )}
            </button>
          ) : (
            <div className="mt-5 p-3 rounded-lg bg-emerald-950/40 border border-emerald-600/40 flex items-center justify-center gap-2 text-emerald-300 font-mono text-xs">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>OBTENIDA: LLAVE DE HIERRO HERRUMBROSA</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono transition-colors"
          >
            VOLVER AL BAÑO
          </button>
        </div>
      </div>
    </div>
  );
};
