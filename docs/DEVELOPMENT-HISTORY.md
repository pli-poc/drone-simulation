# Development history

The Git commit graph is authoritative. This narrative records intent rather than inventing test outcomes for earlier work.

| Stage | Commit / evidence | Outcome |
|---|---|---|
| Repository initialization | `327d6a27e4868b4b053c52a6d7f270f5c4844167` | README only; no runnable site |
| Recovered core tree | `126a33e2aa8af5e649cd905e7cf5adc476bdf64c` | World, insect, sensors and filter preserved; untested at that stage |
| Recovered environment/learning tree | `f842de89d7bfe213d4e6caaf47f61d0acf3b3f3c` | Fixed-step engine, workers and DQN preserved; no test claims |
| Corrected executable milestone | Subsequent commits on `feat/browser-lab` | Browser-first runtime, navigation/near-miss regressions, UI and tests |
| First publication | Merge/deployment records in GitHub Actions | Only call live after Pages job and public URL are checked |

No early commit is retrospectively represented as having passed tests that did not yet exist. Subsequent test evidence identifies the tested source/commit. CI checks the head of each pushed update, not every intermediate ancestor separately.

Sources of continuing history:

- All source changes: https://github.com/pli-poc/drone-simulation/commits/main/
- Review and merge discussion: https://github.com/pli-poc/drone-simulation/pulls?q=is%3Apr
- Test/deploy runs: https://github.com/pli-poc/drone-simulation/actions
- Durable machine-readable per-run summaries: https://github.com/pli-poc/drone-simulation/tree/test-history
- Detailed evidence: each run's artifact (90 days for screenshots/traces)

Failures remain visible. Fixes receive new commits rather than rewriting failed history. Administrative branch-protection rules are not set by the application.


## Biological flight candidate, 24 September 2026

The v0.2 extension is prepared in three local stages: wing/body mechanics and sensory behavior; laboratory UI and room/drone integration; and regression/worker tests, model provenance and CI evidence retention. These commits descend from the exact published base `cbeaadc9dbcfcc9f0a1ec954ae8619f214f34421` and are packaged as a Git bundle plus patches. They are **not remote commits or a deployed release** at packaging.

Local final verification passed 51 Node cases. A complete learning/evaluation run used the unmodified training worker through a Node message adapter. Browser navigation was blocked in the authoring environment and WebGL2 was unavailable in the offline view probe; the seven configured Chromium cases must still run in CI. Details are in `docs/evidence/biology-local/` and the package's publication notes. Full neural/body integration remains tracked separately in issue #3.
