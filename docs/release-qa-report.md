# Release QA checkpoint — October 7, 2026

Resumed the October 6 pass with focused work to minimize repeated testing/reviews. No public release or deployment performed.

## Changes and verification

- Added development-only jsdom, ten React DOM workflow checks and ten combined scenario checks. Full suite: 187 tests across 12 files, zero failures. TypeScript checking and production build pass.
- Invalid submissions focus the first marked field. Command-only snapshots are labeled Command evidence.
- Invalid configuration no longer suppresses accepted command observations. Configuration calculations are skipped and saving stays blocked until invalid fields are corrected.
- Oversized rejected evidence is excluded even if trimming would reduce its size. Other accepted fields remain usable; evidence-field errors are distinguished from configuration errors. Three regression cases failed before the resumed fix and passed afterward.
- Workflows cover empty/invalid no-save, save/reopen/remount/delete/reset, stale results, storage corruption/read/write denial/deletion failure, clipboard payload and rejection fallback.
- Combined scenarios cover successful observations without complete-health claims, sampled failures, DNS comparisons, loss, silent traces, notes as context and hostile pasted text.

## Browser evidence and limits

October 6 real-browser checks confirmed invalid-field focus, combined evidence, partial-input findings, native Cancel/Escape focus restoration and record preservation, and 320px layout without document overflow. Earlier stage reports cover command copies and history workflows. The latest broad clipboard rerun was inconclusive and is not counted as passed.

On October 7, browser automation rejected access to the existing localhost preview under its URL security policy. No workaround was attempted. Fresh visual/clipboard verification and cleanup of the synthetic October 6 combined-session record remain pending. User history was not modified in this resumed run.

Independent review on October 6 found the mixed-invalid-input gap and subsequently rejected-evidence handling. Both are addressed with regression coverage. The final small validation correction was checked locally rather than commissioning another review, honoring the user's minimum-credit preference.

## Release position

October 7 follow-up: clean-checkout installation, tests, type/build and formatting now pass. A Windows line-ending defect was fixed and verified in a fresh clone. Source/static review archives, release notes and manual checklist are prepared. See release-package-verification.md. Fresh browser checks remain pending.

The selected English IPv4 configuration/ping/DNS/trace scope can be reviewed as a local release candidate. Final v1.0 readiness is not claimed: fresh browser checks, clean-clone verification and final packaging remain. Broader browser/accessibility coverage and unsupported formats retain documented limits. License and hosting remain user choices.
