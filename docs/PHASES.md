# Maestro — Phase Tracker

Each phase ends at a **proof gate**: a runnable command that demonstrates the phase works.

| #   | Phase                                              | Proof gate                                      | Status |
| --- | -------------------------------------------------- | ----------------------------------------------- | ------ |
| 0   | Foundation (monorepo, tooling, `config`, `logger`) | `pnpm check` all green                          | ✅     |
| 1   | `croo-client` (typed SDK wrapper, WS, events)      | `pnpm ping` prints wallet + USDC balance        | ⬜     |
| 2   | First real A2A hire                                | `pnpm hire` returns result + on-chain txHash    | ⬜     |
| 3   | `registry` (curated agent roster)                  | `pnpm registry:verify` all live                 | ⬜     |
| 4   | `planner` (Claude goal → plan)                     | `pnpm plan "<goal>"` valid plan                 | ⬜     |
| 5   | `orchestrator` + `receipts`                        | `pnpm run:goal "<goal>"` answer + receipt trail | ⬜     |
| 6   | Maestro provider + in-house specialists            | external requester hires Maestro                | ⬜     |
| 7   | Demo surface (CLI / dashboard)                     | recorded ≤5-min run                             | ⬜     |
| 8   | Package & submit                                   | submission checklist green                      | ⬜     |

## Proof log

### Phase 0

- Command: `pnpm check`
- Expected: build, typecheck, lint, format, and tests all pass.
