# Mosquito Drone Lab — complete project and execution brief

**Version 4.0 — whole-CNS integration and evidence baseline**  
**Established:** 24 September 2026  
**Repository:** https://github.com/pli-poc/drone-simulation  
**Published application:** https://pli-poc.github.io/drone-simulation/  
**Owner:** pli-poc; project requested by Sjef van Leeuwen.

This is the authoritative, living brief for implementation and for later detailed project reports, presentations, demonstrations and research discussions. It records the requested destination, implemented increments, unresolved work, scientific sources, assumptions, interfaces, data identities and evidence. It is NOT a declaration that the whole research programme is complete. Per-commit Actions results and model cards determine what has actually been demonstrated.

## Contents

1. Purpose and hypotheses
2. Requirement history and scope correction
3. Non-negotiable delivery constraints
4. Scope, fidelity levels and completion language
5. Requirements and acceptance matrix
6. Scientific references and uncertainty
7. System architecture and component laboratories
8. Full MaleCNS data specification
9. Neuron dynamics, sensory encoding and motor decoding
10. Fruit-fly body physics
11. Mosquito-specific behaviour and calibration
12. Indoor world and navigation
13. Drone dynamics and equipment profiles
14. Airflow and coupled interaction
15. Sensing, perception and tracking
16. Independent safety supervision
17. Contact and electrical outcome model
18. Time, coordinates, units and causality
19. Application and interface contracts
20. Drone learning design
21. Curriculum and randomisation
22. Evaluation and release gates
23. User experience and explanation
24. Data ingestion and experiment records
25. Compute, storage and dependencies
26. Build, test, publication and history
27. Risk register and decision rules
28. Implementation work packages
29. Simulation-to-reality boundary
30. Presentation/report evidence pack
31. Historical delivery and evidence ledger
32. Instructions for future implementers

## 1. Purpose and hypotheses

Build a browser-local 3D research environment in which a physically simulated indoor drone learns tracking, navigation and controlled insect interception against an independently controlled virtual insect. The user proposed eventual electrical mosquito neutralisation; this repository connects to no physical device and cannot energise a contact head.

The scientific/engineering questions are separate:

- Can a particular sensor/vehicle configuration obtain reliable target observations and execute controlled contact while preserving clearance and recovery reserve?
- Can an independently running connectome-based insect expose failures that a procedural opponent misses?
- Do increasingly biological models agree better with held-out insect measurements, rather than merely making a more difficult opponent?
- Does the learned drone policy outperform conventional controllers under the same observations, constraints, scenarios and evaluation splits?
- Which claims survive sensor error, moving obstacles, airflow, uncertain biological parameters and unfamiliar homes?

Success is not an attractive chase animation, a high reward, a large neuron count or a successful software build alone. Navigation takes priority over pursuit. Losing a target is preferable to unsafe movement. A fruit fly is not a validated mosquito substitute.

## 2. Requirement history and scope correction

The user's initial request was a full Markdown build outline, analogous to the earlier EV 3D laboratory, for training a mosquito-intercepting drone in simulation. They suggested the mapped fruit-fly nervous system as a source of natural evasive behaviour. They then provided a male-CNS/Beat Saber account mentioning 165,122 simulated neurons and 25.5 million connections, and asked whether a realistic fly and an independently trained drone could share the environment.

The user explicitly added household operation: avoid non-mosquito objects, furniture and moving occupants, rather than following an insect into them. They required a browser/WebGL experience, computation separated from presentation, and no compulsory Python/API/backend installation. They provided this repository, requested commits and Pages publication, and required a history of commits, tests and failures.

A mechanics-first implementation was delivered as v0.2: physical wings and a rigid body controlled by handwritten sensing/escape/stabilisation logic. This was an engineering increment, NOT fulfilment of the requested neural controller. The assistant made the decision to defer the whole brain without the user accepting that reduction. The user corrected this explicitly: “why not the whole brain simulation. i through we asked that”. The current instruction is to record all these details in the entire brief and continue implementation.

**Binding correction:** whole-brain/connectome integration is a required workstream, not an optional idea that can silently disappear. Browser-first deployment does not authorise substituting handwritten behaviour for the brain. The existing procedural and mechanical models remain clearly named comparison baselines. Honest disclosures of omissions are necessary but do not fulfil omitted requirements.

The user has NOT required zero third-party code at any cost, nor accepted a mandatory backend, a synthetic neural graph presented as real data, or a ZIP-only handoff instead of repository publication. Bundled data/runtime assets are distinct from external installations and services. See the requirements register and historical v3.1 archive.

## 3. Non-negotiable delivery constraints

- Static GitHub Pages application, with relative project-site paths and same-origin runtime assets. No account, API key, paid cloud service, Python server or external CDN for visitors.
- WebGL visualisation. Simulation, neural dynamics and learning are separate modules/workers; rendering must not set physical state or determine simulation time.
- Insect and drone have separate controllers, inputs, state and objectives. Drone observations cannot contain insect neural state or hidden exact positions disguised as sensor measurements.
- Preserve source commits and test history. Use reviewable feature branches and merge commits; no squash, force push or rewriting delivered evidence. Failed tests and unsuccessful experiments remain inspectable.
- Unknowns, assumptions, approximations and incomplete acceptance gates are explicit in the interface, metadata and documentation.
- Actual connectome assets, original neuron identities and running neural state are required for a whole-CNS claim. A fixture, animation, procedural rule or arbitrary small network must never be a production fallback.
- No physical electrical activation. Geometrical contact, observed outcome and confirmed neutralisation remain different quantities.

## 4. Scope, fidelity levels and completion language

| Level | Meaning | What it does not establish |
|---|---|---|
| Procedural baseline | Seeded reactive moving insect | Biology or neuron dynamics |
| Mechanical baseline | Force-integrated wings and rigid-body motion | Connectome control or fitted mosquito behaviour |
| Full-connectome runtime | Every neuron in a stated source selection, all retained edges, explicit neuron dynamics | Complete electrophysiology, every segmentation fragment, or natural behaviour |
| Closed neural/body loop | Sensory input enters neurons; propagated activity affects motor commands and body; movement changes subsequent input | Correct sensory tuning, motor decoding or biological flight calibration |
| Biological validation | Predetermined errors against held-out measurements and perturbations | Real-world drone transfer or household safety |
| Drone-policy validation | Same-condition comparisons, uncertainty and independent safety metrics | Electrical efficacy or hardware readiness |

The current neural work uses all **165,122 Traced MaleCNS v1.0 neurons** and all **25,563,197 positive neuron-pair rows** connecting them, representing **124,025,046 synapses**. This is a full graph for that explicitly defined selection, not every raw fragment in the 151,856,684-row segmentation table. The point-neuron model, visual encoder, motor decoder and flight stabiliser remain modelling choices. Missing neuromodulator/receptor dynamics must remain visible.

Do not use “complete brain simulation” without stating the dataset selection and model limitations. Do not describe a connectome as a living fly, consciousness, awareness or a reconstruction of subjective experience. Do not label an engineered motor adapter as an imported, biologically validated learned flight policy.

## 5. Requirements and acceptance matrix

| ID | Requirement | Acceptance evidence / remaining criterion |
|---|---|---|
| WEB-01 | Browser-first, same-origin, no installed backend | Real browser test; no unexpected external runtime requests; project-prefix asset checks |
| ARC-01 | UI independent of authoritative computation | Worker protocols, detached snapshots, identical core used by viewer and trainer |
| BIO-01 | Real neural wiring, not surrogate rules | Hash-pinned source tables, census, all original body IDs, graph coverage/exclusion report |
| BIO-02 | Running neural dynamics | Membrane/current states, spikes, delays, signs, recurrent propagation, numerical tests |
| BIO-03 | Closed sensory-neural-motor-body loop | Recorded sensory delivery, propagated output spikes, motor/body effects, ablation and disconnection controls |
| BIO-04 | Biologically defensible flight/escape | Held-out trajectory/wing/reaction-time data and predefined error thresholds; NOT yet fulfilled by a causal software test |
| BIO-05 | Natural mosquito relevance | Species-specific measurements and calibration; fruit-fly results kept separate |
| DRN-01 | Independent learned drone model | Separate checkpoint and observation contracts; real weight updates; no insect-state leakage |
| NAV-01 | Obstacle avoidance before pursuit | Whole-envelope sweeps, clearance, loss-of-track/recovery tests and unknown-space rules |
| NAV-02 | People/pets/moving obstacles | Time-indexed occupancy and protected zones; resolve recorded moving-occupant failures |
| SEN-01 | Honest sensing assumptions | Proxy versus rendered-camera modes labelled; latency/blur/dropout/occlusion/coverage tested |
| AER-01 | Coupled airflow | Separate measured wake/calibration gate; current wake is an uncalibrated disturbance proxy |
| ELC-01 | Contact is not neutralisation | Contact/outcome state machine; electrical flag remains false; no inferred efficacy |
| EVD-01 | Complete provenance and failed-run history | Run metadata, raw/processed source hashes, code commit, config, tests and outcome records |
| PUB-01 | Commit and publish in supplied repository | Reviewed PR, successful main workflow and exact public build SHA, not only a local ZIP |
| COM-01 | Future report/presentation source material | Claim register, metrics dictionary, sources, visual evidence and unresolved questions |

A requirement may be partially implemented. Passing the existing regression suite is not a substitute for the specific acceptance criterion. BIO-04, BIO-05, NAV-02, calibrated airflow, realistic camera detection and physical transfer remain open until measured evidence exists.

## 6. Scientific references and uncertainty

Primary sources currently used for the neural/data implementation:

1. MaleCNS official project: https://male-cns.janelia.org/ ; official download specification: https://male-cns.janelia.org/download/ . v1.0 data release: 8 June 2026; paper announcement: 3 September 2026. Data under CC BY 4.0. Brain and nerve cord are included.
2. Berg et al., Cell (2026), MaleCNS: https://doi.org/10.1016/j.cell.2026.08.015 . Anatomical source, not proof that this runtime reproduces physiology.
3. Shiu et al., Nature (2024), computational brain model: https://doi.org/10.1038/s41586-024-07763-9 ; authors' reference equations/constants: https://github.com/philshiu/Drosophila_brain_model/blob/main/model.py . Our implementation is inspired by those point-neuron dynamics; it is not claimed spike-identical to Brian2 or validated on MaleCNS merely because it uses related constants.
4. Vaxenburg et al., Nature (2025), whole-body locomotion: https://doi.org/10.1038/s41586-025-09029-4 ; https://github.com/TuragaLab/flybody . Previously inspected revision: d015e9bfe441bd90ae431bac24c55cb74bdbce26. The current body is NOT a port of that articulated model or its trained policy.
5. Muijres et al., Science (2014), visually directed banked turns: https://doi.org/10.1126/science.1248955 . Qualitative context, not a fitted dataset in the current project.
6. Sane and Dickinson (2002), flapping-flight aerodynamics: https://pubmed.ncbi.nlm.nih.gov/11919268/ . Context for omitted rotational/unsteady effects; our coefficient curves are assumptions.
7. Canonical browser MuJoCo bindings: https://github.com/google-deepmind/mujoco/tree/main/wasm . A possible future self-hosted body adapter, not a runtime dependency already integrated here.

Earlier research leads must be retained rather than rewritten as accomplishments: Tornyol's micro-drone concept was the closest identified article, but the remembered combination of electrocution and a published training pipeline was not verified. The mosquito flight/host-seeking model by Zuo et al. and its code, Wageningen escape/airflow datasets, FlyGM, the Eon embodiment account, PX4 collision prevention/failsafes, transparent-object sensing and small-drone ranging limitations are research inputs in the historical outline. They require exact dataset/licence/revision review before implementation or an externally attributed claim. Free-flight/host-seeking data are not automatically pursuit-escape data; a swatter bow wave is not a rotor wake; a game replay is not generalised sensory-driven flight.

The Beat Saber text supplied by the user is a motivation and requirement source, not an independently reproduced project result. It reported motor replay fitting and unfinished visual learning. Its exact numerical representation must not be used as evidence for our performance. Our census is obtained from the actual official tables and processing manifest.

## 7. System architecture and component laboratories

```text
Static website / WebGL observer and controls
  | commands and detached snapshots
  +-- Simulation worker
  |     World and clock -> drone physics -> synthetic sensors -> tracker
  |     -> baseline or learned drone proposal -> independent safety filter
  |     -> full-envelope movement/contact accounting
  |     Insect adapter -> procedural / mechanical / whole-CNS opponent
  |
  +-- Neural laboratory worker
  |     original connectome -> neuron dynamics -> sensory/motor adapters
  |     -> physical fly -> new sensory observations -> neural activity
  |
  +-- Training worker
        same authoritative world and selected insect adapter
        -> separate drone model / replay / optimisation / held-out evaluation

Build-time data pipeline -> hashed compressed assets -> same-origin deployment
GitHub Actions -> tests / evidence branch / verified Pages artifact
```

Every component needs a standalone laboratory and an integration contract: world; drone; body/wings; neural graph; insect sensory encoding; output decoding; airflow; camera/range/acoustic sensing; tracking; map/localisation; safety; contact; training; replay/evidence. A module that is not yet implemented remains a work package, not an empty interface described as completed functionality.

The renderer receives state and cannot steer the fly or drone. Observer labels/trails are not sensor input. A future MuJoCo, WebGPU or trained-policy adapter must preserve unit/frame/time contracts and receive a new model/version identity.

## 8. Full MaleCNS data specification

Exact inputs and immutable Google Storage generations are pinned in `scripts/prepare-neural.py`. Their SHA-256 identities are checked before conversion:

| Original table | Generation | SHA-256 |
|---|---|---|
| body-annotations-male-cns-v1.0-minconf-0.5.feather | 1780494878811468 | 2177e246113e4cfbf1e7772ec37c6da1955ff22e8063d0b1f833101f99a9a3b2 |
| body-neurotransmitters-male-cns-v1.0.feather | 1780894899156750 | 95c9289220663abeb3409f3ad9e5a7f8a53f8093f5139d15502cd08da8879621 |
| connectome-weights-male-cns-v1.0-minconf-0.5.feather | 1780494887545976 | e35da783d1c686b2b58b3b87cd6a403ae43bfcfba8bff28e08ef752c1a56afc1 |

Base URL: `https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/`.

Selection is exactly annotation `status == Traced`. All positive connection rows whose pre- and postsynaptic IDs are in that set are retained. No additional strength threshold, random edge sample, neuron count reduction or fabricated wiring is allowed. Source confidence filtering already embodied in `minconf-0.5` is NOT an additional filter applied by this application.

Census: 211,577 annotation rows; 165,122 Traced nodes; 151,856,684 source pair rows; 25,563,197 retained pair rows; 124,025,046 retained synapses. Excluded annotation statuses are 15,925 Orphan, 11,864 Glia, 10,751 Unimportant, 5,472 null/unspecified, 1,832 Assign and 611 Anchor. 126,293,487 source pair rows lie outside the retained graph. The manifest retains the corresponding synapse totals too.

Connectivity is compressed into CSR arrays while preserving body IDs and integer synapse counts. Pair count is NOT synapse count. Full-neuron labels, classes, sides and source soma locations are exported separately. Missing coordinates affect drawing only, not whether a neuron is simulated.

Actual decoded graph: **208,468,524 bytes**, SHA-256 `c1a42e90a87768c166c1dd43908065880d6c852440cb28544384ba2cef41343d`. Compressed graph: **80,194,325 bytes**, SHA-256 `417f2a5331512134ce1807f563d33786eef49cc4ef1e4bbbf2957ac347e28bab`. Full cell-identity asset: 1,240,012 compressed bytes. The manifest is the machine-readable authority.

Consensus neurotransmitter labels are used with a deliberately simple sign model: acetylcholine +1; GABA, glutamate and histamine -1; unclear/unknown/dopamine/octopamine/serotonin 0. This is not receptor-specific physiology. **4,143 neurons and 1,023,493 retained outgoing connections have zero efficacy** in this first dynamics model. They are NOT deleted from the graph. A future neuromodulatory/receptor model must be a new, tested model version.

## 9. Neuron dynamics, sensory encoding and motor decoding

All retained neurons have membrane-deviation and synaptic-current state, a refractory clock, a spike counter and lesion state. Sparse execution skips only cells that have never been activated at rest; it does not substitute a reduced graph. Delayed events store presynaptic spike identities and traverse the original outgoing rows on delivery. No decorative/random animation is used as neural evidence.

Model constants: resting/reset potential -52 mV, threshold -45 mV, membrane time constant 20 ms, synaptic time constant 5 ms, nominal refractory 2.2 ms, nominal delay 1.8 ms, efficacy 0.275 mV per signed synapse-count unit. Sensory impulses are 68.75 mV in the current modeled encoding. These are modeling choices inspired by a published framework, not measurements for all MaleCNS cells.

Default timestep is 0.5 ms; nominal delay becomes 2 ms and refractory becomes 2.5 ms at that resolution. 0.1 and 0.2 ms experiments are available. Exact linear subthreshold updates do not remove discrete threshold/delay error. Record nominal and effective values. Subthreshold current and membrane integration pause during refractory intervals in this implementation. Validate against dense reference fixtures; do not claim Brian2 equivalence unless separately demonstrated.

Sensory input currently uses geometric angular size/expansion, occlusion and body-relative bearing. Visual observations are sampled around 5 ms and delayed 25 ms. A continuous, assumed rate encoder drives real LC4 and LPLC2 populations, not a hand-coded motor escape command. Populations are LC4 L/R 71/55; LPLC2 L/R 94/91. This enters at named visual projection neurons, not a reconstructed photoreceptor/compound-eye front end. Side-to-visual-field encoding is an assumption, not established by soma side alone.

Output channels read actual spikes/rates from DNp01 L/R (one each), DNg02 L/R (15/14) and wing-motor-labelled L/R (33/34) populations. Population readout gains and the mapping to motion are engineered. No hidden stimulus geometry is passed into the decoder. The existing body stabiliser still converts desired movement into wing commands; it is visible, switchable and NOT called a reconstructed insect brain. Turn off the readout to preserve neural activity while removing its motor contribution. Turn off synaptic transmission to preserve sensory spikes while eliminating graph-mediated output. Silence named populations to test causal dependence.

No spontaneous firing is invented in the quiescent initial condition. Other unmodelled senses, internal drives, receptor dynamics, plasticity, muscle activation, axonal conduction diversity and physiological calibration remain work. DNg02 direct stimulation is an explicit experimental positive control, not evidence of spontaneous flight initiation. All these limitations must accompany a whole-CNS demonstration.

## 10. Fruit-fly body physics

The current reduced-order body uses reference mass 0.983 mg, body length 2.97 mm, span 6.04 mm and wingbeat 218 Hz from the prior source review. Assumed hinge-to-tip length is 2.5 mm and area per wing 2.2 mm². Inertia is a solid-ellipsoid approximation, not the articulated upstream flybody inertial model. Frequency sensitivity range 196–240 Hz and mass scale 0.7–1.3 are engineering experiment bounds, not measured population distributions.

Four radial elements per wing generate approximate quasi-steady lift/drag. Assumed curves are CL=1.8 sin(2 alpha), CD=0.12+2.5 sin²(alpha). Relative velocity includes body motion, angular motion, wing motion and ambient flow. Forces/moments drive Newton–Euler translation and rotation; gravity is not cancelled by a hidden support force. Hover trim solves cycle-averaged model lift against reference weight. Turning the wings off removes wing force and causes descent.

The default body integration limit is 0.2 ms; caller subdivisions may use smaller equal substeps. Attitude uses [w,x,y,z] quaternions. Motor filtering is an assumed 2 ms lag; engineered stabilisation runs around 1 kHz. Neural backward movement does not automatically rotate the body to chase its own backward heading; heading alignment is explicitly disabled for that adapter.

Omissions: full articulated 102-DoF upstream model, imported trained policy, wing flexibility and inertia, unsteady vortices/wake capture, rotational lift/added mass, full muscles and calibrated halteres. Physical consistency tests are not empirical aerodynamic validation. `BIOLOGICAL-MODEL.md` and its archived v0.2 version retain original assumptions and packaging history.

## 11. Mosquito-specific behaviour and calibration

Retain a separate mosquito profile/model track. Required state includes position, velocity, orientation, behavioural mode, sensory history, energy/effort assumptions and variable reaction delays. Required cues may include visual looming/optic flow, airflow, host-related cues and boundaries; which are implemented must be explicit.

Progression: reproduce a published mosquito free-flight model and its preprocessing; validate on held-out free-flight observations; add a separately identified threat-response component; fit approach-direction and airflow responses from appropriate species/data; compare against the neural fruit-fly opponent. Do not silently combine Aedes host-seeking parameters and Anopheles escape measurements into one allegedly validated species model.

A trace-replay opponent is useful only as a labelled baseline. A reactive opponent must change its response when approach timing/direction or sensory channels change. An adversarially trained evasive insect is a stress-test opponent unless its behaviour also passes biological validation. Harder does not mean more realistic.

## 12. Indoor world and navigation

Current authored scenarios: open arena, furnished home, moving occupant and narrow passage. The room is 8×3×6 m with Y up; geometry includes walls/floor/ceiling, sofa, tables and legs, cabinet, plant, lamp and cable. Current moving occupancy is scripted, not a complete household activity model.

Target detection and obstacle occupancy are different evidence paths. An object must not disappear from collision reasoning merely because it cannot be classified. Recognising a person or pet adds stronger protection; unknown objects still need clearance. Future scenes must represent observed-free, occupied and unknown space; transparent/reflective objects and thin objects need sensing failures, not perfect depth readings.

Required behavioural cases: abandon a mosquito behind furniture; decline an undersized gap; cancel pursuit near a person or pet; anticipate closing doors; recover after a missed contact before reaching a wall; brake/reposition after target loss; prohibit unchecked backward retreat; preserve a checked landing/recovery volume. Include the complete drone, guards and contact head, not only its centre.

The existing exact-map safety filter is an oracle benchmark. Future estimated mapping/localisation, moving-obstacle forecasts and global/local planning must be evaluated separately. Recorded moving-occupant collisions remain a blocking navigation limitation, even when other tests pass.

## 13. Drone dynamics and equipment profiles

Current drone is acceleration-limited translation and heading, not rotor-resolved six-degree-of-freedom flight. Defaults: maximum speed 1.35 m/s, speed configuration 0.3–2.4 m/s, acceleration limit 4 m/s², velocity response gain 5, conservative radius 0.27 m covering vehicle/contact envelope. These are prototype settings, not a selected manufacturer's validated hardware.

Required future vehicle profiles: total mass/centre of mass, inertia, motor/thrust and torque curves, actuator delay, drag, battery state/voltage sag, payload/guard/head geometry, calibration provenance and operating constraints. Include saturation, sensor misalignment, degradation, failure modes and mass changes. Empirical/vendor data must be distinguished from assumed or fitted values; record model/revision/licence/measurement date.

No hardware selection or cost estimate is currently a verified bill of materials. Before expensive decisions, recheck available products and independently measure the selected platform. The project's first deliverable is simulation feasibility, not a buildable energised aircraft.

## 14. Airflow and coupled interaction

Both agents share an environment. The drone alters local flow and the insect can be physically displaced and potentially sense that disturbance. Current wind and nearby downward-wake terms are inexpensive, explicitly uncalibrated proxies. They are not CFD and not a measured micro-drone wake.

Separate background flow, obstacles/boundaries, drone-generated flow, insect force response and insect sensory response. Compare no-wake, proxy-wake and measured/calibrated-wake modes. Do not reuse a swatter/bow-wave experiment as a rotor-field validation. Future reduced fields should expose position/time, flow velocity, uncertainty, applicability bounds and provenance, with performance budgets for training.

## 15. Sensing, perception and tracking

Current defaults: six range rays; range 5.5 m configurable 0.5–8 m; target latency 80 ms configurable 0–500 ms; dropout 0.04 configurable 0–0.8; additive noise; line-of-sight occlusion; track age/expiry and velocity prediction. Target observations are synthetic detection outputs, NOT a trained camera detector or recogniser. The original illustrative 4 mm/2 m/1920 px/90° example gives about 1.9 pixels near image centre; it is a detectability calculation, not a chosen camera specification.

Compare external tracking, hybrid sensing and onboard-only modes. External tracking success cannot prove onboard autonomy. Camera rendering must model projection/resolution, exposure, blur, lighting/contrast, shutter/readout, occlusion, noise, timing, field of view and processing delay. Acoustic/ultrasonic candidates need actual detectability and interference analysis, including drone self-noise and reflections; no unverified sensing technology should be treated as solved.

Pipeline: observations -> detector/classifier or proxy -> association -> uncertain track -> motion prediction. Add false positives, non-target insects, stale observations, lost/reacquired identities and multiple insects. Perception must distinguish no observation from observed absence. Map/localisation uncertainties and coverage restrict navigation. Glass, mirrors, cables, moving curtains, plants and pets belong in the challenge suite.

## 16. Independent safety supervision

Priority order: protected-zone avoidance and collision constraints; controllability and recovery; navigation; target pursuit. The learned policy proposes commands but cannot bypass the supervisor. The present exact-map filter tests a finite candidate set across a 0.6 s horizon with whole-envelope clearance. It is not a certified control barrier guarantee.

Stopping distance must include latency, controller response, acceleration/braking, current velocity and geometry. Checking the contact point alone is insufficient; also check continuation and failure-recovery trajectories. “Hover”, “return” and “land” have different prerequisites and cannot be universal fallbacks. An approaching person can make stationary braking unsafe.

The current dynamic filter uses current obstacle geometry rather than a properly predicted occupancy tube. Issue #2 records collisions in moving-occupant seeds 42 and 234 under the initial 12 s defaults. Resolve these with time-indexed predictions, uncertainty, candidate escape/recovery paths and held-out occupant trajectories. Never hide them by removing the scenario, increasing success rewards or reporting only collision-free seeds.

## 17. Contact and electrical outcome model

Keep a state machine: detected -> tracked -> eligible -> approached -> geometric contact -> outcome observed -> confirmed neutralisation or unconfirmed. Target disappearance, overlap of enlarged display markers, proximity and contact do not establish electrical effectiveness.

Current swept relative contact proxy uses a 0.072 m contact region and a head offset 0.2 m from the drone centre. These are prototype geometrical settings, not mosquito-scale electrode engineering. They must be refined against an actual head profile before physical feasibility claims. Display magnification is independent of these numerical dimensions.

Electrical activation is permanently false in this application. No voltage/circuit instructions or hardware activation path is implemented. A future outcome model would need measurements, contact-duration/geometry conditions, readiness and uncertainty; it must not start at assumed 100% efficacy. People/pets/unknown targets must block eligibility independently of the learned policy.

## 18. Time, coordinates, units and causality

World: right-handed X/Z horizontal, Y up. Body: X right, Y dorsal, Z forward. Quaternion convention [w,x,y,z], rotating body into world. Position m; velocity m/s; force N; torque N·m; power W; angle rad; neural potentials mV; source soma coordinates are original MaleCNS EM coordinates converted from 8 nm voxels to micrometres for drawing only.

Current room integration: six 1/60 s substeps per 0.1 s control step, ending early on termination. Drone policy/sensor updates 10 Hz. Body limit 0.2 ms. Neural default 0.5 ms with fixed-step accumulator; insect neural/body time may lag an outer room boundary by less than one neural step. Record effective timing, not only desired rates. The observer may run at a different frame rate; no frame may teleport physical state.

Neural sensory observations use sampled/delayed signals. Receiving future coordinates or neural states through a convenience feature is prohibited. Threat position frozen within an outer physical interval and rate quantisation are explicit approximations. Replay records include seed, timings, controller, source assets and model version. Weights-only imports are warm starts, not exact optimiser/replay-state continuation.

## 19. Application and interface contracts

```js
const env = new Environment(config, dependencies);
const observation = env.reset(config);
const {observation: next, reward, terminated, truncated} = env.step(action);
const state = env.snapshot();
```

Observation is 19 finite numbers: relative observed target/waypoint vector (3), estimated target velocity (3), drone velocity (3), six ranges, confidence, age, normalised altitude and separation feature. It is not the full physical state. Actions are integers 0–6: no residual, ±X, ±Y, ±Z bounded steering corrections. The baseline computes the nominal motion; safety filters it. Network shape is 19/24/7. All contracts are versioned before dimensional or semantic changes.

`Environment` accepts an injected insect factory for neural mode. Constructing neural mode without verified assets must throw, not silently instantiate the procedural class. The factory shares immutable graph data but creates fresh neuron/body/RNG state per episode. Snapshot mutation cannot affect simulation state. Terminal steps are idempotent; collision/contact terminate, time horizon truncates, insect collision is separately recorded and never a contact success.

Messages include configuration/reset, running/step/rate, policy, training/cancellation, stimulus/toggle, loading/progress, snapshot/error, export/complete. Loading is explicit. Long work yields between bounded chunks; errors stop the experiment rather than inventing a result. Configuration races must not activate stale models. Future adapters use typed, versioned schemas, sequence numbers and causal timestamps rather than uncontrolled cross-module global state.

## 20. Drone learning design

Separate three learning/calibration problems: biological dynamics/behaviour; perception/tracking; drone decision policy. Do not claim joint end-to-end learning when only one is trained. The insect's parameters stay frozen during drone learning, while the insect remains reactive to observations.

Current learner: small CPU residual DQN; 19 inputs, 24 tanh hidden units, seven actions; replay capacity 4,096; warmup 64 transitions; minibatch 8; update every four transitions; target copy every 100 updates; discount 0.97; initial epsilon 0.4 with per-episode decay and floor 0.06; Huber-like clipped error. This is a transparent initial baseline, not proof that DQN is the final optimal algorithm. PPO/recurrent policies and richer observations remain experiments, not hidden dependencies.

Reward currently combines progress, step/distance cost, intervention cost, contact bonus and collision penalty. Exact coefficients are in code and preserved with commit: progress 2×distance reduction; per step -0.012; distance cost -0.003×distance; intervention -0.05; contact +8; drone collision -15. Ground truth may shape training reward but must not enter the deployed observation vector. These rewards do not replace independent safety/biological metrics.

Default procedural/mechanical comparison uses 12 held-out seeds per controller. Full-neural mode initially uses two per controller because of computation; the interface and checkpoint must report the actual count. Neither is a strong statistical claim. Retain unsuccessful training, performance regressions and intervention/collision counts. A short prior biological training run changed weights but performed worse than the conventional baseline; do not erase that result.

## 21. Curriculum and randomisation

Sequence: navigation alone -> stopping/recovery -> moving obstacles -> uncertain target tracking -> controlled contact -> reactive insect -> coupled airflow -> multisensor/perception uncertainty -> unseen homes. Train against a population of calibrated frozen opponents, not one memorised path. Introduce neural sensory/motor parameters and physiology uncertainty only with explicit distribution/provenance.

Randomise geometry/materials, people/pet trajectories, doors, cables, lighting, sensor failure/latency/noise, target size/contrast/species profile, neural/behavioural delays, motor limits, initial states, background flow and wake parameters. Keep training, validation and final-test seeds/layouts/species separate. Tuning on held-out tests invalidates their held-out status and must be logged.

## 22. Evaluation and release gates

Software gates: deterministic reset; finite state; strict data/import validation; correct units/signs/delays; swept collisions; no hidden neural-input leakage; snapshot isolation; cancellation; browser loading; mobile layout; same-origin/project paths; exact deployed SHA.

Neural gates: official source and generated asset hashes; full selected census and edge/synapse totals; preserved IDs; dense-versus-sparse fixture parity; propagation delay; inhibitory sign; refractory behaviour; quiet initial condition; lesion and transmission controls; actual output spikes; motor-readout disconnection; exported configurations/counts/tails and retained source exclusions. Include lower timestep sensitivity; a passing fixture is not a full-network physiology validation.

Body gates: cycle-varying force; symmetric mean torque; correct actuation signs; hover bounds; wings-off descent; disturbance response; numerical timestep sensitivity. Biological gates additionally require held-out empirical trajectories, wing asymmetry, reaction-time distributions and error intervals. Do not replace those with successful code assertions.

Drone metrics: collision/near-miss/protected-zone entry; recovery success; clearance; contact rate and time; target loss/reacquisition; energy/effort once modeled; safety interventions; observation age/confidence; wall/simulated time and memory. Report denominators, task duration, termination definitions and confidence intervals for meaningful sample sizes. Contacts are not neutralisations.

Home challenge suite must include thin/transparent objects, moving occupants, closing doors, blind-direction motion, target-on-person, target-behind-obstacle, narrow gaps, sensor blackout, stale map and no-clear-recovery states. These remain release-blocking for household claims, not for lab-only publication with clear limitations.

## 23. User experience and explanation

Maintain the EV-lab design principles: dark, readable, inspectable components; user-configurable assumptions; repeatable scenarios; replay and comparison. Keep visualisation independent from numerical truth.

Views: room observer; drone sensor/track view; safety/clearance overlays; magnified physical fly; original neural soma projection or sampled activity view explicitly labelled; neuron/population inspector; training history; comparison table; provenance/limitations; export. Neural illumination comes from actual computed spikes. Missing soma locations or display sampling do not change the simulated graph and must be declared.

`neural.html` is a separately loaded laboratory with an explicit full-data download button, graph census, neural clock, actual spikes and output rates, physical fly, left/right approaching stimuli, gust/direct-stimulation controls, population lesions, graph transmission and motor disconnection, stabiliser and wing shutdown, and evidence export. The default landing page must not force an 80 MB download on every visitor.

## 24. Data ingestion and experiment records

Canonical trajectory schema: dataset/species/subject/trial, timestamp and units, coordinate frame, position, orientation when available, velocity derivation, stimulus state, environmental conditions, sensor errors, annotation confidence and split assignment. Never silently interpolate across gaps or rescale units; preserve original raw data and preprocessing revision/hash.

Every neural run records dataset selection, raw-source generations/hashes, derived graph/cell hashes, neuron/edge/synapse counts, sign policy, omitted mechanisms, nominal/effective dynamics, seed, sensory and motor adapter versions, body/drone config, events, metrics and termination. Exported spike tails have capacity/drop counters; aggregate spike counts cover every retained neuron. Do not describe a bounded tail as a complete spike recording.

Training exports include active controller/checkpoint, data source/model identities, network dimensions, optimiser/update counters, curriculum/scenario seeds, evaluation denominator and results. Browser-local storage is not archival storage. Important experiments must be exported into versioned evidence records; CI stores compact machine-readable results on `test-history`.

## 25. Compute, storage and dependencies

Rendering uses native WebGL2; application/runtime uses ES modules and workers. Neural graph processing uses build-time Python, PyArrow and pandas only. Runtime gzip decoding uses the browser's DecompressionStream and SHA-256 uses Web Crypto. No GPU ML package or backend is mandatory. WebGPU/MuJoCo acceleration remains a separately measured adapter decision.

The graph download is about 80.2 decimal MB; decoded arrays about 208.5 MB. Temporary decode/hash buffers, neuron state, labels and drawing add memory. Do not equate compressed size with tab RAM. Running simulation and training workers with independent graph copies can substantially increase memory. Desktop-first full-neural operation is explicit; normal/procedural modes remain lightweight. Measure tab memory/throughput on target machines before parallel environments or real-time claims.

A selected 1× playback rate is a target, not a guarantee. The simulator must report simulated time and measured wall time, yield to UI controls, and never skip neural/body time while claiming accurate real time. Faster-than-real-time benchmarks must name hardware/runtime/model/activity level.

Bulk scientific assets are generated reproducibly from pinned source generations, served from the same Pages origin, and retained in Actions artifacts according to retention policy. Git stores conversion code, exact identities, manifests/evidence and licence attribution rather than the 1.1 GB raw source tables. Published asset URLs and their SHA-256 allow independent checks. Changes to source data require a new identity and census, not replacement under old claims.

## 26. Build, test, publication and history

Development requires Node 22+. A full data rebuild additionally uses pinned build-time scientific packages. Browser tests use Python/Playwright only in development/CI. These are not visitor dependencies.

```bash
npm ci
npm test
# For a fresh full-CNS asset build:
python -m pip install pyarrow==21.0.0 pandas==2.3.3
python scripts/prepare-neural.py
node scripts/neural-benchmark.mjs
npm run dev
# /drone-simulation/neural.html
npm run build
```

CI must prepare/verify the data, run unit/worker/browser tests, retain deterministic scenario/biology/neural benchmark results, build the static artifact and commit compact evidence to `test-history`. Main-only publication is gated by successful verification and history recording. Public verification checks build SHA and neural page/worker/manifest paths. Do not substitute a successful upload for a public deployment check.

Use separate commits for source-data integration, runtime, UI/training, documentation and fixes. Preserve PR discussion, failed runs, screenshots and traces. Detailed artifact retention is currently 90 days; compact result files in Git persist. A later long-term release archive should retain presentation-selected images/metrics beyond artifact expiry. Screenshots must identify the model and tested commit.

## 27. Risk register and decision rules

| Risk | Rule / mitigation |
|---|---|
| Large graph mistaken for correct behaviour | Separate topology, dynamics, adapters and empirical validation gates |
| Silent scope reduction | Whole-brain requirement remains mandatory; baseline increments never close it |
| Source changes/licence ambiguity | Immutable generations, hashes, attribution and fail-closed ingestion |
| Missing neurotransmitter/receptor dynamics | Keep zero-efficacy populations/edges explicit; sensitivity studies before claims |
| Engineered sensor/motor shortcut hidden | Visible labels, switchable adapters and causal controls |
| Full graph saturates or diverges | Record activity/finite-state failures; do not silently drop edges/spikes |
| Household collisions hidden by reward | Independent safety metrics, failed-seed retention and protected-zone tests |
| Heavy browser compute | Explicit load, bounded chunks, cancellable work, measured throughput and memory |
| Learned policy exploits simulator | Held-out layouts/conditions, conventional baselines, observation audits and physical constraints |
| Fruit-fly transfer overclaimed | Separate species calibration and behaviour datasets |
| Contact conflated with efficacy | Explicit outcome states; no electrical activation or invented probabilities |
| Attractive presentation overstates results | Every claim linked to source/run/denominator/status |

## 28. Implementation work packages

**REQ/EVD:** maintain this brief, requirement IDs, decision log, data dictionary, source register and claim/evidence links; retain all corrections and failed work.

**BIO-DATA:** audit original tables; pin generations/hashes; preserve all selected neurons/edges/identities; publish reproducible binary assets and exclusions. New neural source work is recorded under the feature-branch commits and per-run manifests.

**BIO-LIF:** full graph state/delay/spike runtime; numerical reference tests; effective timestep reporting; meaningful finite-state and saturation diagnostics; benchmark realistic activation regimes.

**BIO-LOOP:** synthetic sensory encoder -> named neurons -> graph activity -> explicit motor decoder -> physical body -> sensory feedback. Tests remove vision, specific populations, synaptic transmission and motor readout independently. No direct geometry-to-escape shortcut.

**BIO-CAL:** replace/fine-tune assumed sensory tuning and motor mapping using licensed measurements, with training/test splits. Validate the role of engineered stabilisation; compare a trained neural-body controller to the hybrid baseline. Add missing receptor/neuromodulatory models only with sourced parameters and tests.

**PHY:** benchmark official browser MuJoCo integration and articulated flybody, preserving source licences, units, controller dependencies and performance. An XML or mesh import alone does not complete flight control. Retain reduced-order model as a comparison.

**MOS:** reproduce mosquito-specific free-flight and escape models; import corresponding trajectories and calibrate airflow response. Do not rename Drosophila as a mosquito.

**NAV/SEN/AER:** resolve current moving-occupant failures; implement estimated occupancy/localisation, dynamic prediction, uncertain sensing, realistic imaging and calibrated drone wake. Test recovery after misses and no-clear-path conditions.

**RL:** evaluate richer drone policies and curricula, sufficiently powered held-out comparisons, constrained objectives and sim-to-real uncertainty. Insect learning/calibration and drone learning remain distinct processes.

**PUB/COM:** checked Pages deployment, durable test/claim history, labelled screenshots and later report/presentation production. No future communication task is implicitly executed now.

## 29. Simulation-to-reality boundary

Progression remains: software-only -> non-energised contained hardware experiments -> independently reviewed sensing/control/electrical design -> supervised bounded trials -> evidence-based consideration of household operation. No software test, full neural census or simulated contact establishes safe energised home use. Human/pet protection and permitted operations must be reviewed for the actual jurisdiction and hardware at that time.

There is no physical command or electrical control interface in this repository. Future hardware connectivity would require its own authenticated/authorised interface, supervision, loss-of-link behaviour, logs and risk assessment; it must not be accidentally activated by a browser demonstration.

## 30. Presentation/report evidence pack

Future elaborate documents should be generated from this repository rather than reconstructing claims from conversation memory. Preserve:

- User problem, hypotheses, mandatory requirements and explicit scope corrections.
- A model hierarchy diagram, component/data-flow/clock diagrams, and evidence showing which layers are implemented.
- Source/licence/hash tables, graph census and exclusions, parameter origins and uncertainty.
- Actual neural population/raster traces and body trajectories with stimulus timing and lesion/disconnection controls.
- Drone baseline/learned comparison with denominators, seeds, safety interventions, collisions and uncertainty; include negative results.
- Full build/commit/run identities, reproducible commands, desktop/mobile screenshots and data-export examples.
- Risks, remaining acceptance gates, hardware boundary and a clearly separated roadmap.

A claim register must distinguish REQUESTED, IMPLEMENTED, SOFTWARE-VERIFIED, EMPIRICALLY-VALIDATED and NOT-DEMONSTRATED. A benchmark figure cannot be reworded as a real-world performance promise. Charts must show units, conditions, source IDs and error bars where justified. Do not manufacture missing metrics, neuron activity, improvements, citations or photorealistic hardware evidence.

Suggested later narrative: problem -> household constraints -> why separate insect/drone controllers -> real connectome and explicit physiology assumptions -> closed loop -> causal experiments -> comparison/limitations -> implementation roadmap. This is a communication outline, not a claim that the presentation already exists.

## 31. Historical delivery and evidence ledger

- Repository initialisation: `327d6a27`; browser lab merged via PR #1 as `cbeaadc9`. Published run 36016557115: 25 unit + 4 browser tests passed. A prior browser-harness failure was corrected without weakening CSP and remains in history.
- Initial scenario benchmark: 16 episodes, one contact and two moving-occupant collisions. Seeds 42 and 234 remain tracked in issue #2.
- Biological mechanics: original commits `9990091`, `1b7c744`, `b270303` were first packaged locally, then recovered with exact IDs. An import failure and its fix remain visible. PR #4 merged as `b3491613`; published run 36054102832: 51 unit + 7 browser tests passed. Eight short biological trials had no recorded drone/insect collisions; this does not overturn the original navigation failures or establish household safety.
- v0.2 is a wing/body mechanics milestone with an engineered controller. Its archived packaging-status paragraphs describe that historical moment; they are not the current publication status.
- Whole-brain scope correction: user explicitly rejected treating v0.2 as fulfilment. This v4 brief promotes neural integration to a mandatory, traceable workstream.
- Source audit: run 36055243868; exact v1.0 schema/status census and generations captured. Data build: run 36055657037; all retained connections exported. Neural implementation/evaluation status is determined by the subsequent tested commit and run, not by this source-audit success alone.

## 32. Instructions for future implementers

Read this entire brief and the active model cards before changing code. Keep existing comparison modes and reproducible failed tests. Do not replace the full data with a smaller graph to meet a frame-rate target without an explicitly separate mode and identity. Do not solve an absent motor signal by directly injecting target geometry into the motor decoder. Do not describe static wiring, a displayed body, a replay, a passing build or artificial neural lights as a completed whole-brain controller.

Implement the next missing acceptance condition, record what changed and why, run the appropriate numerical/full-data/browser checks, preserve evidence, commit the work, publish only through the reviewed workflow, and verify the public commit. Update the claim/status records so later project briefs and presentations accurately separate what was requested, what was built and what was demonstrated.
