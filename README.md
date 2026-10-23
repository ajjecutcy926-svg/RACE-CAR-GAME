# ROAD LEGENDS: OPEN ROAD 3D — AAA RACING EDITION

An exhilarating, high-performance 3D supercar racing game built with Three.js, React, and TypeScript.

---

## Key Features & Systems

### 1. Epic Finish Slide & Victory Presentation
- **Dynamic FINISH! & LEVEL COMPLETE Typography**: Championship racing presentation with animated gradient headings and drop shadows.
- **Player's 3D Vehicle Showcase**: Integrated real-time Three.js turntable canvas presenting the player's exact car, matching selected manufacturer, aero setup, paint color, and alloy wheels.
- **Championship Victory Celebration**: Sequenced dual confetti cannon explosions (powered by `canvas-confetti`) with gold, amber, and cyan streamers.
- **Performance Telemetry**:
  - Finishing Position (`1st PLACE / 8 RACERS`)
  - Centisecond Timing (`MM:SS.cc`)
  - Star Rating (`★ ★ ★`) with sequential pop animation
  - Top Speed radar verification
  - Overtakes & Close Calls count
  - Coin Rewards credited directly to player wallet
- **3 Dedicated Action Buttons**:
  - `NEXT LEVEL`: Immediately unlocks and loads the next stage (with continuous loop support).
  - `RETRY`: Fully reinitializes the current stage from starting line ($Z=0$), resetting physics, timers, score, and traffic.
  - `MAIN MENU`: Safely returns to the main menu without memory leaks or duplicate game loops.
  - Navigation lock guard (`isNavigating`) to prevent double triggers during transitions.

### 2. Precise Level Finish Trigger Logic
- Real 3D finish line trigger situated at $Z = \text{targetDistance}$ on the track.
- Requires forward vehicle velocity ($v_z \ge 0$) and near-total distance traveled ($d \ge 0.95 \times \text{targetDistance}$) to prevent false triggers at level start or when driving backwards.
- Smooth post-finish cruising deceleration so the vehicle glides triumphantly past the checkered line.
- One-shot execution lock (`isLevelFinished` and `!isGameOver`) preventing duplicate rewards or accidental triggers upon crashing.

### 3. AAA Graphics & Environmental Upgrades
- **Championship Finish Gantry**:
  - High-tech carbon and gold truss gantry spanning all 4 highway lanes.
  - Glowing digital LED race display: `FINISH`.
  - Green and amber timing light arrays.
  - Overhead stadium floodlights angled down at the finish line.
  - Dual checkered racing flags mounted on pylons.
  - Procedural black-and-white checkered asphalt finish line strip across all 4 lanes.
- **Upgraded Vehicle Materials**:
  - High-specular clearcoat paint with realistic roughness and metalness ratios.
  - High-refraction deep tinted glass.
  - Gloss carbon aero splitters, side diffusers, and spoilers.
  - High-emission jewel-cut LED headlights and taillights.
  - Satin alloy sport rims with high-visibility performance calipers.
- **High-Definition Asphalt & Infrastructure**:
  - Procedural bitumen aggregate asphalt with realistic surface grain.
  - High-contrast reflective dashed white lane markers and solid highway shoulders.
  - Alternating red/white racing kerbs and metallic crash guardrails.
  - Biome-specific terrain (desert sand & saguaro cacti, coastal oceans & palms, metropolitan skyscrapers, mountain pines).

### 4. Audio & Soundtrack
- **Procedural Engine Sound with Load & RPM Pitch Shifting**:
  - Cylinder firing combustion pitch dynamically shifted by engine torque load (+52 cents under wide-open throttle; -24 cents overrun pitch sag on engine braking).
  - High-RPM combustion micro-vibrato near redline (>6800 RPM).
  - Turbocharger induction whistle tracking RPM and boost pressure.
  - Dynamic low-pass filter opening up to 5500 Hz with Q-tightening under heavy load.
  - WaveShaper saturation adding warm harmonic bite.
  - Overrun exhaust pops/crackle on sudden throttle lift-off from high revs.
- **High-Lateral-Force Tire Screech & Transient Chirp Engine**:
  - Physics-driven lateral G-force calculation combining centripetal acceleration, yaw rate, and lateral slip velocity.
  - Dual-formant tire filtering: 1800Hz–3600Hz high-Q asphalt squeal + 600Hz–1100Hz rubber carcass scrub.
  - Transient tire chirp/bite sample triggered on sudden lateral force spikes (>0.52g onset or aggressive lane swerves).
- **Triumphal Victory Fanfare**: Multi-voice synthesized brass arpeggio (Eb4 $\rightarrow$ G4 $\rightarrow$ Bb4 $\rightarrow$ Eb5 $\rightarrow$ G5) with celebratory cymbal wash.
- **Dynamic Procedural FM Radio**: 4 built-in radio stations (*Neon Synthwave*, *Cyberpunk Darksynth*, *Redline Eurobeat*, *Horizon Chill*) plus engine-only mode.
- **Proximity Sonar Alerts**: Tactical rear-threat audio chimes for approaching overtakers and tailgaters.

---

## Concise Changelog

### Version 2.3.0 — Procedural Engine Pitch Shifting & Lateral-Force Tire Audio
- **Added**: Procedural pitch shifting to the engine sound synthesizer modulated by both RPM and dynamic engine load (torque pull vs overrun sag).
- **Added**: Turbocharger induction spool oscillator tracking boost pressure and RPM.
- **Added**: WaveShaper saturation curve to inject analog harmonic bark under acceleration load.
- **Added**: High-lateral-force maneuver detection in `GameEngine.ts` measuring physical lateral G-forces.
- **Added**: Multi-layer tire screech engine with dual-formant resonance (asphalt scrub + high-Q squeal).
- **Added**: Transient tire chirp/bite sample triggered on sudden high-lateral-force swerves and slide initiations.
- **Added**: Overrun exhaust crackles and pops on abrupt throttle lift-off.
