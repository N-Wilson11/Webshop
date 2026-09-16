import { Router } from "express";
import { store } from "../db";
import { requireAdmin } from "../middleware/auth";

export const productsRouter = Router();

// GET /products - list all, optional ?category= filter
productsRouter.get("/", (req, res) => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  res.json(store.listProducts(category));
});

// GET /products/:id
productsRouter.get("/:id", (req, res) => {
  const product = store.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// POST /products - create (admin only)
productsRouter.post("/", requireAdmin, (req, res) => {
  const { name, price } = req.body;
  if (!name || typeof price !== "number") {
    return res.status(400).json({ error: "name and numeric price are required" });
  }
  const product = store.createProduct(req.body);
  res.status(201).json(product);
});

// PUT /products/:id - update (admin only)
productsRouter.put("/:id", requireAdmin, (req, res) => {
  const updated = store.updateProduct(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Product not found" });
  res.json(updated);
});

// DELETE /products/:id - remove (admin only)
productsRouter.delete("/:id", requireAdmin, (req, res) => {
  const removed = store.deleteProduct(req.params.id);
  if (!removed) return res.status(404).json({ error: "Product not found" });
  res.status(204).send();
});
