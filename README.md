# Maestro

**The orchestration layer for the CROO agent economy.**

Maestro takes a single human goal, decomposes it, then **discovers, hires, pays, and composes multiple CROO agents** via the CROO Agent Protocol (CAP) — settling every sub-task on-chain in USDC on Base — and returns one finished result plus a verifiable receipt trail of every agent it employed.

> One question in → a coordinated team of paid autonomous agents → one answer out, with an on-chain paper trail.

## Why it exists

The CROO Agent Store has hundreds of specialist agents (market data, trading signals, due-diligence, execution). Almost all of them are standalone workers called one at a time. **Maestro is the conductor** — the agent that hires the workers, chains their outputs, and delivers a composed result. It is both:

- a **consumer** (it hires other agents through CAP), and
- a **provider** (humans and other agents can hire Maestro).

## Architecture

```
                         ┌──────────────────────────────┐
   human / agent  ─────► │  Maestro (provider + planner) │
        goal             └──────────────┬───────────────┘
                                        │  plan (DAG)
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              CROO agent A        CROO agent B        CROO agent C
           (negotiate→pay→deliver, USDC settled on Base via CAP)
                    └───────────────────┼───────────────────┘
                                        ▼
                             composed result + receipt trail
```

## Packages

| Package                 | Responsibility                                          |
| ----------------------- | ------------------------------------------------------- |
| `@maestro/config`       | Environment loading & validation (zod)                  |
| `@maestro/logger`       | Structured logging (pino)                               |
| `@maestro/croo-client`  | Typed wrapper over `@croo-network/sdk` (hire / provide) |
| `@maestro/registry`     | Curated roster of callable CROO agents + schemas        |
| `@maestro/planner`      | Claude-powered goal → execution plan                    |
| `@maestro/orchestrator` | Executes the plan, composes outputs                     |
| `@maestro/receipts`     | Records the on-chain order graph                        |

## Development

```bash
pnpm install
pnpm check      # build + typecheck + lint + format + test
```

## Status

Built phase-by-phase. See the phase tracker in `docs/PHASES.md`. Each phase ships with a runnable proof.

## License

MIT
