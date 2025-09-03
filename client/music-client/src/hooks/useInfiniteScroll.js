// src/hooks/useInfiniteScroll.js
import { useEffect, useRef } from "react";

/**
 * Gắn IntersectionObserver vào 1 "sentinel" <div>.
 * Khi sentinel vào viewport -> gọi onLoadMore đúng 1 lần, rồi unobserve.
 * Sau khi setState và re-render, hook sẽ gắn lại cho lượt tiếp theo.
 */
export default function useInfiniteScroll({
  disabled,
  onLoadMore,
  rootMargin = "0px 0px 400px 0px",
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          // Ngăn gọi lặp: unobserve ngay lần đầu chạm
          io.unobserve(el);
          onLoadMore?.();
        }
      },
      { root: null, rootMargin, threshold: 0.01 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [disabled, onLoadMore, rootMargin]);

  return ref;
}
