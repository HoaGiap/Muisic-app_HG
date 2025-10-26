import { Link } from "react-router-dom";
import RowScroller from "./RowScroller.jsx";

export default function SectionRow({ title, seeAllTo, children }) {
  return (
    <section style={{ marginTop: 28 }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h3>
        {seeAllTo && (
          <Link
            to={seeAllTo}
            style={{ marginLeft: "auto", fontSize: 13, opacity: 0.9 }}
          >
            Hiện tất cả
          </Link>
        )}
      </header>
      <RowScroller>{children}</RowScroller>
    </section>
  );
}
