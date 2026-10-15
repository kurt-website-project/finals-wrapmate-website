import { useEffect, useMemo, useState } from "react";
import { useNotification } from "@refinedev/core";
import { Plus, X, Trash2 } from "lucide-react";
import {
  getOrders,
  getProducts,
  addOrder,
  updateOrderStatus,
  deleteOrder,
  calculateLength,
  formatPeso,
  PROTECTION_LEVELS,
  type Order,
  type OrderStatus,
  type ProtectionLevel,
  type Product,
} from "@/backend/wrapmate-store";

export default function Orders() {
  const { open } = useNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | OrderStatus>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  async function reloadOrders() {
    try {
      setOrders(await getOrders());
    } catch {
      setOrders([]);
    }
  }

  useEffect(() => {
    reloadOrders();
    getProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  const [customer, setCustomer] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [protection, setProtection] = useState<ProtectionLevel>(1.0);

  const selectedProduct = products.find((p) => p.id === productId);
  const liveLength = selectedProduct
    ? calculateLength(selectedProduct.width, selectedProduct.height, protection)
    : null;

  const qtyNum = Math.max(1, parseInt(quantity, 10) || 0);
  const liveRevenue = selectedProduct ? selectedProduct.price * qtyNum : null;
  const liveProfit = selectedProduct
    ? (selectedProduct.price - selectedProduct.cost) * qtyNum
    : null;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = search.toLowerCase();
      const matchesSearch =
        order.id.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.productName.toLowerCase().includes(q) ||
        order.sku.toLowerCase().includes(q);
      const matchesFilter = filter === "All" || order.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [orders, search, filter]);

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const processingCount = orders.filter((o) => o.status === "Processing").length;
  const completedCount = orders.filter((o) => o.status === "Completed").length;

  async function changeStatus(rowId: string, status: OrderStatus) {
    try {
      await updateOrderStatus(rowId, status);
      await reloadOrders();
    } catch (err) {
      open?.({
        type: "error",
        message: "Update failed",
        description: (err as Error).message,
      });
    }
  }

  async function confirmDelete() {
    if (!orderToDelete) return;
    const removed = orderToDelete;
    setOrderToDelete(null);
    try {
      await deleteOrder(removed.rowId);
      await reloadOrders();
      open?.({
        type: "success",
        message: "Order deleted",
        description: `Order ${removed.id} has been removed.`,
      });
    } catch (err) {
      open?.({
        type: "error",
        message: "Delete failed",
        description: (err as Error).message,
      });
    }
  }

  function resetForm() {
    setCustomer("");
    setProductId("");
    setQuantity("1");
    setProtection(1.0);
  }

  function openModal() {
    if (products.length === 0) {
      open?.({
        type: "error",
        message: "No products yet",
        description: "Add a product first on the Products page.",
      });
      return;
    }
    resetForm();
    setModalOpen(true);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!customer.trim()) {
      open?.({ type: "error", message: "Customer required", description: "Please enter a customer name." });
      return;
    }
    if (!selectedProduct) {
      open?.({ type: "error", message: "Product required", description: "Please select a product." });
      return;
    }
    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty < 1) {
      open?.({ type: "error", message: "Invalid quantity", description: "Quantity must be at least 1." });
      return;
    }

    setSaving(true);
    try {
      await addOrder({
        customer: customer.trim(),
        productId: selectedProduct.id,
        protection,
        quantity: qty,
      });
      await reloadOrders();
      setModalOpen(false);
      open?.({
        type: "success",
        message: "Order added",
        description: `New order for ${selectedProduct.name} created.`,
      });
    } catch (err) {
      open?.({
        type: "error",
        message: "Save failed",
        description: (err as Error).message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h1>Order Queue</h1>
          <p>Manage and monitor your bubble wrap packaging orders.</p>
        </div>

        <button className="wm-primary-btn" onClick={openModal} type="button">
          <Plus />
          Add Order
        </button>
      </div>

      <div className="order-stats">
        <div className="order-stat">
          <span>All Orders</span>
          <strong>{orders.length}</strong>
        </div>
        <div className="order-stat">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="order-stat">
          <span>Processing</span>
          <strong>{processingCount}</strong>
        </div>
        <div className="order-stat">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>
      </div>

      <div className="orders-card">
        <div className="orders-toolbar">
          <input
            type="text"
            placeholder="Search order, customer, product, or SKU..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="order-filters">
            {["All", "Pending", "Processing", "Completed"].map((status) => (
              <button
                key={status}
                className={filter === status ? "filter-button active" : "filter-button"}
                onClick={() => setFilter(status as "All" | OrderStatus)}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product (SKU)</th>
                <th>W</th>
                <th>H</th>
                <th>Protection</th>
                <th>Length (L)</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.id}</strong></td>
                    <td>{order.customer}</td>
                    <td>
                      {order.productName}
                      <br />
                      <span className="wm-muted-cell">{order.sku}</span>
                    </td>
                    <td>{order.width} cm</td>
                    <td>{order.height} cm</td>
                    <td>P{order.protection.toFixed(1)}</td>
                    <td><strong>{order.length} cm</strong></td>
                    <td>{order.quantity}</td>
                    <td>
                      <select
                        className={`status-select ${order.status.toLowerCase()}`}
                        value={order.status}
                        onChange={(event) =>
                          changeStatus(order.rowId, event.target.value as OrderStatus)
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td>{order.date}</td>
                    <td>
                      <button
                        type="button"
                        className="wm-icon-btn wm-danger"
                        onClick={() => setOrderToDelete(order)}
                        aria-label={`Delete order ${order.id}`}
                      >
                        <Trash2 />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="empty-orders">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="wm-modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="wm-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="wm-modal-header">
              <h2>Add New Order</h2>
              <button
                type="button"
                className="wm-icon-btn"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSave} className="wm-modal-body">
              <label className="wm-field">
                <span>Customer</span>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Customer name"
                  autoFocus
                />
              </label>

              <label className="wm-field">
                <span>Product</span>
                <select
                  className="wm-select"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Select a product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </label>

              <div className="wm-field-row">
                <label className="wm-field">
                  <span>Width (W) — auto</span>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={selectedProduct ? `${selectedProduct.width} cm` : "—"}
                  />
                </label>
                <label className="wm-field">
                  <span>Height (H) — auto</span>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={selectedProduct ? `${selectedProduct.height} cm` : "—"}
                  />
                </label>
              </div>

              <label className="wm-field">
                <span>Unit Selling Price — auto</span>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedProduct ? formatPeso(selectedProduct.price) : "—"}
                />
              </label>

              <div className="wm-field-row">
                <label className="wm-field">
                  <span>Protection Level (layers)</span>
                  <select
                    className="wm-select"
                    value={protection}
                    onChange={(e) =>
                      setProtection(parseFloat(e.target.value) as ProtectionLevel)
                    }
                  >
                    {PROTECTION_LEVELS.map((p) => (
                      <option key={p} value={p}>
                        P = {p.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="wm-field">
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </label>
              </div>

              <div className="wm-calc-box">
                <span className="wm-calc-label">Calculated bubble wrap length</span>
                <span className="wm-calc-result">
                  {liveLength !== null ? `${liveLength} cm` : "— select a product —"}
                </span>
                <span className="wm-calc-formula">L = (2 × (W + H) × P) + 5</span>
              </div>

              {selectedProduct && (
                <div className="wm-calc-box">
                  <span className="wm-calc-label">Order total ({qtyNum} pcs)</span>
                  <div className="wm-preview-chips">
                    <span className="wm-preview-chip">
                      Revenue: {formatPeso(liveRevenue ?? 0)}
                    </span>
                    <span className="wm-preview-chip">
                      Profit: {formatPeso(liveProfit ?? 0)}
                    </span>
                  </div>
                  <span className="wm-calc-formula">
                    Revenue = Price × Qty · Profit = (Price − Cost) × Qty
                  </span>
                </div>
              )}

              <div className="wm-modal-footer">
                <button type="submit" className="wm-primary-btn" disabled={saving}>
                  {saving ? "Saving…" : "Save Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {orderToDelete && (
        <div
          className="wm-modal-overlay"
          onClick={() => setOrderToDelete(null)}
        >
          <div
            className="wm-modal wm-modal-sm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="wm-modal-header">
              <h2>Delete order?</h2>
              <button
                type="button"
                className="wm-icon-btn"
                onClick={() => setOrderToDelete(null)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <div className="wm-modal-body">
              <p className="wm-confirm-text">
                Are you sure you want to delete order{" "}
                <strong>{orderToDelete.id}</strong> ({orderToDelete.customer} —{" "}
                {orderToDelete.productName})? This action cannot be undone.
              </p>

              <div className="wm-modal-footer wm-confirm-actions">
                <button
                  type="button"
                  className="wm-secondary-btn"
                  onClick={() => setOrderToDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="wm-danger-btn"
                  onClick={confirmDelete}
                >
                  <Trash2 />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
