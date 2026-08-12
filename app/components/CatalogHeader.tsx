"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Menu, Search, X } from "lucide-react";
import { primaryNav, products } from "../../lib/catalog";
import { AuthButton } from "./AuthButton";
import { CartButton } from "./CartButton";

export function CatalogHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => `${product.name} ${product.category} ${product.tagline}`.toLowerCase().includes(normalized));
  }, [query]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  return (
    <>
      <header className="site-header catalog-header">
        <a className="brand" href="/" aria-label="NOVA 홈"><img className="brand-logo" src="/images/brand/nova-logo.png" alt="NOVA" fetchPriority="high" /></a>
        <nav className="desktop-nav" aria-label="카테고리 메뉴">
          {primaryNav.map((item) => <a key={item.slug} href={`/category/${item.slug}`}>{item.navLabel}</a>)}
        </nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="검색 열기" onClick={() => setSearchOpen(true)}><Search size={19} /></button>
          <AuthButton />
          <CartButton />
          <button className="icon-button menu-button" aria-label="메뉴 열기" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
        </div>
      </header>

      {searchOpen && (
        <div className="overlay search-overlay" role="dialog" aria-modal="true" aria-label="상품 검색">
          <button className="overlay-close" aria-label="검색 닫기" onClick={() => setSearchOpen(false)}><X size={24} /></button>
          <div className="search-panel">
            <p className="eyebrow">SEARCH NOVA</p>
            <div className="search-input"><Search size={26} /><input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="어떤 기술을 찾고 있나요?" aria-label="검색어" /></div>
            <div className="search-suggestions search-results">
              <span>{query ? `${results.length}개의 검색 결과` : "추천 상품"}</span>
              {results.map((product) => <a key={product.slug} href={`/products/${product.slug}`}><span>{product.name}<small>{product.category}</small></span><ChevronRight size={17} /></a>)}
              {results.length === 0 && <p>일치하는 제품이 없습니다.</p>}
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="overlay menu-overlay" role="dialog" aria-modal="true" aria-label="모바일 메뉴">
          <button className="overlay-close" aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)}><X size={24} /></button>
          <nav>{primaryNav.map((item, index) => <a key={item.slug} href={`/category/${item.slug}`}><span>0{index + 1}</span>{item.navLabel}<ChevronRight size={22} /></a>)}</nav>
        </div>
      )}
    </>
  );
}
