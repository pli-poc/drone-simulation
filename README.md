# Mosquito Drone Lab

A browser-local 3D indoor drone simulation and residual-policy learning laboratory.

**Site:** https://pli-poc.github.io/drone-simulation/  
**Execution brief:** [docs/EXECUTION-BRIEF.md](docs/EXECUTION-BRIEF.md)  
**Commit history:** https://github.com/pli-poc/drone-simulation/commits/main/  
**Tests/deployments:** https://github.com/pli-poc/drone-simulation/actions  
**Durable test records:** https://github.com/pli-poc/drone-simulation/tree/test-history

## Run locally

Requires Node 22 or newer for development. The deployed site has **no runtime packages, external CDN, Python backend, cloud model, login or API key**.

```bash
npm ci
npm test
npm run benchmark
npm run dev
```

Open http://127.0.0.1:4173/drone-simulation/ . `npm run build` produces `dist/` for GitHub Pages.

## Use the lab

Choose an arena/home scenario, change sensor and movement assumptions, inspect tracks/ranges/clearance, and compare the conventional controller with a locally trained residual DQN. Start learning pauses the viewer, runs real weight updates in another worker, then evaluates both frozen policies on the same 12 held-out seeds. Apply the learned policy explicitly. Export/import weights and export session traces plus training/evaluation data as JSON.

Weights are saved locally when browser storage permits. Weight imports are warm starts, not exact training resumption. Export important results yourself; browser storage can be cleared.

## Scope and honesty

This is the **first executable prototype**, not a completed research implementation or a physical mosquito-control product. It uses acceleration-limited drone motion, a procedural reactive insect, synthetic detection outputs and an oracle-map safety filter. There is no full fly brain, calibrated mosquito aerodynamics, camera recognition, SLAM, battery model or confirmed electrical effectiveness yet. The execution brief contains explicit follow-on work packages.

**Known benchmark failure:** the initial moving-occupant baseline collides in seeds 42 and 234 of the recorded 12-second scenario batch. This release is an experimental environment, not a solved indoor navigator.

Contact is a simulated geometric event. Electrical activation is impossible in this application. No software test establishes safe operation in a home with people or animals.

## Verification and history

```bash
python -m pip install playwright==1.57.0
python -m playwright install chromium
npm run test:browser
```

Python/Playwright are developer-only test tools. CI runs unit and browser checks, creates benchmark evidence, records compact results on `test-history`, and deploys successful main builds. Detailed screenshots and traces are retained as workflow artifacts for 90 days. See [test records](docs/TEST-RECORDS.md), [development history](docs/DEVELOPMENT-HISTORY.md), and [architecture decisions](docs/DECISIONS.md).

The footer and `build.json` identify the deployed commit. Development occurs in reviewable commits; publishing does not rewrite history.
