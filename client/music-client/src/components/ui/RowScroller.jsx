import { useRef } from "react";
import "./row-scroller.css";

export default function RowScroller({ children }) {
  const ref = useRef(null);
  const scrollBy = (dir) => () => {
    ref.current?.scrollBy({ left: dir * 440, behavior: "smooth" });
  };

  return (
    <div className="row-wrap">
      <button className="row-nav left" onClick={scrollBy(-1)} aria-label="Prev">
        ‹
      </button>
      <div className="row" ref={ref}>
        {children}
      </div>
      <button className="row-nav right" onClick={scrollBy(1)} aria-label="Next">
        ›
      </button>
    </div>
  );
}
