# ADR-008 — Whole-CNS requirement and explicit hybrid implementation

Date: 24 September 2026. Supersedes any interpretation of ADR-002/006 that made whole-brain integration optional or treated mechanics-first development as a user-approved scope reduction.

The user required real fly neural integration, an independent drone model, browser-first runtime and repository/test history. The assistant previously delivered a handwritten sensory/wing controller instead. The user rejected that substitution. No dependency preference authorised dropping the neural requirement.

Decision: retain procedural and mechanical baselines, and add a separately loaded full MaleCNS adapter with explicit data selection, point-neuron dynamics, sensory encoding, motor readout and physical body. Preserve all selected Traced nodes/edges and original IDs; no reduced graph or fake activity as a production fallback. Runtime assets are same-origin and reproducibly generated from hash-pinned official inputs. Python data conversion is build tooling, not a visitor-installed service.

The hybrid motor decoder/stabilizer remains explicit and switchable. Full wiring and causal motor effects are separate from physiologically complete/empirically validated flight. Record the zero-efficacy neuromodulatory/unknown-sign handling, source fragments excluded from the selected graph, nominal/effective timing and every evaluation denominator. Keep calibration and household navigation gates open.

Consequences: substantial browser download/RAM/CPU cost; default landing page remains lightweight, full mode loads explicitly; no real-time guarantee. Future acceleration may change execution, not silently shrink the graph. The master brief, model cards, claim register and per-commit evidence support later documents/presentations without reconstructing or embellishing history.
