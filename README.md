# Mosquito Drone Lab

Browser-local full-connectome neural flight, physical insect mechanics and an independent drone-learning laboratory.

**Whole-CNS laboratory:** https://pli-poc.github.io/drone-simulation/neural.html  
**Drone with neural opponent:** https://pli-poc.github.io/drone-simulation/?insect=neural  
**Mechanical comparison laboratory:** https://pli-poc.github.io/drone-simulation/biology.html  
**Complete master brief:** [docs/EXECUTION-BRIEF.md](docs/EXECUTION-BRIEF.md)

## What runs

The neural option loads the original MaleCNS v1.0 graph: **165,122 Traced neurons**, **25,563,197 neuron-pair connections**, representing **124,025,046 synapses**. No additional neuron/edge sampling or strength threshold is used. Modeled LIF dynamics propagate sensory input through that real wiring, and actual output spikes feed an explicit motor adapter and a force-integrated fly.

The fly and drone have different controllers. The drone keeps its own 19/24/7 residual DQN; the insect's neural state is not a drone observation. The previous procedural and engineered-mechanics opponents remain selectable comparison modes.

**Not a recovered living brain or a validated mosquito.** Point-neuron dynamics, synthetic sensory encoding, motor decoding and flight stabilization remain engineering models. Unknown/neuromodulatory outgoing efficacy is zero in this initial model: 4,143 neurons and 1,023,493 connections are affected but remain in the stored graph. Read [the neural model card](docs/NEURAL-MODEL.md), [mechanical model card](docs/BIOLOGICAL-MODEL.md) and [claim register](docs/CLAIM-REGISTER.json).

## Use the application

Open the whole-CNS laboratory and choose **Load full MaleCNS connectome**. The graph is about 80.2 MB compressed and 208.5 MB decoded, with additional runtime memory. Desktop use is recommended. Baseline visitors do not download it. There is no Python backend, account, API key, remote model or runtime CDN.

Use **Approach from left/right**, **Advance 50 ms**, or **Run**. Disable vision, named populations, synaptic transmission, motor readout, stabilization or wings to compare causal effects. Reset before comparing conditions. Neural flashes represent actual computed spikes at original soma coordinates, not decorative activity. Export records include source identities, model parameters, per-neuron spike totals and bounded trace tails with limits disclosed.

The drone trainer explicitly reports the number of held-out seeds: 12 normally, two for the initial full-CNS mode. That small neural comparison is an integration experiment, not a statistical claim of better interception. Imports are weights-only warm starts; browser storage is not archival storage.

## Develop and reproduce

```bash
npm ci
npm test
# Build-time scientific tooling only; never a visitor-installed backend.
python -m pip install pyarrow==21.0.0 pandas==2.3.3
python scripts/prepare-neural.py
npm run benchmark:neural
npm run dev
```

The source conversion downloads hash-pinned official tables and builds same-origin browser assets. About 1.1 GB of original tables are cached locally. `npm run build` packages the website and prepared assets into `dist/`. Node 22+ is required for developer scripts.

For real browser checks:

```bash
python -m pip install playwright==1.57.0
python -m playwright install chromium
npm run test:browser
```

## Evidence, history and remaining work

[Commit history](https://github.com/pli-poc/drone-simulation/commits/main/) · [Pull requests](https://github.com/pli-poc/drone-simulation/pulls?q=is%3Apr) · [Actions](https://github.com/pli-poc/drone-simulation/actions) · [Durable test records](https://github.com/pli-poc/drone-simulation/tree/test-history).

CI verifies original sources, builds full assets, runs numerical/worker/browser tests, records scenario/biology/neural benchmarks and publishes successful main builds. The public exact commit is checked after deployment. Compact evidence is committed to `test-history`; detailed screenshots/traces have 90-day artifact retention. Preserve failures and merge commits; do not squash the project history.

Current navigation remains an exact-map/synthetic-sensor benchmark. Known moving-occupant failures remain tracked in issue #2. Complete physiological calibration, full articulated upstream body integration, natural mosquito behaviour and physical transfer remain in issue #3 and the master brief. Electrical activation is impossible. Geometric contact does not mean electrocution.

The whole-brain requirement was previously deferred without the user's agreement; the master brief records that correction explicitly. A baseline increment, large neuron count or passing software test must not be presented as completion of empirical biological validation.
