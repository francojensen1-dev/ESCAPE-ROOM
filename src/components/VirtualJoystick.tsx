/**
 * Virtual Analog Touch Joystick for Mobile First-Person Navigation
 * Uses Pointer Events with global window tracking for smooth, stutter-free movement.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const activePointerId = useRef<number | null>(null);

  const radius = 50; // Maximum travel distance for the knob in pixels
  const deadzone = 0.05;

  const updateKnob = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      let kx = dx;
      let ky = dy;
      if (dist > radius) {
        const angle = Math.atan2(dy, dx);
        kx = Math.cos(angle) * radius;
        ky = Math.sin(angle) * radius;
      }

      if (knobRef.current) {
        knobRef.current.style.transform = `translate3d(${kx}px, ${ky}px, 0px)`;
      }

      const normX = kx / radius;
      const normY = -ky / radius;
      const normLen = Math.hypot(normX, normY);

      if (normLen < deadzone) {
        onMove({ x: 0, y: 0 });
      } else {
        const scaledLen = (normLen - deadzone) / (1 - deadzone);
        const angle = Math.atan2(normY, normX);
        onMove({
          x: Math.cos(angle) * scaledLen,
          y: Math.sin(angle) * scaledLen,
        });
      }
    },
    [onMove]
  );

  const resetKnob = useCallback(() => {
    activePointerId.current = null;
    setIsDragging(false);
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
    }
    onMove({ x: 0, y: 0 });
  }, [onMove]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activePointerId.current !== null) return;

    activePointerId.current = e.pointerId;
    setIsDragging(true);
    updateKnob(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (activePointerId.current === e.pointerId) {
        updateKnob(e.clientX, e.clientY);
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (activePointerId.current === e.pointerId) {
        resetKnob();
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', handleGlobalPointerUp, { passive: true });
    window.addEventListener('pointercancel', handleGlobalPointerUp, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [updateKnob, resetKnob]);

  useEffect(() => {
    return () => {
      onMove({ x: 0, y: 0 });
    };
  }, [onMove]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className={`relative w-32 h-32 rounded-full select-none touch-none flex items-center justify-center transition-all ${
        isDragging
          ? 'bg-amber-950/40 border-2 border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.35)] scale-105'
          : 'bg-black/55 backdrop-blur-md border border-white/20 shadow-2xl'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Outer directional ticks */}
      <div className="absolute top-2 w-1.5 h-1.5 rounded-full bg-amber-400/60 pointer-events-none" />
      <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-stone-500/50 pointer-events-none" />
      <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-stone-500/50 pointer-events-none" />
      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-stone-500/50 pointer-events-none" />

      {/* Axis crosshair guides */}
      <div className="absolute w-3/4 h-[1px] bg-white/10 pointer-events-none" />
      <div className="absolute h-3/4 w-[1px] bg-white/10 pointer-events-none" />

      {/* Inner boundary guide */}
      <div className="absolute w-20 h-20 rounded-full border border-dashed border-white/15 pointer-events-none" />

      {/* Analog Thumb Knob */}
      <div
        ref={knobRef}
        className="w-14 h-14 rounded-full bg-gradient-to-b from-stone-700 via-stone-800 to-stone-950 border-2 border-amber-500/60 shadow-xl flex items-center justify-center pointer-events-none will-change-transform"
      >
        <div
          className={`w-4 h-4 rounded-full transition-colors ${
            isDragging
              ? 'bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.9)] scale-110'
              : 'bg-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
          }`}
        />
      </div>

      {/* Subtle label */}
      <div className="absolute -bottom-5 text-[9px] font-mono font-bold tracking-widest text-stone-400 uppercase pointer-events-none">
        DESPLAZAMIENTO
      </div>
    </div>
  );
};
