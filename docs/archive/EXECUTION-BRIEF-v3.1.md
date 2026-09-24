# Mosquito Drone Lab — browser-first execution brief

**Version:** 3.1 / biological mechanics candidate 0.2.0  
**Date:** 24 September 2026  
**Repository:** https://github.com/pli-poc/drone-simulation  
**Project site:** https://pli-poc.github.io/drone-simulation/  
**Status:** Runnable simulation/learning prototype; the research roadmap is not complete.

This brief supersedes the mandatory Python/MuJoCo/API-server architecture in the earlier v2 outline. The goal remains a physically credible indoor insect-interception research environment with independently controlled insects and drones. The first executable milestone is deliberately smaller and labels its shortcuts. No physical device is connected. Electrical actuation is permanently disabled.

## 1. Decisions and non-negotiable boundaries

1. Ship a static GitHub Pages website. Opening it must require no server, account, Python installation, cloud model, API key, or external CDN. Development uses Node 22; browser testing additionally uses Python/Playwright, neither of which visitors install.
2. Separate computation from presentation. Pure ES modules define the authoritative engine; a dedicated simulation worker owns time and state. Another worker trains the drone. The renderer receives detached snapshots and cannot move an agent.
3. Give the insect and drone different controllers and objectives. An insect reacts; the drone learns. Do not label a procedural insect or neural replay as a validated mosquito or complete fly brain.
4. Prioritize clearance, controllability and abstention over interception. A target near a person must not authorize approach. An unsuccessful safe episode is preferable to a collision.
5. Count detection, tracking, contact and neutralization separately. The first implementation only counts simulated contact; electrical effectiveness is unknown, not 100%.
6. Record assumptions, configuration, seed, model version, commit and test evidence. Preserve commits; no squash or force-push rewriting of delivered history.

## 2. What release 0.1.0 actually implements

| Component | Delivered | Deliberate limitation |
|---|---|---|
| 3D visualization | Native WebGL2, orbit/top/follow views, cutaway home, trails, range rays and envelope | Primitive schematic graphics, not a scientific camera renderer |
| Simulation timing | 60 Hz physics integration; 10 Hz policy/sensing; fixed-seed replay | Timing values are prototype defaults |
| Drone | Position, velocity, heading, speed/acceleration limits, whole-vehicle collision envelope | Acceleration-limited translational surrogate; not rotor-resolved 6-DOF dynamics |
| Insect | Independent stochastic/reactive controller, bounded motion, near-object response, disturbance proxy | Uses idealized proximity cues; no species calibration, wing aerodynamics or neural connectome |
| Environment | Open arena, furnished home, moving occupant, narrow partition gap | Four authored layouts; dynamic occupant future motion is not predicted |
| Sensing | Six instantaneous range rays with noise/dropout; delayed noisy target position; occlusion, expiry and velocity estimate | Detection-output proxy, not camera images, classification or SLAM |
| Navigation | Predictive target/waypoint velocity controller; bounded residual corrections | Local controller may get stuck; no complete global planner |
| Safety filter | Tests candidate commands over a 0.6 s horizon; conservative geometry; person exclusion | Uses exact simulator obstacle map; not a certified or learned-map safety system |
| Learning | Genuine local residual DQN; actual gradient updates, target network, replay buffer | Small CPU baseline; no claim it beats conventional control |
| Evaluation | Baseline and frozen learned policy on the same 12 held-out seeds | Same layout family, not held-out homes; limited statistical power |
| Reproducibility | Seeded resets, strict weight schema, import/export, session trace and learning history export | Weights-only warm start; not exact optimizer/replay-state resumption |
| Electrical contact | Swept relative contact proxy; exclusion checks; electrical flag always false | No voltage/circuit design, hardware control or efficacy model |
| Delivery | GitHub Actions checks, Pages build, test artifacts and durable test-history branch | Software tests do not establish real-world safety |

## 3. Repository architecture

```text
index.html / styles.css             presentation and controls
src/app.js                          orchestrator; validated imports; UI/export
src/core/math.js                    vectors, seeded RNG, intersections
src/core/world.js                   configurations, layouts, occupancy ground truth
src/core/insect.js                  procedural insect controller
src/core/sensors.js                 observation proxy and delayed delivery
src/core/control.js                 baseline, residual actions, oracle-map filter
src/core/environment.js             authoritative fixed-step engine
src/learning/dqn.js                 model, loss, replay and training operations
src/workers/simulation.worker.js    playback episodes and policies
src/workers/training.worker.js      learning episodes and frozen-policy evaluation
src/view/gl.js                      replaceable native WebGL2 primitive renderer
src/view/scene.js                   observer visualization only
scripts/                           build, local server, benchmark, evidence summary
 tests/                            Node regression tests + real Chromium tests
 docs/                             this brief, decisions, test/development records
.github/workflows/                 verify, record history, deploy
```

### Dependency decision

The first milestone uses a narrowly scoped native WebGL2 renderer rather than adding Three.js solely for primitive boxes, rings and orbit controls. It is **not** a replacement physics engine. No runtime packages are required. The rendering adapter can later be replaced with Three.js without changing simulation or learned-policy contracts. Do not grow the renderer into a general-purpose engine.

For realistic biomechanics, first benchmark the official MuJoCo WebAssembly route in a separate adapter. MuJoCo and any neural runtime must be self-hosted assets, lazily loaded and optional until compatibility and throughput are demonstrated. Do not quietly introduce a required Python server or WebGPU requirement.

## 4. Execution and commands

```bash
git clone https://github.com/pli-poc/drone-simulation.git
cd drone-simulation
npm ci
npm test
npm run benchmark
npm run dev
# http://127.0.0.1:4173/drone-simulation/
```

The site is served over HTTP(S) because native module workers are not a file:// workflow. The local server is a development convenience, not a deployed backend.

```bash
# Optional developer-only browser verification
python -m pip install playwright==1.57.0
python -m playwright install chromium
npm run test:browser
npm run build
# Publish the contents of dist/, not the repository root.
```

All public paths are relative, including worker module imports. The local server accepts both root and /drone-simulation/ routes. Test the project prefix explicitly; a root-only test misses common Pages failures.

## 5. Authoritative simulation contract

World coordinates are right-handed, X/Z horizontal and Y up. Positions use metres, velocities metres/second, time seconds. Heading is radians around Y, forward direction [sin(yaw), 0, cos(yaw)]. Quaternions are not used in this milestone. A future rigid-body adapter must introduce a versioned quaternion convention, not silently reinterpret yaw.

```js
const env = new Environment(config);
const observation = env.reset(config); // Array<number>, exactly 19 finite values
const result = env.step(action);        // integer action 0..6
// {observation, reward, terminated, truncated}
const snapshot = env.snapshot();        // detached serializable state
```

`step` advances six 1/60 s substeps except when contact/collision terminates early. Policy commands and the safety filter update once per control step. Each substep advances drone motion, checks swept collision, updates the reactive insect, computes clearance/contact and delivers due measurements. New sensor samples are queued at the control boundary. No future measurement is visible before its delivery time.

Once done, additional steps return zero reward and cannot advance state. Contact/collision terminate; the configured horizon truncates. A new episode requires reset. The playback worker automatically resets completed episodes and increments the seed; Reset replays the current seed.

### Configuration defaults and bounds

| Key | Default | Bounds/allowed values |
|---|---:|---|
| scenario | home | home, arena, dynamic, passage |
| task | contact | contact, navigation |
| seed | 42 | integer 1..2147483647 |
| speed | 1.35 m/s | 0.3..2.4 |
| range | 5.5 m | 0.5..8 |
| latency | 80 ms | 0..500; target observations only |
| dropout | 0.04 | 0..0.8 |
| agility | 0.65 | 0..1.5; proxy response parameter |
| wind | 0.12 | 0..0.6; uncalibrated disturbance coefficient |
| duration | 24 s | 5..90 |

Default room: 8 × 6 × 3 m. Maximum translational acceleration: 4 m/s². Tracking proportional gain: 1.45/s. Velocity response gain: 5/s. Whole-device conservative envelope: 0.28 m. Contact head offset: 0.2 m forward. Contact proxy radius: 0.072 m. These are software experiment defaults, **not measured device specifications**.

### Observations, in exact order

| Indices | Meaning | Normalization |
|---|---|---|
| 0..2 | Target estimate relative to drone; navigation uses waypoint instead | divide by 4, clamp ±1 |
| 3..5 | Estimated target velocity; zero for navigation waypoint | divide by 2, clamp ±1 |
| 6..8 | Drone velocity | divide by 2.4, clamp ±1 |
| 9..14 | Six ranges: +X, −X, +Y, −Y, +Z, −Z | divide by configured range, clamp 0..1 |
| 15 | Track confidence; one for a known navigation waypoint | 0..1 |
| 16 | Observation age; zero for waypoint | seconds clamped 0..1 |
| 17 | Drone height | divide by 3 |
| 18 | Estimated target/waypoint distance | divide by 8, clamp 0..1 |

A missing insect track becomes zero relative position/velocity, zero confidence and age one. Missing range samples are zero, not clear space. Exact insect position is not a policy input; it is used for training reward and scoring. The oracle-map supervisor has privileged obstacle information and must remain explicitly labeled.

### Actions and reward

Seven actions: 0 no residual; 1 +X; 2 −X; 3 +Y; 4 −Y; 5 +Z; 6 −Z. A nonzero action adds a 0.38 m/s correction to baseline desired velocity. Speed limits and the independent safety filter still apply. An action cannot disable exclusions, change physics or enable an electrical device.

Initial per-control-step reward:

```text
2 × (previous distance − new distance)
− 0.012 − 0.003 × new distance
− 0.05 when safety intervention occurs
+ 8 for valid contact
− 15 for collision
```

Distance-based reward uses simulation truth. This is reward shaping, not onboard sensing. A timeout is treated as a terminal horizon for this baseline trainer; exact time-limit bootstrapping and time-to-go observations are a later algorithm comparison, not a hidden implementation change. Evaluate abstention/collisions separately; a scalar reward is not a safety specification.

## 6. Learning and model contracts

Network: 19 inputs → 24 tanh units → 7 linear action values. Float64 JavaScript arithmetic; 655 trainable scalar parameters. Replay capacity 4096; learn after 64 transitions, every fourth control step. Eight samples per update, SGD effective batch learning rate 0.003, Huber derivative clipped ±1, discount 0.97, target-value clamp ±30, small weight decay 1e-5. Target weights refresh every 100 optimizer updates. Exploration starts at 0.4 per episode and decays by 0.96 with floor 0.06. The insect controller stays fixed while drone parameters train.

Checkpoint schema: `mosquito-drone-lab/residual-dqn@1`, dimensions `[19,24,7]`, algorithm `residual-dqn`, metadata and arrays `w1`, `b1`, `w2`, `b2`. Reject unknown schema, wrong dimensions/lengths, nonfinite values and absolute weights above 100. Import size limit: 200 KB. Parse as data; never evaluate code. A checkpoint is a weights-only warm start; optimizer target/replay/RNG state is not a continuation checkpoint.

Training messages:

```text
UI → worker: train {config, episodes:1..300, checkpoint|null}; cancel
worker → UI: progress {episode, episodes, row, updates, steps, elapsed}
worker → UI: evaluating {message}
worker → UI: complete {checkpoint, history, evaluation, elapsed}
worker → UI: cancelled | error {message}
```

Cancellation uses a generation token and bounded chunk yields. Training runs the same Environment implementation as playback with no observer graphics. It does not claim camera-based learning because this version has no camera renderer. A future image-based policy must retain sensor rendering even with the observer hidden.

Evaluation seeds: 700001 + k × 7919, k=0..11. Freeze both controllers and evaluate identical configurations. Store per-seed outcomes, collision counts, interventions and returns. Do not claim superiority from the shape of a training curve. Larger confidence intervals and unseen-layout evaluation are required before stronger claims.

## 7. Navigation and home-operation work packages

The first local controller is not a complete indoor autonomy stack. Implement the following as explicit next deliverables, each behind a scenario/evaluation gate:

**NAV-1 — Estimated occupancy.** Define occupied/free/unknown voxels and observation timestamps. Replace privileged-map filtering with estimated occupancy; keep the oracle mode as a diagnostic baseline. Unknown space must not be treated as free. Measure map error separately from policy performance.

**NAV-2 — Global and local planning.** Implement collision-inflated routes, local time-indexed trajectories, dynamic-object uncertainty and recovery after a miss. A contact trajectory must include a feasible braking/escape segment. Reject narrow gaps using the complete vehicle/head envelope. Detect local deadlock and abandon pursuit rather than oscillate forever.

**NAV-3 — Difficult materials.** Add glass/mirror depth failures, thin cables, plants, curtains, moving doors and sensor blind directions. Model both missed detections and false positives. Distinguish material-sensing failure from collision geometry.

**NAV-4 — People and animals.** Add separate restricted volumes and prediction horizons for people/pets; do not infer clearance merely from failed classification. Cancel target pursuit near protected occupants. Test fallback preconditions: hovering, landing and return-to-dock are not interchangeable safe actions.

**NAV-5 — Perception-first feasibility.** Calculate target pixel footprint, shutter blur, field of view and end-to-end delay before training image detection. Compare external tracking, hybrid and onboard-only configurations; never present externally tracked success as onboard autonomy.

## 8. Physical and biological research work packages

**PHY-1 — Drone adapter.** Introduce mass/inertia, motor/thrust lag, drag, attitude stabilization, guards, battery/payload and contact-head geometry. Add configuration provenance and measured curves. A future quaternion/body-frame contract must be explicit. Validate against hover, acceleration, braking and disturbance reference traces.

**PHY-2 — MuJoCo/WASM compatibility spike.** Pin an upstream release/commit. Load a small model from same-origin assets. Verify engine stepping, collision contacts and fixed-seed reproducibility inside a worker. Determine whether chosen aerodynamic/body extensions and controller operations are supported. Benchmark memory and simulated-seconds per wall-second before adopting it.

**BIO-1 — Mosquito-data baseline.** Reproduce a published species-specific flight model, retaining dataset source/version, units, species, sex and experimental conditions. Validate free-flight distributions and held-out trajectories. Keep host-seeking and threat response separate.

**BIO-2 — Sensory-reactive threat response.** Fit reaction delay, looming response, bank/turn dynamics and local airflow coupling. Do not equate a swatter bow wave with a rotor wake. Calibrate wake influence separately. Prohibit impossible instantaneous turns and hidden target-coordinate shortcuts in the validated model.

**BIO-3 — Fruit-fly body/brain experiment (required research milestone).** This is not an optional footnote to forget. Pin a body/controller implementation, specify visual/airflow/proprioceptive encoders and motor outputs, and test active flight. A connectome supplies structure, not all neural dynamics. Separate connectome synapses from aggregated weighted edges in sizing. Benchmark one reactive insect before parallel training.

Perturb sensory input and introduce unseen approach times/directions to distinguish reaction from replay. Compare connectome-based, data-fitted and procedural opponents on the same held-out biological metrics. Treat fruit fly and mosquito as different model profiles. Upgrade the main opponent only if evidence supports it. Adversarially learned evasion is a stress test, not automatically realistic behavior.

**PHY-3 — Contact/outcome separation.** Introduce physical head coverage, contact duration, readiness and outcome uncertainty only from a defensible device model. Simulated disappearance does not confirm neutralization. Physical electrical integration remains a separate contained engineering effort; do not add energization controls to this site.

## 9. Curriculum and validation sequence

P0: this executable baseline and provenance labels.  
P1: navigation without insects, stopping/recovery and deterministic faults.  
P2: target perception/tracking with explicit sensor errors and confidence.  
P3: calibrated reactive insect and low-level drone physics.  
P4: interception with recovery paths under obstacle and person constraints.  
P5: independent fly-body/connectome experiment; verify reaction, not replay.  
P6: unseen homes/materials, wind/wake profiles, latencies, target species/profiles and controller seeds.  
P7: supervised contained non-energized physical tests only after separate sensing/flight validation.

For every experiment record configuration, upstream models, trained checkpoint, random seeds, commit, contact and collision outcomes, false detections, lost tracks, near misses, exclusion entries, energy proxy/model status and reasons for abstention. Track confidence intervals and failure examples, not just average reward. A validated safe operating domain is future work.

## 10. Tests, history and release gates

Fast tests: seeded RNG and replay, ray/swept intersections, latency/occlusion, bounded observations/actions, waypoint observations, exclusion override, collision accounting, current-vs-historical clearance, episode termination, immutable snapshots, electrical-disabled invariant, checkpoint rejection and real neural-weight updates.

Browser tests: actual WebGL2 startup, no unhandled exceptions or external runtime requests, pause/step/reset and camera controls, scenario changes, project-subdirectory paths, model-card access, real training/comparison completion, import/export, local weight persistence, cancellation and mobile horizontal-overflow checks. Capture screenshots and browser traces.

CI: verify on pushes and pull requests; publish only successful main builds. Upload test evidence even on failure. Write compact result summaries to `test-history` for durable per-run records; detailed screenshot/trace artifacts have 90-day retention. Preserve commit history and use merge commits rather than squash. Each publication embeds its commit in `build.json` and the page footer.

Do not turn test success into a physical-safety or biological-realism claim. The default branch is not administratively protected by this brief; branch protection must be configured separately if required. Do not claim it is enabled unless repository settings confirm it.

## 11. Coding-agent handoff rules

Start with tests and inspect actual source. Implement one work package per reviewable commit. Update this status table and the model card whenever capabilities change. Keep all imports relative or resolved into bundled assets. No network API or secret belongs in the client. Never rename a surrogate to a scientific model without adding provenance and validation. Do not bypass a failed test to deploy; fix or document the failure and keep deployment blocked. Benchmark before adding GPU/WASM complexity. Keep the browser-first design unless an explicit architecture decision changes it.

## 12. Research and platform starting points

These are upstream resources for the pending integration work, not claims that their models are already included:

- MuJoCo browser bindings: https://github.com/google-deepmind/mujoco/tree/main/wasm
- Flybody body/controller project: https://github.com/TuragaLab/flybody
- Flybody research article: https://www.nature.com/articles/s41586-025-09029-4
- FlyGM preprint: https://arxiv.org/abs/2602.17997 (pin and review the chosen revision)
- Mosquito learning preprint: https://arxiv.org/abs/2505.13615
- Google connectomics announcement: https://research.google/blog/a-connectomics-milestone-mapping-the-complete-male-fruit-fly-brain/
- GitHub Pages workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Browser testing: https://playwright.dev/python/docs/intro

Re-check licenses, model/data availability, actual implementation capabilities and revision-specific limitations before importing any upstream asset.


## 13. BIO-ROM-1 — browser-native biological flight mechanics (v0.2)

This section updates the implementation status without closing the full biological research workstream in sections 8–9. Model equations, provenance, limits and reproduction instructions are in `BIOLOGICAL-MODEL.md`.

### Implemented in the local v0.2 candidate

- `src/biology/model.js`: independent 6-DOF fruit-fly rigid body; two prescribed flapping wings; four radial strips per wing; quasi-steady translational lift/drag and body moments; gravity and assumed body drag. Quaternion integration and nominal 0.2 ms substeps. Published reference mass/length/span/frequency; explicitly assumed wing geometry, coefficients, inertia and gains.
- `src/biology/insect.js`: frozen sensory-to-wing controller with delayed synthetic looming cues, seeded spontaneous turns, engineered bank/counterrotation control, and terminal insect-obstacle contact records.
- `src/biology/experiment.js` + `worker.js`: independent laboratory state, simulation clock, sensory/actuation ablations, approach/gust/roll disturbances, and bounded experiment trace export.
- `biology.html`, `view.js`, `lab.js`, `lab.css`: magnified observer, body-follow camera, physical wing pose, actual force/actuator readouts, slow motion and five-millisecond stepping. Observer magnification never changes physical geometry.
- `Environment`: selectable `insectModel` (`procedural` or `biological`), `bioFrequency` (196–240 Hz) and `bioMassScale` (0.7–1.3). The drone's own 19-input policy and fixed safety filter remain separate. No insect internal state enters the drone observation.

### Concrete defaults and interfaces

`BiologicalInsect(p, seed, config).step(dt, drone, boxes, config, time)` exposes read-only position/velocity getters and `snapshot()`. Snapshot adds `bio` with quaternion `[w,x,y,z]`, angular velocity, phase, wing poses, world-vertical wing force, mean world-force vector, aerodynamic stroke power, sensory cues and escaped/contact state. The label `connectome: false` is explicit.

Laboratory worker messages: `reset`, `running`, `rate`, `step`, `toggle`, `stimulus`, `export`. Outbound messages: `snapshot`, `export`, `error`. Any integration divergence stops the experiment. Wing shutdown removes wing support; the observer must never restore altitude to hide a fall.

The shared indoor engine terminates an episode on insect-obstacle contact and reports `insectCollisions`. It does not award mosquito neutralization for this event. Existing moving-person collision shortcomings remain open in issue #2.

### Tests and publication gate

`npm test`: 51 cases, including the original 25, mechanics and sensory ablations, detached snapshots, seeded reproducibility, drone-weight updates, and real worker code exercised through a Node-only message adapter. `npm run test:browser`: seven Chromium integration cases including lab UI/exports, biological-opponent training, and mobile/project paths. `npm run benchmark:biology`: physics timing, hover and sensory ablations plus eight seeded indoor episodes.

CI retains existing main deployment gates, adds the biological benchmark and worker-training record to durable test history, and verifies the deployed biological entry page, worker and model card. Local Node results are not a substitute for browser/CI results. This candidate has not been pushed or deployed at packaging.

### Deliberately not marked complete

The full upstream `flybody`/MuJoCo model, trained flybody policy, connectome controller, measured escape-trajectory fit, calibrated mosquito species model, rotor-wake CFD, real camera perception, localization and real-world safety validation remain unimplemented. BIO-ROM-1 is a runnable comparison model, not a renaming of those requirements.
