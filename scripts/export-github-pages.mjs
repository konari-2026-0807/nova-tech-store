import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve("pages-dist");
const clientDirectory = path.resolve("dist/client");
const origin = process.env.PAGES_EXPORT_ORIGIN ?? "http://127.0.0.1:4173";
const basePath = (process.env.GITHUB_PAGES_BASE_PATH ?? "/nova-tech-store").replace(/\/$/, "");

const routes = [
  "/",
  "/cart",
  "/checkout",
  "/mypage",
  "/admin",
  "/reset-password",
  "/payments/toss/fail",
  "/payments/toss/success",
  ...["new", "mobile", "computing", "audio", "gaming", "smart-home", "accessories"].map((slug) => `/category/${slug}`),
  ...["airarc-one", "nova-cable-dot", "nova-fold-14", "halo-keys-75", "luma-hub"].map((slug) => `/products/${slug}`),
];

const pagesRuntime = String.raw`<script data-nova-pages-runtime>
(() => {
  const basePath = ${JSON.stringify(basePath)};
  const rewriteValue = (value) => {
    if (!value || value.startsWith("#") || value.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
    if (value === basePath || value.startsWith(basePath + "/")) return value;
    return value.startsWith("/") ? basePath + value : value;
  };
  const rewriteTree = (root) => {
    const elements = root.querySelectorAll?.("[href], [src], [action]") ?? [];
    for (const element of elements) {
      for (const attribute of ["href", "src", "action"]) {
        const value = element.getAttribute(attribute);
        const rewritten = rewriteValue(value);
        if (rewritten !== value) element.setAttribute(attribute, rewritten);
      }
    }
  };
  const showStaticCheckoutNotice = () => {
    if (!location.pathname.endsWith("/checkout")) return;
    const heading = [...document.querySelectorAll("h2")].find((element) => element.textContent?.includes("테스트 결제"));
    const section = heading?.closest("section");
    if (section && !section.querySelector("[data-pages-payment-notice]")) {
      const notice = document.createElement("p");
      notice.dataset.pagesPaymentNotice = "true";
      notice.className = "checkout-error";
      notice.textContent = "GitHub Pages 데모에서는 상품 탐색과 장바구니까지 확인할 수 있습니다. 서버 결제 승인은 로컬 또는 서버 배포 환경에서 이용해주세요.";
      section.append(notice);
    }
    for (const button of document.querySelectorAll("button")) {
      if (button.textContent?.includes("토스 결제")) {
        button.disabled = true;
        button.title = "GitHub Pages 정적 데모에서는 결제 승인을 지원하지 않습니다.";
      }
    }
  };
  document.addEventListener("click", (event) => {
    const anchor = event.target.closest?.("a[href]");
    if (!anchor || anchor.target || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || !href.startsWith(basePath + "/")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.assign(href);
  }, true);
  const refresh = () => {
    rewriteTree(document);
    showStaticCheckoutNotice();
  };
  new MutationObserver(refresh).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["href", "src", "action"] });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refresh, { once: true });
  else refresh();
})();
</script>`;

function rewriteHtml(html) {
  const rewritten = html.replace(/(\b(?:href|src|action|content)=["'])\/(?!\/)/g, `$1${basePath}/`);
  return rewritten.replace("</head>", `${pagesRuntime}</head>`);
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(clientDirectory, outputDirectory, { recursive: true });

for (const route of routes) {
  const response = await fetch(new URL(route, origin));
  if (!response.ok) throw new Error(`Failed to export ${route}: HTTP ${response.status}`);
  const html = rewriteHtml(await response.text());
  const routeDirectory = route === "/" ? outputDirectory : path.join(outputDirectory, route.slice(1));
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(path.join(routeDirectory, "index.html"), html, "utf8");
}

await writeFile(path.join(outputDirectory, ".nojekyll"), "", "utf8");
await writeFile(path.join(outputDirectory, "404.html"), await readFile(path.join(outputDirectory, "index.html"), "utf8"), "utf8");
console.log(`Exported ${routes.length} NOVA routes to ${outputDirectory}`);
