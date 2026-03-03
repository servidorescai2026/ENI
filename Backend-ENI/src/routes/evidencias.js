import express from "express";
import multer from "multer";
import { uploadFile } from "../services/googleDriveService.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/subir", upload.single("archivo"), async (req, res) => {
  try {
    const result = await uploadFile(req.file);

    res.json({
      mensaje: "Archivo subido correctamente",
      driveId: result.id,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error subiendo archivo" });
  }
});

export default router;
