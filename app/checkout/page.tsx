"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { loadTossPayments, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { ArrowLeft, ArrowRight, CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AddressFields } from "../components/AddressFields";
import { CatalogHeader } from "../components/CatalogHeader";
import { AuthButton } from "../components/AuthButton";
import { useCart } from "../components/CartProvider";
import { supabase } from "../../lib/supabase";
import type { PendingTossOrder } from "../../lib/toss-payment";
import { tossPendingOrderKey } from "../../lib/toss-payment";

export default function CheckoutPage() {
  const { items, subtotal, hydrated } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [tossWidgets, setTossWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [tossReady, setTossReady] = useState(false);
  const [tossError, setTossError] = useState("");
  const tossSetupStarted = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
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

  useEffect(() => {
    if (!user || !hydrated || items.length === 0 || total <= 0) return;
    if (tossSetupStarted.current) return;
    const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY?.trim();
    if (!clientKey) return;

    tossSetupStarted.current = true;
    const setupWidgets = async () => {
      setTossReady(false);
      setTossError("");
      try {
        const tossPayments = await loadTossPayments(clientKey);
        document.querySelector("#toss-payment-method")?.replaceChildren();
        document.querySelector("#toss-payment-agreement")?.replaceChildren();
        const widgets = tossPayments.widgets({ customerKey: `NOVA_${user.id}` });
        await widgets.setAmount({ currency: "KRW", value: total });
        await widgets.renderPaymentMethods({ selector: "#toss-payment-method", variantKey: "DEFAULT" });
        await widgets.renderAgreement({ selector: "#toss-payment-agreement", variantKey: "AGREEMENT" });
        setTossWidgets(widgets);
        setTossReady(true);
      } catch (setupError) {
        console.error("[Toss Payments] widget setup failed", setupError);
        tossSetupStarted.current = false;
        setTossError("토스페이먼츠 결제 UI를 불러오지 못했습니다. 페이지를 새로고침해주세요.");
      }
    };

    void setupWidgets();
  }, [hydrated, items.length, total, user]);

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!supabase || !user) {
      setError("주문을 진행하려면 먼저 로그인해주세요.");
      return;
    }
    if (items.length === 0) {
      setError("장바구니가 비어 있습니다.");
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim() || !postalCode || !address1) {
      setError("주문자 정보와 배송지를 모두 입력해주세요.");
      return;
    }
    if (!tossWidgets || !tossReady) {
      setError(tossError || "토스페이먼츠 결제 화면을 준비하고 있습니다.");
      return;
    }

    setLoading(true);
    const orderId = `NOVA_${crypto.randomUUID().replaceAll("-", "")}`;
    const order: PendingTossOrder = {
      orderId,
      amount: total,
      customerName: name.trim(),
      customerEmail: email.trim(),
      phone: phone.trim(),
      postalCode,
      addressLine1: address1,
      addressLine2: address2.trim(),
      items: items.map((item) => ({ slug: item.slug, color: item.color, option: item.option, quantity: item.quantity })),
      createdAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem(tossPendingOrderKey(orderId), JSON.stringify(order));

    try {
      const orderName = items.length > 1 ? `${items[0].name} 외 ${items.length - 1}건` : items[0].name;
      const normalizedPhone = phone.replace(/\D/g, "");
      await tossWidgets.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payments/toss/success`,
        failUrl: `${window.location.origin}/payments/toss/fail`,
        customerEmail: email.trim(),
        customerName: name.trim(),
        ...(normalizedPhone.length >= 8 ? { customerMobilePhone: normalizedPhone } : {}),
      });
    } catch {
      window.sessionStorage.removeItem(tossPendingOrderKey(orderId));
      setLoading(false);
      setError("결제창을 열지 못했습니다. 결제수단과 약관 동의를 확인해주세요.");
    }
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

              <section className="checkout-section toss-checkout-section"><div className="checkout-section-title"><span>03</span><div><p>TOSS PAYMENTS</p><h2>테스트 결제</h2></div></div><div className="demo-payment-notice"><ShieldCheck size={16} /><span><strong>안전한 테스트 모드</strong> 토스페이먼츠 테스트 키를 사용하므로 실제 금액은 청구되지 않습니다.</span></div><div id="toss-payment-method" className="toss-widget-slot" /> <div id="toss-payment-agreement" className="toss-widget-slot agreement" />{!tossReady && !tossError && import.meta.env.VITE_TOSS_CLIENT_KEY && <div className="toss-widget-loading"><LoaderCircle className="spin" size={17} /> 결제수단을 불러오는 중...</div>}{!import.meta.env.VITE_TOSS_CLIENT_KEY && <p className="checkout-error" role="alert">토스페이먼츠 클라이언트 키가 설정되지 않았습니다.</p>}{tossError && <p className="checkout-error" role="alert">{tossError}</p>}</section>
            </div>

            <aside className="checkout-order-card"><p>YOUR ORDER</p><h2>주문 상품</h2><div className="checkout-products">{items.map((item) => <article key={item.key}><img src={item.image} alt="" /><div><strong>{item.name}</strong><span>{item.color} · {item.option} · {item.quantity}개</span></div><b>{(item.priceNumber * item.quantity).toLocaleString("ko-KR")}원</b></article>)}</div><dl><div><dt>상품 금액</dt><dd>{subtotal.toLocaleString("ko-KR")}원</dd></div><div><dt>배송비</dt><dd>{shippingFee === 0 ? "무료" : `${shippingFee.toLocaleString("ko-KR")}원`}</dd></div><div><dt>결제 방법</dt><dd>토스페이먼츠 테스트</dd></div><div className="summary-total"><dt>총 결제 금액</dt><dd>{total.toLocaleString("ko-KR")}원</dd></div></dl>{error && <p className="checkout-error" role="alert">{error}</p>}<button type="submit" className="commerce-primary-button" disabled={loading || !tossReady}>{loading ? <><LoaderCircle className="spin" size={18} /> 결제창 여는 중</> : !tossReady ? <><LoaderCircle className="spin" size={18} /> 결제 준비 중</> : <>{total.toLocaleString("ko-KR")}원 토스 결제 <ArrowRight size={17} /></>}</button><small className="toss-summary-note"><CreditCard size={13} /> 테스트 카드·계좌로 결제 흐름을 확인할 수 있습니다.</small></aside>
          </div>
        ) : <div className="commerce-empty"><h2>결제할 상품이 없습니다.</h2><Link className="commerce-primary-button" href="/#best">제품 둘러보기 <ArrowRight size={17} /></Link></div>}
      </form>
    </main>
  );
}
