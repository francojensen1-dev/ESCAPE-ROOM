/**
 * Toilet Puzzle Modal (Inodoro del Baño)
 * Displays the transparent PNG toilet image (/imgs/inodoro.png).
 * Has an invisible hotspot over the key in the toilet bowl.
 * Once the key is collected, frameless popup appears with blurred circle backdrop,
 * key PNG at top, "Llave del candado" text, and "Aceptar" button.
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
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
    horrorAudio.playKeyCollect();
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
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-stone-900/90 border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors shadow-2xl cursor-pointer hover:scale-105 active:scale-95"
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
              aria-label="Sacar la llave del candado"
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

      {/* Key Acquired Popup: Frameless, Blurred Circle Backdrop, Key PNG at top, Text below, Aceptar button */}
      {showKeyPopup && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Subtle backdrop overlay */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" />

          {/* Container with blurred black circle behind */}
          <div className="relative flex flex-col items-center justify-center z-10">
            {/* Diffused Black Circle Aura Behind */}
            <div className="absolute w-72 h-72 sm:w-84 sm:h-84 bg-black/95 rounded-full blur-2xl pointer-events-none -z-10 shadow-[0_0_80px_rgba(0,0,0,0.9)]" />

            {/* Key PNG at top */}
            <img
              src="/imgs/llave.png"
              alt="Llave del candado"
              className="w-28 h-28 sm:w-32 sm:h-32 object-contain filter drop-shadow-[0_0_20px_rgba(245,158,11,0.5)] select-none pointer-events-none mb-3"
            />

            {/* Text below */}
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-amber-200 tracking-wide text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-6">
              Llave del candado
            </h3>

            {/* Aceptar Button */}
            <button
              onClick={handleAcceptKey}
              className="px-8 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold font-mono text-sm tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-transform active:scale-95 cursor-pointer"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
