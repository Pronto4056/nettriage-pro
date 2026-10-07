# Ping evidence milestone

Implemented optional pasted ping evidence alongside the approved Redline form. Pure parsing and separate findings rules recognize selected English Windows/Linux/macOS IPv4 outputs. Configuration calculations are retained. Notes remain context only. No command execution or new network probes were introduced.

## Supported behavior

Each header identifies a separate run. Target echo replies, unreachable messages, packet summary counts, loss and average RTT are extracted where present. Windows received counts alone cannot establish echo response. Partial loss and no-response observations do not diagnose offline hosts, router failure or application health. Different observations for one target remain separate samples; collection time and interface may differ.

Counts, loss arithmetic, responder and summary targets, timeout totals, and latency ordering are checked before publishing measurements. Unsupported/partial/conflicting evidence produces insufficient-evidence findings. Input is limited to 20,000 characters and 20 runs, with no silent truncation. User-supplied text is not independently authenticated.

The form includes three clearly labeled synthetic samples: replies, 25% loss, and Windows unreachable errors counted as received. Raw pasted text is stored locally with the session and restored on reopening. Existing version-1 configuration records remain readable without adding evidence fields. Malformed optional fields preserve and report unreadable history rather than overwrite it.

## Verification

- 93 automated checks across six files passed, including the existing 60 checks and 33 new parser/integration/storage/rendering checks.
- TypeScript and production build checked successfully.
- Browser: evidence-only sample analyzed without interface fields; 25% loss and matching replies shown; saved text and findings restored after reload/reopen; editing clears stale results; unsupported text produces insufficient-evidence warning; unreachable fixture produces no echo-success finding.
- Mobile 390px viewport: document width and scroll width both 375px; findings readable without horizontal overflow. Keyboard navigation inspected on result disclosures. Synthetic screenshots saved in assets/ping-evidence.jpg and assets/ping-mobile.jpg.
- Only synthetic QA sessions created during this milestone were removed. Initial and final saved-history counts were zero. A simulated packet-loss result remains open for review without a saved test session.
- Independent review reproduced three validation defects, each fixed after failing regression tests: Unix summary target mismatch, Windows timeout/count contradiction, and average latency outside reported min/max.

## Remaining work

DNS and traceroute interpretation, broader formats, automated interaction coverage, and full release scenario QA remain future milestones. No public hosting or v1.0 release is claimed. Platform fixtures were exercised by the parser locally; Linux/macOS commands were not executed on those platforms.

## References

Output interpretation was checked against [Microsoft ping documentation](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ping) and the [Linux ping manual](https://man7.org/linux/man-pages/man8/ping.8.html). Individual matching echo responses and packet statistics are separate evidence; duplicates and uncommon outputs require additional parsing.
