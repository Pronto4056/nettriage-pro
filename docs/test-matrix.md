# Diagnostic QA matrix

Updated October 7, 2026. Automated suite: 187 checks in 12 files. Fresh browser checks now pass as recorded in browser-release-verification.md; isolated-profile clear-history confirmation remains Blocked. Fixtures do not establish real network health or platform execution.

| Scenario                                 | Verified behavior                                         | Evidence                                    |
| ---------------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| IPv4, masks, /0–/32                      | Strict parsing and unsigned calculations                  | network.test.ts                             |
| APIPA / special addresses / gateway      | Categories, mathematical membership and caveats           | network.test.ts; prior browser QA           |
| Successful combined samples              | Observations with broader health unknown                  | releaseScenarios.test.ts; October 6 browser |
| Gateway / complete sampled failure       | No offline/router-failure conclusion                      | releaseScenarios.test.ts                    |
| Numeric replies with DNS failure         | Possible comparison with time/interface caveats           | dns.test.ts; releaseScenarios.test.ts       |
| Loss / latency / unreachable             | Validated sample metrics; Windows errors not echo replies | ping.test.ts                                |
| Silent trace hops                        | Stars not packet loss or failed routers                   | trace.test.ts; prior browser QA             |
| Contradictory / malformed output         | Unsupported facts suppressed; explicit warnings           | parser tests                                |
| Notes disagree with samples              | Notes remain context                                      | releaseScenarios.test.ts                    |
| Invalid config plus valid commands       | Accepted observations visible; no save                    | scenario/workflow tests; October 6 browser  |
| Rejected oversized evidence              | Excluded despite trimming; other fields usable            | releaseScenarios.test.ts                    |
| Empty / invalid form                     | No save; first-error focus                                | workflows.test.tsx; October 6 browser       |
| Save / reopen / remount / reset / delete | Evidence retained; stale results cleared                  | workflows.test.tsx; stage browser reports   |
| Corrupt / denied storage                 | Preserve unreadable history; failed deletes retained      | history.test.ts; workflows.test.tsx         |
| Clipboard success / rejection            | Intended payload and manual fallback                      | workflows.test.tsx; prior browser copies    |
| Clear-history dialog                     | Cancel/Escape preserves records and restores focus        | prior Redline QA; October 6 recheck         |
| Hostile pasted text                      | Unsupported data through text boundaries                  | releaseScenarios.test.ts                    |
| Desktop / mobile / keyboard              | Stage checks; 320px document without overflow             | stage reports; October 6 recheck            |

Clean-checkout setup/build/format, source/static packaging and fresh browser/clipboard checks are verified. Remaining: isolated-profile clear confirmation, broader browser/accessibility coverage and final release designation. Native dialog/layout behavior is not established by jsdom alone. No final v1.0 declaration yet.
