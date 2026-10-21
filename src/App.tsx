/**
 * ESCAPE FROM “THE PIBE” ROOM
 * Main Application Orchestrator
 * Integrates Three.js 3D Room, SensorManager, HorrorAudioManager,
 * Virtual Joystick, and Interactive Puzzle Modals.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EscapeRoomScene, InteractionStatus, InteractionTapResult } from './three/EscapeRoomScene';
import { sensorManager } from './sensors/SensorManager';
import { horrorAudio } from './audio/HorrorAudioManager';
import {
  AudioMetrics,
  InteractiveTargetId,
  InventoryItem,
  LockState,
  SensorsState,
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
import { SettingsModal } from './components/SettingsModal';
import { Eye, Flashlight, Sliders } from 'lucide-react';

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
  const [gyroSensitivity, setGyroSensitivity] = useState<number>(1.0);
  const [invertX, setInvertX] = useState<boolean>(false);
  const [invertY, setInvertY] = useState<boolean>(false);
  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics>({ volume: 0, bassLevel: 0 });
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(true);

  // Interaction feedback toast
  const [interactionToast, setInteractionToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

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
    | 'bathroom_door'
    | 'settings';

  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [nearTarget, setNearTarget] = useState<InteractiveTargetId>(null);
  const [illuminatedTarget, setIlluminatedTarget] = useState<InteractiveTargetId>(null);

  // Movement & Look Refs
  const joystickVector = useRef({ x: 0, y: 0 });
  const keyboardKeys = useRef<{ [key: string]: boolean }>({});
  const isPointerDown = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const pointerDownInfo = useRef({ x: 0, y: 0, time: 0, moved: false });

  const showToast = useCallback((msg: string) => {
    setInteractionToast(msg);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setInteractionToast(null);
    }, 2800);
  }, []);

  const handleSensitivityChange = (val: number) => {
    setGyroSensitivity(val);
    sensorManager.setSensitivity(val);
  };

  const handleInvertXToggle = (inv: boolean) => {
    setInvertX(inv);
    sensorManager.setInvertYaw(inv);
  };

  const handleInvertYToggle = (inv: boolean) => {
    setInvertY(inv);
    sensorManager.setInvertPitch(inv);
  };

  const handleRecenter = () => {
    if (sceneRef.current) sceneRef.current.recenterCamera();
    sensorManager.recenter();
  };

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

    // 3. Immediately align camera to face directly at the chained door on start
    sensorManager.recenter();
    if (sceneRef.current) {
      sceneRef.current.recenterCamera();
    }

    setSensors((prev) => ({
      ...prev,
      audioActive: audioOk,
      hasDeviceOrientation: gyroOk,
      gyroscopeAllowed: gyroOk,
    }));

    setGameStage('playing');

    // Extra safety pass to calibrate baseline once mobile sensor stream activates
    setTimeout(() => {
      sensorManager.recenter();
      if (sceneRef.current) {
        sceneRef.current.recenterCamera();
      }
    }, 150);
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

    const scene = new EscapeRoomScene(canvasContainerRef.current, (status: InteractionStatus) => {
      if (status.isIlluminated && status.target) {
        setNearTarget(status.target);
        setIlluminatedTarget(status.target);
      } else {
        setNearTarget(null);
        setIlluminatedTarget(null);
      }
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

      // Update Gyro Lerp with compass wrapping protection
      sensorManager.updateSmoothing();

      // Apply Gyroscope orientation to camera with user sensitivity & calibration
      if (sceneRef.current && sensors.useGyro) {
        const { yaw, pitch, roll } = sensorManager.getRelativeAnglesRad();
        sceneRef.current.applyGyroAngles(yaw, pitch, roll);
      } else if (sceneRef.current) {
        sceneRef.current.applyGyroAngles(0, 0, 0);
      }

      if (sceneRef.current && activeModal === null) {
        // Player displacement strictly with analog joystick and keyboard
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
  }, [gameStage, activeModal, sensors.useGyro]);

  /**
   * Touch & Drag Handlers on Canvas
   * STRICT 3-POINT VERIFICATION:
   * Objects can ONLY be activated by direct screen touch tap while illuminated by the flashlight!
   */
  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeModal !== null) return;
    isPointerDown.current = true;
    lastPointerPos.current = { x: e.clientX, y: e.clientY };
    pointerDownInfo.current = { x: e.clientX, y: e.clientY, time: performance.now(), moved: false };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current || activeModal !== null || !sceneRef.current) return;
    const dx = e.clientX - lastPointerPos.current.x;
    const dy = e.clientY - lastPointerPos.current.y;
    lastPointerPos.current = { x: e.clientX, y: e.clientY };

    const dragDist = Math.hypot(e.clientX - pointerDownInfo.current.x, e.clientY - pointerDownInfo.current.y);
    if (dragDist > 10) {
      pointerDownInfo.current.moved = true;
    }

    sceneRef.current.applyLookDelta(dx, dy, invertX, invertY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;

    const duration = performance.now() - pointerDownInfo.current.time;
    const isTap = !pointerDownInfo.current.moved && duration < 350;

    // Strict 3-Point Touch Verification:
    // Only triggers on intentional screen touch tap
    if (isTap && sceneRef.current && activeModal === null) {
      const tapResult: InteractionTapResult = sceneRef.current.handleScreenTap(e.clientX, e.clientY);

      if (tapResult.success && tapResult.target) {
        handleOpenTarget(tapResult.target);
      } else if (tapResult.reason === 'flashlight_off') {
        showToast('🔦 Está demasiado oscuro. Enciende la linterna para poder examinar.');
        sensorManager.vibrate([60, 40, 60]);
        horrorAudio.playDoorKnocks(0.2);
      } else if (tapResult.reason === 'not_illuminated') {
        showToast('🔦 Alumbra directamente el objeto con el haz de la linterna para examinarlo.');
        sensorManager.vibrate(40);
      } else if (tapResult.reason === 'too_far') {
        showToast('Acércate más usando el analógico de desplazamiento.');
        sensorManager.vibrate(25);
      }
    }
  };

  const promptInfo = nearTarget ? getTargetPrompt(nearTarget) : null;

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

      {/* Crosshair Dot in Center - Expands and glows amber when illuminating an interactive object */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-150 ${
          illuminatedTarget
            ? 'w-6 h-6 rounded-full border border-amber-400 bg-amber-400/20 shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-110'
            : 'w-1.5 h-1.5 rounded-full bg-white/40'
        }`}
      />

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
          onRecenterCamera={handleRecenter}
          onOpenInventory={() => setActiveModal('inventory')}
          onOpenSettings={() => setActiveModal('settings')}
        />
      )}

      {/* Target Illumination Status Banner (Informs the player that object is illuminated and ready for touch) */}
      {gameStage === 'playing' && promptInfo && activeModal === null && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-200">
          <div className="px-4 py-2.5 rounded-xl bg-stone-950/90 border border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.4)] backdrop-blur-md flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Eye className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  {promptInfo.title}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                  ILUMINADO
                </span>
              </div>
              <p className="text-xs text-stone-200 font-medium">
                Toca la pantalla sobre el objeto para examinar
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Toast Feedback (e.g. flashlight off / needs aim / too far) */}
      {interactionToast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-sm w-[90%] text-center">
          <div className="px-4 py-2.5 rounded-xl bg-stone-950/95 border border-amber-500/60 shadow-2xl backdrop-blur-md text-amber-200 text-xs font-mono font-medium flex items-center gap-2 justify-center">
            <span>{interactionToast}</span>
          </div>
        </div>
      )}

      {/* Bottom Controls HUD - Joystick strictly for analog movement */}
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

          {/* Quick HUD Guide Badge */}
          <div className="pointer-events-none hidden sm:flex flex-col items-end gap-1 text-[11px] font-mono text-stone-400 bg-stone-950/70 p-2.5 rounded-xl border border-stone-800 backdrop-blur-xs">
            <span className="text-stone-300 font-bold">🕹️ Analógico: Desplazamiento</span>
            <span>📱 Giroscopio: Mirada / Vista</span>
            <span className="text-amber-400 font-semibold">🔦 Linterna + Touch: Interactuar</span>
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

      {/* Settings & Gyroscope Sensitivity Modal */}
      {activeModal === 'settings' && (
        <SettingsModal
          useGyro={sensors.useGyro}
          gyroSensitivity={gyroSensitivity}
          invertX={invertX}
          invertY={invertY}
          onToggleGyro={(enabled) => {
            setSensors((prev) => ({ ...prev, useGyro: enabled }));
          }}
          onChangeSensitivity={handleSensitivityChange}
          onToggleInvertX={handleInvertXToggle}
          onToggleInvertY={handleInvertYToggle}
          onRecenter={handleRecenter}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
