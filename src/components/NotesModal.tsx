/**
 * Diary Notes Modal (Diario del Investigador Atrapado)
 * Clues and atmospheric lore found on the study desk.
 * Plays zero-latency Papel.mp3 sound upon interaction.
 */

import React, { useEffect, useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface NotesModalProps {
  onClose: () => void;
}

const PRIMARY_NOTE_PATH = '/imgs/nota-diario.png';
const FALLBACK_NOTE_PATH = '/imgs/nota.png';

export const NotesModal: React.FC<NotesModalProps> = ({ onClose }) => {
  const [currentSrc, setCurrentSrc] = useState<string>(PRIMARY_NOTE_PATH);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const mountTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    mountTimeRef.current = Date.now();
    horrorAudio.playPaperSound();
    sensorManager.vibrate([40, 30, 60]);

    // Preload image to guarantee zero latency
    const img = new Image();
    img.src = PRIMARY_NOTE_PATH;
  }, []);

  const handleImageError = () => {
    if (currentSrc === PRIMARY_NOTE_PATH) {
      setCurrentSrc(FALLBACK_NOTE_PATH);
    }
  };

  const handleClose = () => {
    horrorAudio.playPaperSound();
    onClose();
  };

  const handleBackdropInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent synthetic touch taps (< 350ms) from immediately dismissing modal
    if (Date.now() - mountTimeRef.current < 350) {
      return;
    }
    handleClose();
  };

  return (
    <div
      onClick={handleBackdropInteraction}
      onTouchEnd={handleBackdropInteraction}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200 h-[100dvh] w-screen cursor-pointer touch-auto"
    >
      {/* Top Floating Controls for Mobile Usability */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 cursor-default"
      >
        <button
          onClick={() => setIsZoomed((prev) => !prev)}
          className="p-2.5 rounded-full bg-stone-900/90 border border-amber-600/50 text-amber-200 hover:text-white active:scale-95 transition-all shadow-lg cursor-pointer"
          title={isZoomed ? 'Alejar' : 'Acercar'}
        >
          {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
        </button>
        <button
          onClick={handleClose}
          className="p-2.5 rounded-full bg-stone-900/90 border border-stone-700/80 text-stone-300 hover:text-red-400 active:scale-95 transition-all shadow-lg cursor-pointer"
          title="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Floating Guidance Text at Bottom */}
      <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center w-full max-w-[92vw] px-2 flex justify-center pb-[env(safe-area-inset-bottom)]">
        <span className="inline-block px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-stone-950/90 border border-amber-500/40 text-amber-300 text-[11px] sm:text-xs font-mono font-medium whitespace-nowrap backdrop-blur-md shadow-xl truncate">
          Toca fuera o la X para cerrar
        </span>
      </div>

      {/* Parchment Note Image (/imgs/nota-diario.png) */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (Date.now() - mountTimeRef.current >= 350) {
            setIsZoomed((prev) => !prev);
          }
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
        }}
        className={`relative transition-transform duration-300 cursor-pointer ${
          isZoomed ? 'scale-125 sm:scale-150' : 'scale-100 hover:scale-105'
        }`}
      >
        <img
          src={currentSrc}
          alt="Diario del Investigador"
          onError={handleImageError}
          className="max-w-[90vw] max-h-[70dvh] sm:max-h-[78dvh] object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.95)] contrast-105 brightness-105 select-none"
        />
      </div>
    </div>
  );
};
