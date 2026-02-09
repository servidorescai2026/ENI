import { DataTypes } from "sequelize";
import { sequelize } from "../config.js";

export const Usuario = sequelize.define(
  "Usuario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM('Administrador', 'Estudiante', 'Formador'),
      defaultValue: "Estudiante",
      allowNull: false,
    },
    areaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'areas',
        key: 'id'
      }
    },
  },
  {
    tableName: "usuarios",
    timestamps: false,
  }
);
