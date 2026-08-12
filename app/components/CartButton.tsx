"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "./CartProvider";

export function CartButton() {
  const [open, setOpen] = useState(false);
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    const openDrawer = () => setOpen(true);
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("nova:open-cart", openDrawer);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("nova:open-cart", openDrawer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button type="button" className="icon-button cart-button" aria-label={`장바구니, 상품 ${itemCount}개`} onClick={() => setOpen(true)}>
        <ShoppingBag size={19} />
        {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
      </button>

      {open && portalTarget && createPortal(
        <div className="cart-scrim" role="presentation" onMouseDown={() => setOpen(false)}>
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="장바구니" onMouseDown={(event) => event.stopPropagation()}>
            <div className="cart-header"><div><p>YOUR BAG</p><h2>장바구니 <span>{itemCount}</span></h2></div><button type="button" aria-label="장바구니 닫기" onClick={() => setOpen(false)}><X size={22} /></button></div>
            {items.length > 0 ? (
              <>
                <div className="cart-items">
                  {items.map((item) => (
                    <article className="cart-item" key={item.key}>
                      <a className="cart-thumb" href={`/products/${item.slug}`}><img src={item.image} alt={`${item.name} 제품`} /></a>
                      <div className="cart-item-info"><p>{item.category}</p><h3>{item.name}</h3><span>{item.color} · {item.option}</span><div className="quantity"><button type="button" aria-label={`${item.name} 수량 줄이기`} onClick={() => updateQuantity(item.key, item.quantity - 1)}><Minus size={14} /></button><span>{item.quantity}</span><button type="button" aria-label={`${item.name} 수량 늘리기`} onClick={() => updateQuantity(item.key, item.quantity + 1)}><Plus size={14} /></button></div></div>
                      <div className="cart-item-end"><strong>{(item.priceNumber * item.quantity).toLocaleString("ko-KR")}원</strong><button type="button" className="cart-remove" aria-label={`${item.name} 삭제`} onClick={() => removeItem(item.key)}><Trash2 size={14} /></button></div>
                    </article>
                  ))}
                </div>
                <div className="cart-summary"><div><span>배송비</span><strong>무료</strong></div><div className="total"><span>합계</span><strong>{subtotal.toLocaleString("ko-KR")}원</strong></div><a className="checkout-button" href="/checkout">주문·결제하기 <ArrowRight size={18} /></a><a className="cart-view-link" href="/cart">장바구니 자세히 보기</a><p>오후 2시 이전 주문 시 내일 도착 예정</p></div>
              </>
            ) : (
              <div className="empty-cart"><ShoppingBag size={35} /><h3>아직 담긴 제품이 없습니다.</h3><p>NOVA가 엄선한 기술을 만나보세요.</p><button className="button button-dark" type="button" onClick={() => setOpen(false)}>쇼핑 계속하기</button></div>
            )}
          </aside>
        </div>,
        portalTarget,
      )}
    </>
  );
}
