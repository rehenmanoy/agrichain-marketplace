import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import pool from "./db/pool.js";
import apiRoutes from "./routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigins }));
app.use(express.json({ limit: "100kb" }));
if (!env.isTest) app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ name: "AgriChain API", status: "running" });
});

app.get("/health", async (req, res) => {
  const result = await pool.query("SELECT NOW() AS time");
  res.json({ ok: true, database: "connected", time: result.rows[0].time });
});

// Warehouse photos. File names are random and never change, so browsers may keep them a long time.
// helmet's default would stop the web app (on another origin in production) from showing them.
app.use(
  "/uploads",
  (req, res, next) => {
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(env.uploadDir, { index: false, maxAge: "30d", immutable: true }),
);

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
