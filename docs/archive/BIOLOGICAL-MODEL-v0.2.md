# Biological flight laboratory — model card and implementation

Version: 0.2.0 / `drosophila-rom-v1` · 24 September 2026.

## 1. Delivered scope

This is a **reduced-order, wing-driven fruit-fly simulator**, not an animation of a prerecorded trajectory. Two flapping wing surfaces generate quasi-steady aerodynamic forces and moments. A free body integrates translation and rotation, with gravity, air-relative drag and rotational inertia. The flight controller changes wing kinematics; it does not directly set body position, velocity or attitude. The model runs in browser workers with native JavaScript and WebGL2. No runtime dependencies, Python service, GPU ML package, remote model or external CDN is required.

It is **not the complete MuJoCo `flybody` model**, a reproduction of its trained policy, a brain connectome, or an empirically validated mosquito model. It is an independently implemented mechanics milestone towards those integrations. The upstream biological integration issue remains open.

Open `biology.html` for the body laboratory. Open `./?insect=biological` for the drone environment with this opponent. The default home simulation retains the procedural baseline so older comparisons remain reproducible. Use the model selector to change opponents.

## 2. Provenance — published values versus assumptions

| Parameter | Value | Status |
|---|---:|---|
| Species reference | Drosophila melanogaster | Fruit fly, not mosquito |
| Reference total mass | 0.983 mg = 0.983 × 10^-6 kg | Vaxenburg et al. 2025, Methods |
| Reference body length | 2.97 mm | Same publication |
| Reference full span | 6.04 mm | Same publication |
| Reference wingbeat frequency | 218 Hz | Same publication |
| Wing length from hinge | 2.5 mm | Our geometry assumption, not a fitted measurement |
| Area per wing | 2.2 mm² | Our semi-elliptical planform assumption |
| Air density | 1.225 kg/m³ | Fixed environmental setting |
| Body inertia | Solid-ellipsoid approximation | Derived from mass and assumed 0.45 mm lateral/vertical semiaxes; not upstream articulated inertia |
| Lift coefficient | 1.8 sin(2 alpha) | Simplified assumed coefficient curve |
| Drag coefficient | 0.12 + 2.5 sin²(alpha) | Simplified assumed coefficient curve |
| Visual sample interval | At least 5 ms | Engineering setting |
| Visual transport delay | 25 ms | Engineering setting; not fitted latency |
| Angular-rate/motor filter | 2 ms first-order lag | Engineering setting, not a reconstructed haltere circuit |
| Visual-escape trigger | Expansion > 0.7 rad/s, angular size > 0.08 rad | Assumed engineered rule |
| Escape duration | 160 ms | Assumed engineered rule |
| Body/wing damping | See model.js | Phenomenological coefficients |

Slider mass variation is a sensitivity experiment, not a measured distribution. Frequency slider limits (196–240 Hz) are experimental bounds near the reference, not a validated statement about every fly.

No external body meshes, connectome data, trained weights or source code were copied into this implementation. The geometric illustration is independently generated. Upstream reference revision inspected: `TuragaLab/flybody@d015e9bfe441bd90ae431bac24c55cb74bdbce26`.

## 3. Equations and controls

World frame: right-handed, X/Z horizontal, Y up. Body frame: X right, Y dorsal, Z forward. Quaternions are `[w,x,y,z]`, rotating body vectors into the world. Positions/metres, velocities/m/s, angular velocities/rad/s, forces/newtons, moments/N·m, power/watts. Display unit conversion never changes the simulation.

For each wing, the stroke is `phi = A_side sin(phase) + pitch_bias`, with `phase_dot = 2 pi frequency`. Each wing has a prescribed stroke and feather pattern. Left/right amplitude difference supplies roll authority; a shared fore/aft stroke bias supplies pitch authority; direction-dependent left/right feather bias supplies yaw authority.

Four radial elements approximate each semi-elliptical wing. For each element, air-relative velocity combines body translation, body angular velocity crossed with the element position, wing stroke velocity and ambient wind. The radial component is removed. Lift is normal to the local relative flow; drag opposes it:

```text
q = 0.5 rho area_element speed²
CL = 1.8 sin(2 alpha)
CD = 0.12 + 2.5 sin²(alpha)
F_element = q (CL lift_direction - CD flow_direction)
tau_body = sum(r_element × F_element)
```

The hover trim is solved once by numerical quadrature/bisection on stroke amplitude to make the cycle-averaged vertical wing force match the **reference** mass times gravity. This is model trimming, not fitting to experimental flight. Changing mass or frequency does not insert an artificial supporting force: the controller must adjust the wing amplitude within its limits.

```text
m dv/dt = rotation(q) F_wings + F_body_drag + m g
I domega/dt = tau_wings - omega × I omega - damping
```

Translation uses semi-implicit integration; quaternion rotation uses an incremental exponential map and normalization. Default physical timestep is 0.2 ms (5,000 steps/s, approximately 23 samples per reference wingbeat). A regression compares against 0.1 ms. This numerical convergence check is not proof of aerodynamic accuracy.

The stabilizer runs at approximately 1 kHz with filtered angular feedback. It is an engineered velocity/attitude controller, **not** a learned insect brain. Turning, hovering and reacting to cues change the wing commands. The controller has idealized body-state feedback, and the hover experiment also uses an exact position reference. These privileged insect-control inputs are not claimed to be measured biological sensory channels.

## 4. Sensory response, not a fixed chase replay

The sensory adapter computes angular size, change in angular size, bearing and occlusion for the approaching stimulus. It queues visual observations for delayed delivery. The behavioral controller sees those observations, not current hidden drone coordinates. Synthetic directional range cues support obstacle avoidance; these are not rendered compound-eye images or a validated optic-flow system.

Visual looming triggers a temporary escape velocity command away from the delivered bearing. Wing asymmetries bank the body; the stabilizer counteracts rotation afterwards. Spontaneous heading changes are seeded. This is an engineered behavior based on a published qualitative mechanism, not a fitted reproduction of the 2014 escape dataset.

Airflow has both physical and modeled behavioral relevance, but this version only applies ambient flow and a simple uncalibrated drone-wake disturbance through the force model. It does not reconstruct a mosquito airflow-sensing pathway.

## 5. Interactive experiments

The lab provides hover, forward flight and seeded turns. It includes left/right looming stimuli, an air gust and an angular impulse. Vision, angular-rate feedback, stabilization and wing actuation can be independently disabled. Turning vision off must suppress **visual** escape without eliminating physical gust response. Turning the wings off removes wing force and the body falls.

The default 1/50 speed is actual simulation slow motion, not a decorative slowed wing animation. At full speed a display cannot resolve 218 cycles each second and wing poses alias. The camera follows the body; it does not tether it. The illustration uses a millimetre grid and simplified anatomy. Its wing shapes are illustrative and are not the exact four-element numerical mesh.

Telemetry exposes actual state and motor commands: lift, weight, power, quaternion-derived tilt, stroke amplitude, angular rate and escape events. It does not display synthetic neuron activity. Power is nonnegative translational aerodynamic stroke work only, not total muscle/metabolic/electrical power.

## 6. Drone training integration

`Environment` selects `BiologicalInsect` through `insectModel: 'biological'`. Viewer and training worker use the same class. The insect controller remains fixed while the existing 19-input, 24-hidden-unit, 7-action residual DQN updates the drone policy. The observation dimension is unchanged; no insect neural state or exact body trajectory enters the learned drone observation.

The active model, frequency and mass scale are stored in configuration/checkpoint metadata and experiment export. Reusing an old policy is a warm start, not evidence that it transfers between opponents. The held-out comparison changes seeds in the selected scenario, not house layouts, species or sensor hardware. Training can be slower with wing-resolved dynamics; start with a small episode count. No speed improvement or capture improvement is promised.

An insect hitting scene geometry ends the episode as `insect-collision` and increments `insectCollisions`. It is not silently bounced, nor counted as drone contact success. This simple collision treatment is not a landing/contact mechanics model.

## 7. Verification and test record

`node --test tests/biology.test.mjs` covers reference units, hover trim, symmetry, actuation signs, beat-varying force, hover, wing shutdown, lateral flight, timestep refinement, mass/frequency sensitivity, looming/occlusion/delay, opposite-direction escape, sensory ablation, gust response, roll recovery, data export, seeded replay, policy isolation and learning updates. The existing regression suite is retained.

`python tests/browser_biology.py` runs all existing Chromium tests plus desktop lab controls, physical ablations, biology-specific training/weight metadata, export, mobile layout and project-path loading. Python/Playwright are CI/developer-only tools.

`node scripts/biology-benchmark.mjs` writes `test-results/biology-benchmark.json`. It records compute throughput, hover state, four vision/loom conditions and eight seeded drone trials. GitHub Actions commits the compact result to `test-history` and retains screenshots/traces as run artifacts. Benchmark collision results are diagnostic; passing software tests is not a safety certification.

Local verification result: 51/51 Node tests passed: 25 existing regressions, 24 biological mechanics/integration checks and two worker-protocol checks. The complete training worker performed actual weight updates and evaluated baseline and learned policies on 12 held-out seeds each, using a Node message adapter. This adapter is not browser-origin/CSP validation. Local Chromium navigation was blocked by the execution environment (`ERR_BLOCKED_BY_ADMINISTRATOR`); browser validation must come from the actual GitHub Actions run, not a presumed local pass. Inspect the per-commit CI record for authoritative full-suite/browser results.

## 8. Known omissions and next biological gates

No full 102-DoF articulated flybody, MuJoCo/WASM integration, wing inertia or flexibility, unsteady vortex/wake capture, added-mass/rotational lift, full muscle mechanics, calibrated haltere model, compound-eye rendering, fruit-fly connectome or trained upstream policy is included. There is no mosquito species calibration or fitted escape latency. The drone retains simplified dynamics and the documented oracle-map/moving-occupant limitations from v0.1. Electrical activation remains impossible.

Before promoting this opponent as biologically validated: import licensed experimental trajectories with fixed train/test splits; compare velocity, angular velocity, wing asymmetry and reaction timing; fit only training data; report test errors and failed maneuvers; compare against the procedural baseline; and benchmark any imported upstream body/controller separately. Keep issue #3 open until those acceptance requirements are actually met.

## References

1. Vaxenburg et al. (2025), *Whole-body physics simulation of fruit fly locomotion*, Nature 643, 1312–1320. https://doi.org/10.1038/s41586-025-09029-4 . Source of reference mass, length, span, frequency and the body/controller distinction; this release is not a port of that full model.
2. TuragaLab `flybody`, pinned revision inspected: https://github.com/TuragaLab/flybody/tree/d015e9bfe441bd90ae431bac24c55cb74bdbce26 . Code/model provenance reference only, not bundled dependencies.
3. Muijres et al. (2014), *Flies evade looming targets by executing rapid visually directed banked turns*, Science 344, 172–177. https://doi.org/10.1126/science.1248955 . Qualitative escape mechanism; measurements were not imported/fitted here and species distinctions remain important.
4. Sane & Dickinson (2002), *The aerodynamic effects of wing rotation and a revised quasi-steady model of flapping flight*, Journal of Experimental Biology 205, 1087–1096. https://pubmed.ncbi.nlm.nih.gov/11919268/ . Context for quasi-steady approximations and omitted rotational/added-mass mechanisms. Our coefficient curves are assumptions, not coefficients claimed from this paper.


## 12. Readouts and verification status

The `lift`/`liftMean` snapshot fields report instantaneous/smoothed **world-vertical wing aerodynamic force**, not the norm of the full wing force and not total net force. The vector overlay uses a separately smoothed world-frame wing-force vector. Gravity is shown separately. Stroke-power output excludes muscle efficiency and metabolic cost.

Vision has a nominal 5 ms interval and 25 ms queue delay, quantized to behavioral substeps (up to 5 ms). In the room environment this can produce a slower effective sampling rate than the standalone fine-stepped experiment. It is a synthetic sensing schedule, not measured retinal physiology.

**Delivery status at packaging:** source and test commits are local, based on public repository commit `cbeaadc9dbcfcc9f0a1ec954ae8619f214f34421`; no v0.2 commit, Actions run, pull request or Pages deployment has been created. The current chat connection exposes repository reads but not commit/push operations. The existing live page is not this extension.

Local browser integration remains unverified: HTTP navigation was blocked by the execution environment, and a separate offline view attempt found WebGL2 unavailable. Seven browser cases are provided for a supported machine/GitHub Actions, but they are not counted as passed. Do not merge or publish until the configured browser/CI checks pass.
