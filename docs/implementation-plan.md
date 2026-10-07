# Foundation implementation plan

Goal: establish an independent, runnable NetTriage Pro and begin configuration diagnostics.

Architecture: pure TypeScript modules feed a React UI; localStorage is the only persistence. Stack: React, TypeScript, Vite, Vitest. Spec: design.md. Execute inline under the user's routine-development authorization.

## Constraints

- No Base44, backend, AI diagnosis, probing, or public deployment.
- No invented connectivity status. /31 point-to-point and /32 host-route semantics remain explicit.
- Preserve unrelated portfolio files; initialize Git only inside NetTriage Pro.

## Review focus

Empty and malformed fields; signed 32-bit arithmetic; conflicting mask/CIDR; storage corruption/denial; narrow-screen navigation.

## Tasks

1. Establish package scripts, strict TypeScript configuration, design, and this plan. Install dependencies and lock exact resolution.
2. Write failing tests for parseIPv4(string), parsePrefix(string), subnet(string, number), classify(string), and analyze(Input). Run tests, implement pure modules, then rerun. Cover /0, /24, /30, /31, /32, non-contiguous masks, gateway membership, APIPA, and partial configuration.
3. Connect dashboard, triage, results, history, guides, and commands. Store versioned input snapshots, recompute findings when reopening, and surface storage errors. Add persistence tests before implementation.
4. Run tests and production build; start the loopback preview, inspect desktop/mobile, document verified and unverified scope, and create a foundation commit.
5. Follow with ping/DNS/traceroute parser fixtures, confidence-aware rules, expanded QA matrix, screenshots, and release documentation. These are subsequent increments, not claims of completed v1.0.
