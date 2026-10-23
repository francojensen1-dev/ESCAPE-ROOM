/**
 * Nightstand Note Modal (Nota de la Mesa de Luz)
 * Displays the handwritten parchment note ("nota.jpg") found on the nightstand
 * in the bedroom with the bed.
 */

import React, { useEffect, useState } from 'react';
import { X, FileText, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface NightstandNoteModalProps {
  onClose: () => void;
}

const PRIMARY_NOTE_PATH = '/imgs/nota.png';
const FALLBACK_NOTE_PATH = '/imgs/nota.jpg';

export const NightstandNoteModal: React.FC<NightstandNoteModalProps> = ({ onClose }) => {
  const [currentSrc, setCurrentSrc] = useState<string>(PRIMARY_NOTE_PATH);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    // Play eerie page rustle sound and light haptic feedback
    horrorAudio.playCreak();
    sensorManager.vibrate([40, 30, 60]);
  }, []);

  const handleImageError = () => {
    if (currentSrc === PRIMARY_NOTE_PATH) {
      setCurrentSrc(FALLBACK_NOTE_PATH);
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-200">
      {/* Container Card */}
      <div className="relative w-full max-w-lg max-h-[92vh] bg-stone-950/90 border border-amber-900/40 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(180,83,9,0.15)] flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-4 py-3 border-b border-stone-800/80 bg-stone-950/95 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-700/40 text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-amber-200">
                NOTA DE LA MESA DE LUZ
              </h2>
              <p className="text-[10px] text-stone-400 font-mono">
                Papel amarillento y desgastado con manchas de sangre
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsZoomed((prev) => !prev)}
              title={isZoomed ? 'Alejar' : 'Acercar'}
              className="p-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 text-stone-300 hover:text-white transition-colors cursor-pointer"
            >
              {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              title="Cerrar nota"
              className="p-1.5 rounded-lg bg-stone-900/80 hover:bg-red-950/80 border border-stone-700/60 hover:border-red-700/60 text-stone-400 hover:text-red-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Note Image Viewport */}
        <div className="relative flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_rgba(40,25,15,0.4)_0%,_rgba(10,8,6,0.95)_100%)]">
          {!hasError ? (
            <div
              onClick={() => setIsZoomed((prev) => !prev)}
              className={`relative cursor-pointer transition-transform duration-300 ${
                isZoomed ? 'scale-125 sm:scale-135 py-8' : 'scale-100 hover:scale-[1.02]'
              }`}
            >
              <img
                src={currentSrc}
                alt="Nota en la mesa de luz"
                onError={handleImageError}
                className="max-h-[64vh] max-w-[84vw] sm:max-w-md w-auto h-auto object-contain rounded-lg filter drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)] contrast-105 brightness-95"
              />
              <div className="absolute inset-0 pointer-events-none rounded-lg bg-[radial-gradient(circle_at_50%_40%,_transparent_60%,_rgba(30,15,5,0.25)_100%)]" />
            </div>
          ) : (
            <div className="p-8 text-center text-stone-400 font-mono text-xs">
              <FileText className="w-12 h-12 mx-auto text-amber-600/60 mb-2" />
              <p>No se pudo cargar la imagen de la nota.</p>
            </div>
          )}
        </div>

        {/* Footer info & Close Action */}
        <div className="px-4 py-3 border-t border-stone-800/80 bg-stone-950/95 flex items-center justify-between text-xs font-mono">
          <span className="text-stone-400 text-[11px] hidden sm:inline">
            Toca la nota para ampliarla / reducirla
          </span>
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 border border-amber-600/50 text-amber-100 font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            Guardar Nota
          </button>
        </div>

      </div>
    </div>
  );
};
