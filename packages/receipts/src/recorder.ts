import type { OrderGraph, Receipt } from './types';

const round6 = (n: number): number => Math.round(n * 1e6) / 1e6;

/** Accumulates receipts during an orchestration and builds the final graph. */
export class ReceiptRecorder {
  private readonly receipts: Receipt[] = [];
  private readonly startedAtMs = Date.now();
  private readonly startedAtIso = new Date().toISOString();

  constructor(private readonly goal: string) {}

  record(receipt: Receipt): void {
    this.receipts.push(receipt);
  }

  build(): OrderGraph {
    const successful = this.receipts.filter((r) => r.status === 'success');
    return {
      goal: this.goal,
      startedAt: this.startedAtIso,
      finishedAt: new Date().toISOString(),
      receipts: [...this.receipts],
      totalOrders: this.receipts.length,
      successfulOrders: successful.length,
      totalSpentUsdc: round6(successful.reduce((sum, r) => sum + (r.priceUsdc ?? 0), 0)),
      totalElapsedMs: Date.now() - this.startedAtMs,
    };
  }
}
