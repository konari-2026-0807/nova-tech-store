import type { Metadata } from "next";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { CatalogHeader } from "../../components/CatalogHeader";
import { catalogCategories, findCategory, getProductsForCategory } from "../../../lib/catalog";

type CategoryPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return catalogCategories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = findCategory(slug);
  return { title: category ? `${category.name} — NOVA` : "NOVA Catalog", description: category?.description };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = findCategory(slug) ?? catalogCategories[0];
  const categoryProducts = getProductsForCategory(category.slug);
  const heroProduct = categoryProducts[0];

  return (
    <main className="catalog-page">
      <CatalogHeader />
      <section className="catalog-hero">
        <div className="catalog-hero-copy"><p className="eyebrow dark">{category.eyebrow}</p><h1>{category.name}</h1><p>{category.description}</p></div>
        {heroProduct && <a className="catalog-hero-product" href={`/products/${heroProduct.slug}`}><img src={heroProduct.image} alt={`${heroProduct.name} 제품`} /><span>{heroProduct.badge || "NOVA SELECT"}</span></a>}
      </section>

      <section className="catalog-list" aria-labelledby="catalog-title">
        <div className="catalog-toolbar"><div><h2 id="catalog-title">{category.name} 제품</h2><span>{categoryProducts.length} products</span></div><button type="button"><SlidersHorizontal size={16} /> 필터 및 정렬</button></div>
        <div className="catalog-pills">{catalogCategories.map((item) => <a className={item.slug === category.slug ? "active" : ""} key={item.slug} href={`/category/${item.slug}`}>{item.name}</a>)}</div>
        <div className="catalog-product-grid">
          {categoryProducts.map((product) => (
            <article className="catalog-product-card" key={product.slug}>
              <a className="catalog-product-image" href={`/products/${product.slug}`}><img src={product.image} alt={`${product.name} ${product.color}`} />{product.badge && <span>{product.badge}</span>}</a>
              <div className="catalog-product-copy"><p>{product.category}</p><h3><a href={`/products/${product.slug}`}>{product.name}</a></h3><div><span>{product.color}</span><strong>{product.price}</strong></div><a className="catalog-detail-link" href={`/products/${product.slug}`}>제품 자세히 보기 <ArrowRight size={15} /></a></div>
            </article>
          ))}
        </div>
      </section>
      <footer className="catalog-footer"><a className="brand footer-brand" href="/" aria-label="NOVA 홈"><img className="brand-logo" src="/images/brand/nova-logo.png" alt="NOVA" /></a><p>기술을 고르는 가장 아름다운 방법.</p><span>© 2026 NOVA</span></footer>
    </main>
  );
}
