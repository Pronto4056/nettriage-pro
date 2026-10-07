# DNS evidence milestone

Implemented selected English nslookup address-output and complete dig IN A parsing. Added optional DNS evidence to the existing Redline form, three labeled synthetic scenarios, and backward-compatible history retention/reopening. Pure parser and modular rules keep resolver and answer addresses separate. No new dependencies, probes, backend or hosting changes.

## Interpretation

Recognizes IPv4 answers and dig canonical-name chains, NXDOMAIN, SERVFAIL, REFUSED, resolver timeout, and NOERROR without a matching A answer. Failure states stay distinct. Returned records do not establish service reachability. NXDOMAIN can concern a canonical-name target and a resolver's particular DNS view.

Resolver mismatch with the supplied configuration is explicit. Matching ICMP replies combined with DNS failure receive a Possible comparison finding: tests may use different targets, times, interfaces and resolvers. No automatic diagnosis of broken DNS configuration or complete connectivity is made.

The parser rejects mismatched answer ownership, malformed IPv4 records, incomplete dig answer counts, unsupported questions, cyclic/conflicting aliases, merged runs, conflicting statuses, mixed dig/nslookup failure text and reversed resolver blocks. A 20,000-character bound applies in the parser, form, engine and history reader. Raw evidence stays in local history; the form discloses this.

## Verification

- 131 automated checks across eight files passed: original 93 plus 38 DNS parser, rule, engine, history and rendering checks.
- TypeScript checking and production build passed.
- Browser: DNS-only synthetic answer parsed; raw text restored after reload/reopening; editing invalidated stale findings; unsupported output produced an insufficient-evidence warning; matching ICMP replies plus timeout showed Possible comparison; NXDOMAIN appeared without a timeout claim.
- Mobile 390px viewport: document width equals scroll width at 375px, with readable disclosures and keyboard focus. Temporary viewport override reset.
- Existing user session preserved. Only newly created synthetic QA records were removed.
- Independent review found two malformed-input attribution defects: mixed dig success/nslookup failure and reversed nslookup resolver block. Both reproduced as failing tests, fixed and independently rechecked. No remaining material issue reported within stage scope.
- Additional test-first corrections cover indented nslookup alias metadata and requiring an actual dig header rather than arbitrary status text.

## Limitations

Selected English IPv4 address-query formats only. One DNS lookup per field. IPv6 answers are not validated; IPv6-only output stays unknown, not automatically failed. PTR, MX, AAAA-only dig, DNSSEC diagnosis, short/custom/localized formats and multiple lookups remain unsupported. Parser fixture tests do not claim real Linux/macOS command execution. Pasted evidence is user-supplied, not authenticated. Traceroute interpretation and full release QA remain next stages.

References: [Microsoft nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup), [ISC BIND dig/nslookup manual](https://bind9.readthedocs.io/en/latest/manpages.html).
