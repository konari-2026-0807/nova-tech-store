"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Image as ImageIcon, Star, ThumbsUp } from "lucide-react";
import type { CatalogProduct } from "../../lib/catalog";

type ProductReviewsProps = {
  productName: string;
  rating: number;
  reviewCount: number;
  reviewImage: string;
  reviews: CatalogProduct["reviews"];
};

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return <span className="review-stars" aria-label={`별점 ${rating}점`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={size} fill={star <= Math.round(rating) ? "currentColor" : "none"} />)}</span>;
}

export function ProductReviews({ productName, rating, reviewCount, reviewImage, reviews }: ProductReviewsProps) {
  const [photoOnly, setPhotoOnly] = useState(false);
  const [sort, setSort] = useState("recommended");
  const [helpful, setHelpful] = useState<Record<string, number>>({});

  const visibleReviews = useMemo(() => {
    const filtered = photoOnly ? reviews.filter((review) => review.photo) : [...reviews];
    if (sort === "latest") return filtered.sort((a, b) => b.date.localeCompare(a.date));
    if (sort === "rating") return filtered.sort((a, b) => b.rating - a.rating);
    return filtered.sort((a, b) => b.helpful - a.helpful);
  }, [photoOnly, reviews, sort]);

  const distribution = [
    { score: 5, percent: 78 },
    { score: 4, percent: 17 },
    { score: 3, percent: 4 },
    { score: 2, percent: 1 },
    { score: 1, percent: 0 },
  ];

  return (
    <section className="product-reviews" id="reviews" aria-labelledby="reviews-title">
      <div className="reviews-heading"><div><p className="eyebrow dark">VERIFIED REVIEWS</p><h2 id="reviews-title">실구매자 후기.</h2></div><p>{productName}을 먼저 경험한 고객들의 솔직한 이야기입니다.</p></div>
      <div className="review-summary">
        <div className="review-score"><strong>{rating.toFixed(1)}</strong><Stars rating={rating} size={17} /><span>{reviewCount.toLocaleString("ko-KR")}개의 후기</span></div>
        <div className="review-bars">{distribution.map((item) => <div key={item.score}><span>{item.score}점</span><i><b style={{ width: `${item.percent}%` }} /></i><em>{item.percent}%</em></div>)}</div>
        <div className="review-keywords"><span>고객들이 많이 언급했어요</span><div><b>디자인이 좋아요</b><b>사용이 편리해요</b><b>마감이 좋아요</b></div></div>
      </div>

      <div className="review-toolbar"><div><button type="button" className={!photoOnly ? "active" : ""} onClick={() => setPhotoOnly(false)}>전체 후기</button><button type="button" className={photoOnly ? "active" : ""} onClick={() => setPhotoOnly(true)}><ImageIcon size={14} /> 포토 후기</button></div><label><span className="sr-only">후기 정렬</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">추천순</option><option value="latest">최신순</option><option value="rating">평점 높은순</option></select></label></div>

      <div className="review-list">
        {visibleReviews.map((review) => (
          <article className="review-card" key={review.id}>
            <div className="review-author"><div className="review-avatar">{review.author.slice(0, 1)}</div><div><strong>{review.author}</strong><span><BadgeCheck size={12} /> 구매 인증</span></div></div>
            <div className="review-body"><div className="review-meta"><Stars rating={review.rating} /><span>{review.date}</span></div><p className="review-option">선택 옵션 · {review.option}</p><h3>{review.title}</h3><p className="review-comment">{review.comment}</p>{review.photo && <figure><img src={reviewImage} alt={`${productName} 실구매자 포토 후기`} loading="lazy" decoding="async" /><figcaption>구매자가 직접 등록한 상품 이미지</figcaption></figure>}<button type="button" className="helpful-button" onClick={() => setHelpful((current) => ({ ...current, [review.id]: (current[review.id] ?? 0) + 1 }))}><ThumbsUp size={14} /> 도움돼요 {review.helpful + (helpful[review.id] ?? 0)}</button></div>
          </article>
        ))}
      </div>
    </section>
  );
}
