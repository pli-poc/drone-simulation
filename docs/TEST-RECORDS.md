# Test records

## First executable milestone — local verification

2026-09-24: 25 Node regression/unit tests passed on Node 22.16.0. Coverage includes deterministic replay, ray/swept collisions, sensor latency/occlusion, navigation observations, person exclusions, episode termination, current-clearance near misses, immutable snapshots, electrical-disabled invariant, model validation and actual neural-weight updates.

Local browser attempts did not verify the application: first the Playwright-managed binary was absent; a subsequent attempt with the installed Chromium was blocked by the execution environment’s browser policy. No local browser pass is claimed. Real browser tests therefore run on the GitHub-hosted runner.

Browser and publication results are recorded by their workflow runs and the durable `test-history` branch. A local pass is not a GitHub Actions pass; a successful build is not confirmation of public deployment. See the current CI record before inferring either.

## Baseline scenario benchmark

The initial 16-episode benchmark (four layouts × seeds 42, 91, 123, 234; 12 s horizons) recorded one simulated contact and two collisions. Both collisions occurred in the moving-occupant scenario, seeds 42 and 234. They are known failures of the initial local/oracle-map controller, not ignored test errors or evidence of a safe policy. The remaining episodes timed out. Dynamic-obstacle prediction and recovery remain open work.

## Continuing evidence

Each verify run writes a summary containing the Git commit, workflow run ID, test counts/results, available benchmark evidence and generation time. Compact summaries and machine-readable results are preserved on the separate `test-history` branch. This avoids committing changing test data into the application branch or triggering deployment loops.

Screenshots, Playwright traces, raw logs and the benchmark report are uploaded as a workflow artifact with 90-day retention. The compact committed records remain after those artifacts expire, unless repository history is explicitly deleted.

## Interpretation boundaries

The scenario benchmark is a small deterministic software experiment. Tests check implementation behavior; they do not establish biological fidelity, reliable camera detection, general navigation safety, electrical effectiveness or sim-to-real transfer. Collision-free samples, when observed, are samples—not a safety guarantee.


## Local v0.2 biological mechanics candidate

51 Node cases passed (25 existing, 24 biological and two worker protocol cases). A message adapter exercised the real simulation/training modules in Node, including two training episodes and 12 held-out evaluation episodes per controller. This is not a browser integration pass or empirical biological validation.

The original benchmark still has the documented moving-occupant collisions. The small biological benchmark is a separate software test configuration and must not be used to erase those failures. Seven Chromium checks are configured, but browser/CI publication remains pending. See `evidence/biology-local/summary.json` for a source fingerprint and explicit execution statuses.
