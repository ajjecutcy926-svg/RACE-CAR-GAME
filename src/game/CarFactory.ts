import * as THREE from 'three';

export interface CarModelInstance {
  group: THREE.Group;
  frontWheels: THREE.Group[];
  allWheels: THREE.Group[];
  exhaustPipes: THREE.Vector3[];
  tailLightMaterials: THREE.MeshStandardMaterial[];
  headLightMaterials: THREE.MeshStandardMaterial[];
  bodyMaterials: THREE.MeshStandardMaterial[];
  carConfigId: string;
}

export class CarFactory {
  // Shared reusable geometries and materials for peak performance & low draw calls
  private static tireGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.28, 16);
  private static rimGeometry = new THREE.CylinderGeometry(0.24, 0.24, 0.29, 10);
  private static spokeGeometry = new THREE.BoxGeometry(0.04, 0.42, 0.3);
  private static caliperGeometry = new THREE.BoxGeometry(0.12, 0.16, 0.12);

  private static tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.85,
    metalness: 0.1,
  });

  private static rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xe4e4e7,
    roughness: 0.16,
    metalness: 0.96,
  });

  private static carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x111215,
    roughness: 0.38,
    metalness: 0.65,
  });

  private static chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.06,
    metalness: 0.98,
  });

  private static glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.03,
    metalness: 0.95,
  });

  private static interiorMaterial = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.7,
  });

  /**
   * Helper to build a detailed wheel assembly (Tire + Multi-spoke Rim + Disc + Brake Caliper)
   */
  private static createSupercarWheel(caliperColor = 0xdc2626): THREE.Group {
    const wheel = new THREE.Group();

    // Tire
    const tire = new THREE.Mesh(this.tireGeometry, this.tireMaterial);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheel.add(tire);

    // Rim Hub
    const rim = new THREE.Mesh(this.rimGeometry, this.rimMaterial);
    rim.rotation.z = Math.PI / 2;
    wheel.add(rim);

    // Rim Spokes (5-twin spoke style)
    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(this.spokeGeometry, this.rimMaterial);
      spoke.rotation.x = (i * Math.PI) / 2.5;
      wheel.add(spoke);
    }

    // Brake Disc
    const discGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.06, 12);
    const discMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.35, metalness: 0.85 });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.z = Math.PI / 2;
    wheel.add(disc);

    // Performance Brake Caliper
    const caliperMat = new THREE.MeshStandardMaterial({
      color: caliperColor,
      roughness: 0.3,
      metalness: 0.6,
    });
    const caliper = new THREE.Mesh(this.caliperGeometry, caliperMat);
    caliper.position.set(0, 0.14, 0);
    wheel.add(caliper);

    return wheel;
  }

  /**
   * Helper to add aerodynamic side mirrors
   */
  private static addSideMirrors(group: THREE.Group, bodyMat: THREE.Material, y: number, z: number, width: number) {
    const mirrorGeo = new THREE.BoxGeometry(0.24, 0.12, 0.16);
    const stalkGeo = new THREE.BoxGeometry(0.12, 0.04, 0.04);

    // Left mirror
    const ml = new THREE.Mesh(mirrorGeo, bodyMat);
    ml.position.set(-(width * 0.5 + 0.15), y, z);
    const sl = new THREE.Mesh(stalkGeo, this.carbonMaterial);
    sl.position.set(-(width * 0.5 + 0.06), y - 0.02, z);
    group.add(ml, sl);

    // Right mirror
    const mr = new THREE.Mesh(mirrorGeo, bodyMat);
    mr.position.set(width * 0.5 + 0.15, y, z);
    const sr = new THREE.Mesh(stalkGeo, this.carbonMaterial);
    sr.position.set(width * 0.5 + 0.06, y - 0.02, z);
    group.add(mr, sr);
  }

  /**
   * Creates one of the 6 detailed Supercars based on carId
   */
  public static createPlayerCar(carId: string, colorHex: number = 0xdc2626): CarModelInstance {
    const group = new THREE.Group();
    group.name = `car_${carId}`;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.14,
      metalness: 0.88,
    });

    const tailLightMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0xb91c1c,
      emissiveIntensity: 2.0,
      roughness: 0.1,
    });

    const headLightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf0f9ff,
      emissiveIntensity: 2.4,
      roughness: 0.05,
    });

    const frontWheels: THREE.Group[] = [];
    const allWheels: THREE.Group[] = [];
    const exhaustPipes: THREE.Vector3[] = [];
    const bodyMaterials = [bodyMat];

    const groundClearance = 0.35;
    let halfWidth = 0.98;
    let frontZ = 1.45;
    let rearZ = -1.45;
    let caliperColor = 0xdc2626;

    // Build specific 3D model
    if (carId === 'bmw_m4') {
      // ==========================================
      // 1. BMW M4 COMPETITION
      // ==========================================
      halfWidth = 0.96;
      frontZ = 1.42;
      rearZ = -1.42;
      caliperColor = 0x2563eb; // M Blue calipers

      // Primary: Muscular Coupe Body
      const lowerBodyGeo = new THREE.BoxGeometry(1.92, 0.46, 4.4);
      const lowerBody = new THREE.Mesh(lowerBodyGeo, bodyMat);
      lowerBody.position.y = groundClearance + 0.24;
      lowerBody.castShadow = true;
      group.add(lowerBody);

      // Flared Front & Rear Wheel Fenders
      const fenderFGeo = new THREE.BoxGeometry(1.98, 0.42, 1.2);
      const fenderF = new THREE.Mesh(fenderFGeo, bodyMat);
      fenderF.position.set(0, groundClearance + 0.24, 1.42);
      group.add(fenderF);

      const fenderRGeo = new THREE.BoxGeometry(2.0, 0.44, 1.3);
      const fenderR = new THREE.Mesh(fenderRGeo, bodyMat);
      fenderR.position.set(0, groundClearance + 0.25, -1.42);
      group.add(fenderR);

      // Cabin / Greenhouse Glass
      const cabinGeo = new THREE.BoxGeometry(1.54, 0.46, 2.3);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMaterial);
      cabin.position.set(0, groundClearance + 0.65, -0.15);
      group.add(cabin);

      // Iconic Carbon-Fiber Roof with central aerodynamic channel
      const roofGeo = new THREE.BoxGeometry(1.46, 0.06, 1.8);
      const roof = new THREE.Mesh(roofGeo, this.carbonMaterial);
      roof.position.set(0, groundClearance + 0.88, -0.15);
      group.add(roof);

      // Iconic Tall Vertical Twin-Kidney Grille
      const kidneyGeo = new THREE.BoxGeometry(0.32, 0.42, 0.08);
      const kLeft = new THREE.Mesh(kidneyGeo, this.carbonMaterial);
      kLeft.position.set(-0.2, groundClearance + 0.26, 2.22);
      const kRight = new THREE.Mesh(kidneyGeo, this.carbonMaterial);
      kRight.position.set(0.2, groundClearance + 0.26, 2.22);
      group.add(kLeft, kRight);

      // Front Carbon Splitter
      const splitterGeo = new THREE.BoxGeometry(1.96, 0.06, 0.35);
      const splitter = new THREE.Mesh(splitterGeo, this.carbonMaterial);
      splitter.position.set(0, groundClearance + 0.05, 2.12);
      group.add(splitter);

      // Rear Trunk Lip Spoiler
      const lipGeo = new THREE.BoxGeometry(1.52, 0.06, 0.2);
      const lip = new THREE.Mesh(lipGeo, this.carbonMaterial);
      lip.position.set(0, groundClearance + 0.52, -2.18);
      group.add(lip);

      // Rear Diffuser with Quad Exhausts (2 Left, 2 Right)
      const diffGeo = new THREE.BoxGeometry(1.6, 0.2, 0.3);
      const diff = new THREE.Mesh(diffGeo, this.carbonMaterial);
      diff.position.set(0, groundClearance + 0.12, -2.15);
      group.add(diff);

      exhaustPipes.push(new THREE.Vector3(-0.48, groundClearance + 0.16, -2.25));
      exhaustPipes.push(new THREE.Vector3(-0.34, groundClearance + 0.16, -2.25));
      exhaustPipes.push(new THREE.Vector3(0.34, groundClearance + 0.16, -2.25));
      exhaustPipes.push(new THREE.Vector3(0.48, groundClearance + 0.16, -2.25));

      for (const p of exhaustPipes) {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8), this.chromeMaterial);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.copy(p);
        group.add(pipe);
      }

      // BMW Signature Dual-L Headlights
      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.06), headLightMat);
      hl1.position.set(-0.62, groundClearance + 0.34, 2.2);
      const hl2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.06), headLightMat);
      hl2.position.set(0.62, groundClearance + 0.34, 2.2);
      group.add(hl1, hl2);

      // Taillights
      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.06), tailLightMat);
      tl1.position.set(-0.64, groundClearance + 0.42, -2.2);
      const tl2 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.06), tailLightMat);
      tl2.position.set(0.64, groundClearance + 0.42, -2.2);
      group.add(tl1, tl2);

      this.addSideMirrors(group, bodyMat, groundClearance + 0.58, 0.7, 1.54);
    } else if (carId === 'lamborghini_revuelto') {
      // ==========================================
      // 2. LAMBORGHINI REVUELTO
      // ==========================================
      halfWidth = 1.05;
      frontZ = 1.48;
      rearZ = -1.45;
      caliperColor = 0xf59e0b; // Giallo yellow/orange

      // Wedge Aerodynamic Monocoque
      const wedgeGeo = new THREE.BoxGeometry(2.08, 0.38, 4.6);
      const wedge = new THREE.Mesh(wedgeGeo, bodyMat);
      wedge.position.y = groundClearance + 0.2;
      wedge.castShadow = true;
      group.add(wedge);

      // Low Slung Canopy / Jet Fighter Cockpit
      const canopyGeo = new THREE.BoxGeometry(1.48, 0.42, 2.5);
      const canopy = new THREE.Mesh(canopyGeo, this.glassMaterial);
      canopy.position.set(0, groundClearance + 0.52, -0.1);
      group.add(canopy);

      // Roof with dual NACA scoops
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 1.7), this.carbonMaterial);
      roof.position.set(0, groundClearance + 0.73, -0.1);
      group.add(roof);

      // Aggressive Y-Shaped Front Daytime Aero Wings
      const yL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.3), headLightMat);
      yL.position.set(-0.65, groundClearance + 0.28, 2.25);
      const yR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.3), headLightMat);
      yR.position.set(0.65, groundClearance + 0.28, 2.25);
      group.add(yL, yR);

      // Giant Side Air Intakes (feeding V12 engine)
      const intakeL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 1.1), this.carbonMaterial);
      intakeL.position.set(-1.06, groundClearance + 0.28, -0.5);
      const intakeR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 1.1), this.carbonMaterial);
      intakeR.position.set(1.06, groundClearance + 0.28, -0.5);
      group.add(intakeL, intakeR);

      // High-Mounted Hexagonal Center Exhausts (High V12 exit!)
      exhaustPipes.push(new THREE.Vector3(-0.16, groundClearance + 0.52, -2.32));
      exhaustPipes.push(new THREE.Vector3(0.16, groundClearance + 0.52, -2.32));

      for (const p of exhaustPipes) {
        const hexPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 6), this.chromeMaterial);
        hexPipe.rotation.x = Math.PI / 2;
        hexPipe.position.copy(p);
        group.add(hexPipe);
      }

      // Massive Rear Carbon Diffuser
      const diffGeo = new THREE.BoxGeometry(2.0, 0.28, 0.5);
      const diff = new THREE.Mesh(diffGeo, this.carbonMaterial);
      diff.position.set(0, groundClearance + 0.12, -2.18);
      group.add(diff);

      // Y-shaped rear taillights
      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.06), tailLightMat);
      tl1.position.set(-0.65, groundClearance + 0.42, -2.3);
      const tl2 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.06), tailLightMat);
      tl2.position.set(0.65, groundClearance + 0.42, -2.3);
      group.add(tl1, tl2);

      this.addSideMirrors(group, bodyMat, groundClearance + 0.54, 0.6, 1.5);
    } else if (carId === 'ferrari_296') {
      // ==========================================
      // 3. FERRARI 296 GTB
      // ==========================================
      halfWidth = 0.98;
      frontZ = 1.42;
      rearZ = -1.4;
      caliperColor = 0xeab308; // Classic Modena Yellow calipers

      // Sensual Sculpted Berlinetta Chassis
      const bodyGeo = new THREE.BoxGeometry(1.96, 0.42, 4.4);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = groundClearance + 0.22;
      body.castShadow = true;
      group.add(body);

      // Teardrop Glass Cockpit
      const cabinGeo = new THREE.BoxGeometry(1.5, 0.44, 2.2);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMaterial);
      cabin.position.set(0, groundClearance + 0.58, -0.2);
      group.add(cabin);

      // Iconic Aero Bridge spanning rear haunches
      const bridgeGeo = new THREE.BoxGeometry(1.7, 0.08, 0.45);
      const bridge = new THREE.Mesh(bridgeGeo, bodyMat);
      bridge.position.set(0, groundClearance + 0.62, -1.35);
      group.add(bridge);

      // Flowing Rear Haunches
      const haunchGeo = new THREE.BoxGeometry(0.35, 0.38, 1.4);
      const hL = new THREE.Mesh(haunchGeo, bodyMat);
      hL.position.set(-0.9, groundClearance + 0.38, -1.2);
      const hR = new THREE.Mesh(haunchGeo, bodyMat);
      hR.position.set(0.9, groundClearance + 0.38, -1.2);
      group.add(hL, hR);

      // Single High-Mounted Center Exhaust Tip
      exhaustPipes.push(new THREE.Vector3(0, groundClearance + 0.42, -2.24));
      const centerPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8), this.chromeMaterial);
      centerPipe.rotation.x = Math.PI / 2;
      centerPipe.position.copy(exhaustPipes[0]);
      group.add(centerPipe);

      // Front Slender LED Headlights
      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.06), headLightMat);
      hl1.position.set(-0.62, groundClearance + 0.32, 2.2);
      const hl2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.06), headLightMat);
      hl2.position.set(0.62, groundClearance + 0.32, 2.2);
      group.add(hl1, hl2);

      // Ferrari Horizontal LED Taillight Bar
      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.06), tailLightMat);
      tl1.position.set(-0.62, groundClearance + 0.38, -2.22);
      const tl2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.06), tailLightMat);
      tl2.position.set(0.62, groundClearance + 0.38, -2.22);
      group.add(tl1, tl2);

      this.addSideMirrors(group, bodyMat, groundClearance + 0.55, 0.65, 1.5);
    } else if (carId === 'mclaren_750s') {
      // ==========================================
      // 4. MCLAREN 750S
      // ==========================================
      halfWidth = 1.0;
      frontZ = 1.45;
      rearZ = -1.42;
      caliperColor = 0xf97316; // Papaya Orange

      // Monocage Carbon Sculpted Body
      const bodyGeo = new THREE.BoxGeometry(2.0, 0.4, 4.45);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = groundClearance + 0.22;
      body.castShadow = true;
      group.add(body);

      // Teardrop Canopy Visor Glass
      const canopyGeo = new THREE.BoxGeometry(1.46, 0.46, 2.4);
      const canopy = new THREE.Mesh(canopyGeo, this.glassMaterial);
      canopy.position.set(0, groundClearance + 0.58, -0.15);
      group.add(canopy);

      // Distinctive Eye-Socket Headlight Enclosures
      const eyeGeo = new THREE.BoxGeometry(0.38, 0.24, 0.2);
      const eyeL = new THREE.Mesh(eyeGeo, this.carbonMaterial);
      eyeL.position.set(-0.64, groundClearance + 0.28, 2.12);
      const eyeR = new THREE.Mesh(eyeGeo, this.carbonMaterial);
      eyeR.position.set(0.64, groundClearance + 0.28, 2.12);
      group.add(eyeL, eyeR);

      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.06), headLightMat);
      hl1.position.set(-0.64, groundClearance + 0.34, 2.22);
      const hl2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.06), headLightMat);
      hl2.position.set(0.64, groundClearance + 0.34, 2.22);
      group.add(hl1, hl2);

      // Active Rear Wing / Airbrake
      const wingGeo = new THREE.BoxGeometry(1.82, 0.06, 0.42);
      const wing = new THREE.Mesh(wingGeo, this.carbonMaterial);
      wing.position.set(0, groundClearance + 0.72, -2.15);
      group.add(wing);

      // High-Exit Center Dual Exhausts (Iconic 750S high mount)
      exhaustPipes.push(new THREE.Vector3(-0.14, groundClearance + 0.55, -2.25));
      exhaustPipes.push(new THREE.Vector3(0.14, groundClearance + 0.55, -2.25));

      for (const p of exhaustPipes) {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8), this.chromeMaterial);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.copy(p);
        group.add(pipe);
      }

      // Ultra-slim blade LED taillights
      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.06), tailLightMat);
      tl1.position.set(-0.62, groundClearance + 0.46, -2.24);
      const tl2 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.06), tailLightMat);
      tl2.position.set(0.62, groundClearance + 0.46, -2.24);
      group.add(tl1, tl2);

      this.addSideMirrors(group, bodyMat, groundClearance + 0.56, 0.6, 1.46);
    } else if (carId === 'porsche_gt3rs') {
      // ==========================================
      // 5. PORSCHE 911 GT3 RS
      // ==========================================
      halfWidth = 1.02;
      frontZ = 1.42;
      rearZ = -1.42;
      caliperColor = 0xdc2626; // Guards Red

      // Classic 911 Silhouette with Wide Rear Haunches
      const bodyGeo = new THREE.BoxGeometry(1.98, 0.44, 4.45);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = groundClearance + 0.24;
      body.castShadow = true;
      group.add(body);

      // Greenhouse Cabin
      const cabinGeo = new THREE.BoxGeometry(1.5, 0.48, 2.2);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMaterial);
      cabin.position.set(0, groundClearance + 0.65, -0.25);
      group.add(cabin);

      // Carbon Roof with Aero Guide Fins
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.06, 1.7), this.carbonMaterial);
      roof.position.set(0, groundClearance + 0.88, -0.25);
      group.add(roof);

      // Front Hood Cooling Extractors (Dual Nostrils)
      const nGeo = new THREE.BoxGeometry(0.3, 0.06, 0.45);
      const nL = new THREE.Mesh(nGeo, this.carbonMaterial);
      nL.position.set(-0.35, groundClearance + 0.45, 1.35);
      const nR = new THREE.Mesh(nGeo, this.carbonMaterial);
      nR.position.set(0.35, groundClearance + 0.45, 1.35);
      group.add(nL, nR);

      // Front Fender Louvers (Pressure relief slats)
      const louverGeo = new THREE.BoxGeometry(0.24, 0.06, 0.6);
      const lvL = new THREE.Mesh(louverGeo, this.carbonMaterial);
      lvL.position.set(-0.88, groundClearance + 0.46, 1.35);
      const lvR = new THREE.Mesh(louverGeo, this.carbonMaterial);
      lvR.position.set(0.88, groundClearance + 0.46, 1.35);
      group.add(lvL, lvR);

      // MASSIVE Swan-Neck Elevated Rear Wing with DRS Actuator
      const wingGeo = new THREE.BoxGeometry(2.1, 0.08, 0.55);
      const wing = new THREE.Mesh(wingGeo, this.carbonMaterial);
      wing.position.set(0, groundClearance + 1.15, -2.1);
      group.add(wing);

      // Swan-Neck Uprights
      const uprightGeo = new THREE.BoxGeometry(0.06, 0.75, 0.14);
      const uL = new THREE.Mesh(uprightGeo, this.carbonMaterial);
      uL.position.set(-0.55, groundClearance + 0.78, -2.0);
      uL.rotation.x = -0.2;
      const uR = new THREE.Mesh(uprightGeo, this.carbonMaterial);
      uR.position.set(0.55, groundClearance + 0.78, -2.0);
      uR.rotation.x = -0.2;
      group.add(uL, uR);

      // Wing Endplates
      const epGeo = new THREE.BoxGeometry(0.04, 0.4, 0.6);
      const epL = new THREE.Mesh(epGeo, bodyMat);
      epL.position.set(-1.05, groundClearance + 1.15, -2.1);
      const epR = new THREE.Mesh(epGeo, bodyMat);
      epR.position.set(1.05, groundClearance + 1.15, -2.1);
      group.add(epL, epR);

      // Center Dual Titanium Exhausts
      exhaustPipes.push(new THREE.Vector3(-0.14, groundClearance + 0.18, -2.25));
      exhaustPipes.push(new THREE.Vector3(0.14, groundClearance + 0.18, -2.25));

      for (const p of exhaustPipes) {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.2, 8), this.chromeMaterial);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.copy(p);
        group.add(pipe);
      }

      // Classic Round Porsche 4-Point LED Headlights
      const hl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 12), headLightMat);
      hl1.rotation.x = Math.PI / 2;
      hl1.position.set(-0.65, groundClearance + 0.42, 2.15);
      const hl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 12), headLightMat);
      hl2.rotation.x = Math.PI / 2;
      hl2.position.set(0.65, groundClearance + 0.42, 2.15);
      group.add(hl1, hl2);

      // Full-width continuous rear light bar
      const tl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.06), tailLightMat);
      tl.position.set(0, groundClearance + 0.45, -2.22);
      group.add(tl);

      this.addSideMirrors(group, bodyMat, groundClearance + 0.62, 0.65, 1.5);
    } else {
      // ==========================================
      // 6. MERCEDES-AMG GT (Default fallback / amg)
      // ==========================================
      halfWidth = 0.98;
      frontZ = 1.35;
      rearZ = -1.45;
      caliperColor = 0xeab308; // AMG Gold/Bronze

      // Long Muscular Hood with Set-Back Cabin
      const bodyGeo = new THREE.BoxGeometry(1.98, 0.45, 4.5);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = groundClearance + 0.24;
      body.castShadow = true;
      group.add(body);

      // Dual Hood Power Bulges
      const bulgeGeo = new THREE.BoxGeometry(0.24, 0.08, 1.4);
      const bL = new THREE.Mesh(bulgeGeo, bodyMat);
      bL.position.set(-0.35, groundClearance + 0.48, 1.2);
      const bR = new THREE.Mesh(bulgeGeo, bodyMat);
      bR.position.set(0.35, groundClearance + 0.48, 1.2);
      group.add(bL, bR);

      // Fastback Rear Cabin (Set far back on rear axle)
      const cabinGeo = new THREE.BoxGeometry(1.5, 0.46, 2.1);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMaterial);
      cabin.position.set(0, groundClearance + 0.64, -0.35);
      group.add(cabin);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1.6), this.carbonMaterial);
      roof.position.set(0, groundClearance + 0.86, -0.35);
      group.add(roof);

      // Panamericana Grille with Vertical Chrome Slats
      const grilleGeo = new THREE.BoxGeometry(0.88, 0.35, 0.1);
      const grille = new THREE.Mesh(grilleGeo, this.carbonMaterial);
      grille.position.set(0, groundClearance + 0.26, 2.27);
      group.add(grille);

      // Chrome vertical slats
      for (let s = -0.32; s <= 0.32; s += 0.09) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.04), this.chromeMaterial);
        slat.position.set(s, groundClearance + 0.26, 2.3);
        group.add(slat);
      }

      // Quad Trapezoidal AMG Exhaust Tips
      exhaustPipes.push(new THREE.Vector3(-0.52, groundClearance + 0.15, -2.28));
      exhaustPipes.push(new THREE.Vector3(-0.38, groundClearance + 0.15, -2.28));
      exhaustPipes.push(new THREE.Vector3(0.38, groundClearance + 0.15, -2.28));
      exhaustPipes.push(new THREE.Vector3(0.52, groundClearance + 0.15, -2.28));

      for (const p of exhaustPipes) {
        const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.18), this.chromeMaterial);
        pipe.position.copy(p);
        group.add(pipe);
      }

      // Multi-beam LED Headlights
      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.06), headLightMat);
      hl1.position.set(-0.64, groundClearance + 0.34, 2.24);
      const hl2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.06), headLightMat);
      hl2.position.set(0.64, groundClearance + 0.34, 2.24);
      group.add(hl1, hl2);

      // Slim Horizontal AMG Taillights
      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.06), tailLightMat);
      tl1.position.set(-0.64, groundClearance + 0.42, -2.26);
      const tl2 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.06), tailLightMat);
      tl2.position.set(0.64, groundClearance + 0.42, -2.26);
      group.add(tl1, tl2);

      this.addSideMirrors(group, bodyMat, groundClearance + 0.58, 0.5, 1.5);
    }

    // Four Performance Wheels with custom caliper colors
    const wheelPositions = [
      { x: -halfWidth, z: frontZ, isFront: true },
      { x: halfWidth, z: frontZ, isFront: true },
      { x: -halfWidth, z: rearZ, isFront: false },
      { x: halfWidth, z: rearZ, isFront: false },
    ];

    for (const wp of wheelPositions) {
      const wheelMount = new THREE.Group();
      wheelMount.position.set(wp.x, groundClearance, wp.z);

      const wheel = this.createSupercarWheel(caliperColor);
      if (wp.x > 0) {
        wheel.rotation.y = Math.PI; // mirror right side
      }
      wheelMount.add(wheel);
      group.add(wheelMount);

      allWheels.push(wheel);
      if (wp.isFront) {
        frontWheels.push(wheelMount);
      }
    }

    // Shadow Grounding Plane directly under car
    const shadowGeo = new THREE.PlaneGeometry(2.35, 4.7);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.02;
    group.add(shadowPlane);

    return {
      group,
      frontWheels,
      allWheels,
      exhaustPipes,
      tailLightMaterials: [tailLightMat],
      headLightMaterials: [headLightMat],
      bodyMaterials,
      carConfigId: carId,
    };
  }

  /**
   * Creates an NPC Traffic Vehicle (Sedan, SUV, Box Truck, or Rival Car)
   */
  public static createTrafficCar(type: 'sedan' | 'suv' | 'truck' | 'sports' | 'rival'): {
    group: THREE.Group;
    allWheels: THREE.Group[];
    length: number;
    width: number;
    height: number;
    isRival: boolean;
  } {
    const group = new THREE.Group();
    const allWheels: THREE.Group[] = [];
    const isRival = type === 'rival';

    let length = 4.4;
    let width = 1.95;
    let height = 1.45;
    const groundClearance = 0.35;

    let bodyColor = 0x3b82f6;
    if (isRival) {
      bodyColor = 0x18181b; // Matte black rival with glowing gold/red highlights
    } else {
      const colors = [0xd97706, 0x2563eb, 0x475569, 0xdc2626, 0x059669, 0xe2e8f0, 0x111827];
      bodyColor = colors[Math.floor(Math.random() * colors.length)];
    }

    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: isRival ? 0.2 : 0.4,
      metalness: isRival ? 0.9 : 0.4,
    });

    if (type === 'truck') {
      length = 7.5;
      width = 2.4;
      height = 3.2;

      const cabGeo = new THREE.BoxGeometry(2.3, 1.8, 2.2);
      const cab = new THREE.Mesh(cabGeo, new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.5 }));
      cab.position.set(0, groundClearance + 0.9, 2.2);
      cab.castShadow = true;
      group.add(cab);

      const winGeo = new THREE.BoxGeometry(2.1, 0.7, 0.1);
      const win = new THREE.Mesh(winGeo, this.glassMaterial);
      win.position.set(0, groundClearance + 1.25, 3.32);
      group.add(win);

      const cargoGeo = new THREE.BoxGeometry(2.4, 2.4, 4.8);
      const cargo = new THREE.Mesh(cargoGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 }));
      cargo.position.set(0, groundClearance + 1.2, -1.2);
      cargo.castShadow = true;
      group.add(cargo);

      for (const z of [2.2, -1.0, -2.6]) {
        for (const sign of [-1, 1]) {
          const w = this.createSupercarWheel();
          w.position.set(sign * 1.15, groundClearance, z);
          if (sign > 0) w.rotation.y = Math.PI;
          group.add(w);
          allWheels.push(w);
        }
      }
    } else if (type === 'suv') {
      length = 4.8;
      width = 2.1;
      height = 1.75;

      const bodyGeo = new THREE.BoxGeometry(2.0, 0.6, 4.6);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(0, groundClearance + 0.3, 0);
      body.castShadow = true;
      group.add(body);

      const cabinGeo = new THREE.BoxGeometry(1.85, 0.75, 3.0);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMaterial);
      cabin.position.set(0, groundClearance + 0.85, -0.3);
      group.add(cabin);

      for (const z of [1.4, -1.4]) {
        for (const sign of [-1, 1]) {
          const w = this.createSupercarWheel();
          w.position.set(sign * 1.0, groundClearance, z);
          if (sign > 0) w.rotation.y = Math.PI;
          group.add(w);
          allWheels.push(w);
        }
      }
    } else {
      // Sedan / Sports / Rival
      length = 4.4;
      width = 1.95;
      height = 1.4;

      const bodyGeo = new THREE.BoxGeometry(1.9, 0.48, 4.3);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(0, groundClearance + 0.24, 0);
      body.castShadow = true;
      group.add(body);

      const cabinGeo = new THREE.BoxGeometry(1.58, 0.46, 2.2);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMaterial);
      cabin.position.set(0, groundClearance + 0.65, -0.2);
      group.add(cabin);

      if (isRival) {
        const spoilerGeo = new THREE.BoxGeometry(1.9, 0.08, 0.35);
        const spoilerMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xd97706,
          emissiveIntensity: 0.8,
        });
        const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
        spoiler.position.set(0, groundClearance + 0.8, -1.95);
        group.add(spoiler);

        const beaconGeo = new THREE.ConeGeometry(0.3, 0.5, 4);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.rotation.x = Math.PI;
        beacon.position.set(0, groundClearance + 2.0, 0);
        group.add(beacon);
      }

      for (const z of [1.35, -1.35]) {
        for (const sign of [-1, 1]) {
          const w = this.createSupercarWheel();
          w.position.set(sign * 0.95, groundClearance, z);
          if (sign > 0) w.rotation.y = Math.PI;
          group.add(w);
          allWheels.push(w);
        }
      }
    }

    // Taillights
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x991b1b,
      emissiveIntensity: 0.8,
    });
    const tlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.06);
    const tl1 = new THREE.Mesh(tlGeo, tlMat);
    tl1.position.set(-0.6, groundClearance + 0.35, -length * 0.5);
    const tl2 = new THREE.Mesh(tlGeo, tlMat);
    tl2.position.set(0.6, groundClearance + 0.35, -length * 0.5);
    group.add(tl1, tl2);

    return {
      group,
      allWheels,
      length,
      width,
      height,
      isRival,
    };
  }
}
