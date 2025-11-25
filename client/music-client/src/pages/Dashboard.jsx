import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import { t } from "../ui/toast";

const niceNum = (n = 0, digits = 1) =>
  new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: digits,
  }).format(n || 0);

const fmtDate = (iso = "") => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    month: "short",
    day: "numeric",
  });
};

const palette = ["#a855f7", "#22d3ee", "#34d399", "#fbbf24", "#fb7185"];

export default function Dashboard() {
  const [stats, setStats] = useState({
    usersPerDay: [],
    topSongsWeek: [],
    bandwidth: {},
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/stats/overview");
      setStats(data);
    } catch (e) {
      console.error(e);
      t.err("Không tải được thống kê");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalNewUsers = useMemo(
    () => (stats.usersPerDay || []).reduce((s, d) => s + (d.count || 0), 0),
    [stats.usersPerDay]
  );

  const totalPlaysWeek = useMemo(
    () => (stats.topSongsWeek || []).reduce((s, d) => s + (d.plays || 0), 0),
    [stats.topSongsWeek]
  );

  const bandwidthGB = stats.bandwidth?.totalGB || 0;
  const bandwidthCap = Math.max(10, Math.ceil((bandwidthGB || 1) / 50) * 50);
  const bandwidthData = [
    { name: "Đã dùng", value: Number(bandwidthGB.toFixed(2)) },
    { name: "Còn lại", value: Math.max(0, bandwidthCap - bandwidthGB) },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Dashboard thống kê</h2>
        <button
          onClick={load}
          disabled={loading}
          style={{ marginLeft: "auto" }}
        >
          {loading ? "Đang tải…" : "Tải lại"}
        </button>
      </div>

      {loading && <p style={{ opacity: 0.8 }}>Đang tải dữ liệu…</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 12,
        }}
      >
        <StatCard
          title="Người dùng mới (14 ngày)"
          primary={niceNum(totalNewUsers, 0)}
          sub={`${niceNum(
            stats.usersPerDay?.[stats.usersPerDay.length - 1]?.count || 0,
            0
          )} hôm nay`}
        />
        <StatCard
          title="Lượt nghe tuần"
          primary={niceNum(totalPlaysWeek, 0)}
          sub={`Top: ${
            stats.topSongsWeek?.[0]?.title || "Chưa có dữ liệu"
          }`}
        />
        <StatCard
          title="Băng thông ước tính"
          primary={`${bandwidthGB.toFixed(2)} GB`}
          sub={`${niceNum(stats.bandwidth?.totalPlays || 0, 0)} lượt nghe • 128 kbps`}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 12,
          alignItems: "stretch",
        }}
      >
        <ChartCard title="Người dùng mới theo ngày">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.usersPerDay} margin={{ top: 12, right: 16 }}>
              <defs>
                <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDate}
                tick={{ fontSize: 12, fill: "var(--text,#e2e8f0)" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--text,#e2e8f0)" }}
                allowDecimals={false}
              />
              <Tooltip
                labelFormatter={(v) => fmtDate(v)}
                formatter={(v) => [`${v} user`, "Số mới"]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#22d3ee"
                fill="url(#gradUsers)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Băng thông ước tính">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              placeItems: "center",
              gap: 8,
              height: "100%",
            }}
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Tooltip formatter={(v, n) => [`${v.toFixed(2)} GB`, n]} />
                <Pie
                  data={bandwidthData}
                  dataKey="value"
                  innerRadius={70}
                  outerRadius={90}
                  startAngle={210}
                  endAngle={-30}
                  paddingAngle={3}
                  stroke="none"
                >
                  {bandwidthData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === 0 ? "#22d3ee" : "rgba(255,255,255,.08)"}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {bandwidthGB.toFixed(2)} GB
              </div>
              <div style={{ opacity: 0.7 }}>
                Trên tổng {bandwidthCap} GB (ước tính 128 kbps)
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Bài hát nghe nhiều nhất tuần">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={stats.topSongsWeek}
            margin={{ left: 0, right: 24, bottom: 24 }}
            barSize={32}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
            <XAxis
              dataKey="title"
              tickFormatter={(v) => (v || "").slice(0, 10) + (v?.length > 10 ? "…" : "")}
              interval={0}
              tick={{ fontSize: 12, fill: "var(--text,#e2e8f0)" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--text,#e2e8f0)" }}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(v) => [`${v} lượt`, "Lượt nghe"]}
              labelFormatter={(lbl, payload) => {
                const item = payload?.[0]?.payload;
                return `${item?.title || ""} — ${item?.artist || ""}`;
              }}
            />
            <Bar dataKey="plays" radius={[6, 6, 0, 0]}>
              {stats.topSongsWeek?.map((_, i) => (
                <Cell key={i} fill={palette[i % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function StatCard({ title, primary, sub }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        border: "1px solid var(--border,#243043)",
        background: "var(--card,#0f141b)",
      }}
    >
      <div style={{ opacity: 0.8, fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{primary}</div>
      <div style={{ opacity: 0.65, fontSize: 13, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div
      style={{
        border: "1px solid var(--border,#243043)",
        borderRadius: 12,
        padding: 12,
        background: "var(--card,#0f141b)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 700 }}>{title}</div>
      </div>
      {children}
    </div>
  );
}
