import express from "express";
import cors from "cors";
import "./db";
import { productsRouter } from "./routes/products";
import { settingsRouter } from "./routes/settings";
import { metrics, observeRequests } from "./metrics";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(observeRequests);

app.get("/health", (_req, res) => res.json({ status: "ok", service: "products-service" }));
app.get("/metrics", metrics);

app.use("/products", productsRouter);
app.use("/settings", settingsRouter);

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled products-service error", error);
    res.status(500).json({ error: "The products service could not process the request." });
  }
);

if (require.main === module) {
  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => {
    console.log(`products-service listening on port ${PORT}`);
  });
}
