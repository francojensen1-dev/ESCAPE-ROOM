/**
 * Toilet Puzzle Modal (Inodoro del Baño)
 * Displays the transparent PNG toilet image (/imgs/inodoro.png).
 * Has an invisible hotspot over the key in the toilet bowl.
 * Once the key is collected, the toilet is no longer interactive.
 */

import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
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
  const [collected, setCollected] = useState(hasFoundKey);
  const [showKeyPopup, setShowKeyPopup] = useState(false);

  const handleGrabKey = () => {
    if (collected) return;
    setCollected(true);
    setShowKeyPopup(true);
    horrorAudio.playUnlockClick();
    sensorManager.vibrate([80, 60, 120]);
    onRetrieveKey();
  };

  const handleAcceptKey = () => {
    setShowKeyPopup(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 select-none backdrop-blur-sm">
      {/* Floating Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-3 rounded-full bg-stone-900/90 border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors shadow-2xl cursor-pointer hover:scale-105 active:scale-95"
        title="Cerrar"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Image View without card or box container */}
      <div className="relative max-w-5xl max-h-[85vh] flex items-center justify-center p-2">
        <div className="relative inline-block max-w-full max-h-[85vh]">
          {/* Main Toilet PNG Image */}
          <img
            src="/imgs/inodoro.png"
            alt="Inodoro del baño"
            className="max-w-full max-h-[85vh] object-contain filter drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] pointer-events-none select-none"
          />

          {/* Invisible Interactive Key Hotspot positioned over the key in the toilet bowl */}
          {!collected && (
            <button
              onClick={handleGrabKey}
              title="Sacar la llave del agua turbia"
              aria-label="Sacar la llave de hierro herrumbrosa"
              style={{
                top: '57%',
                left: '40%',
                width: '20%',
                height: '13%',
              }}
              className="absolute rounded-full cursor-pointer bg-transparent hover:bg-amber-400/20 active:bg-amber-500/30 hover:ring-2 hover:ring-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-all focus:outline-none touch-manipulation z-10"
            />
          )}
        </div>
      </div>

      {/* Pop-up modal when Key is retrieved */}
      {showKeyPopup && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-stone-900/95 border-2 border-amber-500/80 rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.5)] text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-3 text-amber-400">
              <Sparkles className="w-6 h-6 animate-spin-slow" />
            </div>

            {/* Key image display */}
            <div className="relative w-36 h-36 my-2 bg-stone-950 border border-stone-800 rounded-xl p-3 flex items-center justify-center shadow-inner">
              <img
                src="/imgs/llave.png"
                alt="Llave de hierro herrumbrosa"
                className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
              />
            </div>

            {/* Key Pickup Text */}
            <h3 className="text-lg font-bold font-mono text-amber-300 mt-3 mb-1">
              Conseguiste la llave de hierro
            </h3>
            <p className="text-xs text-stone-400 font-mono mb-6">
              Ha sido añadida a tu inventario.
            </p>

            <button
              onClick={handleAcceptKey}
              className="w-full py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold font-mono text-sm tracking-wide shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              ACEPTAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
