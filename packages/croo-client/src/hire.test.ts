import { describe, it, expect } from 'vitest';
import type { AgentClient, Delivery, Negotiation, Order } from '@croo-network/sdk';
import { hire, HireError } from './hire';

/**
 * Scriptable fake AgentClient that walks the order through its lifecycle over
 * successive polls, so hire() can be exercised with no network.
 */
function makeFakeClient(opts: {
  rejectNegotiation?: boolean;
  createAfter?: number; // polls before the order appears
  completeAfter?: number; // getOrder calls before status flips to completed
  deliverable?: Partial<Delivery>;
}): AgentClient {
  const createAfter = opts.createAfter ?? 1;
  const completeAfter = opts.completeAfter ?? 1;
  let listCalls = 0;
  let getOrderCalls = 0;

  const order: Order = {
    orderId: 'order_1',
    negotiationId: 'neg_1',
    serviceId: 'svc_1',
    price: '100000',
    paymentToken: 'USDC',
    status: 'created',
    rejectReason: '',
    payTxHash: '',
  } as Order;

  const delivery: Delivery = {
    deliveryId: 'del_1',
    orderId: 'order_1',
    deliverableType: 'text',
    deliverableText: JSON.stringify({ ok: true }),
    deliverableSchema: '',
    contentHash: '0xhash',
    status: 'submitted',
  } as Delivery;

  const fake = {
    negotiateOrder: async (): Promise<Negotiation> =>
      ({ negotiationId: 'neg_1', serviceId: 'svc_1', status: 'pending' }) as Negotiation,
    getNegotiation: async (): Promise<Negotiation> =>
      ({
        negotiationId: 'neg_1',
        status: opts.rejectNegotiation ? 'rejected' : 'pending',
        rejectReason: opts.rejectNegotiation ? 'provider busy' : '',
      }) as Negotiation,
    listOrders: async (): Promise<Order[]> => {
      listCalls += 1;
      return listCalls >= createAfter ? [order] : [];
    },
    payOrder: async () => ({ order, txHash: '0xpaytx' }),
    getOrder: async (): Promise<Order> => {
      getOrderCalls += 1;
      return { ...order, status: getOrderCalls >= completeAfter ? 'completed' : 'paid' } as Order;
    },
    getDelivery: async (): Promise<Delivery> => ({ ...delivery, ...opts.deliverable }),
  };

  return fake as unknown as AgentClient;
}

const fast = { pollIntervalMs: 1 };

describe('hire', () => {
  it('completes the full lifecycle and returns the deliverable + tx hash', async () => {
    const client = makeFakeClient({});
    const result = await hire(client, { serviceId: 'svc_1', requirements: 'do X' }, fast);

    expect(result.orderId).toBe('order_1');
    expect(result.payTxHash).toBe('0xpaytx');
    expect(result.price).toBe('100000');
    expect(result.text).toBe('{"ok":true}');
    expect(result.json).toEqual({ ok: true });
    expect(result.contentHash).toBe('0xhash');
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('waits across polls before the order is created', async () => {
    const client = makeFakeClient({ createAfter: 3, completeAfter: 2 });
    const result = await hire(client, { serviceId: 'svc_1' }, fast);
    expect(result.orderId).toBe('order_1');
  });

  it('throws HireError when the negotiation is rejected', async () => {
    const client = makeFakeClient({ rejectNegotiation: true });
    await expect(hire(client, { serviceId: 'svc_1' }, fast)).rejects.toBeInstanceOf(HireError);
  });

  it('times out waiting for order creation', async () => {
    const client = makeFakeClient({ createAfter: 999 });
    await expect(
      hire(client, { serviceId: 'svc_1' }, { pollIntervalMs: 1, acceptTimeoutMs: 5 }),
    ).rejects.toThrow(/Timed out/);
  });
});
