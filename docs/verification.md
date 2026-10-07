# Foundation verification — October 6, 2026

## Automated checks

Environment: Windows, Node 24.19.0, React 19.3.0, TypeScript 5.9.3, Vite 8.3.2, Vitest 4.1.11. Resolution is recorded in pnpm-lock.yaml.

- Initial networking suite failed because the utilities/engine did not exist; after implementation, 43 networking/rule tests passed.
- Persistence suite failed before storage implementation; after implementation, 5 storage tests passed.
- Three special-purpose classification assertions and one empty-state rendering assertion reproduced bugs, failed before correction, and passed afterward.
- Independent code review found stale results after editing, failed deletion appearing successful, and unsafe extra properties in stored inputs. Corrected all three. Added 4 failing-then-passing regression assertions; browser retest confirmed edits remove old findings/status.
- Latest complete run: **56 passed, 3 test files, 0 failures**.
- TypeScript: `tsc --noEmit`, exit 0.
- Production build: `vite build`, exit 0, 21 modules transformed, no warnings after removal of an empty CSS import.

The bundled environment has Node and pnpm but does not expose npm. Tests/build were run through the installed local tool entry points after pnpm downloaded dependencies; the pnpm test script was also run successfully. Standard npm commands are provided for ordinary Node installations but have not been separately executed here.

## Browser checks

Preview: http://127.0.0.1:5173/ (loopback development server).

- Dashboard renders actual zero-session empty state.
- Synthetic gateway example yields the expected off-subnet finding with explicit routing exceptions and unknown connectivity.
- Session saved, survived reload, reopened with calculated findings, deleted, and remained absent after reload.
- Empty form does not save a session and displays “More evidence needed.”
- Malformed `192.168.1.999` produces an inline validation error and no save.
- Guides and Windows/Linux/macOS command reference render and navigation works.
- Copying `ipconfig /all` showed the copied status and matched the clipboard text.
- Desktop screenshot inspected; mobile override of 390×844 inspected. Browser measured document client/scroll widths of 375/375: no document-level horizontal overflow on the checked form. Navigation itself scrolls horizontally on mobile.
- No browser warnings/errors were recorded in the inspected log sample.

Screenshots: assets/dashboard.jpg, assets/configuration-results.jpg, assets/mobile-triage.jpg. All contain synthetic data only.

## Scope still unverified

No ping, DNS, or traceroute parsers yet. No claim of end-to-end connectivity diagnosis, full v1.0 QA, complete accessibility compliance, or fresh-clone installation on a second computer. Clear-all confirmation/cancellation and exhaustive keyboard traversal remain browser QA tasks. See test-matrix.md.
