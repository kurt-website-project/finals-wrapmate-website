import { useRef, useState } from "react";
import { useNotification } from "@refinedev/core";
import { Plus, X, Trash2, ImageIcon } from "lucide-react";
import {
  getProducts,
  addProduct,
  deleteProduct,
  generateProductSku,
  calculateLength,
  PROTECTION_LEVELS,
  type Product,
} from "@/backend/wrapmate-store";

export default function Products() {
  const { open } = useNotification();
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  });

  // Form state
  const [name, setName] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [image, setImage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const w = parseFloat(width);
  const h = parseFloat(height);
  const dimsValid = !Number.isNaN(w) && !Number.isNaN(h) && w > 0 && h > 0;
  const previewSku = generateProductSku();

  function resetForm() {
    setName("");
    setWidth("");
    setHeight("");
    setImage("");
  }

  function openModal() {
    resetForm();
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      open?.({
        type: "error",
        message: "Invalid file",
        description: "Please choose an image file.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result ?? ""));
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      open?.({ type: "error", message: "Name required", description: "Please enter a product name." });
      return;
    }
    if (!dimsValid) {
      open?.({
        type: "error",
        message: "Invalid dimensions",
        description: "Width and height must be positive numbers.",
      });
      return;
    }

    addProduct({ name: name.trim(), width: w, height: h, image });
    setProducts(getProducts());
    setModalOpen(false);
    open?.({
      type: "success",
      message: "Product added",
      description: `${name.trim()} has been saved.`,
    });
  }

  function handleDelete(id: string, productName: string) {
    deleteProduct(id);
    setProducts(getProducts());
    open?.({
      type: "success",
      message: "Product deleted",
      description: `${productName} has been removed.`,
    });
  }

  return (
    <div className="wm-page">
      <div className="wm-page-header">
        <div>
          <p className="dashboard-eyebrow">Product Management</p>
          <h1>Products</h1>
          <p className="wm-page-sub">
            Manage product records and box dimensions used to calculate bubble
            wrap length.
          </p>
        </div>

        <button type="button" className="wm-primary-btn" onClick={openModal}>
          <Plus />
          Add Product
        </button>
      </div>

      <div className="wm-card">
        <div className="orders-toolbar">
          <input
            type="text"
            placeholder="Search product name or SKU..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Width (W)</th>
                <th>Height (H)</th>
                <th>Wrap Length Preview</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="wm-product-thumb"
                        />
                      ) : (
                        <div className="wm-product-thumb wm-product-thumb-empty">
                          <ImageIcon />
                        </div>
                      )}
                    </td>
                    <td><strong>{product.sku}</strong></td>
                    <td>{product.name}</td>
                    <td>{product.width} cm</td>
                    <td>{product.height} cm</td>
                    <td>
                      <div className="wm-preview-chips">
                        {PROTECTION_LEVELS.map((p) => (
                          <span key={p} className="wm-preview-chip">
                            P{p.toFixed(1)}:{" "}
                            {calculateLength(product.width, product.height, p)} cm
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="wm-icon-btn wm-danger"
                        onClick={() => handleDelete(product.id, product.name)}
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="empty-orders">
                    {search.trim()
                      ? "No products match your search."
                      : 'No products yet. Click "Add Product" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product modal */}
      {modalOpen && (
        <div className="wm-modal-overlay" onClick={closeModal}>
          <div
            className="wm-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="wm-modal-header">
              <h2>Add New Product</h2>
              <button
                type="button"
                className="wm-icon-btn"
                onClick={closeModal}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSave} className="wm-modal-body">
              <p className="wm-modal-note">
                For box-shaped items only (square or rectangular). Enter the box
                Width and Height in centimeters.
              </p>

              <label className="wm-field">
                <span>Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Phone Box"
                  autoFocus
                />
              </label>

              <div className="wm-field-row">
                <label className="wm-field">
                  <span>Width (W) — cm</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="0"
                  />
                </label>
                <label className="wm-field">
                  <span>Height (H) — cm</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="0"
                  />
                </label>
              </div>

              <label className="wm-field">
                <span>SKU (auto-generated)</span>
                <input type="text" value={previewSku} readOnly disabled />
              </label>

              <div className="wm-field">
                <span>Product Image</span>
                <div className="wm-upload-row">
                  {image ? (
                    <img src={image} alt="Preview" className="wm-upload-preview" />
                  ) : (
                    <div className="wm-upload-preview wm-upload-preview-empty">
                      No Image
                    </div>
                  )}
                  <button
                    type="button"
                    className="wm-secondary-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </button>
                  <span className="wm-upload-hint">
                    {image ? "Image selected" : "No file chosen"}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="wm-file-input"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              {/* Live wrap-size preview */}
              {dimsValid && (
                <div className="wm-calc-box">
                  <span className="wm-calc-label">
                    Bubble wrap length preview
                  </span>
                  <div className="wm-preview-chips">
                    {PROTECTION_LEVELS.map((p) => (
                      <span key={p} className="wm-preview-chip">
                        P{p.toFixed(1)}: {calculateLength(w, h, p)} cm
                      </span>
                    ))}
                  </div>
                  <span className="wm-calc-formula">
                    L = (2 × (W + H) × P) + 5
                  </span>
                </div>
              )}

              <div className="wm-modal-footer">
                <button type="submit" className="wm-primary-btn">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
