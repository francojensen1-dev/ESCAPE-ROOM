/**
 * Main Door Inspection Modal (Puerta Principal Encadenada)
 * Renders ONLY the door PNG (/imgs/Puerta.png) with INVISIBLE clickable touch targets
 * over the text banners and padlocks in the image, preserving full visibility of the image text.
 * Includes gesture-based Zoom & Pan (pinch-to-zoom, double-tap to zoom, touch drag panning, and floating +/- controls)
 * optimized for mobile devices without misaligning touch hotspots.
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Lock, CheckCircle2, DoorOpen, Info, ZoomIn, ZoomOut, RotateCcw, Search } from 'lucide-react';
import { LockState, InventoryItem } from '../types/game';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface MainDoorModalProps {
  lockState: LockState;
  inventory: InventoryItem[];
  onOpenCodeLock: () => void;
  onOpenLetterLock: () => void;
  onOpenRustedCodeLock: () => void;
  onUseToiletKey: () => void;
  onEscapeSuccess: () => void;
  onClose: () => void;
}

export const MainDoorModal: React.FC<MainDoorModalProps> = ({
  lockState,
  inventory,
  onOpenCodeLock,
  onOpenLetterLock,
  onOpenRustedCodeLock,
  onUseToiletKey,
  onEscapeSuccess,
  onClose,
}) => {
  const [knockImpact, setKnockImpact] = useState(false);
  const [activeNotice, setActiveNotice] = useState<string | null>(null);
  const hasToiletKey = inventory.some((item) => item.id === 'key_toilet');

  // Zoom & Pan state
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Gesture refs
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialZoomScaleRef = useRef<number>(1);
  const lastTapRef = useRef<number>(0);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanningRef = useRef<boolean>(false);

  const unlockedCount = [
    lockState.codeLock,
    lockState.fuseLock,
    lockState.toiletKeyLock,
    lockState.letterLock,
    lockState.rustedCodeLock,
  ].filter(Boolean).length;

  const allUnlocked = unlockedCount === 5;

  useEffect(() => {
    const unregister = horrorAudio.onDoorKnock(() => {
      setKnockImpact(true);
      setTimeout(() => setKnockImpact(false), 450);
    });
    return () => unregister();
  }, []);

  const handleCloseModal = () => {
    horrorAudio.playMainDoorSound();
    onClose();
  };

  const handleUseToiletKey = () => {
    if (!hasToiletKey || lockState.toiletKeyLock) return;
    horrorAudio.playPadlockSound();
    sensorManager.vibrate([70, 50, 90]);
    onUseToiletKey();
    setActiveNotice('¡Pestillo de hierro abierto con la llave!');
  };

  const handleFuseLockClick = () => {
    horrorAudio.playPadlockSound();
    if (lockState.fuseLock) {
      setActiveNotice('El cerrojo electromagnético ya está desenergizado.');
      return;
    }
    horrorAudio.playDoorKnocks(0.2);
    sensorManager.vibrate([40, 30, 40]);
    setActiveNotice('⚡ Candado Electrónico (220V): Desconéctalo desde la caja de fusibles en la cocina.');
  };

  const handleEscape = () => {
    if (!allUnlocked) return;
    horrorAudio.playDoorOpen();
    sensorManager.vibrate([100, 100, 200, 200]);
    onEscapeSuccess();
  };

  // Helper function to safely execute button action if not panning, playing padlock sound
  const safeAction = (action: () => void, isPadlock: boolean = true) => {
    if (isPanningRef.current) return;
    if (isPadlock) {
      horrorAudio.playPadlockSound();
    }
    action();
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

  // Touch Gesture Handlers (Pinch zoom & touch drag pan & double tap)
  const handleTouchStart = (e: React.TouchEvent) => {
    isPanningRef.current = false;

    if (e.touches.length === 2) {
      // Pinch gesture start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistanceRef.current = dist;
      initialZoomScaleRef.current = zoomScale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap gesture
        if (zoomScale > 1) {
          resetZoom();
        } else {
          setZoomScale(2);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      // Start drag panning if zoomed
      if (zoomScale > 1) {
        setIsDragging(true);
        dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        panStartRef.current = { ...pan };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistanceRef.current !== null) {
      // Pinching
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
      // Touch dragging
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

  // Mouse Drag Handlers (for desktop/mouse users)
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
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-2 sm:p-4 select-none overflow-hidden">
      {/* Floating Close Button Centered at Top */}
      <button
        onClick={handleCloseModal}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-stone-900/90 hover:bg-red-950 border border-stone-700 hover:border-red-600 text-stone-300 hover:text-white font-mono text-xs flex items-center gap-1.5 shadow-xl transition-all cursor-pointer backdrop-blur-md"
      >
        <X className="w-4 h-4" />
        <span>VOLVER AL CUARTO</span>
      </button>

      {/* Floating Zoom Controls */}
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

      {/* Mobile Touch Zoom Hint */}
      <div className="fixed bottom-16 sm:bottom-4 right-4 z-40 hidden xs:flex items-center gap-1.5 bg-stone-950/80 border border-stone-800/80 px-3 py-1.5 rounded-full text-[11px] font-mono text-stone-400 pointer-events-none shadow-lg backdrop-blur-xs">
        <Search className="w-3.5 h-3.5 text-amber-400" />
        <span>Toca 2 veces o pellizca para Zoom</span>
      </div>

      {/* Interactive Notice Bar */}
      {activeNotice && (
        <div className="fixed top-16 z-40 bg-amber-950/90 border border-amber-600/80 py-1.5 px-4 rounded-full text-xs font-mono text-amber-200 font-semibold flex items-center gap-2 shadow-2xl animate-fadeIn backdrop-blur-md">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{activeNotice}</span>
          <button onClick={() => setActiveNotice(null)} className="ml-2 text-amber-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Zoomable & Pannable Door View Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full max-w-5xl aspect-[16/9] flex items-center justify-center my-auto touch-none select-none transition-cursor ${
          zoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
      >
        <div
          style={{
            transform: `scale(${zoomScale}) translate(${pan.x / zoomScale}px, ${pan.y / zoomScale}px)`,
            transformOrigin: 'center center',
            transition: isDragging || initialPinchDistanceRef.current !== null ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
          }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Door Image */}
          <img
            src="/imgs/Puerta.png"
            alt="Puerta Principal"
            className={`w-full h-full object-contain pointer-events-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)] transition-transform duration-75 ${
              knockImpact ? 'scale-[1.015]' : ''
            }`}
          />

          {/* ------------------------------------------------------------- */}
          {/* INVISIBLE BUTTON 1: Top Left - 1. CANDADO DE COMBINACIÓN       */}
          {/* ------------------------------------------------------------- */}
          <div
            className="absolute flex items-center justify-center"
            style={{ top: '10%', left: '10.5%', width: '29.5%', height: '11.5%' }}
          >
            {lockState.codeLock ? (
              <div className="w-full h-full rounded-lg border border-emerald-500/80 bg-emerald-950/80 backdrop-blur-xs flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[10px] sm:text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>✓ ABIERTO</span>
              </div>
            ) : (
              <button
                onClick={() => safeAction(onOpenCodeLock)}
                title="1 - Candado de Combinación"
                className="w-full h-full rounded-lg bg-transparent hover:bg-amber-400/20 active:bg-amber-400/35 border border-transparent hover:border-amber-400/60 shadow-none hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all cursor-pointer touch-manipulation"
              />
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* INVISIBLE BUTTON 4: Top Right - 4. CANDADO DE 5 LETRAS        */}
          {/* ------------------------------------------------------------- */}
          <div
            className="absolute flex items-center justify-center"
            style={{ top: '10%', left: '66.5%', width: '28.5%', height: '11.5%' }}
          >
            {lockState.letterLock ? (
              <div className="w-full h-full rounded-lg border border-emerald-500/80 bg-emerald-950/80 backdrop-blur-xs flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[10px] sm:text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>✓ ABIERTO</span>
              </div>
            ) : (
              <button
                onClick={() => safeAction(onOpenLetterLock)}
                title="4 - Candado de 5 Letras"
                className="w-full h-full rounded-lg bg-transparent hover:bg-amber-400/20 active:bg-amber-400/35 border border-transparent hover:border-amber-400/60 shadow-none hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all cursor-pointer touch-manipulation"
              />
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* INVISIBLE BUTTON 3: Middle Right - 3. CANDADO OXIDADO          */}
          {/* ------------------------------------------------------------- */}
          <div
            className="absolute flex items-center justify-center"
            style={{ top: '40.5%', left: '72.5%', width: '26.5%', height: '11.5%' }}
          >
            {lockState.toiletKeyLock ? (
              <div className="w-full h-full rounded-lg border border-emerald-500/80 bg-emerald-950/80 backdrop-blur-xs flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[10px] sm:text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>✓ ABIERTO</span>
              </div>
            ) : (
              <button
                onClick={() =>
                  safeAction(() => {
                    if (hasToiletKey) {
                      handleUseToiletKey();
                    } else {
                      setActiveNotice('🔑 Candado Oxidado: Necesitas una llave pesada de hierro.');
                    }
                  })
                }
                title="3 - Candado Oxidado"
                className="w-full h-full rounded-lg bg-transparent hover:bg-amber-400/20 active:bg-amber-400/35 border border-transparent hover:border-amber-400/60 shadow-none hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all cursor-pointer touch-manipulation"
              />
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* INVISIBLE BUTTON 5: Bottom Left - 5. CANDADO COMB. OXIDADO    */}
          {/* ------------------------------------------------------------- */}
          <div
            className="absolute flex items-center justify-center"
            style={{ top: '58%', left: '4%', width: '30.5%', height: '11.5%' }}
          >
            {lockState.rustedCodeLock ? (
              <div className="w-full h-full rounded-lg border border-emerald-500/80 bg-emerald-950/80 backdrop-blur-xs flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[10px] sm:text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>✓ ABIERTO</span>
              </div>
            ) : (
              <button
                onClick={() => safeAction(onOpenRustedCodeLock)}
                title="5 - Candado de Combinación Oxidado"
                className="w-full h-full rounded-lg bg-transparent hover:bg-amber-400/20 active:bg-amber-400/35 border border-transparent hover:border-amber-400/60 shadow-none hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all cursor-pointer touch-manipulation"
              />
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* INVISIBLE BUTTON 2: Bottom Right - 2. CANDADO ELECTRÓNICO     */}
          {/* ------------------------------------------------------------- */}
          <div
            className="absolute flex items-center justify-center"
            style={{ top: '71.5%', left: '65.5%', width: '28.5%', height: '11.5%' }}
          >
            {lockState.fuseLock ? (
              <div className="w-full h-full rounded-lg border border-emerald-500/80 bg-emerald-950/80 backdrop-blur-xs flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[10px] sm:text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>✓ DESENERGIZADO</span>
              </div>
            ) : (
              <button
                onClick={() => safeAction(handleFuseLockClick)}
                title="2 - Candado Electrónico"
                className="w-full h-full rounded-lg bg-transparent hover:bg-amber-400/20 active:bg-amber-400/35 border border-transparent hover:border-amber-400/60 shadow-none hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all cursor-pointer touch-manipulation"
              />
            )}
          </div>

          {/* Invisible hotspots directly on padlocks in image */}
          <button
            onClick={() => safeAction(() => (!lockState.codeLock ? onOpenCodeLock() : null))}
            title="1 - Candado de Combinación"
            style={{ top: '30%', left: '43.5%', width: '7%', height: '12%' }}
            className={`absolute rounded-full border border-dashed transition-all touch-manipulation ${
              lockState.codeLock ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-transparent hover:border-amber-400/60 hover:bg-amber-400/20 cursor-pointer'
            }`}
          />
          <button
            onClick={() => safeAction(() => (!lockState.letterLock ? onOpenLetterLock() : null))}
            title="4 - Candado de 5 Letras"
            style={{ top: '28%', left: '53.5%', width: '7%', height: '12%' }}
            className={`absolute rounded-full border border-dashed transition-all touch-manipulation ${
              lockState.letterLock ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-transparent hover:border-amber-400/60 hover:bg-amber-400/20 cursor-pointer'
            }`}
          />
          <button
            onClick={() => safeAction(() => (!lockState.rustedCodeLock ? onOpenRustedCodeLock() : null))}
            title="5 - Candado Combinación Oxidada"
            style={{ top: '49%', left: '42.5%', width: '7%', height: '12%' }}
            className={`absolute rounded-full border border-dashed transition-all touch-manipulation ${
              lockState.rustedCodeLock ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-transparent hover:border-amber-400/60 hover:bg-amber-400/20 cursor-pointer'
            }`}
          />
          <button
            onClick={() => safeAction(handleFuseLockClick)}
            title="2 - Candado Electrónico"
            style={{ top: '45%', left: '55.5%', width: '6.5%', height: '15%' }}
            className={`absolute rounded-full border border-dashed transition-all touch-manipulation ${
              lockState.fuseLock ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-transparent hover:border-amber-400/60 hover:bg-amber-400/20 cursor-pointer'
            }`}
          />
          <button
            onClick={() =>
              safeAction(() =>
                hasToiletKey && !lockState.toiletKeyLock
                  ? handleUseToiletKey()
                  : setActiveNotice('🔑 Candado Oxidado: Necesitas una llave pesada de hierro.')
              )
            }
            title="3 - Candado Oxidado"
            style={{ top: '44%', left: '61.5%', width: '4%', height: '8%' }}
            className={`absolute rounded-full border border-dashed transition-all touch-manipulation ${
              lockState.toiletKeyLock ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-transparent hover:border-amber-400/60 hover:bg-amber-400/20 cursor-pointer'
            }`}
          />
        </div>
      </div>

      {/* Floating Escape Button (When all 5 locks unlocked) */}
      {allUnlocked && (
        <button
          onClick={handleEscape}
          className="fixed bottom-6 z-40 px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-sm font-extrabold flex items-center gap-2.5 shadow-[0_0_30px_rgba(16,185,129,0.8)] animate-bounce transition-all cursor-pointer border border-emerald-400"
        >
          <DoorOpen className="w-6 h-6" />
          <span>¡ABRIR PUERTA Y ESCAPAR!</span>
        </button>
      )}
    </div>
  );
};

