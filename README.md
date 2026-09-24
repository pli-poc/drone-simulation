# Durable verification history

This branch stores append-only compact test records for `pli-poc/drone-simulation`.

Each `runs/<run-id>-<attempt>-<tested-sha>/` directory identifies the source commit and contains the available verification summary, unit-test XML, browser outcomes and deterministic benchmark. Records are written by GitHub Actions after verification, including failures. Pull-request-only runs retain their evidence in Actions; branch pushes and manual runs also create durable records here.

Application source and the execution brief are on `main`. Detailed browser screenshots and traces are Actions artifacts with a 90-day retention setting. This branch preserves concise results after those artifacts expire; it does not certify physical safety or biological realism.

Source history: https://github.com/pli-poc/drone-simulation/commits/main/

Workflow history: https://github.com/pli-poc/drone-simulation/actions
