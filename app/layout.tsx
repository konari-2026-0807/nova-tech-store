import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./components/CartProvider";
import { AiConcierge } from "./components/AiConcierge";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "NOVA — 기술의 다음 장면을 만나다",
  description: "일상을 더 선명하게 만드는 프리미엄 테크 셀렉트 스토어 NOVA.",
  keywords: ["테크 쇼핑몰", "IT 제품", "프리미엄 테크", "NOVA"],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "NOVA — 기술의 다음 장면을 만나다",
    description: "일상을 더 선명하게 만드는 프리미엄 테크 셀렉트 스토어.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1737, height: 907, alt: "NOVA 프리미엄 테크 스토어" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NOVA — 기술의 다음 장면을 만나다",
    description: "일상을 더 선명하게 만드는 프리미엄 테크 셀렉트 스토어.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <CartProvider>
          {children}
          <AiConcierge />
        </CartProvider>
      </body>
    </html>
  );
}
