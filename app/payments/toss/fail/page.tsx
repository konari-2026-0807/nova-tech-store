"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CircleX } from "lucide-react";
import { CatalogHeader } from "../../../components/CatalogHeader";

export default function TossPaymentFailPage() {
  const [message, setMessage] = useState("결제가 취소되었거나 인증에 실패했습니다.");
  const [code, setCode] = useState("PAYMENT_FAILED");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setMessage(params.get("message") || "결제가 취소되었거나 인증에 실패했습니다.");
      setCode(params.get("code") || "PAYMENT_FAILED");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="commerce-page toss-result-page">
      <CatalogHeader />
      <section className="commerce-shell toss-result-shell">
        <div className="toss-result-card error">
          <span className="toss-result-icon"><CircleX size={28} /></span>
          <p>TOSS PAYMENTS · TEST MODE</p>
          <h1>결제가 완료되지 않았습니다.</h1>
          <span>{message}</span>
          <code>{code}</code>
          <div className="toss-result-actions"><a className="commerce-primary-button" href="/checkout"><ArrowLeft size={15} /> 결제 다시 시도</a><a href="/cart">장바구니 확인</a></div>
        </div>
      </section>
    </main>
  );
}
