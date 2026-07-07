/** Produces a text deliverable for one paid order. */
export type ProviderHandler = (input: {
  serviceId: string;
  requirements: string;
  orderId: string;
}) => Promise<string>;

export type ProviderEvent =
  | { type: 'accepted'; negotiationId: string }
  | { type: 'delivered'; orderId: string }
  | { type: 'completed'; orderId: string }
  | { type: 'error'; stage: 'accept' | 'deliver'; id: string; error: string };
