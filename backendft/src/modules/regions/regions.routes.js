import express from "express";
import pool from "../../db/pool.js";

const router = express.Router();

// Public: the register form needs the list of regions
router.get("/", async (req, res) => {
  const result = await pool.query("SELECT id, name FROM regions ORDER BY name");
  res.json(result.rows);
});

export default router;
