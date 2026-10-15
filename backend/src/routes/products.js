import { Router } from "express";
import { supabase, nextCounter } from "../supabase.js";
import { requireAuth } from "../middleware.js";

const router = Router();

function pad(num, size) {
  return String(num).padStart(size, "0");
}

function mapProduct(p) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    width: Number(p.width),
    height: Number(p.height),
    cost: Number(p.cost),
    price: Number(p.price),
    image: p.image_url || "",
  };
}

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    res.json(data.map(mapProduct));
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { name, width, height, cost, price, image } = req.body;
    if (!name || width == null || height == null) {
      return res.status(400).json({ error: "Name, width and height are required." });
    }

    const seq = await nextCounter("product_seq");
    const sku = `WM-PROD-${pad(seq, 3)}`;

    const { data, error } = await supabase
      .from("products")
      .insert({
        sku,
        name,
        width,
        height,
        cost: cost ?? 0,
        price: price ?? 0,
        image_url: image ?? "",
      })
      .select("*")
      .single();
    if (error) throw error;

    res.status(201).json(mapProduct(data));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { name, width, height, cost, price, image } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (width !== undefined) update.width = width;
    if (height !== undefined) update.height = height;
    if (cost !== undefined) update.cost = cost;
    if (price !== undefined) update.price = price;
    if (image !== undefined) update.image_url = image;

    const { data, error } = await supabase
      .from("products")
      .update(update)
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) throw error;

    res.json(mapProduct(data));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
