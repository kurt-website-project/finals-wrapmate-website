import {
  Package,
  Recycle,
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getOrders } from "@/backend/wrapmate-store";

/* -------------------------------------------------------------------------
 * MOCK DATA
 * -------------------------------------------------------------------------
 * Everything below is sample data rendered in the browser. When the backend
 * is ready, replace this block with calls to the API (e.g. GET /api/v1/stats
 * for the summary + charts, GET /api/v1/orders for recent activity). The
 * component only reads from the `stats`, `plasticReduction`, `wrapUsage`,
 * `statusBreakdown`, and `recentActivity` values, so swapping the source is
 * a localized change.
 * ---------------------------------------------------------------------- */

// System Feature #5: plastic waste reduction (PR%) per SKU batch size.
// PR = ((manual - automated) / manual) * 100
// NOTE: this comparison needs historical manual-vs-automated measurements the
// prototype does not collect yet, so it stays as illustrative sample data.
const plasticReduction = [
  { batch: "Small", manual: 60, wrapmate: 38 },
  { batch: "Medium", manual: 120, wrapmate: 74 },
  { batch: "Large", manual: 210, wrapmate: 118 },
];

// Bubble wrap dispensed per day over the last week (cm). Illustrative sample.
const wrapUsage = [
  { day: "Mon", length: 210 },
  { day: "Tue", length: 180 },
  { day: "Wed", length: 320 },
  { day: "Thu", length: 260 },
  { day: "Fri", length: 390 },
  { day: "Sat", length: 300 },
  { day: "Sun", length: 200 },
];

/* -------------------------------------------------------------------------
 * Theme-aware chart colors
 * -------------------------------------------------------------------------
 * Recharts needs concrete color strings, but our palette lives in CSS
 * variables (--chart-1..5, etc.) that change with light/dark mode. We read
 * the computed values at runtime and re-read them whenever the theme toggles.
 * ---------------------------------------------------------------------- */

type ChartColors = {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  grid: string;
  text: string;
};

function readChartColors(): ChartColors {
  if (typeof window === "undefined") {
    return {
      chart1: "#6d4ad8",
      chart2: "#9b7ff0",
      chart3: "#7c5cff",
      chart4: "#8b6df0",
      grid: "#e5e7eb",
      text: "#6b7280",
    };
  }

  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;

  return {
    chart1: read("--chart-1", "#6d4ad8"),
    chart2: read("--chart-2", "#9b7ff0"),
    chart3: read("--chart-3", "#7c5cff"),
    chart4: read("--chart-4", "#8b6df0"),
    grid: read("--border", "#e5e7eb"),
    text: read("--muted-foreground", "#6b7280"),
  };
}

function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(() => readChartColors());

  useEffect(() => {
    // Re-read colors when the theme (class/style on <html>) changes.
    const observer = new MutationObserver(() => setColors(readChartColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
    // Also refresh once after mount in case variables resolve late.
    setColors(readChartColors());
    return () => observer.disconnect();
  }, []);

  return colors;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const colors = useChartColors();

  // --- Real data derived from the shared Orders store ---
  const orders = getOrders();
  const totalOrders = orders.length;
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const processingCount = orders.filter((o) => o.status === "Processing").length;
  const completedCount = orders.filter((o) => o.status === "Completed").length;

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
    // Average WrapMate plastic reduction across the sample batches (PR%).
    plasticSavedPct: 42,
    totalWrapUsedCm,
    avgWrapLengthCm,
  };

  // Real order-status distribution for the donut.
  const statusBreakdown = [
    { name: "Completed", value: completedCount },
    { name: "Processing", value: processingCount },
    { name: "Pending", value: pendingCount },
  ].filter((s) => s.value > 0);

  // Recent activity from the latest orders (most recent first).
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

  const statusColors = [colors.chart1, colors.chart2, colors.chart4];

  const tooltipStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--card-foreground)",
    fontSize: "0.8rem",
  };

  return (
    <div className="wrapmate-dashboard">
      {/* Welcome Section */}
      <section className="dashboard-welcome">
        <div>
          <p className="dashboard-eyebrow">WrapMate Dashboard</p>
          <h1>Welcome back!</h1>
          <p>Here's an overview of your packaging operations today.</p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Quick Actions</h2>
            <p>Access commonly used WrapMate features.</p>
          </div>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="dashboard-action-card primary"
            onClick={() => navigate("/orders")}
          >
            <div className="dashboard-action-icon">
              <Plus />
            </div>
            <div>
              <strong>Manage Orders</strong>
              <span>View and process packaging orders</span>
            </div>
            <ArrowRight className="dashboard-action-arrow" />
          </button>

          <button
            type="button"
            className="dashboard-action-card"
            onClick={() => navigate("/orders")}
          >
            <div className="dashboard-action-icon">
              <Package />
            </div>
            <div>
              <strong>Order Queue</strong>
              <span>Check pending and active orders</span>
            </div>
            <ArrowRight className="dashboard-action-arrow" />
          </button>
        </div>
      </section>

      {/* Statistics */}
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
            <Recycle />
          </div>
          <div>
            <span>Plastic Saved</span>
            <strong>{stats.plasticSavedPct}%</strong>
            <small>vs. manual wrapping</small>
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

      {/* Plastic Waste Reduction — headline chart (System Feature #5) */}
      <section className="dashboard-section">
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Plastic Waste Reduction</h2>
              <p>
                Bubble wrap used per batch: manual wrapping vs. WrapMate-assisted
                cutting (lower is better).
              </p>
            </div>
          </div>

          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={plasticReduction}
                margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="batch"
                  stroke={colors.text}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: colors.grid }}
                />
                <YAxis
                  stroke={colors.text}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: colors.grid }}
                  label={{
                    value: "cm",
                    angle: -90,
                    position: "insideLeft",
                    fill: colors.text,
                    fontSize: 12,
                  }}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ opacity: 0.1 }} />
                <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
                <Bar
                  name="Manual"
                  dataKey="manual"
                  fill={colors.chart2}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  name="WrapMate"
                  dataKey="wrapmate"
                  fill={colors.chart1}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Two-up: usage trend + status donut */}
      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Bubble Wrap Usage</h2>
              <p>Total wrap length dispensed over the last 7 days.</p>
            </div>
          </div>

          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={wrapUsage}
                margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  stroke={colors.text}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: colors.grid }}
                />
                <YAxis
                  stroke={colors.text}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: colors.grid }}
                  label={{
                    value: "cm",
                    angle: -90,
                    position: "insideLeft",
                    fill: colors.text,
                    fontSize: 12,
                  }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  name="Wrap length"
                  type="monotone"
                  dataKey="length"
                  stroke={colors.chart1}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: colors.chart1 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Order Status</h2>
              <p>Current distribution of packaging orders.</p>
            </div>
          </div>

          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="var(--card)"
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={statusColors[index % statusColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
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
