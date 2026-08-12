import type { Metadata } from "next";
import { OrderConfirmationClient } from "./OrderConfirmationClient";

export const metadata: Metadata = { title: "주문 확인 — NOVA", description: "NOVA 주문 상태와 배송 정보를 확인하세요." };

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <OrderConfirmationClient orderNumber={orderNumber} />;
}
