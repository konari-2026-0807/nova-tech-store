"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, MapPin, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { AddressFields } from "../components/AddressFields";
import { AuthButton } from "../components/AuthButton";
import { CatalogHeader } from "../components/CatalogHeader";
import { supabase } from "../../lib/supabase";

type SavedAddress = {
  recipient_name: string;
  phone: string;
  postal_code: string;
  address_line1: string;
  address_line2: string;
};

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    let active = true;
    const loadAccount = async (currentUser: User | null) => {
      if (!active) return;
      setUser(currentUser);
      setError("");
      setNotice("");

      if (!currentUser) {
        setReady(true);
        return;
      }

      const fallbackName = typeof currentUser.user_metadata?.full_name === "string" ? currentUser.user_metadata.full_name : "";
      setRecipientName((current) => current || fallbackName);
      const { data, error: addressError } = await supabase
        .from("customer_addresses")
        .select("recipient_name,phone,postal_code,address_line1,address_line2")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!active) return;
      if (addressError) setError("저장된 배송지를 불러오지 못했습니다.");
      if (data) {
        const address = data as SavedAddress;
        setRecipientName(address.recipient_name);
        setPhone(address.phone);
        setPostalCode(address.postal_code);
        setAddress1(address.address_line1);
        setAddress2(address.address_line2);
        setHasSavedAddress(true);
      }
      setReady(true);
    };

    void supabase.auth.getSession().then(({ data }) => void loadAccount(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => void loadAccount(session?.user ?? null));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const displayName = useMemo(() => recipientName.trim() || user?.email?.split("@")[0] || "NOVA 회원", [recipientName, user]);
  const initial = displayName.slice(0, 1).toUpperCase();

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!supabase || !user) return;
    if (!postalCode || !address1) {
      setError("주소 검색을 이용해 배송지를 선택해주세요.");
      return;
    }

    setSaving(true);
    const { error: saveError } = await supabase.from("customer_addresses").upsert({
      user_id: user.id,
      recipient_name: recipientName.trim(),
      phone: phone.trim(),
      postal_code: postalCode,
      address_line1: address1,
      address_line2: address2.trim(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setSaving(false);

    if (saveError) {
      setError("배송지를 저장하지 못했습니다. 입력 정보를 확인해주세요.");
      return;
    }
    setHasSavedAddress(true);
    setNotice("기본 배송지가 저장되었습니다. 다음 주문부터 자동으로 입력됩니다.");
  };

  const deleteAddress = async () => {
    if (!supabase || !user || !hasSavedAddress) return;
    setDeleting(true);
    setError("");
    setNotice("");
    const { error: deleteError } = await supabase.from("customer_addresses").delete().eq("user_id", user.id);
    setDeleting(false);

    if (deleteError) {
      setError("저장된 배송지를 삭제하지 못했습니다.");
      return;
    }
    setPhone("");
    setPostalCode("");
    setAddress1("");
    setAddress2("");
    setHasSavedAddress(false);
    setNotice("저장된 배송지를 삭제했습니다.");
  };

  return (
    <main className="commerce-page mypage-page">
      <CatalogHeader />
      <section className="commerce-shell mypage-shell">
        <a className="commerce-back" href="/"><ArrowLeft size={15} /> 쇼핑몰로 돌아가기</a>
        <div className="commerce-heading"><p className="eyebrow dark">MY NOVA</p><h1>나의 배송지.</h1><span>ACCOUNT</span></div>

        {!ready ? <div className="commerce-loading"><LoaderCircle className="spin" size={20} /> 계정 정보를 확인하는 중...</div> : !user ? (
          <section className="checkout-auth-required"><ShieldCheck size={30} /><div><h2>로그인이 필요합니다.</h2><p>나의 배송지를 안전하게 저장하고 관리하려면 NOVA 계정으로 로그인해주세요.</p></div><AuthButton variant="button" /></section>
        ) : (
          <div className="mypage-grid">
            <aside className="mypage-profile-card">
              <div className="mypage-avatar">{initial}</div>
              <p>NOVA MEMBER</p>
              <h2>{displayName}</h2>
              <span>{user.email}</span>
              <div><CheckCircle2 size={15} /> 로그인된 계정</div>
              <a href="/checkout"><span>주문하러 가기</span><ArrowRight size={15} /></a>
            </aside>

            <form className="mypage-address-card" onSubmit={saveAddress}>
              <header><div><p>DEFAULT DELIVERY</p><h2>기본 배송지</h2></div><span className={hasSavedAddress ? "saved" : "empty"}><MapPin size={14} /> {hasSavedAddress ? "저장됨" : "미등록"}</span></header>
              <p className="mypage-address-description">저장한 배송지는 결제 화면에 자동으로 입력됩니다. 주문 전 언제든지 수정할 수 있어요.</p>
              <div className="checkout-fields two mypage-address-fields">
                <label><span>받는 분</span><input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} autoComplete="name" maxLength={100} required /></label>
                <label><span>휴대폰 번호</span><input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="010-0000-0000" minLength={7} maxLength={30} required /></label>
                <AddressFields postalCode={postalCode} address1={address1} address2={address2} onPostalCodeChange={setPostalCode} onAddress1Change={setAddress1} onAddress2Change={setAddress2} disabled={saving || deleting} />
              </div>
              {error && <p className="mypage-message error" role="alert">{error}</p>}
              {notice && <p className="mypage-message success" role="status"><CheckCircle2 size={15} /> {notice}</p>}
              <div className="mypage-address-actions">
                {hasSavedAddress && <button type="button" className="mypage-delete-button" onClick={() => void deleteAddress()} disabled={saving || deleting}>{deleting ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />} 배송지 삭제</button>}
                <button type="submit" className="commerce-primary-button" disabled={saving || deleting}>{saving ? <><LoaderCircle className="spin" size={18} /> 저장 중</> : <>기본 배송지 저장 <ArrowRight size={16} /></>}</button>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
