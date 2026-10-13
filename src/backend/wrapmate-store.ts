/**
 * WrapMate prototype data store (localStorage).
 *
 * Frontend-only persistence for Products and Orders — no backend. This keeps
 * the bubble-wrap packaging data between page refreshes so the app behaves
 * like a real system for the prototype/demo.
 *
 * Core formula (from the capstone proposal):
 *   L = (2 * (W + H) * P) + A
 * where W = width (cm), H = height (cm), P = protection multiplier
 * (1.0 / 2.0 / 3.0), A = 5 cm packaging allowance.
 */

/**
 * Dispatched on `window` after the user's profile changes (e.g. saving on the
 * Settings page) so components like the sidebar footer can re-read the updated
 * identity immediately without a full page reload.
 */
export const IDENTITY_UPDATED_EVENT = "wrapmate:identity-updated";

export const PACKAGING_ALLOWANCE = 5; // A (cm)
export const PROTECTION_LEVELS = [1.0, 2.0, 3.0] as const;
export type ProtectionLevel = (typeof PROTECTION_LEVELS)[number];

export type Product = {
  id: string;
  sku: string; // auto-generated, e.g. WM-PROD-001
  name: string;
  width: number; // W (cm)
  height: number; // H (cm)
  image: string; // data URL or empty
};

export type OrderStatus = "Pending" | "Processing" | "Completed";

export type Order = {
  id: string; // e.g. WM-001
  customer: string;
  productId: string;
  productName: string;
  sku: string;
  width: number; // snapshot of product W at creation
  height: number; // snapshot of product H at creation
  protection: ProtectionLevel;
  length: number; // calculated L (cm)
  quantity: number;
  status: OrderStatus;
  date: string; // YYYY-MM-DD
};

const PRODUCTS_KEY = "wrapmate_products";
const ORDERS_KEY = "wrapmate_orders";
const PRODUCT_SEQ_KEY = "wrapmate_product_seq";
const ORDER_SEQ_KEY = "wrapmate_order_seq";

/* ---------------------------------------------------------------- */
/* Calculation                                                       */
/* ---------------------------------------------------------------- */

/** L = (2 * (W + H) * P) + A */
export function calculateLength(
  width: number,
  height: number,
  protection: number
): number {
  const value = 2 * (width + height) * protection + PACKAGING_ALLOWANCE;
  // Round to 1 decimal place for display.
  return Math.round(value * 10) / 10;
}

/* ---------------------------------------------------------------- */
/* Low-level helpers                                                 */
/* ---------------------------------------------------------------- */

function readJSON<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function nextSequence(key: string): number {
  const current = Number(localStorage.getItem(key) ?? "0");
  const next = current + 1;
  localStorage.setItem(key, String(next));
  return next;
}

function pad(num: number, size: number): string {
  return String(num).padStart(size, "0");
}

/* ---------------------------------------------------------------- */
/* Seed data (first run)                                             */
/* ---------------------------------------------------------------- */

function seedIfEmpty() {
  if (localStorage.getItem(PRODUCTS_KEY) && localStorage.getItem(ORDERS_KEY)) {
    return;
  }

  // Seed a few sample BOX-SHAPED products only (square/rectangular boxes).
  // No irregular/circular items — the perimeter formula is for boxes.
  const seededProducts: Product[] = [
    { id: "p1", sku: "WM-PROD-001", name: "Phone Box", width: 16, height: 8, image: "" },
    { id: "p2", sku: "WM-PROD-002", name: "Earbuds Box", width: 10, height: 6, image: "" },
    { id: "p3", sku: "WM-PROD-003", name: "Charger Box", width: 12, height: 5, image: "" },
  ];
  writeJSON(PRODUCTS_KEY, seededProducts);
  localStorage.setItem(PRODUCT_SEQ_KEY, "3");

  // Seed matching sample orders with computed lengths.
  const seededOrders: Order[] = [
    {
      id: "WM-001",
      customer: "Sample Customer 1",
      productId: "p1",
      productName: "Phone Box",
      sku: "WM-PROD-001",
      width: 16,
      height: 8,
      protection: 1.0,
      length: calculateLength(16, 8, 1.0),
      quantity: 10,
      status: "Pending",
      date: "2026-10-07",
    },
    {
      id: "WM-002",
      customer: "Sample Customer 2",
      productId: "p2",
      productName: "Earbuds Box",
      sku: "WM-PROD-002",
      width: 10,
      height: 6,
      protection: 2.0,
      length: calculateLength(10, 6, 2.0),
      quantity: 25,
      status: "Processing",
      date: "2026-10-07",
    },
    {
      id: "WM-003",
      customer: "Sample Customer 3",
      productId: "p3",
      productName: "Charger Box",
      sku: "WM-PROD-003",
      width: 12,
      height: 5,
      protection: 3.0,
      length: calculateLength(12, 5, 3.0),
      quantity: 15,
      status: "Completed",
      date: "2026-10-06",
    },
  ];
  writeJSON(ORDERS_KEY, seededOrders);
  localStorage.setItem(ORDER_SEQ_KEY, "3");
}

/* ---------------------------------------------------------------- */
/* Products API                                                      */
/* ---------------------------------------------------------------- */

export function getProducts(): Product[] {
  seedIfEmpty();
  return readJSON<Product[]>(PRODUCTS_KEY, []);
}

export function generateProductSku(): string {
  // Peek at the next sequence without consuming it (for live preview).
  const current = Number(localStorage.getItem(PRODUCT_SEQ_KEY) ?? "0");
  return `WM-PROD-${pad(current + 1, 3)}`;
}

export function addProduct(input: {
  name: string;
  width: number;
  height: number;
  image: string;
}): Product {
  seedIfEmpty();
  const products = getProducts();
  const seq = nextSequence(PRODUCT_SEQ_KEY);

  const product: Product = {
    id: `p-${Date.now()}`,
    sku: `WM-PROD-${pad(seq, 3)}`,
    name: input.name,
    width: input.width,
    height: input.height,
    image: input.image,
  };

  products.push(product);
  writeJSON(PRODUCTS_KEY, products);
  return product;
}

export function deleteProduct(id: string) {
  const products = getProducts().filter((p) => p.id !== id);
  writeJSON(PRODUCTS_KEY, products);
}

/* ---------------------------------------------------------------- */
/* Orders API                                                        */
/* ---------------------------------------------------------------- */

export function getOrders(): Order[] {
  seedIfEmpty();
  return readJSON<Order[]>(ORDERS_KEY, []);
}

export function addOrder(input: {
  customer: string;
  product: Product;
  protection: ProtectionLevel;
  quantity: number;
}): Order {
  seedIfEmpty();
  const orders = getOrders();
  const seq = nextSequence(ORDER_SEQ_KEY);

  const order: Order = {
    id: `WM-${pad(seq, 3)}`,
    customer: input.customer,
    productId: input.product.id,
    productName: input.product.name,
    sku: input.product.sku,
    width: input.product.width,
    height: input.product.height,
    protection: input.protection,
    length: calculateLength(
      input.product.width,
      input.product.height,
      input.protection
    ),
    quantity: input.quantity,
    status: "Pending",
    date: new Date().toISOString().slice(0, 10),
  };

  orders.push(order);
  writeJSON(ORDERS_KEY, orders);
  return order;
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  const orders = getOrders().map((o) =>
    o.id === id ? { ...o, status } : o
  );
  writeJSON(ORDERS_KEY, orders);
}

export function deleteOrder(id: string) {
  const orders = getOrders().filter((o) => o.id !== id);
  writeJSON(ORDERS_KEY, orders);
}
