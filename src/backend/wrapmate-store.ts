export const IDENTITY_UPDATED_EVENT = "wrapmate:identity-updated";

export const PACKAGING_ALLOWANCE = 5;
export const PROTECTION_LEVELS = [1.0, 2.0, 3.0] as const;
export type ProtectionLevel = (typeof PROTECTION_LEVELS)[number];

export type Product = {
  id: string;
  sku: string;
  name: string;
  width: number;
  height: number;
  cost: number;
  price: number;
  image: string;
};

export function unitProfit(product: Pick<Product, "cost" | "price">): number {
  return Math.round((product.price - product.cost) * 100) / 100;
}

export type OrderStatus = "Pending" | "Processing" | "Completed";

export type Order = {
  id: string;
  customer: string;
  productId: string;
  productName: string;
  sku: string;
  width: number;
  height: number;
  protection: ProtectionLevel;
  length: number;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  revenue: number;
  profit: number;
  status: OrderStatus;
  date: string;
};

const PRODUCTS_KEY = "wrapmate_products";
const ORDERS_KEY = "wrapmate_orders";
const PRODUCT_SEQ_KEY = "wrapmate_product_seq";
const ORDER_SEQ_KEY = "wrapmate_order_seq";

export function calculateLength(
  width: number,
  height: number,
  protection: number
): number {
  const value = 2 * (width + height) * protection + PACKAGING_ALLOWANCE;
  return Math.round(value * 10) / 10;
}

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

function seedIfEmpty() {
  if (!localStorage.getItem(PRODUCTS_KEY)) {
    writeJSON(PRODUCTS_KEY, []);
    localStorage.setItem(PRODUCT_SEQ_KEY, "0");
  }
  if (!localStorage.getItem(ORDERS_KEY)) {
    writeJSON(ORDERS_KEY, []);
    localStorage.setItem(ORDER_SEQ_KEY, "0");
  }
}

const DEFAULT_COST = 100;
const DEFAULT_PRICE = 180;

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

export function getProducts(): Product[] {
  seedIfEmpty();
  return migrateProducts(readJSON<Product[]>(PRODUCTS_KEY, []));
}

export function generateProductSku(): string {
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

export type WrapUsage = {
  product: string;
  totalLength: number;
  averageLength: number;
};

export function getWrapUsagePerProduct(): WrapUsage[] {
  const completed = getOrders().filter((o) => o.status === "Completed");
  const map = new Map<
    string,
    { product: string; total: number; lengthSum: number; orders: number }
  >();

  for (const o of completed) {
    const existing = map.get(o.productName) ?? {
      product: o.productName,
      total: 0,
      lengthSum: 0,
      orders: 0,
    };
    existing.total += o.length * o.quantity;
    existing.lengthSum += o.length;
    existing.orders += 1;
    map.set(o.productName, existing);
  }

  return Array.from(map.values()).map((p) => ({
    product: p.product,
    totalLength: Math.round(p.total * 10) / 10,
    averageLength:
      p.orders > 0 ? Math.round((p.lengthSum / p.orders) * 10) / 10 : 0,
  }));
}

export type WrapSummary = {
  totalUsed: number;
  averageLength: number;
};

export function getWrapSummary(): WrapSummary {
  const completed = getOrders().filter((o) => o.status === "Completed");
  const totalUsed = completed.reduce((s, o) => s + o.length * o.quantity, 0);
  const avg =
    completed.length > 0
      ? completed.reduce((s, o) => s + o.length, 0) / completed.length
      : 0;
  return {
    totalUsed: Math.round(totalUsed * 10) / 10,
    averageLength: Math.round(avg * 10) / 10,
  };
}
