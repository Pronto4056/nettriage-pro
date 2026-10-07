# Independent NetTriage Pro design

October 6, 2026. Source authority: the user's independent-development brief.

## Baseline

No local NetTriage implementation, screenshot, export, or verified preview was available. Base44 source access was rejected by its plan gate. The new application has no Base44 dependency. The existing phishing analyzer is a separate project and will remain intact.

## Approach and alternatives

Use a client-side React/TypeScript application with Vite, Vitest, and ordinary CSS. A backend would add operations and data exposure without helping analyze pasted evidence. Plain JavaScript would reduce tooling but lose useful contracts between parsers, rules, and UI. React/TypeScript is the selected balance.

## Architecture

Raw input → trimmed normalization → field validation → unsigned IPv4 calculations → command parsers → deterministic rule evaluation → structured findings → React presentation. Rules never execute network commands. No network probing, server, credentials, analytics, or generative diagnosis.

Network utilities expose strict IPv4 parsing, contiguous mask/prefix conversion, and subnet calculations. /31 assumes a point-to-point link; /32 is a single host route. Results separate severity from confidence. Unknown formats and absent evidence produce explicit limitations rather than positive connectivity claims.

## Interface

A dark-neutral operations workspace with restrained teal accents. Dashboard, triage, history, guides, and command reference share a responsive navigation shell. Findings show evidence, interpretation, and next test. All form controls have labels, keyboard focus, and textual status. Dashboard counts derive only from stored sessions.

## Persistence and security

Versioned localStorage, capped at 50 sessions. User input renders as text. Storage read/write failures must be visible and must not prevent diagnosis. No pasted evidence leaves the browser. Saved sessions may contain sensitive user-entered data; provide deletion and clearing controls.

## Testing

Vitest exercises networking boundaries, parser fixtures, rules, validation, and persistence recovery. Browser checks cover navigation, forms, history, desktop/mobile layout, and keyboard controls. Keep test evidence in docs; do not call v1.0 complete until the full scenario matrix and UI checks pass.

## Initial milestone

Create a runnable shell, subnet utilities and tests, configuration findings, local history, and reference pages. Command-output parsing and broader diagnostic simulation follow as independently tested increments. No license or public deployment selected yet.

## Sources

- https://vite.dev/guide/
- https://vitest.dev/guide/
- https://www.rfc-editor.org/rfc/rfc3021
- https://www.iana.org/assignments/iana-ipv4-special-registry/
