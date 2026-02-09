import express from "express";
import cors from "cors";
import { sequelize } from "./config.js";
import { Usuario } from "./models/usuario.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/usuarios/register", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validar que vengan los datos
    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: "Faltan campos obligatorios" });
    }

    // Crear el usuario
    const nuevoUsuario = await Usuario.create({
      nombre,
      apellido,
      email,
      password, 
      rol,
      categoria,
      areaId,
    });
    res.status(201).json({ mensaje: "Usuario registrado correctamente", usuario: nuevoUsuario });
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ mensaje: "Error del servidor", error: error.message });
  }
});

// Conectar a la DB y levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado a la base de datos");
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  } catch (error) {
    console.error("❌ Error al conectar a la DB:", error);
  }
});
