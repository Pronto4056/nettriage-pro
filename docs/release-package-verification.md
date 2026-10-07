# Local release package verification — October 7, 2026

## Clean checkout

Created isolated local clones with no reused project node_modules. The final tested checkout is commit 13bb169; subsequent package-report edits are documentation only.

- Frozen-lockfile install passed using the cached packages. The initial fully offline attempt lacked registry metadata; normal install fetched metadata and passed supply-chain policy checks. A subsequent fresh clone installed offline successfully.
- pnpm test: 187/187 checks, 12 files, zero failures.
- pnpm build: TypeScript checking and Vite production build succeeded.
- pnpm run format:check: all files passed after .gitattributes was added.
- The first Windows clone exposed CRLF formatting differences in 58 files. The fresh checkout verifies the LF policy correction; binaries retain their contents.

The bundled verifier used pnpm 11.25.0; packageManager recommends 11.19.0 and its committed lockfile remains authoritative. This verifies the locked install with the available compatible pnpm, not a separate run under every package-manager version. npm's unlocked installation path was not separately tested.

## Package contents

The local review folder contains a Git-tracked source archive, a static-build archive from the verified checkout, release instructions and SHA-256 checksums. No .git directory, node_modules, local browser history or environment files are included. Licensing, remote publication and deployment remain unperformed and reserved for approval.

README now describes accepted command evidence beside invalid configuration, the complete parsing pipeline, saved evidence and the status of historical screenshots. Release notes list supported behavior and exclusions. Existing October 6 screenshots are retained and explicitly dated rather than represented as fresh visual verification.

## Pending checks

Follow-up: browser access to the running HTTP tab became available. Fresh checks now pass, with one remaining Blocked item: isolated-profile clear-history confirmation. See browser-release-verification.md for per-check evidence and new screenshots. The earlier denial below is historical. Runtime source and the verified static bundle are unchanged; the refreshed source package includes current reports/screenshots.

Browser automation was denied on October 7. No bypass or alternate browser workaround is used. Fresh visual, clipboard and native-history-control checks remain pending, with manual-release-checklist.md providing the fallback. Prior stage reports retain completed desktop/mobile/focus evidence; virtual DOM tests do not substitute for native browser layout or dialog behavior.

No new logic defect was discovered during this pass. That conclusion is bounded by the automated scenarios and packaging checks; it is not an assertion that the app has no possible issues or that final v1.0 is complete.

Final manual check: isolated-profile clear confirmation/focus/reload and original-session preservation passed by user report. No product code changed; build/test evidence remains applicable.
