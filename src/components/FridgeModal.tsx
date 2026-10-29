/**
 * Refrigerator Modal (Heladera)
 * Displays fridge interior image (/imgs/refrijerador_2.png when key is present,
 * /imgs/refrijerador_1.png after key is collected).
 * Includes interactive Zoom & Drag panning for mobile devices.
 * Key popup has frameless design with blurred circle backdrop and automatically
 * closes the fridge modal upon tapping "Aceptar".
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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

  // Zoom & Pan state
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Gesture refs
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialZoomScaleRef = useRef<number>(1);
  const lastTapRef = useRef<number>(0);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanningRef = useRef<boolean>(false);

  const handleClose = () => {
    horrorAudio.playFridgeSound();
    onClose();
  };

  const handleGrabKey = () => {
    if (collected || isPanningRef.current) return;
    setCollected(true);
    setShowKeyPopup(true);
    horrorAudio.playKeyCollect();
    horrorAudio.playFridgeSound();
    sensorManager.vibrate([60, 40, 80]);
    onPickUpKey();
  };

  const handleAcceptKey = () => {
    setShowKeyPopup(false);
    horrorAudio.playFridgeSound();
    onClose(); // Automatically close fridge upon accepting key
  };

  // Zoom controls
  const zoomIn = () => {
    setZoomScale((prev) => Math.min(3, Math.round((prev + 0.5) * 10) / 10));
  };

  const zoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(1, Math.round((prev - 0.5) * 10) / 10);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const resetZoom = () => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    isPanningRef.current = false;

    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistanceRef.current = dist;
      initialZoomScaleRef.current = zoomScale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        if (zoomScale > 1) {
          resetZoom();
        } else {
          setZoomScale(2);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      if (zoomScale > 1) {
        setIsDragging(true);
        dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        panStartRef.current = { ...pan };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / initialPinchDistanceRef.current;
      const newScale = Math.min(3, Math.max(1, initialZoomScaleRef.current * ratio));
      setZoomScale(Math.round(newScale * 100) / 100);
      if (newScale === 1) {
        setPan({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && zoomScale > 1) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 8) {
        isPanningRef.current = true;
      }
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialPinchDistanceRef.current = null;
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale > 1) {
      isPanningRef.current = false;
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...pan };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomScale > 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 8) {
        isPanningRef.current = true;
      }
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-2 sm:p-4 select-none backdrop-blur-md overflow-hidden">
      {/* Floating Close Button Top Right */}
      <button
        onClick={handleClose}
        className="fixed top-4 right-4 z-40 p-2.5 rounded-full bg-stone-900/90 border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors shadow-2xl cursor-pointer hover:scale-105 active:scale-95"
        title="Cerrar heladera"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Floating Zoom Controls Bottom Left */}
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 bg-stone-900/90 border border-stone-700/80 rounded-full px-3 py-1.5 shadow-2xl backdrop-blur-md text-stone-200">
        <button
          onClick={zoomOut}
          disabled={zoomScale <= 1}
          className="p-1.5 rounded-full hover:bg-stone-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-stone-300 transition-all cursor-pointer"
          title="Alejar zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono font-bold text-amber-400 min-w-[36px] text-center">
          {Math.round(zoomScale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          disabled={zoomScale >= 3}
          className="p-1.5 rounded-full hover:bg-stone-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-stone-300 transition-all cursor-pointer"
          title="Acercar zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        {zoomScale > 1 && (
          <button
            onClick={resetZoom}
            className="p-1.5 rounded-full hover:bg-stone-800 active:scale-95 text-amber-400 hover:text-amber-300 transition-all cursor-pointer ml-1"
            title="Restablecer zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Zoomable & Pannable Fridge View Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full max-w-5xl h-[85vh] flex items-center justify-center touch-none select-none ${
          zoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
      >
        <div
          style={{
            transform: `scale(${zoomScale}) translate(${pan.x / zoomScale}px, ${pan.y / zoomScale}px)`,
            transformOrigin: 'center center',
            transition:
              isDragging || initialPinchDistanceRef.current !== null
                ? 'none'
                : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
          }}
          className="relative inline-block max-w-full max-h-[85vh]"
        >
          {/* Main Fridge Image */}
          <img
            src={collected ? '/imgs/refrijerador_1.png' : '/imgs/refrijerador_2.png'}
            alt="Heladera"
            className="max-w-full max-h-[85vh] object-contain filter drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] select-none pointer-events-none"
          />

          {/* Interactive Key Hotspot on the key in the image */}
          {!collected && (
            <button
              onClick={handleGrabKey}
              title="Agarrar llave"
              className="absolute top-[18%] left-[29%] w-[10%] aspect-square cursor-pointer focus:outline-none z-10 hover:bg-amber-400/20 active:bg-amber-500/30 rounded-full transition-colors"
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
              alt="Llave del baño"
              className="w-28 h-28 sm:w-32 sm:h-32 object-contain filter drop-shadow-[0_0_20px_rgba(245,158,11,0.5)] select-none pointer-events-none mb-3"
            />

            {/* Text below */}
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-amber-200 tracking-wide text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-6">
              Llave del baño
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
