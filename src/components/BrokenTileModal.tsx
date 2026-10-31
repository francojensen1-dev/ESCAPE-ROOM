import React, { useEffect, useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface BrokenTileModalProps {
  hasDiscoveredCode: boolean;
  onDiscoverCode: () => void;
  onClose: () => void;
}

export const BrokenTileModal: React.FC<BrokenTileModalProps> = ({
  hasDiscoveredCode,
  onDiscoverCode,
  onClose,
}) => {
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const mountTimeRef = useRef<number>(Date.now());

  const hasInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    mountTimeRef.current = Date.now();
    horrorAudio.playPaperSound();
    sensorManager.vibrate([40, 30, 60]);

    if (!hasDiscoveredCode) {
      onDiscoverCode();
    }
  }, []);

  const handleBackdropInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    // Ignore synthetic clicks/taps from mobile tap that opened the modal (< 350ms)
    if (Date.now() - mountTimeRef.current < 350) {
      return;
    }
    onClose();
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
          onClick={onClose}
          className="p-2.5 rounded-full bg-stone-900/90 border border-stone-700/80 text-stone-300 hover:text-red-400 active:scale-95 transition-all shadow-lg cursor-pointer"
          title="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Floating Guidance Text at Bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
        <span className="px-3.5 py-1.5 rounded-full bg-stone-950/80 border border-amber-500/30 text-amber-300/90 text-xs font-mono font-medium backdrop-blur-sm shadow-md">
          Toca fuera o la X para cerrar
        </span>
      </div>

      {/* Paper Image without any frame or box */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          // Toggle zoom when tapping paper directly after mount threshold
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
          src="/imgs/papel.png"
          alt="Papel del azulejo"
          className="max-w-[92vw] max-h-[78dvh] object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.95)] contrast-110 brightness-105 select-none"
        />
      </div>
    </div>
  );
};


