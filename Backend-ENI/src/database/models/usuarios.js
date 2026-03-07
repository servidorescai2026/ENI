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
    documento: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(150),
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM('Administrador', 'Formador', 'Instructor'),
      defaultValue: "Formador",
      allowNull: true,
    },
    areaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'areas',
        key: 'id'
      }
    },
    regionalId: {
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
    redConocimiento: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
  },
  {
    tableName: "usuarios",
    timestamps: false,
  }
);
