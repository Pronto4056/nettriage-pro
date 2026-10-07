# Diagnostic QA matrix

Status describes the foundation build only; planned tests are not claimed as passing.

| Scenario                                          | Current check                                         | Status                                                    |
| ------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| Valid configuration                               | Subnet arithmetic; connectivity remains unknown       | Unit verified                                             |
| APIPA                                             | Link-local finding without asserting DHCP failure     | Unit verified                                             |
| Malformed IPv4                                    | Strict octet validation and inline error              | Unit and browser verified                                 |
| Invalid mask / CIDR                               | Reject non-contiguous masks and out-of-range prefixes | Unit verified                                             |
| /0, /24, /30, /31, /32                            | Host counts; /24 range; /31 first endpoint            | Unit verified                                             |
| Gateway outside subnet                            | Calculated membership and cautious caveat             | Unit and browser verified                                 |
| Gateway inside /16 across third octet             | No false mismatch finding                             | Unit verified                                             |
| Empty fields                                      | Insufficient evidence, no history save                | Unit and browser verified                                 |
| Partial forms                                     | Dependency validation; no invented connectivity       | Initial engine path implemented; expand tests             |
| Corrupt / denied storage                          | Explicit error; history not silently overwritten      | Unit verified                                             |
| Session save / reopen / reload / delete           | Persistence and recomputation                         | Browser verified, including deletion surviving reload     |
| Healthy connectivity, DNS success                 | Command parsers and target correlation                | Planned                                                   |
| Unreachable gateway / DNS server                  | Failed probe ≠ offline or service failure             | Planned                                                   |
| IP works but DNS fails                            | DNS-specific likely cause with linked evidence        | Planned                                                   |
| Complete failure                                  | Sampled failure with uncertainty                      | Planned                                                   |
| Partial packet loss                               | Sample scope and percentage                           | Planned                                                   |
| Destination unreachable                           | Sender/message interpretation                         | Planned                                                   |
| Routing failure / intermediate traceroute timeout | No failed-router claim from timeout alone             | Planned                                                   |
| Contradictory evidence                            | Mark conflict and request fresh samples               | Planned                                                   |
| Malformed pasted output                           | Unknown-format result without crash                   | Planned                                                   |
| Desktop/mobile                                    | Dashboard/form/reference navigation                   | Initial browser inspection; full accessibility QA pending |
