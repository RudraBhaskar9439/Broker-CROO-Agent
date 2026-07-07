/** One hire's outcome — a single edge in the A2A order graph. */
export interface Receipt {
  stepId: string;
  agentId: string;
  serviceId: string;
  status: 'success' | 'failed';
  /** Step ids whose output fed this hire (the graph edges). */
  dependsOn: string[];
  orderId?: string;
  /** On-chain escrow payment tx (a mock hash in dry-run). */
  payTxHash?: string;
  priceUsdc?: number;
  elapsedMs: number;
  error?: string;
}

/** The complete record of one orchestration — Maestro's proof of work. */
export interface OrderGraph {
  goal: string;
  startedAt: string;
  finishedAt: string;
  receipts: Receipt[];
  totalOrders: number;
  successfulOrders: number;
  /** Sum of successful hires' prices, in USDC. */
  totalSpentUsdc: number;
  totalElapsedMs: number;
}
