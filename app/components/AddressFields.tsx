"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { KakaoAddressMap } from "./KakaoAddressMap";

type DaumPostcodeData = {
  zonecode: string;
  userSelectedType: "R" | "J";
  roadAddress: string;
  jibunAddress: string;
  bname: string;
  buildingName: string;
  apartment: "Y" | "N";
};

type DaumPostcodeConstructor = new (options: {
  oncomplete: (data: DaumPostcodeData) => void;
}) => { open: (options?: { popupTitle?: string }) => void };

declare global {
  interface Window {
    daum?: { Postcode: DaumPostcodeConstructor };
  }
}

const DAUM_POSTCODE_SCRIPT = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
let postcodeScriptPromise: Promise<void> | null = null;

function loadDaumPostcode() {
  if (typeof window === "undefined") return Promise.reject(new Error("browser_required"));
  if (window.daum?.Postcode) return Promise.resolve();
  if (postcodeScriptPromise) return postcodeScriptPromise;

  postcodeScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${DAUM_POSTCODE_SCRIPT}"]`);
    const script = existing ?? document.createElement("script");
    script.src = DAUM_POSTCODE_SCRIPT;
    script.async = true;
    script.onload = () => window.daum?.Postcode ? resolve() : reject(new Error("postcode_unavailable"));
    script.onerror = () => reject(new Error("postcode_load_failed"));
    if (!existing) document.head.appendChild(script);
  }).catch((error) => {
    postcodeScriptPromise = null;
    throw error;
  });

  return postcodeScriptPromise;
}

type AddressFieldsProps = {
  postalCode: string;
  address1: string;
  address2: string;
  onPostalCodeChange: (value: string) => void;
  onAddress1Change: (value: string) => void;
  onAddress2Change: (value: string) => void;
  disabled?: boolean;
};

export function AddressFields({
  postalCode,
  address1,
  address2,
  onPostalCodeChange,
  onAddress1Change,
  onAddress2Change,
  disabled = false,
}: AddressFieldsProps) {
  const [postcodeReady, setPostcodeReady] = useState(false);
  const [postcodeError, setPostcodeError] = useState("");
  const address2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void loadDaumPostcode()
      .then(() => {
        if (active) setPostcodeReady(true);
      })
      .catch(() => {
        if (active) setPostcodeError("주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      });
    return () => { active = false; };
  }, []);

  const openPostcodeSearch = async () => {
    setPostcodeError("");
    try {
      await loadDaumPostcode();
      if (!window.daum?.Postcode) throw new Error("postcode_unavailable");

      new window.daum.Postcode({
        oncomplete: (data) => {
          let selectedAddress = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
          if (data.userSelectedType === "R") {
            const extras: string[] = [];
            if (data.bname && /[동로가]$/.test(data.bname)) extras.push(data.bname);
            if (data.buildingName && data.apartment === "Y") extras.push(data.buildingName);
            if (extras.length) selectedAddress += ` (${extras.join(", ")})`;
          }

          onPostalCodeChange(data.zonecode);
          onAddress1Change(selectedAddress);
          window.requestAnimationFrame(() => address2Ref.current?.focus());
        },
      }).open({ popupTitle: "NOVA 배송지 주소 검색" });
    } catch {
      setPostcodeReady(false);
      setPostcodeError("주소 검색창을 열지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해주세요.");
    }
  };

  return (
    <>
      <div className="checkout-postcode-field full">
        <label><span>우편번호</span><input value={postalCode} readOnly autoComplete="postal-code" placeholder="주소 검색을 이용해주세요" required /></label>
        <button type="button" onClick={() => void openPostcodeSearch()} disabled={disabled || !postcodeReady}><Search size={16} />{postcodeReady ? "주소 검색" : "준비 중"}</button>
      </div>
      <label className="full"><span>주소</span><div className="checkout-address-input"><MapPin size={16} /><input value={address1} readOnly autoComplete="street-address" placeholder="검색한 주소가 자동으로 입력됩니다" required /></div></label>
      <label className="full"><span>상세 주소</span><input ref={address2Ref} value={address2} onChange={(event) => onAddress2Change(event.target.value)} autoComplete="address-line2" placeholder="동·호수 등" disabled={disabled} maxLength={300} /></label>
      {postcodeError && <p className="checkout-postcode-error full" role="alert">{postcodeError}</p>}
      <p className="checkout-postcode-note full">다음 우편번호 서비스로 안전하게 주소를 검색합니다.</p>
      <KakaoAddressMap address={address1} />
    </>
  );
}
