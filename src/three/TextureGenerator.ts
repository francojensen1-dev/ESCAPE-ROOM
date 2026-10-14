/**
 * Procedural Texture Generator
 * Creates high-detail horror textures using HTML Canvas2D.
 * Guarantees zero broken external image dependencies and instant loading.
 */

import * as THREE from 'three';

export class TextureGenerator {
  /**
   * Peeling dirty wallpaper with water damage and grime
   */
  public static createWallpaperTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base decaying greenish-brown plaster
    ctx.fillStyle = '#262922';
    ctx.fillRect(0, 0, 512, 512);

    // Grunge pattern
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 20;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(15, 18, 12, 0.08)' : 'rgba(55, 48, 32, 0.06)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Peeling wallpaper stripes / vintage pattern
    ctx.strokeStyle = 'rgba(45, 50, 38, 0.25)';
    ctx.lineWidth = 12;
    for (let x = 0; x < 512; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Dirt and water leaks coming from the top
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, 'rgba(15, 12, 8, 0.6)');
    grad.addColorStop(0.4, 'rgba(25, 20, 14, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 300);

    // Cracks
    ctx.strokeStyle = 'rgba(10, 10, 10, 0.4)';
    ctx.lineWidth = 1.5;
    for (let c = 0; c < 5; c++) {
      let cx = Math.random() * 512;
      let cy = Math.random() * 300;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 6; s++) {
        cx += (Math.random() - 0.5) * 40;
        cy += Math.random() * 30;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    return texture;
  }

  /**
   * Weathered dark wooden floor planks
   */
  public static createWoodFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e1610';
    ctx.fillRect(0, 0, 512, 512);

    const plankHeight = 64;
    for (let y = 0; y < 512; y += plankHeight) {
      // Plank tone variation
      const shade = 18 + Math.floor((Math.random() - 0.5) * 8);
      ctx.fillStyle = `rgb(${shade + 8}, ${shade}, ${Math.max(6, shade - 6)})`;
      ctx.fillRect(0, y, 512, plankHeight - 2);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(8, 5, 2, 0.25)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 14; g++) {
        ctx.beginPath();
        const gy = y + Math.random() * plankHeight;
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(150, gy + (Math.random() - 0.5) * 4, 350, gy + (Math.random() - 0.5) * 4, 512, gy);
        ctx.stroke();
      }

      // Plank gap shadow
      ctx.fillStyle = '#080503';
      ctx.fillRect(0, y + plankHeight - 3, 512, 3);
    }

    // Dirt stains
    for (let s = 0; s < 30; s++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      ctx.fillStyle = 'rgba(5, 3, 2, 0.15)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 20 + Math.random() * 40, 10 + Math.random() * 20, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  /**
   * Blood-red frantic graffiti: "NO MIRES ATRÁS"
   */
  public static createGraffitiTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 256);

    // Bloody dripping text
    ctx.font = 'bold 38px "Creepster", cursive, "Impact", sans-serif';
    ctx.fillStyle = '#8a0d0d';
    ctx.shadowColor = '#420404';
    ctx.shadowBlur = 8;
    ctx.fillText('NO MIRES ATRÁS', 40, 90);

    // Drips
    ctx.strokeStyle = '#780a0a';
    ctx.lineWidth = 3;
    const dripXs = [70, 140, 210, 290, 360, 420];
    dripXs.forEach((dx) => {
      ctx.beginPath();
      ctx.moveTo(dx, 90);
      ctx.lineTo(dx + (Math.random() - 0.5) * 4, 90 + 35 + Math.random() * 40);
      ctx.stroke();
    });

    // Subtext
    ctx.font = '20px "JetBrains Mono", monospace';
    ctx.fillStyle = '#a62424';
    ctx.fillText('15 MINUTOS... EL PIBE YA VIENE', 45, 175);

    // Scratch marks
    ctx.strokeStyle = '#520606';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(380 + i * 14, 130);
      ctx.lineTo(375 + i * 14, 180);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(370, 145);
    ctx.lineTo(435, 165);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Room 302 Silent Hill 4 reference style chained door texture:
   * Peeling off-white paint, two recessed beveled panels,
   * bloody scrawled "Don't go out!! Walter", deadbolt latch plate,
   * and chain scrape marks.
   */
  public static createDoorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;

    // 1. Base decaying yellowed off-white / plaster paint
    ctx.fillStyle = '#b8aa94';
    ctx.fillRect(0, 0, 1024, 2048);

    // Grunge & mottled dirt layer
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 2048;
      const r = Math.random() * 25;
      ctx.fillStyle = Math.random() > 0.6
        ? 'rgba(40, 28, 18, 0.08)'
        : Math.random() > 0.3
        ? 'rgba(80, 50, 25, 0.05)'
        : 'rgba(20, 15, 10, 0.06)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Heavy rust and grime wash from top & edges
    const topGrime = ctx.createLinearGradient(0, 0, 0, 600);
    topGrime.addColorStop(0, 'rgba(45, 25, 12, 0.85)');
    topGrime.addColorStop(0.3, 'rgba(65, 40, 20, 0.5)');
    topGrime.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topGrime;
    ctx.fillRect(0, 0, 1024, 600);

    const bottomGrime = ctx.createLinearGradient(0, 1600, 0, 2048);
    bottomGrime.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomGrime.addColorStop(0.7, 'rgba(30, 20, 12, 0.6)');
    bottomGrime.addColorStop(1, 'rgba(15, 8, 4, 0.95)');
    ctx.fillStyle = bottomGrime;
    ctx.fillRect(0, 1600, 1024, 448);

    // 3. Recessed Panels (Upper & Lower)
    const drawRecessedPanel = (x: number, y: number, w: number, h: number) => {
      // Outer shadow bevel (top and left dark, bottom and right highlight)
      ctx.fillStyle = 'rgba(25, 15, 8, 0.65)';
      ctx.fillRect(x - 12, y - 12, w + 24, 16); // top outer shadow
      ctx.fillRect(x - 12, y - 12, 16, h + 24); // left outer shadow

      ctx.fillStyle = 'rgba(240, 230, 215, 0.25)';
      ctx.fillRect(x - 12, y + h - 4, w + 24, 16); // bottom outer rim
      ctx.fillRect(x + w - 4, y - 12, 16, h + 24); // right outer rim

      // Panel background (slightly darker, peeling)
      ctx.fillStyle = '#9e8f7a';
      ctx.fillRect(x, y, w, h);

      // Inner shadow
      const innerShadow = ctx.createLinearGradient(x, y, x, y + 100);
      innerShadow.addColorStop(0, 'rgba(15, 8, 4, 0.7)');
      innerShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = innerShadow;
      ctx.fillRect(x, y, w, 100);

      // Inner left shadow
      const innerLeftShadow = ctx.createLinearGradient(x, y, x + 80, y);
      innerLeftShadow.addColorStop(0, 'rgba(15, 8, 4, 0.6)');
      innerLeftShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = innerLeftShadow;
      ctx.fillRect(x, y, 80, h);

      // Peeling paint patches exposing raw dark wood/rust inside panel
      for (let p = 0; p < 8; p++) {
        const px = x + 30 + Math.random() * (w - 120);
        const py = y + 30 + Math.random() * (h - 120);
        const pw = 40 + Math.random() * 90;
        const ph = 30 + Math.random() * 80;

        ctx.fillStyle = 'rgba(40, 22, 12, 0.85)';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + pw, py + (Math.random() - 0.5) * 15);
        ctx.lineTo(px + pw - 10, py + ph);
        ctx.lineTo(px + 10, py + ph + 8);
        ctx.closePath();
        ctx.fill();

        // Edge curl highlight
        ctx.strokeStyle = 'rgba(230, 215, 190, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    // Upper recessed panel (Y: 160 to 860)
    drawRecessedPanel(120, 160, 784, 700);

    // Lower recessed panel (Y: 1140 to 1880)
    drawRecessedPanel(120, 1140, 784, 740);

    // 4. Center Peephole (Y: 960)
    const peepholeY = 960;
    // Outer brass trim
    ctx.fillStyle = '#614922';
    ctx.beginPath();
    ctx.arc(512, peepholeY, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#c29b47';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(512, peepholeY, 32, 0, Math.PI * 2);
    ctx.stroke();

    // Dark peephole glass lens
    ctx.fillStyle = '#060608';
    ctx.beginPath();
    ctx.arc(512, peepholeY, 24, 0, Math.PI * 2);
    ctx.fill();

    // Lens glare reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(504, peepholeY - 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // 5. Scrawled Blood Message under Peephole: "Don't go out!!" and "Walter"
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 44px "Creepster", cursive, "Comic Sans MS", cursive, sans-serif';
    ctx.fillStyle = '#8f0d0d';
    ctx.shadowColor = '#380404';
    ctx.shadowBlur = 6;
    ctx.fillText("Don't go Out!!", 512, 1040);

    // Secondary line: "Walter" (and subtle "El Pibe")
    ctx.font = 'italic bold 28px serif';
    ctx.fillStyle = '#7a0b0b';
    ctx.fillText('Walter', 512, 1085);

    // Blood drips from letters
    ctx.strokeStyle = '#800a0a';
    ctx.lineWidth = 3;
    const dripPositions = [385, 450, 520, 590, 640];
    dripPositions.forEach((dx) => {
      ctx.beginPath();
      ctx.moveTo(dx, 1040);
      ctx.lineTo(dx + (Math.random() - 0.5) * 6, 1040 + 20 + Math.random() * 35);
      ctx.stroke();
    });
    ctx.restore();

    // 6. Deadbolt latch plate on the right middle edge
    ctx.fillStyle = '#2b2a29';
    ctx.fillRect(860, 930, 90, 48);
    ctx.strokeStyle = '#4a4845';
    ctx.lineWidth = 3;
    ctx.strokeRect(860, 930, 90, 48);

    // Screws in latch plate
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(875, 954, 4, 0, Math.PI * 2);
    ctx.arc(935, 954, 4, 0, Math.PI * 2);
    ctx.fill();

    // 7. Chain Scrape Marks & Rust Abrasions across the door
    // Diagonal scrape where chains rub
    ctx.strokeStyle = 'rgba(30, 18, 10, 0.45)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(80, 780);
    ctx.lineTo(950, 1250);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(80, 920);
    ctx.lineTo(950, 880);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(80, 1500);
    ctx.lineTo(950, 1420);
    ctx.stroke();

    // Metallic silver friction streaks in center of scrapes
    ctx.strokeStyle = 'rgba(180, 175, 170, 0.15)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(90, 785);
    ctx.lineTo(940, 1245);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Heavy rusted cast steel bracket plate texture for the wall/door anchors
   */
  public static createRustedBracketTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Dark pitted cast iron
    ctx.fillStyle = '#2b2824';
    ctx.fillRect(0, 0, 256, 256);

    // Rust specks and corrosion
    for (let i = 0; i < 1500; i++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(92, 45, 18, 0.4)' : 'rgba(30, 20, 15, 0.5)';
      ctx.beginPath();
      ctx.arc(rx, ry, Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy beveled plate edge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 244, 244);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, 228, 228);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Rotten vintage refrigerator front with rust & grime
   */
  public static createRottenFridgeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d')!;

    // Decaying yellowish off-white enamel
    ctx.fillStyle = '#454a3e';
    ctx.fillRect(0, 0, 512, 768);

    // Rust spots and corrosion
    for (let i = 0; i < 800; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 768;
      const rad = 2 + Math.random() * 18;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(102, 51, 17, 0.25)' : 'rgba(35, 45, 25, 0.3)';
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Large rusty bottom base
    const rustGrad = ctx.createLinearGradient(0, 550, 0, 768);
    rustGrad.addColorStop(0, 'rgba(80, 35, 10, 0.4)');
    rustGrad.addColorStop(1, 'rgba(50, 20, 5, 0.95)');
    ctx.fillStyle = rustGrad;
    ctx.fillRect(0, 550, 512, 218);

    // Freezer seam
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 240, 512, 10);

    // Handle
    ctx.fillStyle = '#6e7075';
    ctx.fillRect(38, 270, 22, 140);
    ctx.fillStyle = '#222';
    ctx.fillRect(42, 275, 14, 130);

    // Creepy yellow sticky note: "HAY ALGO EN EL CONGELADOR"
    ctx.fillStyle = '#9e924a';
    ctx.fillRect(160, 320, 110, 90);
    ctx.fillStyle = '#1c1808';
    ctx.font = '11px sans-serif';
    ctx.fillText('LLAVE OXIDADA', 170, 345);
    ctx.fillText('ADENTRO...', 170, 365);
    ctx.fillText('(NO COMER)', 170, 385);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Wall Calendar texture displaying the year "1986" clue
   */
  public static createCalendarTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d')!;

    // Yellowed vintage paper
    ctx.fillStyle = '#968c72';
    ctx.fillRect(0, 0, 256, 320);

    // Header bar
    ctx.fillStyle = '#612424';
    ctx.fillRect(0, 0, 256, 60);

    ctx.fillStyle = '#f0eae1';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AÑO 1986', 128, 42);

    // Months grid mock
    ctx.fillStyle = '#3a3427';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('OCTUBRE', 128, 90);

    // Circle clue in red ink: "1986"
    ctx.strokeStyle = '#b31212';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(128, 38, 80, 24, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Frantic note scribbled
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#7a0e0e';
    ctx.fillText('CÓDIGO CANDADO: 1986', 128, 260);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Decaying moldy bathroom tile texture (East room bathroom)
   */
  public static createBathroomTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base dirty porcelain / sickly cyan-gray
    ctx.fillStyle = '#2a3b38';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 64;
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 512; y += tileSize) {
        // Tile gradient
        const tGrad = ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
        const hueVar = (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 10;
        tGrad.addColorStop(0, `rgb(${45 + hueVar}, ${65 + hueVar}, ${62 + hueVar})`);
        tGrad.addColorStop(1, `rgb(${30 + hueVar}, ${48 + hueVar}, ${45 + hueVar})`);
        ctx.fillStyle = tGrad;
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        // Mold & water stain splatter on some tiles
        if (Math.random() > 0.6) {
          ctx.fillStyle = 'rgba(15, 30, 25, 0.45)';
          ctx.beginPath();
          ctx.arc(x + tileSize * 0.5, y + tileSize * 0.5, Math.random() * 20 + 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Dark dirty moldy grout grid
    ctx.strokeStyle = '#0e1715';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 512; i += tileSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // Dripping vertical dark sludge streaks
    for (let s = 0; s < 8; s++) {
      const sx = Math.random() * 512;
      const sGrad = ctx.createLinearGradient(sx, 0, sx, 400);
      sGrad.addColorStop(0, 'rgba(10, 20, 15, 0.8)');
      sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sGrad;
      ctx.fillRect(sx, 0, Math.random() * 14 + 6, 400);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  /**
   * Broken wall tile displaying carved code "MORIR"
   */
  public static createBrokenTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Cracked tile background
    ctx.fillStyle = '#1c2825';
    ctx.fillRect(0, 0, 512, 512);

    // Surrounding intact tile borders
    ctx.strokeStyle = '#0e1715';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 504);

    // Deep jagged broken recess in plaster
    ctx.fillStyle = '#080808';
    ctx.beginPath();
    ctx.moveTo(60, 80);
    ctx.lineTo(440, 60);
    ctx.lineTo(470, 360);
    ctx.lineTo(380, 450);
    ctx.lineTo(120, 460);
    ctx.lineTo(50, 280);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#351818';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Jagged cracks spreading
    ctx.strokeStyle = '#111816';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 80); ctx.lineTo(10, 10);
    ctx.moveTo(440, 60); ctx.lineTo(500, 20);
    ctx.moveTo(380, 450); ctx.lineTo(480, 500);
    ctx.moveTo(120, 460); ctx.lineTo(20, 500);
    ctx.stroke();

    // Bloody, desperate fingernail carving: "M O R I R"
    ctx.fillStyle = '#ba1e1e';
    ctx.font = 'bold 52px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 12;
    ctx.fillText('M O R I R', 256, 260);

    // Blood drips down from the letters
    ctx.fillStyle = '#800e0e';
    ctx.shadowBlur = 0;
    for (let d = 0; d < 5; d++) {
      const dx = 130 + d * 64;
      ctx.fillRect(dx, 275, 4, Math.random() * 50 + 20);
    }

    ctx.font = 'italic 16px sans-serif';
    ctx.fillStyle = '#6e5e5e';
    ctx.fillText('(CÓDIGO DE 5 LETRAS)', 256, 340);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * White Square Ceramic Tiles matching the photo reference
   * Dirty off-white porcelain, dark dirty grout, mold, water leaks, and crawling roaches
   */
  public static createWhiteTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base dirty wall
    ctx.fillStyle = '#22201d';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 64; // 8x8 grid of square tiles
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 512; y += tileSize) {
        // Individual tile shading (subtle variations in off-white / light beige)
        const shade = 210 + Math.floor((Math.sin(x * 12.3 + y * 7.1) + Math.cos(x * 3.4)) * 14);
        const redShade = Math.min(245, shade + 2);
        const greenShade = Math.min(240, shade);
        const blueShade = Math.max(180, shade - 10);

        ctx.fillStyle = `rgb(${redShade}, ${greenShade}, ${blueShade})`;
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        // Dirty water smudge or mold on some tiles
        if (Math.random() > 0.5) {
          ctx.fillStyle = 'rgba(70, 60, 48, 0.18)';
          ctx.beginPath();
          ctx.arc(x + tileSize * (0.3 + Math.random() * 0.4), y + tileSize * (0.3 + Math.random() * 0.4), Math.random() * 14 + 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Small grime spots in tile corners
        ctx.fillStyle = 'rgba(30, 24, 18, 0.35)';
        ctx.fillRect(x + 2, y + 2, 6, 6);
      }
    }

    // Dark dirty grout lines
    ctx.strokeStyle = '#2b2722';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 512; i += tileSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }

    // Cockroach / insect silhouettes scattered on tiles (matching the reference photo!)
    const roachSpots = [
      { x: 95, y: 130, angle: 0.6 },
      { x: 260, y: 75, angle: -0.8 },
      { x: 395, y: 190, angle: 1.4 },
      { x: 180, y: 310, angle: -0.3 },
      { x: 440, y: 380, angle: 0.9 },
      { x: 110, y: 440, angle: -1.2 },
      { x: 320, y: 470, angle: 2.1 },
    ];

    roachSpots.forEach((r) => {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.angle);

      // Body (oval)
      ctx.fillStyle = '#1c1008';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(0, -11, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Legs
      ctx.strokeStyle = '#180d06';
      ctx.lineWidth = 1.2;
      for (let leg = -1; leg <= 1; leg++) {
        // Left legs
        ctx.beginPath();
        ctx.moveTo(-4, leg * 6);
        ctx.lineTo(-12, leg * 7 - 2);
        ctx.stroke();
        // Right legs
        ctx.beginPath();
        ctx.moveTo(4, leg * 6);
        ctx.lineTo(12, leg * 7 - 2);
        ctx.stroke();
      }

      // Antennae
      ctx.beginPath();
      ctx.moveTo(-2, -13);
      ctx.lineTo(-9, -24);
      ctx.moveTo(2, -13);
      ctx.lineTo(9, -24);
      ctx.stroke();

      ctx.restore();
    });

    // Dark water drippings / streaks from ceiling
    for (let s = 0; s < 6; s++) {
      const sx = 60 + s * 75 + Math.random() * 20;
      const grad = ctx.createLinearGradient(sx, 0, sx, 320);
      grad.addColorStop(0, 'rgba(40, 32, 22, 0.7)');
      grad.addColorStop(0.6, 'rgba(60, 48, 35, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(sx, 0, 8, 320);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  /**
   * Vintage Black and White Mosaic Floor Tile (matching reference photo)
   */
  public static createBathroomFloorMosaicTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base dirty grout
    ctx.fillStyle = '#22201e';
    ctx.fillRect(0, 0, 512, 512);

    const step = 32;
    for (let x = 0; x < 512; x += step) {
      for (let y = 0; y < 512; y += step) {
        // White octagonal / square mosaic tile
        const isBlackDot = (x / step) % 2 === 0 && (y / step) % 2 === 0;

        if (isBlackDot) {
          // Small black accent dot
          ctx.fillStyle = '#141416';
          ctx.fillRect(x + 4, y + 4, step - 8, step - 8);
        } else {
          // Off-white mosaic tile with grunge
          const w = 215 + Math.floor((Math.random() - 0.5) * 16);
          ctx.fillStyle = `rgb(${w}, ${w - 4}, ${w - 10})`;
          ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
        }
      }
    }

    // Water stains and muddy footsteps on the floor
    for (let p = 0; p < 8; p++) {
      ctx.fillStyle = 'rgba(25, 18, 12, 0.4)';
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * 512,
        Math.random() * 512,
        30 + Math.random() * 50,
        20 + Math.random() * 30,
        Math.random() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  /**
   * Water heater / Boiler label ("Postmeslip")
   */
  public static createWaterHeaterTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Enameled off-white metal
    ctx.fillStyle = '#dedacf';
    ctx.fillRect(0, 0, 512, 512);

    // Rust & grime stains
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = 'rgba(120, 80, 50, 0.05)';
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Brand "Postmeslip" script on upper right (from reference photo)
    ctx.font = 'italic bold 28px sans-serif';
    ctx.fillStyle = '#3a3834';
    ctx.fillText('Postmeslip', 310, 110);

    // Temperature panel (black oval with dials)
    ctx.fillStyle = '#1c1c1e';
    ctx.beginPath();
    ctx.roundRect(380, 240, 75, 140, 20);
    ctx.fill();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Two dial knobs
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(417, 280, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(417, 340, 18, 0, Math.PI * 2);
    ctx.fill();

    // Red LED
    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    ctx.arc(417, 252, 4, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /**
   * Moldy shower curtain texture
   */
  public static createShowerCurtainTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dirty plastic translucent tone
    ctx.fillStyle = '#9c9a92';
    ctx.fillRect(0, 0, 512, 512);

    // Vertical curtain folds / shadow wrinkles
    for (let x = 0; x < 512; x += 32) {
      const grad = ctx.createLinearGradient(x, 0, x + 32, 0);
      grad.addColorStop(0, 'rgba(40, 40, 36, 0.6)');
      grad.addColorStop(0.5, 'rgba(180, 178, 170, 0.3)');
      grad.addColorStop(1, 'rgba(30, 30, 26, 0.7)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 32, 512);
    }

    // Mildew and mold at the bottom
    const moldGrad = ctx.createLinearGradient(0, 300, 0, 512);
    moldGrad.addColorStop(0, 'rgba(20, 35, 25, 0.0)');
    moldGrad.addColorStop(0.7, 'rgba(25, 45, 30, 0.6)');
    moldGrad.addColorStop(1, 'rgba(15, 30, 20, 0.9)');
    ctx.fillStyle = moldGrad;
    ctx.fillRect(0, 300, 512, 212);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Subtle broken tile texture that blends seamlessly with the white tiled wall
   * Has fine hairline cracks and a chipped corner, NOT obvious from across the room!
   */
  public static createSubtleBrokenTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Same dirty white porcelain as the surrounding tiles
    ctx.fillStyle = '#dcdad1';
    ctx.fillRect(0, 0, 256, 256);

    // Dark dirty grout border around the tile
    ctx.strokeStyle = '#2b2722';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 250, 250);

    // Subtle fine spiderweb cracks (realistic hairline fractures)
    ctx.strokeStyle = '#3d3730';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(40, 30);
    ctx.lineTo(95, 110);
    ctx.lineTo(145, 135);
    ctx.lineTo(215, 220);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(95, 110);
    ctx.lineTo(60, 185);
    ctx.lineTo(40, 230);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(145, 135);
    ctx.lineTo(220, 120);
    ctx.stroke();

    // Chipped corner with exposed dark plaster
    ctx.fillStyle = '#1c1916';
    ctx.beginPath();
    ctx.moveTo(190, 256);
    ctx.lineTo(256, 190);
    ctx.lineTo(256, 256);
    ctx.closePath();
    ctx.fill();

    // Dried blood stain around the crack
    ctx.fillStyle = 'rgba(100, 20, 20, 0.25)';
    ctx.beginPath();
    ctx.ellipse(140, 140, 45, 25, 0.4, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }
}
