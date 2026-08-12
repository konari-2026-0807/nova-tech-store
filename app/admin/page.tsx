"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  UsersRound,
} from "lucide-react";
import { AdminSetup } from "../components/AdminSetup";
import { supabase } from "../../lib/supabase";

type OrderStatus = "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";

type AdminOrder = {
  id: number;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_status: string;
  payment_method: string;
  total: number;
  customer_name: string;
  customer_email: string;
  created_at: string;
  order_items: { quantity: number; line_total: number }[];
};

type AdminProduct = {
  slug: string;
  name: string;
  price: number;
  image: string;
  active: boolean;
  updated_at: string;
};

const statusLabels: Record<OrderStatus, string> = {
  confirmed: "주문 확인",
  preparing: "상품 준비",
  shipped: "배송 중",
  delivered: "배송 완료",
  cancelled: "취소",
};

const paymentLabels: Record<string, string> = {
  test_card: "테스트 카드",
  kakao_pay: "카카오페이 데모",
  naver_pay: "네이버페이 데모",
  toss_test: "토스페이먼츠 테스트",
};

const currency = (value: number) => `${value.toLocaleString("ko-KR")}원`;

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState<"loading" | "preview" | "granted">("loading");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [pendingKey, setPendingKey] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async (currentUser?: User | null) => {
    if (!supabase) {
      setAccess("preview");
      return;
    }

    const loadPreview = async () => {
      const { data } = await supabase
        .from("store_products")
        .select("slug,name,price,image,active,updated_at")
        .eq("active", true)
        .order("updated_at", { ascending: false });
      setOrders([]);
      setProducts((data ?? []) as AdminProduct[]);
      setAccess("preview");
    };

    setAccess("loading");
    setMessage("");
    const resolvedUser = currentUser === undefined
      ? (await supabase.auth.getSession()).data.session?.user ?? null
      : currentUser;
    setUser(resolvedUser);

    if (!resolvedUser) {
      await loadPreview();
      return;
    }

    const { data: adminRole, error: roleError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", resolvedUser.id)
      .maybeSingle();

    if (roleError || !adminRole) {
      await loadPreview();
      return;
    }

    const [ordersResult, productsResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id,order_number,user_id,status,payment_status,payment_method,total,customer_name,customer_email,created_at,order_items(quantity,line_total)")
        .order("created_at", { ascending: false }),
      supabase
        .from("store_products")
        .select("slug,name,price,image,active,updated_at")
        .order("updated_at", { ascending: false }),
    ]);

    if (ordersResult.error || productsResult.error) {
      setMessage("운영 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      setAccess("granted");
      return;
    }

    setOrders((ordersResult.data ?? []) as AdminOrder[]);
    setProducts((productsResult.data ?? []) as AdminProduct[]);
    setAccess("granted");
  }, []);

  useEffect(() => {
    void loadDashboard();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadDashboard(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const validOrders = orders.filter((order) => order.status !== "cancelled");
    const revenue = validOrders.reduce((sum, order) => sum + order.total, 0);
    const customers = new Set(orders.map((order) => order.user_id)).size;
    const today = new Date().toDateString();
    const todayOrders = orders.filter((order) => new Date(order.created_at).toDateString() === today).length;
    return {
      revenue,
      customers,
      todayOrders,
      average: validOrders.length ? Math.round(revenue / validOrders.length) : 0,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesQuery = !normalized || [order.order_number, order.customer_name, order.customer_email]
        .some((value) => value.toLowerCase().includes(normalized));
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, statusFilter]);

  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    if (!supabase || access !== "granted") return;
    const key = `order-${orderId}`;
    setPendingKey(key);
    setMessage("");
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    setPendingKey("");
    if (error) {
      setMessage("주문 상태를 변경하지 못했습니다.");
      return;
    }
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order));
  };

  const toggleProduct = async (product: AdminProduct) => {
    if (!supabase || access !== "granted") return;
    const key = `product-${product.slug}`;
    setPendingKey(key);
    setMessage("");
    const active = !product.active;
    const { error } = await supabase
      .from("store_products")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("slug", product.slug);
    setPendingKey("");
    if (error) {
      setMessage("상품 공개 상태를 변경하지 못했습니다.");
      return;
    }
    setProducts((current) => current.map((item) => item.slug === product.slug ? { ...item, active } : item));
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  if (access === "loading") {
    return (
      <main className="admin-access-page">
        <a className="admin-brand" href="/" aria-label="NOVA 홈"><img src="/images/brand/nova-logo.png" alt="NOVA" /></a>
        <section className="admin-access-card"><LoaderCircle className="spin" size={28} /><p>운영 화면을 준비하는 중...</p></section>
      </main>
    );
  }

  const isAdminSession = access === "granted";

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/" aria-label="NOVA 홈"><img src="/images/brand/nova-logo.png" alt="NOVA" /></a>
        <nav aria-label="관리자 메뉴">
          <a className="active" href="#overview"><LayoutDashboard size={17} /> 대시보드</a>
          <a href="#orders"><ShoppingBag size={17} /> 주문 관리</a>
          <a href="#products"><Package size={17} /> 상품 관리</a>
        </nav>
        <div className="admin-sidebar-user">
          <span>{isAdminSession ? user?.email?.slice(0, 1).toUpperCase() : "P"}</span>
          <div><strong>{isAdminSession ? "Administrator" : "Preview Mode"}</strong><small>{isAdminSession ? user?.email : "Public view only"}</small></div>
          {isAdminSession ? <button type="button" aria-label="로그아웃" onClick={signOut}><LogOut size={16} /></button> : <a href="/" aria-label="쇼핑몰 보기"><Store size={15} /></a>}
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div><p>OPERATIONS / OVERVIEW</p><h1>좋은 운영은<br />좋은 경험을 만듭니다.</h1></div>
          <div className="admin-top-actions"><span><i /> {isAdminSession ? "SYSTEM ONLINE" : "PREVIEW ONLINE"}</span><button type="button" onClick={() => void loadDashboard(user)}><RefreshCw size={15} /> 새로고침</button></div>
        </header>

        {!isAdminSession && <AdminSetup />}

        {message && <p className="admin-message" role="alert">{message}</p>}

        <section id="overview" className="admin-metrics" aria-label="운영 지표">
          <article><div><p>총 주문 금액</p><CircleDollarSign size={19} /></div><strong>{currency(stats.revenue)}</strong><span>테스트 결제 기준 누적</span></article>
          <article><div><p>오늘의 주문</p><ShoppingBag size={19} /></div><strong>{stats.todayOrders}<small>건</small></strong><span>오늘 접수된 신규 주문</span></article>
          <article><div><p>고객 수</p><UsersRound size={19} /></div><strong>{stats.customers}<small>명</small></strong><span>구매 계정 기준</span></article>
          <article><div><p>평균 주문 금액</p><ArrowUpRight size={19} /></div><strong>{currency(stats.average)}</strong><span>취소 주문 제외</span></article>
        </section>

        <section id="orders" className="admin-section">
          <div className="admin-section-heading"><div><p>ORDER MANAGEMENT</p><h2>주문 관리</h2></div><span>{orders.length}개의 주문</span></div>
          <div className="admin-order-toolbar">
            <div className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="주문번호, 고객명, 이메일 검색" aria-label="주문 검색" /></div>
            <div className="admin-filter-tabs" role="tablist" aria-label="주문 상태 필터">
              {(["all", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const).map((status) => <button key={status} type="button" role="tab" aria-selected={statusFilter === status} onClick={() => setStatusFilter(status)}>{status === "all" ? "전체" : statusLabels[status]}</button>)}
            </div>
          </div>

          <div className="admin-order-table" role="region" aria-label="주문 목록">
            <div className="admin-table-row admin-table-head"><span>주문</span><span>고객</span><span>상품</span><span>결제</span><span>상태</span></div>
            {filteredOrders.length ? filteredOrders.map((order) => {
              const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
              return <article className="admin-table-row" key={order.id}>
                <div><strong>{order.order_number}</strong><small>{new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(order.created_at))}</small></div>
                <div><strong>{order.customer_name}</strong><small>{order.customer_email}</small></div>
                <div><strong>{itemCount}개</strong><small>주문 상품</small></div>
                <div><strong>{currency(order.total)}</strong><small>{paymentLabels[order.payment_method] ?? order.payment_method}</small></div>
                <label className={`admin-status-select status-${order.status}`}><span className="sr-only">{order.order_number} 주문 상태</span><select value={order.status} disabled={!isAdminSession || pendingKey === `order-${order.id}`} onChange={(event) => void updateOrderStatus(order.id, event.target.value as OrderStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={14} /></label>
              </article>;
            }) : <div className="admin-empty"><Clock3 size={26} /><strong>표시할 주문이 없습니다.</strong><p>새 주문이 접수되면 이곳에 바로 나타납니다.</p></div>}
          </div>
        </section>

        <section id="products" className="admin-section admin-products-section">
          <div className="admin-section-heading"><div><p>PRODUCT CATALOG</p><h2>상품 관리</h2></div><span>{products.filter((product) => product.active).length}개 판매 중</span></div>
          <div className="admin-product-grid">
            {products.map((product) => <article key={product.slug}>
              <img src={product.image} alt={`${product.name} 제품`} />
              <div className="admin-product-copy"><p>{product.active ? "ON SALE" : "HIDDEN"}</p><h3>{product.name}</h3><strong>{currency(product.price)}</strong></div>
              <label className="admin-switch"><input type="checkbox" checked={product.active} disabled={!isAdminSession || pendingKey === `product-${product.slug}`} onChange={() => void toggleProduct(product)} /><span /><em>{product.active ? "공개" : "숨김"}</em></label>
              <a href={`/products/${product.slug}`} aria-label={`${product.name} 상세페이지 열기`}><ArrowUpRight size={16} /></a>
            </article>)}
          </div>
        </section>

        <footer className="admin-footer"><span><CheckCircle2 size={14} /> 데이터는 Supabase RLS로 보호됩니다.</span><a href="/"><Store size={14} /> 쇼핑몰 보기</a></footer>
      </section>
    </main>
  );
}
