"use client";

import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { CatalogProduct } from "../../lib/catalog";
import { openCartDrawer, useCart } from "./CartProvider";

export function ProductActions({ product }: { product: CatalogProduct }) {
  const [color, setColor] = useState(product.colors[0]);
  const [option, setOption] = useState(product.options[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem(product, color, option, quantity);
    setAdded(true);
    openCartDrawer();
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="detail-actions">
      <fieldset><legend>색상 <strong>{color}</strong></legend><div className="detail-choice-row">{product.colors.map((item) => <button key={item} type="button" className={color === item ? "selected" : ""} onClick={() => setColor(item)}>{item}{color === item && <Check size={14} />}</button>)}</div></fieldset>
      <fieldset><legend>구성</legend><div className="detail-choice-row detail-options">{product.options.map((item) => <button key={item} type="button" className={option === item ? "selected" : ""} onClick={() => setOption(item)}>{item}{option === item && <Check size={14} />}</button>)}</div></fieldset>
      <div className="detail-buy-row">
        <div className="detail-quantity"><button type="button" aria-label="수량 줄이기" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><span>{quantity}</span><button type="button" aria-label="수량 늘리기" onClick={() => setQuantity(quantity + 1)}><Plus size={15} /></button></div>
        <button type="button" className={added ? "detail-add-button added" : "detail-add-button"} onClick={handleAdd}>{added ? <><Check size={18} /> 담았습니다</> : <><ShoppingBag size={18} /> 장바구니에 담기</>}</button>
      </div>
      <p className="detail-delivery">오늘 오후 2시 이전 주문 시 내일 도착 · 무료 배송</p>
    </div>
  );
}
