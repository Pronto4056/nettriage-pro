# Traceroute evidence implementation plan

Goal: interpret selected English IPv4 Windows tracert and Unix traceroute output without diagnosing failed routers from silent probes.

Architecture: bounded pure parser produces target and hop observations; modular rules produce findings; semantic hop table presents extracted facts. Optional traceOutput extends existing version-1 history with backward compatibility. No dependencies, network probes, backend or deployment. Execute inline in existing feature checkout under routine development authority.

## Specification

- One run per field, at most 20,000 characters and 255 hop rows. Require recognizable English IPv4 header and valid maximum-hop bound (1–255).
- Windows: selected ordinary numeric or hostname/bracketed IPv4 rows with RTTs, stars and Request timed out. Unix: numeric or hostname/parenthesized IPv4 responders, RTTs, stars and selected !H/!N/!P/!X annotations, including multiple responders per hop.
- Preserve probe observations, responder addresses and RTT tokens; show hop indices rather than asserting physical topology. Reject duplicate/out-of-order/out-of-bound hop numbers, malformed rows, multiple runs, invalid addresses and unrecognized significant content.
- Destination response requires a matching target address with an observed RTT and no failure annotation in that hop. A completion footer alone cannot prove destination response. A missing destination is inconclusive about offline status or router failure.
- Report silent probes as absent responses, not end-to-end packet loss. If later hops respond after a silent row, explain why silence does not prove a failed forwarding device. Error annotations are reported as ICMP observations, not root causes.
- No universal latency threshold or subtraction of neighboring hop RTTs. Header hop maximum and observed indices do not establish router count or actual network topology.
- Hop table uses semantic table/caption, retains readable responsive layout and text status. Editing invalidates results. Form discloses raw local-history storage and includes three labeled synthetic scenarios.
- Input length enforced in parser/form/engine/history. Older snapshots remain readable. Reject malformed optional history instead of overwrite.

## Tasks

1. Write failing parser/rule tests: Windows/Unix formats, hostname headers, mixed responders, silent middle/later response, destination annotations, missing destination, footer-only, malformed/duplicate/out-of-bound hops, multiple runs, unsupported IPv6, bounds. Implement and run suite.
2. Write failing engine/history/table/form tests; integrate optional field and semantic table, update broader-evidence text. Run suite/type/build.
3. Inspect desktop/mobile samples, persistence/reopen and stale findings, preserve existing history, independent review and regression fixes, document supported scope, commit without publishing.

Review focus: destination matched only as header/error reporter; all-star rows with addresses; malformed suffixes; Unix per-probe responder changes; incomplete Windows footer; responsive table.

Progress: all three tasks complete. Tests observed failing before parser/UI integration and before validation corrections. 167 tests green; type/build, desktop/mobile checks and independent re-review completed. Feature branch retained for review without publishing.
