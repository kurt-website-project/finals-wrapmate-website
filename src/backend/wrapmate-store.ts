import { apiRequest } from "./api";

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

export type OrderStatus = "Pending" | "Processing" | "Completed";

export type Order = {
  id: string;
  rowId: string;
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

export function calculateLength(
  width: number,
  height: number,
  protection: number
): number {
  const value = 2 * (width + height) * protection + PACKAGING_ALLOWANCE;
  return Math.round(value * 10) / 10;
}

export function formatPeso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function getProducts(): Promise<Product[]> {
  return apiRequest<Product[]>("/api/products");
}

export function addProduct(input: {
  name: string;
  width: number;
  height: number;
  cost: number;
  price: number;
  image: string;
}): Promise<Product> {
  return apiRequest<Product>("/api/products", { method: "POST", body: input });
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
): Promise<Product> {
  return apiRequest<Product>(`/api/products/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteProduct(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/products/${id}`, {
    method: "DELETE",
  });
}

export function getOrders(): Promise<Order[]> {
  return apiRequest<Order[]>("/api/orders");
}

export function addOrder(input: {
  customer: string;
  productId: string;
  protection: ProtectionLevel;
  quantity: number;
}): Promise<Order> {
  return apiRequest<Order>("/api/orders", { method: "POST", body: input });
}

export function updateOrderStatus(
  rowId: string,
  status: OrderStatus
): Promise<Order> {
  return apiRequest<Order>(`/api/orders/${rowId}`, {
    method: "PATCH",
    body: { status },
  });
}

export function deleteOrder(rowId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/orders/${rowId}`, {
    method: "DELETE",
  });
}

export type IncomeSummary = {
  totalRevenue: number;
  totalProfit: number;
  completedOrders: number;
};

export type ProductIncome = {
  product: string;
  revenue: number;
  profit: number;
};

export type WrapUsage = {
  product: string;
  totalLength: number;
  averageLength: number;
};

export type WrapSummary = {
  totalUsed: number;
  averageLength: number;
};

export type Stats = {
  income: IncomeSummary;
  wrapSummary: WrapSummary;
  incomePerProduct: ProductIncome[];
  wrapUsage: WrapUsage[];
};

export function getStats(): Promise<Stats> {
  return apiRequest<Stats>("/api/stats");
}
