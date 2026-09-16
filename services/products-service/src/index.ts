import express from "express";
import cors from "cors";
import "./db";
import { productsRouter } from "./routes/products";
import { settingsRouter } from "./routes/settings";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "products-service" }));

app.use("/products", productsRouter);
app.use("/settings", settingsRouter);

if (require.main === module) {
  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => {
    console.log(`products-service listening on port ${PORT}`);
  });
}
