import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const dialect =
  process.env.DB_DIALECT ||
  (process.env.DATABASE_URL?.startsWith("postgres") ? "postgres" : "mysql");

const isProduction = process.env.NODE_ENV === "production";
const sslRequired =
  process.env.DB_SSL === "true" || (isProduction && dialect === "postgres");

const dialectOptions = sslRequired
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true",
      },
    }
  : {};

export const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect,
      dialectOptions,
      logging: process.env.DB_LOGGING === "true" ? console.log : false,
      pool: {
        max: Number(process.env.DB_POOL_MAX) || 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    })
  : new Sequelize(
      process.env.DB_NAME || "eni_db",
      process.env.DB_USER || "root",
      process.env.DB_PASS || "",
      {
        host: process.env.DB_HOST || "localhost",
        port:
          Number(process.env.DB_PORT) ||
          (dialect === "postgres" ? 5432 : 3306),
        dialect,
        dialectOptions,
        logging: process.env.DB_LOGGING === "true" ? console.log : false,
        pool: {
          max: Number(process.env.DB_POOL_MAX) || 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );

// Probar conexión al iniciar
export async function conectarDB() {
  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión a la base de datos (${dialect}) exitosa`);
  } catch (error) {
    console.error("❌ Error al conectar a la BD:", error.message);
  }
}
