import type { NextFunction, Request, Response } from "express";
import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

const registry = new Registry();
collectDefaultMetrics({ register: registry });

const requests = new Counter({
  name: "webshop_http_requests_total",
  help: "Total HTTP requests handled by the service",
  labelNames: ["method", "path", "status"] as const,
  registers: [registry]
});

const duration = new Histogram({
  name: "webshop_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "path", "status"] as const,
  registers: [registry]
});

export function observeRequests(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/metrics") return next();

  const stop = duration.startTimer();
  res.on("finish", () => {
    const path = `${req.baseUrl}${req.route?.path || req.path}`;
    const labels = { method: req.method, path, status: String(res.statusCode) };
    requests.inc(labels);
    stop(labels);
  });
  next();
}

export async function metrics(_req: Request, res: Response) {
  res.set("Content-Type", registry.contentType);
  res.end(await registry.metrics());
}
