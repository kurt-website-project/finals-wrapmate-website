import { useEffect, useMemo, useState } from "react";
import { Table as TableIcon } from "lucide-react";
import { getOrders, type Order } from "@/backend/wrapmate-store";

export default function Records() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const completed = useMemo(
    () => orders.filter((o) => o.status === "Completed"),
    [orders]
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return completed;
    return completed.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.sku.toLowerCase().includes(q)
    );
  }, [completed, search]);

  const totalWrap = completed.reduce(
    (sum, o) => sum + o.length * o.quantity,
    0
  );

  return (
    <div className="wm-page">
      <div className="wm-page-header">
        <div>
          <p className="dashboard-eyebrow">Table View</p>
          <h1>Records</h1>
          <p className="wm-page-sub">
            Historical log of completed packaging runs — SKU, box dimensions,
            protection level, target length, and timestamp.
          </p>
        </div>
      </div>

      <div className="order-stats">
        <div className="order-stat">
          <span>Completed Runs</span>
          <strong>{completed.length}</strong>
        </div>
        <div className="order-stat">
          <span>Total Wrap Used</span>
          <strong>{Math.round(totalWrap * 10) / 10} cm</strong>
        </div>
      </div>

      <div className="wm-card">
        <div className="orders-toolbar">
          <input
            type="text"
            placeholder="Search order, customer, product, or SKU..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>SKU</th>
                <th>Product</th>
                <th>Width (W)</th>
                <th>Height (H)</th>
                <th>Protection (P)</th>
                <th>Target Length (L)</th>
                <th>Qty</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.id}</strong></td>
                    <td>{order.sku}</td>
                    <td>{order.productName}</td>
                    <td>{order.width} cm</td>
                    <td>{order.height} cm</td>
                    <td>P{order.protection.toFixed(1)}</td>
                    <td><strong>{order.length} cm</strong></td>
                    <td>{order.quantity}</td>
                    <td>{order.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="empty-orders">
                    {loading
                      ? "Loading records…"
                      : search.trim()
                        ? "No completed records match your search."
                        : "No completed packaging runs yet. Mark an order as Completed in the Order Queue to see it here."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && completed.length === 0 && !search.trim() && (
        <div className="placeholder-empty" style={{ marginTop: 16 }}>
          <div className="placeholder-empty-icon">
            <TableIcon />
          </div>
          <strong>No records yet</strong>
          <span>
            Completed orders from the Order Queue will appear here as packaging
            records.
          </span>
        </div>
      )}
    </div>
  );
}
