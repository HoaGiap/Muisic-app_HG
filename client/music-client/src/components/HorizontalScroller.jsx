// === HorizontalScroller.jsx (bạn có thể đặt ngay trên Home.jsx) ===
import { useEffect, useRef, useState } from "react";

export function HorizontalScroller({ children, className = "", step = 600 }) {
  const ref = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEnds = () => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setAtStart(scrollLeft <= 2);
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 2);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateEnds();
    const onScroll = () => updateEnds();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const scrollBy = (dx) =>
    ref.current?.scrollBy({ left: dx, behavior: "smooth" });

  return (
    <div className="scroller-wrap">
      <button
        className="scroll-btn left"
        onClick={() => scrollBy(-step)}
        disabled={atStart}
        aria-label="Cuộn trái"
      >
        ◀
      </button>

      <div ref={ref} className={className}>
        {children}
      </div>

      <button
        className="scroll-btn right"
        onClick={() => scrollBy(step)}
        disabled={atEnd}
        aria-label="Cuộn phải"
      >
        ▶
      </button>

      {/* viền fade hai mép cho đẹp */}
      <div className={`edge-fade left ${atStart ? "hide" : ""}`} />
      <div className={`edge-fade right ${atEnd ? "hide" : ""}`} />
    </div>
  );
}
