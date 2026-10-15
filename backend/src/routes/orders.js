import { Router } from "express";
import { supabase, nextCounter } from "../supabase.js";
import { requireAuth } from "../middleware.js";

const router = Router();

const PACKAGING_ALLOWANCE = 5;

function pad(num, size) {
  return String(num).padStart(size, "0");
}

function calculateLength(width, height, protection) {
  const value = 2 * (width + height) * protection + PACKAGING_ALLOWANCE;
  return Math.round(value * 10) / 10;
}

function mapOrder(o) {
  return {
    id: o.order_code,
    rowId: o.id,
    customer: o.customer,
    productId: o.product_id,
    productName: o.product_name,
    sku: o.sku,
    width: Number(o.width),
    height: Number(o.height),
    protection: Number(o.protection),
    length: Number(o.length),
    quantity: Number(o.quantity),
    unitCost: Number(o.unit_cost),
    unitPrice: Number(o.unit_price),
    revenue: Number(o.revenue),
    profit: Number(o.profit),
    status: o.status,
    date: (o.created_at || "").slice(0, 10),
  };
}

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    res.json(data.map(mapOrder));
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { customer, productId, protection, quantity } = req.body;
    if (!customer || !productId || !protection || !quantity) {
      return res
        .status(400)
        .json({ error: "customer, productId, protection and quantity are required." });
    }

    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!product) return res.status(404).json({ error: "Product not found." });

    const width = Number(product.width);
    const height = Number(product.height);
    const unitCost = Number(product.cost);
    const unitPrice = Number(product.price);
    const length = calculateLength(width, height, protection);
    const revenue = Math.round(unitPrice * quantity * 100) / 100;
    const profit = Math.round((unitPrice - unitCost) * quantity * 100) / 100;

    const seq = await nextCounter("order_seq");
    const orderCode = `WM-${pad(seq, 3)}`;

    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_code: orderCode,
        customer,
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        width,
        height,
        protection,
        length,
        quantity,
        unit_cost: unitCost,
        unit_price: unitPrice,
        revenue,
        profit,
        status: "Pending",
      })
      .select("*")
      .single();
    if (error) throw error;

    res.status(201).json(mapOrder(data));
  } catch (err) {
    next(err);
  }
});

router.patch("/:rowId", requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", req.params.rowId)
      .select("*")
      .single();
    if (error) throw error;
    res.json(mapOrder(data));
  } catch (err) {
    next(err);
  }
});

router.delete("/:rowId", requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", req.params.rowId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
