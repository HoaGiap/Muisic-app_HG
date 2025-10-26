import { Link } from "react-router-dom";

export function SquareCard({ to = "#", img, title, subtitle }) {
  return (
    <Link to={to} className="card">
      <div className="card-img">
        <img src={img} alt={title} loading="lazy" />
        <div className="card-play">▶</div>
      </div>
      <div className="card-meta">
        <div className="card-title" title={title}>
          {title}
        </div>
        {subtitle && <div className="card-sub">{subtitle}</div>}
      </div>
    </Link>
  );
}

export function CircleCard({ to = "#", img, title, subtitle }) {
  return (
    <Link to={to} className="card circle">
      <div className="card-img">
        <img src={img} alt={title} loading="lazy" />
      </div>
      <div className="card-meta">
        <div className="card-title" title={title}>
          {title}
        </div>
        {subtitle && <div className="card-sub">{subtitle}</div>}
      </div>
    </Link>
  );
}
