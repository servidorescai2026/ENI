import { DataTypes } from "sequelize";
import { sequelize } from "../config.js";

export const Archivo = sequelize.define(
  "Archivo",
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
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ruta: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false, // pdf, imagen, documento, etc.
    },
    tamaño: {
      type: DataTypes.BIGINT,
      allowNull: true, // en bytes
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'),
      defaultValue: 'pendiente',
      allowNull: false,
    },
    fechaCarga: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "archivos",
    timestamps: false,
  }
);
