import * as THREE from 'three';
import { LevelTheme } from '../types.ts';

export interface RoadChunk {
  group: THREE.Group;
  zPos: number;
  hasBridge: boolean;
  hasTunnel: boolean;
  hasCheckpoint: boolean;
  hasFinishLine: boolean;
  streetlights: THREE.Mesh[];
}

export class EnvironmentManager {
  public group: THREE.Group;
  private roadChunks: RoadChunk[] = [];
  public chunkLength = 100;
  private totalChunks = 9;
  public roadWidth = 16.0; // 4 lanes (~4m each)
  public currentTheme: LevelTheme = 'highway';
  public targetDistance = 0;

  // Materials
  public roadMaterial: THREE.MeshStandardMaterial;
  private curbMaterial: THREE.MeshStandardMaterial;
  private guardrailMaterial: THREE.MeshStandardMaterial;
  private concreteMaterial: THREE.MeshStandardMaterial;
  private foliageMaterial: THREE.MeshStandardMaterial;
  private trunkMaterial: THREE.MeshStandardMaterial;
  private buildingMatA: THREE.MeshStandardMaterial;
  private buildingMatB: THREE.MeshStandardMaterial;
  private streetlightBulbMat: THREE.MeshStandardMaterial;
  private checkpointGlowMat: THREE.MeshStandardMaterial;
  private finishGlowMat: THREE.MeshStandardMaterial;
  private desertSandMat: THREE.MeshStandardMaterial;
  private desertRockMat: THREE.MeshStandardMaterial;
  private oceanWaterMat: THREE.MeshStandardMaterial;
  private racingKerbMat: THREE.MeshStandardMaterial;
  private checkeredMaterial: THREE.MeshStandardMaterial;

  private roadTexture: THREE.CanvasTexture;
  private kerbTexture: THREE.CanvasTexture;
  private checkeredTexture: THREE.CanvasTexture;
  private horizonGroup: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'environment';

    this.roadTexture = this.generateRoadTexture();
    this.kerbTexture = this.generateKerbTexture();
    this.checkeredTexture = this.generateCheckeredTexture();

    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: this.roadTexture,
      roughness: 0.78,
      metalness: 0.12,
    });

    this.curbMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.85,
      metalness: 0.1,
    });

    this.guardrailMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.8,
    });

    this.concreteMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.8,
      metalness: 0.05,
    });

    this.trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a3825,
      roughness: 0.9,
    });

    this.buildingMatA = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.65,
    });

    this.buildingMatB = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.8,
    });

    this.streetlightBulbMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.8,
    });

    this.checkpointGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.5,
    });

    this.finishGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xeab308,
      emissiveIntensity: 2.8,
    });

    this.desertSandMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.95,
      metalness: 0.05,
    });

    this.desertRockMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });

    this.oceanWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.85,
    });

    this.racingKerbMat = new THREE.MeshStandardMaterial({
      map: this.kerbTexture,
      roughness: 0.7,
      metalness: 0.1,
    });

    this.checkeredMaterial = new THREE.MeshStandardMaterial({
      map: this.checkeredTexture,
      roughness: 0.6,
      metalness: 0.2,
    });

    this.horizonGroup = new THREE.Group();
    this.horizonGroup.name = 'horizon_scenery';
    this.group.add(this.horizonGroup);

    this.reset(0, 'highway', 0);
  }

  private generateCheckeredTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const tileSize = 32;
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 128; y += tileSize) {
        const isWhite = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        ctx.fillStyle = isWhite ? '#ffffff' : '#090d16';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private generateRoadTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Asphalt dark noise
    ctx.fillStyle = '#181b22';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle realistic bitumen aggregate grain
    ctx.fillStyle = '#262a34';
    for (let i = 0; i < 5000; i++) {
      const rx = Math.random() * 1024;
      const ry = Math.random() * 1024;
      ctx.fillRect(rx, ry, 2, 2);
    }

    // Outer solid white shoulder lines
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(80, 0, 16, 1024);
    ctx.fillRect(928, 0, 16, 1024);

    // Center double yellow lines with rumble spacing
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(503, 0, 8, 1024);
    ctx.fillRect(521, 0, 8, 1024);

    // Dashed white lane dividing lines (4 lanes total)
    ctx.fillStyle = '#f8fafc';
    const dashLength = 64;
    const gapLength = 64;
    for (let y = 0; y < 1024; y += dashLength + gapLength) {
      // Lane 1 divider
      ctx.fillRect(296, y, 10, dashLength);
      // Lane 3 divider
      ctx.fillRect(728, y, 10, dashLength);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 10);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private generateKerbTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Red and white alternating racing kerb stripes
    const stripeH = 32;
    for (let y = 0; y < 256; y += stripeH * 2) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, y, 128, stripeH);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, y + stripeH, 128, stripeH);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Resets road generation cleanly centered around startZ.
   * Clears old chunks, recreates fresh ones with the requested theme,
   * and sets up checkpoints & finish line.
   */
  public reset(startZ = 0, theme: LevelTheme = 'highway', targetDistance = 0) {
    this.currentTheme = theme;
    this.targetDistance = targetDistance;

    // Remove existing chunks
    for (const chunk of this.roadChunks) {
      this.group.remove(chunk.group);
      // Clean up children
      while (chunk.group.children.length > 0) {
        chunk.group.remove(chunk.group.children[0]);
      }
    }
    this.roadChunks = [];

    // Rebuild horizon scenery according to theme
    this.rebuildHorizon(startZ);

    // Initial spawn: 3 chunks behind startZ, 6 chunks ahead
    // e.g. startZ = 0 -> chunks from -200 to +600
    for (let i = -2; i < this.totalChunks - 2; i++) {
      const zPos = startZ + i * this.chunkLength;
      const chunk = this.buildChunk(zPos);
      this.roadChunks.push(chunk);
      this.group.add(chunk.group);
    }
  }

  private rebuildHorizon(anchorZ: number) {
    while (this.horizonGroup.children.length > 0) {
      this.horizonGroup.remove(this.horizonGroup.children[0]);
    }

    if (this.currentTheme === 'mountain') {
      const mountainGeo = new THREE.ConeGeometry(90, 160, 5);
      for (let i = -9; i <= 9; i++) {
        const m = new THREE.Mesh(mountainGeo, this.concreteMaterial);
        const scale = 0.9 + Math.random() * 0.9;
        m.scale.set(scale, scale * (0.8 + Math.random() * 0.6), scale);
        m.position.set(i * 95 + (Math.random() - 0.5) * 35, 55, anchorZ + 420 + (Math.random() - 0.5) * 80);
        this.horizonGroup.add(m);

        const mBack = new THREE.Mesh(mountainGeo, this.concreteMaterial);
        mBack.scale.copy(m.scale);
        mBack.position.set(i * 95 + (Math.random() - 0.5) * 35, 55, anchorZ - 420 + (Math.random() - 0.5) * 80);
        this.horizonGroup.add(mBack);
      }
    } else if (this.currentTheme === 'desert') {
      const mesaGeo = new THREE.CylinderGeometry(40, 70, 50, 6);
      for (let i = -8; i <= 8; i++) {
        const mesa = new THREE.Mesh(mesaGeo, this.desertRockMat);
        mesa.position.set(i * 120 + (Math.random() - 0.5) * 40, 20, anchorZ + 400 + (Math.random() - 0.5) * 60);
        this.horizonGroup.add(mesa);
      }
    } else if (this.currentTheme === 'city' || this.currentTheme === 'night_city') {
      const bGeo = new THREE.BoxGeometry(35, 110, 35);
      for (let i = -8; i <= 8; i++) {
        const b = new THREE.Mesh(bGeo, Math.random() > 0.5 ? this.buildingMatA : this.buildingMatB);
        b.position.set(i * 65 + (Math.random() - 0.5) * 20, 50, anchorZ + 450);
        this.horizonGroup.add(b);
      }
    }
  }

  private buildChunk(zPos: number): RoadChunk {
    const chunkGroup = new THREE.Group();
    chunkGroup.position.z = zPos;
    const streetlights: THREE.Mesh[] = [];

    // Check if this chunk hosts a 500m Checkpoint or Finish Line
    const chunkMidZ = zPos;
    const isFinishLine = this.targetDistance > 0 && Math.abs(chunkMidZ - this.targetDistance) < this.chunkLength * 0.5;
    const isCheckpoint =
      !isFinishLine &&
      chunkMidZ > 100 &&
      (Math.round(chunkMidZ) % 500 === 0 || Math.abs(chunkMidZ % 500) < this.chunkLength * 0.45);

    // 1. Main Asphalt Surface
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.chunkLength);
    const roadMesh = new THREE.Mesh(roadGeo, this.roadMaterial);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.receiveShadow = true;
    chunkGroup.add(roadMesh);

    // 2. Concrete Curbs / Racing Kerbs
    const curbGeo = new THREE.BoxGeometry(1.2, 0.22, this.chunkLength);
    const useKerb = this.currentTheme === 'pro_championship' || this.currentTheme === 'sunset_supercar';
    const activeCurbMat = useKerb ? this.racingKerbMat : this.curbMaterial;

    const curbL = new THREE.Mesh(curbGeo, activeCurbMat);
    curbL.position.set(-(this.roadWidth * 0.5 + 0.6), 0.1, 0);
    curbL.receiveShadow = true;

    const curbR = new THREE.Mesh(curbGeo, activeCurbMat);
    curbR.position.set(this.roadWidth * 0.5 + 0.6, 0.1, 0);
    curbR.receiveShadow = true;
    chunkGroup.add(curbL, curbR);

    // 3. Metallic Guardrails
    const railGeo = new THREE.BoxGeometry(0.12, 0.35, this.chunkLength);
    const railLeft = new THREE.Mesh(railGeo, this.guardrailMaterial);
    railLeft.position.set(-(this.roadWidth * 0.5 + 1.2), 0.45, 0);
    const railRight = new THREE.Mesh(railGeo, this.guardrailMaterial);
    railRight.position.set(this.roadWidth * 0.5 + 1.2, 0.45, 0);
    chunkGroup.add(railLeft, railRight);

    // Guardrail posts every 12 meters
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6);
    for (let pz = -this.chunkLength / 2 + 6; pz < this.chunkLength / 2; pz += 12) {
      const pL = new THREE.Mesh(postGeo, this.guardrailMaterial);
      pL.position.set(-(this.roadWidth * 0.5 + 1.2), 0.3, pz);
      const pR = new THREE.Mesh(postGeo, this.guardrailMaterial);
      pR.position.set(this.roadWidth * 0.5 + 1.2, 0.3, pz);
      chunkGroup.add(pL, pR);
    }

    // 4. Biome-specific roadside ground planes
    this.addBiomeGround(chunkGroup);

    // 5. Streetlights every 35 meters
    const needsStreetlights =
      this.currentTheme === 'night_city' ||
      this.currentTheme === 'city' ||
      this.currentTheme === 'rainy' ||
      this.currentTheme === 'pro_championship' ||
      this.currentTheme === 'highway';

    if (needsStreetlights) {
      for (let sz = -this.chunkLength / 2 + 15; sz < this.chunkLength / 2; sz += 35) {
        const poleGeo = new THREE.CylinderGeometry(0.09, 0.13, 6.5, 8);
        const poleMat = this.guardrailMaterial;

        // Left streetlight
        const poleL = new THREE.Mesh(poleGeo, poleMat);
        poleL.position.set(-(this.roadWidth * 0.5 + 2.0), 3.25, sz);
        const armLGeo = new THREE.BoxGeometry(2.4, 0.08, 0.08);
        const armL = new THREE.Mesh(armLGeo, poleMat);
        armL.position.set(-(this.roadWidth * 0.5 + 0.8), 6.5, sz);
        const bulbLGeo = new THREE.BoxGeometry(0.7, 0.12, 0.35);
        const bulbL = new THREE.Mesh(bulbLGeo, this.streetlightBulbMat);
        bulbL.position.set(-(this.roadWidth * 0.5 + 0.2), 6.4, sz);
        chunkGroup.add(poleL, armL, bulbL);
        streetlights.push(bulbL);

        // Right streetlight
        const poleR = new THREE.Mesh(poleGeo, poleMat);
        poleR.position.set(this.roadWidth * 0.5 + 2.0, 3.25, sz);
        const armR = new THREE.Mesh(armLGeo, poleMat);
        armR.position.set(this.roadWidth * 0.5 + 0.8, 6.5, sz);
        const bulbR = new THREE.Mesh(bulbLGeo, this.streetlightBulbMat);
        bulbR.position.set(this.roadWidth * 0.5 + 0.2, 6.4, sz);
        chunkGroup.add(poleR, armR, bulbR);
        streetlights.push(bulbR);
      }
    }

    // 6. Roadside Props (Trees, Skyscrapers, Desert Cacti, Palms, Grandstands)
    this.addBiomeProps(chunkGroup);

    // 7. Checkpoint Arch if matched
    if (isCheckpoint) {
      this.addCheckpointArch(chunkGroup, Math.round(chunkMidZ));
    }

    // 8. Finish Line Arch if matched
    if (isFinishLine) {
      this.addFinishLineArch(chunkGroup);
    }

    return {
      group: chunkGroup,
      zPos,
      hasBridge: false,
      hasTunnel: false,
      hasCheckpoint: isCheckpoint,
      hasFinishLine: isFinishLine,
      streetlights,
    };
  }

  private addBiomeGround(chunkGroup: THREE.Group) {
    if (this.currentTheme === 'coastal') {
      // Land on left side, Ocean water plane on right side
      const landGeo = new THREE.PlaneGeometry(80, this.chunkLength);
      const groundL = new THREE.Mesh(landGeo, this.foliageMaterial);
      groundL.rotation.x = -Math.PI / 2;
      groundL.position.set(-(this.roadWidth * 0.5 + 41.2), -0.05, 0);
      groundL.receiveShadow = true;

      const oceanGeo = new THREE.PlaneGeometry(160, this.chunkLength);
      const waterR = new THREE.Mesh(oceanGeo, this.oceanWaterMat);
      waterR.rotation.x = -Math.PI / 2;
      waterR.position.set(this.roadWidth * 0.5 + 81.2, -0.6, 0);
      chunkGroup.add(groundL, waterR);
    } else if (this.currentTheme === 'desert') {
      const terrainGeo = new THREE.PlaneGeometry(90, this.chunkLength);
      const groundL = new THREE.Mesh(terrainGeo, this.desertSandMat);
      groundL.rotation.x = -Math.PI / 2;
      groundL.position.set(-(this.roadWidth * 0.5 + 46.2), -0.05, 0);
      groundL.receiveShadow = true;
      const groundR = new THREE.Mesh(terrainGeo, this.desertSandMat);
      groundR.rotation.x = -Math.PI / 2;
      groundR.position.set(this.roadWidth * 0.5 + 46.2, -0.05, 0);
      groundR.receiveShadow = true;
      chunkGroup.add(groundL, groundR);
    } else {
      // Default turf or dark metropolitan ground
      const groundColor =
        this.currentTheme === 'night_city' || this.currentTheme === 'city'
          ? 0x0f172a
          : this.currentTheme === 'mountain'
          ? 0x1e293b
          : 0x142018;

      const terrainGeo = new THREE.PlaneGeometry(80, this.chunkLength);
      const terrainMat = new THREE.MeshStandardMaterial({
        color: groundColor,
        roughness: 0.95,
        metalness: 0.05,
      });

      const groundL = new THREE.Mesh(terrainGeo, terrainMat);
      groundL.rotation.x = -Math.PI / 2;
      groundL.position.set(-(this.roadWidth * 0.5 + 41.2), -0.05, 0);
      groundL.receiveShadow = true;
      const groundR = new THREE.Mesh(terrainGeo, terrainMat);
      groundR.rotation.x = -Math.PI / 2;
      groundR.position.set(this.roadWidth * 0.5 + 41.2, -0.05, 0);
      groundR.receiveShadow = true;
      chunkGroup.add(groundL, groundR);
    }
  }

  private addBiomeProps(chunkGroup: THREE.Group) {
    if (this.currentTheme === 'desert') {
      // Giant saguaro cacti & red rocks
      const cactusGeo = new THREE.CylinderGeometry(0.3, 0.35, 4.2, 6);
      const armGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.8, 6);
      const cactusMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

      for (let cz = -this.chunkLength / 2 + 12; cz < this.chunkLength / 2; cz += 28) {
        const cL = new THREE.Group();
        const trunkL = new THREE.Mesh(cactusGeo, cactusMat);
        trunkL.position.y = 2.1;
        const armL = new THREE.Mesh(armGeo, cactusMat);
        armL.position.set(0.6, 2.6, 0);
        armL.rotation.z = Math.PI / 3;
        cL.add(trunkL, armL);
        cL.position.set(-(this.roadWidth * 0.5 + 5 + Math.random() * 8), 0, cz);
        chunkGroup.add(cL);
      }
    } else if (this.currentTheme === 'city' || this.currentTheme === 'night_city' || this.currentTheme === 'heavy_traffic') {
      // Roadside skyscrapers
      for (let bz = -this.chunkLength / 2 + 18; bz < this.chunkLength / 2; bz += 38) {
        const bHeight = 30 + Math.random() * 50;
        const bWidth = 16 + Math.random() * 12;
        const bDepth = 16 + Math.random() * 12;
        const bMat = Math.random() > 0.5 ? this.buildingMatA : this.buildingMatB;
        const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);

        const bL = new THREE.Mesh(bGeo, bMat);
        bL.position.set(-(this.roadWidth * 0.5 + 22 + Math.random() * 6), bHeight * 0.5, bz);
        bL.castShadow = true;
        bL.receiveShadow = true;

        const bR = new THREE.Mesh(bGeo, bMat);
        bR.position.set(this.roadWidth * 0.5 + 22 + Math.random() * 6, bHeight * 0.5, bz + 10);
        bR.castShadow = true;
        bR.receiveShadow = true;
        chunkGroup.add(bL, bR);
      }
    } else if (this.currentTheme === 'coastal') {
      // Coastal palms on the left side
      const palmTrunkGeo = new THREE.CylinderGeometry(0.18, 0.32, 5.0, 6);
      const palmLeavesGeo = new THREE.ConeGeometry(2.8, 1.4, 6);
      for (let pz = -this.chunkLength / 2 + 15; pz < this.chunkLength / 2; pz += 30) {
        const trunk = new THREE.Mesh(palmTrunkGeo, this.trunkMaterial);
        trunk.position.set(-(this.roadWidth * 0.5 + 4.5), 2.5, pz);
        trunk.rotation.z = -0.15; // natural palm curve
        const leaves = new THREE.Mesh(palmLeavesGeo, this.foliageMaterial);
        leaves.position.set(trunk.position.x - 0.4, 5.0, pz);
        chunkGroup.add(trunk, leaves);
      }
    } else {
      // Default highway / mountain: lush green pine trees
      const treeTrunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 2.5, 6);
      const treeFoliageGeo = new THREE.ConeGeometry(2.2, 5.0, 6);

      for (let tz = -this.chunkLength / 2 + 10; tz < this.chunkLength / 2; tz += 24) {
        const trunkL = new THREE.Mesh(treeTrunkGeo, this.trunkMaterial);
        trunkL.position.set(-(this.roadWidth * 0.5 + 5.5 + Math.random() * 6), 1.25, tz);
        const folL = new THREE.Mesh(treeFoliageGeo, this.foliageMaterial);
        folL.position.set(trunkL.position.x, 4.0, trunkL.position.z);
        folL.castShadow = true;

        const trunkR = new THREE.Mesh(treeTrunkGeo, this.trunkMaterial);
        trunkR.position.set(this.roadWidth * 0.5 + 5.5 + Math.random() * 6, 1.25, tz);
        const folR = new THREE.Mesh(treeFoliageGeo, this.foliageMaterial);
        folR.position.set(trunkR.position.x, 4.0, trunkR.position.z);
        folR.castShadow = true;
        chunkGroup.add(trunkL, folL, trunkR, folR);
      }
    }
  }

  private addCheckpointArch(chunkGroup: THREE.Group, distanceMeters: number) {
    const archGroup = new THREE.Group();
    archGroup.name = 'checkpoint_arch';

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.8,
    });

    // Vertical pillars
    const pillarGeo = new THREE.BoxGeometry(0.8, 7.5, 1.0);
    const pL = new THREE.Mesh(pillarGeo, frameMat);
    pL.position.set(-(this.roadWidth * 0.5 + 1.2), 3.75, 0);
    const pR = new THREE.Mesh(pillarGeo, frameMat);
    pR.position.set(this.roadWidth * 0.5 + 1.2, 3.75, 0);

    // Cross beam
    const beamGeo = new THREE.BoxGeometry(this.roadWidth + 3.2, 1.2, 1.2);
    const beam = new THREE.Mesh(beamGeo, frameMat);
    beam.position.set(0, 7.2, 0);

    // Glowing Neon Banner
    const bannerGeo = new THREE.BoxGeometry(11, 0.6, 0.2);
    const banner = new THREE.Mesh(bannerGeo, this.checkpointGlowMat);
    banner.position.set(0, 6.4, 0.6);

    archGroup.add(pL, pR, beam, banner);
    chunkGroup.add(archGroup);
  }

  private addFinishLineArch(chunkGroup: THREE.Group) {
    const finishGroup = new THREE.Group();
    finishGroup.name = 'finish_line_arch';

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.22,
      metalness: 0.9,
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x111215,
      roughness: 0.4,
      metalness: 0.7,
    });

    const ledGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 3.2,
      roughness: 0.1,
    });

    const greenTimingMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x22c55e,
      emissiveIntensity: 3.0,
    });

    // Grand arch composite towers (Left & Right)
    const towerGeo = new THREE.BoxGeometry(1.6, 9.6, 2.0);
    const pL = new THREE.Mesh(towerGeo, carbonMat);
    pL.position.set(-(this.roadWidth * 0.5 + 1.8), 4.8, 0);
    pL.castShadow = true;
    const pR = new THREE.Mesh(towerGeo, carbonMat);
    pR.position.set(this.roadWidth * 0.5 + 1.8, 4.8, 0);
    pR.castShadow = true;

    // Tower gold accent stripes
    const accentGeo = new THREE.BoxGeometry(1.64, 0.4, 2.04);
    for (let y = 1.5; y <= 8.5; y += 2.0) {
      const aL = new THREE.Mesh(accentGeo, goldMat);
      aL.position.set(pL.position.x, y, 0);
      const aR = new THREE.Mesh(accentGeo, goldMat);
      aR.position.set(pR.position.x, y, 0);
      finishGroup.add(aL, aR);
    }

    // Overhead Championship Cross Gantry Truss
    const beamGeo = new THREE.BoxGeometry(this.roadWidth + 5.2, 1.8, 2.0);
    const beam = new THREE.Mesh(beamGeo, carbonMat);
    beam.position.set(0, 9.2, 0);
    beam.castShadow = true;

    // Gold Top Cap on Gantry
    const capGeo = new THREE.BoxGeometry(this.roadWidth + 5.4, 0.35, 2.1);
    const cap = new THREE.Mesh(capGeo, goldMat);
    cap.position.set(0, 10.2, 0);

    // Glowing Championship Digital LED Board: "FINISH"
    const boardGeo = new THREE.BoxGeometry(14, 1.3, 0.25);
    const board = new THREE.Mesh(boardGeo, ledGlowMat);
    board.position.set(0, 8.8, 1.05);

    // Overhead Timing Lights Bar (Green & Amber Race LEDs)
    const lightBarGeo = new THREE.BoxGeometry(10, 0.3, 0.3);
    const lightBar = new THREE.Mesh(lightBarGeo, carbonMat);
    lightBar.position.set(0, 7.8, 1.05);
    for (let lx = -4.5; lx <= 4.5; lx += 1.5) {
      const ledGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const led = new THREE.Mesh(ledGeo, greenTimingMat);
      led.position.set(lx, 7.8, 1.25);
      finishGroup.add(led);
    }

    // Overhead Stadium Floodlight Housings pointing down at the finish line
    for (const fx of [-6.0, -2.0, 2.0, 6.0]) {
      const lampGeo = new THREE.BoxGeometry(0.9, 0.4, 0.6);
      const lamp = new THREE.Mesh(lampGeo, goldMat);
      lamp.position.set(fx, 8.1, 0);
      lamp.rotation.x = Math.PI / 4;
      finishGroup.add(lamp);
    }

    // Dual Checkered Racing Banners on Pylons
    const flagGeo = new THREE.PlaneGeometry(1.8, 3.2);
    const flagL = new THREE.Mesh(flagGeo, this.checkeredMaterial);
    flagL.position.set(pL.position.x, 11.2, 0);
    flagL.rotation.y = -0.2;
    const flagR = new THREE.Mesh(flagGeo, this.checkeredMaterial);
    flagR.position.set(pR.position.x, 11.2, 0);
    flagR.rotation.y = 0.2;

    // Authentic Black & White Checkered Finish Line Strip on Asphalt Surface
    const finishStripGeo = new THREE.PlaneGeometry(this.roadWidth, 4.0);
    const finishStrip = new THREE.Mesh(finishStripGeo, this.checkeredMaterial);
    finishStrip.rotation.x = -Math.PI / 2;
    finishStrip.position.set(0, 0.03, 0);
    finishStrip.receiveShadow = true;

    finishGroup.add(pL, pR, beam, cap, board, lightBar, flagL, flagR, finishStrip);
    chunkGroup.add(finishGroup);
  }

  /**
   * Recycles road chunks seamlessly as the player drives forward along +Z.
   * Guarantees that chunks are always spawned ahead and road is never empty.
   */
  public update(playerZ: number) {
    const minZ = playerZ - this.chunkLength * 2.5;

    // Check if any chunk is behind minZ
    for (const chunk of this.roadChunks) {
      if (chunk.zPos < minZ) {
        // Find highest current zPos
        let maxZ = -Infinity;
        for (const c of this.roadChunks) {
          if (c.zPos > maxZ) maxZ = c.zPos;
        }

        const newZ = maxZ + this.chunkLength;
        chunk.zPos = newZ;
        chunk.group.position.z = newZ;

        // Recheck if this recycled chunk hits a checkpoint or finish line
        const isFinishLine = this.targetDistance > 0 && Math.abs(newZ - this.targetDistance) < this.chunkLength * 0.5;
        const isCheckpoint =
          !isFinishLine && newZ > 100 && (Math.round(newZ) % 500 === 0 || Math.abs(newZ % 500) < this.chunkLength * 0.45);

        // Update arches if needed
        const existingCheckpointArch = chunk.group.getObjectByName('checkpoint_arch');
        if (existingCheckpointArch) chunk.group.remove(existingCheckpointArch);
        const existingFinishArch = chunk.group.getObjectByName('finish_line_arch');
        if (existingFinishArch) chunk.group.remove(existingFinishArch);

        if (isCheckpoint) {
          this.addCheckpointArch(chunk.group, Math.round(newZ));
        }
        if (isFinishLine) {
          this.addFinishLineArch(chunk.group);
        }
      }
    }
  }

  /**
   * Safe checkpoint finder:
   * Returns guaranteed safe road coordinates on the asphalt surface.
   */
  public getNearestSafeCheckpoint(currentZ: number): { x: number; y: number; z: number } {
    if (currentZ < 450) {
      return { x: 1.85, y: 0, z: 0 };
    }
    const safeZ = Math.floor(currentZ / 500) * 500;
    return { x: 1.85, y: 0, z: safeZ };
  }

  public setWetRoad(isWet: boolean) {
    this.roadMaterial.roughness = isWet ? 0.2 : 0.78;
    this.roadMaterial.metalness = isWet ? 0.4 : 0.12;
    this.roadMaterial.needsUpdate = true;
  }
}
