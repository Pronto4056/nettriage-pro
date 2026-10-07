# DNS evidence implementation plan

Goal: interpret selected English nslookup/dig IPv4 address-query output and compare cautiously with ping samples.

Architecture: bounded pure DNS parser → modular DNS findings → existing engine/UI/history. Optional dnsOutput extends version-1 snapshots without changing existing input shape when absent. No new dependencies, network probes or backend. Execute inline under existing development authority and retain current feature checkout for local preview.

## Specification

- Accept one lookup per field, maximum 20,000 characters. Reject recognizable multiple runs or conflicting status/answers without silently merging.
- nslookup: identify resolver separately, answer name and IPv4 addresses, common English NXDOMAIN/non-existent domain, SERVFAIL/server failed, REFUSED/query refused and DNS timeout messages. Resolver Address must never be interpreted as an answer.
- dig: require header status and one IN A question; use only matching A records in ANSWER SECTION, permitting a validated CNAME chain. NOERROR without A answer is a no-address-answer observation, not a resolution failure or complete DNS health. Exclude authority/additional addresses.
- Recognize IPv6-only nslookup answers cautiously as unsupported, not failed. PTR, MX, AAAA-only dig, short-format output and localization are outside this stage.
- Malformed addresses, conflicting success/failure, mismatched names, missing question/status, or multiple runs produce insufficient-evidence warnings. No raw pasted text in findings.
- Compare valid matching echo replies to numeric targets with DNS failure as observations of different tests. Use Possible confidence; do not diagnose a broken configured resolver unless supported. If an observed resolver differs from the supplied DNS field, make that discrepancy explicit.
- UI adds optional DNS text and labeled synthetic answer/NXDOMAIN/timeout samples. Editing invalidates old results; local-history retention is disclosed and validated, old records remain readable.

## Tasks

1. Write failing parser/rule tests for resolver separation, answer and CNAME targets, statuses, missing answers, timeout, conflict/multi-run, unsupported IPv6, malformed input/limits and numeric ping comparison. Implement and run suite.
2. Write failing engine/history/presentation tests. Connect DNS input and rules, preserve history compatibility, update evidence summaries. Run suite/type/build.
3. Inspect desktop/mobile simulations, persistence/reopen and stale-result clearing, independent review, document verified scope and limitations, commit without publishing.

Review focus: resolver mistaken for answer; dig extra sections; NOERROR with no answer; nslookup canonical aliases; repeated runs/conflicts; raw evidence persistence.

Progress: all three tasks completed. Parser and integration tests observed failing before implementation. Review defects reproduced red then fixed; 131 tests green and independent re-review confirms fixes. Desktop/mobile QA and documentation complete. Keep feature branch for review without merge/publishing.
