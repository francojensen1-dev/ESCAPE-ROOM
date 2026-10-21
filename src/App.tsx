/**
 * ESCAPE FROM “THE PIBE” ROOM
 * Main Application Orchestrator
 * Integrates Three.js 3D Room, SensorManager, HorrorAudioManager,
 * Virtual Joystick, and Interactive Puzzle Modals.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EscapeRoomScene } from './three/EscapeRoomScene';
import { sensorManager } from './sensors/SensorManager';
import { horrorAudio } from './audio/HorrorAudioManager';
import {
  AudioMetrics,
  InteractiveTargetId,
  InventoryItem,
  LockState,
  SensorsState,
  FocusState,
} from './types/game';

// Components
import { TopStatusBar } from './components/TopStatusBar';
import { VirtualJoystick } from './components/VirtualJoystick';
import { PermissionModal } from './components/PermissionModal';
import { MainDoorModal } from './components/MainDoorModal';
import { PeepholeModal } from './components/PeepholeModal';
import { FridgeModal } from './components/FridgeModal';
import { CodeLockModal } from './components/CodeLockModal';
import { FuseBoxModal } from './components/FuseBoxModal';
import { NotesModal } from './components/NotesModal';
import { InventoryDrawer } from './components/InventoryDrawer';
import { JumpscareModal } from './components/JumpscareModal';
import { VictoryModal } from './components/VictoryModal';
import { ToiletModal } from './components/ToiletModal';
import { BrokenTileModal } from './components/BrokenTileModal';
import { LetterLockModal } from './components/LetterLockModal';
import { BathroomDoorModal } from './components/BathroomDoorModal';
import { Hand, Eye, AlertTriangle } from 'lucide-react';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<EscapeRoomScene | null>(null);

  // Game Lifecycle
  const [gameStage, setGameStage] = useState<'intro' | 'playing' | 'jumpscare' | 'escaped'>('intro');
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 minutes = 900 seconds
  const [timeElapsed, setTimeElapsed] = useState<number>(0);

  // Sensor & Audio State
  const [sensors, setSensors] = useState<SensorsState>({
    gyroscopeAllowed: false,
    micAllowed: false,
    cameraAllowed: false,
    hasDeviceOrientation: false,
    useGyro: true,
    audioActive: true,
  });
  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics>({ volume: 0, bassLevel: 0 });
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(true);

  // Puzzle & Inventory State
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: 'note_clues',
      name: 'Diario del Investigador',
      description: 'Página con anotaciones sobre las 4 cerraduras, la puerta divisoria y el baño contiguo.',
      icon: 'note',
    },
  ]);

  const [lockState, setLockState] = useState<LockState>({
    bathroomDoor: false,
    codeLock: false,
    fuseLock: false,
    toiletKeyLock: false,
    letterLock: false,
    allChainsRemoved: false,
  });
  const [hasDiscoveredTileCode, setHasDiscoveredTileCode] = useState<boolean>(false);

  // UI Interactive Modals
  type ActiveModalType =
    | null
    | 'main_door'
    | 'peephole'
    | 'fridge'
    | 'codelock'
    | 'fusebox'
    | 'notes'
    | 'inventory'
    | 'toilet'
    | 'broken_tile'
    | 'letterlock'
    | 'bathroom_door';

  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [nearTarget, setNearTarget] = useState<InteractiveTargetId>(null);
  const [focusState, setFocusState] = useState<FocusState>({
    targetId: null,
    isFrontallyFacing: false,
    angleDeg: 180,
    distance: 999,
    nearObliqueTargetId: null,
  });
  const [toastWarning, setToastWarning] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Movement & Look Refs
  const joystickVector = useRef({ x: 0, y: 0 });
  const keyboardKeys = useRef<{ [key: string]: boolean }>({});
  const isPointerDown = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const pointerDownTime = useRef(0);

  /**
   * Show narrative warning toast when user taps without facing frontally (±30°)
   */
  const showNarrativeWarning = useCallback((message: string) => {
    setToastWarning(message);
    sensorManager.vibrate([45, 35, 45]);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastWarning(null);
    }, 2800);
  }, []);

  /**
   * Start Experience: User gesture triggers audio and sensor permissions
   */
  const handleStartExperience = async () => {
    // 1. Initialize Horror Audio and start the illuminato loop
    const audioOk = horrorAudio.init();
    horrorAudio.startBackgroundMusic();
    horrorAudio.startCeilingFocoSound();

    // 2. Request Gyroscope
    const gyroOk = await sensorManager.requestOrientationPermission();

    setSensors((prev) => ({
      ...prev,
      audioActive: audioOk,
      hasDeviceOrientation: gyroOk,
      gyroscopeAllowed: gyroOk,
    }));

    setGameStage('playing');
  };

  /**
   * Target details for interactive prompt
   */
  const getTargetPrompt = (targetId: InteractiveTargetId) => {
    switch (targetId) {
      case 'main_door':
        return { title: 'Puerta Principal', action: 'Inspeccionar Cadenas y Visor' };
      case 'bathroom_door':
        return lockState.bathroomDoor
          ? { title: 'Puerta del Baño (Abierta)', action: 'Entrar al Baño' }
          : {
              title: 'Puerta del Baño (Con Llave)',
              action: inventory.some((i) => i.id === 'key_fridge')
                ? 'Usar Llave de Latón de la Heladera'
                : 'Puerta Cerrada con Llave',
            };
      case 'rotten_fridge':
        return { title: 'Heladera Podrida', action: 'Abrir y Buscar en el Interior' };
      case 'study_desk':
        return { title: 'Escritorio con Diario', action: 'Leer Pistas del Diario' };
      case 'fuse_box':
        return { title: 'Caja de Fusibles', action: 'Manipular Interruptores 220V' };
      case 'toilet':
        return { title: 'Inodoro Decrépito (Baño)', action: 'Revisar Fondo del Agua Turbia' };
      case 'broken_tile':
        return { title: 'Azulejo Agrietado (Baño)', action: 'Inspeccionar Hueco en el Muro' };
      default:
        return null;
    }
  };

  /**
   * Open the modal for the given interactive target
   */
  const handleOpenTarget = useCallback((targetId: InteractiveTargetId) => {
    if (!targetId) return;
    sensorManager.vibrate(35);
    horrorAudio.playCreak();

    switch (targetId) {
      case 'main_door':
        setActiveModal('main_door');
        break;
      case 'bathroom_door':
        setActiveModal('bathroom_door');
        break;
      case 'rotten_fridge':
        setActiveModal('fridge');
        break;
      case 'study_desk':
        setActiveModal('notes');
        break;
      case 'fuse_box':
        setActiveModal('fusebox');
        break;
      case 'toilet':
        setActiveModal('toilet');
        break;
      case 'broken_tile':
        setActiveModal('broken_tile');
        break;
    }
  }, []);

  /**
   * Helper to evaluate if all 4 chains and padlocks are removed from the main door
   */
  const isEveryLockUnlocked = (state: LockState) => {
    return (
      state.codeLock &&
      state.fuseLock &&
      state.toiletKeyLock &&
      state.letterLock
    );
  };

  /**
   * Pick up brass key from fridge (used for bathroom dividing door)
   */
  const handlePickUpKey = () => {
    setInventory((prev) => {
      if (prev.some((i) => i.id === 'key_fridge')) return prev;
      return [
        ...prev,
        {
          id: 'key_fridge',
          name: 'Llave Antigua de Latón',
          description: 'Encontrada congelada en la heladera. Abre la puerta del baño contiguo.',
          icon: 'key',
        },
      ];
    });
  };

  /**
   * Fish out rusted iron key from toilet (Lock 3)
   */
  const handleRetrieveToiletKey = () => {
    setInventory((prev) => {
      if (prev.some((i) => i.id === 'key_toilet')) return prev;
      return [
        ...prev,
        {
          id: 'key_toilet',
          name: 'Llave de Hierro Herrumbrosa',
          description: 'Llave pesada y fangosa recuperada del fondo del inodoro del baño.',
          icon: 'key',
        },
      ];
    });
  };

  /**
   * Discover word MORIR behind broken bathroom tile
   */
  const handleDiscoverBrokenTileCode = () => {
    setHasDiscoveredTileCode(true);
    setInventory((prev) => {
      if (prev.some((i) => i.id === 'note_tile_code')) return prev;
      return [
        ...prev,
        {
          id: 'note_tile_code',
          name: 'Inscripción del Azulejo',
          description: 'Palabra de 5 letras grabada tras el azulejo del baño: M-O-R-I-R.',
          icon: 'note',
        },
      ];
    });
  };

  /**
   * Unlock dividing bathroom door with fridge brass key
   */
  const handleUnlockBathroomDoor = () => {
    setLockState((prev) => {
      const next = { ...prev, bathroomDoor: true };
      if (sceneRef.current) sceneRef.current.updateLocks(next);
      return next;
    });
  };

  /**
   * Unlock code lock on main door (Lock 2)
   */
  const handleSolveCodeLock = () => {
    setLockState((prev) => {
      const next = { ...prev, codeLock: true };
      next.allChainsRemoved = isEveryLockUnlocked(next);
      if (sceneRef.current) sceneRef.current.updateLocks(next);
      return next;
    });
  };

  /**
   * Solve fuse box (Lock 3)
   */
  const handleSolveFuseBox = () => {
    setLockState((prev) => {
      const next = { ...prev, fuseLock: true };
      next.allChainsRemoved = isEveryLockUnlocked(next);
      if (sceneRef.current) sceneRef.current.updateLocks(next);
      return next;
    });
  };

  /**
   * Unlock rusted iron padlock with toilet key (Lock 4)
   */
  const handleUseToiletKeyOnDoor = () => {
    setLockState((prev) => {
      const next = { ...prev, toiletKeyLock: true };
      next.allChainsRemoved = isEveryLockUnlocked(next);
      if (sceneRef.current) sceneRef.current.updateLocks(next);
      return next;
    });
  };

  /**
   * Solve 5-letter word combination padlock (Lock 5: MORIR)
   */
  const handleSolveLetterLock = () => {
    setLockState((prev) => {
      const next = { ...prev, letterLock: true };
      next.allChainsRemoved = isEveryLockUnlocked(next);
      if (sceneRef.current) sceneRef.current.updateLocks(next);
      return next;
    });
  };

  /**
   * Victory escape
   */
  const handleEscapeSuccess = () => {
    setActiveModal(null);
    setGameStage('escaped');
  };

  /**
   * Restart game
   */
  const handleRestart = () => {
    setTimeLeft(900);
    setTimeElapsed(0);
    setLockState({
      bathroomDoor: false,
      codeLock: false,
      fuseLock: false,
      toiletKeyLock: false,
      letterLock: false,
      allChainsRemoved: false,
    });
    setHasDiscoveredTileCode(false);
    setInventory([
      {
        id: 'note_clues',
        name: 'Diario del Investigador',
        description: 'Página con anotaciones sobre las 4 cerraduras, la puerta divisoria y el baño contiguo.',
        icon: 'note',
      },
    ]);
    setActiveModal(null);
    setGameStage('playing');
    if (sceneRef.current) {
      sceneRef.current.recenterCamera();
      sceneRef.current.updateLocks({
        bathroomDoor: false,
        codeLock: false,
        fuseLock: false,
        toiletKeyLock: false,
        letterLock: false,
        allChainsRemoved: false,
      });
    }
  };

  /**
   * Initialize Three.js Scene
   */
  useEffect(() => {
    if (!canvasContainerRef.current || sceneRef.current) return;

    const scene = new EscapeRoomScene(canvasContainerRef.current, (focus) => {
      setFocusState(focus);
      setNearTarget(focus.targetId);
    });
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  /**
   * 15-Minute Countdown Game Loop & Footsteps Tension
   */
  useEffect(() => {
    if (gameStage !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setGameStage('jumpscare');
          return 0;
        }
        return prev - 1;
      });

      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStage]);

  /**
   * Dynamic Tension & Audio Update
   */
  useEffect(() => {
    if (gameStage !== 'playing') return;

    // Tension from 0.0 to 1.0 based on 15 minutes
    const tension = Math.min(1.0, (900 - timeLeft) / 900);
    horrorAudio.updateTension(tension);

    // Audio Metrics Poller
    const metricsInterval = setInterval(() => {
      setAudioMetrics(horrorAudio.getMetrics());
    }, 80);

    return () => clearInterval(metricsInterval);
  }, [gameStage, timeLeft]);

  /**
   * "El Pibe" Stalker Proximity & Random Door Knocks ("Golpes en la puerta")
   * Whenever "el pibe" is near the door (due to player approaching the door or periodic hallway stalking),
   * sudden heavy knocks sound randomly against the door.
   */
  useEffect(() => {
    if (gameStage !== 'playing') return;

    let knockTimeout: number | undefined;
    let isStalkerRoamingNearDoor = false;

    // Periodic roaming cycle: El Pibe walks up to the door every ~22 seconds
    const stalkerCycle = window.setInterval(() => {
      isStalkerRoamingNearDoor = true;
      setTimeout(() => {
        isStalkerRoamingNearDoor = false;
      }, 10000);
    }, 22000);

    const triggerKnockCheck = () => {
      const dist = sceneRef.current ? sceneRef.current.getDistanceToDoor() : 6.0;
      const isPlayerAtDoor = dist < 3.8 || activeModal === 'main_door' || activeModal === 'peephole';
      const isPibeNearDoor = isPlayerAtDoor || isStalkerRoamingNearDoor;

      if (isPibeNearDoor) {
        // Distance-scaled volume: loud and punchy when near, slightly muffled if across the room
        const volumeFactor = Math.max(0.35, Math.min(1.0, 1.0 - (dist - 1.2) * 0.12));
        horrorAudio.playDoorKnocks(volumeFactor);
        if (sceneRef.current) {
          sceneRef.current.triggerDoorKnockImpact();
        }
        sensorManager.vibrate([70, 45, 70, 45, 95]);
      }

      // Next random knock in 3.5s to 9.0s
      const nextDelay = 3500 + Math.random() * 5500;
      knockTimeout = window.setTimeout(triggerKnockCheck, nextDelay);
    };

    // First knock check after initial 3.5 seconds
    knockTimeout = window.setTimeout(triggerKnockCheck, 3500);

    return () => {
      if (knockTimeout) clearTimeout(knockTimeout);
      clearInterval(stalkerCycle);
    };
  }, [gameStage, activeModal]);

  /**
   * Sensor Orientation Listener Loop
   */
  useEffect(() => {
    if (gameStage !== 'playing') return;

    if (typeof sensorManager?.onOrientationChange !== 'function') {
      return;
    }

    const unsubscribe = sensorManager.onOrientationChange((data) => {
      if (sceneRef.current && sensors.useGyro) {
        sceneRef.current.applyGyroOrientation(data);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [gameStage, sensors.useGyro]);

  /**
   * Keyboard Movement Listener (W, A, S, D & Arrows for Desktop)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keyboardKeys.current[e.code] = true;
      if (e.code === 'KeyE' && nearTarget) {
        handleOpenTarget(nearTarget);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keyboardKeys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearTarget, handleOpenTarget]);

  /**
   * Frame Tick for Movement & Gyro Smoothing
   */
  useEffect(() => {
    if (gameStage !== 'playing') return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);
      const delta = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      // Update Gyro Lerp
      sensorManager.updateSmoothing();

      if (sceneRef.current && activeModal === null) {
        // Combine Joystick and Keyboard
        let vx = joystickVector.current.x;
        let vy = joystickVector.current.y;

        if (keyboardKeys.current['KeyW'] || keyboardKeys.current['ArrowUp']) vy += 1;
        if (keyboardKeys.current['KeyS'] || keyboardKeys.current['ArrowDown']) vy -= 1;
        if (keyboardKeys.current['KeyA'] || keyboardKeys.current['ArrowLeft']) vx -= 1;
        if (keyboardKeys.current['KeyD'] || keyboardKeys.current['ArrowRight']) vx += 1;

        // Clamp
        vx = Math.max(-1, Math.min(1, vx));
        vy = Math.max(-1, Math.min(1, vy));

        if (vx !== 0 || vy !== 0) {
          sceneRef.current.applyMovement({ x: vx, y: vy }, delta);

          // Random walking footstep sound
          if (Math.random() < 0.04) {
            horrorAudio.playFootstep();
          }
        }
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameStage, activeModal]);

  /**
   * Touch/Mouse Look & Tap Interaction Handlers on Canvas
   */
  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeModal !== null) return;
    isPointerDown.current = true;
    lastPointerPos.current = { x: e.clientX, y: e.clientY };
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    pointerDownTime.current = performance.now();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current || activeModal !== null || !sceneRef.current) return;
    // On mobile with Gyroscope, camera orientation is driven exclusively by the Gyroscope.
    // Manual touch drag look is only enabled on desktop when gyro is not active.
    if (!sensors.hasDeviceOrientation || !sensors.useGyro) {
      const dx = e.clientX - lastPointerPos.current.x;
      const dy = e.clientY - lastPointerPos.current.y;
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      sceneRef.current.applyLookDelta(dx, dy);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;

    if (activeModal !== null || !sceneRef.current) return;

    const dragDist = Math.hypot(
      e.clientX - pointerDownPos.current.x,
      e.clientY - pointerDownPos.current.y
    );
    const duration = performance.now() - pointerDownTime.current;

    // Tap gesture detection: under 28px movement and under 500ms duration
    if (dragDist < 28 && duration < 500) {
      const result = sceneRef.current.triggerTouchInteraction(e.clientX, e.clientY);
      if (result.success && result.targetId) {
        handleOpenTarget(result.targetId);
      } else if (result.reason === 'oblique') {
        showNarrativeWarning('Debes ponerte justo enfrente del objeto para manipularlo');
      }
    }
  };

  const focusedPrompt = focusState.targetId ? getTargetPrompt(focusState.targetId) : null;
  const obliquePrompt = focusState.nearObliqueTargetId ? getTargetPrompt(focusState.nearObliqueTargetId) : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none touch-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={canvasContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          isPointerDown.current = false;
        }}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0"
      />

      {/* Dynamic Center Reticle HUD (Touch + Vista Frontal Verification) */}
      {gameStage === 'playing' && activeModal === null && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center">
          {focusState.isFrontallyFacing && focusState.targetId ? (
            <div className="flex flex-col items-center">
              {/* Active Targeting Brackets */}
              <div className="relative w-16 h-16 flex items-center justify-center animate-pulse">
                {/* Top-left bracket */}
                <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400" />
                {/* Top-right bracket */}
                <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400" />
                {/* Bottom-left bracket */}
                <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400" />
                {/* Bottom-right bracket */}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400" />
                {/* Glowing Center Dot */}
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,1)]" />
              </div>

              {/* Frontal Focus Tag */}
              <div className="mt-3 px-3.5 py-1.5 rounded-lg bg-stone-950/90 border border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.4)] backdrop-blur-md text-center max-w-[260px]">
                <p className="text-[11px] font-mono font-bold tracking-wider text-amber-400 uppercase">
                  {focusedPrompt?.title}
                </p>
                <p className="text-[10px] font-mono font-semibold text-amber-100 tracking-wide mt-0.5">
                  TOCA LA PANTALLA PARA INTERACTUAR
                </p>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-[9px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                  <span>ÁNGULO FRONTAL: {focusState.angleDeg}° (≤ 30°)</span>
                </div>
              </div>
            </div>
          ) : focusState.nearObliqueTargetId ? (
            <div className="flex flex-col items-center">
              {/* Oblique Angle Warning Reticle */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-dashed border-red-500/60 animate-spin" style={{ animationDuration: '7s' }} />
                <div className="w-2 h-2 rounded-full bg-red-400/90 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              </div>
              <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-stone-950/90 border border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.3)] backdrop-blur-md text-center max-w-[240px]">
                <p className="text-[10px] font-mono font-bold text-red-400 uppercase">
                  {obliquePrompt?.title}
                </p>
                <p className="text-[9px] font-mono text-stone-300 mt-0.5">
                  Ángulo oblicuo: {focusState.angleDeg}° (&gt; 30°)
                </p>
                <p className="text-[8.5px] font-mono text-amber-400/90 font-medium">
                  Ponte de frente para interactuar
                </p>
              </div>
            </div>
          ) : (
            /* Subtle Minimal Idle Crosshair */
            <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-sm" />
          )}
        </div>
      )}

      {/* Floating Narrative Toast Alert */}
      {toastWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-bounce">
          <div className="px-4 py-2.5 rounded-xl bg-red-950/95 border border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.6)] backdrop-blur-md flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs font-mono font-semibold text-red-100 tracking-wide text-center">
              {toastWarning}
            </p>
          </div>
        </div>
      )}

      {/* Top Status Bar */}
      {gameStage === 'playing' && (
        <TopStatusBar
          sensors={sensors}
          audioMetrics={audioMetrics}
          timeLeft={timeLeft}
          isFlashlightOn={isFlashlightOn}
          inventory={inventory}
          onToggleFlashlight={() => {
            if (sceneRef.current) {
              const state = sceneRef.current.toggleFlashlight();
              setIsFlashlightOn(state);
            }
          }}
          onToggleAudioMute={() => {
            const muted = horrorAudio.toggleMute();
            setSensors((prev) => ({ ...prev, audioActive: !muted }));
          }}
          onRecenterCamera={() => {
            if (sceneRef.current) sceneRef.current.recenterCamera();
            sensorManager.recenter();
          }}
          onOpenInventory={() => setActiveModal('inventory')}
        />
      )}

      {/* Bottom Controls HUD */}
      {gameStage === 'playing' && activeModal === null && (
        <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 z-20 flex items-end justify-between pointer-events-none">
          {/* Virtual Joystick (Bottom Left) */}
          <div className="pointer-events-auto">
            <VirtualJoystick
              onMove={(vec) => {
                joystickVector.current = vec;
              }}
            />
          </div>

          {/* Quick Action Button (Bottom Right) */}
          <div className="pointer-events-auto flex items-center gap-2">
            {focusState.isFrontallyFacing && focusState.targetId ? (
              <button
                onClick={() => handleOpenTarget(focusState.targetId)}
                className="px-5 py-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-95 text-black font-mono text-xs font-bold shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center gap-2 transition-transform animate-pulse"
              >
                <Hand className="w-4 h-4" />
                INTERACTUAR
              </button>
            ) : focusState.nearObliqueTargetId ? (
              <button
                onClick={() =>
                  showNarrativeWarning('Debes ponerte justo enfrente del objeto para manipularlo')
                }
                className="px-4 py-2.5 rounded-full bg-stone-900/90 border border-red-500/60 active:scale-95 text-stone-300 font-mono text-[11px] font-medium shadow-md flex items-center gap-2 transition-transform"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                MIRAR DE FRENTE
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Modals & Screens */}
      {gameStage === 'intro' && (
        <PermissionModal onStartExperience={handleStartExperience} />
      )}

      {activeModal === 'main_door' && (
        <MainDoorModal
          lockState={lockState}
          inventory={inventory}
          onOpenPeephole={() => setActiveModal('peephole')}
          onOpenCodeLock={() => setActiveModal('codelock')}
          onOpenLetterLock={() => setActiveModal('letterlock')}
          onUseToiletKey={handleUseToiletKeyOnDoor}
          onEscapeSuccess={handleEscapeSuccess}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'bathroom_door' && (
        <BathroomDoorModal
          isUnlocked={lockState.bathroomDoor}
          hasFridgeKey={inventory.some((i) => i.id === 'key_fridge')}
          onUnlock={handleUnlockBathroomDoor}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'toilet' && (
        <ToiletModal
          hasFoundKey={inventory.some((i) => i.id === 'key_toilet')}
          onRetrieveKey={handleRetrieveToiletKey}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'broken_tile' && (
        <BrokenTileModal
          hasDiscoveredCode={hasDiscoveredTileCode}
          onDiscoverCode={handleDiscoverBrokenTileCode}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'letterlock' && (
        <LetterLockModal
          isUnlocked={lockState.letterLock}
          onSuccess={handleSolveLetterLock}
          onClose={() => setActiveModal('main_door')}
        />
      )}

      {activeModal === 'peephole' && (
        <PeepholeModal onClose={() => setActiveModal('main_door')} />
      )}

      {activeModal === 'fridge' && (
        <FridgeModal
          hasKey={inventory.some((i) => i.id === 'key_fridge')}
          onPickUpKey={handlePickUpKey}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'codelock' && (
        <CodeLockModal
          isUnlocked={lockState.codeLock}
          onSuccess={handleSolveCodeLock}
          onClose={() => setActiveModal('main_door')}
        />
      )}

      {activeModal === 'fusebox' && (
        <FuseBoxModal
          isSolved={lockState.fuseLock}
          onSuccess={handleSolveFuseBox}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'notes' && (
        <NotesModal onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'inventory' && (
        <InventoryDrawer
          items={inventory}
          onOpenNotes={() => setActiveModal('notes')}
          onClose={() => setActiveModal(null)}
        />
      )}

      {gameStage === 'jumpscare' && (
        <JumpscareModal onRestart={handleRestart} />
      )}

      {gameStage === 'escaped' && (
        <VictoryModal timeElapsed={timeElapsed} onRestart={handleRestart} />
      )}
    </div>
  );
}
