export type CatalogCategory = {
  slug: string;
  name: string;
  navLabel: string;
  eyebrow: string;
  description: string;
};

export type CatalogProduct = {
  slug: string;
  name: string;
  category: string;
  categorySlugs: string[];
  price: string;
  priceNumber: number;
  color: string;
  colors: string[];
  art: "headset" | "notebook" | "keyboard" | "hub";
  image: string;
  badge: string;
  rating: number;
  reviewCount: number;
  reviewImage: string;
  modelNumber: string;
  origin: string;
  packageItems: string[];
  tagline: string;
  description: string;
  options: string[];
  highlights: { title: string; description: string }[];
  specs: { label: string; value: string }[];
  reviews: {
    id: string;
    author: string;
    date: string;
    rating: number;
    title: string;
    comment: string;
    option: string;
    helpful: number;
    photo?: boolean;
  }[];
};

export const catalogCategories: CatalogCategory[] = [
  { slug: "new", name: "신제품", navLabel: "New", eyebrow: "LATEST RELEASES", description: "가장 먼저 만나는 NOVA의 새로운 기술과 이번 시즌 큐레이션." },
  { slug: "mobile", name: "모바일", navLabel: "Mobile", eyebrow: "WORK ANYWHERE", description: "가볍게 이동하고 어디서든 완성도 높은 작업을 이어가는 기술." },
  { slug: "computing", name: "컴퓨팅", navLabel: "Computing", eyebrow: "CREATE FASTER", description: "생각의 속도를 놓치지 않는 컴퓨팅과 데스크 셋업." },
  { slug: "audio", name: "오디오", navLabel: "Audio", eyebrow: "HEAR THE DETAIL", description: "고요부터 공간감까지 섬세하게 설계된 프리미엄 사운드." },
  { slug: "gaming", name: "게이밍", navLabel: "Gaming", eyebrow: "PLAY PRECISE", description: "반응 속도와 손끝의 감각을 정교하게 끌어올리는 기어." },
  { slug: "smart-home", name: "스마트홈", navLabel: "Smart Home", eyebrow: "LIVE CONNECTED", description: "공간을 이해하고 일상을 자연스럽게 연결하는 스마트 기술." },
  { slug: "accessories", name: "액세서리", navLabel: "Accessories", eyebrow: "FINISH THE SETUP", description: "당신의 셋업에 완성도를 더하는 작지만 정교한 선택." },
];

export const primaryNav = catalogCategories.filter((category) => category.slug !== "accessories");

export const products: CatalogProduct[] = [
  {
    slug: "airarc-one",
    name: "AirArc One",
    category: "SPATIAL AUDIO",
    categorySlugs: ["new", "audio"],
    price: "489,000원",
    priceNumber: 489000,
    color: "Midnight",
    colors: ["Midnight", "Cloud Silver"],
    art: "headset",
    image: "/images/products/airarc-one.webp",
    badge: "BEST",
    rating: 4.8,
    reviewCount: 128,
    reviewImage: "/images/reviews/airarc-one-review.webp",
    modelNumber: "AAO-01",
    origin: "베트남",
    packageItems: ["AirArc One 본체", "하드 트래블 케이스", "USB-C 충전 케이블", "3.5mm 오디오 케이블", "퀵 가이드"],
    tagline: "소음은 사라지고, 공간은 음악이 됩니다.",
    description: "초경량 티타늄 프레임과 적응형 공간 음향이 주변 환경을 읽고 당신만을 위한 깊은 몰입을 완성합니다.",
    options: ["Standard", "Travel Edition"],
    highlights: [
      { title: "−42dB Active Silence", description: "주변 소음을 실시간으로 분석해 필요한 만큼 정교하게 상쇄합니다." },
      { title: "Adaptive Spatial", description: "머리의 움직임과 공간을 감지해 자연스러운 입체 음향을 유지합니다." },
      { title: "38 Hours", description: "한 번의 충전으로 최대 38시간, 10분 충전으로 5시간 재생합니다." },
    ],
    specs: [
      { label: "드라이버", value: "40mm NOVA Carbon" },
      { label: "무게", value: "268g" },
      { label: "연결", value: "Bluetooth 5.4 · USB-C · 3.5mm" },
      { label: "코덱", value: "LDAC · AAC · SBC" },
      { label: "보증", value: "2년 제한 보증" },
    ],
    reviews: [
      { id: "a1", author: "김민*", date: "2026.08.07", rating: 5, title: "출퇴근 시간이 정말 조용해졌어요", comment: "지하철에서 저음 소음이 거의 느껴지지 않고 음악 볼륨을 낮춰도 디테일이 잘 들립니다. 장시간 착용해도 정수리 압박이 적어서 만족해요.", option: "Midnight · Standard", helpful: 34, photo: true },
      { id: "a2", author: "박서*", date: "2026.08.03", rating: 5, title: "공간 음향이 과하지 않고 자연스럽습니다", comment: "영화 볼 때 대사가 또렷하고 배경음이 넓게 펼쳐져요. 앱 설정도 단순해서 처음 연결할 때 어렵지 않았습니다.", option: "Midnight · Standard", helpful: 21 },
      { id: "a3", author: "이준*", date: "2026.07.29", rating: 4, title: "마감과 배터리는 기대 이상", comment: "금속 부분의 촉감과 힌지 움직임이 단단합니다. 케이스가 조금 큰 편이지만 배터리가 오래가서 출장 때 충전기를 거의 꺼내지 않았어요.", option: "Cloud Silver · Travel Edition", helpful: 12 },
    ],
  },
  {
    slug: "nova-fold-14",
    name: "NOVA Fold 14",
    category: "MOBILE WORKSTATION",
    categorySlugs: ["new", "mobile", "computing"],
    price: "2,390,000원",
    priceNumber: 2390000,
    color: "Titanium",
    colors: ["Titanium", "Deep Graphite"],
    art: "notebook",
    image: "/images/products/nova-fold-14.webp",
    badge: "NEW",
    rating: 4.7,
    reviewCount: 74,
    reviewImage: "/images/reviews/nova-fold-14-review.webp",
    modelNumber: "NF14-X1",
    origin: "대한민국·베트남",
    packageItems: ["NOVA Fold 14 본체", "65W USB-C 전원 어댑터", "USB-C 충전 케이블", "제품 안내서"],
    tagline: "가벼움 안에 담은 프로의 속도.",
    description: "1.18kg의 정밀 가공 알루미늄 바디에 고성능 프로세서와 선명한 2.8K 디스플레이를 담았습니다.",
    options: ["16GB · 512GB", "32GB · 1TB"],
    highlights: [
      { title: "2.8K PureView", description: "120Hz OLED 패널이 깊은 명암과 정확한 색을 부드럽게 표현합니다." },
      { title: "All-day Power", description: "최대 18시간 배터리와 65W 고속 충전으로 이동 중에도 흐름을 잇습니다." },
      { title: "Quiet Performance", description: "듀얼 팬과 베이퍼 챔버가 고성능 작업에서도 낮은 소음을 유지합니다." },
    ],
    specs: [
      { label: "디스플레이", value: "14.2인치 2.8K OLED · 120Hz" },
      { label: "프로세서", value: "NOVA X1 Pro · 12 Core" },
      { label: "메모리", value: "16GB / 32GB LPDDR5X" },
      { label: "무게", value: "1.18kg" },
      { label: "보증", value: "2년 제한 보증" },
    ],
    reviews: [
      { id: "n1", author: "최도*", date: "2026.08.06", rating: 5, title: "화면과 무게의 균형이 좋습니다", comment: "카페와 사무실을 오가며 쓰는데 가방 부담이 확실히 줄었어요. OLED 화면은 밝은 곳에서도 선명하고 사진 색보정 결과도 만족스럽습니다.", option: "Titanium · 32GB · 1TB", helpful: 28, photo: true },
      { id: "n2", author: "정하*", date: "2026.08.01", rating: 5, title: "팬 소리가 생각보다 조용해요", comment: "영상 렌더링 때는 팬이 돌지만 평소 문서 작업에서는 거의 들리지 않습니다. 키보드 간격과 트랙패드 반응도 금방 익숙해졌어요.", option: "Titanium · 16GB · 512GB", helpful: 17 },
      { id: "n3", author: "김태*", date: "2026.07.27", rating: 4, title: "포트 구성만 확인하면 좋은 선택", comment: "성능과 휴대성은 좋습니다. USB-A를 자주 쓰면 허브가 필요하지만 USB-C 중심으로 사용하는 분께는 크게 문제없을 것 같아요.", option: "Deep Graphite · 16GB · 512GB", helpful: 9 },
    ],
  },
  {
    slug: "halo-keys-75",
    name: "Halo Keys 75",
    category: "MECHANICAL KEYBOARD",
    categorySlugs: ["computing", "gaming", "accessories"],
    price: "219,000원",
    priceNumber: 219000,
    color: "Silver",
    colors: ["Silver", "Graphite"],
    art: "keyboard",
    image: "/images/products/halo-keys-75.webp",
    badge: "",
    rating: 4.9,
    reviewCount: 203,
    reviewImage: "/images/reviews/halo-keys-75-review.webp",
    modelNumber: "HK75-02",
    origin: "중국",
    packageItems: ["Halo Keys 75 본체", "USB-C 케이블", "키캡·스위치 풀러", "교체용 포인트 키캡", "퀵 가이드"],
    tagline: "손끝에서 완성되는 정확한 리듬.",
    description: "정밀 CNC 알루미늄 프레임과 저소음 핫스왑 스위치가 단단하면서도 부드러운 타건 경험을 만듭니다.",
    options: ["Nova Linear", "Nova Tactile"],
    highlights: [
      { title: "Gasket Balance", description: "균일한 가스켓 마운트가 손끝의 충격을 흡수하고 안정적인 반발력을 제공합니다." },
      { title: "Tri-mode", description: "2.4GHz, Bluetooth, USB-C를 오가며 최대 세 대의 기기에 연결합니다." },
      { title: "Hot-swappable", description: "납땜 없이 스위치를 교체해 나만의 타건감을 완성할 수 있습니다." },
    ],
    specs: [
      { label: "배열", value: "75% · 82 Keys" },
      { label: "키캡", value: "Dye-sub PBT" },
      { label: "연결", value: "2.4GHz · Bluetooth 5.2 · USB-C" },
      { label: "배터리", value: "최대 180시간" },
      { label: "보증", value: "1년 제한 보증" },
    ],
    reviews: [
      { id: "h1", author: "오지*", date: "2026.08.08", rating: 5, title: "단단하지만 손끝은 편안해요", comment: "알루미늄 하우징이 묵직해서 타이핑 중 움직임이 없고 가스켓 덕분에 바닥 치는 느낌은 부드럽습니다. 블루 포인트 키도 실제로 더 예뻐요.", option: "Silver · Nova Linear", helpful: 41, photo: true },
      { id: "h2", author: "한예*", date: "2026.08.02", rating: 5, title: "맥과 윈도우 전환이 편합니다", comment: "노트북 두 대와 태블릿을 연결해 두고 사용합니다. 연결 전환이 빠르고 노브로 볼륨을 바로 조절할 수 있어 작업 흐름이 좋아졌어요.", option: "Silver · Nova Tactile", helpful: 25 },
      { id: "h3", author: "박준*", date: "2026.07.24", rating: 4, title: "저소음 리니어가 사무실에 잘 맞아요", comment: "회의 중 옆자리에서 크게 신경 쓰이지 않는 정도입니다. 키캡 촉감이 보송하고 오래 타이핑해도 번들거림이 적어요.", option: "Graphite · Nova Linear", helpful: 14 },
    ],
  },
  {
    slug: "luma-hub",
    name: "Luma Hub",
    category: "SMART HOME",
    categorySlugs: ["new", "smart-home", "accessories"],
    price: "169,000원",
    priceNumber: 169000,
    color: "Polar",
    colors: ["Polar", "Stone"],
    art: "hub",
    image: "/images/products/luma-hub.webp",
    badge: "NOVA PICK",
    rating: 4.6,
    reviewCount: 61,
    reviewImage: "/images/reviews/luma-hub-review.webp",
    modelNumber: "LH-M1",
    origin: "대한민국",
    packageItems: ["Luma Hub 본체", "USB-C 전원 어댑터", "설치 카드", "제품 안내서", "센서 키트(선택 구성)"],
    tagline: "공간이 먼저 이해하는 자연스러운 연결.",
    description: "조명, 온도, 센서를 하나로 연결하고 당신의 생활 패턴에 맞춰 공간을 조용히 자동화합니다.",
    options: ["Luma Hub", "Luma Hub + Sensor"],
    highlights: [
      { title: "Matter Ready", description: "다양한 브랜드의 Matter 기기를 하나의 안정적인 네트워크로 연결합니다." },
      { title: "Local Intelligence", description: "주요 자동화를 기기 안에서 처리해 빠르고 개인적인 스마트홈을 만듭니다." },
      { title: "Quiet Presence", description: "필요한 정보만 은은한 상태 링으로 전달해 공간을 방해하지 않습니다." },
    ],
    specs: [
      { label: "프로토콜", value: "Matter · Thread · Wi-Fi 6 · Bluetooth" },
      { label: "연결 기기", value: "최대 128개" },
      { label: "보안", value: "로컬 암호화 · 자동 업데이트" },
      { label: "크기", value: "108 × 108 × 28mm" },
      { label: "보증", value: "2년 제한 보증" },
    ],
    reviews: [
      { id: "l1", author: "윤소*", date: "2026.08.05", rating: 5, title: "집에 흩어진 기기가 하나로 정리됐어요", comment: "조명과 온습도 센서가 브랜드가 달라 걱정했는데 등록이 쉬웠습니다. 외출 모드가 로컬로 빠르게 실행되는 점이 특히 마음에 들어요.", option: "Polar · Luma Hub + Sensor", helpful: 23, photo: true },
      { id: "l2", author: "강현*", date: "2026.07.31", rating: 5, title: "상태 표시가 은은해서 좋습니다", comment: "거실 선반에 두어도 기계 느낌이 강하지 않고 밤에는 상태 링 밝기가 자동으로 낮아집니다. 자동화 반응도 거의 즉시예요.", option: "Polar · Luma Hub", helpful: 16 },
      { id: "l3", author: "임다*", date: "2026.07.22", rating: 4, title: "초기 업데이트 후에는 안정적", comment: "처음 설치할 때 업데이트가 조금 오래 걸렸지만 이후에는 끊김 없이 사용 중입니다. 지원 기기 목록이 더 늘어나면 좋겠어요.", option: "Stone · Luma Hub", helpful: 8 },
    ],
  },
];

export const productImageByArt = Object.fromEntries(products.map((product) => [product.art, product.image])) as Record<string, string>;

export function findCategory(slug: string) {
  return catalogCategories.find((category) => category.slug === slug);
}

export function findProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductsForCategory(slug: string) {
  return products.filter((product) => product.categorySlugs.includes(slug));
}
