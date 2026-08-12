"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, PackageCheck } from "lucide-react";
import { CatalogHeader } from "../../components/CatalogHeader";
import { AuthButton } from "../../components/AuthButton";
import { supabase } from "../../../lib/supabase";

type Order = {
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  customer_name: string;
  customer_email: string;
  phone: string;
  postal_code: string;
  address_line1: string;
  address_line2: string | null;
  created_at: string;
  order_items: { id: number; product_slug: string; product_name: string; color: string; option_name: string; unit_price: number; quantity: number; line_total: number; image: string }[];
};

export function OrderConfirmationClient({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setError("주문 서비스를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      }
      const { data, error: queryError } = await supabase.from("orders").select("order_number,status,payment_status,payment_method,subtotal,shipping_fee,total,customer_name,customer_email,phone,postal_code,address_line1,address_line2,created_at,order_items(id,product_slug,product_name,color,option_name,unit_price,quantity,line_total,image)").eq("order_number", orderNumber).single();
      if (queryError || !data) setError("주문 정보를 찾지 못했습니다.");
      else setOrder(data as Order);
      setLoading(false);
    })();
  }, [orderNumber]);

  const paymentLabels: Record<string, string> = { test_card: "테스트 카드", kakao_pay: "카카오페이 데모", naver_pay: "네이버페이 데모" };

  return (
    <main className="commerce-page confirmation-page">
      <CatalogHeader />
      <div className="commerce-shell confirmation-shell">
        {loading ? <div className="commerce-loading"><LoaderCircle className="spin" size={22} /> 주문을 확인하는 중...</div> : needsLogin ? <div className="checkout-auth-required"><PackageCheck size={30} /><div><h2>주문 확인을 위해 로그인해주세요.</h2><p>주문할 때 사용한 NOVA 계정으로 로그인하면 내 주문만 안전하게 확인할 수 있습니다.</p></div><AuthButton variant="button" /></div> : error || !order ? <div className="commerce-empty"><h2>{error}</h2><a className="commerce-primary-button" href="/">홈으로 돌아가기</a></div> : <>
          <section className="confirmation-hero"><div className="confirmation-check"><CheckCircle2 size={40} /></div><p className="eyebrow dark">ORDER CONFIRMED</p><h1>주문이<br />확인되었습니다.</h1><p>{order.customer_name}님, NOVA를 선택해주셔서 감사합니다.<br />주문 준비가 시작되면 이메일로 알려드릴게요.</p><div><span>주문번호</span><strong>{order.order_number}</strong></div></section>
          <div className="confirmation-grid"><section className="confirmation-detail"><div className="confirmation-status"><span className="active"><i />주문 확인</span><span><i />상품 준비</span><span><i />배송 시작</span><span><i />배송 완료</span></div><div className="confirmation-items"><h2>주문 상품</h2>{order.order_items.map((item) => <article key={item.id}><img src={item.image} alt={`${item.product_name} 제품`} /><div><p>{item.product_name}</p><span>{item.color} · {item.option_name} · {item.quantity}개</span></div><strong>{item.line_total.toLocaleString("ko-KR")}원</strong></article>)}</div></section><aside className="confirmation-summary"><p>ORDER DETAILS</p><h2>주문 정보</h2><dl><div><dt>주문일</dt><dd>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(new Date(order.created_at))}</dd></div><div><dt>결제 방법</dt><dd>{paymentLabels[order.payment_method] ?? order.payment_method}</dd></div><div><dt>결제 상태</dt><dd>테스트 결제 완료</dd></div><div><dt>배송지</dt><dd>({order.postal_code}) {order.address_line1} {order.address_line2 ?? ""}</dd></div><div><dt>연락처</dt><dd>{order.phone}</dd></div><div className="summary-total"><dt>총 결제 금액</dt><dd>{order.total.toLocaleString("ko-KR")}원</dd></div></dl><a className="commerce-primary-button" href="/">쇼핑 계속하기 <ArrowRight size={17} /></a></aside></div>
        </>}
      </div>
    </main>
  );
}
