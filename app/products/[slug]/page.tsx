import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Box, RefreshCcw, ShieldCheck, Star } from "lucide-react";
import { CatalogHeader } from "../../components/CatalogHeader";
import { ProductActions } from "../../components/ProductActions";
import { ProductReviews } from "../../components/ProductReviews";
import { findProduct, products } from "../../../lib/catalog";

type ProductPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  return { title: product ? `${product.name} — NOVA` : "NOVA Product", description: product?.description };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = findProduct(slug) ?? products[0];
  const related = products.filter((item) => item.slug !== product.slug).slice(0, 3);

  return (
    <main className="product-page">
      <CatalogHeader />
      <div className="detail-breadcrumb"><a href="/"><ArrowLeft size={14} /> 홈</a><span>/</span><a href={`/category/${product.categorySlugs[1] ?? "new"}`}>{product.category}</a><span>/</span><strong>{product.name}</strong></div>
      <section className="product-detail-hero">
        <div className="detail-gallery"><div className="detail-image-stage"><span className="detail-image-badge">{product.badge || "NOVA SELECT"}</span><img src={product.image} alt={`${product.name} ${product.color} 제품 이미지`} /></div><div className="detail-image-meta"><span>01 / 01</span><p>실제 제품의 색상은 화면 설정에 따라 다르게 보일 수 있습니다.</p></div></div>
        <div className="detail-purchase">
          <p className="eyebrow dark">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="detail-tagline">{product.tagline}</p>
          <p className="detail-description">{product.description}</p>
          <a className="detail-rating-link" href="#reviews"><span><Star size={14} fill="currentColor" /> {product.rating.toFixed(1)}</span><em>{product.reviewCount.toLocaleString("ko-KR")}개의 구매자 후기</em><ArrowRight size={14} /></a>
          <div className="detail-price"><strong>{product.price}</strong><span>또는 월 {(Math.ceil(product.priceNumber / 12 / 1000) * 1000).toLocaleString("ko-KR")}원부터 · 12개월</span></div>
          <ProductActions product={product} />
          <div className="detail-service-mini"><div><Box size={17} /><span><strong>무료 배송</strong>전국 무료 배송</span></div><div><RefreshCcw size={17} /><span><strong>간편 반품</strong>14일 이내 반품</span></div><div><ShieldCheck size={17} /><span><strong>품질 보증</strong>공식 정품 보증</span></div></div>
        </div>
      </section>

      <section className="detail-highlights"><div className="detail-section-title"><p className="eyebrow dark">WHY {product.name.toUpperCase()}</p><h2>매일 체감하는<br />정교한 차이.</h2></div><div className="highlight-grid">{product.highlights.map((highlight, index) => <article key={highlight.title}><span>0{index + 1}</span><h3>{highlight.title}</h3><p>{highlight.description}</p></article>)}</div></section>

      <section className="detail-specs"><div><p className="eyebrow">DESIGNED BY NOVA</p><h2>복잡한 기술을<br />단순한 경험으로.</h2><p>{product.tagline} NOVA는 모든 요소가 하나의 자연스러운 경험으로 이어지도록 설계합니다.</p></div><dl>{product.specs.map((spec) => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></section>

      <section className="detail-information" aria-labelledby="information-title">
        <div className="detail-information-heading"><p className="eyebrow dark">PRODUCT INFORMATION</p><h2 id="information-title">제품 상세정보.</h2><p>구매 전 확인해야 할 구성품과 필수 상품 정보를 한눈에 확인하세요.</p></div>
        <div className="detail-information-grid">
          <article><span>01</span><h3>패키지 구성</h3><ul>{product.packageItems.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><span>02</span><h3>상품 필수정보</h3><dl><div><dt>모델명</dt><dd>{product.modelNumber}</dd></div><div><dt>제조자</dt><dd>NOVA Technology</dd></div><div><dt>제조국</dt><dd>{product.origin}</dd></div><div><dt>출시년월</dt><dd>2026년 7월</dd></div><div><dt>품질보증</dt><dd>{product.specs.at(-1)?.value}</dd></div></dl></article>
          <article><span>03</span><h3>배송·교환 안내</h3><ul><li>평일 오후 2시 이전 주문 시 당일 출고</li><li>5만원 이상 전국 무료 배송</li><li>수령 후 14일 이내 교환·반품 가능</li><li>개봉 또는 사용 후에는 제품 하자에 한해 반품 가능</li><li>NOVA 고객지원에서 전문 기술 상담 제공</li></ul></article>
        </div>
      </section>

      <ProductReviews productName={product.name} rating={product.rating} reviewCount={product.reviewCount} reviewImage={product.reviewImage} reviews={product.reviews} />

      <section className="detail-related"><div className="section-heading"><div><p className="eyebrow dark">COMPLETE THE SETUP</p><h2>함께 보면 좋은 기술.</h2></div></div><div className="related-grid">{related.map((item) => <a href={`/products/${item.slug}`} key={item.slug}><div><img src={item.image} alt={`${item.name} 제품`} /></div><p>{item.category}</p><h3>{item.name}</h3><span>{item.price} <ArrowRight size={14} /></span></a>)}</div></section>
      <footer className="catalog-footer"><a className="brand footer-brand" href="/" aria-label="NOVA 홈"><img className="brand-logo" src="/images/brand/nova-logo.png" alt="NOVA" /></a><p>기술을 고르는 가장 아름다운 방법.</p><span>© 2026 NOVA</span></footer>
    </main>
  );
}
