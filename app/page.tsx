"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { motion, useReducedMotion } from "motion/react";
import * as THREE from "three";
import {
  ArrowDown,
  ArrowRight,
  Cable,
  ChevronRight,
  Gamepad2,
  Headphones,
  HousePlug,
  Laptop,
  Menu,
  Plus,
  Search,
  Smartphone,
  Sparkles as SparklesIcon,
  X,
} from "lucide-react";
import { primaryNav, productImageByArt, products } from "../lib/catalog";
import { AuthButton } from "./components/AuthButton";
import { CartButton } from "./components/CartButton";
import { openCartDrawer, useCart } from "./components/CartProvider";

const categories = [
  { slug: "mobile", name: "모바일", caption: "손안의 새로운 가능성", icon: Smartphone, image: "/images/categories/mobile-category.webp" },
  { slug: "computing", name: "컴퓨팅", caption: "더 빠른 생각의 속도", icon: Laptop, image: "/images/categories/computing-category.webp" },
  { slug: "audio", name: "오디오", caption: "고요까지 선명하게", icon: Headphones, image: "/images/categories/audio-category.webp" },
  { slug: "gaming", name: "게이밍", caption: "플레이의 한계를 넘어", icon: Gamepad2, image: "/images/categories/gaming-category.webp" },
  { slug: "smart-home", name: "스마트홈", caption: "공간을 이해하는 기술", icon: HousePlug, image: "/images/categories/smart-home-category.webp" },
  { slug: "accessories", name: "액세서리", caption: "완성도를 더하는 디테일", icon: Cable, image: "/images/categories/accessories-category.webp" },
];

const exclusiveModels = [
  { id: "01", title: "Quiet Focus", primary: "/images/models/model-01-a.jpg", secondary: "/images/models/model-01-b.jpg", position: "model-soft" },
  { id: "02", title: "Own the Rhythm", primary: "/images/models/model-02-a.jpg", secondary: "/images/models/model-02-b.jpg", position: "model-warm" },
  { id: "03", title: "Pure Presence", primary: "/images/models/model-03-a.jpg", secondary: "/images/models/model-03-b.jpg", position: "model-air" },
];

function NovaCore({ reduceMotion }: { reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    const speed = reduceMotion ? 0.03 : 0.12;
    group.current.rotation.y += delta * speed;
    if (!reduceMotion) {
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, state.pointer.y * 0.16, 0.035);
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -state.pointer.x * 0.12, 0.035);
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 5]} intensity={3.5} color="#d9e7ff" />
      <pointLight position={[-4, -1, 4]} intensity={18} color="#5b8cff" distance={10} />
      <pointLight position={[4, 0, -1]} intensity={14} color="#9e77ff" distance={9} />
      <Float speed={reduceMotion ? 0 : 1.15} rotationIntensity={0.2} floatIntensity={0.45}>
        <group ref={group} scale={1.03}>
          <mesh>
            <icosahedronGeometry args={[1.48, 8]} />
            <meshPhysicalMaterial
              color="#11131a"
              metalness={0.72}
              roughness={0.2}
              clearcoat={1}
              clearcoatRoughness={0.14}
              emissive="#101933"
              emissiveIntensity={0.42}
            />
          </mesh>
          <mesh scale={1.035}>
            <icosahedronGeometry args={[1.48, 2]} />
            <meshBasicMaterial color="#89aaff" wireframe transparent opacity={0.13} />
          </mesh>
          <mesh rotation={[1.08, 0.1, 0.35]}>
            <torusGeometry args={[2.1, 0.018, 12, 220]} />
            <meshBasicMaterial color="#a9bdff" transparent opacity={0.82} />
          </mesh>
          <mesh rotation={[0.35, 0.55, -0.55]}>
            <torusGeometry args={[2.38, 0.011, 10, 220]} />
            <meshBasicMaterial color="#a47dff" transparent opacity={0.5} />
          </mesh>
          <mesh position={[1.94, 0.68, 0.6]}>
            <sphereGeometry args={[0.075, 20, 20]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-1.58, -1.27, 0.5]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshBasicMaterial color="#8972ff" />
          </mesh>
        </group>
      </Float>
      <Sparkles count={reduceMotion ? 28 : 76} scale={[9, 6, 5]} size={1.8} speed={reduceMotion ? 0 : 0.3} color="#8aa5ff" opacity={0.52} />
    </>
  );
}

function ProductVisual({ art }: { art: string }) {
  return (
    <div className="product-visual" aria-hidden="true">
      <img className="product-photo" src={productImageByArt[art]} alt="" loading="lazy" decoding="async" />
    </div>
  );
}

export default function Home() {
  const reduceMotion = Boolean(useReducedMotion());
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const addToCart = (product = products[0]) => {
    addItem(product);
    openCartDrawer();
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="NOVA 홈"><img className="brand-logo" src="/images/brand/nova-logo.png" alt="NOVA" fetchPriority="high" /></a>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          {primaryNav.map((item) => (
            <a key={item.slug} href={`/category/${item.slug}`}>{item.navLabel}</a>
          ))}
        </nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="검색 열기" onClick={() => setSearchOpen(true)}><Search size={19} /></button>
          <AuthButton />
          <CartButton />
          <button className="icon-button menu-button" aria-label="메뉴 열기" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
        </div>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-canvas" aria-hidden="true">
          <Suspense fallback={<div className="canvas-fallback" />}>
            <Canvas camera={{ position: [0, 0, 6.6], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
              <NovaCore reduceMotion={reduceMotion} />
            </Canvas>
          </Suspense>
        </div>
        <div className="hero-content">
          <div className="hero-copy">
            <motion.p className="eyebrow" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>THE NEXT STANDARD</motion.p>
            <motion.h1 id="hero-title" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }}>
              <span>기술의</span><span>다음 장면을</span><span>만나다.</span>
            </motion.h1>
            <motion.p className="hero-description" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.35 }}>
              일상을 더 선명하게 만드는 테크를 한곳에.
            </motion.p>
            <motion.div className="hero-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.55 }}>
              <a className="button button-light" href="#categories">컬렉션 보기 <ArrowRight size={17} /></a>
              <a className="text-link text-link-light" href="#best">이번 주의 선택 <ChevronRight size={16} /></a>
            </motion.div>
          </div>
        </div>
        <a href="#categories" className="scroll-cue" aria-label="다음 섹션으로 이동"><span>SCROLL</span><ArrowDown size={15} /></a>
      </section>

      <section className="categories section-light" id="categories" aria-labelledby="category-title">
        <div className="section-shell">
          <div className="section-heading">
            <div><p className="eyebrow dark">EXPLORE</p><h2 id="category-title">당신의 다음 기술.</h2></div>
            <a className="text-link" href="#best">모든 카테고리 <ArrowRight size={16} /></a>
          </div>
          <div className="bento-grid">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.a
                  key={category.name}
                  className="category-card"
                  href={`/category/${category.slug}`}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.55, delay: index * 0.05 }}
                >
                  <img className="category-image" src={category.image} alt="" loading="lazy" decoding="async" />
                  <div className="category-top"><span className="category-icon"><Icon size={20} /></span><ChevronRight size={19} /></div>
                  <div className="category-copy"><h3>{category.name}</h3><p>{category.caption}</p></div>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="featured section-light" id="featured">
        <div className="section-shell">
          <motion.div className="featured-card" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.75 }}>
            <div className="featured-copy">
              <p className="eyebrow dark">FEATURED DROP · 08</p>
              <h2>AirArc One</h2>
              <p className="featured-lead">소음은 사라지고,<br />공간은 음악이 됩니다.</p>
              <p className="featured-description">초경량 티타늄 프레임과 적응형 공간 음향.<br />당신만을 위한 완벽한 고요를 경험하세요.</p>
              <div className="inline-actions">
                <a className="button button-dark" href="/products/airarc-one">자세히 보기 <ArrowRight size={17} /></a>
                <button className="text-link" onClick={() => addToCart(products[0])}>구매하기 <ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="featured-product" aria-label="AirArc One 헤드폰 제품 이미지">
              <img className="featured-product-image" src="/images/products/airarc-one.webp" alt="AirArc One 미드나이트 무선 헤드폰" loading="lazy" decoding="async" />
              <div className="product-caption"><span>Active Silence</span><strong>−42 dB</strong></div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="best section-light" id="best" aria-labelledby="best-title">
        <div className="section-shell">
          <div className="section-heading best-heading">
            <div><p className="eyebrow dark">BEST OF NOVA</p><h2 id="best-title">지금 가장 사랑받는 기술.</h2></div>
            <div className="slider-controls" aria-hidden="true"><button tabIndex={-1}><ArrowRight className="flip" size={18} /></button><button tabIndex={-1}><ArrowRight size={18} /></button></div>
          </div>
          <div className="product-grid">
            {products.map((product, index) => (
              <motion.article className="product-card" key={product.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55, delay: index * 0.07 }}>
                <div className="product-image">
                  {product.badge && <span className="product-badge">{product.badge}</span>}
                  <a className="product-image-link" href={`/products/${product.slug}`} aria-label={`${product.name} 상세 페이지`}><ProductVisual art={product.art} /></a>
                  <button className="quick-add" aria-label={`${product.name} 장바구니에 담기`} onClick={() => addToCart(product)}><Plus size={19} /></button>
                </div>
                <div className="product-info"><p>{product.category}</p><h3><a href={`/products/${product.slug}`}>{product.name}</a></h3><div><span>{product.color}</span><strong>{product.price}</strong></div></div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="exclusive-campaign section-light" aria-labelledby="exclusive-title">
        <div className="exclusive-heading">
          <div><p className="eyebrow dark">NOVA EXCLUSIVE · AIRARC ONE</p><h2 id="exclusive-title">각자의 리듬으로.</h2></div>
          <div><p>NOVA 전속 모델들이 보여주는<br />서로 다른 몰입의 순간.</p><a className="text-link" href="/products/airarc-one">AirArc One 만나기 <ArrowRight size={16} /></a></div>
        </div>
        <div className="exclusive-model-grid">
          {exclusiveModels.map((model, index) => (
            <motion.article className={`exclusive-model-card ${model.position}`} key={model.id} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.65, delay: index * 0.08 }}>
              <div className="model-primary"><img src={model.primary} alt={`NOVA 전속 모델 ${model.id}, AirArc One 착용 화보`} loading="lazy" decoding="async" /><span>MODEL {model.id}</span></div>
              <div className="model-secondary"><img src={model.secondary} alt={`NOVA 전속 모델 ${model.id}의 두 번째 AirArc One 화보`} loading="lazy" decoding="async" /></div>
              <div className="model-card-caption"><span>0{index + 1}</span><div><h3>{model.title}</h3><p>THE AIRARC SERIES</p></div></div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="story" aria-labelledby="story-title">
        <div className="story-model">
          <img src="/images/nova-campaign-model.webp" alt="NOVA AirArc One을 착용한 캠페인 모델" loading="lazy" decoding="async" />
        </div>
        <div className="story-content">
          <p className="eyebrow">NOVA EDIT</p>
          <h2 id="story-title">몰입을 설계하다.</h2>
          <p>빛, 소리, 촉감까지. 가장 깊이 집중할 수 있는<br className="desktop-break" /> 데스크 셋업을 NOVA가 제안합니다.</p>
          <a className="button button-light" href="#best">에디션 둘러보기 <ArrowRight size={17} /></a>
        </div>
        <div className="story-stats" aria-label="NOVA 큐레이션 정보">
          <div><strong>24</strong><span>curated pieces</span></div>
          <div><strong>04</strong><span>signature setups</span></div>
          <div><strong>∞</strong><span>ways to focus</span></div>
        </div>
      </section>

      <section className="service section-light" aria-label="쇼핑 서비스">
        <div className="service-grid">
          <div><span>01</span><h3>빠르고 무료인 배송</h3><p>5만원 이상 구매 시 전국 무료 배송</p></div>
          <div><span>02</span><h3>간편한 반품</h3><p>수령 후 14일까지 여유롭게</p></div>
          <div><span>03</span><h3>공식 품질 보증</h3><p>모든 제품 정품 보증과 전문 지원</p></div>
          <div><span>04</span><h3>테크 컨시어지</h3><p>선택이 어려울 땐 전문가와 상담</p></div>
        </div>
      </section>

      <section className="newsletter section-light">
        <div className="newsletter-inner">
          <span><SparklesIcon size={18} /> EARLY ACCESS</span>
          <h2>다음 장면을<br />가장 먼저 만나세요.</h2>
          <form onSubmit={(event) => event.preventDefault()}>
            <label className="sr-only" htmlFor="email">이메일 주소</label>
            <input id="email" type="email" placeholder="you@example.com" required />
            <button type="submit" aria-label="뉴스레터 구독"><ArrowRight size={20} /></button>
          </form>
          <p>신제품, 한정 드롭, NOVA 에디트를 월 2회 보내드립니다.</p>
        </div>
      </section>

      <footer>
        <div className="footer-main">
          <div><a className="brand footer-brand" href="#top" aria-label="NOVA 홈"><img className="brand-logo" src="/images/brand/nova-logo.png" alt="NOVA" /></a><p>기술을 고르는<br />가장 아름다운 방법.</p></div>
          <div className="footer-links"><div><strong>SHOP</strong><a href="/category/new">New</a><a href="/category/computing">Computing</a><a href="/category/audio">Audio</a><a href="#featured">NOVA Edit</a></div><div><strong>SUPPORT</strong><a href="#top">배송 안내</a><a href="#top">반품 및 교환</a><a href="#top">제품 지원</a><a href="#top">문의하기</a></div><div><strong>ABOUT</strong><a href="#top">Our Story</a><a href="#top">Journal</a><a href="#top">Stores</a><a href="#top">Careers</a></div></div>
        </div>
        <div className="footer-bottom"><span>© 2026 NOVA. All rights reserved.</span><div><a href="#top">개인정보처리방침</a><a href="#top">이용약관</a></div><a href="#top">Korea / 한국어</a></div>
      </footer>

      {searchOpen && (
        <div className="overlay search-overlay" role="dialog" aria-modal="true" aria-label="상품 검색">
          <button className="overlay-close" aria-label="검색 닫기" onClick={() => setSearchOpen(false)}><X size={24} /></button>
          <div className="search-panel"><p className="eyebrow">SEARCH NOVA</p><div className="search-input"><Search size={26} /><input autoFocus placeholder="어떤 기술을 찾고 있나요?" aria-label="검색어" /></div><div className="search-suggestions search-results"><span>추천 상품</span>{products.map((product) => <a key={product.slug} href={`/products/${product.slug}`}><span>{product.name}<small>{product.category}</small></span><ArrowRight size={15} /></a>)}</div></div>
        </div>
      )}

      {menuOpen && (
        <div className="overlay menu-overlay" role="dialog" aria-modal="true" aria-label="모바일 메뉴">
          <button className="overlay-close" aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)}><X size={24} /></button>
          <nav>{primaryNav.map((item, index) => <a key={item.slug} href={`/category/${item.slug}`} onClick={() => setMenuOpen(false)}><span>0{index + 1}</span>{item.navLabel}<ChevronRight size={22} /></a>)}</nav>
        </div>
      )}

    </main>
  );
}
