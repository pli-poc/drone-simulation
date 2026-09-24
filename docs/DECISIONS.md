# Architecture decisions

## ADR-001 — Static, browser-first execution
Accepted 2026-09-24. No required Python/API/backend service. Fixed-step simulation and training run in separate native module workers. GitHub Pages hosts same-origin assets. Offline-installed development/test tooling is not a visitor dependency.

## ADR-002 — First runnable milestone versus research destination
Accepted 2026-09-24. Publish a transparent surrogate prototype while keeping physical insect/rotor models and a connectome-controller workstream explicit in the brief. Labels in the page and export explain every important shortcut. Training performs actual weight updates; no claim of improvement without evaluation.

## ADR-003 — Minimal replaceable graphics adapter
Accepted 2026-09-24. Use native WebGL2 for the bounded primitive visualization in milestone 0.1.0. Remove the recovered Three.js dependency. Do not write a general engine; a later Three.js adapter can replace only the observer. Keep higher-fidelity physics separate from graphics. MuJoCo/WASM remains a compatibility/benchmark work package, not a silently removed research objective.

## ADR-004 — Independent safety benchmark, explicitly privileged
Accepted 2026-09-24. The initial filter uses the exact simulator map. Learned residual actions cannot override it or enable electrical output. This architecture is useful for experiments but does not prove real-world safety. Estimated occupancy and dynamic-obstacle prediction are required next steps.

## ADR-005 — Auditable publication
Accepted 2026-09-24. Preserve early recovered code as separate commits. Use a development branch and merge commit. CI gates Pages publication. Store durable compact test records on test-history; screenshot/trace artifacts use 90-day retention. No force pushes, squash merges, secrets in the website, or claims of repository protection not actually configured.
