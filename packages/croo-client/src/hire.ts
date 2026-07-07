import {
  NegotiationStatus,
  OrderStatus,
  isNotFound,
  type AgentClient,
  type Delivery,
  type Order,
} from '@croo-network/sdk';

/** Raised for any expected failure in the hire lifecycle (rejection, expiry,
 * timeout, unsupported service). Carries enough context to show the user. */
export class HireError extends Error {
  constructor(
    message: string,
    readonly context: { serviceId?: string; orderId?: string; negotiationId?: string } = {},
  ) {
    super(message);
    this.name = 'HireError';
  }
}

export interface HireRequest {
  /** Target agent's service id from the CROO Agent Store. */
  serviceId: string;
  /** Free-text task description passed to the provider. */
  requirements?: string;
  /** Optional opaque metadata string. */
  metadata?: string;
}

export interface HireOptions {
  /** Max wait for the provider to accept + the order to be created. */
  acceptTimeoutMs?: number;
  /** Max wait for delivery after payment. */
  deliverTimeoutMs?: number;
  /** Status poll interval. */
  pollIntervalMs?: number;
}

export interface HireResult {
  negotiationId: string;
  orderId: string;
  serviceId: string;
  /** Order price in payment-token base units (USDC has 6 decimals). */
  price: string;
  paymentToken: string;
  /** On-chain transaction hash of the escrow payment. */
  payTxHash: string;
  deliverableType: string;
  /** Text deliverable, if the provider returned text. */
  text?: string;
  /** Parsed JSON when the text deliverable is valid JSON. */
  json?: unknown;
  contentHash: string;
  order: Order;
  delivery: Delivery;
  /** Wall-clock time for the whole hire, in ms. */
  elapsedMs: number;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Hire another CROO agent end-to-end and settle payment on-chain:
 *
 *   negotiate → (provider accepts, order created) → pay (USDC escrow) →
 *   (provider delivers) → fetch deliverable
 *
 * Reliability is poll-based: order and delivery state are read back from the
 * API until a terminal state is reached, so a dropped WebSocket event never
 * strands a hire. Throws {@link HireError} on rejection, expiry, or timeout.
 */
export async function hire(
  client: AgentClient,
  req: HireRequest,
  options: HireOptions = {},
): Promise<HireResult> {
  const acceptTimeoutMs = options.acceptTimeoutMs ?? 90_000;
  const deliverTimeoutMs = options.deliverTimeoutMs ?? 180_000;
  const pollIntervalMs = options.pollIntervalMs ?? 2_500;
  const start = Date.now();

  // 1. Negotiate.
  const negotiation = await client.negotiateOrder({
    serviceId: req.serviceId,
    requirements: req.requirements,
    metadata: req.metadata,
  });
  const negotiationId = negotiation.negotiationId;

  // We do not yet support services that require an off-chain fund transfer.
  if (negotiation.fundAmount && negotiation.fundAmount !== '0') {
    throw new HireError('Service requires a fund transfer, which is not supported yet', {
      serviceId: req.serviceId,
      negotiationId,
    });
  }

  // 2. Wait for the provider to accept and the order to be created on-chain.
  const createdOrder = await pollForOrder(client, negotiationId, acceptTimeoutMs, pollIntervalMs);
  const orderId = createdOrder.orderId;

  // 3. Pay — locks USDC into escrow (SDK auto-handles the ERC-20 approve).
  const payResult = await client.payOrder(orderId);

  // 4. Wait for delivery.
  const { order, delivery } = await pollForDelivery(
    client,
    orderId,
    deliverTimeoutMs,
    pollIntervalMs,
  );

  const text = delivery.deliverableText || undefined;
  return {
    negotiationId,
    orderId,
    serviceId: req.serviceId,
    price: order.price,
    paymentToken: order.paymentToken,
    payTxHash: payResult.txHash,
    deliverableType: delivery.deliverableType,
    text,
    json: tryParseJson(text),
    contentHash: delivery.contentHash,
    order,
    delivery,
    elapsedMs: Date.now() - start,
  };
}

/** Poll until the requester-side order for a negotiation exists. */
async function pollForOrder(
  client: AgentClient,
  negotiationId: string,
  timeoutMs: number,
  intervalMs: number,
): Promise<Order> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const negotiation = await client.getNegotiation(negotiationId);
    if (negotiation.status === NegotiationStatus.Rejected) {
      throw new HireError(
        `Negotiation rejected: ${negotiation.rejectReason || 'no reason given'}`,
        {
          negotiationId,
        },
      );
    }
    if (negotiation.status === NegotiationStatus.Expired) {
      throw new HireError('Negotiation expired before an order was created', { negotiationId });
    }

    const orders = await client.listOrders({ role: 'buyer', pageSize: 50 });
    const order = orders.find((o) => o.negotiationId === negotiationId);
    if (order) return order;

    if (Date.now() >= deadline) {
      throw new HireError(`Timed out after ${timeoutMs}ms waiting for order creation`, {
        negotiationId,
      });
    }
    await sleep(intervalMs);
  }
}

/** Poll order status until delivery is available or a terminal failure occurs. */
async function pollForDelivery(
  client: AgentClient,
  orderId: string,
  timeoutMs: number,
  intervalMs: number,
): Promise<{ order: Order; delivery: Delivery }> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const order = await client.getOrder(orderId);
    if (order.status === OrderStatus.Rejected) {
      throw new HireError(`Order rejected: ${order.rejectReason || 'no reason given'}`, {
        orderId,
      });
    }
    if (order.status === OrderStatus.Expired) {
      throw new HireError('Order expired before delivery', { orderId });
    }
    if (order.status === OrderStatus.DeliverFailed) {
      throw new HireError('Provider failed to deliver', { orderId });
    }

    if (order.status === OrderStatus.Completed || order.status === OrderStatus.Delivering) {
      const delivery = await tryGetDelivery(client, orderId);
      if (delivery && (delivery.deliverableText || delivery.deliverableSchema)) {
        return { order, delivery };
      }
    }

    if (Date.now() >= deadline) {
      throw new HireError(`Timed out after ${timeoutMs}ms waiting for delivery`, { orderId });
    }
    await sleep(intervalMs);
  }
}

async function tryGetDelivery(client: AgentClient, orderId: string): Promise<Delivery | null> {
  try {
    return await client.getDelivery(orderId);
  } catch (err) {
    if (isNotFound(err)) return null; // not submitted yet
    throw err;
  }
}

function tryParseJson(text: string | undefined): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
