/**
 * Three.js 3D Escape Room Scene Manager
 * "ESCAPE FROM THE PIBE ROOM"
 * Implements room geometry, atmospheric lighting, flashlight,
 * object interaction highlights, collision bounds, and camera gyro/touch control.
 */

import * as THREE from 'three';
import { InteractiveTargetId, LockState, OrientationData } from '../types/game';
import { TextureGenerator } from './TextureGenerator';
import { horrorAudio } from '../audio/HorrorAudioManager';

export interface SceneInteractionCallback {
  (targetId: InteractiveTargetId, distance: number): void;
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
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  private fridgeGlowLight: THREE.PointLight;

  // Player state
  private playerPosition = new THREE.Vector3(0, 1.6, 2.5); // Start in center-back
  private cameraEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private gyroEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private touchLookDelta = { x: 0, y: 0 };
  private moveVelocity = new THREE.Vector3();
  private isFlashlightOn = true;

  // Interactive Meshes
  private interactiveMeshes: Map<InteractiveTargetId, THREE.Mesh | THREE.Group> = new Map();
  private highlightMaterials: Map<InteractiveTargetId, THREE.MeshStandardMaterial> = new Map();
  private currentNearTarget: InteractiveTargetId = null;

  // Chains & Locks meshes on main door
  private chainGroup: THREE.Group = new THREE.Group();
  private keyLockMesh: THREE.Object3D | null = null;
  private codeLockMesh: THREE.Object3D | null = null;
  private fuseLockMesh: THREE.Object3D | null = null;

  // Callbacks
  private onInteractionUpdate: SceneInteractionCallback | null = null;

  // Raycaster for taps
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor(container: HTMLElement, onInteractionUpdate: SceneInteractionCallback) {
    this.container = container;
    this.onInteractionUpdate = onInteractionUpdate;

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

    // East Wall (X = 5, kitchen area & fusebox)
    const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.4), wallMat);
    eastWall.position.set(5, 1.7, 0);
    eastWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastWall);

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

    // 6. Heavy Hanging Padlocks Matching Reference
    // Padlock 1: Left Hanging Brass Key Padlock (opened with fridge key)
    const keyLockGroup = new THREE.Group();
    keyLockGroup.position.set(-0.82, 0.06, 0.16);
    keyLockGroup.rotation.z = 0.08;

    const keyLockBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.18, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xba943a, metalness: 0.85, roughness: 0.3 })
    );
    const keyLockShackle = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.016, 8, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x82848a, metalness: 0.9, roughness: 0.2 })
    );
    keyLockShackle.position.set(0, 0.09, 0);

    // Keyhole detail
    const keyhole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.01, 8),
      new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
    );
    keyhole.rotation.x = Math.PI / 2;
    keyhole.position.set(0, -0.02, 0.031);

    keyLockGroup.add(keyLockBody, keyLockShackle, keyhole);
    this.keyLockMesh = keyLockGroup;
    this.chainGroup.add(keyLockGroup);

    // Padlock 2: Central Junction 4-Digit Combination Padlock (opened with 1986 code)
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
    fuseBoxGroup.position.set(4.9, 1.6, 1.5);
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
    if (lockState.keyLock && this.keyLockMesh) {
      this.keyLockMesh.visible = false;
    }
    if (lockState.codeLock && this.codeLockMesh) {
      this.codeLockMesh.visible = false;
    }
    if (lockState.fuseLock && this.fuseLockMesh) {
      this.fuseLockMesh.visible = false;
    }
    if (lockState.allChainsRemoved) {
      this.chainGroup.visible = false;
    }
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

    // Movement forward/back & left/right relative to camera's horizontal yaw
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraEuler.y);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraEuler.y);
    right.y = 0;
    right.normalize();

    const moveX = right.multiplyScalar(vector.x * moveSpeed);
    const moveZ = forward.multiplyScalar(vector.y * moveSpeed);

    const nextPos = this.playerPosition.clone().add(moveX).add(moveZ);

    // Collision boundaries (room interior X: -4.3 to 4.3, Z: -5.2 to 5.2)
    nextPos.x = Math.max(-4.2, Math.min(4.2, nextPos.x));
    nextPos.z = Math.max(-5.3, Math.min(5.2, nextPos.z));

    // Simple obstacle boxes: Desk & Fridge
    // Desk: X [-4.5, -2.8], Z [-2.5, -0.5]
    if (nextPos.x < -2.8 && nextPos.z > -2.5 && nextPos.z < -0.5) {
      // Push out
      if (this.playerPosition.x >= -2.8) nextPos.x = -2.8;
      else if (this.playerPosition.z <= -2.5) nextPos.z = -2.5;
      else if (this.playerPosition.z >= -0.5) nextPos.z = -0.5;
    }

    // Fridge: X [2.9, 4.5], Z [-5.5, -3.8]
    if (nextPos.x > 2.9 && nextPos.z < -3.8) {
      if (this.playerPosition.x <= 2.9) nextPos.x = 2.9;
      else if (this.playerPosition.z >= -3.8) nextPos.z = -3.8;
    }

    this.playerPosition.copy(nextPos);
    this.camera.position.copy(this.playerPosition);
  }

  /**
   * Apply Gyroscope Orientation with Lerp smoothing
   */
  public applyGyroOrientation(data: OrientationData) {
    // Gyroscope orientation mapping:
    // Beta: Pitch (tilt up/down) in radians
    // Alpha: Yaw (compass rotation) in radians
    // Gamma: Roll (tilt side-to-side) in radians
    const degToRad = Math.PI / 180;
    const pitch = (data.beta - 90) * degToRad * 0.85; // Standard phone held at ~45-90 deg
    const yaw = -data.alpha * degToRad;
    const roll = -data.gamma * degToRad * 0.4;

    this.gyroEuler.set(pitch, yaw, roll, 'YXZ');
  }

  /**
   * Apply Touch Drag or Mouse Look
   */
  public applyLookDelta(dx: number, dy: number) {
    const sensitivity = 0.003;
    this.cameraEuler.y -= dx * sensitivity;
    this.cameraEuler.x = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.cameraEuler.x - dy * sensitivity));
  }

  public recenterCamera() {
    this.cameraEuler.set(0, 0, 0, 'YXZ');
    this.gyroEuler.set(0, 0, 0, 'YXZ');
  }

  /**
   * Check proximity to interactive items and update glowing reflection highlight
   */
  private checkProximityAndHighlights(time: number) {
    const INTERACTION_DIST = 2.4;
    let closestTarget: InteractiveTargetId = null;
    let minDistance = 999;

    const targets: { id: InteractiveTargetId; pos: THREE.Vector3 }[] = [
      { id: 'main_door', pos: new THREE.Vector3(0, 1.4, -5.8) },
      { id: 'rotten_fridge', pos: new THREE.Vector3(3.6, 1.2, -4.6) },
      { id: 'study_desk', pos: new THREE.Vector3(-3.6, 0.9, -1.5) },
      { id: 'fuse_box', pos: new THREE.Vector3(4.8, 1.6, 1.5) },
    ];

    targets.forEach((t) => {
      const dist = this.playerPosition.distanceTo(t.pos);
      if (dist < INTERACTION_DIST && dist < minDistance) {
        minDistance = dist;
        closestTarget = t.id;
      }
    });

    this.currentNearTarget = closestTarget;

    // Animate glowing reflection highlight for all items based on proximity
    const pulse = 0.5 + Math.sin(time * 3.5) * 0.5; // 0..1 pulse
    this.highlightMaterials.forEach((mat, id) => {
      if (id === closestTarget) {
        // Active glowing reflection
        mat.emissive.setHex(0x384a20);
        mat.emissiveIntensity = 0.6 + pulse * 0.5;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
      }
    });

    if (this.onInteractionUpdate) {
      this.onInteractionUpdate(closestTarget, minDistance);
    }
  }

  /**
   * Raycast tap on screen to interact with 3D objects
   */
  public handleScreenTap(clientX: number, clientY: number): InteractiveTargetId {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const candidates: { id: InteractiveTargetId; object: THREE.Object3D }[] = [];
    this.interactiveMeshes.forEach((mesh, id) => {
      candidates.push({ id, object: mesh });
    });

    for (const item of candidates) {
      const intersects = this.raycaster.intersectObject(item.object, true);
      if (intersects.length > 0) {
        const dist = intersects[0].distance;
        if (dist < 3.2) {
          return item.id;
        }
      }
    }

    return this.currentNearTarget;
  }

  public getCurrentNearTarget(): InteractiveTargetId {
    return this.currentNearTarget;
  }

  /**
   * Distance from player to the main chained escape door
   */
  public getDistanceToDoor(): number {
    return this.playerPosition.distanceTo(new THREE.Vector3(0, 1.4, -5.8));
  }

  /**
   * Physical camera shudder when heavy door knocking occurs
   */
  public triggerDoorKnockShudder() {
    this.camera.position.x += (Math.random() - 0.5) * 0.05;
    this.camera.position.y += (Math.random() - 0.5) * 0.035;
  }

  /**
   * Main Render Loop
   */
  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const time = performance.now() * 0.001;

    // 1. Subtle light flicker of ceiling bulb + modulate foco hum
    const flicker = 1.0 + (Math.sin(time * 12.0) > 0.85 ? -0.4 : 0.0) + (Math.random() > 0.98 ? -0.3 : 0.0);
    this.centerBulbLight.intensity = Math.max(0.2, flicker * 1.1);
    horrorAudio.updateFocoFlicker(flicker);

    // 2. Camera Orientation: combine touch yaw with gyro
    this.camera.quaternion.setFromEuler(this.cameraEuler);
    // If gyro is active, multiply rotation
    if (this.gyroEuler.x !== 0 || this.gyroEuler.y !== 0) {
      const gyroQuat = new THREE.Quaternion().setFromEuler(this.gyroEuler);
      this.camera.quaternion.multiply(gyroQuat);
    }

    // 3. Flashlight follows camera look
    this.flashlight.position.copy(this.camera.position);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.flashlightTarget.position.copy(this.camera.position).add(forward.multiplyScalar(4));

    // 4. Check proximity and glow
    this.checkProximityAndHighlights(time);

    // 5. Render
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
