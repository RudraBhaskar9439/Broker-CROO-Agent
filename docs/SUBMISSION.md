# Maestro — Submission Runbook

Everything needed to submit to the CROO Agent Hackathon.

## Requirements checklist

| #   | Requirement                                      | Status                                                                |
| --- | ------------------------------------------------ | --------------------------------------------------------------------- |
| 1   | Listed on CROO Agent Store (discoverable)        | Scout ✅ · Maestro ⏳ (add `orchestrate` service, run `pnpm maestro`) |
| 2   | Integrated with CAP — callable, settles on-chain | ✅ 12+ orders settled on Base                                         |
| 3   | Open source, permissive license                  | ✅ MIT — **make the GitHub repo public before submitting**            |
| 4   | Demo (≤5 min) + README                           | README ✅ · presentation page ✅ · video ⏳                           |
| 5   | BUIDL filed on DoraHacks                         | ⏳ (writeup below)                                                    |
| ★   | Bonus: 10+ real CAP orders                       | ✅ 12 settled                                                         |

## On-chain proof (Base mainnet, chain 8453)

First order: [pay](https://basescan.org/tx/0xaa254b7639c887035eea28cbb82b0fbe09488962961dc590cad3d79792b21ea9) ·
[deliver](https://basescan.org/tx/0x424e87e07ddebe7d321a6523fd84c72c1e66071445655487b910019609166432) ·
[clear](https://basescan.org/tx/0x735a1b2cc85bc795c77588b22297c9c9827860b6cfd1bf1ad4cce9683a5c6056)

Agents: Maestro `0xEc51e28044EBCD2382b522147f3DC01525A5D319` (orchestrator) ·
Scout `0xC23238C500FE88C5Ab34e7Cdb40D1655523246bD` (analyst worker)

## Demo video script (~3 min)

1. **Open the presentation page** — the value prop + the settled order graph (nodes link to Basescan).
2. **Terminal — discovery:** `pnpm discover` → agents pulled live from the store, no keys.
3. **Terminal — the run:** `pnpm run:goal -- --llm --live "Assess whether it's safe to hold USDC on Base: smart-contract risk, then liquidity risk, then a verdict."`
   - Narrate: one goal → Groq decomposes → Maestro hires Scout per sub-task → each pays on-chain (show the tx hashes) → composed verdict.
4. **Show Basescan** for one of the pay tx hashes — real USDC settlement.
5. Close on the order graph: `4/4 orders settled · one composed verdict`.

## BUIDL writeup (paste into DoraHacks)

**Maestro — the orchestration layer for the CROO agent economy.**

Maestro takes one goal and autonomously **hires, pays, and composes multiple CROO agents** over CAP, settling every sub-task on-chain in USDC on Base. It decomposes a goal into a dependency graph, negotiates and pays each sub-agent, feeds each result into the next, and returns one composed answer — with a verifiable on-chain receipt trail. Maestro is both **hireable** (H2A) and a **hirer** (A2A): a full node in the agent economy, not a UI on top of it.

It has settled **12+ real CAP orders** on Base with proper payment-state handling (negotiate → pay → deliver → clear, with safe pay-retry), and includes **live, permissionless discovery** of the whole store via the public API — agents finding and paying agents on-chain, which a normal API marketplace can't do.

Open source (MIT), TypeScript monorepo, 44 tests. Built on `@croo-network/sdk`.

## Final user steps

1. Add the `orchestrate` service to the **Maestro** agent; run `pnpm maestro` and hire it once (from Scout or via the store) to prove Maestro is callable.
2. `gh repo edit --visibility public` (or via GitHub settings).
3. Record the demo video per the script above.
4. File the BUIDL on DoraHacks with the writeup above + the repo link.
5. Rotate the SDK/LLM keys (they passed through development chat).
