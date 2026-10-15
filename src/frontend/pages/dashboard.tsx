import {
  Package,
  Ruler,
  Gauge,
  Plus,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getOrders,
  getStats,
  type Order,
  type WrapUsage,
} from "@/backend/wrapmate-store";

type ChartColors = {
  chart1: string;
  chart2: string;
  grid: string;
  text: string;
};

function readChartColors(): ChartColors {
  if (typeof window === "undefined") {
    return { chart1: "#6d4ad8", chart2: "#9b7ff0", grid: "#e5e7eb", text: "#6b7280" };
  }
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    chart1: read("--chart-1", "#6d4ad8"),
    chart2: read("--chart-2", "#9b7ff0"),
    grid: read("--border", "#e5e7eb"),
    text: read("--muted-foreground", "#6b7280"),
  };
}

function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(() => readChartColors());
  useEffect(() => {
    const observer = new MutationObserver(() => setColors(readChartColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
    setColors(readChartColors());
    return () => observer.disconnect();
  }, []);
  return colors;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const colors = useChartColors();

  const [orders, setOrders] = useState<Order[]>([]);
  const [wrapUsage, setWrapUsage] = useState<WrapUsage[]>([]);

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
    getStats()
      .then((s) => setWrapUsage(s.wrapUsage))
      .catch(() => setWrapUsage([]));
  }, []);

  const tooltipStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--card-foreground)",
    fontSize: "0.8rem",
  };

  const totalOrders = orders.length;

  const totalWrapUsedCm =
    Math.round(
      orders.reduce((sum, o) => sum + o.length * o.quantity, 0) * 10
    ) / 10;

  const avgWrapLengthCm =
    totalOrders > 0
      ? Math.round(
          (orders.reduce((sum, o) => sum + o.length, 0) / totalOrders) * 10
        ) / 10
      : 0;

  const stats = {
    totalOrders,
    totalWrapUsedCm,
    avgWrapLengthCm,
  };

  const recentActivity = [...orders]
    .slice(-3)
    .reverse()
    .map((o) => ({
      id: o.id,
      message:
        o.status === "Completed"
          ? "Order completed"
          : o.status === "Processing"
            ? "Order is processing"
            : "Order pending",
      customer: o.customer,
      time: o.date,
      type:
        o.status === "Completed"
          ? "completed"
          : o.status === "Processing"
            ? "processing"
            : "new",
    }));

  return (
    <div className="wrapmate-dashboard">
      <section className="dashboard-welcome">
        <div>
          <p className="dashboard-eyebrow">WrapMate Dashboard</p>
          <h1>Welcome back!</h1>
          <p>Here's an overview of your packaging operations today.</p>
        </div>
      </section>

      <section className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Package />
          </div>
          <div>
            <span>Total Orders</span>
            <strong>{stats.totalOrders}</strong>
            <small>All recorded orders</small>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Ruler />
          </div>
          <div>
            <span>Bubble Wrap Used</span>
            <strong>{stats.totalWrapUsedCm.toLocaleString()} cm</strong>
            <small>Total dispensed</small>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Gauge />
          </div>
          <div>
            <span>Avg. Wrap Length</span>
            <strong>{stats.avgWrapLengthCm} cm</strong>
            <small>Per order</small>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Bubble Wrap Overview</h2>
              <p>
                Total bubble wrap used and average wrap length per product
                (completed orders only).
              </p>
            </div>
          </div>

          <div className="dashboard-chart">
            {wrapUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={wrapUsage}
                  margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                  barGap={6}
                  barCategoryGap="28%"
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke={colors.grid}
                    strokeOpacity={0.6}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="product"
                    stroke={colors.text}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={6}
                  />
                  <YAxis
                    stroke={colors.text}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={(v: number) => `${v} cm`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: colors.text, fillOpacity: 0.06, radius: 6 }}
                    formatter={(value: number) => `${value} cm`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "0.8rem", paddingTop: 8 }}
                    iconType="circle"
                  />
                  <Bar
                    name="Bubble Wrap Used"
                    dataKey="totalLength"
                    fill={colors.chart1}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                  <Bar
                    name="Avg. Wrap Length"
                    dataKey="averageLength"
                    fill={colors.chart2}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="wm-chart-empty">
                No completed orders yet. Mark orders as Completed in the Order
                Queue to see bubble wrap usage.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading dashboard-activity-heading">
          <div>
            <h2>Recent Activity</h2>
            <p>Latest updates from your packaging operations.</p>
          </div>

          <button
            type="button"
            className="dashboard-view-button"
            onClick={() => navigate("/orders")}
          >
            View all orders
            <ArrowRight />
          </button>
        </div>

        <div className="dashboard-activity-list">
          {recentActivity.map((activity) => (
            <div className="dashboard-activity-item" key={activity.id}>
              <div className={`activity-icon ${activity.type}`}>
                {activity.type === "completed" && <CheckCircle2 />}
                {activity.type === "processing" && <LoaderCircle />}
                {activity.type === "new" && <Plus />}
              </div>

              <div className="activity-content">
                <strong>{activity.id}</strong>
                <span>
                  {activity.message} · {activity.customer}
                </span>
              </div>

              <time>{activity.time}</time>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
