/**
 * Three.js 3D Escape Room Scene Manager
 * "ESCAPE FROM THE PIBE ROOM"
 * Implements room geometry, atmospheric lighting, flashlight,
 * object interaction highlights, collision bounds, and camera gyro/touch control.
 */

import * as THREE from 'three';
import { InteractiveTargetId, LockState, OrientationData, FocusState } from '../types/game';
import { TextureGenerator } from './TextureGenerator';
import { horrorAudio } from '../audio/HorrorAudioManager';

export type FocusUpdateCallback = (state: FocusState) => void;

export interface InteractiveTargetDef {
  id: InteractiveTargetId;
  name: string;
  pos: THREE.Vector3;
  frontNormal: THREE.Vector3; // Normal vector facing OUTWARD from the interactive surface
  maxDist: number;            // Distance threshold in meters
  maxAngleDeg: number;        // Maximum angle in degrees between player gaze and inbound normal (30°)
}

export class EscapeRoomScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;

  // Lighting
  private ambientLight: THREE.AmbientLight;
  private centerBulbLight: THREE.PointLight;
  private bulbMesh: THREE.Mesh | null = null;
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  private fridgeGlowLight: THREE.PointLight;

  // Door Mesh & Knock Impact
  private doorGroup: THREE.Group | null = null;
  private doorBaseZ: number = -5.92;
  private doorShakeStartTime: number = 0;

  // Player state
  private playerPosition = new THREE.Vector3(0, 1.6, 2.5); // Start in center-back
  private cameraEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private gyroEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private isFlashlightOn = true;
  private hasGyroInput = false;
  private gyroAlphaOffset = 0;
  private initialHeadingSet = false;

  // Interactive Meshes & Target Definitions
  private interactiveMeshes: Map<InteractiveTargetId, THREE.Mesh | THREE.Group> = new Map();
  private highlightMaterials: Map<InteractiveTargetId, THREE.MeshStandardMaterial> = new Map();
  private onFocusUpdate: FocusUpdateCallback | null = null;

  // Current Focus & Strict Frontal State
  private currentFocusState: FocusState = {
    targetId: null,
    isFrontallyFacing: false,
    angleDeg: 180,
    distance: 999,
    nearObliqueTargetId: null,
  };

  // Center Raycaster for direct aiming
  private centerRaycaster = new THREE.Raycaster();

  // Target definitions with strict front surface normals (for ±30° facing verification)
  private targetDefinitions: InteractiveTargetDef[] = [
    {
      id: 'main_door',
      name: 'Puerta Principal',
      pos: new THREE.Vector3(0, 1.4, -5.8),
      frontNormal: new THREE.Vector3(0, 0, 1), // Faces South into the room
      maxDist: 2.8,
      maxAngleDeg: 30,
    },
    {
      id: 'bathroom_door',
      name: 'Puerta del Baño',
      pos: new THREE.Vector3(5.0, 1.4, 1.4),
      frontNormal: new THREE.Vector3(-1, 0, 0), // Faces West into the main room
      maxDist: 2.5,
      maxAngleDeg: 30,
    },
    {
      id: 'rotten_fridge',
      name: 'Heladera Podrida',
      pos: new THREE.Vector3(3.8, 1.15, -4.8),
      frontNormal: new THREE.Vector3(-0.5, 0, 0.866).normalize(), // Angled Southwest
      maxDist: 2.4,
      maxAngleDeg: 30,
    },
    {
      id: 'study_desk',
      name: 'Escritorio con Diario',
      pos: new THREE.Vector3(-3.8, 0.85, -1.5),
      frontNormal: new THREE.Vector3(1, 0, 0), // Faces East into the room
      maxDist: 2.4,
      maxAngleDeg: 30,
    },
    {
      id: 'fuse_box',
      name: 'Caja de Fusibles',
      pos: new THREE.Vector3(4.9, 1.6, -0.6),
      frontNormal: new THREE.Vector3(-1, 0, 0), // Faces West into the room
      maxDist: 2.2,
      maxAngleDeg: 30,
    },
    {
      id: 'toilet',
      name: 'Inodoro Decrépito',
      pos: new THREE.Vector3(7.5, 0.6, 4.35),
      frontNormal: new THREE.Vector3(0, 0, -1), // Faces North into bathroom
      maxDist: 2.4,
      maxAngleDeg: 30,
    },
    {
      id: 'broken_tile',
      name: 'Azulejo Agrietado',
      pos: new THREE.Vector3(11.38, 0.72, 0.35),
      frontNormal: new THREE.Vector3(-1, 0, 0), // Faces West into bathroom
      maxDist: 1.8,
      maxAngleDeg: 30,
    },
  ];

  // Chains & Locks meshes on main door (4 locks)
  private chainGroup: THREE.Group = new THREE.Group();
  private codeLockMesh: THREE.Object3D | null = null;
  private fuseLockMesh: THREE.Object3D | null = null;
  private toiletLockMesh: THREE.Object3D | null = null;
  private letterLockMesh: THREE.Object3D | null = null;

  // Bathroom dividing door
  private bathroomDoorPivot: THREE.Group = new THREE.Group();
  private isBathroomUnlocked: boolean = false;

  constructor(container: HTMLElement, onFocusUpdate?: FocusUpdateCallback) {
    this.container = container;
    this.onFocusUpdate = onFocusUpdate || null;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060608);
    this.scene.fog = new THREE.FogExp2(0x060608, 0.08);

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(72, aspect, 0.1, 40);
    this.camera.position.copy(this.playerPosition);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // SDD limit
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.ambientLight = new THREE.AmbientLight(0x181a24, 0.35);
    this.scene.add(this.ambientLight);

    // Bare hanging ceiling bulb in center of room
    this.centerBulbLight = new THREE.PointLight(0xffeaad, 1.2, 9, 1.8);
    this.centerBulbLight.position.set(0, 3.1, 0);
    this.scene.add(this.centerBulbLight);

    // Flashlight mounted to player camera
    this.flashlight = new THREE.SpotLight(0xfff5e6, 3.2, 14, Math.PI / 6, 0.45, 1.2);
    this.flashlight.position.copy(this.camera.position);
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);

    // Eerie toxic green light from rotten fridge
    this.fridgeGlowLight = new THREE.PointLight(0x6be04c, 0.7, 4.5, 2);
    this.fridgeGlowLight.position.set(3.4, 1.2, -2.8);
    this.scene.add(this.fridgeGlowLight);

    // 5. Build Environment
    this.buildRoom();
    this.buildMainChainedDoor();
    this.buildRottenFridge();
    this.buildStudyDesk();
    this.buildElectricalFuseBox();
    this.buildBathroom();
    this.buildWallDecorations();

    // 6. Bind resize
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // Start loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  /**
   * Build room walls, floor, ceiling
   * Room is 10m wide (X: -5 to +5), 12m deep (Z: -6 to +6), 3.4m tall (Y: 0 to 3.4)
   */
  private buildRoom() {
    const wallTex = TextureGenerator.createWallpaperTexture();
    const floorTex = TextureGenerator.createWoodFloorTexture();

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.85,
      metalness: 0.05,
    });

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.75,
      metalness: 0.1,
    });

    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1c,
      roughness: 0.95,
      metalness: 0.0,
    });

    // Floor (Y = 0)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 12), floorMat);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // Ceiling (Y = 3.4)
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 12), ceilingMat);
    ceiling.position.y = 3.4;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // North Wall (Z = -6, contains Main Door)
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.4), wallMat);
    northWall.position.set(0, 1.7, -6);
    this.scene.add(northWall);

    // South Wall (Z = 6, behind player)
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.4), wallMat);
    southWall.position.set(0, 1.7, 6);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);

    // East Wall with Bathroom Doorway opening (between Z: 0.4 and 2.4)
    // 1. North Segment (Z: -6 to 0.4, length 6.4m, center Z = -2.8)
    const eastWallNorth = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.4), wallMat);
    eastWallNorth.position.set(5, 1.7, -2.8);
    eastWallNorth.rotation.y = -Math.PI / 2;
    this.scene.add(eastWallNorth);

    // 2. South Segment (Z: 2.4 to 6.0, length 3.6m, center Z = 4.2)
    const eastWallSouth = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.4), wallMat);
    eastWallSouth.position.set(5, 1.7, 4.2);
    eastWallSouth.rotation.y = -Math.PI / 2;
    this.scene.add(eastWallSouth);

    // 3. Header Wall above bathroom doorway (Z: 0.4 to 2.4, Y: 2.3 to 3.4)
    const eastWallHeader = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.1), wallMat);
    eastWallHeader.position.set(5, 2.85, 1.4);
    eastWallHeader.rotation.y = -Math.PI / 2;
    this.scene.add(eastWallHeader);

    // West Wall (X = -5, study desk & calendar)
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.4), wallMat);
    westWall.position.set(-5, 1.7, 0);
    westWall.rotation.y = Math.PI / 2;
    this.scene.add(westWall);

    // Bare hanging light fixture mesh in ceiling center
    const bulbGroup = new THREE.Group();
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    cord.position.y = 3.1;
    bulbGroup.add(cord);

    const bulbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffeaad })
    );
    bulbMesh.position.y = 2.8;
    this.bulbMesh = bulbMesh;
    bulbGroup.add(bulbMesh);
    this.scene.add(bulbGroup);
  }

  /**
   * The Main Chained Door (Puerta Principal) based on the Room 302 Silent Hill 4 reference:
   * - Stepped grungy off-white architrave and crown molding.
   * - Peeling door slab with 3D recessed upper and lower beveled panels.
   * - Blood-red handwritten "Don't go out!! Walter" under the brass peephole.
   * - Dual light switch plate on right wall.
   * - Heavy bolted cast-iron anchor plates on walls and door panels.
   * - Dense tangled web of interlocking 3D steel chain links crossing horizontally and diagonally.
   * - Authentic hanging padlocks (brass key lock on left, combination lock on center junction, and fuse lock).
   */
  private buildMainChainedDoor() {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 1.35, -5.92);
    this.doorGroup = doorGroup;

    const doorTex = TextureGenerator.createDoorTexture();
    const doorMat = new THREE.MeshStandardMaterial({
      map: doorTex,
      roughness: 0.78,
      metalness: 0.15,
      emissive: new THREE.Color(0x000000),
    });
    this.highlightMaterials.set('main_door', doorMat);

    // 1. Surrounding Wall Architecture from Reference
    // Crown Molding above door header
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x4a4339, roughness: 0.85 });
    const crownMolding = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 0.08), crownMat);
    crownMolding.position.set(0, 1.62, 0.03);
    doorGroup.add(crownMolding);

    // Baseboard moldings at bottom of wall on left and right
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x3d352c, roughness: 0.85 });
    const baseboardLeft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.06), baseboardMat);
    baseboardLeft.position.set(-1.5, -1.26, 0.03);
    doorGroup.add(baseboardLeft);

    const baseboardRight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.06), baseboardMat);
    baseboardRight.position.set(1.5, -1.26, 0.03);
    doorGroup.add(baseboardRight);

    // Dual Light Switch Plate on Right Wall (exactly as in reference photo)
    const switchGroup = new THREE.Group();
    switchGroup.position.set(1.32, 0.08, 0.02);
    const switchPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.18, 0.025),
      new THREE.MeshStandardMaterial({ color: 0xb5a894, roughness: 0.6 })
    );
    switchGroup.add(switchPlate);
    // 2 small dark switch toggles
    const toggleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    const toggle1 = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.035, 0.02), toggleMat);
    toggle1.position.set(-0.025, 0.01, 0.015);
    const toggle2 = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.035, 0.02), toggleMat);
    toggle2.position.set(0.025, -0.01, 0.015);
    switchGroup.add(toggle1, toggle2);
    doorGroup.add(switchGroup);

    // Dedicated Amber Horror Downlight from above door (matches dramatic lighting in reference)
    const doorTopLight = new THREE.PointLight(0xffa24c, 2.2, 5.2, 1.4);
    doorTopLight.position.set(0, 1.65, 0.35);
    doorGroup.add(doorTopLight);

    // 2. Stepped Door Architrave (Wood Trim Frame)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a5043, roughness: 0.85 });
    // Top header architrave
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.18, 0.22), frameMat);
    topFrame.position.set(0, 1.41, 0);
    doorGroup.add(topFrame);
    // Left and right side jambs
    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.7, 0.22), frameMat);
    leftFrame.position.set(-0.85, 0, 0);
    doorGroup.add(leftFrame);
    const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.7, 0.22), frameMat);
    rightFrame.position.set(0.85, 0, 0);
    doorGroup.add(rightFrame);

    // Inner stepped bead trim
    const innerFrameMat = new THREE.MeshStandardMaterial({ color: 0x483e32, roughness: 0.9 });
    const innerTop = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.04, 0.06), innerFrameMat);
    innerTop.position.set(0, 1.31, 0.08);
    doorGroup.add(innerTop);
    const innerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.62, 0.06), innerFrameMat);
    innerLeft.position.set(-0.75, 0, 0.08);
    doorGroup.add(innerLeft);
    const innerRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.62, 0.06), innerFrameMat);
    innerRight.position.set(0.75, 0, 0.08);
    doorGroup.add(innerRight);

    // 3. Door Slab with 3D Recessed Panels
    // Main door slab (1.48m x 2.64m x 0.11m)
    const doorSlab = new THREE.Mesh(new THREE.BoxGeometry(1.48, 2.64, 0.11), doorMat);
    doorGroup.add(doorSlab);

    // 3D Recessed Upper Panel Moldings
    const panelBevelMat = new THREE.MeshStandardMaterial({ color: 0x7a6c58, roughness: 0.85 });
    const upperPanelFrame = new THREE.Group();
    upperPanelFrame.position.set(0, 0.54, 0.056);
    // Inner bevel borders for upper panel
    const uTop = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.03, 0.02), panelBevelMat);
    uTop.position.set(0, 0.46, 0);
    const uBot = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.03, 0.02), panelBevelMat);
    uBot.position.set(0, -0.46, 0);
    const uLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.92, 0.02), panelBevelMat);
    uLeft.position.set(-0.56, 0, 0);
    const uRight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.92, 0.02), panelBevelMat);
    uRight.position.set(0.56, 0, 0);
    upperPanelFrame.add(uTop, uBot, uLeft, uRight);
    doorGroup.add(upperPanelFrame);

    // 3D Recessed Lower Panel Moldings
    const lowerPanelFrame = new THREE.Group();
    lowerPanelFrame.position.set(0, -0.62, 0.056);
    const lTop = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.03, 0.02), panelBevelMat);
    lTop.position.set(0, 0.48, 0);
    const lBot = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.03, 0.02), panelBevelMat);
    lBot.position.set(0, -0.48, 0);
    const lLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.96, 0.02), panelBevelMat);
    lLeft.position.set(-0.56, 0, 0);
    const lRight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.96, 0.02), panelBevelMat);
    lRight.position.set(0.56, 0, 0);
    lowerPanelFrame.add(lTop, lBot, lLeft, lRight);
    doorGroup.add(lowerPanelFrame);

    // Brass Peephole (Visor de la puerta)
    const peepholeMat = new THREE.MeshStandardMaterial({
      color: 0xcca048,
      metalness: 0.9,
      roughness: 0.25,
      emissive: new THREE.Color(0x221805),
    });
    const peepholeRing = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.045, 24), peepholeMat);
    peepholeRing.rotation.x = Math.PI / 2;
    peepholeRing.position.set(0, -0.02, 0.065);
    doorGroup.add(peepholeRing);

    // Dark peephole convex glass
    const peepholeGlass = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x050508 })
    );
    peepholeGlass.rotation.x = -Math.PI / 2;
    peepholeGlass.position.set(0, -0.02, 0.082);
    doorGroup.add(peepholeGlass);

    // Deadbolt latch mechanism on right middle edge
    const deadboltMat = new THREE.MeshStandardMaterial({ color: 0x2e2c29, metalness: 0.8, roughness: 0.4 });
    const deadboltPlate = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.055, 0.025), deadboltMat);
    deadboltPlate.position.set(0.62, -0.02, 0.065);
    const deadboltCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0x5a5855, metalness: 0.9, roughness: 0.2 })
    );
    deadboltCylinder.rotation.z = Math.PI / 2;
    deadboltCylinder.position.set(0.64, -0.02, 0.075);
    doorGroup.add(deadboltPlate, deadboltCylinder);

    // 4. Heavy Bolted Cast-Iron Mounting Brackets (Plates)
    this.chainGroup = new THREE.Group();

    const bracketTex = TextureGenerator.createRustedBracketTexture();
    const bracketMat = new THREE.MeshStandardMaterial({
      map: bracketTex,
      metalness: 0.8,
      roughness: 0.4,
    });
    const boltMat = new THREE.MeshStandardMaterial({ color: 0x1f1d1a, metalness: 0.9, roughness: 0.3 });
    const clevisMat = new THREE.MeshStandardMaterial({ color: 0x4a4742, metalness: 0.85, roughness: 0.35 });

    const createBracket = (x: number, y: number, z: number, w = 0.22, h = 0.2, rotZ = 0) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(x, y, z);
      bGroup.rotation.z = rotZ;

      // Baseplate
      const plate = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.035), bracketMat);
      bGroup.add(plate);

      // 4 corner hex bolts
      const boltOffsets = [
        [-w * 0.38, -h * 0.36],
        [w * 0.38, -h * 0.36],
        [-w * 0.38, h * 0.36],
        [w * 0.38, h * 0.36],
      ];
      boltOffsets.forEach(([bx, by]) => {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.022, 6), boltMat);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(bx, by, 0.02);
        bGroup.add(bolt);
      });

      // Heavy steel U-clevis / ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.014, 8, 16), clevisMat);
      ring.position.set(0, 0, 0.03);
      bGroup.add(ring);

      return bGroup;
    };

    // Build the 8 anchor brackets matching the Silent Hill 4 reference:
    // Left wall upper, mid, lower
    this.chainGroup.add(createBracket(-1.18, 0.88, 0.04, 0.22, 0.22, -0.1));
    this.chainGroup.add(createBracket(-1.26, 0.12, 0.04, 0.24, 0.22, 0.05));
    this.chainGroup.add(createBracket(-1.18, -0.65, 0.04, 0.22, 0.22, 0.1));
    // Right wall upper, mid
    this.chainGroup.add(createBracket(1.18, 0.84, 0.04, 0.22, 0.22, 0.08));
    this.chainGroup.add(createBracket(1.30, 0.14, 0.04, 0.24, 0.22, -0.05));
    // Door mounted brackets: Upper panel, Central junction, Lower panel
    this.chainGroup.add(createBracket(0.28, 0.80, 0.07, 0.24, 0.18, 0.04));
    this.chainGroup.add(createBracket(0.30, -0.02, 0.07, 0.26, 0.24, 0.0)); // central junction
    this.chainGroup.add(createBracket(-0.16, -0.68, 0.07, 0.22, 0.2, -0.08));

    // 5. Tangled Multi-Strand 3D Steel Chains
    // Define 6 authentic paths crossing horizontally, diagonally and drooping
    const chainPaths: THREE.Vector3[][] = [
      // 1. Upper horizontal span (drooping slightly through door top bracket)
      [
        new THREE.Vector3(-1.18, 0.88, 0.09),
        new THREE.Vector3(-0.45, 0.82, 0.11),
        new THREE.Vector3(0.28, 0.80, 0.12),
        new THREE.Vector3(0.75, 0.83, 0.11),
        new THREE.Vector3(1.18, 0.84, 0.09),
      ],
      // 2. Mid horizontal span across center
      [
        new THREE.Vector3(-1.26, 0.12, 0.09),
        new THREE.Vector3(-0.55, 0.10, 0.11),
        new THREE.Vector3(0.05, 0.08, 0.12),
        new THREE.Vector3(0.30, -0.02, 0.14),
        new THREE.Vector3(0.85, 0.06, 0.12),
        new THREE.Vector3(1.30, 0.14, 0.09),
      ],
      // 3. Ascending diagonal cross
      [
        new THREE.Vector3(-1.18, -0.65, 0.09),
        new THREE.Vector3(-0.45, -0.32, 0.12),
        new THREE.Vector3(0.30, -0.02, 0.14),
        new THREE.Vector3(0.85, 0.08, 0.12),
        new THREE.Vector3(1.30, 0.14, 0.09),
      ],
      // 4. Descending diagonal cross
      [
        new THREE.Vector3(-1.18, 0.88, 0.10),
        new THREE.Vector3(-0.62, 0.42, 0.12),
        new THREE.Vector3(0.05, 0.08, 0.13),
        new THREE.Vector3(0.30, -0.02, 0.12),
        new THREE.Vector3(0.65, -0.35, 0.11),
        new THREE.Vector3(1.18, -0.65, 0.09),
      ],
      // 5. Lower horizontal cross across bottom panel
      [
        new THREE.Vector3(-1.18, -0.65, 0.09),
        new THREE.Vector3(-0.55, -0.66, 0.11),
        new THREE.Vector3(-0.16, -0.68, 0.12),
        new THREE.Vector3(0.55, -0.64, 0.11),
        new THREE.Vector3(1.18, -0.65, 0.09),
      ],
      // 6. Dangling loose chain from left lock
      [
        new THREE.Vector3(-0.82, 0.06, 0.15),
        new THREE.Vector3(-0.83, -0.12, 0.15),
        new THREE.Vector3(-0.82, -0.28, 0.14),
        new THREE.Vector3(-0.80, -0.42, 0.13),
      ],
      // 7. Dangling loose end on right floor
      [
        new THREE.Vector3(0.30, -0.02, 0.13),
        new THREE.Vector3(0.28, -0.45, 0.12),
        new THREE.Vector3(0.24, -0.92, 0.11),
        new THREE.Vector3(0.18, -1.25, 0.09),
      ],
    ];

    // Compute chain link matrices using InstancedMesh for 60fps mobile performance
    const linkSpacing = 0.052;
    const linkGeo = new THREE.TorusGeometry(0.038, 0.012, 8, 14);
    const chainLinkMat = new THREE.MeshStandardMaterial({
      color: 0x3d3a36,
      metalness: 0.85,
      roughness: 0.35,
    });

    const linkTransforms: THREE.Matrix4[] = [];

    chainPaths.forEach((pts) => {
      const curve = new THREE.CatmullRomCurve3(pts);
      const totalLength = curve.getLength();
      const count = Math.max(2, Math.floor(totalLength / linkSpacing));

      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const pos = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t).normalize();

        const dummy = new THREE.Object3D();
        dummy.position.copy(pos);

        // Align with tangent
        const up = new THREE.Vector3(0, 1, 0);
        if (Math.abs(tangent.dot(up)) > 0.9) up.set(1, 0, 0);
        dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

        // Alternate link rotation by 90 degrees around tangent
        if (i % 2 === 1) {
          dummy.rotateZ(Math.PI / 2);
        }

        dummy.updateMatrix();
        linkTransforms.push(dummy.matrix.clone());
      }
    });

    const instancedChains = new THREE.InstancedMesh(linkGeo, chainLinkMat, linkTransforms.length);
    linkTransforms.forEach((matrix, idx) => {
      instancedChains.setMatrixAt(idx, matrix);
    });
    instancedChains.instanceMatrix.needsUpdate = true;
    this.chainGroup.add(instancedChains);

    // 6. Heavy Hanging Padlocks (4 Locks: 4-digit code, 220V breaker, toilet iron key, 5-letter word)
    // Padlock 1: Central Junction 4-Digit Combination Padlock (opened with 1986 code)
    const codeLockGroup = new THREE.Group();
    codeLockGroup.position.set(0.30, 0.02, 0.19);
    codeLockGroup.rotation.z = -0.15;

    const codeLockBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x24272c, metalness: 0.75, roughness: 0.35 })
    );
    const codeLockShackle = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.016, 8, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x989ba0, metalness: 0.9, roughness: 0.2 })
    );
    codeLockShackle.position.set(0, 0.1, 0);

    // Numerical dials simulation rings
    for (let r = 0; r < 4; r++) {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.078, 0.078, 0.03, 16),
        new THREE.MeshStandardMaterial({ color: 0xc49a45, metalness: 0.8, roughness: 0.3 })
      );
      ring.position.set(0, -0.06 + r * 0.04, 0);
      codeLockGroup.add(ring);
    }
    codeLockGroup.add(codeLockBody, codeLockShackle);
    this.codeLockMesh = codeLockGroup;
    this.chainGroup.add(codeLockGroup);

    // Padlock 3: Lower-Right Diagonal Breaker Lock (opened with fuse box overload)
    const fuseLockGroup = new THREE.Group();
    fuseLockGroup.position.set(0.42, -0.24, 0.17);
    fuseLockGroup.rotation.z = 0.25;

    const fuseLockBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.16, 0.055),
      new THREE.MeshStandardMaterial({ color: 0x1a1c1e, metalness: 0.85, roughness: 0.4 })
    );
    const fuseLockShackle = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.015, 8, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x7a7d82, metalness: 0.9, roughness: 0.2 })
    );
    fuseLockShackle.position.set(0, 0.08, 0);

    // Yellow hazard warning stripe
    const hazardStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.09, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xd9a41e })
    );
    hazardStripe.position.set(0, 0, 0.029);
    fuseLockGroup.add(fuseLockBody, fuseLockShackle, hazardStripe);
    this.fuseLockMesh = fuseLockGroup;
    this.chainGroup.add(fuseLockGroup);

    // Padlock 4: Lower-Left Heavy Rusted Iron Padlock (opened with toilet key)
    const toiletLockGroup = new THREE.Group();
    toiletLockGroup.position.set(-0.35, -0.22, 0.18);
    toiletLockGroup.rotation.z = -0.3;

    const toiletLockBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.17, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x3d2822, metalness: 0.8, roughness: 0.7 })
    );
    const toiletLockShackle = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.016, 8, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x4a3b32, metalness: 0.85, roughness: 0.5 })
    );
    toiletLockShackle.position.set(0, 0.08, 0);

    const toiletKeyhole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.01, 8),
      new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
    );
    toiletKeyhole.rotation.x = Math.PI / 2;
    toiletKeyhole.position.set(0, -0.02, 0.031);

    toiletLockGroup.add(toiletLockBody, toiletLockShackle, toiletKeyhole);
    this.toiletLockMesh = toiletLockGroup;
    this.chainGroup.add(toiletLockGroup);

    // Padlock 5: Upper-Right 5-Letter Word Tumbler Padlock (opened with MORIR)
    const letterLockGroup = new THREE.Group();
    letterLockGroup.position.set(0.36, 0.40, 0.18);
    letterLockGroup.rotation.z = 0.2;

    const letterLockBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.24, 16),
      new THREE.MeshStandardMaterial({ color: 0x222625, metalness: 0.7, roughness: 0.4 })
    );
    const letterLockShackle = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.016, 8, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x8a9290, metalness: 0.9, roughness: 0.25 })
    );
    letterLockShackle.position.set(0, 0.12, 0);

    // 5 Letter dial rings (A-Z)
    for (let r = 0; r < 5; r++) {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.073, 0.073, 0.035, 16),
        new THREE.MeshStandardMaterial({ color: 0x889e96, metalness: 0.75, roughness: 0.3 })
      );
      ring.position.set(0, -0.08 + r * 0.04, 0);
      letterLockGroup.add(ring);
    }
    letterLockGroup.add(letterLockBody, letterLockShackle);
    this.letterLockMesh = letterLockGroup;
    this.chainGroup.add(letterLockGroup);

    doorGroup.add(this.chainGroup);
    this.scene.add(doorGroup);

    this.interactiveMeshes.set('main_door', doorGroup);
  }

  /**
   * Rotten Refrigerator in kitchen corner
   */
  private buildRottenFridge() {
    const fridgeGroup = new THREE.Group();
    fridgeGroup.position.set(3.8, 1.15, -4.8);
    fridgeGroup.rotation.y = -Math.PI / 6;

    const fridgeTex = TextureGenerator.createRottenFridgeTexture();
    const fridgeMat = new THREE.MeshStandardMaterial({
      map: fridgeTex,
      roughness: 0.6,
      metalness: 0.2,
      emissive: new THREE.Color(0x000000),
    });
    this.highlightMaterials.set('rotten_fridge', fridgeMat);

    // Fridge Body (0.8m wide, 1.8m tall, 0.85m deep)
    const fridgeBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.85, 0.85), fridgeMat);
    fridgeGroup.add(fridgeBody);

    // Handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4f, metalness: 0.8, roughness: 0.4 });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.06), handleMat);
    handle.position.set(-0.35, 0.1, 0.45);
    fridgeGroup.add(handle);

    // Rotten food puddle beneath fridge
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x1b2413,
      roughness: 0.2,
      metalness: 0.1,
    });
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.65, 16), puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(0, -0.91, 0.3);
    fridgeGroup.add(puddle);

    this.scene.add(fridgeGroup);
    this.interactiveMeshes.set('rotten_fridge', fridgeGroup);
  }

  /**
   * Study Desk with Diary Notes, Radio, Desk Lamp
   */
  private buildStudyDesk() {
    const deskGroup = new THREE.Group();
    deskGroup.position.set(-3.8, 0, -1.5);
    deskGroup.rotation.y = Math.PI / 2;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x241812, roughness: 0.8 });

    // Tabletop
    const tabletop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), woodMat);
    tabletop.position.set(0, 0.78, 0);
    deskGroup.add(tabletop);

    // 4 legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.76, 8);
    const legOffsets = [
      [-0.7, 0.38, -0.38],
      [0.7, 0.38, -0.38],
      [-0.7, 0.38, 0.38],
      [0.7, 0.38, 0.38],
    ];
    legOffsets.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(lx, ly, lz);
      deskGroup.add(leg);
    });

    // Old Diary note on desk
    const noteMat = new THREE.MeshStandardMaterial({
      color: 0x9e937b,
      roughness: 0.9,
      emissive: new THREE.Color(0x000000),
    });
    this.highlightMaterials.set('study_desk', noteMat);

    const noteSheet = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.015, 0.45), noteMat);
    noteSheet.position.set(-0.25, 0.83, 0.05);
    noteSheet.rotation.y = 0.2;
    deskGroup.add(noteSheet);

    // Vintage Radio
    const radioMat = new THREE.MeshStandardMaterial({ color: 0x3d281a, roughness: 0.6 });
    const radioMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.18), radioMat);
    radioMesh.position.set(0.35, 0.92, -0.15);
    radioMesh.rotation.y = -0.15;
    deskGroup.add(radioMesh);

    // Vintage desk lamp
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x1f3b2b, metalness: 0.7, roughness: 0.4 });
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 12), lampMat);
    lampBase.position.set(0.5, 0.82, 0.2);
    deskGroup.add(lampBase);

    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.16, 12, 1, true), lampMat);
    lampShade.position.set(0.48, 1.1, 0.15);
    lampShade.rotation.x = Math.PI / 4;
    deskGroup.add(lampShade);

    this.scene.add(deskGroup);
    this.interactiveMeshes.set('study_desk', deskGroup);
  }

  /**
   * Electrical Fuse Box on the East Wall
   */
  private buildElectricalFuseBox() {
    const fuseBoxGroup = new THREE.Group();
    fuseBoxGroup.position.set(4.9, 1.6, -0.6);
    fuseBoxGroup.rotation.y = -Math.PI / 2;

    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x2c2e33,
      metalness: 0.8,
      roughness: 0.4,
      emissive: new THREE.Color(0x000000),
    });
    this.highlightMaterials.set('fuse_box', boxMat);

    // Box casing
    const casing = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.18), boxMat);
    fuseBoxGroup.add(casing);

    // Hazard lightning sign
    const yellowStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, 0.25),
      new THREE.MeshBasicMaterial({ color: 0xd4a017 })
    );
    yellowStripe.position.set(0, 0.1, 0.095);
    fuseBoxGroup.add(yellowStripe);

    // 3 Fuse Lever slots
    for (let i = 0; i < 3; i++) {
      const lever = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8),
        new THREE.MeshStandardMaterial({ color: 0xc43d2b })
      );
      lever.position.set(-0.15 + i * 0.15, -0.18, 0.1);
      fuseBoxGroup.add(lever);
    }

    this.scene.add(fuseBoxGroup);
    this.interactiveMeshes.set('fuse_box', fuseBoxGroup);
  }

  /**
   * Build Second Room: Horror Bathroom (El Baño)
   * Faithfully crafted in accordance with the user's photo reference:
   * - Dirty white square tiles with cockroach silhouettes and dark grout
   * - Black & white vintage octagonal/square mosaic floor
   * - Dividing wooden door between rooms that unlocks with the fridge key
   * - Wall-mounted "Postmeslip" boiler / water heater with dual copper pipes
   * - Glowing spherical frosted sconce lamp casting warm eerie light
   * - Dirty mirror, wire rack, and pedestal washbasin with bloody basin
   * - Decrepit toilet with murky water and submerged key
   * - Bathtub with teal apron, murky blood water, bloody handprints, shower rod & moldy curtain
   * - Realistic subtle broken tile that blends seamlessly with the wall (requires searching closely)
   */
  private buildBathroom() {
    // 1. Textures
    const floorTex = TextureGenerator.createBathroomFloorMosaicTexture();
    floorTex.repeat.set(5, 4);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.55,
      metalness: 0.1,
    });

    const whiteTileTex = TextureGenerator.createWhiteTileTexture();
    whiteTileTex.repeat.set(4, 3);

    const whiteTileMat = new THREE.MeshStandardMaterial({
      map: whiteTileTex,
      roughness: 0.45,
      metalness: 0.08,
    });

    const subtleBrokenTex = TextureGenerator.createSubtleBrokenTileTexture();
    const brokenTileMat = new THREE.MeshStandardMaterial({
      map: subtleBrokenTex,
      roughness: 0.6,
      metalness: 0.08,
      emissive: new THREE.Color(0x000000), // Zero neon glow from afar!
    });

    // 2. Bathroom Floor (X: 5.0 to 11.4, Z: -2.0 to 4.8, Y: 0) - Enlarged spacious layout
    const floorGeo = new THREE.PlaneGeometry(6.4, 6.8);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(8.2, 0.005, 1.4);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // 3. Bathroom Ceiling (Y: 3.4)
    const ceilGeo = new THREE.PlaneGeometry(6.4, 6.8);
    const ceil = new THREE.Mesh(ceilGeo, new THREE.MeshStandardMaterial({ color: 0x181816, roughness: 0.95 }));
    ceil.position.set(8.2, 3.395, 1.4);
    ceil.rotation.x = Math.PI / 2;
    this.scene.add(ceil);

    // 4. White Tiled Walls (matching reference photo)
    // North Wall (Z = -2.0, length 6.4m)
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.4), whiteTileMat);
    northWall.position.set(8.2, 1.7, -2.0);
    this.scene.add(northWall);

    // South Wall (Z = 4.8, length 6.4m - toilet placed here)
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.4), whiteTileMat);
    southWall.position.set(8.2, 1.7, 4.8);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);

    // East Wall (X = 11.4, length 6.8m - bathtub & tile wall)
    const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 3.4), whiteTileMat);
    eastWall.position.set(11.4, 1.7, 1.4);
    eastWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastWall);

    // West Partition Walls (framing doorway at X = 5.0):
    // North partition: Z from -2.0 to 0.4 (length 2.4m)
    const westNorth = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.4), whiteTileMat);
    westNorth.position.set(5.0, 1.7, -0.8);
    westNorth.rotation.y = Math.PI / 2;
    this.scene.add(westNorth);

    // South partition: Z from 2.4 to 4.8 (length 2.4m)
    const westSouth = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.4), whiteTileMat);
    westSouth.position.set(5.0, 1.7, 3.6);
    westSouth.rotation.y = Math.PI / 2;
    this.scene.add(westSouth);

    // 5. Doorway Frame and Dividing Bathroom Door
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x1f1914, roughness: 0.9 });
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 2.1), doorFrameMat);
    topBeam.position.set(5.0, 2.25, 1.4);
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.3, 0.12), doorFrameMat);
    leftPost.position.set(5.0, 1.15, 0.4);
    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.3, 0.12), doorFrameMat);
    rightPost.position.set(5.0, 1.15, 2.4);
    this.scene.add(topBeam, leftPost, rightPost);

    // The Dividing Door (Pivot at hinge post X = 5.0, Z = 0.46)
    // Swings open northwards against the north partition wall, completely clear of the toilet!
    this.bathroomDoorPivot = new THREE.Group();
    this.bathroomDoorPivot.position.set(5.0, 0, 0.46);

    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x2b221a,
      roughness: 0.8,
      metalness: 0.05,
    });
    this.highlightMaterials.set('bathroom_door', doorMat);

    // Door Panel (width 1.88m along Z, height 2.18m, depth 0.06m)
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 2.18, 1.88),
      doorMat
    );
    doorPanel.position.set(0, 1.09, 0.94);

    // Recessed panels on the door
    for (let p = 0; p < 2; p++) {
      const panelBevel = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.85, 0.65),
        new THREE.MeshStandardMaterial({ color: 0x201812, roughness: 0.9 })
      );
      panelBevel.position.set(0, 0.55 + p * 1.05, 0.94);
      this.bathroomDoorPivot.add(panelBevel);
    }

    // Brass Lever Handle & Escutcheon Plate (with Keyhole for fridge brass key)
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xb5923b, metalness: 0.85, roughness: 0.3 });
    const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.08), handleMat);
    lockPlate.position.set(0, 1.05, 1.72);

    const leverHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8), handleMat);
    leverHandle.rotation.z = Math.PI / 2;
    leverHandle.position.set(0.06, 1.08, 1.72);

    const keyhole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.09, 8),
      new THREE.MeshBasicMaterial({ color: 0x050505 })
    );
    keyhole.rotation.z = Math.PI / 2;
    keyhole.position.set(0, 1.0, 1.72);

    this.bathroomDoorPivot.add(doorPanel, lockPlate, leverHandle, keyhole);
    this.scene.add(this.bathroomDoorPivot);
    this.interactiveMeshes.set('bathroom_door', this.bathroomDoorPivot);

    // 6. Wall-Mounted Water Heater / Boiler ("Postmeslip") on North Wall
    const boilerGroup = new THREE.Group();
    boilerGroup.position.set(6.8, 2.15, -1.72);

    const boilerMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createWaterHeaterTexture(),
      roughness: 0.35,
      metalness: 0.2,
    });
    // Main boiler cylinder with rounded shape
    const boilerBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.82, 24),
      boilerMat
    );
    boilerBody.rotation.y = Math.PI / 2;

    const boilerTopCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      boilerMat
    );
    boilerTopCap.position.y = 0.41;

    const boilerBottomCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      boilerMat
    );
    boilerBottomCap.position.y = -0.41;

    // Steel bracket wall mounts
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x222224, metalness: 0.9, roughness: 0.4 });
    const upperBracket = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.15), bracketMat);
    upperBracket.position.set(0, 0.25, -0.15);
    const lowerBracket = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.15), bracketMat);
    lowerBracket.position.set(0, -0.25, -0.15);

    // Two copper/chrome water pipes running down to the floor
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x8a6245, metalness: 0.8, roughness: 0.4 });
    const leftPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.25, 8), pipeMat);
    leftPipe.position.set(-0.1, -1.05, 0.0);
    const rightPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.25, 8), pipeMat);
    rightPipe.position.set(0.1, -1.05, 0.0);

    boilerGroup.add(boilerBody, boilerTopCap, boilerBottomCap, upperBracket, lowerBracket, leftPipe, rightPipe);
    this.scene.add(boilerGroup);

    // 7. Spherical Frosted Wall Sconce Lamp above Sink
    const sconceGroup = new THREE.Group();
    sconceGroup.position.set(8.5, 2.15, -1.86);

    const sconceArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8),
      bracketMat
    );
    sconceArm.rotation.x = Math.PI / 2;

    const sconceBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xfff6dd })
    );
    sconceBulb.position.z = 0.14;

    sconceGroup.add(sconceArm, sconceBulb);
    this.scene.add(sconceGroup);

    // Sconce Point Light (Warm glowing illumination matching reference)
    const sconceLight = new THREE.PointLight(0xffeedd, 1.6, 8.5, 1.7);
    sconceLight.position.set(8.5, 2.15, -1.68);
    this.scene.add(sconceLight);

    // Dim eerie cyan ambient fill in room center
    const fillLight = new THREE.PointLight(0x7dd3fc, 0.45, 9.0, 1.8);
    fillLight.position.set(8.2, 2.8, 1.4);
    this.scene.add(fillLight);

    // 8. Stained Mirror & Wire Rack on North Wall
    const mirrorMat = new THREE.MeshStandardMaterial({
      color: 0x6e7674,
      metalness: 0.9,
      roughness: 0.25,
    });
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.9), mirrorMat);
    mirror.position.set(8.5, 1.6, -1.96);
    this.scene.add(mirror);

    const wireRack = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.06, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.9, roughness: 0.3 })
    );
    wireRack.position.set(8.5, 1.1, -1.88);
    this.scene.add(wireRack);

    // 9. Pedestal Porcelain Sink (Lavabo de pedestal con sangre) on North Wall
    const sinkGroup = new THREE.Group();
    sinkGroup.position.set(8.5, 0, -1.68);

    const sinkPorcelainMat = new THREE.MeshStandardMaterial({
      color: 0xd4d0c5,
      roughness: 0.35,
      metalness: 0.1,
    });

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 0.78, 16),
      sinkPorcelainMat
    );
    pedestal.position.y = 0.39;

    const basinOuter = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.22, 0.48),
      sinkPorcelainMat
    );
    basinOuter.position.y = 0.82;

    // Blood stains in basin bowl
    const basinBlood = new THREE.Mesh(
      new THREE.PlaneGeometry(0.50, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x7a1010, roughness: 0.4, metalness: 0.2 })
    );
    basinBlood.position.set(0, 0.85, 0);
    basinBlood.rotation.x = -Math.PI / 2;

    // Chrome faucet
    const faucetMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.95, roughness: 0.15 });
    const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 8), faucetMat);
    faucet.position.set(0, 0.96, -0.16);

    sinkGroup.add(pedestal, basinOuter, basinBlood, faucet);
    this.scene.add(sinkGroup);

    // 10. Decrepit Porcelain Toilet (Inodoro) - PROMINENTLY PLACED ON SOUTH WALL
    // Completely away from the door! Facing into the room with wide walking clearance.
    const toiletGroup = new THREE.Group();
    toiletGroup.position.set(7.5, 0, 4.35);
    toiletGroup.rotation.y = 0; // Back against South wall (Z = 4.8), facing North into room!

    const porcelainMat = new THREE.MeshStandardMaterial({
      color: 0xc8c4b7,
      roughness: 0.45,
      metalness: 0.1,
      emissive: new THREE.Color(0x000000),
    });
    this.highlightMaterials.set('toilet', porcelainMat);

    const toiletBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.64), porcelainMat);
    toiletBase.position.set(0, 0.21, -0.05);
    toiletGroup.add(toiletBase);

    const toiletBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.20, 0.34, 16), porcelainMat);
    toiletBowl.position.set(0, 0.42, -0.15);
    toiletGroup.add(toiletBowl);

    // Murky stagnant water in bowl
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0a1610,
      roughness: 0.1,
      metalness: 0.7,
    });
    const waterMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.02, 16), waterMat);
    waterMesh.position.set(0, 0.48, -0.15);
    toiletGroup.add(waterMesh);

    // Glint of submerged iron key
    const keyGlint = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.015, 0.09),
      new THREE.MeshStandardMaterial({ color: 0x8a7042, metalness: 0.85, roughness: 0.3 })
    );
    keyGlint.position.set(0.03, 0.49, -0.14);
    keyGlint.rotation.y = 0.4;
    toiletGroup.add(keyGlint);

    const toiletTank = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.54, 0.24), porcelainMat);
    toiletTank.position.set(0, 0.66, 0.24);
    toiletGroup.add(toiletTank);

    this.scene.add(toiletGroup);
    this.interactiveMeshes.set('toilet', toiletGroup);

    // 11. Bathtub (Bañera con Sangre) along East Wall (matching reference photo)
    const tubGroup = new THREE.Group();
    tubGroup.position.set(10.95, 0.31, 1.4);

    // Outer cyan/teal apron panel (exact teal shade from photo)
    const tubApronMat = new THREE.MeshStandardMaterial({
      color: 0x325e68,
      roughness: 0.45,
      metalness: 0.15,
    });
    const tubApron = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.62, 2.6),
      tubApronMat
    );
    tubGroup.add(tubApron);

    // White porcelain rim
    const tubRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.04, 2.62),
      sinkPorcelainMat
    );
    tubRim.position.y = 0.32;
    tubGroup.add(tubRim);

    // Dark pool of blood-red stagnant water inside bathtub
    const bloodWaterMat = new THREE.MeshStandardMaterial({
      color: 0x5a0c0c,
      roughness: 0.12,
      metalness: 0.5,
    });
    const bloodWater = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 0.02, 2.44),
      bloodWaterMat
    );
    bloodWater.position.y = 0.24;
    tubGroup.add(bloodWater);

    this.scene.add(tubGroup);

    // Blood splatters on white tile wall above bathtub
    const bloodDecal = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.1),
      new THREE.MeshBasicMaterial({
        color: 0x6e0e0e,
        transparent: true,
        opacity: 0.75,
      })
    );
    bloodDecal.position.set(11.38, 1.25, 1.4);
    bloodDecal.rotation.y = -Math.PI / 2;
    this.scene.add(bloodDecal);

    // Horizontal shower curtain rod spanning across at Y = 2.15m
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9, roughness: 0.3 });
    const curtainRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 2.7, 8),
      rodMat
    );
    curtainRod.rotation.x = Math.PI / 2;
    curtainRod.position.set(10.55, 2.15, 1.4);
    this.scene.add(curtainRod);

    // Showerhead & flexible hose on East wall
    const showerHead = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 12), rodMat);
    showerHead.position.set(11.35, 1.95, 0.35);
    showerHead.rotation.z = Math.PI / 3;
    this.scene.add(showerHead);

    // Grimy moldy shower curtain hanging half-drawn (Z: 1.3 to 2.6)
    const curtainTex = TextureGenerator.createShowerCurtainTexture();
    const curtainMat = new THREE.MeshStandardMaterial({
      map: curtainTex,
      roughness: 0.7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    const showerCurtain = new THREE.Mesh(
      new THREE.PlaneGeometry(1.25, 1.65),
      curtainMat
    );
    showerCurtain.position.set(10.55, 1.32, 2.0);
    showerCurtain.rotation.y = Math.PI / 2;
    this.scene.add(showerCurtain);

    // 12. Subtle Broken Wall Tile (Azulejo Roto no evidente)
    // Seamlessly placed low on the East wall beside the bathtub rim at (11.38, 0.72, 0.35)
    // Sized exactly as one tile (0.26m x 0.26m), with zero neon glow so the player must search for it!
    const tilePuzzleGroup = new THREE.Group();
    tilePuzzleGroup.position.set(11.38, 0.72, 0.35);

    this.highlightMaterials.set('broken_tile', brokenTileMat);

    const tileMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), brokenTileMat);
    tileMesh.rotation.y = -Math.PI / 2;
    tilePuzzleGroup.add(tileMesh);

    this.scene.add(tilePuzzleGroup);
    this.interactiveMeshes.set('broken_tile', tilePuzzleGroup);

    // 13. Decrepit Wall Radiator on South-West partition (Horror atmospheric detail)
    const radiatorGroup = new THREE.Group();
    radiatorGroup.position.set(5.16, 0.55, 3.6);
    const radMat = new THREE.MeshStandardMaterial({ color: 0x3d352e, metalness: 0.8, roughness: 0.6 });
    for (let c = 0; c < 7; c++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.04), radMat);
      fin.position.set(0, 0, (c - 3) * 0.08);
      radiatorGroup.add(fin);
    }
    this.scene.add(radiatorGroup);
  }

  /**
   * Wall decorations: Blood graffiti & 1986 Calendar
   */
  private buildWallDecorations() {
    // 1. Blood graffiti on South wall
    const graffitiTex = TextureGenerator.createGraffitiTexture();
    const graffitiMat = new THREE.MeshBasicMaterial({
      map: graffitiTex,
      transparent: true,
      opacity: 0.88,
    });
    const graffiti = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 1.9), graffitiMat);
    graffiti.position.set(0, 1.8, 5.94);
    graffiti.rotation.y = Math.PI;
    this.scene.add(graffiti);

    // 2. 1986 Calendar on West Wall
    const calTex = TextureGenerator.createCalendarTexture();
    const calMat = new THREE.MeshStandardMaterial({
      map: calTex,
      roughness: 0.9,
    });
    const calendar = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), calMat);
    calendar.position.set(-4.94, 1.7, -3.2);
    calendar.rotation.y = Math.PI / 2;
    this.scene.add(calendar);
  }

  /**
   * Update Lock Visuals when puzzles are solved
   */
  public updateLocks(lockState: LockState) {
    if (lockState.bathroomDoor) {
      this.unlockBathroomDoor();
    } else {
      this.isBathroomUnlocked = false;
      this.bathroomDoorPivot.rotation.y = 0;
    }
    if (lockState.codeLock && this.codeLockMesh) {
      this.codeLockMesh.visible = false;
    } else if (this.codeLockMesh) {
      this.codeLockMesh.visible = true;
    }
    if (lockState.fuseLock && this.fuseLockMesh) {
      this.fuseLockMesh.visible = false;
    } else if (this.fuseLockMesh) {
      this.fuseLockMesh.visible = true;
    }
    if (lockState.toiletKeyLock && this.toiletLockMesh) {
      this.toiletLockMesh.visible = false;
    } else if (this.toiletLockMesh) {
      this.toiletLockMesh.visible = true;
    }
    if (lockState.letterLock && this.letterLockMesh) {
      this.letterLockMesh.visible = false;
    } else if (this.letterLockMesh) {
      this.letterLockMesh.visible = true;
    }
    if (lockState.allChainsRemoved) {
      this.chainGroup.visible = false;
    } else {
      this.chainGroup.visible = true;
    }
  }

  public unlockBathroomDoor() {
    this.isBathroomUnlocked = true;
  }

  public getIsBathroomUnlocked(): boolean {
    return this.isBathroomUnlocked;
  }

  /**
   * Update Flashlight on/off
   */
  public toggleFlashlight(): boolean {
    this.isFlashlightOn = !this.isFlashlightOn;
    this.flashlight.intensity = this.isFlashlightOn ? 3.2 : 0.0;
    return this.isFlashlightOn;
  }

  public getFlashlightState(): boolean {
    return this.isFlashlightOn;
  }

  /**
   * Move Player via Virtual Joystick or Keyboard
   * vector: x (-1..1) for strafe, y (-1..1) for forward/back
   */
  public applyMovement(vector: { x: number; y: number }, delta: number) {
    const moveSpeed = 2.4 * delta;

    // Movement forward/back & left/right relative to camera's horizontal gaze in real-time
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) {
      forward.set(0, 0, -1);
    } else {
      forward.normalize();
    }

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveX = right.clone().multiplyScalar(vector.x * moveSpeed);
    const moveZ = forward.clone().multiplyScalar(vector.y * moveSpeed);

    const nextPos = this.playerPosition.clone().add(moveX).add(moveZ);

    // Doorway opening to bathroom is at X = 5.0, between Z = 0.45 and Z = 2.35
    const inDoorwayZ = nextPos.z >= 0.45 && nextPos.z <= 2.35;

    // Movement zones:
    // Main room bounds: X [-4.2, 4.2], Z [-5.3, 5.2]
    // Enlarged bathroom room bounds: X [5.15, 11.0], Z [-1.6, 4.4]
    if (this.playerPosition.x <= 4.5) {
      // Currently inside main room
      if (inDoorwayZ && nextPos.x > 4.2) {
        if (this.isBathroomUnlocked) {
          // Walking through opened doorway into enlarged bathroom
          nextPos.x = Math.max(-4.2, Math.min(11.0, nextPos.x));
        } else {
          // Bathroom door is locked closed! Block player at door
          nextPos.x = Math.max(-4.2, Math.min(4.2, nextPos.x));
        }
      } else {
        nextPos.x = Math.max(-4.2, Math.min(4.2, nextPos.x));
      }
      nextPos.z = Math.max(-5.3, Math.min(5.2, nextPos.z));
    } else {
      // Currently in doorway or inside bathroom
      if (inDoorwayZ) {
        // Can walk back and forth between main room and bathroom
        nextPos.x = Math.max(-4.2, Math.min(11.0, nextPos.x));
        if (nextPos.x > 4.8) {
          nextPos.z = Math.max(-1.6, Math.min(4.4, nextPos.z));
        } else {
          nextPos.z = Math.max(-5.3, Math.min(5.2, nextPos.z));
        }
      } else {
        // Confined inside bathroom by West partition wall at X = 5.0
        nextPos.x = Math.max(5.15, Math.min(11.0, nextPos.x));
        nextPos.z = Math.max(-1.6, Math.min(4.4, nextPos.z));
      }
    }

    // Main room obstacles:
    // Desk: X [-4.5, -2.8], Z [-2.5, -0.5]
    if (nextPos.x < -2.8 && nextPos.z > -2.5 && nextPos.z < -0.5) {
      if (this.playerPosition.x >= -2.8) nextPos.x = -2.8;
      else if (this.playerPosition.z <= -2.5) nextPos.z = -2.5;
      else if (this.playerPosition.z >= -0.5) nextPos.z = -0.5;
    }

    // Fridge: X [2.9, 4.5], Z [-5.5, -3.8]
    if (nextPos.x > 2.9 && nextPos.x < 4.8 && nextPos.z < -3.8) {
      if (this.playerPosition.x <= 2.9) nextPos.x = 2.9;
      else if (this.playerPosition.z >= -3.8) nextPos.z = -3.8;
    }

    // Bathroom obstacles (spacious layout):
    // Bathtub against East wall: X > 10.2, Z in [0.05, 2.75]
    if (nextPos.x > 10.2 && nextPos.z > 0.05 && nextPos.z < 2.75) {
      nextPos.x = 10.2;
    }

    // Decrepit Toilet against South wall: X [6.9, 8.1], Z > 3.8
    if (nextPos.x > 6.9 && nextPos.x < 8.1 && nextPos.z > 3.8) {
      if (this.playerPosition.z <= 3.8) nextPos.z = 3.8;
      else if (this.playerPosition.x <= 6.9) nextPos.x = 6.9;
      else nextPos.x = 8.1;
    }

    // Pedestal Sink against North wall: X [7.9, 9.1], Z < -1.15
    if (nextPos.x > 7.9 && nextPos.x < 9.1 && nextPos.z < -1.15) {
      nextPos.z = -1.15;
    }

    this.playerPosition.copy(nextPos);
    this.camera.position.copy(this.playerPosition);
  }

  /**
   * Apply Gyroscope Orientation with Lerp smoothing
   * Mobile camera orientation is exclusively driven by the Gyroscope.
   */
  public applyGyroOrientation(data: OrientationData) {
    this.hasGyroInput = true;
    const degToRad = Math.PI / 180;
    // Beta is pitch: looking up/down. Upright vertical phone in hand: beta ~ 90° -> pitch ~ 0.
    const pitch = (data.beta - 90) * degToRad * 0.95;
    const yaw = -data.alpha * degToRad;
    const roll = -data.gamma * degToRad * 0.5;

    this.gyroEuler.set(pitch, yaw, roll, 'YXZ');
  }

  /**
   * Apply Touch Drag or Mouse Look
   * Ignored if Gyroscope is active, adhering to strictly gyro-driven mobile camera navigation.
   */
  public applyLookDelta(dx: number, dy: number) {
    if (this.hasGyroInput) {
      return;
    }
    const sensitivity = 0.003;
    this.cameraEuler.y -= dx * sensitivity;
    this.cameraEuler.x = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.cameraEuler.x - dy * sensitivity));
  }

  public recenterCamera() {
    this.cameraEuler.set(0, 0, 0, 'YXZ');
    this.gyroEuler.set(0, 0, 0, 'YXZ');
  }

  /**
   * Evaluates interactive objects under the strict conditions:
   * 1. Distance <= target.maxDist
   * 2. Center Raycast / Screen Area Focus (<= 24° cone or direct ray hit)
   * 3. Strict Frontal View (Dot Product of gaze vs front normal: facingDot >= cos(30°), player in front of surface plane)
   */
  private checkFocusAndHighlights(time: number) {
    const gaze = new THREE.Vector3();
    this.camera.getWorldDirection(gaze);
    gaze.normalize();

    let focusedTarget: InteractiveTargetDef | null = null;
    let minAimAngle = 999;
    let focusedAngleDeg = 180;
    let focusedDist = 999;

    let obliqueTargetId: InteractiveTargetId = null;
    let obliqueMinDist = 999;
    let obliqueAngleDeg = 180;

    // Center raycast directly from screen center (0, 0)
    this.centerRaycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    for (const target of this.targetDefinitions) {
      if (target.id === 'bathroom_door' && this.isBathroomUnlocked) {
        // Dividing door is already open and unlocked
        continue;
      }

      const toTarget = target.pos.clone().sub(this.camera.position);
      const dist = toTarget.length();

      if (dist > target.maxDist) {
        continue;
      }

      const toTargetDir = toTarget.clone().normalize();
      const aimDot = gaze.dot(toTargetDir);
      const aimAngleDeg = Math.acos(Math.max(-1, Math.min(1, aimDot))) * (180 / Math.PI);

      // Direct raycast intersection check against target mesh
      const mesh = this.interactiveMeshes.get(target.id);
      let directRayHit = false;
      if (mesh) {
        const hits = this.centerRaycaster.intersectObject(mesh, true);
        if (hits.length > 0 && hits[0].distance <= target.maxDist) {
          directRayHit = true;
        }
      }

      const isCenteredInView = directRayHit || aimAngleDeg <= 24;

      if (!isCenteredInView) {
        continue;
      }

      // Check condition 1: Frontal Normal Cone (±30°)
      // The surface normal faces OUTWARD; player incoming gaze faces INWARD.
      // Therefore, gaze and frontNormal are opposing: facingDot = - (gaze . frontNormal)
      const facingDot = -gaze.dot(target.frontNormal);
      const facingAngleDeg = Math.acos(Math.max(-1, Math.min(1, facingDot))) * (180 / Math.PI);
      const inFrontOfSurface = this.camera.position.clone().sub(target.pos).dot(target.frontNormal) > -0.2;

      const isFrontallyFacing = facingAngleDeg <= target.maxAngleDeg && inFrontOfSurface;

      if (isFrontallyFacing) {
        if (aimAngleDeg < minAimAngle) {
          minAimAngle = aimAngleDeg;
          focusedTarget = target;
          focusedAngleDeg = Math.round(facingAngleDeg);
          focusedDist = dist;
        }
      } else {
        // Aiming at or hitting object, but viewed from side/rear or angle > 30°
        if (dist < obliqueMinDist) {
          obliqueMinDist = dist;
          obliqueTargetId = target.id;
          obliqueAngleDeg = Math.round(facingAngleDeg);
        }
      }
    }

    // Update state
    this.currentFocusState = {
      targetId: focusedTarget ? focusedTarget.id : null,
      isFrontallyFacing: !!focusedTarget,
      angleDeg: focusedTarget ? focusedAngleDeg : (obliqueTargetId ? obliqueAngleDeg : 180),
      distance: focusedTarget ? focusedDist : (obliqueTargetId ? obliqueMinDist : 999),
      nearObliqueTargetId: focusedTarget ? null : obliqueTargetId,
    };

    // Subtle 3D visual feedback: subtle emissive pulse on focused object
    const pulse = 0.5 + Math.sin(time * 3.5) * 0.5;
    this.highlightMaterials.forEach((mat, id) => {
      if (focusedTarget && id === focusedTarget.id) {
        if (id === 'broken_tile') {
          // Extremely subtle so tile must be searched for
          mat.emissive.setHex(0x1a120a);
          mat.emissiveIntensity = 0.2 + pulse * 0.15;
        } else {
          // Subtle warm golden/amber focus rim
          mat.emissive.setHex(0x3d3012);
          mat.emissiveIntensity = 0.45 + pulse * 0.35;
        }
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
      }
    });

    if (this.onFocusUpdate) {
      this.onFocusUpdate(this.currentFocusState);
    }
  }

  /**
   * Evaluates screen touch interaction strictly:
   * Only returns success: true if frontally facing (±30°) and centered.
   * If aiming at an object obliquely (>30°), returns reason: 'oblique'.
   */
  public triggerTouchInteraction(clientX?: number, clientY?: number): {
    success: boolean;
    targetId: InteractiveTargetId;
    reason: 'ok' | 'oblique' | 'none';
    angleDeg: number;
  } {
    // 1. Direct check against current frontally focused target
    if (this.currentFocusState.targetId && this.currentFocusState.isFrontallyFacing) {
      return {
        success: true,
        targetId: this.currentFocusState.targetId,
        reason: 'ok',
        angleDeg: this.currentFocusState.angleDeg,
      };
    }

    // 2. If center gaze points at an object but angle is oblique (>30°)
    if (this.currentFocusState.nearObliqueTargetId) {
      return {
        success: false,
        targetId: this.currentFocusState.nearObliqueTargetId,
        reason: 'oblique',
        angleDeg: this.currentFocusState.angleDeg,
      };
    }

    // 3. If tap coordinates were provided, raycast specific tap position
    if (clientX !== undefined && clientY !== undefined && this.container) {
      const rect = this.container.getBoundingClientRect();
      const tapX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const tapY = -((clientY - rect.top) / rect.height) * 2 + 1;
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(tapX, tapY), this.camera);

      const gaze = new THREE.Vector3();
      this.camera.getWorldDirection(gaze);
      gaze.normalize();

      for (const target of this.targetDefinitions) {
        if (target.id === 'bathroom_door' && this.isBathroomUnlocked) continue;
        const mesh = this.interactiveMeshes.get(target.id);
        if (!mesh) continue;

        const hits = ray.intersectObject(mesh, true);
        if (hits.length > 0 && hits[0].distance <= target.maxDist) {
          const facingDot = -gaze.dot(target.frontNormal);
          const facingAngleDeg = Math.acos(Math.max(-1, Math.min(1, facingDot))) * (180 / Math.PI);
          const inFront = this.camera.position.clone().sub(target.pos).dot(target.frontNormal) > -0.2;

          if (facingAngleDeg <= target.maxAngleDeg && inFront) {
            return {
              success: true,
              targetId: target.id,
              reason: 'ok',
              angleDeg: Math.round(facingAngleDeg),
            };
          } else {
            return {
              success: false,
              targetId: target.id,
              reason: 'oblique',
              angleDeg: Math.round(facingAngleDeg),
            };
          }
        }
      }
    }

    return {
      success: false,
      targetId: null,
      reason: 'none',
      angleDeg: 180,
    };
  }

  public getCurrentFocusState(): FocusState {
    return this.currentFocusState;
  }

  /**
   * Distance from player camera to Main Chained Door
   */
  public getDistanceToDoor(): number {
    return this.camera.position.distanceTo(new THREE.Vector3(0, 1.35, this.doorBaseZ));
  }

  /**
   * Visual recoil & camera tremor when heavy door knocks occur
   */
  public triggerDoorKnockImpact() {
    this.doorShakeStartTime = performance.now();
    // Micro camera tremor
    this.cameraEuler.x += (Math.random() - 0.5) * 0.02;
    this.cameraEuler.y += (Math.random() - 0.5) * 0.02;
  }

  /**
   * Main Render Loop
   */
  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const time = performance.now() * 0.001;

    // 1. Light flicker of ceiling bulb synchronized with "sonido de foco"
    const isDip = Math.sin(time * 12.0) > 0.82 || Math.random() > 0.96;
    const flicker = 1.0 + (isDip ? -0.45 : 0.0) + (Math.random() > 0.95 ? -0.2 : 0.0);
    const bulbIntensity = Math.max(0.2, flicker * 1.15);
    this.centerBulbLight.intensity = bulbIntensity;

    if (this.bulbMesh) {
      (this.bulbMesh.material as THREE.MeshBasicMaterial).color.setHex(
        isDip ? 0xb59e66 : 0xffeaad
      );
    }

    // Synchronize ceiling light with lower-volume foco electrical sound
    horrorAudio.syncCeilingLight(bulbIntensity, isDip);

    // 2. Physical door vibration on knock impact
    if (this.doorGroup && this.doorShakeStartTime > 0) {
      const elapsed = performance.now() - this.doorShakeStartTime;
      if (elapsed < 400) {
        const decay = 1.0 - elapsed / 400;
        const joltZ = Math.sin(elapsed * 0.08) * 0.018 * decay;
        this.doorGroup.position.z = this.doorBaseZ + joltZ;
      } else {
        this.doorGroup.position.z = this.doorBaseZ;
      }
    }

    // Smooth swinging open/closed of the dividing bathroom door
    if (this.bathroomDoorPivot) {
      const targetDoorAngle = this.isBathroomUnlocked ? Math.PI * 0.48 : 0.0;
      this.bathroomDoorPivot.rotation.y = THREE.MathUtils.lerp(
        this.bathroomDoorPivot.rotation.y,
        targetDoorAngle,
        0.08
      );
    }

    // 3. Camera Orientation: Gyroscope is exclusive on mobile; manual Euler fallback for desktop
    if (this.hasGyroInput) {
      this.camera.quaternion.setFromEuler(this.gyroEuler);
    } else {
      this.camera.quaternion.setFromEuler(this.cameraEuler);
    }

    // 4. Flashlight follows camera look
    this.flashlight.position.copy(this.camera.position);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.flashlightTarget.position.copy(this.camera.position).add(forward.multiplyScalar(4));

    // 5. Evaluate strict frontal focus and visual highlight
    this.checkFocusAndHighlights(time);

    // 6. Update distance to bathroom for subtle weeping audio cue
    const distToBathroom = this.playerPosition.distanceTo(new THREE.Vector3(8.2, 1.6, 1.4));
    horrorAudio.updateBathroomDistance(distToBathroom);

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }

  private handleResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
