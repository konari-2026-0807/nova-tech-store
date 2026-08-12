"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";

type KakaoLatLng = object;

type KakaoMapInstance = {
  relayout: () => void;
};

type KakaoMapsSdk = {
  load: (callback: () => void) => void;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMapInstance;
  Marker: new (options: { map: KakaoMapInstance; position: KakaoLatLng; title?: string }) => object;
  services: {
    Geocoder: new () => {
      addressSearch: (
        address: string,
        callback: (results: Array<{ x: string; y: string; address_name: string }>, status: string) => void,
      ) => void;
    };
    Status: { OK: string };
  };
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMapsSdk };
  }
}

const KAKAO_MAP_SCRIPT_ID = "nova-kakao-map-sdk";
let kakaoMapScriptPromise: Promise<KakaoMapsSdk> | null = null;

function loadKakaoMapSdk(appKey: string) {
  if (typeof window === "undefined") return Promise.reject(new Error("browser_required"));
  if (window.kakao?.maps?.services) return Promise.resolve(window.kakao.maps);
  if (kakaoMapScriptPromise) return kakaoMapScriptPromise;

  kakaoMapScriptPromise = new Promise<KakaoMapsSdk>((resolve, reject) => {
    const existing = document.getElementById(KAKAO_MAP_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    const finishLoading = () => {
      if (!window.kakao?.maps) {
        reject(new Error("kakao_map_unavailable"));
        return;
      }
      window.kakao.maps.load(() => {
        if (window.kakao?.maps?.services) resolve(window.kakao.maps);
        else reject(new Error("kakao_map_services_unavailable"));
      });
    };

    script.id = KAKAO_MAP_SCRIPT_ID;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = finishLoading;
    script.onerror = () => reject(new Error("kakao_map_load_failed"));
    if (!existing) document.head.appendChild(script);
    else finishLoading();
  }).catch((error) => {
    kakaoMapScriptPromise = null;
    throw error;
  });

  return kakaoMapScriptPromise;
}

type MapState = "idle" | "loading" | "ready" | "not-found" | "error" | "unconfigured";

export function KakaoAddressMap({ address }: { address: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const [state, setState] = useState<MapState>(address ? "loading" : "idle");
  const appKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY?.trim();

  useEffect(() => {
    let active = true;
    const container = containerRef.current;

    if (!address) {
      setState("idle");
      return () => { active = false; };
    }
    if (!appKey) {
      setState("unconfigured");
      return () => { active = false; };
    }
    if (!container) return () => { active = false; };

    setState("loading");
    const addressQuery = address.replace(/\s*\([^)]*\)\s*$/, "").trim();

    void loadKakaoMapSdk(appKey)
      .then((maps) => {
        if (!active) return;
        const geocoder = new maps.services.Geocoder();
        geocoder.addressSearch(addressQuery, (results, status) => {
          if (!active) return;
          if (status !== maps.services.Status.OK || !results[0]) {
            setState("not-found");
            return;
          }

          const position = new maps.LatLng(Number(results[0].y), Number(results[0].x));
          const map = new maps.Map(container, { center: position, level: 3 });
          new maps.Marker({ map, position, title: addressQuery });
          mapRef.current = map;
          setState("ready");
        });
      })
      .catch(() => {
        if (active) setState("error");
      });

    return () => { active = false; };
  }, [address, appKey]);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => map.relayout());
    observer.observe(container);
    return () => observer.disconnect();
  }, [state]);

  const message = state === "idle"
    ? "주소를 검색하면 배송 위치가 지도에 표시됩니다."
    : state === "loading"
      ? "배송 위치를 찾고 있습니다."
      : state === "not-found"
        ? "선택한 주소의 지도 위치를 찾지 못했습니다."
        : state === "unconfigured"
          ? "지도 서비스를 준비하고 있습니다."
          : "카카오 지도를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";

  return (
    <section className="kakao-address-map full" aria-label="배송지 카카오 지도">
      <header>
        <div><span>DELIVERY LOCATION</span><strong>배송지 위치</strong></div>
        <span className="kakao-map-badge"><LocateFixed size={13} /> KAKAO MAP</span>
      </header>
      <div className="kakao-map-stage">
        <div ref={containerRef} className="kakao-map-canvas" aria-label={address ? `${address} 지도` : "배송지 지도"} />
        {state !== "ready" && (
          <div className={`kakao-map-placeholder ${state === "loading" ? "loading" : ""}`}>
            <span><MapPin size={22} /></span>
            <p>{message}</p>
          </div>
        )}
      </div>
      {address && <p className="kakao-map-address"><MapPin size={13} /><span>{address}</span></p>}
    </section>
  );
}
