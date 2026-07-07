import { describe, it, expect } from 'vitest';
import { ReceiptRecorder } from './recorder';
import { formatOrderGraph } from './format';

describe('ReceiptRecorder', () => {
  it('aggregates orders, success count, and spend', () => {
    const rec = new ReceiptRecorder('test goal');
    rec.record({
      stepId: 's1',
      agentId: 'a',
      serviceId: 'svc_a',
      status: 'success',
      dependsOn: [],
      priceUsdc: 0.1,
      payTxHash: '0xaaa',
      elapsedMs: 1000,
    });
    rec.record({
      stepId: 's2',
      agentId: 'b',
      serviceId: 'svc_b',
      status: 'failed',
      dependsOn: ['s1'],
      elapsedMs: 500,
      error: 'boom',
    });

    const graph = rec.build();
    expect(graph.totalOrders).toBe(2);
    expect(graph.successfulOrders).toBe(1);
    expect(graph.totalSpentUsdc).toBe(0.1);
    expect(graph.goal).toBe('test goal');
  });

  it('formats a readable receipt trail', () => {
    const rec = new ReceiptRecorder('g');
    rec.record({
      stepId: 's1',
      agentId: 'alpha',
      serviceId: 'svc',
      status: 'success',
      dependsOn: [],
      priceUsdc: 0.1,
      payTxHash: '0xtx',
      elapsedMs: 2000,
    });
    const text = formatOrderGraph(rec.build());
    expect(text).toContain('alpha');
    expect(text).toContain('0xtx');
    expect(text).toContain('1/1 orders');
  });
});
