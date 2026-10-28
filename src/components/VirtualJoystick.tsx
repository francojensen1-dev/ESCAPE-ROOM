/**
 * Virtual Analog Touch Joystick for Mobile First-Person Navigation
 * Uses Pointer Events with pointer capture to prevent losing touch tracking.
 */

import React, { useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const activePointerId = useRef<number | null>(null);

  const radius = 50; // Maximum travel distance for the knob in pixels

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activePointerId.current !== null) return;

    activePointerId.current = e.pointerId;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback if pointer capture fails
    }
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activePointerId.current !== e.pointerId) return;
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activePointerId.current !== e.pointerId) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Safe fallback
    }

    activePointerId.current = null;
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist <= radius) {
      setKnobPos({ x: dx, y: dy });
      // X: -1..1 (strafe left/right), Y: -1..1 (forward = positive Y, back = negative Y)
      onMove({
        x: dx / radius,
        y: -dy / radius,
      });
    } else {
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * radius;
      const ky = Math.sin(angle) * radius;
      setKnobPos({ x: kx, y: ky });
      onMove({
        x: kx / radius,
        y: -ky / radius,
      });
    }
  };

  useEffect(() => {
    return () => {
      onMove({ x: 0, y: 0 });
    };
  }, [onMove]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        }}
        className="w-14 h-14 rounded-full bg-gradient-to-b from-stone-700 via-stone-800 to-stone-950 border-2 border-amber-500/60 shadow-xl flex items-center justify-center pointer-events-none"
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
