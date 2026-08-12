"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, ArrowRight, Check, CreditCard, LoaderCircle, ShieldCheck, Smartphone } from "lucide-react";
import { AddressFields } from "../components/AddressFields";
import { CatalogHeader } from "../components/CatalogHeader";
import { AuthButton } from "../components/AuthButton";
import { useCart } from "../components/CartProvider";
import { supabase } from "../../lib/supabase";

type PaymentMethod = "test_card" | "kakao_pay" | "naver_pay";

export default function CheckoutPage() {
  const { items, subtotal, hydrated, clearCart } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("test_card");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    let active = true;
    const syncUser = async (currentUser: User | null) => {
      if (!active) return;
      setUser(currentUser);
      setName(typeof currentUser?.user_metadata?.full_name === "string" ? currentUser.user_metadata.full_name : "");
      setEmail(currentUser?.email ?? "");
      if (currentUser) {
        const { data: savedAddress } = await supabase.from("customer_addresses").select("recipient_name,phone,postal_code,address_line1,address_line2").eq("user_id", currentUser.id).maybeSingle();
        if (active && savedAddress) {
          setName(savedAddress.recipient_name);
          setPhone(savedAddress.phone);
          setPostalCode(savedAddress.postal_code);
          setAddress1(savedAddress.address_line1);
          setAddress2(savedAddress.address_line2);
        }
      }
      if (active) setAuthReady(true);
    };
    void supabase.auth.getSession().then(({ data }) => void syncUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncUser(session?.user ?? null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const shippingFee = subtotal >= 50000 ? 0 : 3000;
  const total = subtotal + shippingFee;
  const paymentLabel = useMemo(() => ({ test_card: "테스트 카드", kakao_pay: "카카오페이 데모", naver_pay: "네이버페이 데모" })[paymentMethod], [paymentMethod]);

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!supabase || !user) {
      setError("주문을 진행하려면 먼저 로그인해주세요.");
      return;
    }
    if (!agreed) {
      setError("주문 내용과 테스트 결제 안내에 동의해주세요.");
      return;
    }
    if (items.length === 0) {
      setError("장바구니가 비어 있습니다.");
      return;
    }

    setLoading(true);
    const { data, error: orderError } = await supabase.rpc("place_order", {
      p_customer_name: name,
      p_customer_email: email,
      p_phone: phone,
      p_postal_code: postalCode,
      p_address_line1: address1,
      p_address_line2: address2,
      p_payment_method: paymentMethod,
      p_items: items.map((item) => ({ slug: item.slug, color: item.color, option: item.option, quantity: item.quantity })),
    });
    setLoading(false);

    if (orderError) {
      setError("주문을 저장하지 못했습니다. 로그인 상태와 배송 정보를 확인해주세요.");
      return;
    }

    const order = Array.isArray(data) ? data[0] : data;
    if (!order?.order_number) {
      setError("주문번호를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    clearCart();
    window.location.href = `/order-confirmation/${order.order_number}`;
  };

  return (
    <main className="commerce-page checkout-page">
      <CatalogHeader />
      <form className="commerce-shell checkout-shell" onSubmit={submitOrder}>
        <a className="commerce-back" href="/cart"><ArrowLeft size={15} /> 장바구니로 돌아가기</a>
        <div className="commerce-heading"><p className="eyebrow dark">SECURE CHECKOUT</p><h1>주문 및 결제.</h1><span>마지막 단계</span></div>

        {!authReady ? <div className="commerce-loading">계정 정보를 확인하는 중...</div> : !user ? (
          <section className="checkout-auth-required"><ShieldCheck size={30} /><div><h2>로그인이 필요합니다.</h2><p>주문 내역을 안전하게 저장하고 확인하려면 NOVA 계정으로 로그인해주세요.</p></div><AuthButton variant="button" /></section>
        ) : hydrated && items.length > 0 ? (
          <div className="checkout-grid">
            <div className="checkout-form-column">
              <section className="checkout-section"><div className="checkout-section-title"><span>01</span><div><p>CONTACT</p><h2>주문자 정보</h2></div></div><div className="checkout-fields two"><label><span>이름</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label><label><span>이메일</span><input type="email" value={email} readOnly /></label><label className="full"><span>휴대폰 번호</span><input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="010-0000-0000" required /></label></div></section>

              <section className="checkout-section"><div className="checkout-section-title"><span>02</span><div><p>DELIVERY</p><h2>배송지</h2></div></div><div className="checkout-fields two"><AddressFields postalCode={postalCode} address1={address1} address2={address2} onPostalCodeChange={setPostalCode} onAddress1Change={setAddress1} onAddress2Change={setAddress2} disabled={loading} /></div></section>

              <section className="checkout-section"><div className="checkout-section-title"><span>03</span><div><p>PAYMENT</p><h2>결제 방법</h2></div></div><div className="demo-payment-notice"><ShieldCheck size={16} /><span><strong>테스트 결제</strong> 실제 카드 정보와 금액을 수집하거나 청구하지 않습니다.</span></div><div className="payment-options"><button type="button" className={paymentMethod === "test_card" ? "selected" : ""} onClick={() => setPaymentMethod("test_card")}><CreditCard size={19} /><span><strong>신용카드</strong>테스트 승인</span>{paymentMethod === "test_card" && <Check size={16} />}</button><button type="button" className={paymentMethod === "kakao_pay" ? "selected" : ""} onClick={() => setPaymentMethod("kakao_pay")}><Smartphone size={19} /><span><strong>카카오페이</strong>데모 결제</span>{paymentMethod === "kakao_pay" && <Check size={16} />}</button><button type="button" className={paymentMethod === "naver_pay" ? "selected" : ""} onClick={() => setPaymentMethod("naver_pay")}><Smartphone size={19} /><span><strong>네이버페이</strong>데모 결제</span>{paymentMethod === "naver_pay" && <Check size={16} />}</button></div></section>
            </div>

            <aside className="checkout-order-card"><p>YOUR ORDER</p><h2>주문 상품</h2><div className="checkout-products">{items.map((item) => <article key={item.key}><img src={item.image} alt="" /><div><strong>{item.name}</strong><span>{item.color} · {item.option} · {item.quantity}개</span></div><b>{(item.priceNumber * item.quantity).toLocaleString("ko-KR")}원</b></article>)}</div><dl><div><dt>상품 금액</dt><dd>{subtotal.toLocaleString("ko-KR")}원</dd></div><div><dt>배송비</dt><dd>{shippingFee === 0 ? "무료" : `${shippingFee.toLocaleString("ko-KR")}원`}</dd></div><div><dt>결제 방법</dt><dd>{paymentLabel}</dd></div><div className="summary-total"><dt>총 결제 금액</dt><dd>{total.toLocaleString("ko-KR")}원</dd></div></dl><label className="checkout-agree"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><span>주문 상품, 배송 정보 및 테스트 결제 안내를 확인했습니다.</span></label>{error && <p className="checkout-error" role="alert">{error}</p>}<button type="submit" className="commerce-primary-button" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={18} /> 주문 처리 중</> : <>{total.toLocaleString("ko-KR")}원 테스트 결제 <ArrowRight size={17} /></>}</button></aside>
          </div>
        ) : <div className="commerce-empty"><h2>결제할 상품이 없습니다.</h2><a className="commerce-primary-button" href="/#best">제품 둘러보기 <ArrowRight size={17} /></a></div>}
      </form>
    </main>
  );
}
