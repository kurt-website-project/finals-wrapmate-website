import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireAuth } from "../middleware.js";

const router = Router();

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const { data: orders, error } = await supabase.from("orders").select("*");
    if (error) throw error;

    const completed = orders.filter((o) => o.status === "Completed");

    const income = {
      totalRevenue: round2(sum(completed, "revenue")),
      totalProfit: round2(sum(completed, "profit")),
      completedOrders: completed.length,
    };

    const wrapSummary = {
      totalUsed: round1(
        completed.reduce((s, o) => s + Number(o.length) * Number(o.quantity), 0)
      ),
      averageLength:
        completed.length > 0
          ? round1(
              completed.reduce((s, o) => s + Number(o.length), 0) /
                completed.length
            )
          : 0,
    };

    const perProductMap = new Map();
    for (const o of completed) {
      const key = o.product_name;
      const e = perProductMap.get(key) ?? {
        product: key,
        revenue: 0,
        profit: 0,
        totalLength: 0,
        lengthSum: 0,
        orders: 0,
      };
      e.revenue += Number(o.revenue);
      e.profit += Number(o.profit);
      e.totalLength += Number(o.length) * Number(o.quantity);
      e.lengthSum += Number(o.length);
      e.orders += 1;
      perProductMap.set(key, e);
    }

    const incomePerProduct = [];
    const wrapUsage = [];
    for (const e of perProductMap.values()) {
      incomePerProduct.push({
        product: e.product,
        revenue: round2(e.revenue),
        profit: round2(e.profit),
      });
      wrapUsage.push({
        product: e.product,
        totalLength: round1(e.totalLength),
        averageLength: e.orders > 0 ? round1(e.lengthSum / e.orders) : 0,
      });
    }

    res.json({ income, wrapSummary, incomePerProduct, wrapUsage });
  } catch (err) {
    next(err);
  }
});

function sum(arr, key) {
  return arr.reduce((s, o) => s + Number(o[key]), 0);
}
function round1(n) {
  return Math.round(n * 10) / 10;
}
function round2(n) {
  return Math.round(n * 100) / 100;
}

export default router;
