import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

import pg from "pg";

const dialect =
  process.env.DB_DIALECT ||
  (process.env.DATABASE_URL?.startsWith("mysql") ? "mysql" : "postgres");

const isProduction = process.env.NODE_ENV === "production";
const sslRequired =
  process.env.DB_SSL === "true" ||
  (isProduction && dialect === "postgres") ||
  Boolean(process.env.DATABASE_URL);

// Supabase usa certificados autofirmados en el pooler (aws-X-pooler.supabase.com)
// Por tanto, rejectUnauthorized DEBE ser false a menos que se configure explícitamente como true.
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === "true";

// En Sequelize con PostgreSQL (librería pg), la configuración de SSL para Supabase
// debe tener ssl: { require: true, rejectUnauthorized: false }
const dialectOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
};

// Limpiar cualquier parámetro de sslmode en la URL que pueda sobrescribir dialectOptions
const cleanDatabaseUrl = (process.env.DATABASE_URL || "").replace(/[?&]sslmode=[^&]+/g, "");

export const sequelize = cleanDatabaseUrl
  ? new Sequelize(cleanDatabaseUrl, {
      dialect: "postgres",
      dialectModule: pg,
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
      process.env.DB_NAME || "postgres",
      process.env.DB_USER || "postgres",
      process.env.DB_PASS || "",
      {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        dialect: "postgres",
        dialectModule: pg,
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
