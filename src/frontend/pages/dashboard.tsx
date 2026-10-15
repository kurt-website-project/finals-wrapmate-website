import {
  Package,
  Ruler,
  Gauge,
  Plus,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { useNavigate } from "react-router";
import { getOrders } from "@/backend/wrapmate-store";

export default function Dashboard() {
  const navigate = useNavigate();

  // --- Real data derived from the shared Orders store ---
  const orders = getOrders();
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
