import * as THREE from 'three';

interface Particle {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  public group: THREE.Group;
  private maxParticles = 600;
  private particles: Particle[] = [];

  private pointsGeometry: THREE.BufferGeometry;
  private pointsMaterial: THREE.PointsMaterial;
  private points: THREE.Points;

  private positionsArray: Float32Array;
  private colorsArray: Float32Array;
  private sizesArray: Float32Array;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'particle_system';

    this.positionsArray = new Float32Array(this.maxParticles * 3);
    this.colorsArray = new Float32Array(this.maxParticles * 3);
    this.sizesArray = new Float32Array(this.maxParticles);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        size: 1.0,
        life: 0,
        maxLife: 1.0,
      });
      // Hide inactive points far away
      this.positionsArray[i * 3 + 1] = -9999;
    }

    this.pointsGeometry = new THREE.BufferGeometry();
    this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(this.positionsArray, 3));
    this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(this.colorsArray, 3));

    // Create a circular procedural texture for soft glowing particles
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    this.pointsMaterial = new THREE.PointsMaterial({
      size: 0.6,
      map: texture,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.pointsGeometry, this.pointsMaterial);
    this.points.frustumCulled = false;
    this.group.add(this.points);
  }

  private spawn(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    color: THREE.Color,
    size: number,
    maxLife: number
  ) {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.position.copy(pos);
        p.velocity.copy(vel);
        p.color.copy(color);
        p.size = size;
        p.life = 0;
        p.maxLife = maxLife;
        return;
      }
    }
  }

  /**
   * Procedural exhaust particles scaling with RPM and throttle input
   */
  public emitExhaust(
    pipePositions: THREE.Vector3[],
    carRotationY: number,
    rpm: number,
    throttle: number,
    isNitro: boolean
  ) {
    const rpmNorm = Math.max(0, Math.min(1, (rpm - 1000) / 7500));
    // Emission rate scales with RPM and throttle
    const count = isNitro ? 3 : Math.floor(1 + rpmNorm * 2.5 + throttle * 2);

    for (let c = 0; c < count; c++) {
      for (const pipePos of pipePositions) {
        const jitterX = (Math.random() - 0.5) * 0.08;
        const jitterY = (Math.random() - 0.5) * 0.08;
        const pos = pipePos.clone().add(new THREE.Vector3(jitterX, jitterY, 0));

        // Velocity directed backward relative to car orientation
        const speed = 2.5 + throttle * 4.0 + (isNitro ? 8.0 : 0);
        const backwardAngle = carRotationY + Math.PI;
        const velX = Math.sin(backwardAngle) * speed + (Math.random() - 0.5) * 0.8;
        const velZ = Math.cos(backwardAngle) * speed + (Math.random() - 0.5) * 0.8;
        const velY = 0.2 + Math.random() * 0.4;
        const vel = new THREE.Vector3(velX, velY, velZ);

        if (isNitro) {
          // Electric Cyan / Blue Nitro Thrust Flame
          const nitroColor = Math.random() > 0.4 ? new THREE.Color(0x06b6d4) : new THREE.Color(0x3b82f6);
          this.spawn(pos, vel, nitroColor, 0.8 + Math.random() * 0.4, 0.18 + Math.random() * 0.1);
        } else if (rpmNorm > 0.75 && throttle > 0.6) {
          // High-RPM Orange/Yellow Backfire Flame
          const flameColor = Math.random() > 0.3 ? new THREE.Color(0xf59e0b) : new THREE.Color(0xef4444);
          this.spawn(pos, vel, flameColor, 0.6 + Math.random() * 0.3, 0.2 + Math.random() * 0.12);
        } else {
          // Normal exhaust smoke puff (dark grey/white rising)
          const greyVal = 0.35 + Math.random() * 0.25;
          const smokeColor = new THREE.Color(greyVal, greyVal, greyVal);
          this.spawn(pos, vel, smokeColor, 0.4 + throttle * 0.4, 0.4 + Math.random() * 0.3);
        }
      }
    }
  }

  /**
   * Tire drift / hard brake smoke puff
   */
  public emitDriftSmoke(wheelPositions: THREE.Vector3[], carVelocity: THREE.Vector3) {
    for (const wPos of wheelPositions) {
      if (Math.random() > 0.35) continue;
      const pos = wPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.05, (Math.random() - 0.5) * 0.2));
      const vel = new THREE.Vector3(
        carVelocity.x * 0.2 + (Math.random() - 0.5) * 1.5,
        0.4 + Math.random() * 0.8,
        carVelocity.z * 0.2 + (Math.random() - 0.5) * 1.5
      );
      const smokeColor = new THREE.Color(0.85, 0.88, 0.92);
      this.spawn(pos, vel, smokeColor, 0.8 + Math.random() * 0.5, 0.5 + Math.random() * 0.3);
    }
  }

  /**
   * Rain tire water spray
   */
  public emitWaterSpray(wheelPositions: THREE.Vector3[], carSpeed: number) {
    if (carSpeed < 30) return;
    for (const wPos of wheelPositions) {
      if (Math.random() > 0.4) continue;
      const pos = wPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.08, -0.4));
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.8,
        0.6 + Math.random() * 1.2,
        -4.0 - Math.random() * 3.0
      );
      const sprayColor = new THREE.Color(0.65, 0.75, 0.85);
      this.spawn(pos, vel, sprayColor, 0.6, 0.35);
    }
  }

  /**
   * Crash collision sparks & fragments
   */
  public emitCrashSparks(pos: THREE.Vector3, count = 35) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        2 + Math.random() * 8,
        Math.sin(angle) * speed
      );
      const sparkColor = Math.random() > 0.4 ? new THREE.Color(0xffd700) : new THREE.Color(0xff4500);
      this.spawn(pos, vel, sparkColor, 0.5 + Math.random() * 0.4, 0.4 + Math.random() * 0.4);
    }
  }

  public update(delta: number) {
    const posAttr = this.pointsGeometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.pointsGeometry.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) {
        this.positionsArray[i * 3 + 1] = -9999;
        continue;
      }

      p.life += delta;
      if (p.life >= p.maxLife) {
        p.active = false;
        this.positionsArray[i * 3 + 1] = -9999;
        continue;
      }

      // Update physics
      p.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 2.0 * delta; // subtle gravity or air drag
      p.velocity.multiplyScalar(0.96);

      const lifeProgress = p.life / p.maxLife;
      const fade = 1.0 - lifeProgress;

      this.positionsArray[i * 3] = p.position.x;
      this.positionsArray[i * 3 + 1] = p.position.y;
      this.positionsArray[i * 3 + 2] = p.position.z;

      this.colorsArray[i * 3] = p.color.r * fade;
      this.colorsArray[i * 3 + 1] = p.color.g * fade;
      this.colorsArray[i * 3 + 2] = p.color.b * fade;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }
}
