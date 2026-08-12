export type PendingTossItem = {
  slug: string;
  color: string;
  option: string;
  quantity: number;
};

export type PendingTossOrder = {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  phone: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
  items: PendingTossItem[];
  createdAt: string;
};

export const TOSS_PENDING_ORDER_PREFIX = "nova-toss-order:";

export function tossPendingOrderKey(orderId: string) {
  return `${TOSS_PENDING_ORDER_PREFIX}${orderId}`;
}
