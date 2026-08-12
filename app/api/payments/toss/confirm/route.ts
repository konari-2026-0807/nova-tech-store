import { createClient } from "@supabase/supabase-js";
import type { PendingTossOrder } from "../../../../../lib/toss-payment";

type TossPayment = {
  paymentKey: string;
  orderId: string;
  totalAmount: number;
  status: string;
  receipt?: { url?: string } | null;
};

function apiError(message: string, status = 400, code = "PAYMENT_CONFIRM_FAILED") {
  return Response.json({ error: message, code }, { status });
}

function isPendingOrder(value: unknown): value is PendingTossOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<PendingTossOrder>;
  return Boolean(
    typeof order.orderId === "string"
    && typeof order.amount === "number"
    && Number.isSafeInteger(order.amount)
    && order.amount > 0
    && typeof order.customerName === "string"
    && typeof order.customerEmail === "string"
    && typeof order.phone === "string"
    && typeof order.postalCode === "string"
    && typeof order.addressLine1 === "string"
    && typeof order.addressLine2 === "string"
    && Array.isArray(order.items)
    && order.items.length > 0
    && order.items.every((item) => item
      && typeof item.slug === "string"
      && typeof item.color === "string"
      && typeof item.option === "string"
      && Number.isInteger(item.quantity)
      && item.quantity >= 1
      && item.quantity <= 10),
  );
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!accessToken) return apiError("로그인 세션을 확인할 수 없습니다.", 401, "AUTH_REQUIRED");

    const payload = (await request.json()) as {
      paymentKey?: string;
      orderId?: string;
      amount?: number;
      order?: unknown;
    };
    const paymentKey = payload.paymentKey?.trim() ?? "";
    const orderId = payload.orderId?.trim() ?? "";
    const amount = payload.amount;
    if (!paymentKey || !/^[A-Za-z0-9_-]{6,64}$/.test(orderId) || !Number.isSafeInteger(amount) || !isPendingOrder(payload.order)) {
      return apiError("결제 승인 정보가 올바르지 않습니다.", 400, "INVALID_PAYMENT_DATA");
    }
    if (payload.order.orderId !== orderId || payload.order.amount !== amount) {
      return apiError("저장된 주문과 결제 요청이 일치하지 않습니다.", 400, "ORDER_MISMATCH");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
    const tossSecretKey = process.env.TOSS_SECRET_KEY?.trim();
    if (!supabaseUrl || !supabaseKey || !tossSecretKey) {
      return apiError("결제 서버 환경변수가 설정되지 않았습니다.", 503, "PAYMENT_NOT_CONFIGURED");
    }
    if (!tossSecretKey.startsWith("test_")) {
      return apiError("테스트 결제에는 테스트 시크릿 키가 필요합니다.", 503, "TEST_KEY_REQUIRED");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData.user) return apiError("로그인 세션이 만료되었습니다.", 401, "AUTH_EXPIRED");

    const databaseItems = payload.order.items.map((item) => ({
      slug: item.slug,
      color: item.color,
      option: item.option,
      quantity: item.quantity,
    }));
    const { data: totalsData, error: totalsError } = await supabase.rpc("calculate_order_total", { p_items: databaseItems });
    const totals = Array.isArray(totalsData) ? totalsData[0] : totalsData;
    if (totalsError || !totals || !Number.isSafeInteger(totals.total)) {
      return apiError("상품 금액을 확인하지 못했습니다.", 400, "ORDER_TOTAL_UNAVAILABLE");
    }
    if (totals.total !== amount) {
      return apiError("결제 금액이 현재 상품 금액과 일치하지 않습니다.", 400, "AMOUNT_MISMATCH");
    }

    const encodedSecret = btoa(`${tossSecretKey}:`);
    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodedSecret}`,
        "Content-Type": "application/json",
        "Idempotency-Key": orderId,
      },
      body: JSON.stringify({ paymentKey, orderId, amount: totals.total }),
    });
    const tossResult = await tossResponse.json() as TossPayment & { message?: string; code?: string };
    if (!tossResponse.ok) {
      return apiError(tossResult.message || "토스페이먼츠 결제 승인에 실패했습니다.", tossResponse.status, tossResult.code || "TOSS_CONFIRM_FAILED");
    }
    if (tossResult.orderId !== orderId || tossResult.paymentKey !== paymentKey || tossResult.totalAmount !== totals.total || tossResult.status !== "DONE") {
      return apiError("승인된 결제 정보가 주문과 일치하지 않습니다.", 409, "APPROVAL_MISMATCH");
    }

    const { data: orderData, error: orderError } = await supabase.rpc("place_order", {
      p_customer_name: payload.order.customerName,
      p_customer_email: payload.order.customerEmail,
      p_phone: payload.order.phone,
      p_postal_code: payload.order.postalCode,
      p_address_line1: payload.order.addressLine1,
      p_address_line2: payload.order.addressLine2,
      p_payment_method: "toss_test",
      p_items: databaseItems,
      p_payment_key: tossResult.paymentKey,
      p_toss_order_id: tossResult.orderId,
      p_receipt_url: tossResult.receipt?.url ?? null,
    });
    const order = Array.isArray(orderData) ? orderData[0] : orderData;
    if (orderError || !order?.order_number) {
      return apiError("결제는 승인됐지만 주문 저장에 실패했습니다. 다시 시도하면 중복 결제 없이 복구됩니다.", 500, "ORDER_SAVE_FAILED");
    }

    return Response.json({ orderNumber: order.order_number, receiptUrl: tossResult.receipt?.url ?? null });
  } catch {
    return apiError("결제 승인 중 일시적인 오류가 발생했습니다.", 500);
  }
}
