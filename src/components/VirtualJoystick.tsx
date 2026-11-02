/**
 * Virtual Analog Touch Joystick for Mobile First-Person Navigation
 * Optimized for mobile touchscreens with native touch tracking,
 * zero React re-render lag (direct DOM transform updates),
 * and multi-touch isolation so camera look touches don't interrupt movement.
 */

import React, { useRef, useEffect, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeTouchId = useRef<number | null>(null);
  const activePointerId = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const RADIUS = 50; // Maximum travel distance for the knob in pixels

  const updatePosition = useCallback(
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

      if (dist > RADIUS) {
        const angle = Math.atan2(dy, dx);
        kx = Math.cos(angle) * RADIUS;
        ky = Math.sin(angle) * RADIUS;
      }

      if (knobRef.current) {
        knobRef.current.style.transform = `translate3d(${kx}px, ${ky}px, 0)`;
      }

      // X: -1..1 (strafe left/right), Y: -1..1 (forward = positive Y, back = negative Y)
      onMove({
        x: Math.round((kx / RADIUS) * 1000) / 1000,
        y: Math.round((-ky / RADIUS) * 1000) / 1000,
      });
    },
    [onMove]
  );

  const resetJoystick = useCallback(() => {
    activeTouchId.current = null;
    activePointerId.current = null;
    isDraggingRef.current = false;

    if (knobRef.current) {
      knobRef.current.style.transition = 'transform 0.15s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
      knobRef.current.style.transform = 'translate3d(0px, 0px, 0)';
    }

    onMove({ x: 0, y: 0 });
  }, [onMove]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Touch Event Handlers (Mobile Touchscreens) ---
    const handleTouchStart = (e: TouchEvent) => {
      if (activeTouchId.current !== null) return;
      const touch = e.changedTouches[0];
      if (!touch) return;

      activeTouchId.current = touch.identifier;
      isDraggingRef.current = true;

      if (knobRef.current) {
        knobRef.current.style.transition = 'none';
      }

      updatePosition(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (activeTouchId.current === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId.current) {
          if (e.cancelable) {
            e.preventDefault(); // Stop mobile browser scrolling/gestures!
          }
          updatePosition(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (activeTouchId.current === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId.current) {
          resetJoystick();
          break;
        }
      }
    };

    // Attach listeners with passive: false to allow e.preventDefault()
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // --- Pointer Event Handlers (Mouse / Desktop Fallback) ---
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return; // Handled by touch events above
      if (activePointerId.current !== null) return;

      activePointerId.current = e.pointerId;
      isDraggingRef.current = true;

      if (knobRef.current) {
        knobRef.current.style.transition = 'none';
      }

      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        // Fallback
      }

      updatePosition(e.clientX, e.clientY);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (activePointerId.current !== e.pointerId || !isDraggingRef.current) return;
      updatePosition(e.clientX, e.clientY);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (activePointerId.current !== e.pointerId) return;

      try {
        if (container.hasPointerCapture(e.pointerId)) {
          container.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Fallback
      }

      resetJoystick();
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerUp);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);

      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [updatePosition, resetJoystick]);

  return (
    <div
      ref={containerRef}
      className="relative w-32 h-32 rounded-full select-none touch-none flex items-center justify-center bg-stone-950/70 backdrop-blur-md border-2 border-amber-500/40 shadow-2xl"
      style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Outer directional ticks */}
      <div className="absolute top-2 w-1.5 h-1.5 rounded-full bg-amber-400/80 pointer-events-none" />
      <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-stone-500/50 pointer-events-none" />
      <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-stone-500/50 pointer-events-none" />
      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-stone-500/50 pointer-events-none" />

      {/* Axis crosshair guides */}
      <div className="absolute w-3/4 h-[1px] bg-white/15 pointer-events-none" />
      <div className="absolute h-3/4 w-[1px] bg-white/15 pointer-events-none" />

      {/* Inner boundary guide */}
      <div className="absolute w-20 h-20 rounded-full border border-dashed border-white/20 pointer-events-none" />

      {/* Analog Thumb Knob (hardware accelerated) */}
      <div
        ref={knobRef}
        className="w-14 h-14 rounded-full bg-gradient-to-b from-stone-700 via-stone-800 to-stone-950 border-2 border-amber-500/90 shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center justify-center pointer-events-none will-change-transform"
        style={{ transform: 'translate3d(0px, 0px, 0)' }}
      >
        <div className="w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.9)]" />
      </div>

      {/* Subtle label */}
      <div className="absolute -bottom-5 text-[9px] font-mono font-bold tracking-widest text-amber-400/90 uppercase pointer-events-none">
        DESPLAZAMIENTO
      </div>
    </div>
  );
};
