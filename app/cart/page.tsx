"use client";

import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { CatalogHeader } from "../components/CatalogHeader";
import { useCart } from "../components/CartProvider";

export default function CartPage() {
  const { items, itemCount, subtotal, hydrated, updateQuantity, removeItem } = useCart();

  return (
    <main className="commerce-page">
      <CatalogHeader />
      <div className="commerce-shell">
        <a className="commerce-back" href="/#best"><ArrowLeft size={15} /> 쇼핑 계속하기</a>
        <div className="commerce-heading"><p className="eyebrow dark">YOUR BAG</p><h1>장바구니.</h1><span>{itemCount}개의 제품</span></div>

        {hydrated && items.length > 0 ? (
          <div className="cart-page-grid">
            <section className="cart-page-items" aria-label="장바구니 상품">
              {items.map((item) => (
                <article className="cart-page-item" key={item.key}>
                  <a href={`/products/${item.slug}`}><img src={item.image} alt={`${item.name} 제품`} /></a>
                  <div><p>{item.category}</p><h2>{item.name}</h2><span>{item.color} · {item.option}</span><div className="quantity"><button type="button" aria-label="수량 줄이기" onClick={() => updateQuantity(item.key, item.quantity - 1)}><Minus size={14} /></button><span>{item.quantity}</span><button type="button" aria-label="수량 늘리기" onClick={() => updateQuantity(item.key, item.quantity + 1)}><Plus size={14} /></button></div></div>
                  <div className="cart-page-price"><strong>{(item.priceNumber * item.quantity).toLocaleString("ko-KR")}원</strong><button type="button" onClick={() => removeItem(item.key)}><Trash2 size={14} /> 삭제</button></div>
                </article>
              ))}
            </section>
            <aside className="order-summary-card">
              <p>ORDER SUMMARY</p><h2>주문 요약</h2>
              <dl><div><dt>상품 금액</dt><dd>{subtotal.toLocaleString("ko-KR")}원</dd></div><div><dt>배송비</dt><dd>무료</dd></div><div className="summary-total"><dt>결제 예정 금액</dt><dd>{subtotal.toLocaleString("ko-KR")}원</dd></div></dl>
              <a className="commerce-primary-button" href="/checkout">주문·결제하기 <ArrowRight size={17} /></a>
              <p className="summary-note">안전한 테스트 결제 환경 · 실제 금액은 청구되지 않습니다.</p>
            </aside>
          </div>
        ) : hydrated ? (
          <div className="commerce-empty"><ShoppingBag size={38} /><h2>장바구니가 비어 있습니다.</h2><p>당신의 다음 기술을 찾아보세요.</p><a className="commerce-primary-button" href="/#best">제품 둘러보기 <ArrowRight size={17} /></a></div>
        ) : <div className="commerce-loading">장바구니를 불러오는 중...</div>}
      </div>
    </main>
  );
}
