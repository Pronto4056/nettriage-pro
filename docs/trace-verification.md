# Traceroute evidence milestone

Implemented selected English IPv4 Windows tracert and Unix traceroute output, cautious modular findings, a semantic hop table, optional pasted trace input, backward-compatible local history and three labeled synthetic examples. No dependencies, network probes, backend or deployment changes.

## Interpretation

Header identifies the intended target and maximum-hop bound. Rows preserve TTL indices, responder addresses, RTT tokens, asterisk counts and selected !H/!N/!P/!X annotations. Multiple Unix responders at one index remain observations, not a physical topology claim. Destination response requires a matching responder and RTT without a recognized failure annotation at that hop. A footer alone cannot confirm response.

Silent probes do not establish router failure or end-to-end packet loss. Later responding rows after a fully silent row receive a specific explanatory finding. Missing target response stays insufficient evidence; limited hop counts, filtering and probe-method differences remain possible. Adjacent RTTs are not subtracted, and no universal latency threshold is assumed.

Malformed headers/addresses/delimiters, unsupported text, duplicate/out-of-order/out-of-bound hops, mixed runs, invalid response times and excessive input produce insufficient-evidence findings; no misleading hop table is shown. The parser/form/engine/history bound is 20,000 characters. Maximum supported hop count is 255, with 1–10 observations per row.

## Verification

- 167 tests across ten files passed: original 131 plus 36 trace parser, rules, engine, storage and presentation checks.
- TypeScript checking and production build passed.
- Browser: trace-only successful example with silent middle row, restored raw output/table after reload/reopen, stale-result invalidation, unsupported output warning without table, bounded missing-target sample, and prohibited-probe annotations without destination confirmation.
- Mobile 390px viewport: document client/scroll widths both 375px. Hop table scrolls inside its 335px region with 560px content; headings remain readable. The region is keyboard focusable and has a horizontal scrolling hint. Viewport override reset after checks.
- Existing history record preserved; only new synthetic QA records removed.
- Independent review identified unpaired address delimiters that could falsely confirm destination response. Four failing regression cases were fixed and rechecked. A nonfinite RTT regression also failed before validation and passed afterward; reviewer independently checked both formats.

## Limitations

Selected English IPv4 formats only; one trace per field. Windows destination-unreachable variants, IPv6, localization, timestamp prefixes, extension output, uncommon annotations, and custom formats may remain unsupported. !H/!N/!P/!X are observations requiring context, not root-cause diagnoses. User-supplied output is not independently authenticated. Fixture tests do not claim real Linux/macOS execution. Full release scenario QA and additional integration checks remain before v1.0.

References: [Microsoft tracert](https://learn.microsoft.com/windows-server/administration/windows-commands/tracert), [Linux traceroute manual](https://man7.org/linux/man-pages/man8/traceroute.8.html).
