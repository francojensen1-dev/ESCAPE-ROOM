/**
 * Three.js 3D Escape Room Scene Manager
 * "ESCAPE FROM THE PIBE ROOM"
 * Implements room geometry, atmospheric lighting, flashlight,
 * object interaction highlights, collision bounds, and camera gyro/touch control.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { InteractiveTargetId, LockState, OrientationData } from '../types/game';
import { TextureGenerator } from './TextureGenerator';
import { horrorAudio } from '../audio/HorrorAudioManager';

export interface InteractionStatus {
  target: InteractiveTargetId;
  isFlashlightOn: boolean;
  isIlluminated: boolean;
  distance: number;
}

export interface InteractionTapResult {
  target: InteractiveTargetId;
  success: boolean;
  reason: 'ok' | 'flashlight_off' | 'not_illuminated' | 'too_far' | 'miss';
}

export interface SceneInteractionCallback {
  (status: InteractionStatus): void;
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
  private doorSpotLight: THREE.SpotLight | null = null;
  private bulbMesh: THREE.Mesh | null = null;
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  private fridgeGlowLight: THREE.PointLight;

  // Door Mesh & Knock Impact
  private doorGroup: THREE.Group | null = null;
  private doorBaseZ: number = -5.92;
  private pibeDoorGroup: THREE.Group | null = null;
  private pibeDoorBaseZ: number = 5.92;
  private doorShakeStartTime: number = 0;

  // Player state
  private playerPosition = new THREE.Vector3(0, 1.6, 2.5); // Start in center-back
  private touchYaw: number = 0;
  private touchPitch: number = 0;
  private gyroYaw: number = 0;
  private gyroPitch: number = 0;
  private moveVelocity = new THREE.Vector3();
  private isFlashlightOn = true;

  // Interactive Meshes
  private interactiveMeshes: Map<InteractiveTargetId, THREE.Mesh | THREE.Group> = new Map();
  private highlightMaterials: Map<InteractiveTargetId, THREE.MeshStandardMaterial> = new Map();
  private currentNearTarget: InteractiveTargetId = null;

  // Chains & Locks meshes on main door (4 locks)
  private chainGroup: THREE.Group = new THREE.Group();
  private codeLockMesh: THREE.Object3D | null = null;
  private fuseLockMesh: THREE.Object3D | null = null;
  private toiletLockMesh: THREE.Object3D | null = null;
  private letterLockMesh: THREE.Object3D | null = null;

  // Bathroom dividing door
  private bathroomDoorPivot: THREE.Group = new THREE.Group();
  private isBathroomUnlocked: boolean = false;

  // Silent Hill Sink, Fetus ("feto.glb") & Positional Weeping Audio ("llanto.wav")
  private sinkPosition = new THREE.Vector3(8.5, 0.85, -1.60);
  private sinkGroup: THREE.Group = new THREE.Group();
  private fetoModel: THREE.Object3D | null = null;

  // New Horror Bedroom (Habitación Tétrica) & Hanging Man
  private bedroomGroup: THREE.Group = new THREE.Group();
  private hangingManGroup: THREE.Group = new THREE.Group();
  private hangingManPendulum: THREE.Group = new THREE.Group();
  private tvScreenMesh: THREE.Mesh | null = null;
  private tvLight: THREE.PointLight | null = null;
  private bedroomLampLight: THREE.PointLight | null = null;

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

    // 4. Lights (Moody chiaroscuro horror lighting matching reference photos)
    this.ambientLight = new THREE.AmbientLight(0x0c0e14, 0.22);
    this.scene.add(this.ambientLight);

    // Warm industrial amber luminaire in center of room (matching Image 1)
    this.centerBulbLight = new THREE.PointLight(0xff9438, 2.0, 11, 1.7);
    this.centerBulbLight.position.set(0, 3.05, 0);
    this.scene.add(this.centerBulbLight);

    // Dedicated overhead angled amber wash spotlight on the Main Chained Door (Image 1 aesthetic)
    this.doorSpotLight = new THREE.SpotLight(0xff9f42, 1.8, 11, Math.PI / 4, 0.5, 1.6);
    this.doorSpotLight.position.set(0, 3.25, -2.2);
    const doorLightTarget = new THREE.Object3D();
    doorLightTarget.position.set(0, 1.4, -5.92);
    this.scene.add(doorLightTarget);
    this.doorSpotLight.target = doorLightTarget;
    this.scene.add(this.doorSpotLight);

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
    this.buildPibeDoor();
    this.buildRottenFridge();
    this.buildStudyDesk();
    this.buildKitchenCredenza();
    this.buildUtilityCart();
    this.buildAtmosphericWindowAndLightBeams();
    this.buildCeilingFan();
    this.buildElectricalFuseBox();
    this.buildBathroom();
    this.buildBedroom();
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
   * AESTHETICS (from reference images):
   * - Each wall has its OWN UNIQUE, non-repeating procedural texture and bump map.
   * - Floor and ceiling are preserved intact as requested ("no el piso ni el techo").
   * - North Wall has heavy wear and tear detailing flanking the main door.
   */
  private buildRoom() {
    // 1. Textures: 4 UNIQUE non-repeating wall materials matching reference images
    const northTex = TextureGenerator.createNorthDoorWallTexture();
    const southTex = TextureGenerator.createSouthWoodWallTexture();
    const westTex = TextureGenerator.createWestPlasterWallTexture();
    const eastTex = TextureGenerator.createEastIndustrialWallTexture();

    // Floor texture preserved exactly as requested
    const floorTex = TextureGenerator.createWoodFloorTexture();

    // North Wall Material (Front wall in front of player: vertical weathered wood with peeling cyan paint)
    const northWallMat = new THREE.MeshStandardMaterial({
      map: northTex.map,
      bumpMap: northTex.bump,
      bumpScale: 0.055,
      roughness: 0.86,
      metalness: 0.06,
    });

    // South Wall Material (Back wall behind player: vertical weathered wood with peeling cyan paint)
    const southWallMat = new THREE.MeshStandardMaterial({
      map: southTex.map,
      bumpMap: southTex.bump,
      bumpScale: 0.05,
      roughness: 0.86,
      metalness: 0.08,
    });

    // West Wall Material (Left Wall: weathered seafoam turquoise wooden planks with nails from user's photo)
    const westWallMat = new THREE.MeshStandardMaterial({
      map: westTex.map,
      bumpMap: westTex.bump,
      bumpScale: 0.055,
      roughness: 0.86,
      metalness: 0.05,
    });

    const textureLoader = new THREE.TextureLoader();

    // Directly load user's uploaded reference photo for the Front Wall (North Wall in front of player: textura_madera1)
    const northTexturePath = '/assets/aistudio/textura_madera1_07435e48.jpg';
    textureLoader.load(
      northTexturePath,
      (loadedNorthTexture) => {
        loadedNorthTexture.wrapS = THREE.RepeatWrapping;
        loadedNorthTexture.wrapT = THREE.RepeatWrapping;
        loadedNorthTexture.repeat.set(4, 1);
        loadedNorthTexture.colorSpace = THREE.SRGBColorSpace;
        northWallMat.map = loadedNorthTexture;
        northWallMat.bumpMap = loadedNorthTexture;
        northWallMat.bumpScale = 0.06;
        northWallMat.roughness = 0.86;
        northWallMat.metalness = 0.06;
        northWallMat.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn('Could not load /assets/aistudio/textura_madera1_07435e48.jpg for North wall, trying fallback /imgs/textura_madera1.jpg:', err);
        textureLoader.load('/imgs/textura_madera1.jpg', (fallbackTex) => {
          fallbackTex.wrapS = THREE.RepeatWrapping;
          fallbackTex.wrapT = THREE.RepeatWrapping;
          fallbackTex.repeat.set(4, 1);
          fallbackTex.colorSpace = THREE.SRGBColorSpace;
          northWallMat.map = fallbackTex;
          northWallMat.bumpMap = fallbackTex;
          northWallMat.bumpScale = 0.06;
          northWallMat.needsUpdate = true;
        });
      }
    );

    // Directly load user's uploaded reference photo for the Back Wall (South Wall behind player: textura_madera1)
    const southTexturePath = '/assets/aistudio/textura_madera1_07435e48.jpg';
    textureLoader.load(
      southTexturePath,
      (loadedSouthTexture) => {
        loadedSouthTexture.wrapS = THREE.RepeatWrapping;
        loadedSouthTexture.wrapT = THREE.RepeatWrapping;
        loadedSouthTexture.repeat.set(4, 1);
        loadedSouthTexture.colorSpace = THREE.SRGBColorSpace;
        southWallMat.map = loadedSouthTexture;
        southWallMat.bumpMap = loadedSouthTexture;
        southWallMat.bumpScale = 0.06;
        southWallMat.roughness = 0.86;
        southWallMat.metalness = 0.06;
        southWallMat.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn('Could not load /assets/aistudio/textura_madera1_07435e48.jpg, trying fallback /imgs/textura_madera1.jpg:', err);
        textureLoader.load('/imgs/textura_madera1.jpg', (fallbackTex) => {
          fallbackTex.wrapS = THREE.RepeatWrapping;
          fallbackTex.wrapT = THREE.RepeatWrapping;
          fallbackTex.repeat.set(4, 1);
          fallbackTex.colorSpace = THREE.SRGBColorSpace;
          southWallMat.map = fallbackTex;
          southWallMat.bumpMap = fallbackTex;
          southWallMat.bumpScale = 0.06;
          southWallMat.needsUpdate = true;
        });
      }
    );

    // Directly load the user's uploaded reference photo for the Left Wall (West Wall: textura_madera4)
    const westTexturePath = '/assets/aistudio/textura_madera4_5b075e57.jpg';
    textureLoader.load(
      westTexturePath,
      (loadedWestTexture) => {
        loadedWestTexture.wrapS = THREE.RepeatWrapping;
        loadedWestTexture.wrapT = THREE.RepeatWrapping;
        loadedWestTexture.repeat.set(1, 1);
        loadedWestTexture.colorSpace = THREE.SRGBColorSpace;
        westWallMat.map = loadedWestTexture;
        westWallMat.bumpMap = loadedWestTexture;
        westWallMat.bumpScale = 0.06;
        westWallMat.roughness = 0.86;
        westWallMat.metalness = 0.05;
        westWallMat.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn('Could not load /assets/aistudio/textura_madera4_5b075e57.jpg, trying fallback /imgs/textura_madera4.jpg:', err);
        textureLoader.load('/imgs/textura_madera4.jpg', (fallbackTex) => {
          fallbackTex.wrapS = THREE.RepeatWrapping;
          fallbackTex.wrapT = THREE.RepeatWrapping;
          fallbackTex.repeat.set(1, 1);
          fallbackTex.colorSpace = THREE.SRGBColorSpace;
          westWallMat.map = fallbackTex;
          westWallMat.bumpMap = fallbackTex;
          westWallMat.bumpScale = 0.06;
          westWallMat.needsUpdate = true;
        });
      }
    );

    // East Wall Material (Right Wall: weathered whitewashed wood planks with moss/lichen from user's photo)
    const eastWallMat = new THREE.MeshStandardMaterial({
      map: eastTex.map,
      bumpMap: eastTex.bump,
      bumpScale: 0.055,
      roughness: 0.88,
      metalness: 0.05,
    });

    // Directly load the user's uploaded reference photo for the Right Wall (East Wall: textura_madera3)
    const eastTexturePath = '/assets/aistudio/textura_madera3_d68b8c27.jpg';
    textureLoader.load(
      eastTexturePath,
      (loadedEastTexture) => {
        loadedEastTexture.wrapS = THREE.RepeatWrapping;
        loadedEastTexture.wrapT = THREE.RepeatWrapping;
        loadedEastTexture.repeat.set(1, 1);
        loadedEastTexture.colorSpace = THREE.SRGBColorSpace;
        eastWallMat.map = loadedEastTexture;
        eastWallMat.bumpMap = loadedEastTexture;
        eastWallMat.bumpScale = 0.06;
        eastWallMat.roughness = 0.88;
        eastWallMat.metalness = 0.05;
        eastWallMat.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn('Could not load /assets/aistudio/textura_madera3_d68b8c27.jpg, trying fallback /imgs/textura_madera3.jpg:', err);
        textureLoader.load('/imgs/textura_madera3.jpg', (fallbackTex) => {
          fallbackTex.wrapS = THREE.RepeatWrapping;
          fallbackTex.wrapT = THREE.RepeatWrapping;
          fallbackTex.repeat.set(1, 1);
          fallbackTex.colorSpace = THREE.SRGBColorSpace;
          eastWallMat.map = fallbackTex;
          eastWallMat.bumpMap = fallbackTex;
          eastWallMat.bumpScale = 0.06;
          eastWallMat.needsUpdate = true;
        });
      }
    );

    // Floor Material (Weathered wood with peeling sage green paint matching user's photo)
    // Floor Textures (Homogeneous seamless dark wood floor based on textura_madera6)
    const floorTextures = TextureGenerator.createHomogeneousWoodFloorTextures();
    // 4 repeats across 10m width gives ~15.6cm realistic board width, 4 repeats across 12m depth gives 3m boards
    floorTextures.map.repeat.set(4, 4);
    floorTextures.bump.repeat.set(4, 4);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTextures.map,
      bumpMap: floorTextures.bump,
      bumpScale: 0.045,
      roughness: 0.76,
      metalness: 0.04,
    });

    // Seamlessly blend real grain from the clean interior of textura_madera6 (cropping out border beams)
    const floorImg = new Image();
    floorImg.crossOrigin = 'anonymous';
    floorImg.onload = () => {
      TextureGenerator.updateHomogeneousWoodFloorTextures(floorTextures, floorImg);
      floorMat.needsUpdate = true;
    };
    floorImg.onerror = () => {
      floorImg.src = '/imgs/textura_madera6.jpg';
    };
    floorImg.src = '/assets/aistudio/textura_madera6_4d492d66.jpg';

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

    // North Wall (Z = -6, contains Main Door with custom wear detailing)
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.4), northWallMat);
    northWall.position.set(0, 1.7, -6);
    this.scene.add(northWall);

    // South Wall (Z = 6, weathered horizontal timber boards)
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.4), southWallMat);
    southWall.position.set(0, 1.7, 6);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);

    // East Wall with Bathroom Doorway opening (Right wall: weathered whitewashed wood planks with lichen)
    // 1. North Segment (Z: -6 to 0.4, length 6.4m, center Z = -2.8)
    const geoEastNorth = new THREE.PlaneGeometry(6.4, 3.4);
    const uvsNorth = geoEastNorth.attributes.uv;
    for (let i = 0; i < uvsNorth.count; i++) {
      uvsNorth.setX(i, (uvsNorth.getX(i) * 6.4) / 3.0);
    }
    uvsNorth.needsUpdate = true;
    const eastWallNorth = new THREE.Mesh(geoEastNorth, eastWallMat);
    eastWallNorth.position.set(5, 1.7, -2.8);
    eastWallNorth.rotation.y = -Math.PI / 2;
    this.scene.add(eastWallNorth);

    // 2. South Segment (Z: 2.4 to 6.0, length 3.6m, center Z = 4.2)
    const geoEastSouth = new THREE.PlaneGeometry(3.6, 3.4);
    const uvsSouth = geoEastSouth.attributes.uv;
    for (let i = 0; i < uvsSouth.count; i++) {
      uvsSouth.setX(i, (uvsSouth.getX(i) * 3.6) / 3.0);
    }
    uvsSouth.needsUpdate = true;
    const eastWallSouth = new THREE.Mesh(geoEastSouth, eastWallMat);
    eastWallSouth.position.set(5, 1.7, 4.2);
    eastWallSouth.rotation.y = -Math.PI / 2;
    this.scene.add(eastWallSouth);

    // 3. Header Wall above bathroom doorway (Z: 0.4 to 2.4, Y: 2.3 to 3.4)
    const geoEastHeader = new THREE.PlaneGeometry(2.0, 1.1);
    const uvsHeader = geoEastHeader.attributes.uv;
    for (let i = 0; i < uvsHeader.count; i++) {
      uvsHeader.setX(i, (uvsHeader.getX(i) * 2.0) / 3.0);
      uvsHeader.setY(i, 1.0 - (1.0 - uvsHeader.getY(i)) * (1.1 / 3.4));
    }
    uvsHeader.needsUpdate = true;
    const eastWallHeader = new THREE.Mesh(geoEastHeader, eastWallMat);
    eastWallHeader.position.set(5, 2.85, 1.4);
    eastWallHeader.rotation.y = -Math.PI / 2;
    this.scene.add(eastWallHeader);

    // West Wall with open doorway into New Bedroom (X = -5.0, doorway at Z = [0.9, 2.7])
    // 1. North Segment (Z: -6.0 to 0.9, length 6.9m, center Z = -2.55)
    // Anchors the relocated electrical fuse box at Z = -3.2 firmly against the wall
    const geoWestNorth = new THREE.PlaneGeometry(6.9, 3.4);
    const uvsWestNorth = geoWestNorth.attributes.uv;
    for (let i = 0; i < uvsWestNorth.count; i++) {
      uvsWestNorth.setX(i, (uvsWestNorth.getX(i) * 6.9) / 3.0);
    }
    uvsWestNorth.needsUpdate = true;
    const westWallNorth = new THREE.Mesh(geoWestNorth, westWallMat);
    westWallNorth.position.set(-5, 1.7, -2.55);
    westWallNorth.rotation.y = Math.PI / 2;
    this.scene.add(westWallNorth);

    // 2. Doorway Header above bedroom entrance (Z: 0.9 to 2.7, length 1.8m, height 1.2m, Y: 2.2 to 3.4)
    const geoWestHeader = new THREE.PlaneGeometry(1.8, 1.2);
    const uvsWestHeader = geoWestHeader.attributes.uv;
    for (let i = 0; i < uvsWestHeader.count; i++) {
      uvsWestHeader.setX(i, (uvsWestHeader.getX(i) * 1.8) / 3.0);
      uvsWestHeader.setY(i, 1.0 - (1.0 - uvsWestHeader.getY(i)) * (1.2 / 3.4));
    }
    uvsWestHeader.needsUpdate = true;
    const westWallHeader = new THREE.Mesh(geoWestHeader, westWallMat);
    westWallHeader.position.set(-5, 2.8, 1.8);
    westWallHeader.rotation.y = Math.PI / 2;
    this.scene.add(westWallHeader);

    // 3. South Segment (Z: 2.7 to 6.0, length 3.3m, center Z = 4.35)
    const geoWestSouth = new THREE.PlaneGeometry(3.3, 3.4);
    const uvsWestSouth = geoWestSouth.attributes.uv;
    for (let i = 0; i < uvsWestSouth.count; i++) {
      uvsWestSouth.setX(i, (uvsWestSouth.getX(i) * 3.3) / 3.0);
    }
    uvsWestSouth.needsUpdate = true;
    const westWallSouth = new THREE.Mesh(geoWestSouth, westWallMat);
    westWallSouth.position.set(-5, 1.7, 4.35);
    westWallSouth.rotation.y = Math.PI / 2;
    this.scene.add(westWallSouth);

    // Build 3D physical wear & decay relief details flanking the door (Image 1 reference!)
    this.buildDoorSurroundWearDetails();

    // Industrial hanging cage fixture in ceiling center (Image 1 aesthetic)
    this.buildCeilingIndustrialFixture();
  }

  /**
   * 3D Physical Wear & Decay details on North Wall flanking the Main Door
   * (Referencing Image 1 and Image 2):
   * - Bolted industrial steel corner angle-irons anchoring the door frame
   * - Peeling drywall relief slabs lifting away from the wall plane
   * - Exposed dark brick/metal backing plates under chipped plaster
   * - Frantic claw scratch decal plate beside the padlocks
   * - Drooping oxidized conduit and detached electrical wiring above the door
   */
  private buildDoorSurroundWearDetails() {
    const wearGroup = new THREE.Group();

    const rustMetalMat = new THREE.MeshStandardMaterial({
      color: 0x2e231c,
      metalness: 0.85,
      roughness: 0.4,
    });

    const chippedPlasterMat = new THREE.MeshStandardMaterial({
      color: 0x3d362a,
      roughness: 0.95,
      metalness: 0.05,
    });

    const darkHoleMat = new THREE.MeshStandardMaterial({
      color: 0x12100e,
      roughness: 0.9,
      metalness: 0.2,
    });

    // 1. Heavy Rusted Industrial Angle-Iron Brackets Flanking Door Frame (Image 1 reference)
    // Left Structural Bracket (X = -1.22)
    const leftAngleIron = new THREE.Mesh(new THREE.BoxGeometry(0.09, 3.2, 0.03), rustMetalMat);
    leftAngleIron.position.set(-1.22, 1.6, -5.97);
    wearGroup.add(leftAngleIron);

    // Right Structural Bracket (X = 1.22)
    const rightAngleIron = new THREE.Mesh(new THREE.BoxGeometry(0.09, 3.2, 0.03), rustMetalMat);
    rightAngleIron.position.set(1.22, 1.6, -5.97);
    wearGroup.add(rightAngleIron);

    // Heavy Industrial Hex Bolts along the angle-irons
    const boltGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.02, 6);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0x1f1b17, metalness: 0.9, roughness: 0.3 });
    for (let by = 0.3; by < 3.1; by += 0.5) {
      const leftBolt = new THREE.Mesh(boltGeo, boltMat);
      leftBolt.rotation.x = Math.PI / 2;
      leftBolt.position.set(-1.22, by, -5.95);
      wearGroup.add(leftBolt);

      const rightBolt = new THREE.Mesh(boltGeo, boltMat);
      rightBolt.rotation.x = Math.PI / 2;
      rightBolt.position.set(1.22, by, -5.95);
      wearGroup.add(rightBolt);
    }

    // 2. Physical Peeling Drywall / Plaster Relief Slabs with Curled Edges (3D Depth)
    // Left Peeling Plaster Slab (X = -1.58, Y = 1.95)
    const leftPlasterSlab = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.85, 0.022), chippedPlasterMat);
    leftPlasterSlab.position.set(-1.58, 1.95, -5.965);
    leftPlasterSlab.rotation.z = -0.06;
    leftPlasterSlab.rotation.y = 0.03; // Curl off wall
    wearGroup.add(leftPlasterSlab);

    // Dark under-hole behind left peeling slab
    const leftUnderHole = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.75), darkHoleMat);
    leftUnderHole.position.set(-1.58, 1.95, -5.985);
    wearGroup.add(leftUnderHole);

    // Right Peeling Plaster Slab (X = 1.55, Y = 1.35)
    const rightPlasterSlab = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.72, 0.02), chippedPlasterMat);
    rightPlasterSlab.position.set(1.55, 1.35, -5.965);
    rightPlasterSlab.rotation.z = 0.08;
    rightPlasterSlab.rotation.y = -0.025; // Curl off wall
    wearGroup.add(rightPlasterSlab);

    // Dark under-hole behind right peeling slab
    const rightUnderHole = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.62), darkHoleMat);
    rightUnderHole.position.set(1.55, 1.35, -5.985);
    wearGroup.add(rightUnderHole);

    // 3. Frantic Scratch Gouge Decal beside Door Lock Area
    // A desperate survivor clawed the wall right beside the locks!
    const scratchCanvas = document.createElement('canvas');
    scratchCanvas.width = 256;
    scratchCanvas.height = 256;
    const sctx = scratchCanvas.getContext('2d')!;
    sctx.clearRect(0, 0, 256, 256);

    // Deep jagged claw marks and scraped wall plaster
    sctx.strokeStyle = '#380c0c';
    sctx.lineWidth = 3.5;
    for (let c = 0; c < 5; c++) {
      sctx.beginPath();
      const sx = 40 + c * 35;
      sctx.moveTo(sx, 20);
      sctx.bezierCurveTo(sx + 20, 80, sx - 15, 150, sx + 25, 230);
      sctx.stroke();
    }
    // Blood-stained plaster smudge
    sctx.fillStyle = 'rgba(70, 12, 12, 0.45)';
    sctx.beginPath();
    sctx.ellipse(128, 140, 75, 45, 0.3, 0, Math.PI * 2);
    sctx.fill();

    const scratchTex = new THREE.CanvasTexture(scratchCanvas);
    const scratchMat = new THREE.MeshBasicMaterial({
      map: scratchTex,
      transparent: true,
      opacity: 0.9,
    });
    const scratchMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.65), scratchMat);
    scratchMesh.position.set(-1.08, 1.5, -5.955);
    wearGroup.add(scratchMesh);

    // 4. Overhead Sagging Rusty Conduit & Detached Drooping Wires (Image 1 reference)
    const conduitMat = new THREE.MeshStandardMaterial({ color: 0x242220, metalness: 0.9, roughness: 0.35 });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x0c0c0c });

    // Steel junction box above door
    const jBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.08), conduitMat);
    jBox.position.set(-0.85, 2.95, -5.94);
    wearGroup.add(jBox);

    // Curved conduit pipe drooping over the door header
    const conduitCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.85, 2.95, -5.94),
      new THREE.Vector3(-0.3, 2.82, -5.92),
      new THREE.Vector3(0.4, 2.86, -5.92),
      new THREE.Vector3(1.15, 2.98, -5.94),
    ]);
    const conduitGeo = new THREE.TubeGeometry(conduitCurve, 16, 0.016, 8, false);
    const conduitMesh = new THREE.Mesh(conduitGeo, conduitMat);
    wearGroup.add(conduitMesh);

    // Dangling detached black wires hanging loose
    const wireCurve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.82, 2.9, -5.93),
      new THREE.Vector3(-0.80, 2.65, -5.90),
      new THREE.Vector3(-0.76, 2.38, -5.88),
    ]);
    const wire1 = new THREE.Mesh(new THREE.TubeGeometry(wireCurve1, 10, 0.005, 6, false), wireMat);
    wearGroup.add(wire1);

    const wireCurve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.38, 2.85, -5.91),
      new THREE.Vector3(0.42, 2.58, -5.89),
      new THREE.Vector3(0.40, 2.35, -5.87),
    ]);
    const wire2 = new THREE.Mesh(new THREE.TubeGeometry(wireCurve2, 10, 0.005, 6, false), wireMat);
    wearGroup.add(wire2);

    this.scene.add(wearGroup);
  }

  /**
   * Industrial Hanging Cage Luminaire in Ceiling Center
   * Faithfully references Image 1:
   * - Hanging cord and steel junction box
   * - Rusted iron protective wire cage enclosing the Edison filament
   * - Warm tungsten-amber radiance illuminating the room and casting dramatic chiaroscuro shadows
   */
  private buildCeilingIndustrialFixture() {
    const fixtureGroup = new THREE.Group();

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x221e1a,
      metalness: 0.85,
      roughness: 0.45,
    });

    // Ceiling Mount Box
    const mountBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.24), ironMat);
    mountBox.position.set(0, 3.37, 0);
    fixtureGroup.add(mountBox);

    // Hanging rusted cord
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.42, 8),
      ironMat
    );
    cord.position.set(0, 3.16, 0);
    fixtureGroup.add(cord);

    // Lamp Cap & Socket
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.1, 12), ironMat);
    socket.position.set(0, 2.92, 0);
    fixtureGroup.add(socket);

    // Rectangular/Cylindrical Rusted Wire Cage (Image 1 aesthetic)
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x3d2a1c,
      metalness: 0.9,
      roughness: 0.4,
    });

    // Top and bottom rings
    const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 6, 16), cageMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.set(0, 2.86, 0);
    fixtureGroup.add(topRing);

    const midRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 6, 16), cageMat);
    midRing.rotation.x = Math.PI / 2;
    midRing.position.set(0, 2.72, 0);
    fixtureGroup.add(midRing);

    const bottomRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 6, 16), cageMat);
    bottomRing.rotation.x = Math.PI / 2;
    bottomRing.position.set(0, 2.58, 0);
    fixtureGroup.add(bottomRing);

    // Vertical cage rib bars
    for (let r = 0; r < 8; r++) {
      const angle = (r / 8) * Math.PI * 2;
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.32, 6), cageMat);
      bar.position.set(Math.cos(angle) * 0.14, 2.72, Math.sin(angle) * 0.14);
      fixtureGroup.add(bar);
    }

    // Glowing incandescent Edison bulb inside the cage
    const bulbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff9438 })
    );
    bulbMesh.position.set(0, 2.72, 0);
    this.bulbMesh = bulbMesh;
    fixtureGroup.add(bulbMesh);

    this.scene.add(fixtureGroup);
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
   * La Puerta del Pibe (Nueva puerta en la pared Sur)
   * Referencia de layout: image_ee9950e3.png (marcada en rojo al sur)
   * - Ubicación: Pared Sur (X: 0.5, Y: 1.35, Z: 5.92, rotation.y: Math.PI)
   * - Puerta de madera maciza envejecida con arañazos siniestros y desgaste
   * - Marco pesado de madera oscura con remaches y soportes de hierro
   * - Mirilla de latón (brass peephole) a la altura de los ojos (Y = 1.6m)
   * - Picaporte pesado de hierro forjado y cerrojo macizo
   * - Foco tenue cenital o sutil resplandor carmesí siniestro
   * - Registrada como objetivo interactivo 'door_peephole'
   */
  private buildPibeDoor() {
    const pGroup = new THREE.Group();
    pGroup.position.set(0.5, 1.35, this.pibeDoorBaseZ);
    pGroup.rotation.y = Math.PI; // Face towards inside room (-Z)
    this.pibeDoorGroup = pGroup;

    // 1. Textures & Materials
    const doorTex = TextureGenerator.createDoorTexture();
    const doorMat = new THREE.MeshStandardMaterial({
      map: doorTex,
      color: 0x3a3028, // Darker, menacing aged timber
      roughness: 0.82,
      metalness: 0.12,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x221c17,
      roughness: 0.88,
      metalness: 0.2,
    });

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x1f1d1a,
      roughness: 0.45,
      metalness: 0.85,
    });

    // 2. Door Trim & Architrave Frame
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.16, 0.20), frameMat);
    topFrame.position.set(0, 1.40, 0);
    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.68, 0.20), frameMat);
    leftFrame.position.set(-0.82, 0, 0);
    const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.68, 0.20), frameMat);
    rightFrame.position.set(0.82, 0, 0);
    pGroup.add(topFrame, leftFrame, rightFrame);

    // Inner stepped trim
    const innerTop = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.04, 0.06), frameMat);
    innerTop.position.set(0, 1.30, 0.08);
    const innerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.60, 0.06), frameMat);
    innerLeft.position.set(-0.73, 0, 0.08);
    const innerRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.60, 0.06), frameMat);
    innerRight.position.set(0.73, 0, 0.08);
    pGroup.add(innerTop, innerLeft, innerRight);

    // 3. Main Door Slab
    const doorSlab = new THREE.Mesh(new THREE.BoxGeometry(1.44, 2.60, 0.10), doorMat);
    pGroup.add(doorSlab);

    // Recessed Molded Panels (Upper and Lower)
    const panelBevelMat = new THREE.MeshStandardMaterial({ color: 0x2c241e, roughness: 0.9 });
    // Upper panel molding
    const uTop = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.03, 0.02), panelBevelMat);
    uTop.position.set(0, 1.0, 0.055);
    const uBot = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.03, 0.02), panelBevelMat);
    uBot.position.set(0, 0.12, 0.055);
    const uLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.88, 0.02), panelBevelMat);
    uLeft.position.set(-0.54, 0.56, 0.055);
    const uRight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.88, 0.02), panelBevelMat);
    uRight.position.set(0.54, 0.56, 0.055);
    pGroup.add(uTop, uBot, uLeft, uRight);

    // Lower panel molding
    const lTop = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.03, 0.02), panelBevelMat);
    lTop.position.set(0, -0.14, 0.055);
    const lBot = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.03, 0.02), panelBevelMat);
    lBot.position.set(0, -1.10, 0.055);
    const lLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.96, 0.02), panelBevelMat);
    lLeft.position.set(-0.54, -0.62, 0.055);
    const lRight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.96, 0.02), panelBevelMat);
    lRight.position.set(0.54, -0.62, 0.055);
    pGroup.add(lTop, lBot, lLeft, lRight);

    // 4. Brass Peephole (Mirilla) - At eye height (Y = 1.6m world => local Y = 0.25m)
    const peepholeMat = new THREE.MeshStandardMaterial({
      color: 0xcca048,
      metalness: 0.92,
      roughness: 0.22,
      emissive: new THREE.Color(0x000000),
    });
    this.highlightMaterials.set('door_peephole', peepholeMat);

    const peepholeRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.07, 0.055, 24),
      peepholeMat
    );
    peepholeRing.rotation.x = Math.PI / 2;
    peepholeRing.position.set(0, 0.25, 0.07);
    pGroup.add(peepholeRing);

    // Dark peephole convex glass with eerie faint amber glow
    const peepholeGlass = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x050403 })
    );
    peepholeGlass.rotation.x = -Math.PI / 2;
    peepholeGlass.position.set(0, 0.25, 0.092);
    pGroup.add(peepholeGlass);

    // Invisible larger interaction hit volume for easy tapping on mobile/touch
    const peepholeHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(0.50, 0.50, 0.25),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    peepholeHitbox.position.set(0, 0.25, 0.10);
    pGroup.add(peepholeHitbox);

    // 5. Heavy Iron Lock Mechanism & Deadbolt
    const deadboltPlate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.03), ironMat);
    deadboltPlate.position.set(0.60, 0.05, 0.065);
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.18, 8), ironMat);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0.55, 0.02, 0.095);
    pGroup.add(deadboltPlate, handleBar);

    // Heavy bolted steel reinforcement straps
    [-0.52, 0.72].forEach((sy) => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(1.40, 0.08, 0.02), ironMat);
      strap.position.set(0, sy, 0.058);
      pGroup.add(strap);
    });

    // 6. Sinister Claw Scratches & Warning Decal
    const scratchCanvas = document.createElement('canvas');
    scratchCanvas.width = 256;
    scratchCanvas.height = 256;
    const sctx = scratchCanvas.getContext('2d')!;
    sctx.clearRect(0, 0, 256, 256);
    sctx.strokeStyle = '#3e0606';
    sctx.lineWidth = 3.5;
    for (let c = 0; c < 4; c++) {
      sctx.beginPath();
      const sx = 60 + c * 35;
      sctx.moveTo(sx, 15);
      sctx.bezierCurveTo(sx + 15, 75, sx - 20, 140, sx + 20, 240);
      sctx.stroke();
    }
    const scratchTex = new THREE.CanvasTexture(scratchCanvas);
    const scratchMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.55),
      new THREE.MeshBasicMaterial({ map: scratchTex, transparent: true, opacity: 0.85 })
    );
    scratchMesh.position.set(-0.35, 0.25, 0.056);
    pGroup.add(scratchMesh);

    // 7. Dedicated Subtle Horror Downlight above La Puerta del Pibe
    const pibeDoorLight = new THREE.PointLight(0xa63a24, 1.4, 5.0, 1.8);
    pibeDoorLight.position.set(0, 1.55, 0.45);
    pGroup.add(pibeDoorLight);

    this.scene.add(pGroup);

    // Register as interactive target for 'door_peephole'
    this.interactiveMeshes.set('door_peephole', pGroup);
  }

  /**
   * Retro 1950s/60s Mint-Cream Refrigerator (matching user reference image)
   * Dilapidated rounded-top refrigerator in pale mint/cream enamel with chrome latch,
   * rust streaks, freezer seam, and yellowed clue note.
   */
  private buildRottenFridge() {
    const fridgeGroup = new THREE.Group();
    // Placed in back kitchen corner flush on ground
    fridgeGroup.position.set(3.6, 0, -4.6);
    fridgeGroup.rotation.y = -Math.PI / 5;

    const fridgeTex = TextureGenerator.createRottenFridgeTexture();
    const fridgeMat = new THREE.MeshStandardMaterial({
      map: fridgeTex,
      roughness: 0.55,
      metalness: 0.22,
      emissive: new THREE.Color(0x000000),
    });
    this.highlightMaterials.set('rotten_fridge', fridgeMat);

    // 1. Main Fridge Cabinet Body (0.88m wide, 1.82m tall, 0.82m deep)
    const cabinetGeo = new THREE.BoxGeometry(0.88, 1.78, 0.80);
    const fridgeBody = new THREE.Mesh(cabinetGeo, fridgeMat);
    fridgeBody.position.y = 0.93; // Pivot at ground
    fridgeGroup.add(fridgeBody);

    // 2. Rounded Crown Top Cap (Vintage 1950s aerodynamic rounded profile)
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0xbed0bd,
      roughness: 0.5,
      metalness: 0.2,
    });
    const crownCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.40, 0.44, 0.80, 16),
      crownMat
    );
    crownCap.rotation.z = Math.PI / 2;
    crownCap.position.set(0, 1.82, 0);
    crownCap.scale.set(0.18, 1.0, 0.95);
    fridgeGroup.add(crownCap);

    // 3. Separate Door Relief with Recessed Black Gasket Seams
    // Freezer Door (upper relief)
    const freezerDoor = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.48, 0.05),
      fridgeMat
    );
    freezerDoor.position.set(0, 1.54, 0.42);
    fridgeGroup.add(freezerDoor);

    // Main Lower Fridge Door (lower relief)
    const mainDoor = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 1.18, 0.05),
      fridgeMat
    );
    mainDoor.position.set(0, 0.68, 0.42);
    fridgeGroup.add(mainDoor);

    // Black Rubber Door Gasket Seal
    const gasketMat = new THREE.MeshBasicMaterial({ color: 0x111311 });
    const gasketLine = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.02, 0.04), gasketMat);
    gasketLine.position.set(0, 1.28, 0.41);
    fridgeGroup.add(gasketLine);

    // 4. Vintage Heavy Chrome Latch Handle with Keyhole Lock
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xc8d2d6,
      metalness: 0.88,
      roughness: 0.22,
    });
    // Vertical chrome latch bracket
    const handleBracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.36, 0.04),
      chromeMat
    );
    handleBracket.position.set(-0.34, 1.12, 0.465);
    fridgeGroup.add(handleBracket);

    // Latch lever arm
    const handleLever = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.035, 0.05),
      chromeMat
    );
    handleLever.position.set(-0.28, 1.16, 0.48);
    fridgeGroup.add(handleLever);

    // Chrome Brand Emblem Plate near top
    const emblem = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.035, 0.02),
      chromeMat
    );
    emblem.position.set(0, 1.68, 0.45);
    fridgeGroup.add(emblem);

    // Heavy oxidized steel door hinges on the right side
    const hingeMat = new THREE.MeshStandardMaterial({ color: 0x3d3024, metalness: 0.8, roughness: 0.4 });
    [-0.2, 0.4, 1.0].forEach((hy) => {
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.07, 8), hingeMat);
      hinge.position.set(0.44, 0.7 + hy, 0.40);
      fridgeGroup.add(hinge);
    });

    // 5. Four Rusted Cast Iron Feet
    const footMat = new THREE.MeshStandardMaterial({ color: 0x221a14, metalness: 0.85, roughness: 0.5 });
    const footOffsets = [
      [-0.38, -0.34],
      [0.38, -0.34],
      [-0.38, 0.34],
      [0.38, 0.34],
    ];
    footOffsets.forEach(([fx, fz]) => {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.07, 8), footMat);
      foot.position.set(fx, 0.035, fz);
      fridgeGroup.add(foot);
    });

    // 6. Ground Contact Shadow Plane
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x060606,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.1), shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, 0.008, 0.05);
    fridgeGroup.add(contactShadow);

    // Rotten food puddle beneath fridge
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x1b2413,
      roughness: 0.2,
      metalness: 0.1,
    });
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.68, 16), puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(0, 0.012, 0.42);
    fridgeGroup.add(puddle);

    this.scene.add(fridgeGroup);
    this.interactiveMeshes.set('rotten_fridge', fridgeGroup);
  }

  /**
   * Hero Rustic Dining Table & Chairs Set (matching user reference image)
   * Dark weathered timber dining table with turned legs, tableware, vintage radio,
   * the "Diario del Investigador" puzzle notes, and vintage chairs around it.
   */
  private buildStudyDesk() {
    const tableGroup = new THREE.Group();
    // Positioned in room dining area matching reference photo
    tableGroup.position.set(-2.8, 0, -1.2);
    tableGroup.rotation.y = 0.08;

    const tableTex = TextureGenerator.createRusticDiningTableTexture();
    const woodMat = new THREE.MeshStandardMaterial({
      map: tableTex,
      roughness: 0.82,
      metalness: 0.08,
    });

    // 1. Rustic Weathered Tabletop (1.90m long, 1.05m wide, 0.07m thick)
    const tabletop = new THREE.Mesh(new THREE.BoxGeometry(1.90, 0.07, 1.05), woodMat);
    tabletop.position.set(0, 0.76, 0);
    tableGroup.add(tabletop);

    // 2. Under-Table Structural Apron Fascia with Beveled Trim
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x22170f, roughness: 0.88 });
    const apronLong1 = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.09, 0.03), apronMat);
    apronLong1.position.set(0, 0.70, 0.44);
    const apronLong2 = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.09, 0.03), apronMat);
    apronLong2.position.set(0, 0.70, -0.44);
    const apronShort1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.85), apronMat);
    apronShort1.position.set(0.84, 0.70, 0);
    const apronShort2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.85), apronMat);
    apronShort2.position.set(-0.84, 0.70, 0);
    tableGroup.add(apronLong1, apronLong2, apronShort1, apronShort2);

    // 3. Four Turned Rustic Wooden Legs with Tapered Feet
    const legGeo = new THREE.CylinderGeometry(0.038, 0.026, 0.73, 10);
    const ferruleGeo = new THREE.CylinderGeometry(0.028, 0.026, 0.06, 8);
    const ferruleMat = new THREE.MeshStandardMaterial({ color: 0x6e5a36, metalness: 0.8, roughness: 0.35 });

    const legOffsets = [
      [-0.82, 0.365, -0.42],
      [0.82, 0.365, -0.42],
      [-0.82, 0.365, 0.42],
      [0.82, 0.365, 0.42],
    ];

    legOffsets.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, apronMat);
      leg.position.set(lx, ly, lz);
      const ferrule = new THREE.Mesh(ferruleGeo, ferruleMat);
      ferrule.position.set(lx, 0.03, lz);
      tableGroup.add(leg, ferrule);
    });

    // 4. Contact Shadow beneath Dining Table
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x080808,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    const tableShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.4), shadowMat);
    tableShadow.rotation.x = -Math.PI / 2;
    tableShadow.position.set(0, 0.005, 0);
    tableGroup.add(tableShadow);

    // 5. "Diario del Investigador" Clue Note Sheet (Interactive Target)
    const noteMat = new THREE.MeshStandardMaterial({
      color: 0xa89f88,
      roughness: 0.9,
      emissive: new THREE.Color(0x000000),
    });
    this.highlightMaterials.set('study_desk', noteMat);

    const noteSheet = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.50), noteMat);
    noteSheet.position.set(-0.35, 0.805, 0.12);
    noteSheet.rotation.y = 0.22;
    tableGroup.add(noteSheet);

    // Blood stains on the note sheet
    const bloodNoteDecal = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.18),
      new THREE.MeshBasicMaterial({ color: 0x6e0e0e, transparent: true, opacity: 0.7 })
    );
    bloodNoteDecal.rotation.x = -Math.PI / 2;
    bloodNoteDecal.position.set(-0.33, 0.814, 0.12);
    tableGroup.add(bloodNoteDecal);

    // 6. Vintage 1970s Wood-Cased AM Radio Receiver
    const radioMat = new THREE.MeshStandardMaterial({ color: 0x3d2719, roughness: 0.65 });
    const radioMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.20, 0.16), radioMat);
    radioMesh.position.set(0.52, 0.90, -0.22);
    radioMesh.rotation.y = -0.25;
    tableGroup.add(radioMesh);

    // Radio speaker grill
    const grillMat = new THREE.MeshStandardMaterial({ color: 0x8a7e6d, roughness: 0.85 });
    const grill = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.14), grillMat);
    grill.position.set(0.46, 0.90, -0.138);
    grill.rotation.y = -0.25;
    tableGroup.add(grill);

    // Radio antenna
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.9, roughness: 0.2 });
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.45, 6), antennaMat);
    antenna.position.set(0.66, 1.15, -0.26);
    antenna.rotation.z = -0.2;
    tableGroup.add(antenna);

    // 7. Ceramic Tableware & Kitchen Props (matching reference photo)
    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xd9d3c5, roughness: 0.4, metalness: 0.05 });
    // Large mixing/soup bowl in center
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.10, 16), ceramicMat);
    bowl.position.set(0.05, 0.84, -0.05);
    tableGroup.add(bowl);

    // Spoon in bowl
    const spoonMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 });
    const spoon = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.20, 6), spoonMat);
    spoon.rotation.z = Math.PI / 4;
    spoon.position.set(0.08, 0.88, -0.05);
    tableGroup.add(spoon);

    // Dirty ceramic plate with bread crumbs
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.10, 0.02, 16), ceramicMat);
    plate.position.set(-0.25, 0.805, -0.28);
    tableGroup.add(plate);

    // Ceramic coffee pot / pitcher
    const pitcher = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.24, 14), ceramicMat);
    pitcher.position.set(0.24, 0.91, 0.26);
    tableGroup.add(pitcher);

    // Fork and knife on table
    const knife = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.004, 0.18), spoonMat);
    knife.position.set(-0.08, 0.80, -0.28);
    tableGroup.add(knife);

    // 8. Four Vintage Dining Chairs around the Table (matching reference photo)
    const chairWoodMat = new THREE.MeshStandardMaterial({ color: 0x281c15, roughness: 0.85 });
    const chairLegMat = new THREE.MeshStandardMaterial({ color: 0x36281e, metalness: 0.3, roughness: 0.7 });

    // Helper to build a vintage dining chair
    const buildVintageChair = (x: number, z: number, rotY: number, tiltX: number = 0, tiltZ: number = 0) => {
      const chair = new THREE.Group();
      chair.position.set(x, 0, z);
      chair.rotation.y = rotY;
      chair.rotation.x = tiltX;
      chair.rotation.z = tiltZ;

      // Wooden seat with rounded corners
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.44), chairWoodMat);
      seat.position.y = 0.46;
      chair.add(seat);

      // 4 Chair legs with slight splay
      const cLegOffsets = [
        [-0.18, 0.23, -0.18],
        [0.18, 0.23, -0.18],
        [-0.18, 0.23, 0.18],
        [0.18, 0.23, 0.18],
      ];
      cLegOffsets.forEach(([clx, cly, clz]) => {
        const cLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.46, 8), chairLegMat);
        cLeg.position.set(clx, cly, clz);
        chair.add(cLeg);
      });

      // Curved wooden backrest posts & top rail
      const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.48, 8), chairWoodMat);
      post1.position.set(-0.18, 0.70, -0.18);
      const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.48, 8), chairWoodMat);
      post2.position.set(0.18, 0.70, -0.18);

      const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.08, 0.025), chairWoodMat);
      topRail.position.set(0, 0.92, -0.18);

      // 3 Spindles
      for (let s = -1; s <= 1; s++) {
        const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.40, 6), chairWoodMat);
        spindle.position.set(s * 0.09, 0.68, -0.18);
        chair.add(spindle);
      }

      chair.add(post1, post2, topRail);

      // Chair shadow
      const chairShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), shadowMat);
      chairShadow.rotation.x = -Math.PI / 2;
      chairShadow.position.set(0, 0.004, 0);
      chair.add(chairShadow);

      return chair;
    };

    // Chair 1: Near left, angled slightly toward player
    const chair1 = buildVintageChair(-0.45, 0.82, Math.PI + 0.15);
    tableGroup.add(chair1);

    // Chair 2: Near right, angled
    const chair2 = buildVintageChair(0.50, 0.85, Math.PI - 0.2);
    tableGroup.add(chair2);

    // Chair 3: Far side, facing table
    const chair3 = buildVintageChair(0.35, -0.80, 0.08);
    tableGroup.add(chair3);

    // Chair 4: Far left corner, slightly tilted/askew as seen in the eerie reference photo
    const chair4 = buildVintageChair(-0.95, -0.25, -Math.PI / 2 + 0.35, 0.08, -0.06);
    tableGroup.add(chair4);

    this.scene.add(tableGroup);
    this.interactiveMeshes.set('study_desk', tableGroup);
  }

  /**
   * Kitchen Credenza / Counter Cabinet & Retro Appliance (matching reference photo)
   * Positioned along the North wall under the window:
   * - Weathered cream cabinet with 3 drawers and open bottom shelf
   * - Props on lower shelf: trash bag & cardboard carton
   * - On top: Vintage 1970s microwave/toaster oven unit with dials & dark glass door
   */
  private buildKitchenCredenza() {
    const credenzaGroup = new THREE.Group();
    // Placed on North wall between the main door and the fridge
    credenzaGroup.position.set(1.65, 0, -5.55);

    const credenzaTex = TextureGenerator.createKitchenCredenzaTexture();
    const credenzaMat = new THREE.MeshStandardMaterial({
      map: credenzaTex,
      roughness: 0.78,
      metalness: 0.1,
    });

    // 1. Main Credenza Body (1.70m wide, 0.86m tall, 0.58m deep)
    const cabinetBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.70, 0.86, 0.58),
      credenzaMat
    );
    cabinetBody.position.set(0, 0.43, 0);
    credenzaGroup.add(cabinetBody);

    // Countertop ledge
    const topCounterMat = new THREE.MeshStandardMaterial({ color: 0x3d3224, roughness: 0.7 });
    const topCounter = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.05, 0.62), topCounterMat);
    topCounter.position.set(0, 0.88, 0);
    credenzaGroup.add(topCounter);

    // 2. Open lower shelf recess on the right side
    const openShelfMat = new THREE.MeshStandardMaterial({ color: 0x181410, roughness: 0.95 });
    const openRecess = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.42, 0.54), openShelfMat);
    openRecess.position.set(0.44, 0.28, 0.04);
    credenzaGroup.add(openRecess);

    // Clutter inside open shelf: Crumpled black trash bag & cardboard box
    const trashMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.35, metalness: 0.1 });
    const trashBag = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 1), trashMat);
    trashBag.position.set(0.38, 0.22, 0.08);
    trashBag.scale.set(1.2, 0.8, 1.0);
    credenzaGroup.add(trashBag);

    const boxMat = new THREE.MeshStandardMaterial({ color: 0x6e563a, roughness: 0.9 });
    const cardBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.26), boxMat);
    cardBox.position.set(0.64, 0.22, 0.05);
    cardBox.rotation.y = 0.2;
    credenzaGroup.add(cardBox);

    // 3. Vintage 1970s Countertop Microwave / Appliance on top of credenza
    const microTex = TextureGenerator.createRetroMicrowaveTexture();
    const microMat = new THREE.MeshStandardMaterial({
      map: microTex,
      roughness: 0.45,
      metalness: 0.35,
    });
    const microwave = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.38), microMat);
    microwave.position.set(-0.35, 1.10, 0.02);
    credenzaGroup.add(microwave);

    // Dirty condiment jars on credenza
    const jarMat = new THREE.MeshStandardMaterial({ color: 0x3d4a36, roughness: 0.25, metalness: 0.1 });
    const jar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 12), jarMat);
    jar1.position.set(0.22, 0.99, -0.10);
    const jar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 12), jarMat);
    jar2.position.set(0.35, 0.97, -0.06);
    credenzaGroup.add(jar1, jar2);

    // Stained vintage kettle
    const kettleMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4f, metalness: 0.85, roughness: 0.3 });
    const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.18, 14), kettleMat);
    kettle.position.set(0.55, 1.0, 0.05);
    credenzaGroup.add(kettle);

    // Contact shadow
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x060606,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.8), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.005, 0);
    credenzaGroup.add(shadow);

    this.scene.add(credenzaGroup);
  }

  /**
   * Rolling Two-Tier Metal Utility Service Cart / Trolley (matching reference photo)
   * Positioned in the foreground/midground right area:
   * - Curved tubular steel frame
   * - Galvanized upper and lower shelves with raised rims
   * - 4 swivel caster wheels
   */
  private buildUtilityCart() {
    const cartGroup = new THREE.Group();
    // Placed in midground matching reference photo
    cartGroup.position.set(2.2, 0, -2.4);
    cartGroup.rotation.y = 0.32;

    const cartTex = TextureGenerator.createUtilityCartTexture();
    const steelMat = new THREE.MeshStandardMaterial({
      map: cartTex,
      metalness: 0.75,
      roughness: 0.38,
    });

    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x6e757a,
      metalness: 0.85,
      roughness: 0.3,
    });

    // 1. Two Galvanized Metal Shelves (0.80m x 0.52m)
    const shelfGeo = new THREE.BoxGeometry(0.80, 0.035, 0.52);
    const bottomShelf = new THREE.Mesh(shelfGeo, steelMat);
    bottomShelf.position.set(0, 0.22, 0);
    const topShelf = new THREE.Mesh(shelfGeo, steelMat);
    topShelf.position.set(0, 0.68, 0);
    cartGroup.add(bottomShelf, topShelf);

    // Raised safety lip rim around top shelf
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x485054, metalness: 0.8, roughness: 0.4 });
    const rimX1 = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.04, 0.02), rimMat);
    rimX1.position.set(0, 0.71, 0.25);
    const rimX2 = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.04, 0.02), rimMat);
    rimX2.position.set(0, 0.71, -0.25);
    const rimZ1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.52), rimMat);
    rimZ1.position.set(0.39, 0.71, 0);
    const rimZ2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.52), rimMat);
    rimZ2.position.set(-0.39, 0.71, 0);
    cartGroup.add(rimX1, rimX2, rimZ1, rimZ2);

    // 2. Tubular Frame Posts & Handles on left/right ends
    const postGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.78, 8);
    const postOffsets = [
      [-0.38, 0.42, -0.24],
      [0.38, 0.42, -0.24],
      [-0.38, 0.42, 0.24],
      [0.38, 0.42, 0.24],
    ];
    postOffsets.forEach(([px, py, pz]) => {
      const post = new THREE.Mesh(postGeo, tubeMat);
      post.position.set(px, py, pz);
      cartGroup.add(post);
    });

    // Curved handle bars on both ends
    const handleCurve = new THREE.CylinderGeometry(0.016, 0.016, 0.48, 8);
    const handleL = new THREE.Mesh(handleCurve, tubeMat);
    handleL.rotation.x = Math.PI / 2;
    handleL.position.set(-0.38, 0.81, 0);
    const handleR = new THREE.Mesh(handleCurve, tubeMat);
    handleR.rotation.x = Math.PI / 2;
    handleR.position.set(0.38, 0.81, 0);
    cartGroup.add(handleL, handleR);

    // 3. Four Swivel Caster Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.6 });
    postOffsets.forEach(([px, , pz]) => {
      const wheelFork = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.03), tubeMat);
      wheelFork.position.set(px, 0.06, pz);
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 10), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(px, 0.03, pz);
      cartGroup.add(wheelFork, wheel);
    });

    // Empty rusted tin can on cart
    const tinMat = new THREE.MeshStandardMaterial({ color: 0x5a483a, metalness: 0.8, roughness: 0.4 });
    const tinCan = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 12), tinMat);
    tinCan.position.set(0.12, 0.76, 0.05);
    cartGroup.add(tinCan);

    // Contact shadow
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x060606,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.65), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.005, 0);
    cartGroup.add(shadow);

    this.scene.add(cartGroup);
  }

  /**
   * Wall Window with Venetian Blinds (matching reference photo)
   * Dilapidated window frame and blinds above the credenza.
   */
  private buildAtmosphericWindowAndLightBeams() {
    const windowGroup = new THREE.Group();
    // Placed on North wall above the credenza
    windowGroup.position.set(0.8, 2.15, -5.96);

    // 1. Weathered Wooden Window Casement Frame (1.65m wide, 1.45m high)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3d3024, roughness: 0.85 });
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.08, 0.10), frameMat);
    topFrame.position.set(0, 0.72, 0);
    const bottomSill = new THREE.Mesh(new THREE.BoxGeometry(1.80, 0.08, 0.14), frameMat);
    bottomSill.position.set(0, -0.72, 0.02);
    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.45, 0.10), frameMat);
    leftFrame.position.set(-0.82, 0, 0);
    const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.45, 0.10), frameMat);
    rightFrame.position.set(0.82, 0, 0);
    const midDivider = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.45, 0.08), frameMat);
    midDivider.position.set(0, 0, 0);
    windowGroup.add(topFrame, bottomSill, leftFrame, rightFrame, midDivider);

    // 2. Venetian Blinds with Broken/Crooked Slats
    const blindsTex = TextureGenerator.createVenetianBlindsTexture();
    const blindsMat = new THREE.MeshStandardMaterial({
      map: blindsTex,
      roughness: 0.8,
      metalness: 0.1,
    });
    const blindsMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 1.36), blindsMat);
    blindsMesh.position.set(0, 0, 0.02);
    windowGroup.add(blindsMesh);

    this.scene.add(windowGroup);
  }

  /**
   * Antique 4-Blade Ceiling Fan (matching user reference image)
   * Dilapidated dark wood ceiling fan over the dining table area
   */
  private buildCeilingFan() {
    const fanGroup = new THREE.Group();
    fanGroup.position.set(-2.2, 3.25, -1.2);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f1d1a, metalness: 0.85, roughness: 0.4 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x2e2016, roughness: 0.85 });

    // Ceiling mount canopy & drop rod
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 12), metalMat);
    canopy.position.set(0, 0.12, 0);
    const dropRod = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.32, 8), metalMat);
    dropRod.position.set(0, -0.05, 0);
    fanGroup.add(canopy, dropRod);

    // Central motor housing
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.14, 16), metalMat);
    motor.position.set(0, -0.22, 0);
    fanGroup.add(motor);

    // 4 Wooden Fan Blades angled slightly
    for (let b = 0; b < 4; b++) {
      const angle = (b * Math.PI) / 2;
      const bladeArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.018, 0.03), metalMat);
      bladeArm.position.set(Math.cos(angle) * 0.20, -0.22, Math.sin(angle) * 0.20);
      bladeArm.rotation.y = -angle;

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.012, 0.14), bladeMat);
      blade.position.set(Math.cos(angle) * 0.55, -0.22, Math.sin(angle) * 0.55);
      blade.rotation.y = -angle;
      blade.rotation.x = 0.12; // Aerodynamic pitch angle

      fanGroup.add(bladeArm, blade);
    }

    // Pull-chain cord dangling down with small brass bead
    const cordMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.55, 6), cordMat);
    cord.position.set(0.06, -0.52, 0);
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xb5923b, metalness: 0.85, roughness: 0.3 })
    );
    bead.position.set(0.06, -0.80, 0);
    fanGroup.add(cord, bead);

    this.scene.add(fanGroup);
  }

  /**
   * Electrical Fuse Box (Panel Eléctrico 220V)
   * RELOCATED: Now mounted on the opposite wall (West Wall, where the calendar was)
   * as requested by the user: "el lugar de estar en la pared de la puerta del baño,
   * quiero que esté en la puerta contraria (donde ahora esta el calendario)"
   * Exact position: X = -4.9, Y = 1.6, Z = -3.2, rotation.y = Math.PI / 2
   */
  private buildElectricalFuseBox() {
    const fuseBoxGroup = new THREE.Group();
    // Relocated to West Wall at Z = -3.2 (flush against X = -5.0)
    fuseBoxGroup.position.set(-4.9, 1.6, -3.2);
    fuseBoxGroup.rotation.y = Math.PI / 2;

    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x2c2e33,
      metalness: 0.8,
      roughness: 0.4,
      emissive: new THREE.Color(0x000000),
    });
    this.highlightMaterials.set('fuse_box', boxMat);

    // Burned Wall Backplate behind the fuse box
    const backplateMat = new THREE.MeshStandardMaterial({
      color: 0x181512,
      roughness: 0.95,
      metalness: 0.1,
    });
    const backplate = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.68), backplateMat);
    backplate.position.set(0, 0, -0.052);
    fuseBoxGroup.add(backplate);

    // Box casing - Exactly sized to the interactable object (0.34m x 0.46m x 0.10m)
    const casing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.46, 0.10), boxMat);
    casing.name = 'fuse_box_casing';
    fuseBoxGroup.add(casing);

    // Hazard lightning sign
    const yellowStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.14, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xd4a017 })
    );
    yellowStripe.position.set(0, 0.08, 0.052);
    fuseBoxGroup.add(yellowStripe);

    // 3 Fuse Lever slots
    for (let i = 0; i < 3; i++) {
      const lever = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.06, 8),
        new THREE.MeshStandardMaterial({ color: 0xc43d2b })
      );
      lever.position.set(-0.08 + i * 0.08, -0.10, 0.055);
      fuseBoxGroup.add(lever);
    }

    // Industrial metallic electrical conduit pipe running up to the ceiling
    const conduitMat = new THREE.MeshStandardMaterial({ color: 0x3d3832, metalness: 0.85, roughness: 0.4 });
    const conduitPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.7, 8), conduitMat);
    conduitPipe.position.set(0, 1.08, 0);
    fuseBoxGroup.add(conduitPipe);

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
    const brokenTileBump = TextureGenerator.createBrokenTileBumpTexture();
    const brokenTileMat = new THREE.MeshStandardMaterial({
      map: subtleBrokenTex,
      bumpMap: brokenTileBump,
      bumpScale: 0.05,
      roughness: 0.45,
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

    // 8. Stained Mirror on North Wall
    const mirrorMat = new THREE.MeshStandardMaterial({
      color: 0x6e7674,
      metalness: 0.9,
      roughness: 0.25,
    });
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.9), mirrorMat);
    mirror.position.set(8.5, 1.6, -1.96);
    this.scene.add(mirror);

    // 9. Silent Hill Sink ("silent_hill_sink.glb") on North Wall (X: 8.5, Y: -0.15, Z: -1.60)
    // Primary sound emitter for the weeping baby audio ("llanto.wav")
    const sinkGroup = new THREE.Group();
    sinkGroup.position.set(8.5, -0.15, -1.60);
    this.sinkGroup = sinkGroup;

    // Contact shadow beneath the sink (adjusted for 25% larger footprint)
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x060606,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const sinkShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.95), shadowMat);
    sinkShadow.rotation.x = -Math.PI / 2;
    sinkShadow.position.set(0, 0.005, 0.18);
    sinkGroup.add(sinkShadow);

    // Load authentic Silent Hill Sink GLB model from /public/models/
    // The GLB uses KHR_materials_pbrSpecularGlossiness, so we explicitly attach
    // the diffuse texture map (extracted as /models/silent_hill_sink_diffuse.png)
    const texLoader = new THREE.TextureLoader();
    const sinkDiffuseMap = texLoader.load('/models/silent_hill_sink_diffuse.png');
    sinkDiffuseMap.colorSpace = THREE.SRGBColorSpace;
    sinkDiffuseMap.flipY = false;

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/silent_hill_sink.glb',
      (gltf) => {
        const sinkModel = gltf.scene;
        // Enlarged by 25% as requested by the user
        sinkModel.scale.set(1.25, 1.25, 1.25);
        sinkModel.position.set(0, 0, 0);

        sinkModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.castShadow = true;
            m.receiveShadow = true;

            // Apply diffuse texture to preserve stains, blood, grime, and metallic details
            if (m.material) {
              const mat = m.material as THREE.MeshStandardMaterial;
              mat.map = sinkDiffuseMap;
              mat.color.setHex(0xffffff);
              mat.roughness = 0.65;
              mat.metalness = 0.15;
              mat.needsUpdate = true;
            } else {
              m.material = new THREE.MeshStandardMaterial({
                map: sinkDiffuseMap,
                roughness: 0.65,
                metalness: 0.15,
              });
            }
          }
        });

        sinkGroup.add(sinkModel);
      },
      undefined,
      (err) => {
        console.warn('Could not load silent_hill_sink.glb, fallback active:', err);
        const fallbackMat = new THREE.MeshStandardMaterial({
          map: sinkDiffuseMap,
          color: 0x8a8479,
          roughness: 0.6,
        });
        const fbBasin = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.95, 0.65), fallbackMat);
        fbBasin.position.set(0, 0.45, 0.18);
        sinkGroup.add(fbBasin);
      }
    );

    // Load authentic Fetus model ("feto.glb") nestled inside the sink basin
    gltfLoader.load(
      '/models/feto.glb',
      (fetoGltf) => {
        const fetoModel = fetoGltf.scene;
        // Proportionate fetus scale curled inside the sink basin
        fetoModel.scale.set(0.18, 0.18, 0.18);
        // Positioned inside the basin depression (local to sinkGroup)
        fetoModel.position.set(0, 0.90, 0);
        // Tilted slightly up and back toward player looking into basin
        fetoModel.rotation.set(-0.65, 0.25, -0.55);

        fetoModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.castShadow = true;
            m.receiveShadow = true;
            if (m.material) {
              const mat = m.material as THREE.MeshStandardMaterial;
              if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
              mat.roughness = 0.55;
              mat.metalness = 0.1;
            }
          }
        });

        this.fetoModel = fetoModel;
        sinkGroup.add(fetoModel);
      },
      undefined,
      (err) => {
        console.warn('Could not load feto.glb:', err);
      }
    );

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
      porcelainMat
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

    // 12. Broken Wall Tile (Azulejo Roto del Baño)
    // Placed above the bathtub rim on the East tiled wall at (11.38, 0.76, 0.35)
    // Authentically visible by its own physical appearance (deep cracks, chipped edge, dark wall cavity,
    // and slight 3D looseness) without any artificial red square or glaring markers!
    const tilePuzzleGroup = new THREE.Group();
    tilePuzzleGroup.position.set(11.38, 0.76, 0.35);

    this.highlightMaterials.set('broken_tile', brokenTileMat);

    // Dark cavity/mortar recess behind the loosened tile
    const recessMat = new THREE.MeshStandardMaterial({
      color: 0x120f0d,
      roughness: 0.95,
      metalness: 0.05,
    });
    const recessMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), recessMat);
    recessMesh.rotation.y = -Math.PI / 2;
    recessMesh.position.x = 0.003;
    tilePuzzleGroup.add(recessMesh);

    // Broken porcelain tile - slightly loose and jutting out 1cm at one corner
    const tileMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), brokenTileMat);
    tileMesh.rotation.y = -Math.PI / 2;
    tileMesh.rotation.z = 0.035; // Slight realistic slant of loosened tile
    tileMesh.rotation.x = -0.025; // Corner pops out towards the bathroom
    tileMesh.position.x = -0.008; // Slightly forward from wall
    tilePuzzleGroup.add(tileMesh);

    // Touch hit target (0.55m x 0.55m) for comfortable touchscreen tapping
    const hitTarget = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.55),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitTarget.rotation.y = -Math.PI / 2;
    tilePuzzleGroup.add(hitTarget);

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
   * Build Third Room: Decrepit Horror Bedroom (Habitación Tétrica)
   * Connected through the West wall doorway.
   * Conforms strictly to user's layout plan (Image 1) and visual aesthetic (Image 2):
   * 1. Cama (Bed): In South-West corner along West wall, distressed vintage wrought-iron frame, stained mattress, pillow at foot/south.
   * 2. Televisión de tubo (CRT TV): Vintage bulky CRT television with flickering static screen and blue-green phosphor glow, placed on left of cajonera.
   * 3. Mueble cajonero (Chest of drawers / Dresser): Heavy weathered dark wood dresser with 6 pull drawers and ornate handles along North wall.
   * 4. Mesita de luz (Nightstand): Weathered bedside table with drawer and decrepit brass lamp, beside the bed along South wall.
   * 5. Hombre colgado del cuello desde el techo (Hanging Man): Suspended from ceiling rafter hook by a hemp noose in South-East area near doorway, with realistic clothes, dangling limp posture, kicked-over stool, and eerie micro-sway pendulum animation.
   * Also includes:
   * - Mottled grimy tan/ochre peeling wallpaper with water dripping from ceiling (Image 2).
   * - Weathered dark wooden floor with stained area rug and scattered papers/photos (Image 2).
   * - 4 dark framed pictures on the North wall (Image 2).
   * - Doorway opening with dark timber frame leading from main room.
   */
  private buildBedroom() {
    const bedroomGroup = new THREE.Group();
    this.bedroomGroup = bedroomGroup;

    // 1. Textures & Materials
    const bedroomWallTex = TextureGenerator.createHorrorBedroomWallTexture();
    const bedroomWallMat = new THREE.MeshStandardMaterial({
      map: bedroomWallTex.map,
      bumpMap: bedroomWallTex.bump,
      bumpScale: 0.055,
      roughness: 0.88,
      metalness: 0.06,
    });

    const woodPlankTex = TextureGenerator.createWoodFloorTexture();
    const bedroomFloorMat = new THREE.MeshStandardMaterial({
      map: woodPlankTex,
      bumpMap: woodPlankTex,
      bumpScale: 0.045,
      roughness: 0.78,
      metalness: 0.05,
    });

    const bedroomTexLoader = new THREE.TextureLoader();
    bedroomTexLoader.load(
      '/assets/aistudio/textura_madera6_4d492d66.jpg',
      (loadedBedFloor) => {
        loadedBedFloor.wrapS = THREE.RepeatWrapping;
        loadedBedFloor.wrapT = THREE.RepeatWrapping;
        loadedBedFloor.repeat.set(1.92, 2.4); // Matching physical floorboard width & length
        loadedBedFloor.colorSpace = THREE.SRGBColorSpace;
        bedroomFloorMat.map = loadedBedFloor;
        bedroomFloorMat.bumpMap = loadedBedFloor;
        bedroomFloorMat.bumpScale = 0.055;
        bedroomFloorMat.roughness = 0.76;
        bedroomFloorMat.metalness = 0.04;
        bedroomFloorMat.needsUpdate = true;
      },
      undefined,
      () => {
        bedroomTexLoader.load('/imgs/textura_madera6.jpg', (fallbackBed) => {
          fallbackBed.wrapS = THREE.RepeatWrapping;
          fallbackBed.wrapT = THREE.RepeatWrapping;
          fallbackBed.repeat.set(1.92, 2.4);
          fallbackBed.colorSpace = THREE.SRGBColorSpace;
          bedroomFloorMat.map = fallbackBed;
          bedroomFloorMat.bumpMap = fallbackBed;
          bedroomFloorMat.bumpScale = 0.055;
          bedroomFloorMat.needsUpdate = true;
        });
      }
    );

    const darkWoodMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createDarkWoodFurnitureTexture(),
      roughness: 0.72,
      metalness: 0.12,
    });

    const ironFrameMat = new THREE.MeshStandardMaterial({
      color: 0x221d18,
      metalness: 0.82,
      roughness: 0.45,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0x9a7b3b,
      metalness: 0.88,
      roughness: 0.32,
    });

    // 2. Room Architecture (X: -11.4 to -5.0, Z: -1.2 to 6.0, Y: 0 to 3.4)
    // Floor (Y = 0.005)
    const floorGeo = new THREE.PlaneGeometry(6.4, 7.2);
    const floor = new THREE.Mesh(floorGeo, bedroomFloorMat);
    floor.position.set(-8.2, 0.005, 2.4);
    floor.rotation.x = -Math.PI / 2;
    bedroomGroup.add(floor);

    // Area Rug (Matching Image 2 vintage patterned carpet)
    const rugTex = TextureGenerator.createBedroomRugTexture();
    const rugMat = new THREE.MeshStandardMaterial({
      map: rugTex,
      roughness: 0.92,
      metalness: 0.02,
    });
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.2), rugMat);
    rug.position.set(-8.1, 0.012, 2.5);
    rug.rotation.x = -Math.PI / 2;
    bedroomGroup.add(rug);

    // Ceiling (Y = 3.395)
    const ceilGeo = new THREE.PlaneGeometry(6.4, 7.2);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x161514, roughness: 0.95 });
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.position.set(-8.2, 3.395, 2.4);
    ceil.rotation.x = Math.PI / 2;
    bedroomGroup.add(ceil);

    // North Wall (Z = -1.2, length 6.4m, facing South into bedroom)
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.4), bedroomWallMat);
    northWall.position.set(-8.2, 1.7, -1.2);
    bedroomGroup.add(northWall);

    // South Wall (Z = 6.0, length 6.4m, facing North into bedroom)
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.4), bedroomWallMat);
    southWall.position.set(-8.2, 1.7, 6.0);
    southWall.rotation.y = Math.PI;
    bedroomGroup.add(southWall);

    // West Wall (X = -11.4, length 7.2m, facing East into bedroom)
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.4), bedroomWallMat);
    westWall.position.set(-11.4, 1.7, 2.4);
    westWall.rotation.y = Math.PI / 2;
    bedroomGroup.add(westWall);

    // East Partition Walls (X = -5.0, framing doorway from inside bedroom):
    // 1. North Segment (Z: -1.2 to 0.9, length 2.1m, center Z = -0.15)
    const eastNorth = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.4), bedroomWallMat);
    eastNorth.position.set(-5.0, 1.7, -0.15);
    eastNorth.rotation.y = -Math.PI / 2;
    bedroomGroup.add(eastNorth);

    // 2. Doorway Header (Z: 0.9 to 2.7, length 1.8m, height 1.2m, Y: 2.2 to 3.4)
    const eastHeader = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), bedroomWallMat);
    eastHeader.position.set(-5.0, 2.8, 1.8);
    eastHeader.rotation.y = -Math.PI / 2;
    bedroomGroup.add(eastHeader);

    // 3. South Segment (Z: 2.7 to 6.0, length 3.3m, center Z = 4.35)
    const eastSouth = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 3.4), bedroomWallMat);
    eastSouth.position.set(-5.0, 1.7, 4.35);
    eastSouth.rotation.y = -Math.PI / 2;
    bedroomGroup.add(eastSouth);

    // Doorway Frame Trim (at X = -5.0, Z = 1.8)
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x1f1914, roughness: 0.9 });
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 1.96), doorFrameMat);
    topBeam.position.set(-5.0, 2.22, 1.8);
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.22, 0.14), doorFrameMat);
    leftPost.position.set(-5.0, 1.11, 0.9);
    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.22, 0.14), doorFrameMat);
    rightPost.position.set(-5.0, 1.11, 2.7);
    bedroomGroup.add(topBeam, leftPost, rightPost);

    // Old distressed wooden door standing ajar (swung into the bedroom towards negative X)
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-5.0, 0, 0.92);
    doorPivot.rotation.y = -1.18; // Swung open into bedroom towards negative X
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 2.14, 0.88),
      new THREE.MeshStandardMaterial({ color: 0x2e241c, roughness: 0.85 })
    );
    doorPanel.position.set(0, 1.07, 0.44);

    // Brass door handle & escutcheon plate
    const brassHandleMat = new THREE.MeshStandardMaterial({ color: 0x9a7b3b, metalness: 0.85, roughness: 0.3 });
    const handlePlate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), brassHandleMat);
    handlePlate.position.set(0, 1.05, 0.78);
    const handleLever = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), brassHandleMat);
    handleLever.rotation.z = Math.PI / 2;
    handleLever.position.set(0.05, 1.08, 0.78);
    doorPivot.add(doorPanel, handlePlate, handleLever);
    bedroomGroup.add(doorPivot);

    // 3. ASSET: MUEBLE CAJONERO (Dresser / Chest of Drawers) along North Wall
    // Center at X = -8.7, Y = 0, Z = -0.7
    const dresserGroup = new THREE.Group();
    dresserGroup.position.set(-8.7, 0, -0.7);

    // Main dresser wooden cabinet (2.6m wide, 1.12m tall, 0.70m deep)
    const dresserBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.10, 0.70),
      darkWoodMat
    );
    dresserBody.position.y = 0.58;
    dresserGroup.add(dresserBody);

    // Beveled Top Counter Slab
    const dresserTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.68, 0.06, 0.76),
      darkWoodMat
    );
    dresserTop.position.y = 1.15;
    dresserGroup.add(dresserTop);

    // Base Plinth & 4 Heavy Bracket Feet
    [-1.24, 1.24].forEach((fx) => {
      [-0.30, 0.30].forEach((fz) => {
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), darkWoodMat);
        foot.position.set(fx, 0.03, fz);
        dresserGroup.add(foot);
      });
    });

    // 6 Molded Drawer Fronts (2 rows of 3 columns)
    const drawerCols = [-0.82, 0, 0.82];
    const drawerRows = [0.82, 0.36];
    drawerRows.forEach((dy) => {
      drawerCols.forEach((dx) => {
        const drawer = new THREE.Mesh(
          new THREE.BoxGeometry(0.76, 0.38, 0.03),
          darkWoodMat
        );
        drawer.position.set(dx, dy, 0.36);
        dresserGroup.add(drawer);

        // Tarnished brass drop pull handle
        const handleBackplate = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.04, 0.015),
          brassMat
        );
        handleBackplate.position.set(dx, dy, 0.38);
        const handleRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.026, 0.006, 6, 12),
          brassMat
        );
        handleRing.rotation.x = Math.PI / 2;
        handleRing.position.set(dx, dy - 0.015, 0.395);
        dresserGroup.add(handleBackplate, handleRing);
      });
    });

    // Props on top of Cajonera (right side, next to TV)
    // Dirty glass ashtray with crushed cigarette butts
    const ashtray = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.08, 0.025, 12),
      new THREE.MeshStandardMaterial({ color: 0x3d3830, roughness: 0.3, metalness: 0.1 })
    );
    ashtray.position.set(0.65, 1.19, 0.12);
    dresserGroup.add(ashtray);

    // Vintage amber medicine bottle
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.035, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0x5a3212, roughness: 0.25, metalness: 0.2 })
    );
    bottle.position.set(0.85, 1.24, 0.05);
    dresserGroup.add(bottle);

    // Stained yellowed document / paper
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xc8bc9e, roughness: 0.95 });
    const paperDoc = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.32), paperMat);
    paperDoc.position.set(0.35, 1.182, 0.15);
    paperDoc.rotation.x = -Math.PI / 2;
    paperDoc.rotation.z = 0.25;
    dresserGroup.add(paperDoc);

    bedroomGroup.add(dresserGroup);

    // 4. ASSET: TELEVISIÓN DE TUBO (CRT TV) on top of Cajonera at left
    // Position: X = -9.9, Y = 1.18 + 0.28 = 1.46, Z = -0.7
    const tvGroup = new THREE.Group();
    tvGroup.position.set(-9.9, 1.18, -0.7);
    tvGroup.rotation.y = 0.12; // Angled slightly towards the room

    const tvPlasticMat = new THREE.MeshStandardMaterial({
      color: 0x1f1d1b,
      roughness: 0.65,
      metalness: 0.2,
    });

    // Bulky retro 1980s TV cabinet body (0.72m wide, 0.54m tall, 0.56m deep)
    const tvCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.54, 0.56), tvPlasticMat);
    tvCabinet.position.set(0, 0.27, 0);
    tvGroup.add(tvCabinet);

    // Tapered CRT back housing
    const tvBack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.40, 0.24), tvPlasticMat);
    tvBack.position.set(0, 0.27, -0.36);
    tvGroup.add(tvBack);

    // Recessed Screen Bezel Frame
    const tvBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.44, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x121110, roughness: 0.85 })
    );
    tvBezel.position.set(-0.07, 0.27, 0.29);
    tvGroup.add(tvBezel);

    // Curved CRT Screen Glass with animated static noise texture
    const crtTex = TextureGenerator.createCrtTvScreenTexture();
    const crtMat = new THREE.MeshBasicMaterial({
      map: crtTex,
      color: 0xa8e2f0,
    });
    const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.38), crtMat);
    tvScreen.position.set(-0.07, 0.27, 0.312);
    this.tvScreenMesh = tvScreen;
    tvGroup.add(tvScreen);

    // TV Control Panel on the right side of the screen
    const controlPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.44, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x28231e, roughness: 0.7 })
    );
    controlPanel.position.set(0.24, 0.27, 0.29);
    tvGroup.add(controlPanel);

    // 2 Rotary Knobs (VHF Channel & UHF Tuning)
    const knobGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.02, 12);
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x11100e, roughness: 0.4, metalness: 0.5 });
    [0.40, 0.32].forEach((ky) => {
      const knob = new THREE.Mesh(knobGeo, knobMat);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(0.24, ky, 0.31);
      tvGroup.add(knob);
    });

    // Slotted Speaker Grille
    for (let s = 0; s < 5; s++) {
      const slit = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.008, 0.01),
        new THREE.MeshBasicMaterial({ color: 0x0a0908 })
      );
      slit.position.set(0.24, 0.16 + s * 0.022, 0.31);
      tvGroup.add(slit);
    }

    // Telescoping "Rabbit Ears" V-Antenna on top of the TV
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0x8f9aa0, metalness: 0.9, roughness: 0.25 });
    const antennaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.03, 10), tvPlasticMat);
    antennaBase.position.set(0, 0.55, 0.05);
    tvGroup.add(antennaBase);

    const ant1 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.65, 6), antennaMat);
    ant1.position.set(-0.12, 0.82, 0.05);
    ant1.rotation.z = 0.42;
    const ant2 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.65, 6), antennaMat);
    ant2.position.set(0.12, 0.82, 0.05);
    ant2.rotation.z = -0.42;
    tvGroup.add(ant1, ant2);

    // Dedicated Eerie CRT Luminescence Point Light
    const tvLight = new THREE.PointLight(0x5cb8d6, 0.9, 6.0, 1.8);
    tvLight.position.set(0, 0.27, 0.85);
    this.tvLight = tvLight;
    tvGroup.add(tvLight);

    bedroomGroup.add(tvGroup);

    // 5. ASSET: CAMA (Bed) along West Wall in South-West Corner (Matching Image 1 & 2)
    // Position: Center at X = -9.9, Z = 3.6 (spanning Z: 2.3 to 4.9)
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-9.9, 0, 3.6);

    // Headboard at North end (Z = -1.15 relative to bed center, height 1.25m)
    const hbGroup = new THREE.Group();
    hbGroup.position.set(0, 0, -1.15);

    // 2 Outer Vertical Iron Posts with Brass Ball Finials
    [-0.72, 0.72].forEach((px) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.25, 8), ironFrameMat);
      post.position.set(px, 0.625, 0);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), brassMat);
      finial.position.set(px, 1.26, 0);
      hbGroup.add(post, finial);
    });

    // Curved Top Horizontal Iron Arch Rail
    const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.44, 8), ironFrameMat);
    topRail.rotation.z = Math.PI / 2;
    topRail.position.set(0, 1.15, 0);
    const midRail = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.44, 8), ironFrameMat);
    midRail.rotation.z = Math.PI / 2;
    midRail.position.set(0, 0.45, 0);
    hbGroup.add(topRail, midRail);

    // 5 Vertical Iron Spindles
    for (let s = -2; s <= 2; s++) {
      const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.68, 6), ironFrameMat);
      spindle.position.set(s * 0.24, 0.80, 0);
      hbGroup.add(spindle);
    }
    bedGroup.add(hbGroup);

    // Footboard at South end (Z = 1.15 relative to bed center, height 0.85m)
    const fbGroup = new THREE.Group();
    fbGroup.position.set(0, 0, 1.15);
    [-0.72, 0.72].forEach((px) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.85, 8), ironFrameMat);
      post.position.set(px, 0.425, 0);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), brassMat);
      finial.position.set(px, 0.86, 0);
      fbGroup.add(post, finial);
    });
    const fbTopRail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.44, 8), ironFrameMat);
    fbTopRail.rotation.z = Math.PI / 2;
    fbTopRail.position.set(0, 0.78, 0);
    const fbMidRail = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.44, 8), ironFrameMat);
    fbMidRail.rotation.z = Math.PI / 2;
    fbMidRail.position.set(0, 0.40, 0);
    fbGroup.add(fbTopRail, fbMidRail);
    for (let s = -2; s <= 2; s++) {
      const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.36, 6), ironFrameMat);
      spindle.position.set(s * 0.24, 0.59, 0);
      fbGroup.add(spindle);
    }
    bedGroup.add(fbGroup);

    // Longitudinal Bed Rails & Wooden Slats
    [-0.70, 0.70].forEach((rx) => {
      const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 2.30), ironFrameMat);
      sideRail.position.set(rx, 0.38, 0);
      bedGroup.add(sideRail);
    });
    for (let sl = -1.0; sl <= 1.0; sl += 0.22) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(1.40, 0.02, 0.12), darkWoodMat);
      slat.position.set(0, 0.36, sl);
      bedGroup.add(slat);
    }

    // Stained Dirty Mattress (with sweat rings, grime & dried blood from Image 2)
    const mattressTex = TextureGenerator.createDirtyMattressTexture();
    const mattressMat = new THREE.MeshStandardMaterial({
      map: mattressTex,
      roughness: 0.85,
      metalness: 0.02,
    });
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.28, 2.22), mattressMat);
    mattress.position.set(0, 0.52, 0);
    bedGroup.add(mattress);

    // Stained Pillow at the South end (as drawn in Image 1 floorplan)
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0x9e9587, roughness: 0.9 });
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.14, 0.42), pillowMat);
    pillow.position.set(0, 0.70, 0.85);
    pillow.rotation.x = -0.15;
    bedGroup.add(pillow);

    // Rumpled Disheveled Dirty Blanket (sagging over the side into the room)
    const blanketMat = new THREE.MeshStandardMaterial({ color: 0x544738, roughness: 0.92 });
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.08, 1.45), blanketMat);
    blanket.position.set(0.06, 0.68, -0.15);
    const blanketDrape = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 1.15), blanketMat);
    blanketDrape.position.set(0.74, 0.48, -0.15);
    bedGroup.add(blanket, blanketDrape);

    // Decayed book and scattered notes on bed (Image 2 detail)
    const bookCover = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, 0.035, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x2a3e2a, roughness: 0.8 })
    );
    bookCover.position.set(-0.25, 0.70, -0.45);
    bookCover.rotation.y = 0.35;
    bedGroup.add(bookCover);

    bedroomGroup.add(bedGroup);

    // 6. ASSET: MESITA DE LUZ (Nightstand) beside the Bed along South Wall
    // Position: X = -8.2, Y = 0, Z = 5.3
    const nightstandGroup = new THREE.Group();
    nightstandGroup.position.set(-8.2, 0, 5.3);

    // Nightstand Body
    const nsBody = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.68, 0.54), darkWoodMat);
    nsBody.position.y = 0.36;
    nightstandGroup.add(nsBody);

    // Top Slab
    const nsTop = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.04, 0.58), darkWoodMat);
    nsTop.position.y = 0.72;
    nightstandGroup.add(nsTop);

    // Drawer Front with Round Brass Knob
    const nsDrawer = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 0.02), darkWoodMat);
    nsDrawer.position.set(0, 0.52, 0.28);
    const nsKnob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), brassMat);
    nsKnob.position.set(0, 0.52, 0.295);
    nightstandGroup.add(nsDrawer, nsKnob);

    // 4 Turned Legs
    [-0.26, 0.26].forEach((nx) => {
      [-0.22, 0.22].forEach((nz) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.018, 0.68, 8), darkWoodMat);
        leg.position.set(nx, 0.34, nz);
        nightstandGroup.add(leg);
      });
    });

    // Vintage Bedside Lamp on top of Nightstand
    const lampGroup = new THREE.Group();
    lampGroup.position.set(0, 0.74, 0);

    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.03, 12), brassMat);
    lampBase.position.y = 0.015;
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.32, 8), brassMat);
    lampStem.position.y = 0.18;
    // Decayed pleated lampshade
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xc4a36e,
      roughness: 0.9,
      transparent: true,
      opacity: 0.92,
    });
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.22, 12, 1, true), shadeMat);
    shade.position.y = 0.36;
    lampGroup.add(lampBase, lampStem, shade);

    // Warm sickly amber light from bedside lamp
    const bedLampLight = new THREE.PointLight(0xd4943b, 0.65, 4.5, 2.0);
    bedLampLight.position.set(0, 0.36, 0);
    this.bedroomLampLight = bedLampLight;
    lampGroup.add(bedLampLight);

    // Cloudy glass of water & pill blister pack
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.028, 0.09, 8),
      new THREE.MeshStandardMaterial({ color: 0x90a4a8, roughness: 0.15, transparent: true, opacity: 0.55 })
    );
    glass.position.set(0.18, 0.785, 0.12);
    nightstandGroup.add(lampGroup, glass);

    // 6B. Objeto interactuable: Nota ensangrentada en la mesita de luz (nota.jpg / nota.png)
    const noteGroup = new THREE.Group();
    noteGroup.position.set(-0.14, 0.745, 0.08);

    const noteTexLoader = new THREE.TextureLoader();
    const noteTex = noteTexLoader.load('/imgs/nota.png');
    noteTex.colorSpace = THREE.SRGBColorSpace;

    const noteMat = new THREE.MeshStandardMaterial({
      map: noteTex,
      roughness: 0.88,
      metalness: 0.04,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: true,
      emissive: new THREE.Color(0x000000),
    });
    this.highlightMaterials.set('nightstand_note', noteMat);

    // Parchment paper sheet with transparent cut-out jagged edges (no white rectangle)
    const paperSheet = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.31),
      noteMat
    );
    paperSheet.rotation.x = -Math.PI / 2;
    paperSheet.rotation.z = 0.18; // natural casual angle
    noteGroup.add(paperSheet);

    // Alpha-masked contact shadow matching the exact torn parchment contour (no rectangular border)
    const paperShadowMat = new THREE.MeshBasicMaterial({
      map: noteTex,
      color: 0x060504,
      transparent: true,
      alphaTest: 0.15,
      opacity: 0.45,
    });
    const paperShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.224, 0.314),
      paperShadowMat
    );
    paperShadow.rotation.x = -Math.PI / 2;
    paperShadow.rotation.z = 0.18;
    paperShadow.position.set(0.003, -0.002, 0.003);
    noteGroup.add(paperShadow);

    // Generous hit box for responsive mobile tap detection
    const noteHitBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.28, 0.38),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    noteHitBox.position.set(0, 0.10, 0);
    noteGroup.add(noteHitBox);

    nightstandGroup.add(noteGroup);
    this.interactiveMeshes.set('nightstand_note', noteGroup);

    bedroomGroup.add(nightstandGroup);

    // =========================================================================
    // 7A. BANQUITO Y SOMBRA/CHARCO EN EL PISO (Independiente del hombre colgado)
    // Siempre apoyados en el piso en Y = 0 (X = -6.4, Z = 4.2)
    // =========================================================================
    const floorPropsGroup = new THREE.Group();
    floorPropsGroup.position.set(-6.4, 0, 4.2);

    // Sombra en el piso
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050505,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const floorShadow = new THREE.Mesh(new THREE.CircleGeometry(0.60, 24), shadowMat);
    floorShadow.rotation.x = -Math.PI / 2;
    floorShadow.position.set(0, 0.004, 0);
    floorPropsGroup.add(floorShadow);

    // Charco de sangre seca en el piso
    const bloodPuddleMat = new THREE.MeshStandardMaterial({
      color: 0x220808,
      roughness: 0.3,
      metalness: 0.1,
    });
    const bloodPuddle = new THREE.Mesh(new THREE.CircleGeometry(0.48, 16), bloodPuddleMat);
    bloodPuddle.rotation.x = -Math.PI / 2;
    bloodPuddle.position.set(0, 0.008, 0);
    floorPropsGroup.add(bloodPuddle);

    // Banquito de madera volcado apoyado en el piso
    const stoolGroup = new THREE.Group();
    stoolGroup.position.set(-0.12, 0.14, 0.18);
    stoolGroup.rotation.z = Math.PI / 2; // Tumbado de costado
    stoolGroup.rotation.y = 0.45;

    const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.05, 12), darkWoodMat);
    stoolGroup.add(stoolSeat);
    for (let leg = 0; leg < 4; leg++) {
      const angle = (leg / 4) * Math.PI * 2;
      const slLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.016, 0.46, 6), darkWoodMat);
      slLeg.position.set(Math.cos(angle) * 0.14, -0.24, Math.sin(angle) * 0.14);
      stoolGroup.add(slLeg);
    }
    floorPropsGroup.add(stoolGroup);
    bedroomGroup.add(floorPropsGroup);

    // =========================================================================
    // 7B. HOMBRE COLGADO (Grupo aislado para ajuste manual independiente)
    // Puedes ajustar 'hangingManGroup.position' aquí sin mover el banquito ni la sombra del piso
    // =========================================================================
    const hangingManGroup = new THREE.Group();
    hangingManGroup.position.set(-6.4, 1.2, 4.2);
    this.hangingManGroup = hangingManGroup;

    // Ceiling Anchor Hook (embedded in ceiling at Y = 3.4)
    const ceilingHook = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 12), ironFrameMat);
    ceilingHook.position.set(0, 3.37, 0);
    ceilingHook.rotation.x = Math.PI / 2;
    hangingManGroup.add(ceilingHook);

    // Hanging Pendulum Group (pivoted at ceiling hook Y = 3.37 for authentic pendulum physics)
    const hangingPendulum = new THREE.Group();
    hangingPendulum.position.set(0, 3.37, 0);
    this.hangingManPendulum = hangingPendulum;
    hangingManGroup.add(hangingPendulum);

    // Hanging Twisted Hemp Rope from Ceiling Hook down to hanged man's noose (Y = 0 down to Y = -1.16)
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x6e583c, roughness: 0.95 });
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.16, 8), ropeMat);
    rope.position.set(0, -0.58, 0);
    hangingPendulum.add(rope);

    // Load authentic 3D Hanged Man model (/models/hanged_man.glb)
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/hanged_man.glb',
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
              mat.roughness = Math.max(mat.roughness ?? 0.7, 0.65);
            }
          }
        });

        // 1:1 scale (model is 1.80m tall)
        model.scale.set(1.0, 1.0, 1.0);
        // Position relative to pendulum pivot (hook at Y = 3.37):
        // Top of model rope/knot meets the rope at Y = -1.16, feet dangle ~0.40m above the floor
        model.position.set(0, -2.99, 0);
        // Angle corpse to face towards the doorway so player sees it upon entering
        model.rotation.y = 2.4;

        hangingPendulum.add(model);
      },
      undefined,
      (err) => {
        console.error('Error loading /models/hanged_man.glb:', err);
      }
    );

    bedroomGroup.add(hangingManGroup);

    // 8. Silent Hill Room 302 Environmental Details (Faithful to Image 2)
    // 4 Framed Portraits on the North Wall displaying "las caras" of El Pibe
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1f1a14, roughness: 0.8 });
    const texLoader = new THREE.TextureLoader();
    const pibeFacePaths = [
      '/imgs/Elpibe_1.jpg',
      '/imgs/Elpibe_2.jpg',
      '/imgs/Elpibe_3.jpg',
      '/imgs/Elpibe_4.jpg',
    ];
    const frameCoords = [
      [-6.5, 2.3],
      [-5.5, 2.3],
      [-6.5, 1.55],
      [-5.5, 1.55],
    ];
    frameCoords.forEach(([fx, fy], idx) => {
      const frameBorder = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.56, 0.03), frameMat);
      frameBorder.position.set(fx, fy, -1.18);

      const faceTex = texLoader.load(pibeFacePaths[idx]);
      faceTex.colorSpace = THREE.SRGBColorSpace;
      const faceMat = new THREE.MeshStandardMaterial({
        map: faceTex,
        roughness: 0.55,
        metalness: 0.08,
      });
      const pictureMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.46), faceMat);
      pictureMesh.position.set(fx, fy, -1.16);
      bedroomGroup.add(frameBorder, pictureMesh);
    });

    // Scattered papers, playing cards, and torn photos on the floor (Image 2)
    const scatterMat = new THREE.MeshStandardMaterial({ color: 0xbbb098, roughness: 0.95 });
    const scatterPositions = [
      [-7.4, 1.8, 0.3],
      [-8.6, 1.4, -0.4],
      [-7.8, 3.8, 0.8],
      [-6.8, 3.2, -0.6],
      [-9.1, 4.4, 0.1],
    ];
    scatterPositions.forEach(([sx, sz, srot]) => {
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), scatterMat);
      paper.rotation.x = -Math.PI / 2;
      paper.rotation.z = srot;
      paper.position.set(sx, 0.015, sz);
      bedroomGroup.add(paper);
    });

    // Hanging Vintage Ceiling Pendant Light Cord (Image 2 aesthetic)
    const pendantCord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.95, 6),
      new THREE.MeshBasicMaterial({ color: 0x181410 })
    );
    pendantCord.position.set(-8.2, 2.92, 2.4);
    const pendantShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.18, 0.12, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x6e6252, roughness: 0.7 })
    );
    pendantShade.position.set(-8.2, 2.42, 2.4);
    bedroomGroup.add(pendantCord, pendantShade);

    this.scene.add(bedroomGroup);
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
    const graffiti = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), graffitiMat);
    graffiti.position.set(-2.4, 1.8, 5.94);
    graffiti.rotation.y = Math.PI;
    this.scene.add(graffiti);

    // 2. 1986 Calendar (moved to East Wall opposite the new fuse box position)
    const calTex = TextureGenerator.createCalendarTexture();
    const calMat = new THREE.MeshStandardMaterial({
      map: calTex,
      roughness: 0.9,
    });
    const calendar = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), calMat);
    calendar.position.set(4.94, 1.65, -0.6);
    calendar.rotation.y = -Math.PI / 2;
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
    // Movement forward/back & left/right relative to camera's horizontal yaw
    const currentYaw = this.touchYaw + this.gyroYaw;
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), currentYaw);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), currentYaw);
    right.y = 0;
    right.normalize();

    const maxSpeed = 2.6; // Max speed in m/s
    const targetVel = right
      .multiplyScalar(vector.x * maxSpeed)
      .add(forward.multiplyScalar(vector.y * maxSpeed));

    // Smooth velocity lerp for momentum and continuous fluid movement without jerky stops
    const lerpFactor = Math.min(1.0, 16.0 * delta);
    this.moveVelocity.lerp(targetVel, lerpFactor);

    if (this.moveVelocity.lengthSq() < 0.00001) {
      this.moveVelocity.set(0, 0, 0);
      return;
    }

    const moveStep = this.moveVelocity.clone().multiplyScalar(delta);

    // Independent Axis Sliding: Attempt X movement first, then Z movement
    const posPrev = this.playerPosition.clone();

    // Step 1: Move along X
    let tryX = new THREE.Vector3(posPrev.x + moveStep.x, posPrev.y, posPrev.z);
    tryX = this.constrainPositionToBounds(tryX);

    // Step 2: Move along Z
    let tryZ = new THREE.Vector3(tryX.x, tryX.y, tryX.z + moveStep.z);
    tryZ = this.constrainPositionToBounds(tryZ);

    this.playerPosition.copy(tryZ);
    this.camera.position.copy(this.playerPosition);
  }

  /**
   * Minimum-penetration AABB collision helper for smooth wall & obstacle sliding
   */
  private collideBox(
    pos: THREE.Vector3,
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    margin = 0.2
  ): THREE.Vector3 {
    const eMinX = minX - margin;
    const eMaxX = maxX + margin;
    const eMinZ = minZ - margin;
    const eMaxZ = maxZ + margin;

    if (pos.x > eMinX && pos.x < eMaxX && pos.z > eMinZ && pos.z < eMaxZ) {
      const dxLeft = Math.abs(pos.x - eMinX);
      const dxRight = Math.abs(pos.x - eMaxX);
      const dzBottom = Math.abs(pos.z - eMinZ);
      const dzTop = Math.abs(pos.z - eMaxZ);

      const minPen = Math.min(dxLeft, dxRight, dzBottom, dzTop);

      if (minPen === dxLeft) pos.x = eMinX;
      else if (minPen === dxRight) pos.x = eMaxX;
      else if (minPen === dzBottom) pos.z = eMinZ;
      else pos.z = eMaxZ;
    }
    return pos;
  }

  /**
   * Constrain position across Main Room, Bathroom, Bedroom and all scene obstacles
   */
  private constrainPositionToBounds(pos: THREE.Vector3): THREE.Vector3 {
    // 1. Room Shell & Doorway Transitions
    if (pos.x > 4.2) {
      // East Side / Bathroom direction
      const inBathroomDoorZ = pos.z >= 0.45 && pos.z <= 2.35;
      if (this.isBathroomUnlocked && inBathroomDoorZ) {
        pos.x = Math.min(10.8, pos.x);
        if (pos.x > 4.8) {
          pos.z = Math.max(-1.6, Math.min(4.4, pos.z));
        } else {
          pos.z = Math.max(0.45, Math.min(2.35, pos.z));
        }
      } else {
        pos.x = Math.min(4.2, pos.x);
        pos.z = Math.max(-5.3, Math.min(5.2, pos.z));
      }
    } else if (pos.x < -4.2) {
      // West Side / Bedroom direction
      const inBedroomDoorZ = pos.z >= 1.30 && pos.z <= 2.55;
      if (inBedroomDoorZ) {
        pos.x = Math.max(-10.8, pos.x);
        if (pos.x < -4.8) {
          pos.z = Math.max(-0.7, Math.min(5.5, pos.z));
        } else {
          pos.z = Math.max(1.30, Math.min(2.55, pos.z));
        }
      } else {
        pos.x = Math.max(-4.2, pos.x);
        pos.z = Math.max(-5.3, Math.min(5.2, pos.z));
      }
    } else {
      // Main Room
      pos.z = Math.max(-5.3, Math.min(5.2, pos.z));
    }

    // 2. Obstacle Collisions
    // Dining table & chairs
    pos = this.collideBox(pos, -3.85, -1.75, -1.85, -0.65, 0.22);
    pos = this.collideBox(pos, -3.60, -1.85, -0.70, 0.05, 0.15);
    pos = this.collideBox(pos, -4.15, -3.65, -1.75, -1.15, 0.15);
    pos = this.collideBox(pos, -2.80, -2.10, -2.32, -1.75, 0.15);

    // Rotten Fridge & Credenza & Cart
    pos = this.collideBox(pos, 2.95, 4.35, -5.20, -3.98, 0.25);
    pos = this.collideBox(pos, 0.65, 2.65, -5.90, -5.15, 0.15);
    pos = this.collideBox(pos, 1.65, 2.75, -2.85, -1.95, 0.20);

    // Bathroom obstacles
    if (pos.x > 4.5) {
      pos = this.collideBox(pos, 6.45, 7.15, -1.90, -1.35, 0.20); // termotanque
      pos = this.collideBox(pos, 4.95, 5.55, 3.15, 4.05, 0.15); // radiator
      pos = this.collideBox(pos, 10.2, 11.4, 0.05, 2.75, 0.20); // tub
      pos = this.collideBox(pos, 6.9, 8.1, 3.8, 5.0, 0.20); // toilet
      pos = this.collideBox(pos, 7.8, 9.2, -1.9, -1.05, 0.20); // sink
    }

    // Bedroom obstacles
    if (pos.x < -4.5) {
      pos = this.collideBox(pos, -11.4, -8.7, 2.1, 5.0, 0.25); // bed
      pos = this.collideBox(pos, -11.4, -7.0, -1.2, 0.15, 0.25); // cajonera + TV
      pos = this.collideBox(pos, -8.8, -7.6, 4.6, 5.9, 0.20); // nightstand

      // Hanging man / stool obstacle (cylinder)
      const toHanging = new THREE.Vector2(pos.x - (-6.4), pos.z - 4.2);
      const minDist = 0.45;
      if (toHanging.length() < minDist) {
        if (toHanging.length() === 0) toHanging.set(1, 0);
        toHanging.normalize().multiplyScalar(minDist);
        pos.x = -6.4 + toHanging.x;
        pos.z = 4.2 + toHanging.y;
      }
    }

    return pos;
  }

  /**
   * Apply Gyroscope Orientation in radians (yaw, pitch, roll)
   */
  public applyGyroAngles(yaw: number, pitch: number, _roll: number = 0) {
    this.gyroYaw = yaw;
    this.gyroPitch = pitch;
  }

  public applyGyroOrientation(data: OrientationData) {
    const degToRad = Math.PI / 180;
    this.gyroPitch = (data.beta - 75) * degToRad;
    this.gyroYaw = -data.alpha * degToRad;
  }

  /**
   * Apply Touch Drag or Mouse Look with Invert X / Invert Y support
   */
  public applyLookDelta(dx: number, dy: number, invertX: boolean = false, invertY: boolean = false) {
    const sensitivity = 0.003;
    const factorX = invertX ? 1 : -1;
    const factorY = invertY ? 1 : -1;
    this.touchYaw += dx * sensitivity * factorX;
    this.touchPitch = Math.max(-1.35, Math.min(1.35, this.touchPitch + dy * sensitivity * factorY));
  }

  public recenterCamera() {
    this.touchYaw = 0;
    this.touchPitch = 0;
    this.gyroYaw = 0;
    this.gyroPitch = 0;
    this.camera.rotation.set(0, 0, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this.camera.rotation);
  }

  /**
   * Check flashlight illumination and aim alignment to interactive targets.
   * STRICT VERIFICATION: Target is illuminated ONLY when Flashlight is ON
   * and looking directly at it (inside flashlight cone).
   */
  private checkProximityAndHighlights(time: number) {
    let closestTarget: InteractiveTargetId = null;
    let minDistance = 999;
    let isTargetInBeam = false;

    const camPos = this.camera.position;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();

    const targets: { id: InteractiveTargetId; pos: THREE.Vector3; maxDist: number }[] = [
      { id: 'main_door', pos: new THREE.Vector3(0, 1.4, -5.8), maxDist: 3.4 },
      { id: 'door_peephole', pos: new THREE.Vector3(0.5, 1.6, 5.85), maxDist: 3.4 },
      { id: 'rotten_fridge', pos: new THREE.Vector3(3.6, 1.2, -4.6), maxDist: 2.8 },
      { id: 'study_desk', pos: new THREE.Vector3(-2.8, 0.9, -1.2), maxDist: 3.0 },
      { id: 'fuse_box', pos: new THREE.Vector3(-4.88, 1.6, -3.2), maxDist: 2.4 },
      { id: 'nightstand_note', pos: new THREE.Vector3(-8.34, 0.76, 5.38), maxDist: 3.2 },
    ];

    if (!this.isBathroomUnlocked) {
      targets.push({ id: 'bathroom_door', pos: new THREE.Vector3(5.0, 1.2, 1.4), maxDist: 2.8 });
    } else {
      targets.push({ id: 'toilet', pos: new THREE.Vector3(7.5, 0.6, 4.0), maxDist: 2.8 });
      targets.push({ id: 'broken_tile', pos: new THREE.Vector3(11.38, 0.76, 0.35), maxDist: 2.2 });
    }

    let bestAlignment = -1;

    targets.forEach((t) => {
      const toTarget = t.pos.clone().sub(camPos);
      const dist = toTarget.length();
      toTarget.normalize();
      const dot = forward.dot(toTarget);

      // Flashlight cone verification:
      // Object is illuminated if within flashlight cone (dot >= 0.72) and range
      if (dist <= t.maxDist) {
        if (dot >= 0.72 && dot > bestAlignment) {
          bestAlignment = dot;
          closestTarget = t.id;
          minDistance = dist;
          isTargetInBeam = true;
        } else if (!closestTarget && dist < minDistance && dot > 0.45) {
          closestTarget = t.id;
          minDistance = dist;
          isTargetInBeam = false;
        }
      }
    });

    const isFullyIlluminated = this.isFlashlightOn && isTargetInBeam;
    const activeTarget = isFullyIlluminated ? closestTarget : null;
    this.currentNearTarget = activeTarget;

    // Animate glowing reflection highlight ONLY when actively illuminated by the flashlight beam
    const pulse = 0.5 + Math.sin(time * 4.0) * 0.5;
    this.highlightMaterials.forEach((mat, id) => {
      if (id === activeTarget) {
        if (id === 'broken_tile') {
          mat.emissive.setHex(0x2d1f10);
          mat.emissiveIntensity = 0.4 + pulse * 0.3;
        } else if (id === 'nightstand_note') {
          mat.emissive.setHex(0x3e2c14);
          mat.emissiveIntensity = 0.7 + pulse * 0.4;
        } else {
          mat.emissive.setHex(0x3e5228);
          mat.emissiveIntensity = 0.75 + pulse * 0.45;
        }
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
      }
    });

    if (this.onInteractionUpdate) {
      this.onInteractionUpdate({
        target: closestTarget,
        isFlashlightOn: this.isFlashlightOn,
        isIlluminated: isFullyIlluminated,
        distance: minDistance,
      });
    }
  }

  /**
   * Raycast tap on screen to interact with 3D objects
   * STRICT 3-POINT VERIFICATION:
   * 1. Touch on screen
   * 2. Flashlight turned ON
   * 3. Object illuminated by flashlight beam
   */
  public handleScreenTap(clientX: number, clientY: number): InteractionTapResult {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const candidates: { id: InteractiveTargetId; object: THREE.Object3D }[] = [];
    this.interactiveMeshes.forEach((mesh, id) => {
      candidates.push({ id, object: mesh });
    });

    // 1. Raycast direct intersection with interactive 3D object
    let directHitId: InteractiveTargetId = null;
    let minRayDist = 999;

    for (const item of candidates) {
      const intersects = this.raycaster.intersectObject(item.object, true);
      if (intersects.length > 0) {
        const dist = intersects[0].distance;
        if (dist < 3.8 && dist < minRayDist) {
          minRayDist = dist;
          directHitId = item.id;
        }
      }
    }

    // Candidate target:
    // For fuse_box, the hitbox must strictly match the size of the interactable object.
    // It requires a direct raycast intersection on the fuse box mesh itself.
    let candidateId = directHitId;
    if (!candidateId && this.currentNearTarget && this.currentNearTarget !== 'fuse_box') {
      candidateId = this.currentNearTarget;
    }

    if (!candidateId) {
      return { target: null, success: false, reason: 'miss' };
    }

    // 2. Verification Step 1: Flashlight MUST be turned ON!
    if (!this.isFlashlightOn) {
      return { target: candidateId, success: false, reason: 'flashlight_off' };
    }

    // 3. Verification Step 2: Object must be illuminated by flashlight beam
    const targetObj = this.interactiveMeshes.get(candidateId);
    if (targetObj) {
      const targetWorldPos = new THREE.Vector3();
      targetObj.getWorldPosition(targetWorldPos);
      const toObj = targetWorldPos.clone().sub(this.camera.position);
      const dist = toObj.length();
      toObj.normalize();
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
      const dot = forward.dot(toObj);

      if (dist > 3.8) {
        return { target: candidateId, success: false, reason: 'too_far' };
      }

      if (dot < 0.58 && this.currentNearTarget !== candidateId) {
        return { target: candidateId, success: false, reason: 'not_illuminated' };
      }
    }

    // All verifications passed: Giroscopio/Vista + Linterna Encendida + Touch en pantalla!
    return { target: candidateId, success: true, reason: 'ok' };
  }

  public getCurrentNearTarget(): InteractiveTargetId {
    return this.currentNearTarget;
  }

  /**
   * Distance from player camera to Main Chained Door
   */
  public getDistanceToDoor(): number {
    return this.camera.position.distanceTo(new THREE.Vector3(0, 1.35, this.doorBaseZ));
  }

  /**
   * Distance from player camera to La Puerta del Pibe (South Wall)
   */
  public getDistanceToPibeDoor(): number {
    return this.camera.position.distanceTo(new THREE.Vector3(0.5, 1.35, this.pibeDoorBaseZ));
  }

  /**
   * Visual recoil & camera tremor when heavy door knocks occur
   */
  public triggerDoorKnockImpact() {
    this.doorShakeStartTime = performance.now();
    // Micro camera tremor
    this.touchPitch += (Math.random() - 0.5) * 0.018;
    this.touchYaw += (Math.random() - 0.5) * 0.018;
  }

  /**
   * Main Render Loop
   */
  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const time = performance.now() * 0.001;

    // 1. Light flicker of industrial ceiling luminaire & door spotlight synchronized with "sonido de foco"
    const isDip = Math.sin(time * 12.0) > 0.82 || Math.random() > 0.96;
    const flicker = 1.0 + (isDip ? -0.45 : 0.0) + (Math.random() > 0.95 ? -0.2 : 0.0);
    const bulbIntensity = Math.max(0.3, flicker * 1.95);
    this.centerBulbLight.intensity = bulbIntensity;
    if (this.doorSpotLight) {
      this.doorSpotLight.intensity = Math.max(0.2, flicker * 1.7);
    }

    if (this.bulbMesh) {
      (this.bulbMesh.material as THREE.MeshBasicMaterial).color.setHex(
        isDip ? 0xc46424 : 0xff9438
      );
    }

    // Synchronize ceiling light with lower-volume foco electrical sound
    horrorAudio.syncCeilingLight(bulbIntensity, isDip);

    // 2. Physical door vibration on knock impact (emanating from La Puerta del Pibe)
    if (this.pibeDoorGroup && this.doorShakeStartTime > 0) {
      const elapsed = performance.now() - this.doorShakeStartTime;
      if (elapsed < 420) {
        const decay = 1.0 - elapsed / 420;
        const joltZ = Math.sin(elapsed * 0.08) * 0.022 * decay;
        this.pibeDoorGroup.position.z = this.pibeDoorBaseZ - joltZ;
      } else {
        this.pibeDoorGroup.position.z = this.pibeDoorBaseZ;
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

    // 3. Camera Orientation: unified single Euler (touch + gyro)
    // Continuous 360-degree rotation without gimbal-lock or quaternion drift
    const totalYaw = this.touchYaw + this.gyroYaw;
    const totalPitch = Math.max(-1.35, Math.min(1.35, this.touchPitch + this.gyroPitch));
    this.camera.rotation.set(totalPitch, totalYaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this.camera.rotation);

    // 4. Flashlight follows camera look
    this.flashlight.position.copy(this.camera.position);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.flashlightTarget.position.copy(this.camera.position).add(forward.multiplyScalar(4));

    // 5. Check proximity and glow
    this.checkProximityAndHighlights(time);

    // 6. 3D Spatial Audio: Baby weeping ("llanto.wav") emanating directly from the Silent Hill Sink
    const playerPos = this.camera.position;
    const toSink = this.sinkPosition.clone().sub(playerPos);
    const distToSink = toSink.length();

    // Calculate horizontal stereo panning (-1.0 to 1.0) based on camera orientation
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const rightHoriz = new THREE.Vector2(right.x, right.z).normalize();
    const toSinkHoriz = new THREE.Vector2(toSink.x, toSink.z).normalize();
    const pan = Math.max(-1.0, Math.min(1.0, rightHoriz.dot(toSinkHoriz)));

    horrorAudio.updateSinkCryAudio(distToSink, pan, this.isBathroomUnlocked);

    // Subtle organic breathing / twitch for the fetus resting inside the sink
    if (this.fetoModel) {
      const breath = 1.0 + Math.sin(time * 3.4) * 0.025;
      this.fetoModel.scale.set(0.18 * breath, 0.18 * (2.0 - breath), 0.18 * breath);
    }

    // 7. Dynamic Horror Bedroom Animations
    if (this.hangingManPendulum) {
      // Sinister harmonic pendulum sway of the hanging corpse from the ceiling noose
      this.hangingManPendulum.rotation.z = Math.sin(time * 0.72) * 0.022;
      this.hangingManPendulum.rotation.x = Math.cos(time * 0.55) * 0.016;
      this.hangingManPendulum.rotation.y = Math.sin(time * 0.38) * 0.012;
    }

    if (this.tvLight) {
      // Eerie flickering phosphor CRT static glow
      const tvFlicker = 0.82 + (Math.sin(time * 16.0) > 0.5 ? 0.28 : -0.15) + (Math.random() > 0.88 ? 0.3 : 0.0);
      this.tvLight.intensity = Math.max(0.35, Math.min(1.45, tvFlicker));
    }

    if (this.bedroomLampLight) {
      // Dying filament micro-pulsation
      const lampPulse = 0.60 + Math.sin(time * 8.0) * 0.05 + (Math.random() > 0.96 ? -0.15 : 0.0);
      this.bedroomLampLight.intensity = Math.max(0.3, lampPulse);
    }

    // 8. Render
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
