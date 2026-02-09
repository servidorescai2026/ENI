import { DataTypes } from "sequelize";
import { sequelize } from "../config.js";
import { Usuario } from "./usuarios.js";
import { Area } from "./area.js";

export const Notificacion = sequelize.define(
  "Notificacion",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    areaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    asunto: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    archivo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    archivos: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON array de rutas de archivos",
    },
    leida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    creadaEn: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "notificaciones",
    timestamps: false,
  }
);

// Relaciones (opcionales pero útiles)
Notificacion.belongsTo(Usuario, { foreignKey: "usuarioId" });
Notificacion.belongsTo(Area, { foreignKey: "areaId" });
