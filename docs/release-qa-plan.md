# Release readiness QA plan

Goal: verify combined configuration/ping/DNS/trace scenarios and repeatable UI workflows before deciding v1.0 readiness.

Execute inline under routine development authority in current feature checkout. No publishing, license selection, backend or live probes. Add jsdom as a development-only virtual DOM environment for React interaction tests; real-browser QA remains necessary for layout, native dialog focus and clipboard. No product runtime dependency.

1. Create combined scenario fixtures/tests for successful observations, gateway failure, complete sampled loss, DNS failure with ping response, partial loss, silent trace, contradictory samples, notes as context, malformed inputs and rendering-as-text.
2. Add automated React DOM form/history/navigation tests with isolated virtual storage; verify empty/invalid no-save, successful analysis/save/reopen, evidence edit invalidation, reset, corrupted/denied storage behavior and copy interaction. Correct material failures via red/green regression tests.
3. Recheck real-browser desktop/mobile workflows and native controls without altering user records; independently review defects/readiness. Update QA matrix and release report, document scope gaps, run full suite/type/build/format and commit. Do not label v1.0 complete when required behavior remains missing.

Review focus: summary/status overstated health, mixed-target/time comparisons, errors blocking unrelated evidence, sensitive text rendering, corrupted history, misleading saved-session labels.

Progress: combined scenarios and workflow coverage complete; 187 tests/type/build pass. Focus, labels, independent evidence and rejected-field corrections completed. October 6 browser evidence retained; October 7 fresh verification blocked by tool policy. See release-qa-report.md for remaining checks. No final v1.0 declaration yet.
