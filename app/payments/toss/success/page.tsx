"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, RotateCw, ShieldCheck } from "lucide-react";
import { CatalogHeader } from "../../../components/CatalogHeader";
import { useCart } from "../../../components/CartProvider";
import { supabase } from "../../../../lib/supabase";
import type { PendingTossOrder } from "../../../../lib/toss-payment";
import { tossPendingOrderKey } from "../../../../lib/toss-payment";

export default function TossPaymentSuccessPage() {
  const { clearCart } = useCart();
  const startedRef = useRef(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const confirmPayment = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setProcessing(true);
    setError("");

    try {
      const params = new URLSearchParams(window.location.search);
      const paymentKey = params.get("paymentKey") ?? "";
      const orderId = params.get("orderId") ?? "";
      const amount = Number(params.get("amount"));
      const saved = window.sessionStorage.getItem(tossPendingOrderKey(orderId));
      if (!paymentKey || !orderId || !Number.isSafeInteger(amount) || !saved) throw new Error("결제 요청 정보를 찾지 못했습니다. 결제 화면에서 다시 시도해주세요.");

      const order = JSON.parse(saved) as PendingTossOrder;
      if (!supabase) throw new Error("로그인 서비스를 사용할 수 없습니다.");
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("로그인 세션이 만료되었습니다. 다시 로그인한 뒤 재시도해주세요.");

      const response = await fetch("/api/payments/toss/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ paymentKey, orderId, amount, order }),
      });
      const result = await response.json() as { orderNumber?: string; error?: string };
      if (!response.ok || !result.orderNumber) throw new Error(result.error || "결제 승인에 실패했습니다.");

      window.sessionStorage.removeItem(tossPendingOrderKey(orderId));
      clearCart();
      window.location.replace(`/order-confirmation/${result.orderNumber}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "결제 승인에 실패했습니다.");
      setProcessing(false);
    }
  }, [clearCart]);

  useEffect(() => {
    const timer = window.setTimeout(() => void confirmPayment(), 0);
    return () => window.clearTimeout(timer);
  }, [confirmPayment, retryCount]);

  const retry = () => {
    startedRef.current = false;
    setRetryCount((count) => count + 1);
  };

  return (
    <main className="commerce-page toss-result-page">
      <CatalogHeader />
      <section className="commerce-shell toss-result-shell">
        <div className={`toss-result-card ${error ? "error" : "processing"}`}>
          <span className="toss-result-icon">{error ? <ShieldCheck size={28} /> : <LoaderCircle className="spin" size={28} />}</span>
          <p>TOSS PAYMENTS · TEST MODE</p>
          <h1>{error ? "결제를 확인하지 못했습니다." : "결제를 승인하고 있습니다."}</h1>
          <span>{error || "창을 닫지 마세요. 승인 금액을 검증하고 NOVA 주문을 생성합니다."}</span>
          {processing ? <div className="toss-processing-line"><i /><i /><i /></div> : (
            <div className="toss-result-actions">
              <button type="button" className="commerce-primary-button" onClick={retry}><RotateCw size={16} /> 승인 다시 시도</button>
              <a href="/checkout"><ArrowLeft size={15} /> 결제 화면으로 돌아가기</a>
            </div>
          )}
          {!error && <small><CheckCircle2 size={13} /> 테스트 키를 사용해 실제 금액은 청구되지 않습니다.</small>}
        </div>
      </section>
    </main>
  );
}
