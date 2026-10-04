import { Router } from "express";
import { InsufficientStockError, type StockReservationItem, store } from "../db";
import { requireAdmin } from "../middleware/auth";

export const productsRouter = Router();

function parseStockReservation(value: unknown): StockReservationItem[] | null {
  if (!value || typeof value !== "object") return null;

  const items = (value as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;

  const reservation = items as StockReservationItem[];
  return reservation.every(
    (item) =>
      item &&
      typeof item.id === "string" &&
      item.id.length > 0 &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
  )
    ? reservation
    : null;
}

// GET /products - list all, optional ?category= filter
productsRouter.get("/", async (req, res, next) => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  try {
    res.json(await store.listProducts(category));
  } catch (error) {
    next(error);
  }
});

// GET /products/:id
productsRouter.get("/:id", async (req, res, next) => {
  try {
    const product = await store.getProduct(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

productsRouter.post("/reserve-stock", requireAdmin, async (req, res, next) => {
  const items = parseStockReservation(req.body);
  if (!items) return res.status(400).json({ error: "Valid product quantities are required." });

  try {
    await store.reserveStock(items);
    res.status(204).send();
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
});

productsRouter.post("/release-stock", requireAdmin, async (req, res, next) => {
  const items = parseStockReservation(req.body);
  if (!items) return res.status(400).json({ error: "Valid product quantities are required." });

  try {
    await store.releaseStock(items);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /products - create (admin only)
productsRouter.post("/", requireAdmin, async (req, res, next) => {
  const { name, price } = req.body;
  if (!name || typeof price !== "number") {
    return res.status(400).json({ error: "name and numeric price are required" });
  }
  try {
    const product = await store.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// PUT /products/:id - update (admin only)
productsRouter.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const updated = await store.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /products/:id - remove (admin only)
productsRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const removed = await store.deleteProduct(req.params.id);
    if (!removed) return res.status(404).json({ error: "Product not found" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
