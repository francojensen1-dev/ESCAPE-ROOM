/**
 * Refrigerator Modal (Heladera)
 * Displays fridge interior image (/imgs/refrijerador_2.png when key is present,
 * /imgs/refrijerador_1.png after key is collected).
 * Interactive key zone in top-left opens a popup with /imgs/llave.png and
 * "Conseguiste la llave del baño".
 */

import React, { useState } from 'react';
import { X, Key, Sparkles } from 'lucide-react';
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
  const [showKeyPopup, setShowKeyPopup] = useState(false);

  const handleGrabKey = () => {
    if (collected) return;
    setCollected(true);
    setShowKeyPopup(true);
    horrorAudio.playUnlockClick();
    sensorManager.vibrate([60, 40, 80]);
    onPickUpKey();
  };

  const handleClosePopup = () => {
    setShowKeyPopup(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 select-none backdrop-blur-sm">
      {/* Floating Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-3 rounded-full bg-stone-900/90 border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors shadow-2xl cursor-pointer hover:scale-105 active:scale-95"
        title="Cerrar heladera"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Image View without card/box container */}
      <div className="relative max-w-5xl max-h-[85vh] flex items-center justify-center p-2">
        <div className="relative inline-block max-w-full max-h-[85vh]">
          {/* Main Fridge Image */}
          <img
            src={collected ? '/imgs/refrijerador_1.png' : '/imgs/refrijerador_2.png'}
            alt="Heladera"
            className="max-w-full max-h-[85vh] object-contain filter drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]"
          />

          {/* Invisible Interactive Key Hotspot on the key in the image */}
          {!collected && (
            <button
              onClick={handleGrabKey}
              title="Agarrar llave"
              className="absolute top-[18%] left-[29%] w-[10%] aspect-square cursor-pointer focus:outline-none z-10 hover:bg-amber-400/20 active:bg-amber-500/30 rounded-full transition-colors"
            />
          )}
        </div>
      </div>

      {/* Pop-up modal when Key is found */}
      {showKeyPopup && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-stone-900/95 border-2 border-amber-500/80 rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.5)] text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-3 text-amber-400">
              <Sparkles className="w-6 h-6 animate-spin-slow" />
            </div>

            {/* Llave image */}
            <div className="relative w-36 h-36 my-2 bg-stone-950 border border-stone-800 rounded-xl p-3 flex items-center justify-center shadow-inner">
              <img
                src="/imgs/llave.png"
                alt="Llave del baño"
                className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
              />
            </div>

            {/* Key Pickup Text */}
            <h3 className="text-lg font-bold font-mono text-amber-300 mt-3 mb-1">
              Conseguiste la llave del baño
            </h3>
            <p className="text-xs text-stone-400 font-mono mb-6">
              Ha sido añadida a tu inventario.
            </p>

            <button
              onClick={handleClosePopup}
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
