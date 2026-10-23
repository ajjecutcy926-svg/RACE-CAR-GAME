import * as THREE from 'three';
import { CarFactory } from './CarFactory.ts';
import { RearThreat } from '../types.ts';

export interface TrafficEntity {
  group: THREE.Group;
  allWheels: THREE.Group[];
  type: 'sedan' | 'suv' | 'truck' | 'sports' | 'rival';
  speedMs: number;
  currentLane: number;
  targetLane: number;
  laneChangeProgress: number; // 0 to 1
  length: number;
  width: number;
  height: number;
  isRival: boolean;
  draftingTimer: number;
  passedPlayer: boolean;
  nearMissAwarded: boolean;
  bbox: THREE.Box3;
}

export class TrafficManager {
  public group: THREE.Group;
  private vehicles: TrafficEntity[] = [];
  private lanes = [-5.5, -1.85, 1.85, 5.5];
  private maxVehicles = 10;
  private spawnInterval = 1.2;
  private spawnTimer = 0;

  // Level tuning
  private speedRange: [number, number] = [80, 130];
  private isRivalAllowed = true;

  // Rival NPC management
  public activeRival: TrafficEntity | null = null;
  private rivalSpawnCooldown = 45; // seconds between rival appearances
  private rivalTimer = 20; // first rival after 20s

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'traffic_manager';
  }

  public setLevelConfig(densityMultiplier: number, speedRangeKmh: [number, number], rivalAllowed: boolean) {
    this.maxVehicles = Math.max(4, Math.round(10 * densityMultiplier));
    this.spawnInterval = Math.max(0.65, 1.4 / Math.max(0.4, densityMultiplier));
    this.speedRange = speedRangeKmh;
    this.isRivalAllowed = rivalAllowed;
  }

  /**
   * Clears any traffic within radius meters of zPos to ensure safe respawning
   * without vehicle clipping or collisions.
   */
  public clearNearPosition(zPos: number, radius = 55) {
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      if (Math.abs(v.group.position.z - zPos) < radius) {
        if (v.isRival) {
          this.activeRival = null;
        }
        this.group.remove(v.group);
        this.vehicles.splice(i, 1);
      }
    }
  }

  public reset() {
    for (const v of this.vehicles) {
      this.group.remove(v.group);
    }
    this.vehicles = [];
    this.activeRival = null;
    this.spawnTimer = 0;
    this.rivalTimer = 15;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    playerSpeedKmh: number,
    onNearMiss: (pos: THREE.Vector3) => void,
    onRivalDuelWon: () => void
  ): { collidedEntity: TrafficEntity | null; isDrafting: boolean; rivalDist: number | null } {
    const playerSpeedMs = (playerSpeedKmh * 1000) / 3600;
    this.spawnTimer += delta;
    this.rivalTimer += delta;

    // Check if we should spawn regular traffic or rival
    if (this.vehicles.length < this.maxVehicles && this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;

      const shouldSpawnRival = this.isRivalAllowed && !this.activeRival && this.rivalTimer >= this.rivalSpawnCooldown;
      // 25% chance to spawn an approaching vehicle from the rear if player is moving
      const spawnFromBehind = !shouldSpawnRival && playerSpeedKmh > 25 && Math.random() < 0.28;
      this.spawnTrafficCar(playerPos.z, shouldSpawnRival, spawnFromBehind, playerSpeedKmh);
      if (shouldSpawnRival) {
        this.rivalTimer = 0;
      }
    }

    let isDrafting = false;
    let rivalDist: number | null = null;
    let collidedEntity: TrafficEntity | null = null;

    // Create player bounding box
    const playerBBox = new THREE.Box3().setFromCenterAndSize(
      playerPos,
      new THREE.Vector3(1.85, 1.3, 4.2)
    );

    // Update each vehicle
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];

      // Lane change animation
      if (v.currentLane !== v.targetLane) {
        v.laneChangeProgress += delta * 0.8;
        if (v.laneChangeProgress >= 1.0) {
          v.currentLane = v.targetLane;
          v.laneChangeProgress = 0;
          v.group.position.x = this.lanes[v.currentLane];
        } else {
          const fromX = this.lanes[v.currentLane];
          const toX = this.lanes[v.targetLane];
          v.group.position.x = THREE.MathUtils.lerp(fromX, toX, v.laneChangeProgress);
        }
      }

      // Rival specialized AI: speeds up and maneuvers to challenge player
      if (v.isRival) {
        const distFromPlayer = v.group.position.z - playerPos.z;
        rivalDist = distFromPlayer;

        if (distFromPlayer > 0 && distFromPlayer < 24) {
          // Player is close behind rival
          const latDist = Math.abs(playerPos.x - v.group.position.x);
          if (latDist < 1.8) {
            // Player is in rival's slipstream!
            isDrafting = true;
            v.draftingTimer += delta;
            if (v.draftingTimer >= 4.0 && !v.passedPlayer) {
              // Duel won by drafting!
              onRivalDuelWon();
            }
          }
        }

        // If player overtakes rival cleanly
        if (distFromPlayer < -6 && !v.passedPlayer) {
          v.passedPlayer = true;
          onRivalDuelWon();
        }

        // Rival speed adapts dynamically
        const targetRivalSpeed = Math.max(38, playerSpeedMs * 0.95);
        v.speedMs = THREE.MathUtils.damp(v.speedMs, targetRivalSpeed, 2.0, delta);
      }

      // Move forward along +Z
      v.group.position.z += v.speedMs * delta;

      // Animate wheels
      const wheelRot = (v.speedMs * delta) / 0.36;
      for (const w of v.allWheels) {
        w.rotation.x += wheelRot;
      }

      // Update BBox
      v.bbox.setFromCenterAndSize(
        v.group.position,
        new THREE.Vector3(v.width, v.height, v.length)
      );

      // Check collision with player
      if (playerBBox.intersectsBox(v.bbox)) {
        collidedEntity = v;
      }

      // Check near-miss (close call): distance between centers is small, but no collision
      const dz = v.group.position.z - playerPos.z;
      const dx = Math.abs(v.group.position.x - playerPos.x);

      if (!v.nearMissAwarded && Math.abs(dz) < 2.5 && dx < 2.8 && dx > 1.6 && playerSpeedKmh > 80) {
        v.nearMissAwarded = true;
        onNearMiss(v.group.position);
      }

      // Autonomous lane change: if blocked by vehicle ahead, shift lane
      if (!v.isRival && v.currentLane === v.targetLane && Math.random() < 0.005) {
        const canLeft = v.currentLane > 0;
        const canRight = v.currentLane < this.lanes.length - 1;
        if (canLeft && Math.random() > 0.5) {
          v.targetLane = v.currentLane - 1;
        } else if (canRight) {
          v.targetLane = v.currentLane + 1;
        }
      }

      // Despawn if too far behind or too far ahead
      const relZ = v.group.position.z - playerPos.z;
      if (relZ < -60 || relZ > 320) {
        if (v.isRival) {
          this.activeRival = null;
        }
        this.group.remove(v.group);
        this.vehicles.splice(i, 1);
      }
    }

    return { collidedEntity, isDrafting, rivalDist };
  }

  private spawnTrafficCar(playerZ: number, isRival: boolean, spawnFromBehind = false, playerSpeedKmh = 100) {
    let type: 'sedan' | 'suv' | 'truck' | 'sports' | 'rival';
    let speedKmh: number;

    const [minSpd, maxSpd] = this.speedRange;

    if (isRival) {
      type = 'rival';
      speedKmh = Math.max(175, maxSpd + 30);
    } else {
      const types: ('sedan' | 'suv' | 'truck' | 'sports')[] = ['sedan', 'sedan', 'suv', 'truck', 'sports'];
      type = types[Math.floor(Math.random() * types.length)];
      if (type === 'truck') speedKmh = minSpd + Math.random() * 15;
      else if (type === 'suv') speedKmh = minSpd + 15 + Math.random() * 20;
      else if (type === 'sports') speedKmh = maxSpd - 10 + Math.random() * 25;
      else speedKmh = minSpd + (maxSpd - minSpd) * (0.3 + Math.random() * 0.5);
    }

    // Pick a lane not currently occupied at spawn point
    const laneIndex = Math.floor(Math.random() * this.lanes.length);
    let spawnZ: number;

    if (spawnFromBehind) {
      // Vehicle approaching from behind at a higher speed to challenge situational awareness!
      const overtakeDelta = 18 + Math.random() * 32;
      speedKmh = Math.min(260, Math.max(playerSpeedKmh + overtakeDelta, minSpd + 25));
      spawnZ = playerZ - (38 + Math.random() * 20);
    } else {
      spawnZ = playerZ + 120 + Math.random() * 60;
    }

    // Check collision with already spawned cars at this location
    for (const v of this.vehicles) {
      if (v.currentLane === laneIndex && Math.abs(v.group.position.z - spawnZ) < 25) {
        return; // Lane blocked at spawn, skip this tick
      }
    }

    const model = CarFactory.createTrafficCar(type);
    model.group.position.set(this.lanes[laneIndex], 0, spawnZ);
    this.group.add(model.group);

    const entity: TrafficEntity = {
      group: model.group,
      allWheels: model.allWheels,
      type,
      speedMs: (speedKmh * 1000) / 3600,
      currentLane: laneIndex,
      targetLane: laneIndex,
      laneChangeProgress: 0,
      length: model.length,
      width: model.width,
      height: model.height,
      isRival,
      draftingTimer: 0,
      passedPlayer: false,
      nearMissAwarded: false,
      bbox: new THREE.Box3(),
    };

    this.vehicles.push(entity);
    if (isRival) {
      this.activeRival = entity;
    }
  }

  /**
   * Scans all traffic vehicles positioned behind the player to provide
   * radar telemetry for the overhead proximity warning HUD.
   */
  public getRearThreats(playerPos: THREE.Vector3, playerSpeedKmh: number): RearThreat[] {
    const threats: RearThreat[] = [];

    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      const relZ = v.group.position.z - playerPos.z;

      // Vehicles behind player within 55 meters
      if (relZ < -0.3 && relZ >= -55) {
        const distanceMeters = Math.abs(relZ);
        const vehicleSpeedKmh = Math.round((v.speedMs * 3600) / 1000);
        const relativeSpeedKmh = Math.round(vehicleSpeedKmh - playerSpeedKmh);

        // Approaching if vehicle is faster than player or critically close
        const isApproaching = relativeSpeedKmh > 2 || (relativeSpeedKmh >= -6 && distanceMeters < 18);
        const isCritical = distanceMeters <= 14 || (isApproaching && relativeSpeedKmh >= 15 && distanceMeters < 28);

        let laneLabel: 'left' | 'center-left' | 'center-right' | 'right' = 'center-left';
        if (v.currentLane === 0) laneLabel = 'left';
        else if (v.currentLane === 1) laneLabel = 'center-left';
        else if (v.currentLane === 2) laneLabel = 'center-right';
        else if (v.currentLane === 3) laneLabel = 'right';

        threats.push({
          id: i,
          lane: laneLabel,
          laneIndex: v.currentLane,
          distanceMeters: Math.round(distanceMeters * 10) / 10,
          relativeSpeedKmh,
          isApproaching,
          isCritical,
          vehicleType: v.type,
          lateralOffset: THREE.MathUtils.clamp(v.group.position.x - playerPos.x, -10, 10),
        });
      }
    }

    // Sort by distance (nearest threat first)
    threats.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return threats;
  }
}
