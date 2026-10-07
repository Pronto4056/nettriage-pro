# Bug log

## NTP-001 — Empty configuration implied completed calculations

- Reproduction: submit the triage form with every field blank.
- Expected: explicitly request more evidence; do not imply subnet calculations occurred; do not save a session.
- Actual: results heading said “Calculations complete,” despite no calculated subnet.
- Cause: heading selected its default solely from warning count.
- Fix: select “More evidence needed” when no subnet was calculated.
- Regression: `tests/presentation.test.tsx`; observed failing assertion before the fix, then passing. Retested in the mobile browser preview.

## NTP-002 — Special-purpose categories tested only one address

- Reproduction: classify `192.31.196.14`, `192.52.193.27`, or `192.175.48.1`.
- Expected: recognize the respective /24 special-purpose blocks.
- Actual: “Public candidate.”
- Cause: two conditions compared exact network addresses; a third block was absent.
- Fix: subnet membership across the complete /24 blocks.
- Regression: three parameterized tests in `tests/network.test.ts`; observed all three fail, then pass after the correction.

## Build cleanup

An empty CSS import emitted a build warning. Removed the unused import and reran the production build with no warnings.

## NTP-003 — Editing input left old findings visible

- Reproduction: analyze the synthetic off-subnet gateway, then change it to `192.168.10.1`.
- Expected: require new analysis before displaying findings for the changed input.
- Actual: the old confirmed finding and saved status remained visible.
- Cause: field handlers updated only the form state.
- Fix: all edit handlers clear results and status.
- Regression: reproduced in browser before fixing; afterward the old result heading count was 0 after the same edit. Automated interaction coverage is a later QA increment.

## NTP-004 — Failed deletion appeared successful

- Reproduction: saved sessions exist but the storage write throws during delete or clear.
- Expected: retain entries and deletion controls; show persistence failure.
- Actual: entries vanished from memory while persisted copies survived, and clear claimed success.
- Cause: UI committed state regardless of storage write outcome.
- Fix: persistHistory commits next state only on successful persistence; clear status is conditional.
- Regression: transaction failure preserves prior sessions; successful transaction persists deletion. Both assertions passed after being observed fail before implementation.

## NTP-005 — Extra saved input properties crashed normalization

- Reproduction: a valid saved input includes an extra null property. With known fields blank, resubmitting could also crash the empty-input check.
- Expected: unknown stored properties never enter diagnostic or form state.
- Actual: normalization or a blank-input scan attempted null.trim().
- Cause: stored input was validated for known keys but returned with all unknown keys.
- Fix: history loading constructs a clean input from exactly five validated fields; engine normalization also reads only known fields.
- Regression: engine tolerates extra null input; history drops unknown properties. Both failed before correction and passed afterward.

# Ping validation corrections — October 6, 2026

Reproduction: paste a Unix run with a statistics heading for a different address, a Windows sample with more timeout lines than lost packets, or a latency average exceeding the reported maximum.

Expected: inconsistent samples produce insufficient-evidence findings and suppress confirmed measurements.

Actual: the initial parser accepted those contradictions. Cause: validation checked Windows heading/count arithmetic and only the numeric average; it did not compare Unix headings, timeout totals or latency tuple ordering.

Fix: compare Unix statistics headings with the target or original hostname, bound Windows observed outcomes by packet totals, and enforce minimum ≤ average ≤ maximum. Five failing regression cases in ping.test.ts then passed; full suite 93/93.
