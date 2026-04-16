import { DataTypes } from "sequelize";
import { sequelize } from "../config.js";
import { Usuario } from "./usuarios.js";

export const Reporte = sequelize.define(
  "Reporte",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    documento: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    regionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    regionalNombre: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    centroFormacionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    centroNombre: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fechaCreacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "reportes",
    timestamps: false,
  }
);

Reporte.belongsTo(Usuario, { foreignKey: "usuarioId" });
Usuario.hasMany(Reporte, { foreignKey: "usuarioId" });
