import { useMemo, useState } from "react";
import { useNotification } from "@refinedev/core";
import { Plus, X } from "lucide-react";
import {
  getOrders,
  getProducts,
  addOrder,
  updateOrderStatus,
  calculateLength,
  PROTECTION_LEVELS,
  type Order,
  type OrderStatus,
  type ProtectionLevel,
  type Product,
} from "@/backend/wrapmate-store";

export default function Orders() {
  const { open } = useNotification();
  const [orders, setOrders] = useState<Order[]>(() => getOrders());
  const [products] = useState<Product[]>(() => getProducts());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | OrderStatus>("All");
  const [modalOpen, setModalOpen] = useState(false);

  // Add-order form state
  const [customer, setCustomer] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [protection, setProtection] = useState<ProtectionLevel>(1.0);

  const selectedProduct = products.find((p) => p.id === productId);
  const liveLength = selectedProduct
    ? calculateLength(selectedProduct.width, selectedProduct.height, protection)
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

  function changeStatus(id: string, status: OrderStatus) {
    updateOrderStatus(id, status);
    setOrders(getOrders());
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

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
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

    addOrder({
      customer: customer.trim(),
      product: selectedProduct,
      protection,
      quantity: qty,
    });
    setOrders(getOrders());
    setModalOpen(false);
    open?.({
      type: "success",
      message: "Order added",
      description: `New order for ${selectedProduct.name} created.`,
    });
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
                          changeStatus(order.id, event.target.value as OrderStatus)
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td>{order.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="empty-orders">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Order modal */}
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

              {/* Auto-filled dimensions (read-only) */}
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

              {/* Live calculated length */}
              <div className="wm-calc-box">
                <span className="wm-calc-label">Calculated bubble wrap length</span>
                <span className="wm-calc-result">
                  {liveLength !== null ? `${liveLength} cm` : "— select a product —"}
                </span>
                <span className="wm-calc-formula">L = (2 × (W + H) × P) + 5</span>
              </div>

              <div className="wm-modal-footer">
                <button type="submit" className="wm-primary-btn">
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
