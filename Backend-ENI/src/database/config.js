import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false, 
  }
);

// Probar conexión al iniciar
export async function conectarDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a MySQL exitosa");
  } catch (error) {
    console.error("❌ Error al conectar a la BD:", error.message);
  }
}
