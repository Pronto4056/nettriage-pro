# Pasted ping evidence implementation plan

Goal: interpret bounded English Windows/Unix ping samples without turning failed ICMP into unsupported host or service diagnoses.

Architecture: pure parser produces sample facts and warnings; a separate rule module converts facts into findings. Optional ping text extends existing input snapshots, preserving version-1 sessions. No dependencies, probes, backend, or design changes.

Ruling: proceed inline under the user's routine-development authority. This is the next incremental milestone, not the entire v1.0 release. Keep the current feature checkout and local preview available.

## Specification

- Accept multiple samples only when each has its own recognizable ping header. Support English Windows, Linux and macOS IPv4 targets; reject unsupported targets gracefully.
- Extract requested target, actual echo replies, summary counts, loss, and average latency. Windows received counts can include ICMP errors; these must never establish echo reachability.
- Validate summary arithmetic, loss range and conflicting reply evidence. Incomplete or unrecognized samples produce insufficient-evidence findings.
- Replies establish ICMP response only for the supplied sample, not application health. Failed samples never prove offline status. Same-target successful and failed samples are differing observations, not proof of simultaneous contradiction.
- Limit text to 20,000 characters and 20 samples. No raw evidence in generated findings; raw pasted text stays in local history and is described to users.
- Add optional input field pingOutput; old records retain their exact old shape. New records validate optional text and retain it on reopen. Unknown/null optional fields cannot reach the parser.
- Keep approved Redline styling, accessible labels, stale-result invalidation, history controls and command copying.

## Tasks

1. Write parser/rule tests for Windows errors counted as received, Unix summaries, partial output, malformed counts, unsupported target, mismatched responders, mixed samples and size limits. Observe failure; implement pure parser and findings; run suite.
2. Write integration/history/presentation regression tests; observe failures. Connect optional field and findings, preserve old storage compatibility, enforce length at engine boundary, add synthetic example controls. Run suite and type/build checks.
3. Inspect desktop/mobile scenarios, save synthetic screenshots, review independently, fix material issues with regression tests, document supported scope and commit.

Review focus: Windows unreachable received counts; mismatched echo sources; truncated/localized/IPv6 output; raw output persistence; ambiguous multiple runs.

Progress: all three tasks complete. Parser/integration tests observed failing before implementation; 93 tests pass after review fixes. Browser QA, independent re-review, documentation, type checking and production build completed. Keep this feature branch in place for local review; no merge or publishing requested.
