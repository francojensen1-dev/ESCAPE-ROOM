/**
 * Virtual Touch Joystick Component for Mobile Navigation
 */

import React, { useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [activeTouchId, setActiveTouchId] = useState<number | null>(null);

  const radius = 45; // Max joystick radius in px

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (activeTouchId !== null) return;
    const touch = e.changedTouches[0];
    setActiveTouchId(touch.identifier);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        setActiveTouchId(null);
        setKnobPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
        break;
      }
    }
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
      onMove({ x: dx / radius, y: -dy / radius });
    } else {
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * radius;
      const ky = Math.sin(angle) * radius;
      setKnobPos({ x: kx, y: ky });
      onMove({ x: kx / radius, y: -ky / radius });
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="relative w-28 h-28 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center select-none touch-none shadow-2xl active:border-amber-500/40"
    >
      {/* Outer crosshair guides */}
      <div className="absolute w-full h-[1px] bg-white/10 pointer-events-none" />
      <div className="absolute h-full w-[1px] bg-white/10 pointer-events-none" />

      {/* Joystick Knob */}
      <div
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: activeTouchId === null ? 'transform 0.15s ease-out' : 'none',
        }}
        className="w-12 h-12 rounded-full bg-gradient-to-b from-stone-700 to-stone-900 border border-amber-500/50 shadow-lg flex items-center justify-center pointer-events-none"
      >
        <div className="w-3.5 h-3.5 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
      </div>
    </div>
  );
};
