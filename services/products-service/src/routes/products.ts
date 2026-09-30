import { Router } from "express";
import { store } from "../db";
import { requireAdmin } from "../middleware/auth";

export const productsRouter = Router();

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
