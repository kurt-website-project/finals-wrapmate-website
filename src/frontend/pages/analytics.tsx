import { useEffect, useState } from "react";
import { Coins, TrendingUp, CheckCircle2 } from "lucide-react";
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
  getIncomeSummary,
  getIncomePerProduct,
  formatPeso,
} from "@/backend/wrapmate-store";

/* -------------------------------------------------------------------------
 * Plastic Waste Reduction — illustrative sample (System Feature #5).
 * PR = ((manual - automated) / manual) * 100. Needs historical manual-vs-
 * automated measurements the prototype does not collect, so it stays sample.
 * ---------------------------------------------------------------------- */
const plasticReduction = [
  { batch: "Small", manual: 60, wrapmate: 38 },
  { batch: "Medium", manual: 120, wrapmate: 74 },
  { batch: "Large", manual: 210, wrapmate: 118 },
];

/* Theme-aware chart colors (read from CSS vars, re-read on theme toggle). */
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

export default function Analytics() {
  const colors = useChartColors();

  // Real income data from COMPLETED orders.
  const summary = getIncomeSummary();
  const incomePerProduct = getIncomePerProduct();

  const tooltipStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--card-foreground)",
    fontSize: "0.8rem",
  };

  return (
    <div className="wm-page">
      <div className="wm-page-header">
        <div>
          <p className="dashboard-eyebrow">Plot View</p>
          <h1>Analytics</h1>
          <p className="wm-page-sub">
            Sales income and plastic-savings insights from completed packaging
            runs.
          </p>
        </div>
      </div>

      {/* Income summary cards */}
      <section className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Coins />
          </div>
          <div>
            <span>Total Revenue</span>
            <strong>{formatPeso(summary.totalRevenue)}</strong>
            <small>From completed orders</small>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <TrendingUp />
          </div>
          <div>
            <span>Total Profit</span>
            <strong>{formatPeso(summary.totalProfit)}</strong>
            <small>Revenue − cost</small>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <CheckCircle2 />
          </div>
          <div>
            <span>Completed Orders</span>
            <strong>{summary.completedOrders}</strong>
            <small>Realized sales</small>
          </div>
        </div>
      </section>

      {/* Income per product */}
      <section className="dashboard-section">
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Sales Income per Product</h2>
              <p>Revenue and profit by product (completed orders only).</p>
            </div>
          </div>

          <div className="dashboard-chart">
            {incomePerProduct.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={incomePerProduct}
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
                    width={64}
                    tickFormatter={(v: number) => formatPeso(v)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{
                      fill: colors.text,
                      fillOpacity: 0.06,
                      radius: 6,
                    }}
                    formatter={(value: number) => formatPeso(value)}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "0.8rem", paddingTop: 8 }}
                    iconType="circle"
                  />
                  <Bar
                    name="Revenue"
                    dataKey="revenue"
                    fill={colors.chart2}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                  <Bar
                    name="Profit"
                    dataKey="profit"
                    fill={colors.chart1}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="wm-chart-empty">
                No completed orders yet. Mark orders as Completed in the Order
                Queue to see income analytics.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Plastic waste reduction */}
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
    </div>
  );
}
