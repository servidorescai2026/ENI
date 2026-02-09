// src/routes/areas.js
import express from "express";
import { Area } from "../database/models/area.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const areas = await Area.findAll({
      attributes: ["id", "codigo", "nombre"],
      order: [["codigo", "ASC"]],
    });
    res.json(areas);
  } catch (err) {
    console.error("Error al obtener áreas:", err);
    res.status(500).json({ mensaje: "Error al obtener áreas" });
  }
});

export default router;
