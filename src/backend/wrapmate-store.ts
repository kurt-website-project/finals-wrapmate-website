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
  cost: number; // ₱ cost to the shop per unit
  price: number; // ₱ selling price per unit
  image: string; // data URL or empty
};

/** Profit per unit = selling price − cost. */
export function unitProfit(product: Pick<Product, "cost" | "price">): number {
  return Math.round((product.price - product.cost) * 100) / 100;
}

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
  unitCost: number; // ₱ snapshot of product cost at creation
  unitPrice: number; // ₱ snapshot of product selling price at creation
  revenue: number; // ₱ unitPrice * quantity
  profit: number; // ₱ (unitPrice - unitCost) * quantity
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
    { id: "p1", sku: "WM-PROD-001", name: "Phone Box", width: 16, height: 8, cost: 180, price: 320, image: "" },
    { id: "p2", sku: "WM-PROD-002", name: "Earbuds Box", width: 10, height: 6, cost: 90, price: 180, image: "" },
    { id: "p3", sku: "WM-PROD-003", name: "Charger Box", width: 12, height: 5, cost: 110, price: 200, image: "" },
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
      unitCost: 180,
      unitPrice: 320,
      revenue: 320 * 10,
      profit: (320 - 180) * 10,
      status: "Completed",
      date: "2026-10-05",
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
      unitCost: 90,
      unitPrice: 180,
      revenue: 180 * 25,
      profit: (180 - 90) * 25,
      status: "Completed",
      date: "2026-10-06",
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
      unitCost: 110,
      unitPrice: 200,
      revenue: 200 * 15,
      profit: (200 - 110) * 15,
      status: "Completed",
      date: "2026-10-07",
    },
  ];
  writeJSON(ORDERS_KEY, seededOrders);
  localStorage.setItem(ORDER_SEQ_KEY, "3");
}

/* ---------------------------------------------------------------- */
/* Migration — backfill fields added in later versions              */
/* ---------------------------------------------------------------- */

/**
 * Default money values for records created before the cost/price feature.
 * Non-zero so old data doesn't show ₱0; the user can edit products anytime.
 */
const DEFAULT_COST = 100;
const DEFAULT_PRICE = 180;

/**
 * Ensure every stored product has cost/price. Old products (saved before the
 * money fields existed) get sensible non-zero defaults, then are re-saved so
 * the upgrade only happens once. Returns the (possibly migrated) products.
 */
function migrateProducts(products: Product[]): Product[] {
  let changed = false;
  const migrated = products.map((p) => {
    const next = { ...p };
    if (typeof next.cost !== "number" || Number.isNaN(next.cost)) {
      next.cost = DEFAULT_COST;
      changed = true;
    }
    if (typeof next.price !== "number" || Number.isNaN(next.price)) {
      next.price = DEFAULT_PRICE;
      changed = true;
    }
    return next;
  });
  if (changed) writeJSON(PRODUCTS_KEY, migrated);
  return migrated;
}

/**
 * Ensure every stored order has unitCost/unitPrice/revenue/profit. Old orders
 * get values from their linked product (or defaults), then revenue/profit are
 * recomputed and re-saved once.
 */
function migrateOrders(orders: Order[], products: Product[]): Order[] {
  let changed = false;
  const migrated = orders.map((o) => {
    const next = { ...o };
    const needsMoney =
      typeof next.unitPrice !== "number" ||
      Number.isNaN(next.unitPrice) ||
      typeof next.unitCost !== "number" ||
      Number.isNaN(next.unitCost);

    if (needsMoney) {
      const product = products.find((p) => p.id === next.productId);
      next.unitCost = product?.cost ?? DEFAULT_COST;
      next.unitPrice = product?.price ?? DEFAULT_PRICE;
      changed = true;
    }

    const expectedRevenue =
      Math.round(next.unitPrice * next.quantity * 100) / 100;
    const expectedProfit =
      Math.round((next.unitPrice - next.unitCost) * next.quantity * 100) / 100;

    if (next.revenue !== expectedRevenue || next.profit !== expectedProfit) {
      next.revenue = expectedRevenue;
      next.profit = expectedProfit;
      changed = true;
    }
    return next;
  });
  if (changed) writeJSON(ORDERS_KEY, migrated);
  return migrated;
}

/* ---------------------------------------------------------------- */
/* Products API                                                      */
/* ---------------------------------------------------------------- */

export function getProducts(): Product[] {
  seedIfEmpty();
  return migrateProducts(readJSON<Product[]>(PRODUCTS_KEY, []));
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
  cost: number;
  price: number;
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
    cost: input.cost,
    price: input.price,
    image: input.image,
  };

  products.push(product);
  writeJSON(PRODUCTS_KEY, products);
  return product;
}

export function updateProduct(
  id: string,
  input: {
    name: string;
    width: number;
    height: number;
    cost: number;
    price: number;
    image: string;
  }
): Product | null {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  // Keep the original id and SKU; update the editable fields.
  products[index] = {
    ...products[index],
    name: input.name,
    width: input.width,
    height: input.height,
    cost: input.cost,
    price: input.price,
    image: input.image,
  };
  writeJSON(PRODUCTS_KEY, products);
  return products[index];
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
  const products = migrateProducts(readJSON<Product[]>(PRODUCTS_KEY, []));
  return migrateOrders(readJSON<Order[]>(ORDERS_KEY, []), products);
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

  const revenue = Math.round(input.product.price * input.quantity * 100) / 100;
  const profit =
    Math.round((input.product.price - input.product.cost) * input.quantity * 100) /
    100;

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
    unitCost: input.product.cost,
    unitPrice: input.product.price,
    revenue,
    profit,
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

/* ---------------------------------------------------------------- */
/* Income analytics (Completed orders only)                          */
/* ---------------------------------------------------------------- */

/** Format a number as Philippine Peso, e.g. ₱1,234.50 */
export function formatPeso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export type IncomeSummary = {
  totalRevenue: number;
  totalProfit: number;
  completedOrders: number;
};

/** Totals across COMPLETED orders only (realized income). */
export function getIncomeSummary(): IncomeSummary {
  const completed = getOrders().filter((o) => o.status === "Completed");
  const totalRevenue = completed.reduce((s, o) => s + o.revenue, 0);
  const totalProfit = completed.reduce((s, o) => s + o.profit, 0);
  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    completedOrders: completed.length,
  };
}

export type ProductIncome = {
  product: string;
  revenue: number;
  profit: number;
};

/** Revenue + profit grouped per product, from COMPLETED orders only. */
export function getIncomePerProduct(): ProductIncome[] {
  const completed = getOrders().filter((o) => o.status === "Completed");
  const map = new Map<string, ProductIncome>();

  for (const o of completed) {
    const existing = map.get(o.productName) ?? {
      product: o.productName,
      revenue: 0,
      profit: 0,
    };
    existing.revenue += o.revenue;
    existing.profit += o.profit;
    map.set(o.productName, existing);
  }

  return Array.from(map.values()).map((p) => ({
    product: p.product,
    revenue: Math.round(p.revenue * 100) / 100,
    profit: Math.round(p.profit * 100) / 100,
  }));
}
